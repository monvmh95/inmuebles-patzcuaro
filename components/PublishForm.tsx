"use client";
import { useRef, useState } from "react";
import { MAX_PHOTOS, OPERATIONS, TYPES, type Operation, type PropType } from "@/lib/config";
import { opLabel, typeLabel, localizePath } from "@/lib/i18n";
import { useLang } from "./LangProvider";
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

const STEPS_ES = ["La propiedad", "Fotos y descripción", "Contacto y revisión"];
const STEPS_EN = ["The property", "Photos and description", "Contact and review"];
type Suggestion = { titulo: string; descripcion: string; preguntas: string[] };
const num = (v: FormDataEntryValue | null) => (v === null || v === "" ? null : Number(v));

export default function PublishForm({ photosEnabled, aiEnabled = false }: { photosEnabled: boolean; aiEnabled?: boolean }) {
  const lang = useLang();
  const en = lang === "en";
  const t = (es: string, e: string) => (en ? e : es);
  const STEPS = en ? STEPS_EN : STEPS_ES;
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMsg, setAiMsg] = useState("");
  const [sugg, setSugg] = useState<Suggestion | null>(null);
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
      title: String(fd.get("title") || t("Título de tu anuncio", "Your listing title")),
      price: num(fd.get("price")),
      colonia: String(fd.get("colonia") || t("Colonia", "Neighborhood")),
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

  async function askAi() {
    setAiMsg(""); setSugg(null);
    const f = formRef.current!;
    const fd = new FormData(f);
    setAiBusy(true);
    try {
      const res = await fetch("/api/ia/sugerir", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          operation: fd.get("operation"), type: fd.get("type"), colonia: fd.get("colonia"), price: fd.get("price"),
          bedrooms: fd.get("bedrooms"), bathrooms: fd.get("bathrooms"), land_m2: fd.get("land_m2"), built_m2: fd.get("built_m2"),
          lake_view: fd.get("lake_view") === "on", title: fd.get("title"), notes: fd.get("description"), photos: photos.slice(0, 3),
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || t("No se pudo generar la sugerencia.", "Could not generate a suggestion."));
      setSugg(j);
    } catch (e) {
      setAiMsg(e instanceof Error ? e.message : t("Error del asistente.", "Assistant error."));
    } finally { setAiBusy(false); }
  }
  function useSugg() {
    if (!sugg) return;
    const f = formRef.current!;
    const ti = f.querySelector<HTMLInputElement>('input[name="title"]');
    const de = f.querySelector<HTMLTextAreaElement>('textarea[name="description"]');
    if (ti) ti.value = sugg.titulo;
    if (de) de.value = sugg.descripcion;
    setSugg(null);
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
        if (!res.ok) throw new Error(j.error || t("No se pudo subir la foto", "Could not upload the photo"));
        setPhotos((prev) => (prev.length < MAX_PHOTOS ? [...prev, j.url] : prev));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("Error al subir la foto", "Photo upload error"));
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
      whatsapp: fd.get("whatsapp"), email: fd.get("email"), website: fd.get("website"), lang,
      accept: fd.get("accept") === "on", photos,
      lat: geo?.lat ?? null, lng: geo?.lng ?? null, lake_view: fd.get("lake_view") === "on",
    };
    const res = await fetch("/api/propiedades", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(j.error || t("No se pudo publicar. Revisa los datos.", "Could not publish. Please check the data."));
    setDone({ manageUrl: j.manageUrl });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (done) {
    return (
      <div className="notice notice-ok">
        <h2>{t("¡Recibimos tu anuncio!", "We received your listing!")}</h2>
        <p>{t("Lo revisaremos y aparecerá publicado en cuanto lo aprobemos (normalmente el mismo día).", "We will review it and it will go live as soon as it is approved (usually the same day).")}</p>
        <p><strong>{t("Guarda este enlace privado.", "Save this private link.")}</strong> {t("Con él puedes ver las visitas, confirmar que sigue disponible o darlo de baja. No lo compartas.", "With it you can see visits, confirm the listing is still available or take it down. Do not share it.")}</p>
        <p className="mono"><a href={done.manageUrl}>{done.manageUrl}</a></p>
        <button className="btn btn-small" onClick={() => navigator.clipboard?.writeText(done.manageUrl)}>{t("Copiar enlace", "Copy link")}</button>
        <p className="muted small" style={{ marginTop: 14 }}>
          {t("¿Quieres el sello", "Want the")} <strong>{t("Verificado", "Verified")}</strong>{t("? Cuando revisemos tu anuncio nos comunicaremos al número que publicaste.", " badge? When we review your listing we will contact the number you provided.")} <a href={localizePath(lang, "/verificacion")}>{t("Cómo funciona", "How it works")}</a>.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="form wizard" noValidate>
      <ol className="steps" aria-label={t("Progreso", "Progress")}>
        {STEPS.map((s, i) => (
          <li key={s} className={i === step ? "on" : i < step ? "done" : ""} aria-current={i === step ? "step" : undefined}>
            <span className="steps-n">{i < step ? "✓" : i + 1}</span> <span className="steps-t">{s}</span>
          </li>
        ))}
      </ol>

      <div data-step="0" hidden={step !== 0} className="stack">
        <div className="grid2">
          <label>{t("Operación", "Operation")}
            <select name="operation" required defaultValue="renta">
              {(Object.keys(OPERATIONS) as Operation[]).map((k) => <option key={k} value={k}>{opLabel(lang, k)}</option>)}
            </select>
          </label>
          <label>{t("Tipo de inmueble", "Property type")}
            <select name="type" required defaultValue="casa">
              {(Object.keys(TYPES) as PropType[]).map((k) => <option key={k} value={k}>{typeLabel(lang, k)}</option>)}
            </select>
          </label>
        </div>
        <label>{t("Título del anuncio", "Listing title")}
          <input name="title" required minLength={8} maxLength={90} placeholder={t("Casa de 3 recámaras cerca de la Plaza Vasco de Quiroga", "3-bedroom house near Plaza Vasco de Quiroga")} />
        </label>
        <div className="grid2">
          <label>{t("Precio (MXN)", "Price (MXN)")}
            <input name="price" type="number" min={0} inputMode="numeric" placeholder={t("Vacío = “a tratar”", "Empty = “negotiable”")} />
          </label>
          <label>{t("Colonia o zona", "Neighborhood or area")}
            <input name="colonia" required maxLength={60} placeholder={t("Centro, San Francisco, Ibarra…", "Centro, San Francisco, Ibarra…")} />
          </label>
        </div>
        <label className="check">
          <input name="lake_view" type="checkbox" />
          <span>{t("Tiene vista al lago", "Has a lake view")}</span>
        </label>
        <div className="grid4">
          <label>{t("Recámaras", "Bedrooms")}<input name="bedrooms" type="number" min={0} max={30} inputMode="numeric" /></label>
          <label>{t("Baños", "Bathrooms")}<input name="bathrooms" type="number" min={0} max={30} inputMode="numeric" /></label>
          <label>{t("m² terreno", "Lot m²")}<input name="land_m2" type="number" min={0} inputMode="numeric" /></label>
          <label>{t("m² construcción", "Built m²")}<input name="built_m2" type="number" min={0} inputMode="numeric" /></label>
        </div>
      </div>

      <div data-step="1" hidden={step !== 1} className="stack">
        <fieldset>
          <legend>{t("Fotos", "Photos")} ({t("hasta", "up to")} {MAX_PHOTOS})</legend>
          {photosEnabled ? (
            <>
              <ul className="tips small">
                <li><strong>{t("Primero la fachada", "Front of the property first")}</strong> {t("con buena luz de día.", "in good daylight.")}</li>
                <li>{t("Patio, cocina, baños y recámaras; si hay vista al lago o al cerro, muéstrala.", "Patio, kitchen, bathrooms and bedrooms; if there is a lake or hill view, show it.")}</li>
                <li>{t("Fotos horizontales, sin filtros, de tu propiedad. Los anuncios con fotos ajenas se eliminan.", "Landscape photos, no filters, of your own property. Listings with someone else’s photos are removed.")}</li>
              </ul>
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={uploading || photos.length >= MAX_PHOTOS} onChange={(e) => onFiles(e.target.files)} aria-label={t("Agregar fotos", "Add photos")} />
              {uploading && <p className="muted small" role="status">{t("Subiendo fotos…", "Uploading photos…")}</p>}
              <div className="thumbs">
                {photos.map((u, idx) => (
                  <div key={u} className="thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt={t(`Foto ${idx + 1}`, `Photo ${idx + 1}`)} />
                    {idx === 0 && <span className="thumb-main">{t("Principal", "Main")}</span>}
                    <button type="button" aria-label={t(`Quitar foto ${idx + 1}`, `Remove photo ${idx + 1}`)} onClick={() => setPhotos((p) => p.filter((x) => x !== u))}>×</button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="muted small">{t("La subida de fotos se activará pronto. Por ahora puedes publicar sin fotos.", "Photo upload will be enabled soon. For now you can publish without photos.")}</p>
          )}
        </fieldset>
        <fieldset>
          <legend>{t("Zona en el mapa (opcional)", "Area on the map (optional)")}</legend>
          <LocationPicker value={geo} onChange={setGeo} />
        </fieldset>
        <label>{t("Descripción", "Description")}
          <textarea name="description" required minLength={30} maxLength={3000} rows={7} placeholder={t("Estado de la propiedad, servicios, distancia al centro, condiciones de renta o venta (depósito, contrato, mascotas)…", "Condition of the property, utilities, distance to downtown, rental or sale terms (deposit, contract, pets)… The listing is published in Spanish; English readers see an automatic translation.")} />
        </label>
        {aiEnabled && (
          <div className="ai-box">
            <button type="button" className="btn btn-small btn-ghost" onClick={askAi} disabled={aiBusy || uploading}>
              {aiBusy ? t("Pensando…", "Thinking…") : t("✨ Sugerir título y descripción", "✨ Suggest title and description")}
            </button>
            <p className="muted small" style={{ margin: "6px 0 0" }}>
              {t("Escribe arriba unas notas rápidas (aunque sea en lista). El asistente las ordena junto con tus datos y fotos; tú revisas y decides. Solo usa lo que tú le dices o se ve claro en las fotos.", "Write a few quick notes above (a bullet list is fine). The assistant organizes them with your data and photos; you review and decide. It only uses what you tell it or what is clearly visible in the photos. It writes in Spanish, the site’s main language.")}
            </p>
            {aiMsg && <p className="error small" role="alert">{aiMsg}</p>}
            {sugg && (
              <div className="ai-sugg" role="region" aria-label={t("Sugerencia", "Suggestion")}>
                <p className="small muted" style={{ margin: 0 }}>{t("Sugerencia (revísala antes de usarla):", "Suggestion (review it before using it):")}</p>
                <p style={{ margin: "6px 0", fontWeight: 700 }}>{sugg.titulo}</p>
                <p style={{ margin: "0 0 8px", whiteSpace: "pre-line" }}>{sugg.descripcion}</p>
                {sugg.preguntas.length > 0 && (
                  <>
                    <p className="small" style={{ margin: "0 0 4px" }}><strong>{t("Datos que podrías agregar:", "Details you could add:")}</strong></p>
                    <ul className="small" style={{ margin: "0 0 8px", paddingLeft: 18 }}>{sugg.preguntas.map((q) => <li key={q}>{q}</li>)}</ul>
                  </>
                )}
                <div className="row">
                  <button type="button" className="btn btn-small" onClick={useSugg}>{t("Usar sugerencia", "Use suggestion")}</button>
                  <button type="button" className="linklike small" onClick={() => setSugg(null)}>{t("Descartar", "Dismiss")}</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div data-step="2" hidden={step !== 2} className="stack">
        {preview && (
          <div>
            <p className="small muted" style={{ margin: "0 0 8px" }}>{t("Así se verá tu anuncio en la lista:", "This is how your listing will look in the list:")}</p>
            <div style={{ maxWidth: 340 }}><PropertyCard p={{ ...preview, photos }} preview lang={lang} /></div>
          </div>
        )}
        <div className="grid2">
          <label>{t("Tu WhatsApp (10 dígitos)", "Your WhatsApp (10 digits)")}
            <input name="whatsapp" required inputMode="tel" placeholder="434 123 4567" />
          </label>
          <label>{t("Correo (opcional, no se muestra)", "Email (optional, not shown)")}
            <input name="email" type="email" maxLength={120} />
          </label>
        </div>
        <label>{t("Publicas como", "You are posting as")}
          <select name="owner_kind" defaultValue="dueno">
            <option value="dueno">{t("Dueño directo", "Direct owner")}</option>
            <option value="agente">{t("Agente / inmobiliaria", "Agent / real-estate agency")}</option>
          </select>
        </label>
        <input name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
        <label className="check">
          <input name="accept" type="checkbox" required />
          <span>{t("Acepto los", "I accept the")} <a href="/terminos" target="_blank">{t("términos", "terms (Spanish)")}</a> {t("y el", "and the")} <a href="/privacidad" target="_blank">{t("aviso de privacidad", "privacy notice (Spanish)")}</a>{t(", y confirmo que la información es verdadera.", ", and I confirm the information is true.")}</span>
        </label>
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      <div className="wizard-nav">
        {step > 0 && <button type="button" className="btn btn-ghost" onClick={back}>{t("Atrás", "Back")}</button>}
        {step < STEPS.length - 1 ? (
          <button type="button" className="btn" onClick={next} disabled={uploading}>{t("Continuar", "Continue")}</button>
        ) : (
          <button className="btn" disabled={busy || uploading}>{busy ? t("Publicando…", "Publishing…") : t("Publicar gratis", "Publish for free")}</button>
        )}
      </div>
    </form>
  );
}
