export const SITE_NAME = "Inmuebles Pátzcuaro";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const CITY = "Pátzcuaro";
export const STATE = "Michoacán";
export const KING_ENABLED = process.env.ENABLE_KING === "true";
export const KING_PRICE_MXN = 20;
export const KING_HOURS = 24;
export const MAX_PHOTOS = 8;

export const OPERATIONS = {
  renta: { label: "Renta", plural: "en renta" },
  venta: { label: "Venta", plural: "en venta" },
  traspaso: { label: "Traspaso", plural: "en traspaso" },
} as const;
export type Operation = keyof typeof OPERATIONS;

export const TYPES = {
  casa: { label: "Casa", slug: "casas", plural: "Casas" },
  departamento: { label: "Departamento", slug: "departamentos", plural: "Departamentos" },
  terreno: { label: "Terreno", slug: "terrenos", plural: "Terrenos" },
  local: { label: "Local", slug: "locales", plural: "Locales" },
  cuarto: { label: "Cuarto", slug: "cuartos", plural: "Cuartos" },
} as const;
export type PropType = keyof typeof TYPES;

export function typeFromSlug(slug: string): PropType | null {
  const hit = (Object.keys(TYPES) as PropType[]).find((k) => TYPES[k].slug === slug);
  return hit ?? null;
}
export function isOperation(v: string): v is Operation {
  return v in OPERATIONS;
}
