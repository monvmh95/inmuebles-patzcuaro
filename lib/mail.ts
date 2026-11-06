// Envío de correo con Resend. Sin RESEND_API_KEY la verificación por correo queda apagada
// y el sitio sigue funcionando como antes (el correo solo se pide, sin verificar).
export const mailEnabled = () => Boolean(process.env.RESEND_API_KEY);

export async function sendMail(opts: { to: string; subject: string; text: string; html: string }): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Correo no configurado");
  const url = process.env.RESEND_API_URL || "https://api.resend.com/emails";
  const from = process.env.MAIL_FROM || "Inmuebles Pátzcuaro <no-reply@inmueblespatzcuaro.com>";
  const res = await fetch(url, {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from, to: [opts.to], subject: opts.subject, text: opts.text, html: opts.html }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    console.error("mail: error", res.status, (await res.text().catch(() => "")).slice(0, 300));
    throw new Error(`Correo ${res.status}`);
  }
}

export function codeEmail(code: string): { subject: string; text: string; html: string } {
  return {
    subject: `${code} es tu código de Inmuebles Pátzcuaro`,
    text: `Tu código es ${code}\n\nEscríbelo en el sitio para confirmar tu correo. Vence en 10 minutos.\nSi tú no lo pediste, ignora este mensaje.`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:420px;margin:auto;padding:24px;color:#1d1817"><p style="margin:0 0 8px">Tu código de Inmuebles Pátzcuaro es</p><p style="font-size:34px;letter-spacing:6px;font-weight:700;margin:0 0 16px">${code}</p><p style="color:#6b5f5b;font-size:14px;margin:0">Escríbelo en el sitio para confirmar tu correo. Vence en 10 minutos. Si tú no lo pediste, ignora este mensaje.</p></div>`,
  };
}
