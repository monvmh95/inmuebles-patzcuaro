import { query } from "./db";
import { SEED_EVENTS } from "./events-seed";
import { randomId, slugify } from "./util";
import type { Lang } from "./i18n";

export const EVENT_CATEGORIES = {
  cultura: { es: "Cultura", en: "Culture" },
  gastronomia: { es: "Gastronomía", en: "Food & drink" },
  feria: { es: "Feria", en: "Fair" },
  tradicion: { es: "Tradición", en: "Tradition" },
  naturaleza: { es: "Naturaleza", en: "Nature" },
  musica: { es: "Música", en: "Music" },
  deporte: { es: "Deporte", en: "Sports" },
  otro: { es: "Otro", en: "Other" },
} as const;
export type EventCategory = keyof typeof EVENT_CATEGORIES;
export const categoryLabel = (c: string, lang: Lang) => (EVENT_CATEGORIES[c as EventCategory] ?? EVENT_CATEGORIES.otro)[lang];

export type EventRow = {
  id: number; series: string; year: number; title: string; title_en: string | null; summary: string; summary_en: string | null;
  description: string; description_en: string | null; category: string; city: string; venue: string; address: string | null;
  starts_on: string; ends_on: string; time_text: string | null; date_note: string | null; date_note_en: string | null;
  price_text: string | null; is_free: boolean | null; organizer: string | null; source_name: string | null; source_url: string | null;
  contact: string | null; status: string; event_status: "scheduled" | "cancelled" | "postponed"; created_at: string; updated_at: string;
};

const COLS = `id, series, year, title, title_en, summary, summary_en, description, description_en, category, city, venue, address,
  to_char(starts_on,'YYYY-MM-DD') AS starts_on, to_char(ends_on,'YYYY-MM-DD') AS ends_on, time_text, date_note, date_note_en,
  price_text, is_free, organizer, source_name, source_url, contact, status, event_status, created_at, updated_at`;
const TODAY = `(now() AT TIME ZONE 'America/Mexico_City')::date`;

/** Fecha de hoy en Ciudad de México, como AAAA-MM-DD. */
export function todayMx(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });
}

let seeded = false;
async function seedOnce() {
  if (seeded) return;
  for (const e of SEED_EVENTS) {
    await query(
      `INSERT INTO events (series, year, title, title_en, summary, summary_en, description, description_en, category, city, venue, starts_on, ends_on,
         time_text, date_note, date_note_en, organizer, source_name, source_url, status, approved_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,'approved',now())
       ON CONFLICT (series, year) DO NOTHING`,
      [e.series, e.year, e.title, e.title_en, e.summary, e.summary_en, e.description, e.description_en, e.category, e.city, e.venue, e.starts_on, e.ends_on,
        e.time_text ?? null, e.date_note ?? null, e.date_note_en ?? null, e.organizer ?? null, e.source_name, e.source_url],
    );
  }
  seeded = true;
}

/** Todas las ediciones publicadas, de la más próxima a la más lejana (las ya pasadas al final, de la más reciente a la más antigua). */
export async function listApproved(): Promise<EventRow[]> {
  await seedOnce();
  return query<EventRow>(`SELECT ${COLS} FROM events WHERE status='approved' ORDER BY starts_on ASC`);
}

export async function listUpcoming(limit = 50): Promise<EventRow[]> {
  await seedOnce();
  return query<EventRow>(`SELECT ${COLS} FROM events WHERE status='approved' AND ends_on >= ${TODAY} ORDER BY starts_on ASC LIMIT $1`, [limit]);
}

export async function listEditions(series: string): Promise<EventRow[]> {
  await seedOnce();
  return query<EventRow>(`SELECT ${COLS} FROM events WHERE status='approved' AND series=$1 ORDER BY starts_on DESC`, [series]);
}

/** La edición que se muestra: la que sigue o está en curso; si no hay, la más reciente. */
export function pickEdition(editions: EventRow[], today = todayMx()): EventRow | null {
  if (!editions.length) return null;
  const live = editions.filter((e) => e.ends_on >= today).sort((a, b) => a.starts_on.localeCompare(b.starts_on));
  return live[0] ?? [...editions].sort((a, b) => b.starts_on.localeCompare(a.starts_on))[0];
}

