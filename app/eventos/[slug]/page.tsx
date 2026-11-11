import type { Metadata } from "next";
import { notFound } from "next/navigation";
import L from "@/components/L";
import { CITY } from "@/lib/config";
import { alternatesFor } from "@/lib/alternates";
import { getLang, tf } from "@/lib/lang";
import { safe } from "@/lib/safe";
import { categoryLabel, evDateNote, evDescription, evSummary, evTitle, fmtRange, listEditions, phaseOf, pickEdition, type EventRow } from "@/lib/events";
import { breadcrumbJsonLd, eventJsonLd, JsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const editions = await safe(() => listEditions(slug), [] as EventRow[]);
  return { editions, ev: pickEdition(editions) };
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  const lang = await getLang();
  const t = tf(lang);
  const { ev } = await load(slug);
  if (!ev) return { title: t("Evento no encontrado", "Event not found"), robots: { index: false } };
  const title = evTitle(ev, lang);
  const desc = `${fmtRange(ev.starts_on, ev.ends_on, lang)}. ${evSummary(ev, lang)}`.slice(0, 200);
  return {
    title: `${title} · ${ev.city}`,
    description: desc,
    alternates: alternatesFor(lang, `/eventos/${ev.series}`),
    openGraph: { title, description: desc, type: "article" },
  };
}

export default async function EventPage({ params }: P) {
  const { slug } = await params;
  const lang = await getLang();
  const t = tf(lang);
  const { editions, ev } = await load(slug);
  if (!ev) notFound();
  const ph = phaseOf(ev);
  const others = editions.filter((e) => e.id !== ev.id);
  const note = evDateNote(ev, lang);
  const paras = evDescription(ev, lang).split(/\n{2,}/);
  return (
    <article className="stack legal" style={{ maxWidth: "74ch" }}>
      <JsonLd data={eventJsonLd(ev, lang)} />
      <JsonLd data={breadcrumbJsonLd([{ name: t("Inicio", "Home"), path: "/" }, { name: t("Eventos", "Events"), path: "/eventos" }, { name: evTitle(ev, lang), path: `/eventos/${ev.series}` }], lang)} />
      <p className="small muted" style={{ margin: 0 }}><L href="/eventos">← {t("Todos los eventos", "All events")}</L></p>
      <div className="ev-meta">
        <span className="ev-cat">{categoryLabel(ev.category, lang)}</span>
        {ph === "live" && <span className="ev-badge ev-live">{t("En curso", "Happening now")}</span>}
        {ph === "past" && <span className="ev-badge">{t("Ya pasó esta edición", "This edition is over")}</span>}
        {ev.event_status === "cancelled" && <span className="ev-badge ev-bad">{t("Cancelado", "Cancelled")}</span>}
        {ev.event_status === "postponed" && <span className="ev-badge ev-bad">{t("Pospuesto", "Postponed")}</span>}
      </div>
      <h1 style={{ margin: 0 }}>{evTitle(ev, lang)}</h1>
      <p style={{ fontSize: "1.1rem", margin: 0 }}>{evSummary(ev, lang)}</p>

      <dl className="ev-facts">
        <div><dt>{t("Cuándo", "When")}</dt><dd><time dateTime={ev.starts_on}>{fmtRange(ev.starts_on, ev.ends_on, lang)}</time>{ev.time_text ? ` · ${ev.time_text}` : ""}{note ? <><br /><span className="muted small">{note}</span></> : null}</dd></div>
        <div><dt>{t("Dónde", "Where")}</dt><dd>{ev.venue ? `${ev.venue}, ` : ""}{ev.city}{ev.address ? ` · ${ev.address}` : ""}</dd></div>
        {ev.price_text && <div><dt>{t("Costo", "Price")}</dt><dd>{ev.price_text}</dd></div>}
        {ev.organizer && <div><dt>{t("Organiza", "Organizer")}</dt><dd>{ev.organizer}</dd></div>}
        {ev.source_url && <div><dt>{t("Fuente", "Source")}</dt><dd><a href={ev.source_url} target="_blank" rel="noopener nofollow">{ev.source_name || ev.source_url}</a></dd></div>}
      </dl>

      {paras.map((p, i) => <p key={i}>{p}</p>)}

      {ph !== "past" && ev.event_status === "scheduled" && (
        <p><a className="btn btn-small btn-ghost" href={`/eventos/${ev.series}/evento.ics`}>{t("Agregar a mi calendario", "Add to my calendar")}</a></p>
      )}

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>{t(`¿Dónde quedarte en ${CITY}?`, `Where to stay in ${CITY}`)}</h2>
        <p style={{ margin: "0 0 10px" }}>{t("Hoteles, posadas, cabañas y casas por noche, con contacto directo con el anfitrión. En fechas de evento se llenan rápido.", "Hotels, inns, cabins and houses by the night, with direct contact with the host. They fill up fast on event dates.")}</p>
        <L href="/hospedaje" className="btn btn-small">{t("Ver hospedaje", "See lodging")}</L>
      </div>

      {others.length > 0 && (
        <section>
          <h2>{t("Otras ediciones", "Other editions")}</h2>
          <ul>{others.map((e) => <li key={e.id}>{evTitle(e, lang)} · {fmtRange(e.starts_on, e.ends_on, lang)}</li>)}</ul>
        </section>
      )}

      <p className="muted small">
        {t("Revisa fechas, horarios y costos en la fuente oficial antes de ir: pueden cambiar.", "Check dates, times and prices at the official source before you go: they can change.")}{" "}
        {t("Última revisión:", "Last checked:")} <time dateTime={new Date(ev.updated_at).toISOString()}>{new Date(ev.updated_at).toLocaleDateString(lang === "en" ? "en-US" : "es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Mexico_City" })}</time>.
      </p>
    </article>
  );
}
