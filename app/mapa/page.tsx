import L from "@/components/L";
import { getLang, tf, opLabel } from "@/lib/lang";
import { alternatesFor } from "@/lib/alternates";
import { localizeTitles } from "@/lib/ai";
import type { Metadata } from "next";
import MapView from "@/components/MapView";
import { CITY, OPERATIONS, TYPES, isOperation, typeFromSlug, type Operation, type PropType } from "@/lib/config";
import { listMapPoints } from "@/lib/properties";
import { safe } from "@/lib/safe";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  const t = tf(lang);
  return {
    title: t(`Mapa de propiedades en ${CITY}`, `Property map of ${CITY}`),
    description: t(`Explora en el mapa las casas, terrenos y locales en renta y venta en ${CITY}. Las ubicaciones son zonas aproximadas.`, `Explore houses, land and commercial space for rent and sale in ${CITY} on the map. Locations are approximate areas.`),
    alternates: alternatesFor(lang, "/mapa"),
  };
}

type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function MapaPage({ searchParams }: { searchParams: Promise<SP> }) {
  const lang = await getLang();
  const t = tf(lang);
  const sp = await searchParams;
  const op = first(sp.op), type = first(sp.type), lake = first(sp.lake) === "1";
  const raw = await safe(() => listMapPoints({
    operation: isOperation(op) ? (op as Operation) : undefined,
    type: (typeFromSlug(type) ?? (type in TYPES ? (type as PropType) : undefined)) || undefined,
    lake: lake || undefined,
  }), []);
  const points = await localizeTitles(raw, lang);

  const q = (o: string) => `/mapa${o ? `?op=${o}` : ""}`;
  return (
    <div className="stack">
      <div className="section-head">
        <h1 style={{ margin: 0 }}>{t("Mapa de propiedades", "Property map")}</h1>
        <div className="view-toggle" aria-label={t("Vista", "View")}>
          <L href="/">{t("Lista", "List")}</L>
          <L href="/mapa" aria-current="page">{t("Mapa", "Map")}</L>
        </div>
      </div>
      <div className="chips" style={{ marginTop: 0 }}>
        <L className="chip" href="/mapa">{t("Todo", "All")}</L>
        {(Object.keys(OPERATIONS) as (keyof typeof OPERATIONS)[]).map((k) => <L key={k} className="chip" href={q(k)}>{opLabel(lang, k)}</L>)}
        <L className="chip" href="/mapa?lake=1">{t("Con vista al lago", "Lake view")}</L>
      </div>
      <MapView points={points} />
      <div className="map-legend">
        <span><i style={{ background: "var(--brand)" }} />{t("Renta", "Rent")}</span>
        <span><i style={{ background: "var(--accent)" }} />{t("Venta", "Sale")}</span>
        <span><i style={{ background: "var(--copper)" }} />{t("Traspaso", "Business transfer")}</span>
        <span>{points.length} {t(points.length === 1 ? "propiedad con zona marcada" : "propiedades con zona marcada", points.length === 1 ? "property with a marked area" : "properties with a marked area")}</span>
      </div>
      <p className="muted small">{t("Los pines muestran una zona aproximada (unos 300 m), nunca la dirección exacta. Solo aparecen los anuncios cuyo dueño marcó su zona.", "Pins show an approximate area (about 300 m), never the exact address. Only listings whose owner marked their area appear.")}</p>
    </div>
  );
}
