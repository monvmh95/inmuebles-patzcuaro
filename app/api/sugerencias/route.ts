import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { clientIpHash } from "@/lib/request";

export const runtime = "nodejs";
const schema = z.object({
  kind: z.enum(["idea", "problema", "duda", "otro"]),
  message: z.string().trim().min(5, "Cuéntanos un poco más (mínimo 5 caracteres).").max(1500),
  contact: z.string().trim().max(120).optional(),
  website: z.string().max(0).optional(), // honeypot
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  const d = parsed.data;
  const ip = clientIpHash(req);
  const [{ n }] = await query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM suggestions WHERE ip_hash = $1 AND created_at > now() - interval '1 hour'`, [ip]);
  if (n >= 5) return NextResponse.json({ error: "Ya nos enviaste varios mensajes. Intenta más tarde." }, { status: 429 });
  await query(`INSERT INTO suggestions (kind, message, contact, ip_hash) VALUES ($1,$2,$3,$4)`, [d.kind, d.message, d.contact || null, ip]);
  return NextResponse.json({ ok: true });
}
