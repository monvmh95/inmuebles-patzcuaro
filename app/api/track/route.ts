import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { isBot } from "@/lib/util";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (isBot(req.headers.get("user-agent"))) return NextResponse.json({ ok: true });
  const body = await req.json().catch(() => null);
  const slug = typeof body?.slug === "string" ? body.slug.slice(0, 120) : "";
  if (slug) await query(`UPDATE properties SET wa_clicks = wa_clicks + 1 WHERE slug = $1 AND status = 'approved'`, [slug]);
  return NextResponse.json({ ok: true });
}
