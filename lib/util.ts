import { createHash, randomBytes } from "crypto";

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function randomId(bytes = 3): string {
  return randomBytes(bytes).toString("hex");
}

export function newToken(): { token: string; hash: string } {
  const token = randomBytes(18).toString("base64url");
  return { token, hash: sha256(token) };
}

export function sha256(v: string): string {
  return createHash("sha256").update(v).digest("hex");
}

/** Devuelve 10 dígitos de un teléfono mexicano, o null si no es válido. */
export function normalizeMxPhone(raw: string): string | null {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("52") && d.length >= 12) d = d.slice(-10);
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
  return d.length === 10 ? d : null;
}

export function whatsappUrl(phone10: string, text: string): string {
  return `https://wa.me/52${phone10}?text=${encodeURIComponent(text)}`;
}

export function formatPrice(price: number | null, operation: string): string {
  if (price == null) return "Precio a tratar";
  const n = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(price);
  return operation === "renta" ? `${n} /mes` : n;
}

export function formatDate(d: Date | string): string {
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "America/Mexico_City" }).format(new Date(d));
}

const BOT_RE = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|headless|lighthouse|monitor/i;
export function isBot(userAgent: string | null): boolean {
  return !userAgent || BOT_RE.test(userAgent);
}
