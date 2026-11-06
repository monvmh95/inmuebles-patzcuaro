import { query } from "./db";
import { KING_HOURS } from "./config";
import type { Property } from "./properties";

export type KingSlot = { id: number; property_id: number; starts_at: string; ends_at: string };

/** Rey activo ahora mismo (si hay uno). */
export async function getCurrentKing(): Promise<{ property: Property; ends_at: string } | null> {
  const rows = await query<Property & { ends_at: string }>(
    `SELECT p.id, p.slug, p.operation, p.type, p.title, p.description, p.price, p.colonia, p.colonia_slug,
            p.bedrooms, p.bathrooms, p.land_m2, p.built_m2, p.owner_kind, p.whatsapp, p.photos, p.status,
            p.views, p.wa_clicks, p.created_at, p.approved_at, p.confirmed_at, p.verified_at, k.ends_at
       FROM king_slots k JOIN properties p ON p.id = k.property_id
      WHERE k.starts_at <= now() AND k.ends_at > now() AND p.status = 'approved'
      ORDER BY k.starts_at DESC LIMIT 1`,
  );
  const r = rows[0];
  if (!r) return null;
  const { ends_at, ...property } = r;
  return { property: property as Property, ends_at };
}

/**
 * Programa un turno de 24 h en la cola. Cada pagador completa sus 24 h completas.
 * Es idempotente por payment_ref: si el webhook llega dos veces, no duplica el turno.
 */
export async function scheduleKing(propertyId: number, paymentRef: string, source: "payment" | "admin" = "payment") {
  const existing = await query<KingSlot>(`SELECT id, property_id, starts_at, ends_at FROM king_slots WHERE payment_ref = $1`, [paymentRef]);
  if (existing[0]) return existing[0];
  const rows = await query<KingSlot>(
    `INSERT INTO king_slots (property_id, starts_at, ends_at, payment_ref, source)
     SELECT $1::bigint, s.start_at, s.start_at + make_interval(hours => $2::int), $3::text, $4::text
       FROM (SELECT GREATEST(now(), COALESCE(MAX(ends_at), now())) AS start_at FROM king_slots) s
     ON CONFLICT (payment_ref) DO NOTHING
     RETURNING id, property_id, starts_at, ends_at`,
    [propertyId, KING_HOURS, paymentRef, source],
  );
  if (rows[0]) return rows[0];
  const again = await query<KingSlot>(`SELECT id, property_id, starts_at, ends_at FROM king_slots WHERE payment_ref = $1`, [paymentRef]);
  return again[0];
}

export async function hallOfFame(limit = 20): Promise<(Property & { starts_at: string; ends_at: string })[]> {
  return query(
    `SELECT p.id, p.slug, p.title, p.operation, p.type, p.colonia, p.price, k.starts_at, k.ends_at
       FROM king_slots k JOIN properties p ON p.id = k.property_id
      WHERE k.ends_at <= now() AND p.status = 'approved'
      ORDER BY k.ends_at DESC LIMIT $1`,
    [limit],
  );
}
