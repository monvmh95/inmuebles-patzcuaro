import type { Metadata } from "next";
import L from "@/components/L";
import { CITY } from "@/lib/config";
import { alternatesFor } from "@/lib/alternates";
import { getLang } from "@/lib/lang";
import { breadcrumbJsonLd, JsonLd } from "@/lib/seo";

const PATH = "/guias/rentar-por-temporada-en-patzcuaro";
const C = {
  "ctitle": {
    "es": "Rentar por temporada en {C}: qué acordar y revisar",
    "en": "Seasonal rentals in {C}: what to agree on and check"
  },
  "cdesc": {
    "es": "Guía para rentar una casa o departamento por semanas o meses en {C}: contrato, depósito, servicios, fechas de alta demanda y qué confirmar antes de llegar.",
    "en": "A guide to renting a house or apartment for weeks or months in {C}: contract, deposit, utilities, high-demand dates and what to confirm before you arrive."
  },
  "intro": {
    "es": "Orientación general. Cada propietario tiene sus propias condiciones; acuérdalas por escrito. Revisada en noviembre de 2026.",
    "en": "General guidance. Each owner has their own terms; agree on them in writing. Reviewed in November 2026."
  },
  "items": {
    "es": [
      [
        "Define fechas y duración antes de buscar",
        "Algunas fechas concentran visitantes, como Día de Muertos, Semana Santa y fin de año. Si viajas entonces, busca con anticipación y confirma por escrito las fechas exactas de entrada y salida."
      ],
      [
        "Pregunta qué incluye el precio",
        "Aclara si el monto incluye agua, luz, gas, internet y limpieza, o si se pagan aparte. En estancias largas, pregunta cómo se calcula el consumo y cuándo se paga."
      ],
      [
        "Acuerda el depósito y cómo se devuelve",
        "Define el monto, a nombre de quién se paga y en qué condiciones se devuelve. Pide un recibo y deja anotado el estado de la casa al entrar, con fotos con fecha."
      ],
      [
        "Haz un contrato por escrito, aunque sea corto",
        "Debe indicar las partes, la dirección, el periodo, el monto, el depósito, las reglas de uso (mascotas, visitas) y cómo se termina antes de tiempo."
      ],
      [
        "Revisa lo que importa en un clima de altura",
        "Pátzcuaro está a unos 2,140 metros sobre el nivel del mar y las noches pueden ser frescas. Pregunta por calefacción o chimenea, agua caliente, humedad en las paredes y cómo se resuelve en temporada de lluvias."
      ],
      [
        "Confirma el acceso y el estacionamiento",
        "En el centro hay calles angostas y empedradas. Pregunta dónde se estaciona, si el acceso es en subida y cómo se llega a pie desde la plaza."
      ],
      [
        "Haz una videollamada o visita antes de pagar",
        "Si aún no estás en la ciudad, pide una videollamada recorriendo la propiedad en vivo y no pagues la totalidad por adelantado a quien no puedas identificar. Revisa la guía para evitar fraudes."
      ]
    ],
    "en": [
      [
        "Set dates and length of stay before you search",
        "Some dates concentrate visitors, such as Day of the Dead, Holy Week and the end of the year. If you travel then, search early and confirm the exact check-in and check-out dates in writing."
      ],
      [
        "Ask what the price includes",
        "Clarify whether the amount includes water, electricity, gas, internet and cleaning, or whether they are paid separately. For long stays, ask how consumption is calculated and when it is paid."
      ],
      [
        "Agree on the deposit and how it is returned",
        "Define the amount, in whose name it is paid and under what conditions it is returned. Ask for a receipt and note the condition of the house on arrival, with dated photos."
      ],
      [
        "Have a written contract, even a short one",
        "It should state the parties, address, period, amount, deposit, house rules (pets, visitors) and how to end it early."
      ],
      [
        "Check what matters at altitude",
        "Pátzcuaro is about 2,140 meters (7,000 ft) above sea level and nights can be cool. Ask about heating or a fireplace, hot water, damp walls and how the house copes in the rainy season."
      ],
      [
        "Confirm access and parking",
        "The center has narrow cobblestone streets. Ask where to park, whether the access is uphill and how to walk to the plaza."
      ],
      [
        "Do a video call or visit before paying",
        "If you are not in town yet, ask for a live video call walking through the property and do not pay everything in advance to someone you cannot identify. Read the scam-avoidance guide."
      ]
    ]
  },
  "outro": {
    "es": null,
    "en": null
  },
  "crumb": {
    "es": "Rentar por temporada",
    "en": "Seasonal rentals"
  },
  "hname": {
    "es": "Rentar por temporada en {C}",
    "en": "Seasonal rentals in {C}"
  }
} as const;
const LINKS = [
  [
    "/renta/casas",
    "casas en renta",
    "houses for rent"
  ],
  [
    "/renta/departamentos",
    "departamentos en renta",
    "apartments for rent"
  ],
  [
    "/guias/como-evitar-fraudes-al-rentar",
    "guía para evitar fraudes",
    "scam-avoidance guide"
  ]
] as const;
const fill = (s: string) => s.replace("{C}", CITY);

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: fill(C.ctitle[lang]), description: fill(C.cdesc[lang]), alternates: alternatesFor(lang, PATH) };
}

export default async function Guia() {
  const lang = await getLang();
  const items = C.items[lang];
  const links = LINKS.map(([href, es, en]) => ({ href, label: fill(lang === "en" ? en : es) }));
  const outro = C.outro[lang];
  return (
    <article className="legal">
      <h1>{fill(C.hname[lang])}</h1>
      <p className="muted">{C.intro[lang]}</p>
      <ol>
        {items.map(([h, p]) => (
          <li key={h}><h2 style={{ fontSize: "1.1rem", margin: "1em 0 .2em" }}>{h}</h2><p style={{ margin: 0 }}>{p}</p></li>
        ))}
      </ol>
      {outro && <p dangerouslySetInnerHTML={{ __html: outro }} />}
      <p>
        {lang === "en" ? "See also: " : "Mira también: "}
        {links.map((l, i) => <span key={l.href}>{i > 0 && ", "}<L href={l.href}>{l.label}</L></span>)}.
      </p>
      <JsonLd data={breadcrumbJsonLd([{ name: lang === "en" ? "Home" : "Inicio", path: "/" }, { name: lang === "en" ? "Guides" : "Guías", path: "/guias" }, { name: C.crumb[lang], path: PATH }], lang)} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "HowTo", name: fill(C.hname[lang]), inLanguage: lang === "en" ? "en" : "es-MX", step: items.map(([h, p], i) => ({ "@type": "HowToStep", position: i + 1, name: h, text: p })) }} />
    </article>
  );
}
