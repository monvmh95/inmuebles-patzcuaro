import type { Metadata } from "next";
import Link from "next/link";
import { CITY } from "@/lib/config";
import { breadcrumbJsonLd, JsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: `Cómo evitar fraudes al rentar o comprar en ${CITY}`,
  description: "Lista práctica para no caer en anuncios falsos: qué verificar, qué nunca pagar por adelantado y señales de alerta antes de rentar o comprar una propiedad.",
  alternates: { canonical: "/guias/como-evitar-fraudes-al-rentar" },
};

const STEPS = [
  { h: "Visita la propiedad antes de pagar", p: "Nunca apartes ni deposites sin haber entrado a la propiedad. Si te dicen que el dueño está fuera y que solo puedes verla por fotos, desconfía." },
  { h: "Confirma que quien te atiende puede rentar o vender", p: "Pide una identificación oficial y, si es venta, documentos de propiedad (escritura) y que el nombre coincida. Si es un agente o representante, pide la carta o poder que lo autoriza." },
  { h: "Busca las fotos en otros sitios", p: "Una búsqueda inversa de imágenes te dice si las fotos pertenecen a otro anuncio. Si aparecen en otra ciudad o con otro precio, es una señal de alerta." },
  { h: "Desconfía de precios demasiado bajos", p: "Una casa muy por debajo del precio de la zona suele ser anzuelo. Compara con otros anuncios de la misma colonia." },
  { h: "Paga solo con comprobante y a nombre correcto", p: "Haz transferencias a una cuenta a nombre de la persona con la que firmas, y pide recibo. Evita efectivo sin recibo y depósitos a terceros." },
  { h: "Firma un contrato por escrito", p: "El contrato debe indicar partes, dirección, monto, depósito, duración y quién paga servicios. Léelo completo antes de firmar." },
  { h: "Cuidado con la prisa", p: "“Hay otros interesados, deposita hoy” es una táctica común. Una oportunidad real aguanta un día para que la revises." },
];

export default function Guia() {
  return (
    <article className="legal">
      <h1>Cómo evitar fraudes al rentar o comprar en {CITY}</h1>
      <p className="muted">Recomendaciones generales de sentido común. No sustituyen asesoría legal.</p>
      <ol>
        {STEPS.map((s) => (
          <li key={s.h}><h2 style={{ fontSize: "1.1rem", margin: "1em 0 .2em" }}>{s.h}</h2><p style={{ margin: 0 }}>{s.p}</p></li>
        ))}
      </ol>
      <p>Si ves un anuncio sospechoso en nuestro sitio, usa el botón <strong>Reportar este anuncio</strong> en su página. Revisamos cada reporte.</p>
      <p><Link href="/">Ver propiedades en {CITY}</Link></p>
      <JsonLd data={breadcrumbJsonLd([{ name: "Inicio", path: "/" }, { name: "Cómo evitar fraudes", path: "/guias/como-evitar-fraudes-al-rentar" }])} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "HowTo", name: `Cómo evitar fraudes al rentar o comprar en ${CITY}`, inLanguage: "es-MX",
        step: STEPS.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.h, text: s.p })),
      }} />
    </article>
  );
}
