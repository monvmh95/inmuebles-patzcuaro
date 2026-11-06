"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type MyItem = {
  slug: string; title: string; description: string; price: number | null; whatsapp: string; status: string; operation: string;
  views: number; wa_clicks: number; photo: string | null; expires: string; edited: boolean;
};
const STATUS: Record<string, string> = { pending: "En revisión", approved: "Publicado", rejected: "No aprobado", archived: "Dado de baja" };
const money = (n: number | null, op: string) => (n == null ? "Precio a tratar" : `$${n.toLocaleString("en-US")} MXN${op === "renta" ? " /mes" : ""}`);

function Card({ it }: { it: MyItem }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [title, setTitle] = useState(it.title);
  const [desc, setDesc] = useState(it.description);
  const [price, setPrice] = useState(it.price == null ? "" : String(it.price));
  const [wa, setWa] = useState(it.whatsapp);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg("");
    const res = await fetch(`/api/cuenta/anuncios/${it.slug}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ title, description: desc, price, whatsapp: wa }) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg(j.error || "No se pudo guardar.");
    setEditing(false); setMsg(it.status === "rejected" ? "Listo, lo mandamos a revisión otra vez." : "Cambios guardados."); router.refresh();
  }
  async function act(action: "renew" | "archive") {
    if (action === "archive" && !confirm("¿Dar de baja este anuncio? Dejará de mostrarse.")) return;
    setBusy(true); setMsg("");
    const res = await fetch(`/api/cuenta/anuncios/${it.slug}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action }) });
    setBusy(false);
    if (!res.ok) return setMsg("No se pudo completar la acción.");
    setMsg(action === "renew" ? "Listo: seguirá visible 90 días más." : "Anuncio dado de baja."); router.refresh();
  }
  async function copyLink() {
    const url = `${window.location.origin}/propiedad/${it.slug}`;
    try {
      if (navigator.share && /Android|iPhone|iPad/i.test(navigator.userAgent)) { await navigator.share({ title: it.title, url }); return; }
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea"); ta.value = url; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch { /* sin portapapeles */ }
      ta.remove();
    }
    setMsg("Enlace copiado. Pégalo en tu publicación de Facebook o donde quieras.");
  }
  const live = it.status === "approved" || it.status === "pending";

  return (
    <div className="my-card">
      <div className="my-head">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {it.photo ? <img src={it.photo} alt="" loading="lazy" /> : <div className="my-noimg">Sin foto</div>}
        <div className="stack" style={{ gap: 4 }}>
          <strong>{it.title}</strong>
          <span className={`my-status my-${it.status}`}>{STATUS[it.status] ?? it.status}</span>
          <span className="muted small">{money(it.price, it.operation)}</span>
        </div>
      </div>
      <div className="stats my-stats">
        <div className="stat"><b>{it.views}</b>visitas</div>
        <div className="stat"><b>{it.wa_clicks}</b>clics a WhatsApp</div>
      </div>
      {it.status === "approved" && <p className="muted small" style={{ margin: 0 }}>Visible hasta el {it.expires}. {it.edited && "Editado recientemente."}</p>}
      {it.status === "pending" && <p className="muted small" style={{ margin: 0 }}>Lo estamos revisando. Normalmente lo aprobamos el mismo día; cuando se publique podrás copiar su enlace aquí para compartirlo.</p>}
      {it.status === "rejected" && <p className="muted small" style={{ margin: 0 }}>No cumplió nuestras reglas. Corrígelo con “Editar” y lo revisamos otra vez.</p>}
      <div className="row">
        {it.status === "approved" && <button className="btn btn-small" onClick={copyLink}>Copiar enlace para compartir</button>}
        {it.status === "approved" && <a className="btn btn-small btn-ghost" href={`/propiedad/${it.slug}`}>Ver anuncio</a>}
        {live && <button className="btn btn-small" disabled={busy} onClick={() => act("renew")}>Sigue disponible</button>}
        {it.status !== "archived" && <button className="btn btn-small btn-ghost" disabled={busy} onClick={() => setEditing((v) => !v)}>{editing ? "Cerrar" : "Editar"}</button>}
        {live && <button className="btn btn-small btn-ghost" disabled={busy} onClick={() => act("archive")}>Ya se rentó / vendió</button>}
      </div>
      {editing && (
        <form onSubmit={save} className="form stack my-edit">
          <label>Título<input value={title} onChange={(e) => setTitle(e.target.value)} minLength={8} maxLength={90} required /></label>
          <label>Precio (MXN)<input inputMode="numeric" value={price ? Number(price).toLocaleString("en-US") : ""} onChange={(e) => setPrice(e.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 10))} placeholder="Vacío = a tratar" />
            <small className="muted">{price ? `= $${Number(price).toLocaleString("en-US")} MXN` : "Aparecerá como “Precio a tratar”."}</small></label>
          <label>WhatsApp<input value={wa} onChange={(e) => setWa(e.target.value)} inputMode="tel" required /></label>
          <label>Descripción<textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={8} minLength={30} maxLength={3000} required /></label>
          <button className="btn btn-small" disabled={busy}>{busy ? "Guardando…" : "Guardar cambios"}</button>
        </form>
      )}
      {msg && <p className="ok small" role="status" style={{ margin: 0 }}>{msg}</p>}
    </div>
  );
}

export default function MyListings({ items, email }: { items: MyItem[]; email: string }) {
  const router = useRouter();
  async function logout() { await fetch("/api/cuenta/salir", { method: "POST" }); router.refresh(); }
  return (
    <div className="stack" style={{ maxWidth: 760 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1 style={{ margin: 0 }}>Mis anuncios</h1>
        <a className="btn btn-small" href="/publicar">Publicar otro</a>
      </div>
      <p className="muted small" style={{ margin: 0 }}>Sesión de <strong>{email}</strong> · este dispositivo te recuerda. <button type="button" className="linklike small" onClick={() => { if (confirm("Si sales, la próxima vez te pediremos un código por SMS. ¿Salir de este dispositivo?")) logout(); }}>Salir</button></p>
      {items.length === 0 && <p className="muted">Todavía no tienes anuncios con este correo.</p>}
      {items.map((it) => <Card key={it.slug} it={it} />)}
    </div>
  );
}
