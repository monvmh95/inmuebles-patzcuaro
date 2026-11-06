"use client";
import { useRef, useState } from "react";
import { MAX_PHOTOS, OPERATIONS, TYPES, type Operation, type PropType } from "@/lib/config";
import PropertyCard from "./PropertyCard";
import LocationPicker from "./LocationPicker";

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

const STEPS = ["La propiedad", "Fotos y descripción", "Contacto y revisión"];
const num = (v: FormDataEntryValue | null) => (v === null || v === "" ? null : Number(v));

export default function PublishForm({ photosEnabled }: { photosEnabled: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ manageUrl: string } | null>(null);
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [preview, setPreview] = useState<Parameters<typeof PropertyCard>[0]["p"] | null>(null);

  function stepValid(idx: number): boolean {
    const el = formRef.current?.querySelector<HTMLElement>(`[data-step="${idx}"]`);
    if (!el) return true;
    const fields = Array.from(el.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea"));
    for (const f of fields) {
      if (!f.checkValidity()) {
        f.reportValidity();
        return false;
      }
    }
    return true;
  }

  function buildPreview() {
    const fd = new FormData(formRef.current!);
    setPreview({
      operation: (fd.get("operation") as Operation) || "renta",
      type: (fd.get("type") as PropType) || "casa",
      title: String(fd.get("title") || "Título de tu anuncio"),
      price: num(fd.get("price")),
      colonia: String(fd.get("colonia") || "Colonia"),
      bedrooms: num(fd.get("bedrooms")),
      bathrooms: num(fd.get("bathrooms")),
      land_m2: num(fd.get("land_m2")),
      built_m2: num(fd.get("built_m2")),
      photos,
      verified_at: null,
      lake_view: fd.get("lake_view") === "on",
      created_at: new Date().toISOString(),
    });
  }

  function next() {
    setError("");
    if (!stepValid(step)) return;
    const n = step + 1;
    if (n === 2) buildPreview();
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function back() {
    setError("");
    setStep((s) => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

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
    for (let i = 0; i < STEPS.length; i++) {
      if (!stepValid(i)) {
        setStep(i);
        return;
      }
    }
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      operation: fd.get("operation"), type: fd.get("type"), title: fd.get("title"), description: fd.get("description"),
      price: fd.get("price"), colonia: fd.get("colonia"), bedrooms: fd.get("bedrooms"), bathrooms: fd.get("bathrooms"),
      land_m2: fd.get("land_m2"), built_m2: fd.get("built_m2"), owner_kind: fd.get("owner_kind"),
      whatsapp: fd.get("whatsapp"), email: fd.get("email"), website: fd.get("website"),
      accept: fd.get("accept") === "on", photos,
      lat: geo?.lat ?? null, lng: geo?.lng ?? null, lake_view: fd.get("lake_view") === "on",
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
        <p className="muted small" style={{ marginTop: 14 }}>
          ¿Quieres el sello <strong>Verificado</strong>? Cuando revisemos tu anuncio nos comunicaremos al número que publicaste. <a href="/verificacion">Cómo funciona</a>.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="form wizard" noValidate>
      <ol className="steps" aria-label="Progreso">
        {STEPS.map((s, i) => (
          <li key={s} className={i === step ? "on" : i < step ? "done" : ""} aria-current={i === step ? "step" : undefined}>
            <span className="steps-n">{i < step ? "✓" : i + 1}</span> <span className="steps-t">{s}</span>
          </li>
        ))}
      </ol>

      <div data-step="0" hidden={step !== 0} className="stack">
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
        <div className="grid2">
          <label>Precio (MXN)
            <input name="price" type="number" min={0} inputMode="numeric" placeholder="Vacío = “a tratar”" />
          </label>
          <label>Colonia o zona
            <input name="colonia" required maxLength={60} placeholder="Centro, San Francisco, Ibarra…" />
          </label>
        </div>
        <label className="check">
          <input name="lake_view" type="checkbox" />
          <span>Tiene vista al lago</span>
        </label>
        <div className="grid4">
          <label>Recámaras<input name="bedrooms" type="number" min={0} max={30} inputMode="numeric" /></label>
          <label>Baños<input name="bathrooms" type="number" min={0} max={30} inputMode="numeric" /></label>
          <label>m² terreno<input name="land_m2" type="number" min={0} inputMode="numeric" /></label>
          <label>m² construcción<input name="built_m2" type="number" min={0} inputMode="numeric" /></label>
        </div>
      </div>

      <div data-step="1" hidden={step !== 1} className="stack">
        <fieldset>
          <legend>Fotos (hasta {MAX_PHOTOS})</legend>
          {photosEnabled ? (
            <>
              <ul className="tips small">
                <li><strong>Primero la fachada</strong> con buena luz de día.</li>
                <li>Patio, cocina, baños y recámaras; si hay vista al lago o al cerro, muéstrala.</li>
                <li>Fotos horizontales, sin filtros, de tu propiedad. Los anuncios con fotos ajenas se eliminan.</li>
              </ul>
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={uploading || photos.length >= MAX_PHOTOS} onChange={(e) => onFiles(e.target.files)} aria-label="Agregar fotos" />
              {uploading && <p className="muted small" role="status">Subiendo fotos…</p>}
              <div className="thumbs">
                {photos.map((u, idx) => (
                  <div key={u} className="thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt={`Foto ${idx + 1}`} />
                    {idx === 0 && <span className="thumb-main">Principal</span>}
                    <button type="button" aria-label={`Quitar foto ${idx + 1}`} onClick={() => setPhotos((p) => p.filter((x) => x !== u))}>×</button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="muted small">La subida de fotos se activará pronto. Por ahora puedes publicar sin fotos.</p>
          )}
        </fieldset>
        <fieldset>
          <legend>Zona en el mapa (opcional)</legend>
          <LocationPicker value={geo} onChange={setGeo} />
        </fieldset>
        <label>Descripción
          <textarea name="description" required minLength={30} maxLength={3000} rows={7} placeholder="Estado de la propiedad, servicios, distancia al centro, condiciones de renta o venta (depósito, contrato, mascotas)…" />
        </label>
      </div>

      <div data-step="2" hidden={step !== 2} className="stack">
        {preview && (
          <div>
            <p className="small muted" style={{ margin: "0 0 8px" }}>Así se verá tu anuncio en la lista:</p>
            <div style={{ maxWidth: 340 }}><PropertyCard p={{ ...preview, photos }} preview /></div>
          </div>
        )}
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
        <input name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
        <label className="check">
          <input name="accept" type="checkbox" required />
          <span>Acepto los <a href="/terminos" target="_blank">términos</a> y el <a href="/privacidad" target="_blank">aviso de privacidad</a>, y confirmo que la información es verdadera.</span>
        </label>
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      <div className="wizard-nav">
        {step > 0 && <button type="button" className="btn btn-ghost" onClick={back}>Atrás</button>}
        {step < STEPS.length - 1 ? (
          <button type="button" className="btn" onClick={next} disabled={uploading}>Continuar</button>
        ) : (
          <button className="btn" disabled={busy || uploading}>{busy ? "Publicando…" : "Publicar gratis"}</button>
        )}
      </div>
    </form>
  );
}
