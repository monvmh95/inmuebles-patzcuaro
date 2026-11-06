import type { MetadataRoute } from "next";
import { OPERATIONS, SITE_URL, TYPES, type Operation, type PropType } from "@/lib/config";
import { hasDb } from "@/lib/db";
import { listAllSlugs, listLandingCombos } from "@/lib/properties";
import { listColoniaSlugsWithContent } from "@/lib/colonias";
import { localizePath } from "@/lib/i18n";

export const dynamic = "force-dynamic";

/** Cada URL se publica en español e inglés, con hreflang cruzado. */
function dual(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  return entries.flatMap((e) => {
    const path = e.url.replace(SITE_URL, "") || "/";
    const es = `${SITE_URL}${path}`;
    const en = `${SITE_URL}${localizePath("en", path)}`;
    const alternates = { languages: { "es-MX": es, en } };
    return [{ ...e, url: es, alternates }, { ...e, url: en, alternates }];
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return dual(await build());
}

async function build(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const out: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/publicar`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/guias/como-evitar-fraudes-al-rentar`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/guias`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/guias/comprar-terreno-en-patzcuaro`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/guias/rentar-por-temporada-en-patzcuaro`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/guias/vivir-en-patzcuaro`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/mapa`, changeFrequency: "daily", priority: 0.6 },
    { url: `${SITE_URL}/verificacion`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/guias/colonias`, changeFrequency: "weekly", priority: 0.7 },
    ...(Object.keys(OPERATIONS) as Operation[]).map((o) => ({ url: `${SITE_URL}/${o}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.8 })),
  ];
  if (!hasDb()) return out;
  try {
    const [slugs, combos] = await Promise.all([listAllSlugs(), listLandingCombos()]);
    const seen = new Set<string>();
    for (const c of combos) {
      const t = TYPES[c.type as PropType]?.slug;
      if (!t) continue;
      for (const path of [`/${c.operation}/${t}`, `/${c.operation}/${t}/${c.colonia_slug}`]) {
        if (!seen.has(path)) { seen.add(path); out.push({ url: `${SITE_URL}${path}`, lastModified: now, changeFrequency: "daily", priority: 0.7 }); }
      }
    }
    const cols = await listColoniaSlugsWithContent().catch(() => []);
    for (const c of cols) out.push({ url: `${SITE_URL}/colonias/${c.colonia_slug}`, lastModified: new Date(c.updated_at), changeFrequency: "monthly", priority: 0.7 });
    for (const s of slugs) out.push({ url: `${SITE_URL}/propiedad/${s.slug}`, lastModified: new Date(s.updated), changeFrequency: "weekly", priority: 0.6 });
  } catch (e) {
    console.error("[sitemap]", e);
  }
  return out;
}
