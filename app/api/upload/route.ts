import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { query } from "@/lib/db";
import { clientIpHash } from "@/lib/request";
import { randomId } from "@/lib/util";

export const runtime = "nodejs";
const MAX_BYTES = 4 * 1024 * 1024; // límite de cuerpo de funciones en Vercel ~4.5 MB
const MAX_PER_HOUR = 40;
const MAX_PER_DAY_ALL = 1500; // tope global: nadie debe poder llenar el almacenamiento con muchas IPs

function sniff(buf: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && buf[8] === 0x57 && buf[9] === 0x45) return "image/webp";
  return null;
}

export async function POST(req: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "La subida de fotos aún no está configurada." }, { status: 503 });
  }
  const ip = clientIpHash(req);
  const [{ n }] = await query<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM uploads_log WHERE ip_hash = $1 AND created_at > now() - interval '1 hour'`,
    [ip],
  );
  const [{ d }] = await query<{ d: number }>(`SELECT COUNT(*)::int AS d FROM uploads_log WHERE created_at > now() - interval '24 hours'`);
  if (d >= MAX_PER_DAY_ALL) return NextResponse.json({ error: "Hoy se alcanzó el límite de fotos. Intenta mañana." }, { status: 429 });
  if (n >= MAX_PER_HOUR) return NextResponse.json({ error: "Demasiadas fotos en poco tiempo. Intenta más tarde." }, { status: 429 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Archivo inválido." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "La foto pesa más de 4 MB." }, { status: 413 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = sniff(bytes);
  if (!mime) return NextResponse.json({ error: "Solo se aceptan fotos JPG, PNG o WebP." }, { status: 415 });

  const ext = mime === "image/jpeg" ? "jpg" : mime === "image/png" ? "png" : "webp";
  const blob = await put(`propiedades/${Date.now()}-${randomId()}.${ext}`, new Blob([bytes], { type: mime }), {
    access: "public",
    contentType: mime,
    addRandomSuffix: true,
  });
  await query(`INSERT INTO uploads_log (ip_hash) VALUES ($1)`, [ip]);
  return NextResponse.json({ url: blob.url });
}
