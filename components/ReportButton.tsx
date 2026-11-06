"use client";
import { useState } from "react";
import { useT } from "./LangProvider";

export default function ReportButton({ slug }: { slug: string }) {
  const t = useT();
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
      setMsg(j.error || t("No se pudo enviar.", "Could not send."));
      setState("error");
    }
  }

  if (state === "done") return <p className="muted small">{t("Gracias, revisaremos este anuncio.", "Thanks, we will review this listing.")}</p>;
  return (
    <div className="report">
      {!open ? (
        <button type="button" className="linklike small" onClick={() => setOpen(true)}>
          {t("Reportar este anuncio", "Report this listing")}
        </button>
      ) : (
        <form onSubmit={send} className="report-form">
          <label className="small" htmlFor="reason">{t("¿Qué está mal? (fraude, ya no disponible, fotos que no son, etc.)", "What is wrong? (scam, no longer available, photos that do not match, etc.)")}</label>
          <textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={500} required minLength={5} />
          <div className="row">
            <button className="btn btn-small" disabled={state === "sending"}>{t("Enviar reporte", "Send report")}</button>
            <button type="button" className="linklike small" onClick={() => setOpen(false)}>{t("Cancelar", "Cancel")}</button>
          </div>
          {state === "error" && <p className="error small">{msg}</p>}
        </form>
      )}
    </div>
  );
}
