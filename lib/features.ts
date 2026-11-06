import type { PropType } from "./config";

// Catálogo de características que quien publica marca con casillas.
// Sirven para: (1) pedirle a la IA datos reales, (2) mostrarlas en la ficha y
// (3) publicarlas como amenityFeature en schema.org (SEO / respuestas de IA).
export type Feature = { key: string; es: string; en: string; group: "servicios" | "espacios" | "zona" | "condiciones"; types: PropType[] | "all"; ops?: ("renta" | "venta" | "traspaso")[] };

const HOME: PropType[] = ["casa", "departamento", "cuarto"];
const BUILT: PropType[] = ["casa", "departamento", "cuarto", "local", "bodega"];

export const FEATURES: Feature[] = [
  // Servicios
  { key: "agua", es: "Agua potable", en: "Running water", group: "servicios", types: "all" },
  { key: "luz", es: "Luz eléctrica", en: "Electricity", group: "servicios", types: "all" },
  { key: "drenaje", es: "Drenaje", en: "Sewer", group: "servicios", types: "all" },
  { key: "gas", es: "Gas (estacionario o natural)", en: "Gas (tank or natural)", group: "servicios", types: BUILT },
  { key: "internet", es: "Internet disponible", en: "Internet available", group: "servicios", types: BUILT },
  { key: "cisterna", es: "Cisterna o tinaco", en: "Cistern or water tank", group: "servicios", types: BUILT },
  { key: "calentador_solar", es: "Calentador solar", en: "Solar water heater", group: "servicios", types: HOME },
  { key: "pozo", es: "Pozo o toma de agua propia", en: "Own well or water source", group: "servicios", types: ["terreno", "huerta"] },
  // Espacios
  { key: "cochera", es: "Cochera o estacionamiento", en: "Garage or parking", group: "espacios", types: BUILT },
  { key: "patio", es: "Patio", en: "Patio", group: "espacios", types: [...HOME, "local"] },
  { key: "jardin", es: "Jardín", en: "Garden", group: "espacios", types: ["casa", "departamento"] },
  { key: "terraza", es: "Terraza o balcón", en: "Terrace or balcony", group: "espacios", types: ["casa", "departamento"] },
  { key: "cocina", es: "Cocina integral", en: "Fitted kitchen", group: "espacios", types: HOME },
  { key: "chimenea", es: "Chimenea", en: "Fireplace", group: "espacios", types: ["casa", "departamento"] },
  { key: "bodega_interior", es: "Bodega o cuarto de servicio", en: "Storage or service room", group: "espacios", types: ["casa", "departamento", "local"] },
  { key: "arboles_frutales", es: "Árboles frutales", en: "Fruit trees", group: "espacios", types: ["huerta", "terreno", "casa"] },
  { key: "bardeado", es: "Bardeado o cercado", en: "Walled or fenced", group: "espacios", types: ["terreno", "huerta", "bodega"] },
  // Zona
  { key: "centro_caminando", es: "Cerca del centro (a pie)", en: "Walkable to downtown", group: "zona", types: "all" },
  { key: "acceso_pavimentado", es: "Calle o acceso pavimentado", en: "Paved street or access", group: "zona", types: "all" },
  { key: "privada", es: "Privada o fraccionamiento", en: "Gated community", group: "zona", types: ["casa", "departamento", "terreno"] },
  { key: "vigilancia", es: "Vigilancia o portón", en: "Security or gate", group: "zona", types: BUILT },
  { key: "transporte", es: "Transporte público cerca", en: "Public transport nearby", group: "zona", types: "all" },
  // Condiciones
  { key: "amueblado", es: "Amueblado", en: "Furnished", group: "condiciones", types: BUILT, ops: ["renta", "traspaso"] },
  { key: "mascotas", es: "Acepta mascotas", en: "Pets allowed", group: "condiciones", types: HOME, ops: ["renta"] },
  { key: "contrato", es: "Contrato formal de arrendamiento", en: "Formal lease contract", group: "condiciones", types: "all", ops: ["renta"] },
  { key: "escrituras", es: "Escrituras (propiedad privada)", en: "Deed (private property)", group: "condiciones", types: "all", ops: ["venta"] },
  { key: "credito", es: "Acepta crédito", en: "Accepts mortgage financing", group: "condiciones", types: "all", ops: ["venta"] },
  { key: "uso_habitacional", es: "Uso de suelo habitacional", en: "Residential zoning", group: "condiciones", types: ["terreno"] },
  { key: "uso_comercial", es: "Uso de suelo comercial", en: "Commercial zoning", group: "condiciones", types: ["terreno", "local", "bodega"] },
  { key: "uso_agricola", es: "Uso agrícola", en: "Agricultural use", group: "condiciones", types: ["terreno", "huerta"] },
];

export const FEATURE_KEYS = FEATURES.map((f) => f.key) as [string, ...string[]];
export const GROUP_LABEL: Record<Feature["group"], { es: string; en: string }> = {
  servicios: { es: "Servicios", en: "Utilities" },
  espacios: { es: "Espacios", en: "Spaces" },
  zona: { es: "Zona", en: "Location" },
  condiciones: { es: "Condiciones", en: "Terms" },
};

export function featuresFor(type: string, op: string): Feature[] {
  return FEATURES.filter((f) => (f.types === "all" || f.types.includes(type as PropType)) && (!f.ops || f.ops.includes(op as "renta")));
}
export function featureLabel(key: string, lang: "es" | "en"): string | null {
  const f = FEATURES.find((x) => x.key === key);
  return f ? f[lang] : null;
}
export function cleanFeatures(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.map(String).filter((k) => FEATURE_KEYS.includes(k)))].slice(0, 30);
}
