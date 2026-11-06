# Inmuebles Pátzcuaro

Next.js 15 + Neon Postgres + Vercel Blob. Publicar es gratis; el "Rey del día" ($20 MXN / 24 h) está construido pero apagado (`ENABLE_KING=false`).

## Variables de entorno
Ver `.env.example`. Mínimo para arrancar: `DATABASE_URL` (Neon), `ADMIN_PASSWORD`, `SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL`. Para fotos: `BLOB_READ_WRITE_TOKEN`.

## Puesta en marcha
1. `npm install`
2. Copia `.env.example` a `.env.local` y llénalo.
3. `npm run dev`. Las tablas se crean solas en la primera consulta.
4. Panel de moderación: `/admin`.

## Pendiente para Fase 2 (Rey del día)
- Checkout Pro de Mercado Pago en `app/api/rey/checkout/route.ts`.
- Webhook firmado que llame a `scheduleKing()` (`lib/king.ts`, ya idempotente por `payment_ref`).
- Poner `ENABLE_KING=true`.
