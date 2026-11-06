import L from "@/components/L";
import type { Metadata } from "next";
import PropertyCard from "@/components/PropertyCard";
import SearchBar from "@/components/SearchBar";
import { PortalesHero } from "@/components/Art";
import Countdown from "@/components/Countdown";
import { CITY, KING_ENABLED, STATE, TYPES, isOperation, typeFromSlug, type Operation, type PropType } from "@/lib/config";
import { getLang, tf } from "@/lib/lang";
import { localizeTitles } from "@/lib/ai";
import { alternatesFor } from "@/lib/alternates";
import { hasDb } from "@/lib/db";
import { getCurrentKing } from "@/lib/king";
import { countsByOperation, listColonias, listProperties } from "@/lib/properties";
import { itemListJsonLd, JsonLd } from "@/lib/seo";
import { safe } from "@/lib/safe";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  const t = tf(lang);
  return {
    title: { absolute: t(`Propiedades en renta y venta en ${CITY}, ${STATE} | Inmuebles Pátzcuaro`, `Properties for rent and sale in ${CITY}, ${STATE} | Inmuebles Pátzcuaro`) },
    description: t(
      `Casas, departamentos, terrenos, locales y cuartos en renta, venta y traspaso en ${CITY}, ${STATE}. Contacta directo con dueños por WhatsApp. Publicar es gratis.`,
      `Houses, apartments, land, commercial space and rooms for rent, sale and transfer in ${CITY}, ${STATE}, Mexico. Contact owners directly on WhatsApp. Listing is free.`,
    ),
    alternates: alternatesFor(lang, "/"),
  };
}

type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

const FAQ = {
  es: [
    { q: "¿Publicar una propiedad cuesta algo?", a: "No. Publicar es gratis. Solo necesitas fotos, una descripción y tu WhatsApp." },
    { q: "¿Cómo contacto al dueño?", a: "Cada anuncio tiene un botón de WhatsApp que te comunica directo con quien publicó. No hay intermediarios ni comisiones por parte del sitio." },
    { q: "¿Cómo evito fraudes al rentar?", a: "Visita la propiedad antes de pagar, verifica que quien te la muestra sea el dueño o su representante y no hagas depósitos por adelantado a desconocidos. Lee nuestra guía para más recomendaciones." },
    { q: "¿Qué zonas cubre el sitio?", a: `Por ahora ${CITY}, ${STATE} y sus colonias.` },
  ],
  en: [
    { q: "Does it cost anything to list a property?", a: "No. Listing is free. You only need photos, a description and your WhatsApp number." },
    { q: "How do I contact the owner?", a: "Every listing has a WhatsApp button that connects you directly with the person who posted it. There are no intermediaries and the site charges no commission." },
    { q: "How do I avoid rental scams?", a: "Visit the property before paying, make sure the person showing it is the owner or their representative, and never send deposits in advance to strangers. Read our guide for more tips." },
    { q: "What areas does the site cover?", a: `For now ${CITY}, ${STATE} and its neighborhoods.` },
  ],
};

