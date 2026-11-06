import { CITY, OPERATIONS, SITE_NAME, SITE_URL, STATE, TYPES } from "./config";
import type { Property } from "./properties";
import { localizePath, opPlural, typeLabel, type Lang } from "./i18n";
import { featureLabel } from "./features";

export function propertyTitle(p: Pick<Property, "type" | "operation" | "colonia">, lang: Lang = "es") {
  return lang === "en"
    ? `${typeLabel(lang, p.type)} ${opPlural(lang, p.operation)} in ${p.colonia}, ${CITY}`
    : `${TYPES[p.type].label} ${OPERATIONS[p.operation].plural} en ${p.colonia}, ${CITY}`;
}

export function propertyJsonLd(p: Property, lang: Lang = "es", text?: { title: string; description: string }) {
  const url = `${SITE_URL}${localizePath(lang, `/propiedad/${p.slug}`)}`;
  const isRent = p.operation === "renta";
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: text?.title ?? p.title,
    description: (text?.description ?? p.description).slice(0, 500),
    url,
    datePosted: new Date(p.approved_at ?? p.created_at).toISOString(),
    image: p.photos,
    inLanguage: lang === "en" ? "en" : "es-MX",
    about: {
      "@type": p.type === "terreno" ? "Landform" : p.type === "departamento" ? "Apartment" : p.type === "local" ? "Store" : "House",
      address: { "@type": "PostalAddress", addressLocality: CITY, addressRegion: STATE, addressCountry: "MX", streetAddress: p.colonia },
      ...(p.bedrooms != null ? { numberOfBedrooms: p.bedrooms } : {}),
      ...(p.bathrooms != null ? { numberOfBathroomsTotal: p.bathrooms } : {}),
      ...(p.land_m2 != null ? { lotSize: { "@type": "QuantitativeValue", value: p.land_m2, unitCode: "MTK" } } : {}),
      ...(p.features?.length
        ? {
            amenityFeature: p.features
              .map((k) => featureLabel(k, lang === "en" ? "en" : "es"))
              .filter((n): n is string => Boolean(n))
              .map((name) => ({ "@type": "LocationFeatureSpecification", name, value: true })),
            ...(p.features.includes("mascotas") ? { petsAllowed: true } : {}),
          }
        : {}),
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

export function breadcrumbJsonLd(items: { name: string; path: string }[], lang: Lang = "es") {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${SITE_URL}${localizePath(lang, it.path)}` })),
  };
}

export function itemListJsonLd(name: string, props: Pick<Property, "slug" | "title">[], lang: Lang = "es") {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: props.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}${localizePath(lang, `/propiedad/${p.slug}`)}`, name: p.title })),
  };
}

export function websiteJsonLd(lang: Lang = "es") {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: lang === "en" ? `${SITE_URL}/en` : SITE_URL,
    inLanguage: lang === "en" ? "en" : "es-MX",
    description: lang === "en"
      ? `Houses, apartments, land and commercial space for rent, sale and transfer in ${CITY}, ${STATE}, Mexico.`
      : `Casas, departamentos, terrenos y locales en renta, venta y traspaso en ${CITY}, ${STATE}.`,
  };
}

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
