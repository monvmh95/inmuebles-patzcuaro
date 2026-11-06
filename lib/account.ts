import { randomInt } from "crypto";
import { cookies } from "next/headers";
import { query } from "./db";
import { newToken, normalizeEmail, sha256 } from "./util";
import { SMS_DAILY_MAX } from "./sms";

export const SESSION_COOKIE = "inm_sess";
const SESSION_DAYS = 180; // "recordar este dispositivo": se renueva cada vez que entras
const CODE_MINUTES = 10;

export type Account = { email_norm: string; email: string; whatsapp: string | null; owner_kind: string | null };

const pepper = () => process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || "inm";
const codeHash = (emailNorm: string, code: string) => sha256(`${emailNorm}|${code}|${pepper()}`);

/** Crea un código de 6 dígitos. Lanza "rate" si se piden demasiados. */
export async function createCode(emailNorm: string, ipHash: string): Promise<string> {
  const [{ a, b }] = await query<{ a: number; b: number }>(
    `SELECT COUNT(*) FILTER (WHERE email_norm = $1 AND created_at > now() - interval '10 minutes')::int AS a,
            COUNT(*) FILTER (WHERE ip_hash = $2 AND created_at > now() - interval '1 hour')::int AS b
       FROM email_codes WHERE created_at > now() - interval '1 hour'`,
    [emailNorm, ipHash],
  );
  if (a >= 3 || b >= 12) throw new Error("rate");
  if (emailNorm.startsWith("tel:")) {
    // Cada SMS cuesta: tope diario global para que nadie agote los créditos.
    const [{ d }] = await query<{ d: number }>(`SELECT COUNT(*)::int AS d FROM email_codes WHERE email_norm LIKE 'tel:%' AND created_at > now() - interval '24 hours'`);
    if (d >= SMS_DAILY_MAX) throw new Error("daily");
  }
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await query(
    `INSERT INTO email_codes (email_norm, code_hash, ip_hash, expires_at) VALUES ($1,$2,$3, now() + ($4 || ' minutes')::interval)`,
    [emailNorm, codeHash(emailNorm, code), ipHash, String(CODE_MINUTES)],
  );
  return code;
}

/** Comprueba el código más reciente (máx. 5 intentos, un solo uso). */
export async function verifyCode(emailNorm: string, code: string): Promise<boolean> {
  const rows = await query<{ id: number; code_hash: string; attempts: number }>(
    `SELECT id, code_hash, attempts FROM email_codes WHERE email_norm = $1 AND NOT used AND expires_at > now() ORDER BY id DESC LIMIT 1`,
    [emailNorm],
  );
  const r = rows[0];
  if (!r || r.attempts >= 5) return false;
  await query(`UPDATE email_codes SET attempts = attempts + 1 WHERE id = $1`, [r.id]);
  if (r.code_hash !== codeHash(emailNorm, code.trim())) return false;
  await query(`UPDATE email_codes SET used = true WHERE id = $1`, [r.id]);
  return true;
}

/** Clave de identidad: correo normalizado, o "tel:<10 dígitos>" cuando se confirmó por SMS. */
export const identKey = (kind: "email" | "sms", v: string) => (kind === "sms" ? `tel:${v}` : normalizeEmail(v));
export const isTelKey = (k: string) => k.startsWith("tel:");

export async function startSession(emailRaw: string, kind: "email" | "sms" = "email"): Promise<Account> {
  const email_norm = identKey(kind, emailRaw);
  const acc = await query<Account>(
    `INSERT INTO accounts (email_norm, email, whatsapp) VALUES ($1,$2,$3)
     ON CONFLICT (email_norm) DO UPDATE SET last_login_at = now() RETURNING email_norm, email, whatsapp, owner_kind`,
    [email_norm, kind === "sms" ? emailRaw : emailRaw.trim(), kind === "sms" ? emailRaw : null],
  );
  const { token, hash } = newToken();
  await query(`INSERT INTO sessions (token_hash, email_norm, expires_at) VALUES ($1,$2, now() + ($3 || ' days')::interval)`, [hash, email_norm, String(SESSION_DAYS)]);
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * SESSION_DAYS });
  return acc[0];
}

export async function getSession(): Promise<Account | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 80) return null;
  const hash = sha256(token);
  const rows = await query<Account & { last_used_at: string }>(
    `SELECT a.email_norm, a.email, a.whatsapp, a.owner_kind, s.last_used_at
       FROM sessions s JOIN accounts a ON a.email_norm = s.email_norm
      WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [hash],
  );
  const r = rows[0];
  if (!r) return null;
  // Sesión deslizante: si sigue usando el sitio, no se vence.
  if (Date.now() - new Date(r.last_used_at).getTime() > 86_400_000) {
    await query(`UPDATE sessions SET last_used_at = now(), expires_at = now() + ($2 || ' days')::interval WHERE token_hash = $1`, [hash, String(SESSION_DAYS)]).catch(() => {});
  }
  return { email_norm: r.email_norm, email: r.email, whatsapp: r.whatsapp, owner_kind: r.owner_kind };
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await query(`DELETE FROM sessions WHERE token_hash = $1`, [sha256(token)]).catch(() => {});
  jar.delete(SESSION_COOKIE);
}
