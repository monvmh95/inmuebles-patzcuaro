"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ManageActions({ token, status }: { token: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function act(action: "confirm" | "archive") {
    if (action === "archive" && !confirm("¿Dar de baja este anuncio? Dejará de mostrarse.")) return;
    setBusy(true);
    const res = await fetch(`/api/mi-anuncio/${token}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action }) });
    setBusy(false);
    if (res.ok) {
      setMsg(action === "confirm" ? "Listo, tu anuncio seguirá visible 90 días más." : "Anuncio dado de baja.");
      router.refresh();
    } else setMsg("No se pudo completar la acción.");
  }

  return (
    <div className="stack">
      <div className="row">
        {status !== "archived" && (
          <button className="btn" disabled={busy} onClick={() => act("confirm")}>Sigue disponible</button>
        )}
        {status !== "archived" && (
          <button className="btn btn-ghost" disabled={busy} onClick={() => act("archive")}>Ya se rentó / vendió (dar de baja)</button>
        )}
      </div>
      {msg && <p className="ok">{msg}</p>}
    </div>
  );
}
