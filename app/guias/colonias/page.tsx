import type { Metadata } from "next";
import Link from "next/link";
import { CITY, STATE } from "@/lib/config";
import { listColonias } from "@/lib/properties";
import { safe } from "@/lib/safe";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: `Colonias de ${CITY} con propiedades disponibles`,
  description: `Explora las colonias y zonas de ${CITY}, ${STATE} donde hay casas, terrenos y locales en renta y venta.`,
  alternates: { canonical: "/guias/colonias" },
};

export default async function Colonias() {
  const colonias = await safe(() => listColonias(), []);
  return (
    <div className="legal">
      <h1>Colonias de {CITY}</h1>
      <p className="muted">Zonas donde hay propiedades publicadas actualmente. La lista crece conforme se publican anuncios.</p>
      {colonias.length === 0 ? (
        <p>Todavía no hay anuncios publicados. <Link href="/publicar">Publica el primero</Link>.</p>
      ) : (
        <ul>
          {colonias.map((c) => (
            <li key={c.colonia_slug}>
              <strong>{c.colonia}</strong> ({c.total}) — <Link href={`/renta/casas/${c.colonia_slug}`}>casas en renta</Link>, <Link href={`/venta/casas/${c.colonia_slug}`}>casas en venta</Link>, <Link href={`/venta/terrenos/${c.colonia_slug}`}>terrenos</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
