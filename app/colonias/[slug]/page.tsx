import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PropertyCard from "@/components/PropertyCard";
import { CITY, OPERATIONS, STATE, TYPES } from "@/lib/config";
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
  const { content, name } = await load(slug);
  if (!name) return { title: "Colonia no encontrada", robots: { index: false } };
  const hasText = (content?.intro.trim().length ?? 0) >= 80;
  return {
    title: `Propiedades en ${name}, ${CITY}: renta y venta`,
    description: hasText ? content!.intro.replace(/\s+/g, " ").slice(0, 155) : `Casas, terrenos y locales en renta y venta en ${name}, ${CITY}, ${STATE}.`,
    alternates: { canonical: `/colonias/${slug}` },
    // Sin texto propio la página sería delgada: se muestra pero no se indexa.
    robots: hasText ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export default async function ColoniaPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const { content, stats, list, name } = await load(slug);
  if (!name) notFound();
  const paragraphs = (content?.intro ?? "").split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);

  return (
    <div className="stack">
      <nav className="crumbs" aria-label="Migas de pan">
        <Link href="/">Inicio</Link> › <Link href="/guias/colonias">Colonias</Link> › {name}
      </nav>
      <h1>Propiedades en {name}, {CITY}</h1>

      {paragraphs.length > 0 && (
        <section className="prose" aria-label={`Sobre ${name}`}>
          {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
          <p className="muted small">Texto editorial de Inmuebles Pátzcuaro. Si notas algún dato por corregir, escríbenos.</p>
        </section>
      )}

      {stats.length > 0 && (
        <div className="stats">
          {stats.map((s) => (
            <div key={s.operation} className="stat">
              <b>{s.total}</b>
              {OPERATIONS[s.operation as keyof typeof OPERATIONS]?.plural ?? s.operation}
              {s.min != null && <span className="muted small"><br />{s.min === s.max ? formatPrice(s.min, s.operation) : `${formatPrice(s.min, s.operation)} a ${formatPrice(s.max, s.operation)}`}</span>}
            </div>
          ))}
        </div>
      )}

      <section>
        <h2>Anuncios en {name}</h2>
        {list.length ? (
          <div className="grid">{list.map((p) => <PropertyCard key={p.id} p={p} />)}</div>
        ) : (
          <div className="empty"><p>No hay anuncios activos en esta colonia por ahora.</p><Link href="/publicar" className="btn">Publicar el primero</Link></div>
        )}
      </section>

      <section>
        <h2>Buscar por tipo en {name}</h2>
        <div className="chips">
          {(["renta", "venta"] as const).flatMap((op) =>
            (Object.keys(TYPES) as (keyof typeof TYPES)[]).map((t) => (
              <Link key={`${op}${t}`} className="chip" href={`/${op}/${TYPES[t].slug}/${slug}`}>{TYPES[t].plural} en {op}</Link>
            )),
          )}
        </div>
      </section>

      <JsonLd data={breadcrumbJsonLd([{ name: "Inicio", path: "/" }, { name: "Colonias", path: "/guias/colonias" }, { name, path: `/colonias/${slug}` }])} />
      {list.length > 0 && <JsonLd data={itemListJsonLd(`Propiedades en ${name}, ${CITY}`, list)} />}
    </div>
  );
}
