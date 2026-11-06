import { NextResponse } from "next/server";
import { z } from "zod";
import { startSession, verifyCode } from "@/lib/account";
import { normalizeEmail } from "@/lib/util";

export const runtime = "nodejs";
const schema = z.object({ email: z.string().trim().email().max(120), code: z.string().trim().regex(/^\d{6}$/) });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Escribe los 6 dígitos del código." }, { status: 400 });
  const { email, code } = parsed.data;
  if (!(await verifyCode(normalizeEmail(email), code))) return NextResponse.json({ error: "Código incorrecto o vencido. Pide uno nuevo." }, { status: 400 });
  const acc = await startSession(email);
  return NextResponse.json({ ok: true, email: acc.email, whatsapp: acc.whatsapp, owner_kind: acc.owner_kind });
}
