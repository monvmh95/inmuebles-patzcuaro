import L from "@/components/L";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { after } from "next/server";
import type { Metadata } from "next";
import ReportButton from "@/components/ReportButton";
import WhatsAppButton from "@/components/WhatsAppButton";
import PropertyCard from "@/components/PropertyCard";
import Gallery from "@/components/Gallery";
import ShareButtons from "@/components/ShareButtons";
import VerifiedBadge from "@/components/VerifiedBadge";
import ZoneMap from "@/components/ZoneMap";
import FavoriteButton from "@/components/FavoriteButton";
import { CITY, SITE_URL, TYPES } from "@/lib/config";
import { getLang, tf, opLabel, typeLabel, typePlural } from "@/lib/lang";
import { localizePath } from "@/lib/i18n";
import { alternatesFor } from "@/lib/alternates";
import { translateText, localizeTitles } from "@/lib/ai";
import { query } from "@/lib/db";
import { getBySlug, listProperties } from "@/lib/properties";
import { breadcrumbJsonLd, JsonLd, propertyJsonLd, propertyTitle } from "@/lib/seo";
import { safe } from "@/lib/safe";
import { formatDate, formatPrice, isBot, pricePerM2, timeAgo, whatsappUrl } from "@/lib/util";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const lang = await getLang();
  const t = tf(lang);
  const p = await safe(() => getBySlug(slug), null);
  if (!p) return { title: t("Propiedad no disponible", "Property not available"), robots: { index: false } };
  const tx = lang === "en" ? { title: (await translateText(p.title, "en", "title")).text, description: (await translateText(p.description, "en", "description")).text } : { title: p.title, description: p.description };
  const desc = `${formatPrice(p.price, p.operation, lang)}. ${tx.description.replace(/\s+/g, " ").slice(0, 140)}…`;
  return {
    title: `${tx.title} | ${propertyTitle(p, lang)}`,
    description: desc,
    alternates: alternatesFor(lang, `/propiedad/${p.slug}`),
    openGraph: { title: tx.title, description: desc, type: "article" },
  };
}

