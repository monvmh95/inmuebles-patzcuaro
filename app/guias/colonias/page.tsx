import type { Metadata } from "next";
import L from "@/components/L";
import { alternatesFor } from "@/lib/alternates";
import { getLang, tf } from "@/lib/lang";
import { CITY, STATE } from "@/lib/config";
import { listColonias } from "@/lib/properties";
import { safe } from "@/lib/safe";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  const t = tf(lang);
  return {
    title: t(`Colonias de ${CITY} con propiedades disponibles`, `${CITY} neighborhoods with available properties`),
    description: t(`Explora las colonias y zonas de ${CITY}, ${STATE} donde hay casas, terrenos y locales en renta y venta.`, `Explore the neighborhoods and areas of ${CITY}, ${STATE} with houses, land and commercial space for rent and sale.`),
    alternates: alternatesFor(lang, "/guias/colonias"),
  };
}

export default async function Colonias() {
  const t = tf(await getLang());
  const colonias = await safe(() => listColonias(), []);
  return (
    <div className="legal">
      <h1>{t(`Colonias de ${CITY}`, `${CITY} neighborhoods`)}</h1>
      <p className="muted">{t("Zonas donde hay propiedades publicadas actualmente. La lista crece conforme se publican anuncios.", "Areas with properties currently listed. The list grows as new listings are published.")}</p>
      {colonias.length === 0 ? (
        <p>{t("Todavía no hay anuncios publicados.", "There are no listings yet.")} <L href="/publicar">{t("Publica el primero", "List the first one")}</L>.</p>
      ) : (
        <ul>
          {colonias.map((c) => (
            <li key={c.colonia_slug}>
              <strong><L href={`/colonias/${c.colonia_slug}`}>{c.colonia}</L></strong> ({c.total}) — <L href={`/renta/casas/${c.colonia_slug}`}>{t("casas en renta", "houses for rent")}</L>, <L href={`/venta/casas/${c.colonia_slug}`}>{t("casas en venta", "houses for sale")}</L>, <L href={`/venta/terrenos/${c.colonia_slug}`}>{t("terrenos", "land")}</L>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
