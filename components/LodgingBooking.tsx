"use client";
import { useMemo, useState } from "react";
import Calendar, { nightsBetween, parseYmd } from "./Calendar";
import { useT } from "./LangProvider";

/** Elegir fechas y personas, ver si hay noches ocupadas y preguntar disponibilidad por WhatsApp con el mensaje ya escrito. */
export default function LodgingBooking({ slug, title, phone, blocked, maxGuests, minNights, lang = "es" }: {
  slug: string; title: string; phone: string; blocked: string[]; maxGuests: number | null; minNights: number | null; lang?: "es" | "en";
}) {
  const t = useT();
  const en = lang === "en";
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [guests, setGuests] = useState(Math.min(2, maxGuests ?? 2));
  const set = useMemo(() => new Set(blocked), [blocked]);

  const nights = from && to ? nightsBetween(from, to) : [];
  const busy = nights.filter((d) => set.has(d));
  const tooShort = Boolean(minNights && nights.length && nights.length < minNights);
  const fmt = (s: string) => parseYmd(s).toLocaleDateString(en ? "en-US" : "es-MX", { day: "numeric", month: "long" });
  const people = en ? `${guests} ${guests === 1 ? "guest" : "guests"}` : `${guests} ${guests === 1 ? "persona" : "personas"}`;

  const text = from && to
    ? en ? `Hi, I saw "${title}" on Inmuebles Pátzcuaro. Do you have availability from ${fmt(from)} to ${fmt(to)} (${nights.length} nights) for ${people}?`
         : `Hola, vi "${title}" en Inmuebles Pátzcuaro. ¿Tienen disponibilidad del ${fmt(from)} al ${fmt(to)} (${nights.length} noches) para ${people}?`
    : en ? `Hi, I saw "${title}" on Inmuebles Pátzcuaro and I would like to ask about availability.`
         : `Hola, vi "${title}" en Inmuebles Pátzcuaro y quisiera consultar disponibilidad.`;
  const href = `https://wa.me/52${phone}?text=${encodeURIComponent(text)}`;

  function track() {
    try {
      const data = JSON.stringify({ slug });
      if (navigator.sendBeacon) navigator.sendBeacon("/api/track", new Blob([data], { type: "application/json" }));
      else fetch("/api/track", { method: "POST", body: data, keepalive: true, headers: { "content-type": "application/json" } });
    } catch {}
  }

  return (
    <div className="book-box">
      <strong>{t("Revisa disponibilidad", "Check availability")}</strong>
      <Calendar mode="pick" blocked={blocked} from={from} to={to} onChange={(f, x) => { setFrom(f); setTo(x); }} lang={lang} />
      <label>{t("Personas", "Guests")}
        <select value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
          {Array.from({ length: Math.min(maxGuests ?? 10, 30) }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>
      {from && !to && <p className="book-status muted">{t(`Entrada: ${fmt(from)}. Ahora elige el día de salida.`, `Check-in: ${fmt(from)}. Now pick the check-out day.`)}</p>}
      {from && to && !busy.length && <p className="book-status ok">{t(`Parece libre: ${nights.length} ${nights.length === 1 ? "noche" : "noches"} (${fmt(from)} al ${fmt(to)}).`, `Looks free: ${nights.length} ${nights.length === 1 ? "night" : "nights"} (${fmt(from)} to ${fmt(to)}).`)}</p>}
      {from && to && busy.length > 0 && <p className="book-status bad">{t(`Hay ${busy.length} ${busy.length === 1 ? "noche ocupada" : "noches ocupadas"} en esas fechas. Prueba otras o pregunta de todos modos.`, `${busy.length} of those nights ${busy.length === 1 ? "is" : "are"} occupied. Try other dates or ask anyway.`)}</p>}
      {tooShort && <p className="book-status bad">{t(`Este lugar pide mínimo ${minNights} noches.`, `This place asks for at least ${minNights} nights.`)}</p>}
      <a className="btn btn-wa" href={href} target="_blank" rel="noopener noreferrer nofollow" onClick={track}>
        {from && to ? t("Preguntar por estas fechas en WhatsApp", "Ask about these dates on WhatsApp") : t("Consultar disponibilidad por WhatsApp", "Ask about availability on WhatsApp")}
      </a>
      <p className="muted small" style={{ margin: 0 }}>{t("El calendario lo actualiza quien publica y es una guía. Confirma la disponibilidad y el precio final directo con el anfitrión.", "The calendar is maintained by the host and is only a guide. Confirm availability and the final price directly with the host.")}</p>
    </div>
  );
}
