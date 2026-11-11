import { NextResponse, after } from "next/server";
import { timingSafeEqual } from "crypto";
import { z } from "zod";
import { EVENT_CATEGORIES, createPendingEvent, recentSubmissions } from "@/lib/events";
import { notifyAdmin } from "@/lib/notify";
import { clientIpHash } from "@/lib/request";

export const runtime = "nodejs";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida");
const httpUrl = z.string().trim().max(300).refine((u) => /^https?:\/\/[^\s]+$/i.test(u), "El enlace debe empezar con http:// o https://");
const opt = (n: number) => z.string().trim().max(n).optional().or(z.literal("")).transform((v) => v || undefined);

const schema = z.object({
  title: z.string().trim().min(5, "El nombre es muy corto").max(120),
  description: z.string().trim().min(30, "Cuéntanos un poco más del evento (mínimo 30 caracteres)").max(2000),
  category: z.enum(Object.keys(EVENT_CATEGORIES) as [string, ...string[]]).default("otro"),
  city: z.string().trim().min(2).max(60).default("Pátzcuaro"),
  venue: z.string().trim().min(3, "Indica el lugar").max(140),
  starts_on: date,
  ends_on: date.optional().or(z.literal("")).transform((v) => v || undefined),
  time_text: opt(80),
  price_text: opt(80),
  organizer: opt(100),
  source_name: opt(80),
  source_url: httpUrl.optional().or(z.literal("")).transform((v) => v || undefined),
  contact: opt(120),
  website: z.string().max(0).optional(), // honeypot
});

function tokenOk(req: Request): boolean {
  const expected = process.env.EVENTS_INGEST_TOKEN;
  const got = req.headers.get("x-ingest-token");
  if (!expected || !got) return false;
  const a = Buffer.from(got); const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Recibe eventos propuestos por visitantes o por una automatización (n8n). Siempre quedan "por revisar". */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  const d = parsed.data;
  const ends = d.ends_on ?? d.starts_on;
  if (ends < d.starts_on) return NextResponse.json({ error: "La fecha final no puede ser antes de la inicial" }, { status: 400 });
  const trusted = tokenOk(req);
  const ip = clientIpHash(req);
  if (!trusted && (await recentSubmissions(ip)) >= 3) return NextResponse.json({ error: "Ya enviaste varios eventos. Intenta más tarde." }, { status: 429 });
  await createPendingEvent({ ...d, ends_on: ends, ip_hash: trusted ? undefined : ip, source_name: d.source_name ?? (trusted ? "Automatización" : undefined) });
  after(() => notifyAdmin("Evento nuevo por revisar", `${d.title} · ${d.starts_on}`, "/admin#eventos"));
  return NextResponse.json({ ok: true });
}