export default async function Home({ searchParams }: { searchParams: Promise<SP> }) {
  const lang = await getLang();
  const t = tf(lang);
  const faq = FAQ[lang];
  const sp = await searchParams;
  const op = first(sp.op), type = first(sp.type), colonia = first(sp.colonia), q = first(sp.q).slice(0, 60);
  const max = Number(first(sp.max)) || undefined;
  const lake = first(sp.lake) === "1";
  const filtering = Boolean(op || type || colonia || q || max || lake);

  const [list, colonias, counts, king] = await Promise.all([
    safe(() => listProperties({
      operation: isOperation(op) ? (op as Operation) : undefined,
      type: (typeFromSlug(type) ?? (type in TYPES ? (type as PropType) : undefined)) || undefined,
      colonia_slug: colonia || undefined,
      maxPrice: max,
      q: q || undefined,
      lake: lake || undefined,
      limit: filtering ? 48 : 12,
    }), []),
    safe(() => listColonias(), []),
    safe(() => countsByOperation(), {} as Record<string, number>),
    KING_ENABLED ? safe(() => getCurrentKing(), null) : Promise.resolve(null),
  ]);

  const list2 = await safe(() => localizeTitles(king ? list.filter((p) => p.id !== king.property.id) : list, lang), king ? list.filter((p) => p.id !== king.property.id) : list);

  return (
    <>
      <section className="hero">
        <div>
          <span className="eyebrow">{t("Pueblo Mágico · Michoacán", "Pueblo Mágico · Michoacán, Mexico")}</span>
          <h1>{t("Tu próximo hogar en ", "Your next home in ")}<em>{CITY}</em>{t(", directo con el dueño", ", direct from the owner")}</h1>
          <p className="hero-lede">{t("Renta, venta, traspaso y hospedaje en Pátzcuaro. Contacta directo por WhatsApp, sin comisiones del sitio.", "Rentals, sales, business transfers and lodging in Pátzcuaro. Contact owners and hosts directly on WhatsApp, no site commission.")}</p>
          <SearchBar op={op} type={type} colonia={colonia} max={max} lake={lake} colonias={colonias} />
          <div className="chips">
            <L className="chip" href="/renta/casas">{t("Casas en renta", "Houses for rent")}</L>
            <L className="chip" href="/hospedaje">{t("Hospedaje", "Lodging")}</L>
            <L className="chip" href="/venta/terrenos">{t("Terrenos en venta", "Land for sale")}</L>
            <L className="chip" href="/renta/departamentos">{t("Departamentos en renta", "Apartments for rent")}</L>
            <L className="chip" href="/renta/locales">{t("Locales en renta", "Commercial space for rent")}</L>
            <L className="chip" href="/?lake=1">{t("Con vista al lago", "Lake view")}</L>
            <L className="chip" href="/mapa">{t("🗺 Ver en mapa", "🗺 View on map")}</L>
          </div>
        </div>
        <div className="hero-art" aria-hidden="false"><div className="arch-frame"><PortalesHero lang={lang} /></div></div>
      </section>

      {!hasDb() && (
        <div className="notice" role="status">
          <strong>{t("Modo configuración:", "Setup mode:")}</strong> {t("la base de datos aún no está conectada. Agrega la integración de Neon en Vercel y vuelve a desplegar.", "the database is not connected yet. Add the Neon integration in Vercel and redeploy.")}
        </div>
      )}

      {king && !filtering && (
        <section className="section" aria-labelledby="rey"><div className="king">
          <div className="king-head">
            <span className="king-tag">{t("Destacada", "Featured")}</span>
            <h2 id="rey">{t("Casa del día", "Property of the day")}</h2>
            <span className="small muted">{t("Termina en", "Ends in")} <Countdown endsAt={new Date(king.ends_at).toISOString()} /></span>
          </div>
          <div className="grid"><PropertyCard p={king.property} featured lang={lang} /></div>
        </div></section>
      )}

      <section className="section">
        <div className="section-head">
          <h2>{filtering ? t(`Resultados (${list2.length})`, `Results (${list2.length})`) : t("Publicadas recientemente", "Recently listed")}</h2>
          {!filtering && (
            <span className="muted small">
              {counts.renta ?? 0} {t("en renta", "for rent")} · {counts.venta ?? 0} {t("en venta", "for sale")} · {counts.traspaso ?? 0} {t("en traspaso", "for transfer")} · {counts.hospedaje ?? 0} {t("de hospedaje", "lodging")}
            </span>
          )}
        </div>
        {list2.length ? (
          <div className="grid">{list2.map((p) => <PropertyCard key={p.id} p={p} lang={lang} />)}</div>
        ) : (
          <div className="empty">
            <p><strong>{filtering ? t("No encontramos propiedades con esos filtros.", "No properties match those filters.") : t("Aún no hay propiedades publicadas.", "No properties listed yet.")}</strong></p>
            <p>{t("¿Tienes una casa, terreno o local? Sé el primero en publicarlo, es gratis.", "Do you have a house, land or commercial space? Be the first to list it, it is free.")}</p>
            <L href="/publicar" className="btn">{t("Publicar mi propiedad", "List my property")}</L>
          </div>
        )}
      </section>

      <section className="cta-band">
        <div>
          <h2>{t(`¿Tienes una propiedad en ${CITY}?`, `Do you have a property in ${CITY}?`)}</h2>
          <p>{t("Publícala gratis en minutos y recibe contactos directos por WhatsApp.", "List it for free in minutes and receive direct WhatsApp contacts.")}</p>
        </div>
        <L href="/publicar" className="btn">{t("Publicar gratis", "List for free")}</L>
      </section>

      <section className="section faq">
        <h2>{t("Preguntas frecuentes", "Frequently asked questions")}</h2>
        {faq.map((f) => (
          <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>
        ))}
      </section>

      {list2.length > 0 && <JsonLd data={itemListJsonLd(t(`Propiedades en ${CITY}`, `Properties in ${CITY}`), list2, lang)} />}
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />
    </>
  );
}
