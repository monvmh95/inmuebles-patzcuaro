import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { SITE_URL } from "./config";

// Llaves de acceso (WebAuthn): Windows Hello, huella, Face ID. La biometría nunca sale del dispositivo;
// aquí solo se guarda la llave pública. El reto se guarda en una cookie firmada y de corta vida.
export const RP_NAME = "Inmuebles Pátzcuaro";
export const rpID = () => new URL(SITE_URL).hostname;
export const rpOrigin = () => new URL(SITE_URL).origin;

const CH_COOKIE = "inm_wa";
const secret = () => process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || "inm";
const sign = (v: string) => createHmac("sha256", secret()).update(v).digest("base64url");

export async function setChallenge(challenge: string, purpose: "reg" | "auth", bind = ""): Promise<void> {
  const payload = Buffer.from(JSON.stringify({ c: challenge, p: purpose, b: bind, e: Date.now() + 5 * 60_000 })).toString("base64url");
  (await cookies()).set(CH_COOKIE, `${payload}.${sign(payload)}`, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/api/cuenta/passkey", maxAge: 300 });
}

/** Devuelve el reto (de un solo uso) si la cookie es válida, no venció y coincide con el propósito. */
export async function takeChallenge(purpose: "reg" | "auth", bind = ""): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(CH_COOKIE)?.value;
  jar.delete(CH_COOKIE);
  if (!raw) return null;
  const [payload, mac] = raw.split(".");
  if (!payload || !mac) return null;
  const good = sign(payload);
  if (mac.length !== good.length || !timingSafeEqual(Buffer.from(mac), Buffer.from(good))) return null;
  try {
    const j = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (j.p !== purpose || j.b !== bind || j.e < Date.now()) return null;
    return String(j.c);
  } catch { return null; }
}
