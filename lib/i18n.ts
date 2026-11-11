// Utilidades de idioma sin dependencias de Node ni de Next: se usan también en middleware y en el navegador.
import { OPERATIONS, TYPES, type Operation, type PropType } from "./config";
export type Lang = "es" | "en";

const TOP: [string, string][] = [
  ["renta", "rent"], ["venta", "sale"], ["traspaso", "transfer"], ["hospedaje", "lodging"], ["propiedad", "property"], ["publicar", "publish"],
  ["mapa", "map"], ["favoritos", "favorites"], ["verificacion", "verification"], ["guias", "guides"], ["colonias", "neighborhoods"], ["eventos", "events"],
];
const TYPES_: [string, string][] = [
  ["casas", "houses"], ["departamentos", "apartments"], ["terrenos", "land"], ["locales", "commercial"],
  ["cuartos", "rooms"], ["bodegas", "warehouses"], ["huertas", "orchards"],
  ["hoteles", "hotels"], ["posadas", "inns"], ["cabanas", "cabins"], ["hostales", "hostels"], ["glamping", "glamping"],
];
const GUIDES: [string, string][] = [
  ["como-evitar-fraudes-al-rentar", "avoiding-rental-scams"],
  ["comprar-terreno-en-patzcuaro", "buying-land-in-patzcuaro"],
  ["rentar-por-temporada-en-patzcuaro", "seasonal-rentals-in-patzcuaro"],
  ["vivir-en-patzcuaro", "living-in-patzcuaro"],
  ["colonias", "neighborhoods"],
];
const OPS = new Set(["renta", "venta", "traspaso", "hospedaje"]);

const toMap = (pairs: [string, string][], dir: "en" | "es") => new Map(pairs.map(([es, en]) => (dir === "en" ? [es, en] : [en, es])));
const MAPS = {
  en: { top: toMap(TOP, "en"), types: toMap(TYPES_, "en"), guides: toMap(GUIDES, "en") },
  es: { top: toMap(TOP, "es"), types: toMap(TYPES_, "es"), guides: toMap(GUIDES, "es") },
};

/** Traduce segmentos conocidos por posición (las colonias y los slugs de anuncios no se tocan). */
function mapPath(path: string, to: Lang): string {
  const m = MAPS[to];
  const parts = path.split("/").filter(Boolean);
  if (!parts.length) return "/";
  const esTop = to === "en" ? parts[0] : (m.top.get(parts[0]) ?? parts[0]);
  parts[0] = m.top.get(parts[0]) ?? parts[0];
  if (parts[1]) {
    if (OPS.has(esTop)) parts[1] = m.types.get(parts[1]) ?? parts[1];
    else if (esTop === "guias") parts[1] = m.guides.get(parts[1]) ?? parts[1];
    else if (esTop === "eventos") parts[1] = to === "en" ? (parts[1] === "enviar" ? "submit" : parts[1]) : (parts[1] === "submit" ? "enviar" : parts[1]);
  }
  return "/" + parts.join("/");
}
export const toEnPath = (esPath: string) => mapPath(esPath, "en");
export const toEsPath = (enPath: string) => mapPath(enPath, "es");

/** Convierte una ruta en español (con ?query y #hash opcionales) a la ruta pública del idioma. */
export function localizePath(lang: Lang, href: string): string {
  if (lang === "es" || !href.startsWith("/") || href.startsWith("//")) return href;
  const m = href.match(/^([^?#]*)(.*)$/)!;
  const path = toEnPath(m[1] || "/");
  return "/en" + (path === "/" ? "" : path) + m[2];
}

/** Ruta equivalente en el otro idioma, a partir de la ruta pública actual (con query). */
export function switchPath(lang: Lang, currentPublicPath: string): string {
  const m = currentPublicPath.match(/^([^?#]*)(.*)$/)!;
  if (lang === "en") {
    const es = toEsPath(m[1].replace(/^\/en/, "") || "/");
    return es + m[2];
  }
  return localizePath("en", currentPublicPath);
}

const OP_EN = { renta: { label: "Rent", plural: "for rent" }, venta: { label: "Sale", plural: "for sale" }, traspaso: { label: "Transfer", plural: "for transfer" }, hospedaje: { label: "Lodging", plural: "for lodging" } } as const;
const TYPE_EN = {
  casa: { label: "House", plural: "Houses" }, departamento: { label: "Apartment", plural: "Apartments" }, terreno: { label: "Land", plural: "Land" },
  local: { label: "Commercial space", plural: "Commercial spaces" }, cuarto: { label: "Room", plural: "Rooms" },
  bodega: { label: "Warehouse", plural: "Warehouses" }, huerta: { label: "Orchard", plural: "Orchards" },
  hotel: { label: "Hotel", plural: "Hotels" }, posada: { label: "Inn", plural: "Inns" }, cabana: { label: "Cabin", plural: "Cabins" },
  hostal: { label: "Hostel", plural: "Hostels" }, glamping: { label: "Glamping", plural: "Glamping" },
} as const;
export function opEn(op: string) { return OP_EN[op as keyof typeof OP_EN]; }
export function typeEn(t: string) { return TYPE_EN[t as keyof typeof TYPE_EN]; }

export const opLabel = (lang: Lang, op: Operation) => (lang === "en" ? opEn(op).label : OPERATIONS[op].label);
export const opPlural = (lang: Lang, op: Operation) => (lang === "en" ? opEn(op).plural : OPERATIONS[op].plural);
export const typeLabel = (lang: Lang, t: PropType) => (lang === "en" ? typeEn(t).label : TYPES[t].label);
export const typePlural = (lang: Lang, t: PropType) => (lang === "en" ? typeEn(t).plural : TYPES[t].plural);
