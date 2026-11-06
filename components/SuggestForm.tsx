"use client";
import { useState } from "react";

export default function SuggestForm() {
  const [kind, setKind] = useState("idea");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      const res = await fetch("/api/sugerencias", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind, message, contact, website }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "No se pudo enviar.");
      setDone(true);
    } catch (x) { setErr(x instanceof Error ? x.message : "No se pudo enviar."); }
    finally { setBusy(false); }
  }

  if (done) return <div className="notice"><h2>¡Gracias!</h2><p>Recibimos tu mensaje. Lo leemos todos y es la forma en que mejoramos el sitio.</p></div>;
  return (
    <form onSubmit={submit} className="form stack" style={{ maxWidth: 560 }}>
      <label>¿Qué quieres contarnos?
        <select value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="idea">Tengo una idea o sugerencia</option>
          <option value="problema">Algo no me funcionó</option>
          <option value="duda">Tengo una duda</option>
          <option value="otro">Otra cosa</option>
        </select>
      </label>
      <label>Tu mensaje
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} maxLength={1500} required placeholder="Cuéntanos con tus palabras. Si algo falló, dinos qué estabas haciendo." />
      </label>
      <label>WhatsApp o correo (opcional)
        <input value={contact} onChange={(e) => setContact(e.target.value)} maxLength={120} placeholder="Solo si quieres que te respondamos" />
      </label>
      <input name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px", height: 0, width: 0, opacity: 0 }} />
      <button className="btn" disabled={busy || message.trim().length < 5}>{busy ? "Enviando…" : "Enviar"}</button>
      {err && <p className="error" role="alert">{err}</p>}
    </form>
  );
}
