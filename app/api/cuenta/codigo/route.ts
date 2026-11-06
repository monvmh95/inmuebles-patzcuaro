import { NextResponse } from "next/server";
import { z } from "zod";
import { createCode } from "@/lib/account";
import { codeEmail, mailEnabled, sendMail } from "@/lib/mail";
import { clientIpHash } from "@/lib/request";
import { normalizeEmail } from "@/lib/util";

export const runtime = "nodejs";
const schema = z.object({ email: z.string().trim().email().max(120) });

export async function POST(req: Request) {
  if (!mailEnabled()) return NextResponse.json({ error: "La verificación por correo aún no está disponible." }, { status: 503 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Escribe un correo válido." }, { status: 400 });
  const email = parsed.data.email;
  try {
    const code = await createCode(normalizeEmail(email), clientIpHash(req));
    await sendMail({ to: email, ...codeEmail(code) });
  } catch (e) {
    if (e instanceof Error && e.message === "rate") return NextResponse.json({ error: "Pediste varios códigos seguidos. Espera unos minutos e intenta de nuevo." }, { status: 429 });
    return NextResponse.json({ error: "No pudimos enviar el correo. Revisa que esté bien escrito e intenta de nuevo." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
