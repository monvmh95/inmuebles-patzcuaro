import { CITY, OPERATIONS, SITE_NAME, SITE_URL, STATE, TYPES } from "./config";
import type { Property } from "./properties";

export function propertyTitle(p: Pick<Property, "type" | "operation" | "colonia">) {
  return `${TYPES[p.type].label} ${OPERATIONS[p.operation].plural} en ${p.colonia}, ${CITY}`;
}

export function propertyJsonLd(p: Property) {
  const url = `${SITE_URL}/propiedad/${p.slug}`;
  const isRent = p.operation === "renta";
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: p.title,
    description: p.description.slice(0, 500),
    url,
    datePosted: new Date(p.approved_at ?? p.created_at).toISOString(),
    image: p.photos,
    inLanguage: "es-MX",
    about: {
      "@type": p.type === "terreno" ? "Landform" : p.type === "departamento" ? "Apartment" : p.type === "local" ? "Store" : "House",
      address: { "@type": "PostalAddress", addressLocality: CITY, addressRegion: STATE, addressCountry: "MX", streetAddress: p.colonia },
      ...(p.bedrooms != null ? { numberOfBedrooms: p.bedrooms } : {}),
      ...(p.bathrooms != null ? { numberOfBathroomsTotal: p.bathrooms } : {}),
      ...(p.built_m2 != null ? { floorSize: { "@type": "QuantitativeValue", value: p.built_m2, unitCode: "MTK" } } : {}),
    },
    ...(p.price != null
      ? {
          offers: {
            "@type": "Offer",
            price: p.price,
            priceCurrency: "MXN",
            availability: "https://schema.org/InStock",
            url,
            ...(isRent ? { priceSpecification: { "@type": "UnitPriceSpecification", price: p.price, priceCurrency: "MXN", unitText: "MONTH" } } : {}),
          },
        }
      : {}),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${SITE_URL}${it.path}` })),
  };
}

export function itemListJsonLd(name: string, props: Property[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: props.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/propiedad/${p.slug}`, name: p.title })),
  };
}

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: "es-MX",
  description: `Casas, departamentos, terrenos y locales en renta, venta y traspaso en ${CITY}, ${STATE}.`,
};

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
