import { CITY, OPERATIONS, SITE_NAME, SITE_URL, STATE, TYPES } from "@/lib/config";

export const dynamic = "force-static";

export function GET() {
  const body = `# ${SITE_NAME}

> Tablón gratuito de propiedades en renta, venta y traspaso en ${CITY}, ${STATE}, México. Los dueños y agentes publican sin costo y los interesados los contactan directo por WhatsApp. El sitio no es inmobiliaria ni intermedia operaciones.

## Qué encontrarás
- Tipos de inmueble: ${Object.values(TYPES).map((t) => t.plural.toLowerCase()).join(", ")}.
- Operaciones: ${Object.values(OPERATIONS).map((o) => o.label.toLowerCase()).join(", ")}.
- Cada anuncio tiene página propia con precio en MXN, colonia, recámaras, baños, metros cuadrados, fotos y contacto.

## Páginas principales
- [Inicio y búsqueda](${SITE_URL}/): anuncios más recientes con filtros.
- [Propiedades en renta](${SITE_URL}/renta): casas, departamentos, locales y cuartos en renta.
- [Propiedades en venta](${SITE_URL}/venta): casas, terrenos y locales en venta.
- [Colonias de ${CITY}](${SITE_URL}/guias/colonias): zonas con anuncios disponibles.
- [Cómo evitar fraudes al rentar](${SITE_URL}/guias/como-evitar-fraudes-al-rentar): recomendaciones prácticas.
- [Publicar una propiedad](${SITE_URL}/publicar): gratis, sin crear cuenta.

## Estructura de URLs
- /renta/casas/centro, /venta/terrenos/<colonia>: listados por operación, tipo y colonia.
- /propiedad/<slug>: ficha individual.

## Notas
- Los precios están en pesos mexicanos (MXN). Las rentas son mensuales salvo que el anuncio indique otra cosa.
- Los anuncios se revisan manualmente y caducan a los 90 días si el dueño no confirma que siguen disponibles.
- Mapa del sitio: ${SITE_URL}/sitemap.xml
`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
