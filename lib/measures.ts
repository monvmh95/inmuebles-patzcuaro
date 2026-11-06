// Medidas de terreno: la gente escribe "10x21", "10 x 21.5", "10×21", "10 por 21" o directamente "210".
export type Land = { m2: number; dims: string | null };

const MAX_M2 = 1_000_000;
const n = (s: string) => Number(s.replace(",", "."));

export function parseLand(input: unknown): Land | null {
  if (input == null) return null;
  const s = String(input).toLowerCase().replace(/m2|m²|mts?2?|metros?|cuadrados?/g, "").trim();
  if (!s) return null;
  const two = s.match(/^(\d+(?:[.,]\d+)?)\s*(?:x|×|\*|por)\s*(\d+(?:[.,]\d+)?)$/);
  if (two) {
    const a = n(two[1]), b = n(two[2]);
    const m2 = Math.round(a * b);
    if (!(a > 0 && b > 0) || m2 < 1 || m2 > MAX_M2) return null;
    const f = (v: number) => String(Math.round(v * 100) / 100);
    return { m2, dims: `${f(a)} × ${f(b)}` };
  }
  const one = s.match(/^(\d{1,7}(?:[.,]\d+)?)$/);
  if (one) {
    const m2 = Math.round(n(one[1]));
    if (m2 < 0 || m2 > MAX_M2) return null;
    return { m2, dims: null };
  }
  return null;
}
