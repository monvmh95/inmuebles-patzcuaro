// Funciones puras, seguras para usar también en el navegador (sin módulos de Node).

export function formatPrice(price: number | null, operation: string): string {
  if (price == null) return "Precio a tratar";
  const n = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(price);
  return operation === "renta" ? `${n} /mes` : n;
}

export function formatDate(d: Date | string): string {
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "America/Mexico_City" }).format(new Date(d));
}

/** "hoy", "ayer", "hace 3 días", "hace 2 semanas", "hace 4 meses". */
export function timeAgo(d: Date | string, now: Date = new Date()): string {
  const days = Math.max(0, Math.floor((now.getTime() - new Date(d).getTime()) / 86_400_000));
  if (days === 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 14) return `hace ${days} días`;
  if (days < 60) return `hace ${Math.floor(days / 7)} semanas`;
  return `hace ${Math.floor(days / 30)} meses`;
}

/** Precio por m² solo para ventas con superficie conocida (terreno usa m² de terreno; el resto, construcción). */
export function pricePerM2(p: { price: number | null; operation: string; type: string; land_m2: number | null; built_m2: number | null }): number | null {
  if (p.operation !== "venta" || !p.price) return null;
  const area = p.type === "terreno" ? p.land_m2 : p.built_m2;
  if (!area || area <= 0) return null;
  return Math.round(p.price / area);
}
