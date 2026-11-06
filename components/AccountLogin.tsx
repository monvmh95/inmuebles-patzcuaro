"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AccountLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [cool, setCool] = useState(0);
  useEffect(() => { if (cool > 0) { const id = setTimeout(() => setCool((c) => c - 1), 1000); return () => clearTimeout(id); } }, [cool]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault(); setBusy(true); setMsg("");
    const res = await fetch("/api/cuenta/codigo", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg(j.error || "No pudimos enviar el código.");
    setSent(true); setCode(""); setCool(30);
  }
  async function verify(c: string) {
    setBusy(true); setMsg("");
    const res = await fetch("/api/cuenta/verificar", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, code: c }) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setMsg(j.error || "Código incorrecto."); setCode(""); return; }
    router.refresh();
  }

  return (
    <div className="stack" style={{ maxWidth: 460 }}>
      <h1>Mis anuncios</h1>
      <p className="muted">Entra con el correo que usaste al publicar. Te mandamos un código de 6 dígitos; solo la primera vez en cada dispositivo.</p>
      {!sent ? (
        <form onSubmit={send} className="form stack">
          <label>Tu correo<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="tu@correo.com" /></label>
          <button className="btn" disabled={busy || !email}>{busy ? "Enviando…" : "Enviarme el código"}</button>
        </form>
      ) : (
        <div className="form stack">
          <label>Código de 6 dígitos
            <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} autoFocus placeholder="••••••" style={{ letterSpacing: 6, fontSize: "1.3rem", maxWidth: 200 }}
              onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 6); setCode(v); if (v.length === 6) verify(v); }} />
            <small className="muted">Enviado a {email}. Revisa también spam. Vence en 10 minutos.</small>
          </label>
          <div className="row">
            <button type="button" className="linklike small" disabled={cool > 0 || busy} onClick={() => send()}>{cool > 0 ? `Reenviar en ${cool} s` : "Reenviar código"}</button>
            <button type="button" className="linklike small" onClick={() => { setSent(false); setMsg(""); }}>Cambiar correo</button>
          </div>
        </div>
      )}
      {msg && <p className="error" role="alert">{msg}</p>}
    </div>
  );
}
