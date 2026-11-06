import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { clientIpHash } from "@/lib/request";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const slug = typeof body?.slug === "string" ? body.slug.slice(0, 120) : "";
  const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 500) : "";
  if (!slug || reason.length < 5) return NextResponse.json({ error: "Cuéntanos brevemente el motivo." }, { status: 400 });
  const ip = clientIpHash(req);
  const [{ n }] = await query<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM reports WHERE ip_hash = $1 AND created_at > now() - interval '1 hour'`,
    [ip],
  );
  if (n >= 5) return NextResponse.json({ error: "Demasiados reportes. Intenta más tarde." }, { status: 429 });
  const rows = await query<{ id: number }>(`SELECT id FROM properties WHERE slug = $1`, [slug]);
  if (!rows[0]) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  await query(`INSERT INTO reports (property_id, reason, ip_hash) VALUES ($1, $2, $3)`, [rows[0].id, reason, ip]);
  return NextResponse.json({ ok: true });
}
