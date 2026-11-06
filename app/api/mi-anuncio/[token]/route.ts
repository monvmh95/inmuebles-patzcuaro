import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { sha256 } from "@/lib/util";

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const body = await req.json().catch(() => null);
  const action = body?.action;
  const hash = sha256(token);
  if (action === "confirm") {
    const r = await query(`UPDATE properties SET confirmed_at = now() WHERE token_hash = $1 AND status IN ('approved','pending') RETURNING id`, [hash]);
    if (!r.length) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ ok: true });
  }
  if (action === "archive") {
    const r = await query(`UPDATE properties SET status = 'archived' WHERE token_hash = $1 AND status <> 'archived' RETURNING id`, [hash]);
    if (!r.length) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
}
