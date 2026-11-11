import { CITY, OPERATIONS, SITE_NAME, SITE_URL, STATE, TYPES } from "./config";
import type { Property } from "./properties";
import { localizePath, opPlural, typeLabel, type Lang } from "./i18n";
import { featureLabel } from "./features";
import { evDescription, evTitle, type EventRow } from "./events";

export function propertyTitle(p: Pick<Property, "type" | "operation" | "colonia">, lang: Lang = "es") {
  if (p.operation === "hospedaje") return lang === "en" ? `${typeLabel(lang, p.type)} to stay in ${p.colonia}, ${CITY}` : `${TYPES[p.type].label} para hospedarse en ${p.colonia}, ${CITY}`;
  return lang === "en"
    ? `${typeLabel(lang, p.type)} ${opPlural(lang, p.operation)} in ${p.colonia}, ${CITY}`
    : `${TYPES[p.type].label} ${OPERATIONS[p.operation].plural} en ${p.colonia}, ${CITY}`;
}

export function propertyJsonLd(p: Property, lang: Lang = "es", text?: { title: string; description: string }) {
  const url = `${SITE_URL}${localizePath(lang, `/propiedad/${p.slug}`)}`;
  const isRent = p.operation === "renta";
  if (p.operation === "hospedaje") return lodgingJsonLd(p, lang, text, url);
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

function lodgingJsonLd(p: Property, lang: Lang, text: { title: string; description: string } | undefined, url: string) {
  const names = [...(p.features ?? []).map((k) => featureLabel(k, lang === "en" ? "en" : "es")), ...(p.custom_features ?? [])].filter((n): n is string => Boolean(n));
  return {
    "@context": "https://schema.org",
    "@type": p.type === "hotel" ? "Hotel" : p.type === "hostal" ? "Hostel" : p.type === "posada" ? "BedAndBreakfast" : "LodgingBusiness",
    name: text?.title ?? p.title,
    description: (text?.description ?? p.description).slice(0, 500),
    url,
    image: p.photos,
    inLanguage: lang === "en" ? "en" : "es-MX",
    address: { "@type": "PostalAddress", addressLocality: CITY, addressRegion: STATE, addressCountry: "MX", streetAddress: p.colonia },
    ...(p.lat != null && p.lng != null ? { geo: { "@type": "GeoCoordinates", latitude: p.lat, longitude: p.lng } } : {}),
    ...(p.price != null ? { priceRange: lang === "en" ? `From $${p.price} MXN per night` : `Desde $${p.price} MXN por noche` } : {}),
    ...(p.checkin ? { checkinTime: p.checkin } : {}),
    ...(p.checkout ? { checkoutTime: p.checkout } : {}),
    ...((p.features ?? []).includes("h_mascotas") ? { petsAllowed: true } : {}),
    ...(names.length ? { amenityFeature: names.map((name) => ({ "@type": "LocationFeatureSpecification", name, value: true })) } : {}),
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

export function eventJsonLd(e: EventRow, lang: Lang = "es") {
  const url = `${SITE_URL}${localizePath(lang, `/eventos/${e.series}`)}`;
  const status = e.event_status === "cancelled" ? "EventCancelled" : e.event_status === "postponed" ? "EventPostponed" : "EventScheduled";
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: evTitle(e, lang),
    description: evDescription(e, lang).replace(/\s+/g, " ").slice(0, 500),
    url,
    startDate: e.starts_on,
    endDate: e.ends_on,
    eventStatus: `https://schema.org/${status}`,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    inLanguage: lang === "en" ? "en" : "es-MX",
    location: {
      "@type": "Place",
      name: e.venue || e.city,
      address: { "@type": "PostalAddress", ...(e.address ? { streetAddress: e.address } : {}), addressLocality: e.city, addressRegion: STATE, addressCountry: "MX" },
    },
    ...(e.organizer ? { organizer: { "@type": "Organization", name: e.organizer } } : {}),
    ...(e.is_free === true ? { isAccessibleForFree: true } : {}),
  };
}

export function eventsListJsonLd(name: string, items: EventRow[], lang: Lang = "es") {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((e, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}${localizePath(lang, `/eventos/${e.series}`)}`, name: evTitle(e, lang) })),
  };
}
