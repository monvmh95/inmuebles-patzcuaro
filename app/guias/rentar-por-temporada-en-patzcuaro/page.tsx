import type { Metadata } from "next";
import Link from "next/link";
import { CITY } from "@/lib/config";
import { breadcrumbJsonLd, JsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: `Rentar por temporada en ${CITY}: qué acordar y revisar`,
  description: `Guía para rentar una casa o departamento por semanas o meses en ${CITY}: contrato, depósito, servicios, fechas de alta demanda y qué confirmar antes de llegar.`,
  alternates: { canonical: "/guias/rentar-por-temporada-en-patzcuaro" },
};

const ITEMS = [
  { h: "Define fechas y duración antes de buscar", p: "Algunas fechas concentran visitantes, como Día de Muertos, Semana Santa y fin de año. Si viajas entonces, busca con anticipación y confirma por escrito las fechas exactas de entrada y salida." },
  { h: "Pregunta qué incluye el precio", p: "Aclara si el monto incluye agua, luz, gas, internet y limpieza, o si se pagan aparte. En estancias largas, pregunta cómo se calcula el consumo y cuándo se paga." },
  { h: "Acuerda el depósito y cómo se devuelve", p: "Define el monto, a nombre de quién se paga y en qué condiciones se devuelve. Pide un recibo y deja anotado el estado de la casa al entrar, con fotos con fecha." },
  { h: "Haz un contrato por escrito, aunque sea corto", p: "Debe indicar las partes, la dirección, el periodo, el monto, el depósito, las reglas de uso (mascotas, visitas) y cómo se termina antes de tiempo." },
  { h: "Revisa lo que importa en un clima de altura", p: "Pátzcuaro está a unos 2,140 metros sobre el nivel del mar y las noches pueden ser frescas. Pregunta por calefacción o chimenea, agua caliente, humedad en las paredes y cómo se resuelve en temporada de lluvias." },
  { h: "Confirma el acceso y el estacionamiento", p: "En el centro hay calles angostas y empedradas. Pregunta dónde se estaciona, si el acceso es en subida y cómo se llega a pie desde la plaza." },
  { h: "Haz una videollamada o visita antes de pagar", p: "Si aún no estás en la ciudad, pide una videollamada recorriendo la propiedad en vivo y no pagues la totalidad por adelantado a quien no puedas identificar. Revisa la guía para evitar fraudes." },
];

export default function Guia() {
  return (
    <article className="legal">
      <h1>Rentar por temporada en {CITY}</h1>
      <p className="muted">Orientación general. Cada propietario tiene sus propias condiciones; acuérdalas por escrito. Revisada en noviembre de 2026.</p>
      <ol>
        {ITEMS.map((s) => (
          <li key={s.h}><h2 style={{ fontSize: "1.1rem", margin: "1em 0 .2em" }}>{s.h}</h2><p style={{ margin: 0 }}>{s.p}</p></li>
        ))}
      </ol>
      <p>Mira las <Link href="/renta/casas">casas en renta</Link> y los <Link href="/renta/departamentos">departamentos en renta</Link> en {CITY}, o la <Link href="/guias/como-evitar-fraudes-al-rentar">guía para evitar fraudes</Link>.</p>
      <JsonLd data={breadcrumbJsonLd([{ name: "Inicio", path: "/" }, { name: "Guías", path: "/guias" }, { name: "Rentar por temporada", path: "/guias/rentar-por-temporada-en-patzcuaro" }])} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "HowTo", name: `Rentar por temporada en ${CITY}`, inLanguage: "es-MX", step: ITEMS.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.h, text: s.p })) }} />
    </article>
  );
}
