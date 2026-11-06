"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkPassword, clearAdminCookie, isAdmin, setAdminCookie } from "@/lib/admin";
import { query } from "@/lib/db";
import { scheduleKing } from "@/lib/king";
import { randomId } from "@/lib/util";

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
  await query(`UPDATE properties SET status='approved', approved_at=now(), confirmed_at=now() WHERE id=$1`, [id(fd)]);
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
