// Verificación OTP con smsmasivos.com.mx (POST /v2/otp y /v2/otp/verify, cabecera `apikey`).
// La API genera, envía, expira y valida el código; nosotros solo llevamos límites y la sesión.
// Sin SMS_API_KEY la verificación por SMS queda apagada.
export const smsEnabled = () => Boolean(process.env.SMS_API_KEY);

/** Tope diario global de códigos enviados: protege el saldo de abusos. */
export const SMS_DAILY_MAX = Math.max(10, Math.floor(Number(process.env.SMS_DAILY_MAX ?? 150)) || 150);

export type OtpChannel = "sms" | "whatsapp" | "voice";
const base = () => process.env.SMS_API_URL || "https://api.smsmasivos.com.mx";
const headers = () => ({ apikey: process.env.SMS_API_KEY || "", "content-type": "application/json" });

// Sin acentos ni emoji (GSM-7); con el código y la empresa sustituidos debe medir menos de 160.
const COMPANY = "Inmuebles Patzcuaro";
const MESSAGE = "{{code}} es tu codigo de {{company}}. Vence pronto, no lo compartas.";

export class OtpError extends Error {
  constructor(public kind: "throttled" | "credits" | "failed", msg: string) { super(msg); }
}

export async function sendOtp(phone10: string, channel: OtpChannel = "sms"): Promise<void> {
  if (!smsEnabled()) throw new OtpError("failed", "SMS no configurado");
  const res = await fetch(`${base()}/v2/otp`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ phone_number: phone10, country_code: "52", company: COMPANY, message: MESSAGE, channel }),
    signal: AbortSignal.timeout(12_000),
  });
  if (res.ok) return;
  const body = await res.text().catch(() => "");
  console.error("otp send:", res.status, body.slice(0, 300));
  if (res.status === 429) throw new OtpError("throttled", "throttled");
  if (res.status === 402) throw new OtpError("credits", "credits");
  throw new OtpError("failed", `OTP ${res.status}`);
}

/** true si el código es correcto; false si es incorrecto, expiró o se agotaron los intentos. */
export async function verifyOtp(phone10: string, code: string): Promise<boolean> {
  const res = await fetch(`${base()}/v2/otp/verify`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ phone_number: phone10, country_code: "52", code }),
    signal: AbortSignal.timeout(12_000),
  });
  if (res.status !== 200 && res.status !== 401 && res.status !== 404 && res.status !== 410 && res.status !== 429) {
    console.error("otp verify:", res.status, (await res.text().catch(() => "")).slice(0, 200));
  }
  return res.status === 200;
}
