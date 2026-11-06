import { NextResponse } from "next/server";
import { hasDb } from "@/lib/db";
import { listBySlugs } from "@/lib/properties";
import { localizeTitles } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!hasDb()) return NextResponse.json({ items: [] });
  const raw = new URL(req.url).searchParams.get("slugs") ?? "";
  const slugs = raw.split(",").map((s) => s.trim()).filter((s) => /^[a-z0-9-]{3,140}$/.test(s)).slice(0, 60);
  const lang = new URL(req.url).searchParams.get("lang") === "en" ? "en" : "es";
  const items = await localizeTitles(await listBySlugs(slugs).catch(() => []), lang);
  // Se omite el WhatsApp: las tarjetas no lo necesitan.
  return NextResponse.json({ items: items.map(({ whatsapp: _w, ...rest }) => rest) });
}
