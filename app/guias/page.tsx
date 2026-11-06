import type { Metadata } from "next";
import L from "@/components/L";
import { CITY } from "@/lib/config";
import { alternatesFor } from "@/lib/alternates";
import { getLang, tf } from "@/lib/lang";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  const t = tf(lang);
  return {
    title: t(`Guías para rentar, comprar y vivir en ${CITY}`, `Guides to renting, buying and living in ${CITY}`),
    description: t(`Guías prácticas: cómo evitar fraudes, qué revisar al comprar un terreno, cómo rentar por temporada y qué saber antes de mudarte a ${CITY}.`, `Practical guides: how to avoid scams, what to check when buying land, how to rent seasonally and what to know before moving to ${CITY}.`),
    alternates: alternatesFor(lang, "/guias"),
  };
}

export default async function Guias() {
  const t = tf(await getLang());
  const GUIDES = [
    { href: "/guias/como-evitar-fraudes-al-rentar", t: t("Cómo evitar fraudes al rentar o comprar", "How to avoid rental and purchase scams"), d: t("Siete señales de alerta y qué verificar antes de pagar.", "Seven warning signs and what to verify before paying.") },
    { href: "/guias/comprar-terreno-en-patzcuaro", t: t("Qué revisar antes de comprar un terreno", "What to check before buying land"), d: t("Documentos, tipo de propiedad y preguntas clave antes de apartar.", "Documents, type of ownership and key questions before putting down a deposit.") },
    { href: "/guias/rentar-por-temporada-en-patzcuaro", t: t("Rentar por temporada", "Renting seasonally"), d: t("Contrato, depósito, servicios y fechas de alta demanda.", "Contract, deposit, utilities and high-demand dates.") },
    { href: "/guias/vivir-en-patzcuaro", t: t(`Vivir en ${CITY}`, `Living in ${CITY}`), d: t("Una mirada al pueblo: zonas, ambiente, clima y vida diaria.", "A look at the town: areas, atmosphere, climate and daily life.") },
    { href: "/guias/colonias", t: t(`Colonias de ${CITY}`, `${CITY} neighborhoods`), d: t("Zonas con propiedades publicadas ahora.", "Areas with properties listed right now.") },
  ];
  return (
    <div className="legal">
      <h1>{t("Guías", "Guides")}</h1>
      <p className="muted">{t("Orientación general para tomar mejores decisiones. No sustituye asesoría legal ni notarial.", "General guidance to help you decide better. It does not replace legal or notarial advice.")}</p>
      <ul className="stack" style={{ listStyle: "none", padding: 0 }}>
        {GUIDES.map((g) => (
          <li key={g.href} className="panel">
            <h2 style={{ fontSize: "1.2rem", margin: "0 0 4px" }}><L href={g.href}>{g.t}</L></h2>
            <p className="muted" style={{ margin: 0 }}>{g.d}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
