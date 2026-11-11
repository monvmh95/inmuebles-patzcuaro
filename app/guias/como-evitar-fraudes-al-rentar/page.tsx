import type { Metadata } from "next";
import L from "@/components/L";
import { CITY } from "@/lib/config";
import { alternatesFor } from "@/lib/alternates";
import { getLang } from "@/lib/lang";
import { breadcrumbJsonLd, JsonLd } from "@/lib/seo";

const PATH = "/guias/como-evitar-fraudes-al-rentar";
const C = {
  "ctitle": {
    "es": "Cómo evitar fraudes al rentar o comprar en {C}",
    "en": "How to avoid rental and purchase scams in {C}"
  },
  "cdesc": {
    "es": "Lista práctica para no caer en anuncios falsos: qué verificar, qué nunca pagar por adelantado y señales de alerta antes de rentar o comprar una propiedad.",
    "en": "A practical checklist to avoid fake listings: what to verify, what never to pay in advance and warning signs before renting or buying a property."
  },
  "intro": {
    "es": "Recomendaciones generales de sentido común. No sustituyen asesoría legal.",
    "en": "General common-sense recommendations. They do not replace legal advice."
  },
  "items": {
    "es": [
      [
        "Visita la propiedad antes de pagar",
        "Nunca apartes ni deposites sin haber entrado a la propiedad. Si te dicen que el dueño está fuera y que solo puedes verla por fotos, desconfía."
      ],
      [
        "Confirma que quien te atiende puede rentar o vender",
        "Pide una identificación oficial y, si es venta, documentos de propiedad (escritura) y que el nombre coincida. Si te atiende un representante, pide el documento que lo autoriza (carta poder o contrato de administración)."
      ],
      [
        "Busca las fotos en otros sitios",
        "Una búsqueda inversa de imágenes te dice si las fotos pertenecen a otro anuncio. Si aparecen en otra ciudad o con otro precio, es una señal de alerta."
      ],
      [
        "Desconfía de precios demasiado bajos",
        "Una casa muy por debajo del precio de la zona suele ser anzuelo. Compara con otros anuncios de la misma colonia."
      ],
      [
        "Paga solo con comprobante y a nombre correcto",
        "Haz transferencias a una cuenta a nombre de la persona con la que firmas, y pide recibo. Evita efectivo sin recibo y depósitos a terceros."
      ],
      [
        "Firma un contrato por escrito",
        "El contrato debe indicar partes, dirección, monto, depósito, duración y quién paga servicios. Léelo completo antes de firmar."
      ],
      [
        "Cuidado con la prisa",
        "“Hay otros interesados, deposita hoy” es una táctica común. Una oportunidad real aguanta un día para que la revises."
      ]
    ],
    "en": [
      [
        "Visit the property before paying",
        "Never reserve or deposit before you have been inside the property. If you are told the owner is away and you can only see it in photos, be suspicious."
      ],
      [
        "Confirm the person can rent or sell it",
        "Ask for an official ID and, for a sale, ownership documents (the deed) with a matching name. If a representative is handling it, ask for the document that authorizes them (letter of authority or management contract)."
      ],
      [
        "Search for the photos elsewhere",
        "A reverse image search tells you whether the photos belong to another listing. If they appear in another city or at another price, that is a red flag."
      ],
      [
        "Be wary of prices that are too low",
        "A house far below the going price for the area is usually bait. Compare with other listings in the same neighborhood."
      ],
      [
        "Pay only with a receipt and to the right name",
        "Make transfers to an account in the name of the person you sign with, and ask for a receipt. Avoid cash without a receipt and payments to third parties."
      ],
      [
        "Sign a written contract",
        "The contract should state the parties, address, amount, deposit, duration and who pays utilities. Read all of it before signing."
      ],
      [
        "Beware of pressure",
        "“There are other interested people, deposit today” is a common tactic. A real opportunity can wait a day while you check it."
      ]
    ]
  },
  "outro": {
    "es": "Si ves un anuncio sospechoso en nuestro sitio, usa el botón <strong>Reportar este anuncio</strong> en su página. Revisamos cada reporte.",
    "en": "If you see a suspicious listing on our site, use the <strong>Report this listing</strong> button on its page. We review every report."
  },
  "crumb": {
    "es": "Cómo evitar fraudes",
    "en": "Avoiding scams"
  },
  "hname": {
    "es": "Cómo evitar fraudes al rentar o comprar en {C}",
    "en": "How to avoid rental and purchase scams in {C}"
  }
} as const;
const LINKS = [
  [
    "/",
    "Ver propiedades en {C}",
    "Browse properties in {C}"
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
