"use client";
import { useEffect, useRef, useState } from "react";
import { OPERATIONS, typesForOp, type Operation } from "@/lib/config";
import { opLabel, typePlural } from "@/lib/i18n";
import { useLang, useHref } from "./LangProvider";
import PriceRange from "./PriceRange";

type Props = { op: string; type: string; colonia: string; max?: number; min?: number; lake?: boolean; colonias: { colonia: string; colonia_slug: string }[] };

export default function SearchBar({ op, type, colonia, max, min, lake, colonias }: Props) {
  const lang = useLang();
  const en = lang === "en";
  const href = useHref();
  const formRef = useRef<HTMLFormElement>(null);
  const [more, setMore] = useState(Boolean(colonia || max || min));
  const [opSel, setOpSel] = useState(op);
  const empty = !op && !type && !colonia && !max && !min && !lake;

  // Recuerda la última búsqueda en este dispositivo; solo rellena el formulario si la URL no trae filtros.
  useEffect(() => {
    const f = formRef.current;
    if (!f || !empty) return;
    try {
      const s = JSON.parse(localStorage.getItem("inm_search") || "null");
      if (!s) return;
      const set = (n: string, v: string) => { const el = f.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${n}"]`); if (el && v) el.value = v; };
      if (s.op) { const r = f.querySelector<HTMLInputElement>(`input[name=op][value="${s.op}"]`); if (r) r.checked = true; }
      set("type", s.type || ""); set("colonia", s.colonia || ""); if (s.op) setOpSel(s.op);
      if (s.colonia) setMore(true);
      const l = f.querySelector<HTMLInputElement>('input[name="lake"]'); if (l && s.lake) l.checked = true;
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function remember(e: React.FormEvent<HTMLFormElement>) {
    try {
      const fd = new FormData(e.currentTarget);
      localStorage.setItem("inm_search", JSON.stringify({ op: fd.get("op") || "", type: fd.get("type") || "", colonia: fd.get("colonia") || "", lake: fd.get("lake") === "1" }));
    } catch {}
  }

  const ops: [string, string][] = [["", en ? "All" : "Todo"], ...(Object.keys(OPERATIONS) as Operation[]).map((k) => [k, opLabel(lang, k)] as [string, string])];
  return (
    <form ref={formRef} onSubmit={remember} className="search" action={href("/")} method="get" role="search" aria-label={en ? "Search properties" : "Buscar propiedades"}>
      <fieldset className="seg" aria-label={en ? "Operation" : "Operación"} onChange={(e) => { const t = e.target as unknown as HTMLInputElement; if (t.name === "op") setOpSel(t.value); }}>
        {ops.map(([v, l]) => (
          <label key={v || "all"} className="seg-opt">
            <input type="radio" name="op" value={v} defaultChecked={op === v} />
            <span>{l}</span>
          </label>
        ))}
      </fieldset>
      <PriceRange key={opSel} op={opSel} min={opSel === op ? min : undefined} max={opSel === op ? max : undefined} en={en} />
      <div className="search-row">
        <select name="type" defaultValue={type} aria-label={en ? "Property type" : "Tipo de inmueble"}>
          <option value="">{en ? "Any type" : "Todo tipo"}</option>
          {typesForOp(op || undefined).map((k) => <option key={k} value={k}>{typePlural(lang, k)}</option>)}
        </select>
        <div className={`search-extra${more ? " open" : ""}`}>
          <select name="colonia" defaultValue={colonia} aria-label={en ? "Neighborhood" : "Colonia"}>
            <option value="">{en ? "Whole city" : "Toda la ciudad"}</option>
            {colonias.map((c) => <option key={c.colonia_slug} value={c.colonia_slug}>{c.colonia}</option>)}
          </select>
        </div>
        <label className="check small lake-check"><input type="checkbox" name="lake" value="1" defaultChecked={lake} /> {en ? "Lake view" : "Con vista al lago"}</label>
        <button type="button" className="linklike search-toggle" aria-expanded={more} onClick={() => setMore((v) => !v)}>
          {more ? (en ? "Fewer filters" : "Menos filtros") : (en ? "More filters" : "Más filtros")}
        </button>
        <button className="btn">{en ? "Search" : "Buscar"}</button>
      </div>
    </form>
  );
}
