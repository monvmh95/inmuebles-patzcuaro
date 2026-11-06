const KEY = "inm_fav";
export function readFavs(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 60) : [];
  } catch { return []; }
}
export function toggleFav(slug: string): boolean {
  const cur = readFavs();
  const on = !cur.includes(slug);
  const next = on ? [slug, ...cur].slice(0, 60) : cur.filter((s) => s !== slug);
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  window.dispatchEvent(new Event("inm-favs"));
  return on;
}
