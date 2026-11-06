import type { MetadataRoute } from "next";
import { OPERATIONS, SITE_URL, TYPES, type Operation, type PropType } from "@/lib/config";
import { hasDb } from "@/lib/db";
import { listAllSlugs, listLandingCombos } from "@/lib/properties";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const out: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/publicar`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/guias/como-evitar-fraudes-al-rentar`, changeFrequency: "monthly", priority: 0.7 },
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
    for (const s of slugs) out.push({ url: `${SITE_URL}/propiedad/${s.slug}`, lastModified: new Date(s.updated), changeFrequency: "weekly", priority: 0.6 });
  } catch (e) {
    console.error("[sitemap]", e);
  }
  return out;
}