export default async function PropertyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lang = await getLang();
  const t = tf(lang);
  const p = await safe(() => getBySlug(slug), null);
  if (!p) notFound();
  const [trTitle, trDesc] = lang === "en" ? await Promise.all([translateText(p.title, "en", "title"), translateText(p.description, "en", "description")]) : [{ text: p.title, translated: false }, { text: p.description, translated: false }];
  const tx = { title: trTitle.text, description: trDesc.text };
  const machine = trTitle.translated || trDesc.translated;

  const ua = (await headers()).get("user-agent");
  if (!isBot(ua)) after(async () => { await query(`UPDATE properties SET views = views + 1 WHERE id = $1`, [p.id]).catch(() => {}); });

  const similar = await localizeTitles((await safe(() => listProperties({ operation: p.operation, colonia_slug: p.colonia_slug, limit: 4 }), [])).filter((x) => x.id !== p.id).slice(0, 3), lang);
  const wa = whatsappUrl(p.whatsapp, `Hola, vi tu anuncio "${p.title}" en Inmuebles Pátzcuaro y me interesa. ¿Sigue disponible?${lang === "en" ? " (Message sent from the English site; I may write in English.)" : ""}`);
  const typeSlug = TYPES[p.type].slug;

  return (
    <>
      <style>{`.main{padding-bottom:110px}@media(min-width:900px){.main{padding-bottom:56px}}`}</style>
      <div className="sticky-cta">
        <span className="sticky-price">{formatPrice(p.price, p.operation, lang)}</span>
        <WhatsAppButton slug={p.slug} href={wa} />
      </div>
      <nav className="crumbs" aria-label={t("Migas de pan", "Breadcrumb")}>
        <L href="/">{t("Inicio", "Home")}</L> › <L href={`/${p.operation}`}>{opLabel(lang, p.operation)}</L> ›{" "}
        <L href={`/${p.operation}/${typeSlug}`}>{typePlural(lang, p.type)}</L> ›{" "}
        <L href={`/${p.operation}/${typeSlug}/${p.colonia_slug}`}>{p.colonia}</L>
      </nav>

      <div className="detail">
        <div>
          <Gallery photos={p.photos} title={tx.title} label={propertyTitle(p, lang)} />

          <div className="row" style={{ marginTop: 20, justifyContent: "space-between", flexWrap: "nowrap", alignItems: "flex-start" }}>
            <h1 style={{ margin: 0 }}>{tx.title}</h1>
            <FavoriteButton slug={p.slug} className="fav-inline" />
          </div>
          <p className="muted">{propertyTitle(p, lang)}</p>
          <div className="prose">{tx.description}</div>
          {lang === "en" && <p className="muted small">{machine ? "Automatic English translation of the listing written in Spanish by the owner or agent. Check details when you contact them." : "This listing was written in Spanish by the owner or agent. Automatic translation is not available for it right now."}</p>}
          {p.lake_view && <p><span className="verified" style={{ color: "var(--rebozo)", borderColor: "var(--rebozo)" }}>{t("Vista al lago", "Lake view")}</span></p>}
          {p.lat != null && p.lng != null && (
            <section aria-label={t("Zona aproximada", "Approximate area")}>
              <h2 style={{ marginTop: 24 }}>{t("Zona aproximada", "Approximate area")}</h2>
              <ZoneMap lat={p.lat} lng={p.lng} />
              <p className="muted small">{t("El área marcada es aproximada. Pide la dirección exacta al contactar al anunciante.", "The marked area is approximate. Ask for the exact address when you contact the advertiser.")}</p>
            </section>
          )}
        </div>

        <aside className="aside">
          <div className="panel">
            <p className="price-big">{formatPrice(p.price, p.operation, lang)}</p>
            {pricePerM2(p) != null && <p className="price-sub">≈ {formatPrice(pricePerM2(p), "venta", lang)} {t("por m²", "per m²")}</p>}
            <div className="trust">
              {p.verified_at && <div className="trust-line"><VerifiedBadge link lang={lang} /> <span className="muted">{t("Revisado por el sitio el", "Reviewed by the site on")} {formatDate(p.verified_at, lang)}</span></div>}
              <div className="trust-line"><span aria-hidden>🕒</span> {t("Confirmado", "Confirmed")} {timeAgo(p.confirmed_at, new Date(), lang)} {t("por quien publica", "by the advertiser")}</div>
            </div>
            <ul className="facts">
              <li><b>{typeLabel(lang, p.type)}</b>{t("Tipo", "Type")}</li>
              <li><b>{opLabel(lang, p.operation)}</b>{t("Operación", "Operation")}</li>
              {p.bedrooms != null && <li><b>{p.bedrooms}</b>{t("Recámaras", "Bedrooms")}</li>}
              {p.bathrooms != null && <li><b>{p.bathrooms}</b>{t("Baños", "Bathrooms")}</li>}
              {p.built_m2 != null && <li><b>{p.built_m2} m²</b>{t("Construcción", "Built area")}</li>}
              {p.land_m2 != null && <li><b>{p.land_m2} m²</b>{t("Terreno", "Lot size")}{p.land_dims ? <small> ({p.land_dims} m)</small> : null}</li>}
              <li><b>{p.colonia}</b>{t("Zona", "Area")}</li>
              <li><b>{p.owner_kind === "dueno" ? t("Dueño directo", "Direct owner") : t("Agente", "Agent")}</b>{t("Publica", "Posted by")}</li>
            </ul>
            <WhatsAppButton slug={p.slug} href={wa} />
            <div className="tip">
              <strong>{t("Antes de pagar:", "Before paying:")}</strong> {t("visita la propiedad, confirma que quien te la muestra es el dueño o su representante y no hagas anticipos a desconocidos.", "visit the property, confirm that the person showing it is the owner or their representative, and do not send deposits to strangers.")}{" "}
              <L href="/guias/como-evitar-fraudes-al-rentar">{t("Ver guía", "Read the guide")}</L>
            </div>
            <div className="share"><ShareButtons url={`${SITE_URL}${localizePath(lang, `/propiedad/${p.slug}`)}`} title={tx.title} /></div>
            <p className="muted small" style={{ marginTop: 12 }}>{t("Publicado el", "Posted on")} {formatDate(p.approved_at ?? p.created_at, lang)}</p>
            <ReportButton slug={p.slug} />
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="section">
          <h2>{t(`Más en ${p.colonia}`, `More in ${p.colonia}`)}</h2>
          <div className="grid">{similar.map((x) => <PropertyCard key={x.id} p={x} lang={lang} />)}</div>
        </section>
      )}

      <JsonLd data={propertyJsonLd(p, lang, tx)} />
      <JsonLd data={breadcrumbJsonLd([
        { name: t("Inicio", "Home"), path: "/" },
        { name: opLabel(lang, p.operation), path: `/${p.operation}` },
        { name: typePlural(lang, p.type), path: `/${p.operation}/${typeSlug}` },
        { name: p.colonia, path: `/${p.operation}/${typeSlug}/${p.colonia_slug}` },
        { name: tx.title, path: `/propiedad/${p.slug}` },
      ], lang)} />
      <p className="muted small">{t("Ubicación", "Location")}: {p.colonia}, {CITY}.</p>
    </>
  );
}
