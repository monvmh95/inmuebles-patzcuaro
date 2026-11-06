import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/account";
import { query } from "@/lib/db";

export const runtime = "nodejs";
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const schema = z.object({ block: z.array(day).max(800).default([]), unblock: z.array(day).max(800).default([]) });

const valid = (s: string) => { const d = new Date(`${s}T00:00:00Z`); return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s; };

/** Marca o libera noches de un anuncio de hospedaje. Solo su dueño (por la cuenta verificada). */
export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const s = await getSession().catch(() => null);
  if (!s) return NextResponse.json({ error: "Inicia sesión para editar tu calendario." }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Fechas inválidas." }, { status: 400 });
  const { block, unblock } = parsed.data;
  if (![...block, ...unblock].every(valid)) return NextResponse.json({ error: "Fechas inválidas." }, { status: 400 });
  const rows = await query<{ id: number }>(`SELECT id FROM properties WHERE slug = $1 AND email_norm = $2 AND operation = 'hospedaje' AND status <> 'archived'`, [slug, s.email_norm]);
  if (!rows[0]) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const id = rows[0].id;
  // Solo de hoy a ~20 meses: lo demás se ignora.
  const [{ lo, hi }] = await query<{ lo: string; hi: string }>(`SELECT to_char((now() AT TIME ZONE 'America/Mexico_City')::date, 'YYYY-MM-DD') AS lo, to_char((now() AT TIME ZONE 'America/Mexico_City')::date + 600, 'YYYY-MM-DD') AS hi`);
  const inWin = (d: string) => d >= lo && d <= hi;
  const b = [...new Set(block.filter(inWin))], u = [...new Set(unblock.filter(inWin))];
  if (b.length) await query(`INSERT INTO blocked_dates (property_id, day) SELECT $1, unnest($2::date[]) ON CONFLICT DO NOTHING`, [id, b]);
  if (u.length) await query(`DELETE FROM blocked_dates WHERE property_id = $1 AND day = ANY($2::date[])`, [id, u]);
  const out = await query<{ d: string }>(`SELECT to_char(day, 'YYYY-MM-DD') AS d FROM blocked_dates WHERE property_id = $1 AND day >= $2::date ORDER BY day`, [id, lo]);
  return NextResponse.json({ ok: true, blocked: out.map((r) => r.d) });
}
