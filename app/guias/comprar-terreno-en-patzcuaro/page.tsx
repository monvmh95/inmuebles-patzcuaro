import type { Metadata } from "next";
import Link from "next/link";
import { CITY } from "@/lib/config";
import { breadcrumbJsonLd, JsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: `Qué revisar antes de comprar un terreno en ${CITY}`,
  description: "Checklist práctico para comprar un terreno en México: tipo de propiedad (privada, ejidal o comunal), escritura, gravámenes, predial, uso de suelo y cómo cerrar la operación con notario.",
  alternates: { canonical: "/guias/comprar-terreno-en-patzcuaro" },
};

const ITEMS = [
  { h: "Averigua qué tipo de propiedad es", p: "No todos los terrenos se venden igual. Uno de propiedad privada se transmite con escritura pública; uno ejidal o comunal tiene reglas distintas y no se vende como un terreno particular. Pregunta de forma directa de qué tipo es y pide que lo demuestren con documentos." },
  { h: "Pide la escritura y compárala con quien vende", p: "El nombre en la escritura debe coincidir con la identificación de quien vende. Si vende un representante, pide el poder notarial. Si hay varios dueños o es una herencia, todos deben firmar o estar debidamente representados." },
  { h: "Verifica que no tenga gravámenes", p: "Pide un certificado de libertad de gravamen en el Registro Público de la Propiedad para saber si el terreno tiene hipotecas, embargos u otras cargas. Tu notario puede tramitarlo." },
  { h: "Revisa que el predial esté al corriente", p: "Pide los recibos del impuesto predial y confirma en el municipio que no haya adeudos. Los adeudos pueden pasar a quien compra si no se resuelven antes de la firma." },
  { h: "Confirma superficie, medidas y colindancias", p: "Compara lo que dice la escritura con lo que ves en el terreno. Una medición por un topógrafo evita sorpresas. Recorre el terreno y habla con los vecinos sobre accesos y servidumbres de paso." },
  { h: "Pregunta por el uso de suelo y los permisos", p: "Antes de planear construir, consulta en el municipio qué se permite en esa zona y qué licencias necesitas. Esto importa más cerca del centro histórico, de zonas protegidas y de la orilla del lago." },
  { h: "Verifica el acceso y los servicios", p: "Confirma que el terreno tiene acceso legal y transitable, y si cuenta con agua, luz y drenaje o qué costaría conectarlos. Pregunta cómo se resuelve el agua en temporada de secas." },
  { h: "Cierra con notario y paga con comprobante", p: "La compraventa se formaliza ante notario. Evita entregar dinero grande sin contrato ni recibo. Haz los pagos por transferencia a nombre de la persona que aparece en la escritura. Un anticipo debe quedar documentado en un contrato de promesa de compraventa." },
];

export default function Guia() {
  return (
    <article className="legal">
      <h1>Qué revisar antes de comprar un terreno en {CITY}</h1>
      <p className="muted">Orientación general basada en prácticas comunes en México. Las reglas y trámites pueden cambiar y varían por caso: consulta siempre a un notario o abogado de confianza antes de pagar. Revisada en noviembre de 2026.</p>
      <ol>
        {ITEMS.map((s) => (
          <li key={s.h}><h2 style={{ fontSize: "1.1rem", margin: "1em 0 .2em" }}>{s.h}</h2><p style={{ margin: 0 }}>{s.p}</p></li>
        ))}
      </ol>
      <p>Mira también la guía para <Link href="/guias/como-evitar-fraudes-al-rentar">evitar fraudes</Link> y los <Link href="/venta/terrenos">terrenos en venta en {CITY}</Link>.</p>
      <JsonLd data={breadcrumbJsonLd([{ name: "Inicio", path: "/" }, { name: "Guías", path: "/guias" }, { name: "Comprar un terreno", path: "/guias/comprar-terreno-en-patzcuaro" }])} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "HowTo", name: `Qué revisar antes de comprar un terreno en ${CITY}`, inLanguage: "es-MX", step: ITEMS.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.h, text: s.p })) }} />
    </article>
  );
}
