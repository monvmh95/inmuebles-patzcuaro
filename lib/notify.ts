import { SITE_URL } from "./config";

/**
 * Avisa al administrador en su celular (notificación push gratuita con ntfy.sh).
 * Se activa con NTFY_TOPIC (un nombre largo y secreto). Nunca rompe el flujo que lo llama.
 * Solo viaja el título del anuncio y un enlace al panel; no se envían teléfonos ni datos personales.
 */
export async function notifyAdmin(title: string, message: string, path = "/admin"): Promise<void> {
  const topic = process.env.NTFY_TOPIC;
  if (!topic) return;
  try {
    const base = process.env.NTFY_URL || "https://ntfy.sh";
    await fetch(base, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ topic, title: title.slice(0, 100), message: message.slice(0, 300), click: `${SITE_URL}${path}`, tags: ["house"], priority: 4 }),
      signal: AbortSignal.timeout(4000),
    });
  } catch (e) {
    console.error("notifyAdmin:", e instanceof Error ? e.message : e);
  }
}
