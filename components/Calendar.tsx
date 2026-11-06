"use client";
import { useMemo, useState } from "react";

// Calendario por noches. "pick": el visitante elige entrada y salida y ve si hay noches ocupadas.
// "edit": quien publica marca o libera noches (toca el primer día y luego el último; un solo día, tócalo dos veces).
const pad = (n: number) => String(n).padStart(2, "0");
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseYmd = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (s: string, n: number) => { const d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); };
const MONTHS_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DOW_ES = ["L", "M", "M", "J", "V", "S", "D"];
const DOW_EN = ["M", "T", "W", "T", "F", "S", "S"];
const MAX_MONTHS = 18;

/** Noches entre entrada y salida (salida no incluida). */
export function nightsBetween(from: string, to: string): string[] {
  const out: string[] = []; let d = from;
  while (d < to && out.length < 400) { out.push(d); d = addDays(d, 1); }
  return out;
}

type PickProps = { mode: "pick"; blocked: string[]; from: string | null; to: string | null; onChange: (from: string | null, to: string | null) => void; lang?: "es" | "en" };
type EditProps = { mode: "edit"; blocked: string[]; onChange: (next: string[]) => void; lang?: "es" | "en" };

export default function Calendar(props: PickProps | EditProps) {
  const en = props.lang === "en";
  const today = ymd(new Date());
  const [offset, setOffset] = useState(0);
  const [anchor, setAnchor] = useState<string | null>(null);
  const blocked = useMemo(() => new Set(props.blocked), [props.blocked]);

  const first = new Date(); first.setDate(1); first.setMonth(first.getMonth() + offset);
  const year = first.getFullYear(), month = first.getMonth();
  const lead = (first.getDay() + 6) % 7; // semana empieza en lunes
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => `${year}-${pad(month + 1)}-${pad(i + 1)}`)];

  function click(day: string) {
    if (day < today) return;
    if (props.mode === "pick") {
      const { from, to } = props;
      if (!from || (from && to)) { if (!blocked.has(day)) props.onChange(day, null); return; }
      if (day <= from) { if (!blocked.has(day)) props.onChange(day, null); return; }
      props.onChange(from, day);
      return;
    }
    if (!anchor) { setAnchor(day); return; }
    const [a, b] = anchor <= day ? [anchor, day] : [day, anchor];
    const makeBlocked = !blocked.has(anchor);
    const next = new Set(props.blocked);
    for (let d = a; d <= b; d = addDays(d, 1)) { if (d < today) continue; if (makeBlocked) next.add(d); else next.delete(d); }
    setAnchor(null);
    props.onChange([...next].sort());
  }

  const sel = props.mode === "pick" ? props : null;
  const inRange = (d: string) => Boolean(sel?.from && sel?.to && d >= sel.from && d < sel.to);

  return (
    <div className="cal" role="group" aria-label={en ? "Availability calendar" : "Calendario de disponibilidad"}>
      <div className="cal-head">
        <button type="button" className="cal-nav" onClick={() => setOffset((o) => Math.max(0, o - 1))} disabled={offset === 0} aria-label={en ? "Previous month" : "Mes anterior"}>‹</button>
        <strong>{(en ? MONTHS_EN : MONTHS_ES)[month]} {year}</strong>
        <button type="button" className="cal-nav" onClick={() => setOffset((o) => Math.min(MAX_MONTHS, o + 1))} disabled={offset >= MAX_MONTHS} aria-label={en ? "Next month" : "Mes siguiente"}>›</button>
      </div>
      <div className="cal-grid">
        {(en ? DOW_EN : DOW_ES).map((d, i) => <span key={i} className="cal-dow">{d}</span>)}
        {cells.map((day, i) => {
          if (!day) return <span key={`e${i}`} />;
          const past = day < today, isB = blocked.has(day);
          const cls = ["cal-day", past && "is-past", isB && "is-blocked", day === today && "is-today",
            (sel?.from === day || sel?.to === day || anchor === day) && "is-sel", inRange(day) && "is-in-range"].filter(Boolean).join(" ");
          const disabled = past || (props.mode === "pick" && isB && !(sel?.from && !sel.to && day > sel.from));
          return (
            <button key={day} type="button" className={cls} disabled={disabled} onClick={() => click(day)}
              aria-label={`${day}${isB ? (en ? " occupied" : " ocupado") : ""}`} aria-pressed={props.mode === "edit" ? isB : undefined}>
              {Number(day.slice(8))}
            </button>
          );
        })}
      </div>
      <p className="cal-legend small muted">
        <span className="cal-key cal-key-free" /> {en ? "Free" : "Libre"} <span className="cal-key cal-key-busy" /> {en ? "Occupied" : "Ocupado"}
        {props.mode === "edit" && <> · {anchor ? (en ? "Now tap the last day." : "Ahora toca el último día.") : (en ? "Tap the first day, then the last one." : "Toca el primer día y luego el último.")}{anchor && <button type="button" className="linklike small" onClick={() => setAnchor(null)}> {en ? "Cancel" : "Cancelar"}</button>}</>}
      </p>
    </div>
  );
}
