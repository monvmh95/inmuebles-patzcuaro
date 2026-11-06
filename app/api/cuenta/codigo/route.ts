import { NextResponse } from "next/server";
import { z } from "zod";
import { createCode, identKey, noteCodeRequest } from "@/lib/account";
import { codeEmail, mailEnabled, sendMail } from "@/lib/mail";
import { OtpError, sendOtp, smsEnabled } from "@/lib/sms";
import { clientIpHash } from "@/lib/request";
import { normalizeMxPhone } from "@/lib/util";

export const runtime = "nodejs";
const schema = z.object({
  email: z.string().trim().email().max(120).optional(),
  phone: z.string().trim().max(25).optional(),
  channel: z.enum(["sms", "whatsapp", "voice"]).optional(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  const { email, phone, channel } = parsed.data;
  try {
    if (phone) {
      if (!smsEnabled()) return NextResponse.json({ error: "La verificación por SMS aún no está disponible." }, { status: 503 });
      const p = normalizeMxPhone(phone);
      if (!p) return NextResponse.json({ error: "El celular debe tener 10 dígitos (ej. 434 123 4567)." }, { status: 400 });
      await noteCodeRequest(identKey("sms", p), clientIpHash(req));
      await sendOtp(p, channel ?? "sms");
    } else if (email) {
      if (!mailEnabled()) return NextResponse.json({ error: "La verificación por correo aún no está disponible." }, { status: 503 });
      const code = await createCode(identKey("email", email), clientIpHash(req));
      await sendMail({ to: email, ...codeEmail(code) });
    } else return NextResponse.json({ error: "Escribe tu celular." }, { status: 400 });
  } catch (e) {
    if (e instanceof Error && e.message === "rate") return NextResponse.json({ error: "Pediste varios códigos seguidos. Espera unos minutos e intenta de nuevo." }, { status: 429 });
    if (e instanceof Error && e.message === "daily") return NextResponse.json({ error: "Hoy se agotaron los códigos. Intenta mañana o escríbenos." }, { status: 429 });
    if (e instanceof OtpError && e.kind === "throttled") return NextResponse.json({ error: "Espera 30 segundos antes de pedir otro código." }, { status: 429 });
    console.error("cuenta/codigo:", e);
    return NextResponse.json({ error: phone ? "No pudimos enviar el código. Revisa que el número esté bien e intenta de nuevo." : "No pudimos enviar el correo. Revisa que esté bien escrito e intenta de nuevo." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
