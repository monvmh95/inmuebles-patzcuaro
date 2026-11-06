"use client";
import { startRegistration } from "@simplewebauthn/browser";
import { useEffect, useState } from "react";

const FLAG = "inm_pk";

/** Ofrece activar huella / rostro / Windows Hello en este dispositivo (una vez, ya con sesión iniciada). */
export default function PasskeyRegister() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    try {
      if (window.PublicKeyCredential && localStorage.getItem(FLAG) !== "1") {
        PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.().then((ok) => setShow(Boolean(ok))).catch(() => {});
      }
    } catch { /* sin soporte */ }
  }, []);
  if (!show && !msg) return null;

  async function enable() {
    setBusy(true); setMsg("");
    try {
      const o = await fetch("/api/cuenta/passkey/registro-opciones", { method: "POST" });
      const opts = await o.json();
      if (!o.ok) throw new Error(opts.error || "No se pudo iniciar.");
      const att = await startRegistration({ optionsJSON: opts });
      const r = await fetch("/api/cuenta/passkey/registro", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(att) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "No se pudo registrar.");
      try { localStorage.setItem(FLAG, "1"); } catch { /* ignore */ }
      setShow(false); setMsg("Listo: la próxima vez entra con tu huella o rostro, sin SMS.");
    } catch (e) {
      const name = (e as { name?: string })?.name;
      setMsg(name === "NotAllowedError" ? "Se canceló. Puedes intentarlo cuando quieras." : e instanceof Error ? e.message : "No se pudo activar.");
    } finally { setBusy(false); }
  }

  return (
    <div className="acct-box">
      {show && (
        <>
          <p style={{ margin: 0 }}><strong>Entra sin SMS la próxima vez</strong></p>
          <p className="muted small" style={{ margin: 0 }}>Activa tu huella, rostro o PIN de este dispositivo. Tu biometría se queda en tu equipo; nosotros no la vemos ni la guardamos.</p>
          <div><button type="button" className="btn btn-small" onClick={enable} disabled={busy}>{busy ? "Esperando…" : "Activar huella / rostro"}</button></div>
        </>
      )}
      {msg && <p className="small" role="status" style={{ margin: 0 }}>{msg}</p>}
    </div>
  );
}
