import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/account";
import { query } from "@/lib/db";
import { normalizeMxPhone } from "@/lib/util";

export const runtime = "nodejs";

const edit = z.object({
  title: z.string().trim().min(8, "El título es muy corto").max(90),
  description: z.string().trim().min(30, "Describe la propiedad con al menos 30 caracteres").max(3000),
  price: z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().min(0).max(2_000_000_000).nullable()),
  whatsapp: z.string().trim().min(8).max(25),
});

type Ctx = { params: Promise<{ slug: string }> };

/** Editar mis datos. Un anuncio "No aprobado" vuelve a revisión al corregirlo. */
export async function PATCH(req: Request, ctx: Ctx) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Tu sesión venció. Entra de nuevo con tu correo." }, { status: 401 });
  const { slug } = await ctx.params;
  const parsed = edit.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  const d = parsed.data;
  const phone = normalizeMxPhone(d.whatsapp);
  if (!phone) return NextResponse.json({ error: "El WhatsApp debe tener 10 dígitos (ej. 434 123 4567)." }, { status: 400 });
  const r = await query(
    `UPDATE properties SET title=$3, description=$4, price=$5, whatsapp=$6, edited_at=now(),
            status = CASE WHEN status='rejected' THEN 'pending' ELSE status END
      WHERE slug=$1 AND email_norm=$2 AND status <> 'archived' RETURNING id`,
    [slug, s.email_norm, d.title, d.description, d.price, phone],
  );
  if (!r.length) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request, ctx: Ctx) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Tu sesión venció. Entra de nuevo con tu correo." }, { status: 401 });
  const { slug } = await ctx.params;
  const action = (await req.json().catch(() => null))?.action;
  let r: unknown[] = [];
  if (action === "renew") r = await query(`UPDATE properties SET confirmed_at = now() WHERE slug=$1 AND email_norm=$2 AND status IN ('approved','pending') RETURNING id`, [slug, s.email_norm]);
  else if (action === "archive") r = await query(`UPDATE properties SET status='archived' WHERE slug=$1 AND email_norm=$2 AND status <> 'archived' RETURNING id`, [slug, s.email_norm]);
  else return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  if (!r.length) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
