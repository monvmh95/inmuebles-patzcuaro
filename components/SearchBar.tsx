"use client";
import { useEffect, useRef, useState } from "react";
import { OPERATIONS, TYPES } from "@/lib/config";

type Props = { op: string; type: string; colonia: string; max?: number; lake?: boolean; colonias: { colonia: string; colonia_slug: string }[] };

export default function SearchBar({ op, type, colonia, max, lake, colonias }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [more, setMore] = useState(Boolean(colonia || max));
  const empty = !op && !type && !colonia && !max && !lake;

  // Recuerda la última búsqueda en este dispositivo; solo rellena el formulario si la URL no trae filtros.
  useEffect(() => {
    const f = formRef.current;
    if (!f || !empty) return;
    try {
      const s = JSON.parse(localStorage.getItem("inm_search") || "null");
      if (!s) return;
      const set = (n: string, v: string) => { const el = f.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${n}"]`); if (el && v) el.value = v; };
      if (s.op) { const r = f.querySelector<HTMLInputElement>(`input[name=op][value="${s.op}"]`); if (r) r.checked = true; }
      set("type", s.type || ""); set("colonia", s.colonia || ""); set("max", s.max || "");
      if (s.colonia || s.max) setMore(true);
      const l = f.querySelector<HTMLInputElement>('input[name="lake"]'); if (l && s.lake) l.checked = true;
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function remember(e: React.FormEvent<HTMLFormElement>) {
    try {
      const fd = new FormData(e.currentTarget);
      localStorage.setItem("inm_search", JSON.stringify({ op: fd.get("op") || "", type: fd.get("type") || "", colonia: fd.get("colonia") || "", max: fd.get("max") || "", lake: fd.get("lake") === "1" }));
    } catch {}
  }

  const ops: [string, string][] = [["", "Todo"], ...Object.entries(OPERATIONS).map(([k, v]) => [k, v.label] as [string, string])];
  return (
    <form ref={formRef} onSubmit={remember} className="search" action="/" method="get" role="search" aria-label="Buscar propiedades">
      <fieldset className="seg" aria-label="Operación">
        {ops.map(([v, l]) => (
          <label key={v || "all"} className="seg-opt">
            <input type="radio" name="op" value={v} defaultChecked={op === v} />
            <span>{l}</span>
          </label>
        ))}
      </fieldset>
      <div className="search-row">
        <select name="type" defaultValue={type} aria-label="Tipo de inmueble">
          <option value="">Todo tipo</option>
          {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.plural}</option>)}
        </select>
        <div className={`search-extra${more ? " open" : ""}`}>
          <select name="colonia" defaultValue={colonia} aria-label="Colonia">
            <option value="">Toda la ciudad</option>
            {colonias.map((c) => <option key={c.colonia_slug} value={c.colonia_slug}>{c.colonia}</option>)}
          </select>
          <input name="max" type="number" min={0} inputMode="numeric" placeholder="Precio máx. $" defaultValue={max} aria-label="Precio máximo en pesos" />
        </div>
        <label className="check small lake-check"><input type="checkbox" name="lake" value="1" defaultChecked={lake} /> Con vista al lago</label>
        <button type="button" className="linklike search-toggle" aria-expanded={more} onClick={() => setMore((v) => !v)}>
          {more ? "Menos filtros" : "Más filtros"}
        </button>
        <button className="btn">Buscar</button>
      </div>
    </form>
  );
}
