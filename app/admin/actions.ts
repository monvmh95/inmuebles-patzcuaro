"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { sha256 } from "@/lib/util";
import { after } from "next/server";
import { prewarmTranslations } from "@/lib/ai";
import { redirect } from "next/navigation";
import { checkPassword, clearAdminCookie, isAdmin, setAdminCookie } from "@/lib/admin";
import { del } from "@vercel/blob";
import { startSession } from "@/lib/account";
import { query } from "@/lib/db";
import { normalizeMxPhone } from "@/lib/util";
import { scheduleKing } from "@/lib/king";
import { randomId, slugify } from "@/lib/util";
import { saveColoniaContent } from "@/lib/colonias";

async function guard() {
  if (!(await isAdmin())) redirect("/admin");
}
function id(fd: FormData) {
  const n = Number(fd.get("id"));
  if (!Number.isInteger(n) || n <= 0) throw new Error("id inválido");
  return n;
}
function refresh() {
  revalidatePath("/", "layout");
}

export async function login(fd: FormData) {
  await new Promise((r) => setTimeout(r, 700));
  const h = await headers();
  const ip = sha256(`${h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown"}|${process.env.SESSION_SECRET || "inm"}`);
  // Freno a la fuerza bruta: 5 fallos por IP cada 15 minutos (sin tope global, para que nadie pueda dejarte fuera a propósito).
  const [{ mine, all }] = await query<{ mine: number; all: number }>(
    `SELECT COUNT(*) FILTER (WHERE ip_hash = $1 AND created_at > now() - interval '15 minutes')::int AS mine, COUNT(*)::int AS all FROM admin_fails WHERE created_at > now() - interval '1 hour'`,
    [ip],
  ).catch(() => [{ mine: 0, all: 0 }]);
  if (mine >= 5) redirect("/admin?acceso=bloqueado");
  if (checkPassword(String(fd.get("password") ?? ""))) await setAdminCookie();
  else await query(`INSERT INTO admin_fails (ip_hash) VALUES ($1)`, [ip]).catch(() => {});
  redirect("/admin");
}
export async function logout() {
  await clearAdminCookie();
  redirect("/admin");
}
export async function approve(fd: FormData) {
  await guard();
  const pid = id(fd);
  await query(`UPDATE properties SET status='approved', approved_at=now(), confirmed_at=now() WHERE id=$1`, [pid]);
  // Deja lista la traducción al inglés (si hay IA configurada) sin hacer esperar al moderador.
  after(async () => {
    const r = await query<{ title: string; description: string }>(`SELECT title, description FROM properties WHERE id=$1`, [pid]).catch(() => []);
    if (r[0]) await prewarmTranslations(r[0].title, r[0].description).catch(() => {});
  });
  refresh();
}
export async function setPrice(fd: FormData) {
  await guard();
  const raw = String(fd.get("price") ?? "").replace(/[^\d]/g, "");
  const price = raw === "" ? null : Number(raw);
  if (price != null && (!Number.isInteger(price) || price < 0 || price > 2_000_000_000)) throw new Error("precio inválido");
  await query(`UPDATE properties SET price=$2 WHERE id=$1`, [id(fd), price]);
  refresh();
}
export async function savePublisher(fd: FormData) {
  await guard();
  const wa = String(fd.get("whatsapp") ?? "").replace(/\D/g, "");
  if (wa.length !== 10) throw new Error("whatsapp inválido");
  const rawLimit = String(fd.get("limit") ?? "").trim();
  const limit = rawLimit === "" ? null : Number(rawLimit);
  if (limit != null && (!Number.isInteger(limit) || limit < 0 || limit > 100_000)) throw new Error("límite inválido");
  const note = String(fd.get("note") ?? "").trim().slice(0, 300) || null;
  const blocked = fd.get("blocked") === "on";
  await query(
    `INSERT INTO publishers (whatsapp, listing_limit, blocked, note, updated_at) VALUES ($1,$2,$3,$4,now())
     ON CONFLICT (whatsapp) DO UPDATE SET listing_limit=$2, blocked=$3, note=$4, updated_at=now()`,
    [wa, limit, blocked, note],
  );
  // El mismo ajuste vale para los correos que esa persona ha usado.
  const mails = await query<{ e: string }>(`SELECT DISTINCT email_norm AS e FROM properties WHERE whatsapp = $1 AND email_norm IS NOT NULL`, [wa]);
  for (const { e } of mails) {
    await query(
      `INSERT INTO publishers (whatsapp, listing_limit, blocked, note, updated_at) VALUES ($1,$2,$3,$4,now())
       ON CONFLICT (whatsapp) DO UPDATE SET listing_limit=$2, blocked=$3, note=$4, updated_at=now()`,
      [e, limit, blocked, note],
    );
  }
  refresh();
}
export async function reject(fd: FormData) {
  await guard();
  await query(`UPDATE properties SET status='rejected' WHERE id=$1`, [id(fd)]);
  refresh();
}
export async function verify(fd: FormData) {
  await guard();
  await query(`UPDATE properties SET verified_at=now() WHERE id=$1`, [id(fd)]);
  refresh();
}
export async function unverify(fd: FormData) {
  await guard();
  await query(`UPDATE properties SET verified_at=NULL WHERE id=$1`, [id(fd)]);
  refresh();
}
export async function archive(fd: FormData) {
  await guard();
  await query(`UPDATE properties SET status='archived' WHERE id=$1`, [id(fd)]);
  refresh();
}
export async function resolveReport(fd: FormData) {
  await guard();
  await query(`UPDATE reports SET resolved=true WHERE id=$1`, [id(fd)]);
  refresh();
}
export async function handleSuggestion(fd: FormData) {
  await guard();
  await query(`UPDATE suggestions SET handled=true WHERE id=$1`, [id(fd)]);
  refresh();
}
/** Solo para pruebas internas: agenda un turno de Rey sin cobro. */
export async function grantKing(fd: FormData) {
  await guard();
  await scheduleKing(id(fd), `admin-${randomId(6)}`, "admin");
  refresh();
}

