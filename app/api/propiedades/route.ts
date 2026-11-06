import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { MAX_PHOTOS, OPERATIONS, TYPES, inBounds, roundGeo } from "@/lib/config";
import { clientIpHash } from "@/lib/request";
import { newToken, normalizeEmail, normalizeMxPhone, randomId, slugify } from "@/lib/util";
import { SITE_URL } from "@/lib/config";
import { parseLand } from "@/lib/measures";
import { FEATURE_KEYS, cleanFeatures } from "@/lib/features";
import { checkPublisher } from "@/lib/publishers";
import { getSession, isTelKey } from "@/lib/account";
import { smsEnabled } from "@/lib/sms";
import { mailEnabled } from "@/lib/mail";

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
  land_dims: z.string().trim().max(30).optional(),
  features: z.array(z.enum(FEATURE_KEYS)).max(30).optional(),
  built_m2: num(100_000),
  lat: z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().finite().nullable()).optional(),
  lng: z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().finite().nullable()).optional(),
  lake_view: z.boolean().optional(),
  owner_kind: z.enum(["dueno", "agente"]),
  whatsapp: z.string().trim().min(8).max(25),
  email: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.string().trim().email("Escribe un correo válido (lo usamos para confirmar tu anuncio; no se muestra).").max(120).optional()),
  photos: z
    .array(z.string().url().max(300))
    .max(MAX_PHOTOS)
    .refine((arr) => arr.every((u) => /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//.test(u)), "Foto inválida"),
  accept: z.literal(true, { errorMap: () => ({ message: "Debes aceptar los términos" }) }),
  website: z.string().max(0).optional(), // honeypot
});

const MAX_PER_HOUR = 12; // por IP; el control real por persona es el límite de anuncios activos por WhatsApp

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }
  const d = parsed.data;

  const phone = normalizeMxPhone(d.whatsapp);
  if (!phone) return NextResponse.json({ error: "El WhatsApp debe tener 10 dígitos (ej. 434 123 4567)." }, { status: 400 });

  // Con verificación activa (SMS o correo), publicar exige una sesión confirmada. Si no, solo se pide el correo.
  const verifyOn = smsEnabled() || mailEnabled();
  const session = verifyOn ? await getSession().catch(() => null) : null;
  let email = d.email ?? "";
  let emailNorm: string;
  if (verifyOn) {
    if (!session) return NextResponse.json({ error: "Confirma tu celular con el código para poder publicar." }, { status: 401 });
    emailNorm = session.email_norm;
    email = isTelKey(emailNorm) ? "" : session.email;
  } else {
    if (!email) return NextResponse.json({ error: "Escribe un correo válido (lo usamos para confirmar tu anuncio; no se muestra)." }, { status: 400 });
    emailNorm = normalizeEmail(email);
  }
  const chk = await checkPublisher(phone, emailNorm);
  if (chk.blocked) return NextResponse.json({ error: "Esta persona no puede publicar por ahora. Si crees que es un error, escríbenos." }, { status: 403 });
  const limit = chk.limit, mine = chk.active;
  if (mine >= limit) {
    const c = process.env.CONTACT_EMAIL;
    return NextResponse.json({ error: `Ya tienes ${mine} anuncios activos y el límite gratuito es ${limit}. Para publicar más, escríbenos${c ? ` a ${c}` : ""} o da de baja alguno que ya no esté disponible.` }, { status: 403 });
  }

  const ip = clientIpHash(req);
  const [{ n }] = await query<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM properties WHERE ip_hash = $1 AND created_at > now() - interval '1 hour'`,
    [ip],
  );
  if (n >= MAX_PER_HOUR) return NextResponse.json({ error: "Has publicado varias veces seguidas. Intenta más tarde." }, { status: 429 });

  if (d.operation !== "renta" && d.operation !== "venta" && d.operation !== "traspaso") {
    return NextResponse.json({ error: "Operación inválida" }, { status: 400 });
  }

  let lat: number | null = null, lng: number | null = null;
  if (d.lat != null && d.lng != null) {
    if (!inBounds(d.lat, d.lng)) return NextResponse.json({ error: "La zona marcada queda fuera de Pátzcuaro y sus alrededores." }, { status: 400 });
    lat = roundGeo(d.lat); lng = roundGeo(d.lng);
  }

  // El terreno puede venir como "10x21" (frente x fondo) o como m² directos.
  let landM2 = d.land_m2, landDims: string | null = null;
  if (d.land_dims) {
    const land = parseLand(d.land_dims);
    if (!land) return NextResponse.json({ error: "El terreno debe escribirse como 10x21 o como metros cuadrados (ej. 210)." }, { status: 400 });
    landM2 = land.m2; landDims = land.dims;
  }

  const { token, hash } = newToken();
  const slug = `${slugify(d.title) || "propiedad"}-${randomId(3)}`;
  await query(
    `INSERT INTO properties (slug, token_hash, operation, type, title, description, price, colonia, colonia_slug,
        bedrooms, bathrooms, land_m2, built_m2, owner_kind, whatsapp, email, photos, ip_hash, lat, lng, lake_view, land_dims, features, email_norm)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb,$18,$19::float8,$20::float8,$21::boolean,$22,$23::jsonb,$24)`,
    [
      slug, hash, d.operation, d.type, d.title, d.description, d.price, d.colonia, slugify(d.colonia) || "centro",
      d.bedrooms, d.bathrooms, landM2, d.built_m2, d.owner_kind, phone, email, JSON.stringify(d.photos), ip, lat, lng, d.lake_view === true, landDims, JSON.stringify(cleanFeatures(d.features)), emailNorm,
    ],
  );
  if (session) await query(`UPDATE accounts SET whatsapp = $2, owner_kind = $3 WHERE email_norm = $1`, [session.email_norm, phone, d.owner_kind]).catch(() => {});
  return NextResponse.json({ ok: true, manageUrl: `${SITE_URL}/mi-anuncio/${token}`, manageToken: token });
}
