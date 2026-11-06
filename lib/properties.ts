import { query } from "./db";
import type { Operation, PropType } from "./config";

// Un anuncio se oculta solo si el dueño no confirma que sigue disponible en 90 días.
const FRESH = "status = 'approved' AND confirmed_at > now() - interval '90 days'";

export type Property = {
  id: number;
  slug: string;
  operation: Operation;
  type: PropType;
  title: string;
  description: string;
  price: number | null;
  colonia: string;
  colonia_slug: string;
  bedrooms: number | null;
  bathrooms: number | null;
  land_m2: number | null;
  built_m2: number | null;
  owner_kind: "dueno" | "agente";
  whatsapp: string;
  photos: string[];
  status: "pending" | "approved" | "rejected" | "archived";
  views: number;
  wa_clicks: number;
  created_at: string;
  approved_at: string | null;
  confirmed_at: string;
};

const PUBLIC_COLS = `id, slug, operation, type, title, description, price, colonia, colonia_slug, bedrooms, bathrooms,
  land_m2, built_m2, owner_kind, whatsapp, photos, status, views, wa_clicks, created_at, approved_at, confirmed_at`;

export type Filters = {
  operation?: Operation;
  type?: PropType;
  colonia_slug?: string;
  minPrice?: number;
  maxPrice?: number;
  q?: string;
  limit?: number;
  offset?: number;
};

export async function listProperties(f: Filters = {}): Promise<Property[]> {
  const where = [FRESH];
  const params: unknown[] = [];
  const add = (cond: string, v: unknown) => {
    params.push(v);
    where.push(cond.replace("$$", `$${params.length}`));
  };
  if (f.operation) add("operation = $$", f.operation);
  if (f.type) add("type = $$", f.type);
  if (f.colonia_slug) add("colonia_slug = $$", f.colonia_slug);
  if (f.minPrice != null) add("price >= $$", f.minPrice);
  if (f.maxPrice != null) add("price <= $$", f.maxPrice);
  if (f.q) {
    params.push(`%${f.q.replace(/[%_\\]/g, "")}%`);
    const n = params.length;
    where.push(`(title ILIKE $${n} OR description ILIKE $${n} OR colonia ILIKE $${n})`);
  }
  params.push(Math.min(f.limit ?? 24, 60), f.offset ?? 0);
  const sqlText = `SELECT ${PUBLIC_COLS} FROM properties WHERE ${where.join(" AND ")}
    ORDER BY approved_at DESC NULLS LAST, id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
  return query<Property>(sqlText, params);
}

export async function getBySlug(slug: string): Promise<Property | null> {
  const rows = await query<Property>(`SELECT ${PUBLIC_COLS} FROM properties WHERE slug = $1 AND ${FRESH}`, [slug]);
  return rows[0] ?? null;
}

export async function listColonias(): Promise<{ colonia: string; colonia_slug: string; total: number }[]> {
  return query(
    `SELECT MIN(colonia) AS colonia, colonia_slug, COUNT(*)::int AS total
     FROM properties WHERE ${FRESH} GROUP BY colonia_slug ORDER BY total DESC, colonia_slug`,
  );
}

export async function countsByOperation(): Promise<Record<string, number>> {
  const rows = await query<{ operation: string; total: number }>(
    `SELECT operation, COUNT(*)::int AS total FROM properties WHERE ${FRESH} GROUP BY operation`,
  );
  return Object.fromEntries(rows.map((r) => [r.operation, r.total]));
}

export async function listAllSlugs(): Promise<{ slug: string; updated: string }[]> {
  return query(`SELECT slug, COALESCE(approved_at, created_at) AS updated FROM properties WHERE ${FRESH} ORDER BY id DESC LIMIT 5000`);
}

export async function listLandingCombos(): Promise<{ operation: string; type: string; colonia_slug: string }[]> {
  return query(`SELECT DISTINCT operation, type, colonia_slug FROM properties WHERE ${FRESH}`);
}
