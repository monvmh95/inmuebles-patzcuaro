"use client";
import { useState } from "react";
import { useT } from "./LangProvider";

const CATS: [string, string, string][] = [
  ["cultura", "Cultura", "Culture"], ["gastronomia", "Gastronomía", "Food & drink"], ["feria", "Feria", "Fair"], ["tradicion", "Tradición", "Tradition"],
  ["naturaleza", "Naturaleza", "Nature"], ["musica", "Música", "Music"], ["deporte", "Deporte", "Sports"], ["otro", "Otro", "Other"],
];

export default function EventForm() {
  const t = useT();
  const [f, setF] = useState({ title: "", description: "", category: "cultura", city: "Pátzcuaro", venue: "", starts_on: "", ends_on: "", time_text: "", price_text: "", organizer: "", source_url: "", contact: "", website: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      const res = await fetch("/api/eventos", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || t("No se pudo enviar.", "Could not send."));
      setDone(true);
    } catch (x) { setErr(x instanceof Error ? x.message : t("No se pudo enviar.", "Could not send.")); }
    finally { setBusy(false); }
  }

  if (done) return <div className="notice notice-ok"><h2>{t("¡Gracias!", "Thank you!")}</h2><p>{t("Recibimos tu evento. Lo revisamos antes de publicarlo.", "We received your event. We review it before publishing.")}</p></div>;
  return (
    <form onSubmit={submit} className="form stack" style={{ maxWidth: 560 }}>
      <label>{t("Nombre del evento", "Event name")}<input value={f.title} onChange={set("title")} maxLength={120} required /></label>
      <label>{t("Categoría", "Category")}
        <select value={f.category} onChange={set("category")}>{CATS.map(([k, es, en]) => <option key={k} value={k}>{t(es, en)}</option>)}</select>
      </label>
      <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
        <label style={{ flex: 1, minWidth: 140 }}>{t("Fecha de inicio", "Start date")}<input type="date" value={f.starts_on} onChange={set("starts_on")} required /></label>
        <label style={{ flex: 1, minWidth: 140 }}>{t("Fecha final (si dura varios días)", "End date (if multi-day)")}<input type="date" value={f.ends_on} onChange={set("ends_on")} min={f.starts_on || undefined} /></label>
      </div>
      <label>{t("Horario (opcional)", "Time (optional)")}<input value={f.time_text} onChange={set("time_text")} maxLength={80} placeholder={t("Ej. 6:00 pm", "E.g. 6:00 pm")} /></label>
      <label>{t("Lugar", "Venue")}<input value={f.venue} onChange={set("venue")} maxLength={140} required placeholder={t("Ej. Plaza Vasco de Quiroga", "E.g. Plaza Vasco de Quiroga")} /></label>
      <label>{t("Población", "Town")}<input value={f.city} onChange={set("city")} maxLength={60} required /></label>
      <label>{t("Descripción", "Description")}<textarea value={f.description} onChange={set("description")} rows={5} maxLength={2000} required placeholder={t("Qué es, qué habrá y a quién va dirigido.", "What it is, what to expect and who it is for.")} /></label>
      <label>{t("Costo (opcional)", "Price (optional)")}<input value={f.price_text} onChange={set("price_text")} maxLength={80} placeholder={t("Ej. Entrada libre", "E.g. Free admission")} /></label>
      <label>{t("Organiza (opcional)", "Organizer (optional)")}<input value={f.organizer} onChange={set("organizer")} maxLength={100} /></label>
      <label>{t("Enlace oficial (recomendado)", "Official link (recommended)")}<input type="url" value={f.source_url} onChange={set("source_url")} maxLength={300} placeholder="https://" /></label>
      <label>{t("WhatsApp o correo para dudas (no se publica)", "WhatsApp or email for questions (not published)")}<input value={f.contact} onChange={set("contact")} maxLength={120} /></label>
      <input name="website" value={f.website} onChange={set("website")} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px", height: 0, width: 0, opacity: 0 }} />
      <button className="btn" disabled={busy}>{busy ? t("Enviando…", "Sending…") : t("Enviar evento", "Send event")}</button>
      {err && <p className="error" role="alert">{err}</p>}
    </form>
  );
}
