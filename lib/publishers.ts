import { query } from "./db";
import { FREE_LISTING_LIMIT } from "./config";

export type Publisher = { whatsapp: string; listing_limit: number | null; blocked: boolean; note: string | null };

export async function getPublisher(whatsapp: string): Promise<Publisher | null> {
  const r = await query<Publisher>(`SELECT whatsapp, listing_limit, blocked, note FROM publishers WHERE whatsapp = $1`, [whatsapp]);
  return r[0] ?? null;
}
export const limitFor = (p: Publisher | null) => p?.listing_limit ?? FREE_LISTING_LIMIT;

/** Anuncios que cuentan contra el límite: por revisar y publicados. */
export async function activeCount(whatsapp: string): Promise<number> {
  const [{ n }] = await query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM properties WHERE whatsapp = $1 AND status IN ('pending','approved')`, [whatsapp]);
  return n;
}

export type PublisherRow = Publisher & { total: number; active: number; pending: number; approved: number; last_at: string };
export async function listPublishers(): Promise<PublisherRow[]> {
  return query<PublisherRow>(`
    SELECT p.whatsapp,
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE p.status IN ('pending','approved'))::int AS active,
           COUNT(*) FILTER (WHERE p.status = 'pending')::int AS pending,
           COUNT(*) FILTER (WHERE p.status = 'approved')::int AS approved,
           MAX(p.created_at) AS last_at,
           pu.listing_limit, COALESCE(pu.blocked, false) AS blocked, pu.note
      FROM properties p LEFT JOIN publishers pu ON pu.whatsapp = p.whatsapp
     GROUP BY p.whatsapp, pu.listing_limit, pu.blocked, pu.note
    UNION ALL
    SELECT pu.whatsapp, 0, 0, 0, 0, pu.updated_at, pu.listing_limit, pu.blocked, pu.note
      FROM publishers pu WHERE NOT EXISTS (SELECT 1 FROM properties p WHERE p.whatsapp = pu.whatsapp)
    ORDER BY active DESC, last_at DESC LIMIT 150`);
}
