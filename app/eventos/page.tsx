import type { Metadata } from "next";
import L from "@/components/L";
import { CITY, STATE } from "@/lib/config";
import { alternatesFor } from "@/lib/alternates";
import { getLang, tf } from "@/lib/lang";
import { safe } from "@/lib/safe";
import { categoryLabel, evSummary, evTitle, fmtMonthYear, fmtRange, listApproved, phaseOf, todayMx, type EventRow } from "@/lib/events";
import { breadcrumbJsonLd, eventsListJsonLd, JsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  const t = tf(lang);
  return {
    title: t(`Eventos en ${CITY}, ${STATE}: agenda y fechas`, `Events in ${CITY}, ${STATE}: calendar and dates`),
    description: t(
      `Agenda de festivales, ferias y tradiciones en ${CITY} y la región del lago: fechas, sedes y fuente oficial de cada evento.`,
      `Calendar of festivals, fairs and traditions in ${CITY} and the lake region: dates, venues and the official source for each event.`,
    ),
    alternates: alternatesFor(lang, "/eventos"),
  };
}

function Card({ e, lang }: { e: EventRow; lang: "es" | "en" }) {
  const t = tf(lang);
  const ph = phaseOf(e);
  return (
    <li className="panel ev-card">
      <div className="ev-meta">
        <span className="ev-cat">{categoryLabel(e.category, lang)}</span>
        {ph === "live" && <span className="ev-badge ev-live">{t("En curso", "Happening now")}</span>}
        {ph === "past" && <span className="ev-badge">{t("Ya pasó", "Past")}</span>}
        {e.event_status === "cancelled" && <span className="ev-badge ev-bad">{t("Cancelado", "Cancelled")}</span>}
        {e.event_status === "postponed" && <span className="ev-badge ev-bad">{t("Pospuesto", "Postponed")}</span>}
      </div>
      <h3><L href={`/eventos/${e.series}`}>{evTitle(e, lang)}</L></h3>
      <p className="ev-when"><time dateTime={e.starts_on}>{fmtRange(e.starts_on, e.ends_on, lang)}</time> · {e.city}</p>
      <p className="muted" style={{ margin: 0 }}>{evSummary(e, lang)}</p>
    </li>
  );
}

export default async function Eventos() {
  const lang = await getLang();
  const t = tf(lang);
  const all = await safe(() => listApproved(), [] as EventRow[]);
  const today = todayMx();
  const upcoming = all.filter((e) => e.ends_on >= today);
  const upSeries = new Set(upcoming.map((e) => e.series));
  // Eventos que se repiten cada año: se muestran aparte, con la edición más reciente.
  const yearly = [...new Map(all.filter((e) => e.ends_on < today && !upSeries.has(e.series)).sort((a, b) => a.starts_on.localeCompare(b.starts_on)).map((e) => [e.series, e])).values()];
  const byMonth = new Map<string, EventRow[]>();
  for (const e of upcoming) {
    const k = fmtMonthYear(e.starts_on < today ? today : e.starts_on, lang);
    byMonth.set(k, [...(byMonth.get(k) ?? []), e]);
  }
  return (
    <div className="stack legal" style={{ maxWidth: "80ch" }}>
      <JsonLd data={breadcrumbJsonLd([{ name: t("Inicio", "Home"), path: "/" }, { name: t("Eventos", "Events"), path: "/eventos" }], lang)} />
      {upcoming.length > 0 && <JsonLd data={eventsListJsonLd(t("Próximos eventos en Pátzcuaro", "Upcoming events in Pátzcuaro"), upcoming, lang)} />}
      <h1>{t(`Eventos en ${CITY}`, `Events in ${CITY}`)}</h1>
      <p className="muted">
        {t(
          `Festivales, ferias y tradiciones de ${CITY} y la región del lago. Cada evento enlaza a su fuente oficial: confirma horarios y costos ahí antes de ir.`,
          `Festivals, fairs and traditions in ${CITY} and the lake region. Each event links to its official source: confirm times and prices there before you go.`,
        )}
      </p>

      {upcoming.length === 0 ? (
        <p>{t("No hay eventos próximos publicados por ahora.", "There are no upcoming events published right now.")}</p>
      ) : (
        [...byMonth.entries()].map(([month, evs]) => (
          <section key={month}>
            <h2 style={{ textTransform: "capitalize" }}>{month}</h2>
            <ul className="stack" style={{ listStyle: "none", padding: 0 }}>{evs.map((e) => <Card key={e.id} e={e} lang={lang} />)}</ul>
          </section>
        ))
      )}

      {yearly.length > 0 && (
        <section>
          <h2>{t("Se repiten cada año", "Happens every year")}</h2>
          <p className="muted">{t("Ya pasó la edición más reciente. Estas páginas se actualizan cuando se publica el programa siguiente.", "The latest edition is over. These pages are updated when the next program is published.")}</p>
          <ul className="stack" style={{ listStyle: "none", padding: 0 }}>{yearly.map((e) => <Card key={e.id} e={e} lang={lang} />)}</ul>
        </section>
      )}

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>{t("¿Vienes a un evento?", "Coming to an event?")}</h2>
        <p style={{ margin: "0 0 10px" }}>{t("Las fechas de feria y de Noche de Muertos se llenan rápido. Reserva con anticipación.", "Fair and Day of the Dead dates fill up fast. Book early.")}</p>
        <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
          <L href="/hospedaje" className="btn btn-small">{t(`Ver hospedaje en ${CITY}`, `See lodging in ${CITY}`)}</L>
          <L href="/eventos/enviar" className="btn btn-small btn-ghost">{t("Proponer un evento", "Suggest an event")}</L>
        </div>
      </div>
    </div>
  );
}
