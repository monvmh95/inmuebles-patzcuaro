// Envío de SMS con smsmasivos.com.mx (https://api.smsmasivos.com.mx/sms/send, cabecera `apikey`).
// Sin SMS_API_KEY la verificación por SMS queda apagada.
export const smsEnabled = () => Boolean(process.env.SMS_API_KEY);

/** Tope diario global de SMS de códigos: protege los créditos de abusos. */
export const SMS_DAILY_MAX = Math.max(10, Math.floor(Number(process.env.SMS_DAILY_MAX ?? 150)) || 150);

export async function sendSms(phone10: string, message: string): Promise<void> {
  const key = process.env.SMS_API_KEY;
  if (!key) throw new Error("SMS no configurado");
  const url = process.env.SMS_API_URL || "https://api.smsmasivos.com.mx/sms/send";
  const res = await fetch(url, {
    method: "POST",
    headers: { apikey: key, "content-type": "application/json" },
    body: JSON.stringify({ numbers: `52${phone10}`, message: message.slice(0, 160) }),
    signal: AbortSignal.timeout(10_000),
  });
  const body = await res.text().catch(() => "");
  let ok = res.ok;
  try { const j = JSON.parse(body); if (j && j.success === false) ok = false; } catch { /* no JSON */ }
  if (!ok) {
    console.error("sms: error", res.status, body.slice(0, 300));
    throw new Error(`SMS ${res.status}`);
  }
}

// Sin tildes ni emoji (alfabeto GSM, 160 caracteres).
export const codeSms = (code: string) => `${code} es tu codigo de Inmuebles Patzcuaro. Vence en 10 minutos. No lo compartas.`;
