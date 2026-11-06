import type { Metadata } from "next";
import L from "@/components/L";
import { CITY, STATE } from "@/lib/config";
import { alternatesFor } from "@/lib/alternates";
import { getLang, tf } from "@/lib/lang";
import { breadcrumbJsonLd, JsonLd } from "@/lib/seo";

const PATH = "/guias/vivir-en-patzcuaro";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  const t = tf(lang);
  return {
    title: t(`Vivir en ${CITY}, ${STATE}: lo que conviene saber`, `Living in ${CITY}, ${STATE}: what to know`),
    description: t(
      `Una mirada a ${CITY}, Pueblo Mágico de ${STATE}: centro histórico, lago, clima de altura, ambiente y qué considerar al elegir zona para rentar o comprar.`,
      `A look at ${CITY}, a Pueblo Mágico in ${STATE}, Mexico: historic center, lake, mountain climate, atmosphere and what to consider when choosing an area to rent or buy.`,
    ),
    alternates: alternatesFor(lang, PATH),
  };
}

export default async function Guia() {
  const lang = await getLang();
  const t = tf(lang);
  return (
    <article className="legal">
      <h1>{t(`Vivir en ${CITY}, ${STATE}`, `Living in ${CITY}, ${STATE}`)}</h1>
      <p className="muted">{t("Introducción editorial para quien está considerando mudarse. Revisada en noviembre de 2026; si notas algo por corregir, escríbenos.", "Editorial introduction for anyone considering a move. Reviewed in November 2026; if you notice anything to correct, let us know.")}</p>

      <h2>{t("Un pueblo de portales, tejas y empedrado", "A town of arcades, tile roofs and cobblestones")}</h2>
      <p>{t(`${CITY} es un Pueblo Mágico de ${STATE} con un centro histórico de casonas con tejas, calles empedradas y la Plaza Grande rodeada de portales. Es un lugar para caminar: muchas cosas cotidianas quedan cerca del centro.`, `${CITY} is a Pueblo Mágico in ${STATE} with a historic center of tile-roofed houses, cobblestone streets and the Plaza Grande surrounded by arcades. It is a place for walking: many everyday things are close to the center.`)}</p>

      <h2>{t("El lago y la altura", "The lake and the altitude")}</h2>
      <p>{t("La ciudad se encuentra a unos 2,140 metros sobre el nivel del mar, cerca del lago de Pátzcuaro. La altura se nota en el clima: días templados y noches frescas, con lluvias en verano. Conviene preguntar por calefacción, humedad y agua al ver una propiedad.", "The town sits about 2,140 meters (7,000 ft) above sea level, near Lake Pátzcuaro. The altitude shows in the climate: mild days and cool nights, with rain in summer. It is worth asking about heating, damp and water when you view a property.")}</p>

      <h2>{t("Tradiciones y temporadas", "Traditions and seasons")}</h2>
      <p>{t("El Día de Muertos es la temporada de mayor afluencia de visitantes. También hay mucho movimiento en vacaciones. Si buscas tranquilidad, considera que algunas zonas céntricas se llenan en esas fechas.", "Day of the Dead is the busiest visitor season. There is also a lot of activity during holidays. If you want peace and quiet, keep in mind that some central areas fill up on those dates.")}</p>

      <h2>{t("Cómo elegir zona", "How to choose an area")}</h2>
      <ul>
        <li><strong>{t("Centro:", "Downtown:")}</strong> {t("caminable y con ambiente, pero con calles angostas y poco estacionamiento.", "walkable and lively, but with narrow streets and little parking.")}</li>
        <li><strong>{t("Colonias fuera del centro:", "Neighborhoods outside the center:")}</strong> {t("más espacio y estacionamiento; suele requerir transporte para algunas actividades.", "more space and parking; you may need transport for some activities.")}</li>
        <li><strong>{t("Cerca del lago o en el campo:", "Near the lake or in the countryside:")}</strong> {t("vistas y terrenos más grandes; revisa accesos, servicios y agua.", "views and larger plots; check access, utilities and water.")}</li>
      </ul>
      <p>
        {t("Explora las", "Explore the")} <L href="/guias/colonias">{t("colonias con propiedades publicadas", "neighborhoods with listed properties")}</L>{t(", mira el", ", see the")} <L href="/mapa">{t("mapa", "map")}</L> {t("o empieza por la", "or start with the")} <L href="/guias/rentar-por-temporada-en-patzcuaro">{t("guía de renta por temporada", "seasonal rental guide")}</L>.
      </p>
      <JsonLd data={breadcrumbJsonLd([{ name: t("Inicio", "Home"), path: "/" }, { name: t("Guías", "Guides"), path: "/guias" }, { name: t(`Vivir en ${CITY}`, `Living in ${CITY}`), path: PATH }], lang)} />
    </article>
  );
}