export async function saveColonia(fd: FormData) {
  await guard();
  const name = String(fd.get("name") ?? "").trim().slice(0, 60);
  const intro = String(fd.get("intro") ?? "").trim().slice(0, 4000);
  const slug = slugify(String(fd.get("slug") || name));
  if (!name || !slug) return;
  await saveColoniaContent(slug, name, intro);
  refresh();
}

/** Borra TODOS los anuncios (y sus fotos). Pide escribir BORRAR. Conserva cuentas, sesiones, límites y sugerencias. */
export async function deleteAllListings(fd: FormData) {
  await guard();
  if (String(fd.get("confirm") ?? "").trim() !== "BORRAR") redirect("/admin?borrado=cancelado");
  const rows = await query<{ photos: string[] | null }>(`SELECT photos FROM properties`);
  const urls = rows.flatMap((r) => r.photos ?? []).filter((u) => typeof u === "string" && u.includes(".public.blob.vercel-storage.com/"));
  const deleted = await query<{ id: number }>(`DELETE FROM properties RETURNING id`);
  for (let i = 0; i < urls.length; i += 100) await del(urls.slice(i, i + 100)).catch((e) => console.error("blob del:", e));
  refresh();
  redirect(`/admin?borrado=${deleted.length}`);
}

/** Solo admin: abre en ESTE navegador una sesión de cuenta (como si hubiera verificado ese celular por SMS), sin gastar créditos. Para pruebas y soporte. */
export async function openTestSession(fd: FormData) {
  await guard();
  const phone = normalizeMxPhone(String(fd.get("phone") ?? ""));
  if (!phone) redirect("/admin?sesion=invalida");
  await startSession(phone, "sms");
  console.warn("admin: sesión de prueba abierta para", phone.slice(0, 3) + "****" + phone.slice(-2));
  redirect("/publicar");
}
