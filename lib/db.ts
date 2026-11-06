import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let client: NeonQueryFunction<false, false> | null = null;

export function hasDb() {
  return Boolean(process.env.DATABASE_URL);
}

function getClient() {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL no está configurada");
    client = neon(url);
  }
  return client;
}

let schemaReady: Promise<void> | null = null;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS properties (
    id            BIGSERIAL PRIMARY KEY,
    slug          TEXT UNIQUE NOT NULL,
    token_hash    TEXT NOT NULL,
    operation     TEXT NOT NULL CHECK (operation IN ('renta','venta','traspaso')),
    type          TEXT NOT NULL CHECK (type IN ('casa','departamento','terreno','local','cuarto','bodega','huerta')),
    title         TEXT NOT NULL,
    description   TEXT NOT NULL,
    price         INTEGER,
    colonia       TEXT NOT NULL,
    colonia_slug  TEXT NOT NULL,
    bedrooms      SMALLINT,
    bathrooms     SMALLINT,
    land_m2       INTEGER,
    built_m2      INTEGER,
    owner_kind    TEXT NOT NULL DEFAULT 'dueno' CHECK (owner_kind IN ('dueno','agente')),
    whatsapp      TEXT NOT NULL,
    email         TEXT,
    photos        JSONB NOT NULL DEFAULT '[]'::jsonb,
    status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','archived')),
    views         INTEGER NOT NULL DEFAULT 0,
    wa_clicks     INTEGER NOT NULL DEFAULT 0,
    ip_hash       TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    approved_at   TIMESTAMPTZ,
    confirmed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `ALTER TABLE properties ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ`,
  `ALTER TABLE properties ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION`,
  `ALTER TABLE properties ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION`,
  `ALTER TABLE properties ADD COLUMN IF NOT EXISTS lake_view BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_type_check`,
  `ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_type_check2`,
  `ALTER TABLE properties ADD CONSTRAINT properties_type_check2 CHECK (type IN ('casa','departamento','terreno','local','cuarto','bodega','huerta'))`,
  `CREATE INDEX IF NOT EXISTS idx_properties_listing ON properties (status, operation, type, colonia_slug, approved_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_properties_ip ON properties (ip_hash, created_at)`,
  `CREATE TABLE IF NOT EXISTS reports (
    id          BIGSERIAL PRIMARY KEY,
    property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    reason      TEXT NOT NULL,
    ip_hash     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved    BOOLEAN NOT NULL DEFAULT false
  )`,
  `CREATE TABLE IF NOT EXISTS uploads_log (
    id         BIGSERIAL PRIMARY KEY,
    ip_hash    TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_uploads_ip ON uploads_log (ip_hash, created_at)`,
  // Fase 2 (Rey del dia). Las tablas existen desde hoy; el flujo de cobro se activa con ENABLE_KING.
  `CREATE TABLE IF NOT EXISTS king_slots (
    id          BIGSERIAL PRIMARY KEY,
    property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    starts_at   TIMESTAMPTZ NOT NULL,
    ends_at     TIMESTAMPTZ NOT NULL,
    payment_ref TEXT UNIQUE,
    source      TEXT NOT NULL DEFAULT 'payment',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_king_slots_time ON king_slots (starts_at, ends_at)`,
];

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const db = getClient();
      for (const stmt of SCHEMA) await db.query(stmt);
    })().catch((e) => {
      schemaReady = null;
      throw e;
    });
  }
  return schemaReady;
}

export async function query<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  await ensureSchema();
  const rows = await getClient().query(text, params);
  return rows as unknown as T[];
}
