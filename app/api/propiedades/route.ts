import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { MAX_PHOTOS, OPERATIONS, TYPES } from "@/lib/config";
import { clientIpHash } from "@/lib/request";
import { newToken, normalizeMxPhone, randomId, slugify } from "@/lib/util";
import { SITE_URL } from "@/lib/config";

export const runtime = "nodejs";

const num = (max: number) =>
  z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().min(0).max(max).nullable());

const schema = z.object({
  operation: z.enum(Object.keys(OPERATIONS) as [string, ...string[]]),
  type: z.enum(Object.keys(TYPES) as [string, ...string[]]),
  title: z.string().trim().min(8, "El título es muy corto").max(90),
  description: z.string().trim().min(30, "Describe la propiedad con al menos 30 caracteres").max(3000),
  price: num(2_000_000_000),
  colonia: z.string().trim().min(2, "Indica la colonia o zona").max(60),
  bedrooms: num(30),
  bathrooms: num(30),
  land_m2: num(1_000_000),
  built_m2: num(100_000),
  owner_kind: z.enum(["dueno", "agente"]),
  whatsapp: z.string().trim().min(8).max(25),
  email: z.string().trim().email().max(120).optional().or(z.literal("")),
  photos: z
    .array(z.string().url().max(300))
    .max(MAX_PHOTOS)
    .refine((arr) => arr.every((u) => /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//.test(u)), "Foto inválida"),
  accept: z.literal(true, { errorMap: () => ({ message: "Debes aceptar los términos" }) }),
  website: z.string().max(0).optional(), // honeypot
});

const MAX_PER_HOUR = 4;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }
  const d = parsed.data;

  const phone = normalizeMxPhone(d.whatsapp);
  if (!phone) return NextResponse.json({ error: "El WhatsApp debe tener 10 dígitos (ej. 434 123 4567)." }, { status: 400 });

  const ip = clientIpHash(req);
  const [{ n }] = await query<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM properties WHERE ip_hash = $1 AND created_at > now() - interval '1 hour'`,
    [ip],
  );
  if (n >= MAX_PER_HOUR) return NextResponse.json({ error: "Has publicado varias veces seguidas. Intenta más tarde." }, { status: 429 });

  if (d.operation !== "renta" && d.operation !== "venta" && d.operation !== "traspaso") {
    return NextResponse.json({ error: "Operación inválida" }, { status: 400 });
  }

  const { token, hash } = newToken();
  const slug = `${slugify(d.title) || "propiedad"}-${randomId(3)}`;
  await query(
    `INSERT INTO properties (slug, token_hash, operation, type, title, description, price, colonia, colonia_slug,
        bedrooms, bathrooms, land_m2, built_m2, owner_kind, whatsapp, email, photos, ip_hash)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb,$18)`,
    [
      slug, hash, d.operation, d.type, d.title, d.description, d.price, d.colonia, slugify(d.colonia) || "centro",
      d.bedrooms, d.bathrooms, d.land_m2, d.built_m2, d.owner_kind, phone, d.email || null, JSON.stringify(d.photos), ip,
    ],
  );
  return NextResponse.json({ ok: true, manageUrl: `${SITE_URL}/mi-anuncio/${token}`, manageToken: token });
}
