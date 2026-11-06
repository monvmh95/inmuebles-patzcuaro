"use client";
import { useState } from "react";

export default function ReportButton({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const res = await fetch("/api/report", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, reason }) });
    const j = await res.json().catch(() => ({}));
    if (res.ok) setState("done");
    else {
      setMsg(j.error || "No se pudo enviar.");
      setState("error");
    }
  }

  if (state === "done") return <p className="muted small">Gracias, revisaremos este anuncio.</p>;
  return (
    <div className="report">
      {!open ? (
        <button type="button" className="linklike small" onClick={() => setOpen(true)}>
          Reportar este anuncio
        </button>
      ) : (
        <form onSubmit={send} className="report-form">
          <label className="small" htmlFor="reason">¿Qué está mal? (fraude, ya no disponible, fotos que no son, etc.)</label>
          <textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={500} required minLength={5} />
          <div className="row">
            <button className="btn btn-small" disabled={state === "sending"}>Enviar reporte</button>
            <button type="button" className="linklike small" onClick={() => setOpen(false)}>Cancelar</button>
          </div>
          {state === "error" && <p className="error small">{msg}</p>}
        </form>
      )}
    </div>
  );
}
