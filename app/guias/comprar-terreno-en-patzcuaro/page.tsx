import type { Metadata } from "next";
import L from "@/components/L";
import { CITY } from "@/lib/config";
import { alternatesFor } from "@/lib/alternates";
import { getLang } from "@/lib/lang";
import { breadcrumbJsonLd, JsonLd } from "@/lib/seo";

const PATH = "/guias/comprar-terreno-en-patzcuaro";
const C = {
  "ctitle": {
    "es": "Qué revisar antes de comprar un terreno en {C}",
    "en": "What to check before buying land in {C}"
  },
  "cdesc": {
    "es": "Checklist práctico para comprar un terreno en México: tipo de propiedad (privada, ejidal o comunal), escritura, gravámenes, predial, uso de suelo y cómo cerrar la operación con notario.",
    "en": "A practical checklist for buying land in Mexico: type of ownership (private, ejido or communal), deed, liens, property tax, land use and closing with a notary."
  },
  "intro": {
    "es": "Orientación general basada en prácticas comunes en México. Las reglas y trámites pueden cambiar y varían por caso: consulta siempre a un notario o abogado de confianza antes de pagar. Revisada en noviembre de 2026.",
    "en": "General guidance based on common practice in Mexico. Rules and procedures can change and vary by case: always consult a trusted notary or lawyer before paying. Reviewed in November 2026."
  },
  "items": {
    "es": [
      [
        "Averigua qué tipo de propiedad es",
        "No todos los terrenos se venden igual. Uno de propiedad privada se transmite con escritura pública; uno ejidal o comunal tiene reglas distintas y no se vende como un terreno particular. Pregunta de forma directa de qué tipo es y pide que lo demuestren con documentos."
      ],
      [
        "Pide la escritura y compárala con quien vende",
        "El nombre en la escritura debe coincidir con la identificación de quien vende. Si vende un representante, pide el poder notarial. Si hay varios dueños o es una herencia, todos deben firmar o estar debidamente representados."
      ],
      [
        "Verifica que no tenga gravámenes",
        "Pide un certificado de libertad de gravamen en el Registro Público de la Propiedad para saber si el terreno tiene hipotecas, embargos u otras cargas. Tu notario puede tramitarlo."
      ],
      [
        "Revisa que el predial esté al corriente",
        "Pide los recibos del impuesto predial y confirma en el municipio que no haya adeudos. Los adeudos pueden pasar a quien compra si no se resuelven antes de la firma."
      ],
      [
        "Confirma superficie, medidas y colindancias",
        "Compara lo que dice la escritura con lo que ves en el terreno. Una medición por un topógrafo evita sorpresas. Recorre el terreno y habla con los vecinos sobre accesos y servidumbres de paso."
      ],
      [
        "Pregunta por el uso de suelo y los permisos",
        "Antes de planear construir, consulta en el municipio qué se permite en esa zona y qué licencias necesitas. Esto importa más cerca del centro histórico, de zonas protegidas y de la orilla del lago."
      ],
      [
        "Verifica el acceso y los servicios",
        "Confirma que el terreno tiene acceso legal y transitable, y si cuenta con agua, luz y drenaje o qué costaría conectarlos. Pregunta cómo se resuelve el agua en temporada de secas."
      ],
      [
        "Cierra con notario y paga con comprobante",
        "La compraventa se formaliza ante notario. Evita entregar dinero grande sin contrato ni recibo. Haz los pagos por transferencia a nombre de la persona que aparece en la escritura. Un anticipo debe quedar documentado en un contrato de promesa de compraventa."
      ]
    ],
    "en": [
      [
        "Find out what type of property it is",
        "Not all land is sold the same way. Privately owned land is transferred by public deed; ejido or communal land follows different rules and is not sold like private land. Ask directly which type it is and ask for documents that prove it."
      ],
      [
        "Ask for the deed and compare it with the seller",
        "The name on the deed must match the seller’s ID. If a representative is selling, ask for the notarized power of attorney. If there are several owners or it is an inheritance, all must sign or be properly represented."
      ],
      [
        "Check that it has no liens",
        "Ask for a certificate of no liens from the Public Registry of Property to find out whether the land has mortgages, attachments or other encumbrances. Your notary can request it."
      ],
      [
        "Check that property tax is up to date",
        "Ask for the property tax receipts and confirm with the municipality that nothing is owed. Debts can pass to the buyer if not settled before signing."
      ],
      [
        "Confirm size, measurements and boundaries",
        "Compare what the deed says with what you see on the land. A survey by a licensed surveyor avoids surprises. Walk the land and talk to neighbors about access and rights of way."
      ],
      [
        "Ask about land use and permits",
        "Before planning to build, ask the municipality what is allowed in that area and what permits you need. This matters more near the historic center, protected areas and the lakeshore."
      ],
      [
        "Check access and utilities",
        "Confirm the land has legal, passable access, and whether it has water, electricity and drainage or what it would cost to connect them. Ask how water is handled in the dry season."
      ],
      [
        "Close with a notary and pay with a receipt",
        "The sale is formalized before a notary. Avoid handing over large sums without a contract or receipt. Pay by transfer to the person named on the deed. A deposit should be documented in a promise-to-sell contract."
      ]
    ]
  },
  "outro": {
    "es": null,
    "en": null
  },
  "crumb": {
    "es": "Comprar un terreno",
    "en": "Buying land"
  },
  "hname": {
    "es": "Qué revisar antes de comprar un terreno en {C}",
    "en": "What to check before buying land in {C}"
  }
} as const;
const LINKS = [
  [
    "/guias/como-evitar-fraudes-al-rentar",
    "guía para evitar fraudes",
    "scam-avoidance guide"
  ],
  [
    "/venta/terrenos",
    "terrenos en venta en {C}",
    "land for sale in {C}"
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
