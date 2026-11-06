import L from "@/components/L";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PropertyCard from "@/components/PropertyCard";
import { CITY, STATE, TYPES, isOperation, typeFromSlug } from "@/lib/config";
import { getLang, tf, opLabel, opPlural, typePlural } from "@/lib/lang";
import type { Lang } from "@/lib/i18n";
import { alternatesFor } from "@/lib/alternates";
import { localizeTitles } from "@/lib/ai";
import { listColonias, listProperties } from "@/lib/properties";
import { breadcrumbJsonLd, itemListJsonLd, JsonLd } from "@/lib/seo";
import { safe } from "@/lib/safe";

export const dynamic = "force-dynamic";

type Params = { op: string; rest?: string[] };

function parse(p: Params) {
  if (!isOperation(p.op)) return null;
  const [typeSlug, coloniaSlug, ...extra] = p.rest ?? [];
  if (extra.length) return null;
  const type = typeSlug ? typeFromSlug(typeSlug) : undefined;
  if (typeSlug && !type) return null;
  if (coloniaSlug && !/^[a-z0-9-]{2,60}$/.test(coloniaSlug)) return null;
  return { op: p.op, type: type ?? undefined, coloniaSlug };
}

async function load(p: NonNullable<ReturnType<typeof parse>>) {
  const list = await safe(() => listProperties({ operation: p.op, type: p.type, colonia_slug: p.coloniaSlug, limit: 48 }), []);
  const coloniaName = p.coloniaSlug ? (list[0]?.colonia ?? p.coloniaSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())) : undefined;
  return { list, coloniaName };
}

function heading(p: NonNullable<ReturnType<typeof parse>>, lang: Lang, coloniaName?: string) {
  if (lang === "en") {
    const what = p.type ? typePlural(lang, p.type) : "Properties";
    return `${what} ${opPlural(lang, p.op)} in ${coloniaName ? `${coloniaName}, ` : ""}${CITY}`;
  }
  const what = p.type ? TYPES[p.type].plural : "Propiedades";
  return `${what} ${opPlural(lang, p.op)} en ${coloniaName ? `${coloniaName}, ` : ""}${CITY}`;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const p = parse(await params);
  if (!p) return {};
  const lang = await getLang();
  const t = tf(lang);
  const { list, coloniaName } = await load(p);
  const h = heading(p, lang, coloniaName);
  const path = `/${p.op}${p.type ? `/${TYPES[p.type].slug}` : ""}${p.coloniaSlug ? `/${p.coloniaSlug}` : ""}`;
  return {
    title: h,
    description: t(
      `${h}, ${STATE}. ${list.length ? `${list.length} anuncios disponibles.` : "Publica gratis o revisa nuevos anuncios."} Contacta directo por WhatsApp.`,
      `${h}, ${STATE}. ${list.length ? `${list.length} listings available.` : "List for free or check back for new listings."} Contact owners directly on WhatsApp.`,
    ),
    alternates: alternatesFor(lang, path),
    robots: list.length ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export default async function Landing({ params }: { params: Promise<Params> }) {
  const p = parse(await params);
  if (!p) notFound();
  const lang = await getLang();
  const t = tf(lang);
  const loaded = await load(p);
  const coloniaName = loaded.coloniaName;
  const list = await localizeTitles(loaded.list, lang);
  const colonias = await safe(() => listColonias(), []);
  const h = heading(p, lang, coloniaName);
  const crumbs = [{ name: t("Inicio", "Home"), path: "/" }, { name: opLabel(lang, p.op), path: `/${p.op}` }];
  if (p.type) crumbs.push({ name: typePlural(lang, p.type), path: `/${p.op}/${TYPES[p.type].slug}` });
  if (p.coloniaSlug && p.type) crumbs.push({ name: coloniaName ?? p.coloniaSlug, path: `/${p.op}/${TYPES[p.type].slug}/${p.coloniaSlug}` });

  return (
    <>
      <nav className="crumbs" aria-label={t("Migas de pan", "Breadcrumb")}>
        {crumbs.map((c, i) => (
          <span key={c.path}>{i > 0 && " › "}{i < crumbs.length - 1 ? <L href={c.path}>{c.name}</L> : c.name}</span>
        ))}
      </nav>
      <h1>{h}</h1>
      <p className="muted">{list.length ? t(`${list.length} ${list.length === 1 ? "anuncio" : "anuncios"} en ${CITY}, ${STATE}.`, `${list.length} ${list.length === 1 ? "listing" : "listings"} in ${CITY}, ${STATE}.`) : t("Todavía no hay anuncios en esta categoría.", "There are no listings in this category yet.")}</p>

      <div className="chips" style={{ margin: "12px 0 20px" }}>
        {(Object.keys(TYPES) as (keyof typeof TYPES)[]).map((ty) => (
          <L key={ty} className="chip" style={{ color: "var(--brand)", borderColor: "var(--line)", background: "var(--surface)" }} href={`/${p.op}/${TYPES[ty].slug}`}>
            {typePlural(lang, ty)}
          </L>
        ))}
      </div>

      {list.length ? (
        <div className="grid">{list.map((x) => <PropertyCard key={x.id} p={x} lang={lang} />)}</div>
      ) : (
        <div className="empty">
          <p>{t("Sé el primero en publicar aquí. Es gratis.", "Be the first to list here. It is free.")}</p>
          <L href="/publicar" className="btn">{t("Publicar mi propiedad", "List my property")}</L>
        </div>
      )}

      {p.type && !p.coloniaSlug && colonias.length > 0 && (
        <section className="section">
          <h2>{t("Por colonia", "By neighborhood")}</h2>
          <div className="chips">
            {colonias.map((c) => (
              <L key={c.colonia_slug} className="chip" style={{ color: "var(--brand)", borderColor: "var(--line)", background: "var(--surface)" }} href={`/${p.op}/${TYPES[p.type!].slug}/${c.colonia_slug}`}>
                {c.colonia} ({c.total})
              </L>
            ))}
          </div>
        </section>
      )}

      <JsonLd data={breadcrumbJsonLd(crumbs.map((c) => ({ name: c.name, path: c.path })), lang)} />
      {list.length > 0 && <JsonLd data={itemListJsonLd(h, list, lang)} />}
    </>
  );
}
