import { query } from "./db";

export type ColoniaContent = { colonia_slug: string; name: string; intro: string; updated_at: string };

export async function getColoniaContent(slug: string): Promise<ColoniaContent | null> {
  const r = await query<ColoniaContent>(`SELECT colonia_slug, name, intro, updated_at FROM colonia_content WHERE colonia_slug = $1`, [slug]);
  return r[0] ?? null;
}
export async function listColoniaContent(): Promise<ColoniaContent[]> {
  return query<ColoniaContent>(`SELECT colonia_slug, name, intro, updated_at FROM colonia_content ORDER BY name`);
}
/** Slugs de colonias con texto propio: solo esas entran al sitemap y se indexan. */
export async function listColoniaSlugsWithContent(): Promise<{ colonia_slug: string; updated_at: string }[]> {
  return query(`SELECT colonia_slug, updated_at FROM colonia_content WHERE length(trim(intro)) >= 80`);
}
export async function saveColoniaContent(slug: string, name: string, intro: string) {
  await query(
    `INSERT INTO colonia_content (colonia_slug, name, intro, updated_at) VALUES ($1,$2,$3,now())
     ON CONFLICT (colonia_slug) DO UPDATE SET name = EXCLUDED.name, intro = EXCLUDED.intro, updated_at = now()`,
    [slug, name, intro],
  );
}

export type ColoniaStats = { operation: string; total: number; min: number | null; max: number | null };
export async function coloniaStats(slug: string): Promise<ColoniaStats[]> {
  return query<ColoniaStats>(
    `SELECT operation, COUNT(*)::int AS total, MIN(price)::int AS min, MAX(price)::int AS max
     FROM properties WHERE colonia_slug = $1 AND status='approved' AND confirmed_at > now() - interval '90 days'
     GROUP BY operation`, [slug]);
}