export async function listSeriesForSitemap(): Promise<{ series: string; updated_at: string }[]> {
  await seedOnce();
  return query(`SELECT series, MAX(updated_at) AS updated_at FROM events WHERE status='approved' GROUP BY series`);
}

export async function listPendingEvents(): Promise<EventRow[]> {
  return query<EventRow>(`SELECT ${COLS} FROM events WHERE status='pending' ORDER BY id ASC LIMIT 50`);
}

export type NewEvent = {
  title: string; description: string; category: string; city: string; venue: string; starts_on: string; ends_on: string;
  time_text?: string; price_text?: string; organizer?: string; source_name?: string; source_url?: string; contact?: string; ip_hash?: string;
};

export async function createPendingEvent(e: NewEvent): Promise<void> {
  const year = Number(e.starts_on.slice(0, 4));
  const base = slugify(e.title).slice(0, 60) || "evento";
  for (const series of [base, `${base}-${randomId(2)}`]) {
    const r = await query(
      `INSERT INTO events (series, year, title, summary, description, category, city, venue, starts_on, ends_on, time_text, price_text, organizer, source_name, source_url, contact, ip_hash, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,'pending')
       ON CONFLICT (series, year) DO NOTHING RETURNING id`,
      [series, year, e.title, e.description.slice(0, 180), e.description, e.category, e.city, e.venue, e.starts_on, e.ends_on, e.time_text || null,
        e.price_text || null, e.organizer || null, e.source_name || null, e.source_url || null, e.contact || null, e.ip_hash || null],
    );
    if (r.length) return;
  }
  throw new Error("No se pudo guardar el evento");
}

export async function recentSubmissions(ipHash: string): Promise<number> {
  const [{ n }] = await query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM events WHERE ip_hash = $1 AND created_at > now() - interval '1 hour'`, [ipHash]);
  return n;
}

/* ---------- Formato ---------- */

const parts = (d: string) => d.split("-").map(Number) as [number, number, number];
const fmt = (d: string, lang: Lang, opts: Intl.DateTimeFormatOptions) => {
  const [y, m, day] = parts(d);
  return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "es-MX", { timeZone: "UTC", ...opts }).format(new Date(Date.UTC(y, m - 1, day)));
};
export const fmtDay = (d: string, lang: Lang) => fmt(d, lang, { day: "numeric", month: "long", year: "numeric" });
export const fmtMonthYear = (d: string, lang: Lang) => fmt(d, lang, { month: "long", year: "numeric" });

export function fmtRange(a: string, b: string, lang: Lang): string {
  if (a === b) return fmtDay(a, lang);
  const [ya, ma] = parts(a); const [yb, mb] = parts(b);
  if (ya === yb && ma === mb) {
    const d1 = parts(a)[2]; const d2 = parts(b)[2];
    const month = fmt(a, lang, { month: "long" });
    return lang === "en" ? `${month} ${d1}–${d2}, ${ya}` : `${d1}–${d2} de ${month} de ${ya}`;
  }
  return `${fmtDay(a, lang)} – ${fmtDay(b, lang)}`;
}

export type Phase = "upcoming" | "live" | "past";
export function phaseOf(e: Pick<EventRow, "starts_on" | "ends_on">, today = todayMx()): Phase {
  if (e.ends_on < today) return "past";
  if (e.starts_on <= today) return "live";
  return "upcoming";
}

export const evTitle = (e: EventRow, lang: Lang) => (lang === "en" && e.title_en) || e.title;
export const evSummary = (e: EventRow, lang: Lang) => (lang === "en" && e.summary_en) || e.summary;
export const evDescription = (e: EventRow, lang: Lang) => (lang === "en" && e.description_en) || e.description;
export const evDateNote = (e: EventRow, lang: Lang) => (lang === "en" && e.date_note_en) || e.date_note;
