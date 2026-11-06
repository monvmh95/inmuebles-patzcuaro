"use client";
import { useState } from "react";

/** Escalones de precio por operación (el último = "sin límite"; el primero = "sin mínimo"). */
const STEPS: Record<string, number[]> = {
  renta: [0, 1000, 2000, 3000, 4000, 5000, 6000, 8000, 10000, 12000, 15000, 20000, 30000, 50000],
  hospedaje: [0, 300, 500, 700, 900, 1200, 1500, 2000, 3000, 5000, 8000],
  venta: [0, 200_000, 400_000, 600_000, 800_000, 1_000_000, 1_500_000, 2_000_000, 3_000_000, 5_000_000, 8_000_000, 12_000_000, 20_000_000],
  traspaso: [0, 10_000, 25_000, 50_000, 100_000, 200_000, 300_000, 500_000, 1_000_000, 2_000_000],
};
const UNIT: Record<string, { es: string; en: string }> = {
  renta: { es: "al mes", en: "per month" }, hospedaje: { es: "por noche", en: "per night" }, venta: { es: "", en: "" }, traspaso: { es: "", en: "" },
};

const nearestUp = (steps: number[], v: number) => { const i = steps.findIndex((s) => s >= v); return i < 0 ? steps.length - 1 : i; };
const nearest = (steps: number[], v: number) => steps.reduce((b, s, i) => (Math.abs(s - v) < Math.abs(steps[b] - v) ? i : b), 0);

export default function PriceRange({ op, min, max, en, onChange }: { op: string; min?: number; max?: number; en: boolean; onChange?: () => void }) {
  const steps = STEPS[op];
  const last = steps ? steps.length - 1 : 0;
  // El componente se vuelve a montar al cambiar de operación (key), así la escala siempre empieza limpia.
  const [lo, setLo] = useState(() => (steps && min ? nearest(steps, min) : 0));
  const [hi, setHi] = useState(() => (steps && max ? Math.min(nearestUp(steps, max), steps.length - 1) : last));

  if (!steps) {
    return <p className="muted small price-hint">{en ? "Choose Rent, Sale, Transfer or Lodging to filter by price." : "Elige Renta, Venta, Traspaso u Hospedaje para filtrar por precio."}</p>;
  }
  const fmt = (n: number) => `$${new Intl.NumberFormat(en ? "en-US" : "es-MX").format(n)}`;
  const loTxt = lo === 0 ? (en ? "Any" : "Sin mínimo") : fmt(steps[lo]);
  const hiTxt = hi === last ? (en ? `${fmt(steps[last])}+` : `${fmt(steps[last])} o más`) : fmt(steps[hi]);
  const pct = (i: number) => (i / last) * 100;
  const unit = UNIT[op]?.[en ? "en" : "es"];

  return (
    <div className="price-range">
      <div className="price-range-head">
        <span className="price-range-label">{en ? "Price" : "Precio"}{unit ? <small> {unit}</small> : null}</span>
        <output className="price-range-val" aria-live="polite">{loTxt} – {hiTxt}</output>
      </div>
      <div className="pr-track">
        <div className="pr-fill" style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
        <input type="range" min={0} max={last} step={1} value={lo} aria-label={en ? "Minimum price" : "Precio mínimo"}
          aria-valuetext={loTxt} onChange={(e) => { setLo(Math.min(Number(e.target.value), hi)); onChange?.(); }} />
        <input type="range" min={0} max={last} step={1} value={hi} aria-label={en ? "Maximum price" : "Precio máximo"}
          aria-valuetext={hiTxt} onChange={(e) => { setHi(Math.max(Number(e.target.value), lo)); onChange?.(); }} />
      </div>
      {lo > 0 && <input type="hidden" name="min" value={steps[lo]} />}
      {hi < last && <input type="hidden" name="max" value={steps[hi]} />}
    </div>
  );
}
