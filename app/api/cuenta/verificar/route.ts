import { NextResponse } from "next/server";
import { z } from "zod";
import { identKey, startSession, verifyCode } from "@/lib/account";
import { normalizeMxPhone } from "@/lib/util";

export const runtime = "nodejs";
const schema = z.object({ email: z.string().trim().email().max(120).optional(), phone: z.string().trim().max(25).optional(), code: z.string().trim().regex(/^\d{6}$/) });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Escribe los 6 dígitos del código." }, { status: 400 });
  const { email, phone, code } = parsed.data;
  const p = phone ? normalizeMxPhone(phone) : null;
  if (!p && !email) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  const kind = p ? "sms" : "email";
  const val = (p ?? email) as string;
  if (!(await verifyCode(identKey(kind, val), code))) return NextResponse.json({ error: "Código incorrecto o vencido. Pide uno nuevo." }, { status: 400 });
  const acc = await startSession(val, kind);
  return NextResponse.json({ ok: true, email: acc.email, whatsapp: acc.whatsapp, owner_kind: acc.owner_kind, channel: kind });
}
