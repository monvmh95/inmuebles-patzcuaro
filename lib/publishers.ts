import { query } from "./db";
import { FREE_LISTING_LIMIT } from "./config";

export type Publisher = { whatsapp: string; listing_limit: number | null; blocked: boolean; note: string | null };

/**
 * "Una persona" = su WhatsApp O su correo (normalizado). Los bloqueos y límites propios
 * se guardan por cualquiera de los dos; cambiar de número o de correo solo no evade el control.
 */
export async function checkPublisher(phone: string, emailNorm: string): Promise<{ blocked: boolean; limit: number; active: number }> {
  const rows = await query<Publisher>(`SELECT whatsapp, listing_limit, blocked, note FROM publishers WHERE whatsapp = ANY($1::text[])`, [[phone, emailNorm]]);
  const blocked = rows.some((r) => r.blocked);
  const limit = Math.max(...[phone, emailNorm].map((k) => rows.find((r) => r.whatsapp === k)?.listing_limit ?? FREE_LISTING_LIMIT));
  const [{ a, b }] = await query<{ a: number; b: number }>(
    `SELECT COUNT(*) FILTER (WHERE whatsapp = $1)::int AS a, COUNT(*) FILTER (WHERE email_norm = $2)::int AS b
       FROM properties WHERE status IN ('pending','approved') AND (whatsapp = $1 OR email_norm = $2)`,
    [phone, emailNorm],
  );
  return { blocked, limit, active: Math.max(a, b) };
}
export const limitFor = (p: { listing_limit: number | null } | null) => p?.listing_limit ?? FREE_LISTING_LIMIT;

export type PublisherRow = Publisher & { total: number; active: number; pending: number; approved: number; last_at: string; emails: string | null };
export async function listPublishers(): Promise<PublisherRow[]> {
  return query<PublisherRow>(`
    SELECT p.whatsapp,
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE p.status IN ('pending','approved'))::int AS active,
           COUNT(*) FILTER (WHERE p.status = 'pending')::int AS pending,
           COUNT(*) FILTER (WHERE p.status = 'approved')::int AS approved,
           MAX(p.created_at) AS last_at,
           string_agg(DISTINCT p.email_norm, ', ') AS emails,
           pu.listing_limit, COALESCE(pu.blocked, false) AS blocked, pu.note
      FROM properties p LEFT JOIN publishers pu ON pu.whatsapp = p.whatsapp
     GROUP BY p.whatsapp, pu.listing_limit, pu.blocked, pu.note
    UNION ALL
    SELECT pu.whatsapp, 0, 0, 0, 0, pu.updated_at, NULL::text, pu.listing_limit, pu.blocked, pu.note
      FROM publishers pu
     WHERE pu.whatsapp ~ '^[0-9]{10}$' AND NOT EXISTS (SELECT 1 FROM properties p WHERE p.whatsapp = pu.whatsapp)
    ORDER BY active DESC, last_at DESC LIMIT 150`);
}
