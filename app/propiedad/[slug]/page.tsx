import Link from "next/link";
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
import { CITY, OPERATIONS, SITE_URL, TYPES } from "@/lib/config";
import { query } from "@/lib/db";
import { getBySlug, listProperties } from "@/lib/properties";
import { breadcrumbJsonLd, JsonLd, propertyJsonLd, propertyTitle } from "@/lib/seo";
import { safe } from "@/lib/safe";
import { formatDate, formatPrice, isBot, pricePerM2, timeAgo, whatsappUrl } from "@/lib/util";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await safe(() => getBySlug(slug), null);
  if (!p) return { title: "Propiedad no disponible", robots: { index: false } };
  const desc = `${formatPrice(p.price, p.operation)}. ${p.description.replace(/\s+/g, " ").slice(0, 140)}…`;
  return {
    title: `${p.title} | ${propertyTitle(p)}`,
    description: desc,
    alternates: { canonical: `/propiedad/${p.slug}` },
    openGraph: { title: p.title, description: desc, type: "article" },
  };
}

export default async function PropertyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await safe(() => getBySlug(slug), null);
  if (!p) notFound();

  const ua = (await headers()).get("user-agent");
  if (!isBot(ua)) after(async () => { await query(`UPDATE properties SET views = views + 1 WHERE id = $1`, [p.id]).catch(() => {}); });

  const similar = (await safe(() => listProperties({ operation: p.operation, colonia_slug: p.colonia_slug, limit: 4 }), [])).filter((x) => x.id !== p.id).slice(0, 3);
  const wa = whatsappUrl(p.whatsapp, `Hola, vi tu anuncio "${p.title}" en Inmuebles Pátzcuaro y me interesa. ¿Sigue disponible?`);
  const typeSlug = TYPES[p.type].slug;

  return (
    <>
      <style>{`.main{padding-bottom:110px}@media(min-width:900px){.main{padding-bottom:56px}}`}</style>
      <div className="sticky-cta">
        <span className="sticky-price">{formatPrice(p.price, p.operation)}</span>
        <WhatsAppButton slug={p.slug} href={wa} />
      </div>
      <nav className="crumbs" aria-label="Migas de pan">
        <Link href="/">Inicio</Link> › <Link href={`/${p.operation}`}>{OPERATIONS[p.operation].label}</Link> ›{" "}
        <Link href={`/${p.operation}/${typeSlug}`}>{TYPES[p.type].plural}</Link> ›{" "}
        <Link href={`/${p.operation}/${typeSlug}/${p.colonia_slug}`}>{p.colonia}</Link>
      </nav>

      <div className="detail">
        <div>
          <Gallery photos={p.photos} title={p.title} label={propertyTitle(p)} />

          <div className="row" style={{ marginTop: 20, justifyContent: "space-between", flexWrap: "nowrap", alignItems: "flex-start" }}>
            <h1 style={{ margin: 0 }}>{p.title}</h1>
            <FavoriteButton slug={p.slug} className="fav-inline" />
          </div>
          <p className="muted">{propertyTitle(p)}</p>
          <div className="prose">{p.description}</div>
          {p.lake_view && <p><span className="verified" style={{ color: "var(--rebozo)", borderColor: "var(--rebozo)" }}>Vista al lago</span></p>}
          {p.lat != null && p.lng != null && (
            <section aria-label="Zona aproximada">
              <h2 style={{ marginTop: 24 }}>Zona aproximada</h2>
              <ZoneMap lat={p.lat} lng={p.lng} />
              <p className="muted small">El área marcada es aproximada. Pide la dirección exacta al contactar al anunciante.</p>
            </section>
          )}
        </div>

        <aside className="aside">
          <div className="panel">
            <p className="price-big">{formatPrice(p.price, p.operation)}</p>
            {pricePerM2(p) != null && <p className="price-sub">≈ {formatPrice(pricePerM2(p), "venta")} por m²</p>}
            <div className="trust">
              {p.verified_at && <div className="trust-line"><VerifiedBadge link /> <span className="muted">Revisado por el sitio el {formatDate(p.verified_at)}</span></div>}
              <div className="trust-line"><span aria-hidden>🕒</span> Confirmado {timeAgo(p.confirmed_at)} por quien publica</div>
            </div>
            <ul className="facts">
              <li><b>{TYPES[p.type].label}</b>Tipo</li>
              <li><b>{OPERATIONS[p.operation].label}</b>Operación</li>
              {p.bedrooms != null && <li><b>{p.bedrooms}</b>Recámaras</li>}
              {p.bathrooms != null && <li><b>{p.bathrooms}</b>Baños</li>}
              {p.built_m2 != null && <li><b>{p.built_m2} m²</b>Construcción</li>}
              {p.land_m2 != null && <li><b>{p.land_m2} m²</b>Terreno</li>}
              <li><b>{p.colonia}</b>Zona</li>
              <li><b>{p.owner_kind === "dueno" ? "Dueño directo" : "Agente"}</b>Publica</li>
            </ul>
            <WhatsAppButton slug={p.slug} href={wa} />
            <div className="tip">
              <strong>Antes de pagar:</strong> visita la propiedad, confirma que quien te la muestra es el dueño o su representante y no hagas anticipos a desconocidos.{" "}
              <Link href="/guias/como-evitar-fraudes-al-rentar">Ver guía</Link>
            </div>
            <div className="share"><ShareButtons url={`${SITE_URL}/propiedad/${p.slug}`} title={p.title} /></div>
            <p className="muted small" style={{ marginTop: 12 }}>Publicado el {formatDate(p.approved_at ?? p.created_at)}</p>
            <ReportButton slug={p.slug} />
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="section">
          <h2>Más en {p.colonia}</h2>
          <div className="grid">{similar.map((x) => <PropertyCard key={x.id} p={x} />)}</div>
        </section>
      )}

      <JsonLd data={propertyJsonLd(p)} />
      <JsonLd data={breadcrumbJsonLd([
        { name: "Inicio", path: "/" },
        { name: OPERATIONS[p.operation].label, path: `/${p.operation}` },
        { name: TYPES[p.type].plural, path: `/${p.operation}/${typeSlug}` },
        { name: p.colonia, path: `/${p.operation}/${typeSlug}/${p.colonia_slug}` },
        { name: p.title, path: `/propiedad/${p.slug}` },
      ])} />
      <p className="muted small">Ubicación: {p.colonia}, {CITY}.</p>
    </>
  );
}
