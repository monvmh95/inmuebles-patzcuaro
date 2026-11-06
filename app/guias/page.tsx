import type { Metadata } from "next";
import Link from "next/link";
import { CITY } from "@/lib/config";

export const metadata: Metadata = {
  title: `Guías para rentar, comprar y vivir en ${CITY}`,
  description: `Guías prácticas: cómo evitar fraudes, qué revisar al comprar un terreno, cómo rentar por temporada y qué saber antes de mudarte a ${CITY}.`,
  alternates: { canonical: "/guias" },
};

const GUIDES = [
  { href: "/guias/como-evitar-fraudes-al-rentar", t: "Cómo evitar fraudes al rentar o comprar", d: "Siete señales de alerta y qué verificar antes de pagar." },
  { href: "/guias/comprar-terreno-en-patzcuaro", t: "Qué revisar antes de comprar un terreno", d: "Documentos, tipo de propiedad y preguntas clave antes de apartar." },
  { href: "/guias/rentar-por-temporada-en-patzcuaro", t: "Rentar por temporada", d: "Contrato, depósito, servicios y fechas de alta demanda." },
  { href: "/guias/vivir-en-patzcuaro", t: `Vivir en ${CITY}`, d: "Una mirada al pueblo: zonas, ambiente, clima y vida diaria." },
  { href: "/guias/colonias", t: `Colonias de ${CITY}`, d: "Zonas con propiedades publicadas ahora." },
];

export default function Guias() {
  return (
    <div className="legal">
      <h1>Guías</h1>
      <p className="muted">Orientación general para tomar mejores decisiones. No sustituye asesoría legal ni notarial.</p>
      <ul className="stack" style={{ listStyle: "none", padding: 0 }}>
        {GUIDES.map((g) => (
          <li key={g.href} className="panel">
            <h2 style={{ fontSize: "1.2rem", margin: "0 0 4px" }}><Link href={g.href}>{g.t}</Link></h2>
            <p className="muted" style={{ margin: 0 }}>{g.d}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
