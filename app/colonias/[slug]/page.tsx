import L from "@/components/L";
import { getLang, tf, opPlural, typePlural } from "@/lib/lang";
import { alternatesFor } from "@/lib/alternates";
import { localizeTitles, translateText } from "@/lib/ai";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PropertyCard from "@/components/PropertyCard";
import { CITY, STATE, TYPES } from "@/lib/config";
import { coloniaStats, getColoniaContent } from "@/lib/colonias";
import { formatPrice } from "@/lib/format";
import { listProperties } from "@/lib/properties";
import { breadcrumbJsonLd, itemListJsonLd, JsonLd } from "@/lib/seo";
import { safe } from "@/lib/safe";

export const dynamic = "force-dynamic";
type Params = { slug: string };

async function load(slug: string) {
  const [content, stats, list] = await Promise.all([
    safe(() => getColoniaContent(slug), null),
    safe(() => coloniaStats(slug), []),
    safe(() => listProperties({ colonia_slug: slug, limit: 24 }), []),
  ]);
  const name = content?.name ?? list[0]?.colonia ?? null;
  return { content, stats, list, name };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const lang = await getLang();
  const t = tf(lang);
  const { content, name } = await load(slug);
  if (!name) return { title: t("Colonia no encontrada", "Neighborhood not found"), robots: { index: false } };
  const hasText = (content?.intro.trim().length ?? 0) >= 80;
  const intro = hasText ? (lang === "en" ? (await translateText(content!.intro, "en", "article")).text : content!.intro) : "";
  return {
    title: t(`Propiedades en ${name}, ${CITY}: renta y venta`, `Properties in ${name}, ${CITY}: rent and sale`),
    description: hasText ? intro.replace(/\s+/g, " ").slice(0, 155) : t(`Casas, terrenos y locales en renta y venta en ${name}, ${CITY}, ${STATE}.`, `Houses, land and commercial space for rent and sale in ${name}, ${CITY}, ${STATE}.`),
    alternates: alternatesFor(lang, `/colonias/${slug}`),
    // Sin texto propio la página sería delgada: se muestra pero no se indexa.
    robots: hasText ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export default async function ColoniaPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const lang = await getLang();
  const t = tf(lang);
  const loaded = await load(slug);
  const { content, stats, name } = loaded;
  if (!name) notFound();
  const list = await localizeTitles(loaded.list, lang);
  const intro = content?.intro ? (lang === "en" ? (await translateText(content.intro, "en", "article")).text : content.intro) : "";
  const paragraphs = intro.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);

  return (
    <div className="stack">
      <nav className="crumbs" aria-label={t("Migas de pan", "Breadcrumb")}>
        <L href="/">{t("Inicio", "Home")}</L> › <L href="/guias/colonias">{t("Colonias", "Neighborhoods")}</L> › {name}
      </nav>
      <h1>{t(`Propiedades en ${name}, ${CITY}`, `Properties in ${name}, ${CITY}`)}</h1>

      {paragraphs.length > 0 && (
        <section className="prose" aria-label={t(`Sobre ${name}`, `About ${name}`)}>
          {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
          <p className="muted small">{t("Texto editorial de Inmuebles Pátzcuaro. Si notas algún dato por corregir, escríbenos.", "Editorial text by Inmuebles Pátzcuaro, written in Spanish and automatically translated. If you notice anything to correct, let us know.")}</p>
        </section>
      )}

      {stats.length > 0 && (
        <div className="stats">
          {stats.map((s) => (
            <div key={s.operation} className="stat">
              <b>{s.total}</b>
              {opPlural(lang, s.operation as "renta" | "venta" | "traspaso")}
              {s.min != null && <span className="muted small"><br />{s.min === s.max ? formatPrice(s.min, s.operation, lang) : `${formatPrice(s.min, s.operation, lang)} ${t("a", "to")} ${formatPrice(s.max, s.operation, lang)}`}</span>}
            </div>
          ))}
        </div>
      )}

      <section>
        <h2>{t(`Anuncios en ${name}`, `Listings in ${name}`)}</h2>
        {list.length ? (
          <div className="grid">{list.map((p) => <PropertyCard key={p.id} p={p} lang={lang} />)}</div>
        ) : (
          <div className="empty"><p>{t("No hay anuncios activos en esta colonia por ahora.", "There are no active listings in this neighborhood right now.")}</p><L href="/publicar" className="btn">{t("Publicar el primero", "List the first one")}</L></div>
        )}
      </section>

      <section>
        <h2>{t(`Buscar por tipo en ${name}`, `Browse by type in ${name}`)}</h2>
        <div className="chips">
          {(["renta", "venta"] as const).flatMap((op) =>
            (Object.keys(TYPES) as (keyof typeof TYPES)[]).map((ty) => (
              <L key={`${op}${ty}`} className="chip" href={`/${op}/${TYPES[ty].slug}/${slug}`}>{typePlural(lang, ty)} {opPlural(lang, op)}</L>
            )),
          )}
        </div>
      </section>

      <JsonLd data={breadcrumbJsonLd([{ name: t("Inicio", "Home"), path: "/" }, { name: t("Colonias", "Neighborhoods"), path: "/guias/colonias" }, { name, path: `/colonias/${slug}` }], lang)} />
      {list.length > 0 && <JsonLd data={itemListJsonLd(t(`Propiedades en ${name}, ${CITY}`, `Properties in ${name}, ${CITY}`), list, lang)} />}
    </div>
  );
}
