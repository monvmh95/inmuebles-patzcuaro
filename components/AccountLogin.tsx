"use client";
import { startAuthentication } from "@simplewebauthn/browser";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AccountLogin({ sms = false }: { sms?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [cool, setCool] = useState(0);
  useEffect(() => { if (cool > 0) { const id = setTimeout(() => setCool((c) => c - 1), 1000); return () => clearTimeout(id); } }, [cool]);

  const [canPk, setCanPk] = useState(false);
  useEffect(() => { try { setCanPk(Boolean(window.PublicKeyCredential)); } catch { /* sin soporte */ } }, []);
  async function pk() {
    setBusy(true); setMsg("");
    try {
      const o = await fetch("/api/cuenta/passkey/entrar-opciones", { method: "POST" });
      const opts = await o.json();
      if (!o.ok) throw new Error(opts.error || "No se pudo iniciar.");
      const asr = await startAuthentication({ optionsJSON: opts });
      const r = await fetch("/api/cuenta/passkey/entrar", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(asr) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "No pudimos entrar.");
      router.refresh();
    } catch (e) {
      const name = (e as { name?: string })?.name;
      setMsg(name === "NotAllowedError" ? "Se canceló o no hay una llave guardada en este dispositivo. Entra con el código por SMS." : e instanceof Error ? e.message : "No pudimos entrar.");
    } finally { setBusy(false); }
  }

  async function send(e?: React.FormEvent, ch?: "whatsapp" | "voice") {
    e?.preventDefault(); setBusy(true); setMsg("");
    const res = await fetch("/api/cuenta/codigo", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(sms ? { phone: email, channel: ch } : { email }) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg(j.error || "No pudimos enviar el código.");
    setSent(true); setCode(""); setCool(30);
  }
  async function verify(c: string) {
    setBusy(true); setMsg("");
    const res = await fetch("/api/cuenta/verificar", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(sms ? { phone: email, code: c } : { email, code: c }) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setMsg(j.error || "Código incorrecto."); setCode(""); return; }
    router.refresh();
  }

  return (
    <div className="stack" style={{ maxWidth: 460 }}>
      <h1>Mis anuncios</h1>
      <p className="muted">{sms ? "Entra con el celular que usaste al publicar. Te mandamos un SMS con un código de 6 dígitos; solo la primera vez en cada dispositivo." : "Entra con el correo que usaste al publicar. Te mandamos un código de 6 dígitos; solo la primera vez en cada dispositivo."}</p>
      {!sent && canPk && (
        <div className="stack">
          <button type="button" className="btn" onClick={pk} disabled={busy}>Entrar con huella o rostro</button>
          <p className="muted small" style={{ margin: 0 }}>Si ya activaste esto en este dispositivo. Si no, usa el código por SMS aquí abajo.</p>
        </div>
      )}
      {!sent ? (
        <form onSubmit={send} className="form stack">
          <label>{sms ? "Tu celular" : "Tu correo"}<input type={sms ? "tel" : "email"} inputMode={sms ? "tel" : "email"} required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete={sms ? "tel-national" : "email"} placeholder={sms ? "434 123 4567" : "tu@correo.com"} /></label>
          <button className="btn" disabled={busy || !email}>{busy ? "Enviando…" : "Enviarme el código"}</button>
        </form>
      ) : (
        <div className="form stack">
          <label>Código de 6 dígitos
            <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} autoFocus placeholder="••••••" style={{ letterSpacing: 6, fontSize: "1.3rem", maxWidth: 200 }}
              onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 6); setCode(v); if (v.length === 6) verify(v); }} />
            <small className="muted">Enviado a {email}. {sms ? "" : "Revisa también spam. "}Vence en 10 minutos.</small>
          </label>
          <div className="row">
            <button type="button" className="linklike small" disabled={cool > 0 || busy} onClick={() => send()}>{cool > 0 ? `Reenviar en ${cool} s` : "Reenviar código"}</button>
            {sms && <button type="button" className="linklike small" disabled={cool > 0 || busy} onClick={() => send(undefined, "whatsapp")}>No llegó: por WhatsApp</button>}
            {sms && <button type="button" className="linklike small" disabled={cool > 0 || busy} onClick={() => send(undefined, "voice")}>o por llamada</button>}
            <button type="button" className="linklike small" onClick={() => { setSent(false); setMsg(""); }}>{sms ? "Cambiar número" : "Cambiar correo"}</button>
          </div>
        </div>
      )}
      {msg && <p className="error" role="alert">{msg}</p>}
    </div>
  );
}
