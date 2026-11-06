import type { Metadata } from "next";
import Link from "next/link";
import VerifiedBadge from "@/components/VerifiedBadge";

export const metadata: Metadata = {
  title: "Qué significa “Verificado”",
  description: "Qué revisamos antes de poner el sello Verificado en un anuncio de Inmuebles Pátzcuaro, y qué no garantiza.",
  alternates: { canonical: "/verificacion" },
};

export default function Verificacion() {
  return (
    <article className="legal stack">
      <h1>Qué significa <VerifiedBadge /></h1>
      <p>El sello <strong>Verificado</strong> lo pone manualmente el equipo del sitio, anuncio por anuncio. Es una señal de confianza, no una garantía.</p>
      <h2>Qué revisamos</h2>
      <ul>
        <li>Que el número de WhatsApp responde y quien contesta dice ser el dueño o su representante.</li>
        <li>Que las fotos corresponden a la propiedad descrita (no son imágenes de internet).</li>
        <li>Que el precio, la zona y los datos principales coinciden con lo publicado.</li>
      </ul>
      <h2>Qué NO garantiza</h2>
      <ul>
        <li>No revisamos escrituras, derechos de propiedad ni adeudos.</li>
        <li>No intermediamos pagos ni operaciones.</li>
        <li>Un anuncio sin sello no es necesariamente malo; solo no ha sido revisado.</li>
      </ul>
      <p>Aun con el sello, visita la propiedad antes de pagar. Lee la <Link href="/guias/como-evitar-fraudes-al-rentar">guía para evitar fraudes</Link>.</p>
      <p>¿Quieres que revisemos tu anuncio? Al publicar, déjanos tu WhatsApp y te contactaremos.</p>
    </article>
  );
}
