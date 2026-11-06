import type { Metadata } from "next";
import Link from "next/link";
import { CITY, STATE } from "@/lib/config";
import { breadcrumbJsonLd, JsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: `Vivir en ${CITY}, ${STATE}: lo que conviene saber`,
  description: `Una mirada a ${CITY}, Pueblo Mágico de ${STATE}: centro histórico, lago, clima de altura, ambiente y qué considerar al elegir zona para rentar o comprar.`,
  alternates: { canonical: "/guias/vivir-en-patzcuaro" },
};

export default function Guia() {
  return (
    <article className="legal">
      <h1>Vivir en {CITY}, {STATE}</h1>
      <p className="muted">Introducción editorial para quien está considerando mudarse. Revisada en noviembre de 2026; si notas algo por corregir, escríbenos.</p>

      <h2>Un pueblo de portales, tejas y empedrado</h2>
      <p>{CITY} es un Pueblo Mágico de {STATE} con un centro histórico de casonas con tejas, calles empedradas y la Plaza Grande rodeada de portales. Es un lugar para caminar: muchas cosas cotidianas quedan cerca del centro.</p>

      <h2>El lago y la altura</h2>
      <p>La ciudad se encuentra a unos 2,140 metros sobre el nivel del mar, cerca del lago de Pátzcuaro. La altura se nota en el clima: días templados y noches frescas, con lluvias en verano. Conviene preguntar por calefacción, humedad y agua al ver una propiedad.</p>

      <h2>Tradiciones y temporadas</h2>
      <p>El Día de Muertos es la temporada de mayor afluencia de visitantes. También hay mucho movimiento en vacaciones. Si buscas tranquilidad, considera que algunas zonas céntricas se llenan en esas fechas.</p>

      <h2>Cómo elegir zona</h2>
      <ul>
        <li><strong>Centro:</strong> caminable y con ambiente, pero con calles angostas y poco estacionamiento.</li>
        <li><strong>Colonias fuera del centro:</strong> más espacio y estacionamiento; suele requerir transporte para algunas actividades.</li>
        <li><strong>Cerca del lago o en el campo:</strong> vistas y terrenos más grandes; revisa accesos, servicios y agua.</li>
      </ul>
      <p>Explora las <Link href="/guias/colonias">colonias con propiedades publicadas</Link>, mira el <Link href="/mapa">mapa</Link> o empieza por la <Link href="/guias/rentar-por-temporada-en-patzcuaro">guía de renta por temporada</Link>.</p>
      <JsonLd data={breadcrumbJsonLd([{ name: "Inicio", path: "/" }, { name: "Guías", path: "/guias" }, { name: `Vivir en ${CITY}`, path: "/guias/vivir-en-patzcuaro" }])} />
    </article>
  );
}
