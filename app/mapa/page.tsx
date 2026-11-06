import Link from "next/link";
import type { Metadata } from "next";
import MapView from "@/components/MapView";
import { CITY, OPERATIONS, TYPES, isOperation, typeFromSlug, type Operation, type PropType } from "@/lib/config";
import { listMapPoints } from "@/lib/properties";
import { safe } from "@/lib/safe";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: `Mapa de propiedades en ${CITY}`,
  description: `Explora en el mapa las casas, terrenos y locales en renta y venta en ${CITY}. Las ubicaciones son zonas aproximadas.`,
  alternates: { canonical: "/mapa" },
};

type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function MapaPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const op = first(sp.op), type = first(sp.type), lake = first(sp.lake) === "1";
  const points = await safe(() => listMapPoints({
    operation: isOperation(op) ? (op as Operation) : undefined,
    type: (typeFromSlug(type) ?? (type in TYPES ? (type as PropType) : undefined)) || undefined,
    lake: lake || undefined,
  }), []);

  const q = (o: string) => `/mapa${o ? `?op=${o}` : ""}`;
  return (
    <div className="stack">
      <div className="section-head">
        <h1 style={{ margin: 0 }}>Mapa de propiedades</h1>
        <div className="view-toggle" aria-label="Vista">
          <Link href="/">Lista</Link>
          <Link href="/mapa" aria-current="page">Mapa</Link>
        </div>
      </div>
      <div className="chips" style={{ marginTop: 0 }}>
        <Link className="chip" href="/mapa">Todo</Link>
        {Object.entries(OPERATIONS).map(([k, v]) => <Link key={k} className="chip" href={q(k)}>{v.label}</Link>)}
        <Link className="chip" href="/mapa?lake=1">Con vista al lago</Link>
      </div>
      <MapView points={points} />
      <div className="map-legend">
        <span><i style={{ background: "var(--brand)" }} />Renta</span>
        <span><i style={{ background: "var(--accent)" }} />Venta</span>
        <span><i style={{ background: "var(--copper)" }} />Traspaso</span>
        <span>{points.length} {points.length === 1 ? "propiedad" : "propiedades"} con zona marcada</span>
      </div>
      <p className="muted small">Los pines muestran una zona aproximada (unos 300 m), nunca la dirección exacta. Solo aparecen los anuncios cuyo dueño marcó su zona.</p>
    </div>
  );
}
