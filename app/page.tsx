import Link from "next/link";
import type { Metadata } from "next";
import PropertyCard from "@/components/PropertyCard";
import Countdown from "@/components/Countdown";
import { CITY, KING_ENABLED, OPERATIONS, STATE, TYPES, isOperation, typeFromSlug, type Operation, type PropType } from "@/lib/config";
import { hasDb } from "@/lib/db";
import { getCurrentKing } from "@/lib/king";
import { countsByOperation, listColonias, listProperties } from "@/lib/properties";
import { itemListJsonLd, JsonLd } from "@/lib/seo";
import { safe } from "@/lib/safe";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: `Propiedades en renta y venta en ${CITY}, ${STATE} | Inmuebles Pátzcuaro` },
  description: `Casas, departamentos, terrenos, locales y cuartos en renta, venta y traspaso en ${CITY}, ${STATE}. Contacta directo con dueños por WhatsApp. Publicar es gratis.`,
  alternates: { canonical: "/" },
};

type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

const FAQ = [
  { q: "¿Publicar una propiedad cuesta algo?", a: "No. Publicar es gratis. Solo necesitas fotos, una descripción y tu WhatsApp." },
  { q: "¿Cómo contacto al dueño?", a: "Cada anuncio tiene un botón de WhatsApp que te comunica directo con quien publicó. No hay intermediarios ni comisiones por parte del sitio." },
  { q: "¿Cómo evito fraudes al rentar?", a: "Visita la propiedad antes de pagar, verifica que quien te la muestra sea el dueño o su representante y no hagas depósitos por adelantado a desconocidos. Lee nuestra guía para más recomendaciones." },
  { q: "¿Qué zonas cubre el sitio?", a: `Por ahora ${CITY}, ${STATE} y sus colonias.` },
];

export default async function Home({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const op = first(sp.op), type = first(sp.type), colonia = first(sp.colonia), q = first(sp.q).slice(0, 60);
  const max = Number(first(sp.max)) || undefined;
  const filtering = Boolean(op || type || colonia || q || max);

  const [list, colonias, counts, king] = await Promise.all([
    safe(() => listProperties({
      operation: isOperation(op) ? (op as Operation) : undefined,
      type: (typeFromSlug(type) ?? (type in TYPES ? (type as PropType) : undefined)) || undefined,
      colonia_slug: colonia || undefined,
      maxPrice: max,
      q: q || undefined,
      limit: filtering ? 48 : 12,
    }), []),
    safe(() => listColonias(), []),
    safe(() => countsByOperation(), {} as Record<string, number>),
    KING_ENABLED ? safe(() => getCurrentKing(), null) : Promise.resolve(null),
  ]);

  const list2 = king ? list.filter((p) => p.id !== king.property.id) : list;

  return (
    <>
      <section className="hero">
        <h1>Casas y terrenos en {CITY}, directo con el dueño</h1>
        <p>Renta, venta y traspaso en {CITY}, {STATE}. Contacta por WhatsApp, sin comisiones del sitio.</p>
        <form className="search" action="/" method="get" role="search">
          <select name="op" defaultValue={op} aria-label="Operación">
            <option value="">Renta o venta</option>
            {Object.entries(OPERATIONS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select name="type" defaultValue={type} aria-label="Tipo">
            <option value="">Todo tipo</option>
            {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.plural}</option>)}
          </select>
          <select name="colonia" defaultValue={colonia} aria-label="Colonia">
            <option value="">Toda la ciudad</option>
            {colonias.map((c) => <option key={c.colonia_slug} value={c.colonia_slug}>{c.colonia}</option>)}
          </select>
          <input name="max" type="number" min={0} inputMode="numeric" placeholder="Precio máx. $" defaultValue={max} aria-label="Precio máximo" />
          <button className="btn">Buscar</button>
        </form>
        <div className="chips">
          <Link className="chip" href="/renta/casas">Casas en renta</Link>
          <Link className="chip" href="/venta/terrenos">Terrenos en venta</Link>
          <Link className="chip" href="/renta/departamentos">Departamentos en renta</Link>
          <Link className="chip" href="/renta/locales">Locales en renta</Link>
        </div>
      </section>

      {!hasDb() && (
        <div className="notice" role="status">
          <strong>Modo configuración:</strong> la base de datos aún no está conectada. Agrega la integración de Neon en Vercel y vuelve a desplegar.
        </div>
      )}

      {king && !filtering && (
        <section className="section" aria-labelledby="rey">
          <div className="king-head">
            <span className="king-tag">Rey del día</span>
            <h2 id="rey" style={{ margin: 0 }}>Propiedad destacada</h2>
            <span className="muted small">Termina en <Countdown endsAt={new Date(king.ends_at).toISOString()} /></span>
          </div>
          <div className="grid"><PropertyCard p={king.property} featured /></div>
        </section>
      )}

      <section className="section">
        <div className="section-head">
          <h2>{filtering ? `Resultados (${list2.length})` : "Publicadas recientemente"}</h2>
          {!filtering && (
            <span className="muted small">
              {counts.renta ?? 0} en renta · {counts.venta ?? 0} en venta · {counts.traspaso ?? 0} en traspaso
            </span>
          )}
        </div>
        {list2.length ? (
          <div className="grid">{list2.map((p) => <PropertyCard key={p.id} p={p} />)}</div>
        ) : (
          <div className="empty">
            <p><strong>{filtering ? "No encontramos propiedades con esos filtros." : "Aún no hay propiedades publicadas."}</strong></p>
            <p>¿Tienes una casa, terreno o local? Sé el primero en publicarlo, es gratis.</p>
            <Link href="/publicar" className="btn">Publicar mi propiedad</Link>
          </div>
        )}
      </section>

      <section className="cta-band">
        <div>
          <h2>¿Tienes una propiedad en {CITY}?</h2>
          <p>Publícala gratis en minutos y recibe contactos directos por WhatsApp.</p>
        </div>
        <Link href="/publicar" className="btn">Publicar gratis</Link>
      </section>

      <section className="section faq">
        <h2>Preguntas frecuentes</h2>
        {FAQ.map((f) => (
          <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>
        ))}
      </section>

      {list2.length > 0 && <JsonLd data={itemListJsonLd(`Propiedades en ${CITY}`, list2)} />}
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />
    </>
  );
}
