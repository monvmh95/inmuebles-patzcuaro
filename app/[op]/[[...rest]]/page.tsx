import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PropertyCard from "@/components/PropertyCard";
import { CITY, OPERATIONS, STATE, TYPES, isOperation, typeFromSlug } from "@/lib/config";
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

function heading(p: NonNullable<ReturnType<typeof parse>>, coloniaName?: string) {
  const what = p.type ? TYPES[p.type].plural : "Propiedades";
  return `${what} ${OPERATIONS[p.op].plural} en ${coloniaName ? `${coloniaName}, ` : ""}${CITY}`;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const p = parse(await params);
  if (!p) return {};
  const { list, coloniaName } = await load(p);
  const h = heading(p, coloniaName);
  const path = `/${p.op}${p.type ? `/${TYPES[p.type].slug}` : ""}${p.coloniaSlug ? `/${p.coloniaSlug}` : ""}`;
  return {
    title: h,
    description: `${h}, ${STATE}. ${list.length ? `${list.length} anuncios disponibles.` : "Publica gratis o revisa nuevos anuncios."} Contacta directo por WhatsApp.`,
    alternates: { canonical: path },
    robots: list.length ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export default async function Landing({ params }: { params: Promise<Params> }) {
  const p = parse(await params);
  if (!p) notFound();
  const { list, coloniaName } = await load(p);
  const colonias = await safe(() => listColonias(), []);
  const h = heading(p, coloniaName);
  const crumbs = [{ name: "Inicio", path: "/" }, { name: OPERATIONS[p.op].label, path: `/${p.op}` }];
  if (p.type) crumbs.push({ name: TYPES[p.type].plural, path: `/${p.op}/${TYPES[p.type].slug}` });
  if (p.coloniaSlug && p.type) crumbs.push({ name: coloniaName ?? p.coloniaSlug, path: `/${p.op}/${TYPES[p.type].slug}/${p.coloniaSlug}` });

  return (
    <>
      <nav className="crumbs" aria-label="Migas de pan">
        {crumbs.map((c, i) => (
          <span key={c.path}>{i > 0 && " › "}{i < crumbs.length - 1 ? <Link href={c.path}>{c.name}</Link> : c.name}</span>
        ))}
      </nav>
      <h1>{h}</h1>
      <p className="muted">{list.length ? `${list.length} ${list.length === 1 ? "anuncio" : "anuncios"} en ${CITY}, ${STATE}.` : "Todavía no hay anuncios en esta categoría."}</p>

      <div className="chips" style={{ margin: "12px 0 20px" }}>
        {(Object.keys(TYPES) as (keyof typeof TYPES)[]).map((t) => (
          <Link key={t} className="chip" style={{ color: "var(--brand)", borderColor: "var(--line)", background: "var(--surface)" }} href={`/${p.op}/${TYPES[t].slug}`}>
            {TYPES[t].plural}
          </Link>
        ))}
      </div>

      {list.length ? (
        <div className="grid">{list.map((x) => <PropertyCard key={x.id} p={x} />)}</div>
      ) : (
        <div className="empty">
          <p>Sé el primero en publicar aquí. Es gratis.</p>
          <Link href="/publicar" className="btn">Publicar mi propiedad</Link>
        </div>
      )}

      {p.type && !p.coloniaSlug && colonias.length > 0 && (
        <section className="section">
          <h2>Por colonia</h2>
          <div className="chips">
            {colonias.map((c) => (
              <Link key={c.colonia_slug} className="chip" style={{ color: "var(--brand)", borderColor: "var(--line)", background: "var(--surface)" }} href={`/${p.op}/${TYPES[p.type!].slug}/${c.colonia_slug}`}>
                {c.colonia} ({c.total})
              </Link>
            ))}
          </div>
        </section>
      )}

      <JsonLd data={breadcrumbJsonLd(crumbs.map((c) => ({ name: c.name, path: c.path })))} />
      {list.length > 0 && <JsonLd data={itemListJsonLd(h, list)} />}
    </>
  );
}
