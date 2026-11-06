"use server";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { prewarmTranslations } from "@/lib/ai";
import { redirect } from "next/navigation";
import { checkPassword, clearAdminCookie, isAdmin, setAdminCookie } from "@/lib/admin";
import { query } from "@/lib/db";
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
  // pequeña pausa para frenar fuerza bruta casual
  await new Promise((r) => setTimeout(r, 700));
  if (checkPassword(String(fd.get("password") ?? ""))) await setAdminCookie();
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
