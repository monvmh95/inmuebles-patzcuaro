"use client";
import { useState } from "react";
import { OPERATIONS, TYPES } from "@/lib/config";

type Props = { op: string; type: string; colonia: string; max?: number; colonias: { colonia: string; colonia_slug: string }[] };

export default function SearchBar({ op, type, colonia, max, colonias }: Props) {
  const [more, setMore] = useState(Boolean(colonia || max));
  const ops: [string, string][] = [["", "Todo"], ...Object.entries(OPERATIONS).map(([k, v]) => [k, v.label] as [string, string])];
  return (
    <form className="search" action="/" method="get" role="search" aria-label="Buscar propiedades">
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
        <button type="button" className="linklike search-toggle" aria-expanded={more} onClick={() => setMore((v) => !v)}>
          {more ? "Menos filtros" : "Más filtros"}
        </button>
        <button className="btn">Buscar</button>
      </div>
    </form>
  );
}
