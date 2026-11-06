"use client";
import { useState } from "react";
import { MAX_PHOTOS, OPERATIONS, TYPES } from "@/lib/config";

async function compress(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const max = 1600;
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("compress"))), "image/jpeg", 0.82));
}

export default function PublishForm({ photosEnabled }: { photosEnabled: boolean }) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ manageUrl: string } | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files) return;
    setError("");
    setUploading(true);
    try {
      for (const f of Array.from(files)) {
        if (photos.length >= MAX_PHOTOS) break;
        const blob = await compress(f);
        const fd = new FormData();
        fd.append("file", new File([blob], "foto.jpg", { type: "image/jpeg" }));
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j.error || "No se pudo subir la foto");
        setPhotos((prev) => (prev.length < MAX_PHOTOS ? [...prev, j.url] : prev));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir la foto");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      operation: fd.get("operation"),
      type: fd.get("type"),
      title: fd.get("title"),
      description: fd.get("description"),
      price: fd.get("price"),
      colonia: fd.get("colonia"),
      bedrooms: fd.get("bedrooms"),
      bathrooms: fd.get("bathrooms"),
      land_m2: fd.get("land_m2"),
      built_m2: fd.get("built_m2"),
      owner_kind: fd.get("owner_kind"),
      whatsapp: fd.get("whatsapp"),
      email: fd.get("email"),
      website: fd.get("website"),
      accept: fd.get("accept") === "on",
      photos,
    };
    const res = await fetch("/api/propiedades", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(j.error || "No se pudo publicar. Revisa los datos.");
    setDone({ manageUrl: j.manageUrl });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (done) {
    return (
      <div className="notice notice-ok">
        <h2>¡Recibimos tu anuncio!</h2>
        <p>Lo revisaremos y aparecerá publicado en cuanto lo aprobemos (normalmente el mismo día).</p>
        <p><strong>Guarda este enlace privado.</strong> Con él puedes ver las visitas, confirmar que sigue disponible o darlo de baja. No lo compartas.</p>
        <p className="mono"><a href={done.manageUrl}>{done.manageUrl}</a></p>
        <button className="btn btn-small" onClick={() => navigator.clipboard?.writeText(done.manageUrl)}>Copiar enlace</button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="form">
      <div className="grid2">
        <label>Operación
          <select name="operation" required defaultValue="renta">
            {Object.entries(OPERATIONS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </label>
        <label>Tipo de inmueble
          <select name="type" required defaultValue="casa">
            {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </label>
      </div>

      <label>Título del anuncio
        <input name="title" required minLength={8} maxLength={90} placeholder="Casa de 3 recámaras cerca de la Plaza Vasco de Quiroga" />
      </label>

      <label>Descripción
        <textarea name="description" required minLength={30} maxLength={3000} rows={6} placeholder="Cuenta lo importante: estado de la propiedad, servicios, a qué distancia queda del centro, condiciones de renta o venta…" />
      </label>

      <div className="grid2">
        <label>Precio (MXN)
          <input name="price" type="number" min={0} inputMode="numeric" placeholder="Déjalo vacío si es “a tratar”" />
        </label>
        <label>Colonia o zona
          <input name="colonia" required maxLength={60} placeholder="Centro, San Francisco, Ibarra…" />
        </label>
      </div>

      <div className="grid4">
        <label>Recámaras<input name="bedrooms" type="number" min={0} max={30} inputMode="numeric" /></label>
        <label>Baños<input name="bathrooms" type="number" min={0} max={30} inputMode="numeric" /></label>
        <label>m² terreno<input name="land_m2" type="number" min={0} inputMode="numeric" /></label>
        <label>m² construcción<input name="built_m2" type="number" min={0} inputMode="numeric" /></label>
      </div>

      <fieldset>
        <legend>Fotos (hasta {MAX_PHOTOS})</legend>
        {photosEnabled ? (
          <>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={uploading || photos.length >= MAX_PHOTOS} onChange={(e) => onFiles(e.target.files)} />
            {uploading && <p className="muted small">Subiendo fotos…</p>}
            <div className="thumbs">
              {photos.map((u) => (
                <div key={u} className="thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u} alt="" />
                  <button type="button" aria-label="Quitar foto" onClick={() => setPhotos((p) => p.filter((x) => x !== u))}>×</button>
                </div>
              ))}
            </div>
            <p className="muted small">Usa fotos reales y propias de la propiedad. Los anuncios con fotos robadas se eliminan.</p>
          </>
        ) : (
          <p className="muted small">La subida de fotos se activará pronto. Por ahora puedes publicar sin fotos.</p>
        )}
      </fieldset>

      <div className="grid2">
        <label>Tu WhatsApp (10 dígitos)
          <input name="whatsapp" required inputMode="tel" placeholder="434 123 4567" />
        </label>
        <label>Correo (opcional, no se muestra)
          <input name="email" type="email" maxLength={120} />
        </label>
      </div>

      <label>Publicas como
        <select name="owner_kind" defaultValue="dueno">
          <option value="dueno">Dueño directo</option>
          <option value="agente">Agente / inmobiliaria</option>
        </select>
      </label>

      {/* honeypot anti-spam: las personas no lo ven */}
      <input name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />

      <label className="check">
        <input name="accept" type="checkbox" required />
        <span>Acepto los <a href="/terminos" target="_blank">términos</a> y el <a href="/privacidad" target="_blank">aviso de privacidad</a>, y confirmo que la información es verdadera.</span>
      </label>

      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn btn-lg" disabled={busy || uploading}>{busy ? "Publicando…" : "Publicar gratis"}</button>
    </form>
  );
}
