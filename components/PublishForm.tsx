"use client";
import { useRef, useState } from "react";
import { MAX_PHOTOS, OPERATIONS, TYPES, type Operation, type PropType } from "@/lib/config";
import { opLabel, typeLabel, localizePath } from "@/lib/i18n";
import { useLang } from "./LangProvider";
import PropertyCard from "./PropertyCard";
import LocationPicker from "./LocationPicker";
import { parseLand } from "@/lib/measures";
import { GROUP_LABEL, featuresFor, featureLabel, type Feature } from "@/lib/features";

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
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  function movePhoto(from: number | null, to: number) {
    if (from == null || from === to) return;
    setPhotos((p) => { const a = [...p]; const [m] = a.splice(from, 1); a.splice(to, 0, m); return a; });
  }
  const [priceDigits, setPriceDigits] = useState("");
  const priceNum = priceDigits ? Number(priceDigits) : null;
  const priceWords = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toLocaleString(en ? "en-US" : "es-MX", { maximumFractionDigits: 2 })} ${t("millones de pesos", "million pesos")}` : n >= 1000 ? `${Math.round(n / 1000).toLocaleString(en ? "en-US" : "es-MX")} ${t("mil pesos", "thousand pesos")}` : `${n} ${t("pesos", "pesos")}`);
  const priceWarn = (n: number | null) => {
    if (n == null || n === 0) return "";
    if (opSel === "renta" && n > 300_000) return t("Es un precio mensual muy alto. ¿Seguro que es por mes?", "That is a very high monthly price. Is it really per month?");
    if (opSel !== "renta" && n < 20_000) return t("Parece muy bajo para una venta o traspaso. Revisa los ceros.", "That looks very low for a sale or transfer. Check the zeros.");
    if (n > 150_000_000) return t("Parece demasiado alto. Revisa los ceros.", "That looks too high. Check the zeros.");
    return "";
  };
  const [landIn, setLandIn] = useState("");
  const [opSel, setOpSel] = useState<string>("renta");
  const [typeSel, setTypeSel] = useState<string>("casa");
  const [feat, setFeat] = useState<string[]>([]);
  const avail = featuresFor(typeSel, opSel);
  const chosen = () => feat.filter((k) => avail.some((f) => f.key === k));
  const landParsed = parseLand(landIn);
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
      land_m2: parseLand(fd.get("land_dims"))?.m2 ?? null,
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
          bedrooms: fd.get("bedrooms"), bathrooms: fd.get("bathrooms"), land_dims: fd.get("land_dims"), built_m2: fd.get("built_m2"),
          lake_view: fd.get("lake_view") === "on", title: fd.get("title"), notes: fd.get("notes"), features: chosen(), nearby: fd.get("nearby"), photos: photos.slice(0, 3),
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || t("No se pudo generar la sugerencia.", "Could not generate a suggestion."));
      setSugg(j);
    } catch (e) {
      setAiMsg(e instanceof Error ? e.message : t("Error del asistente.", "Assistant error."));
    } finally { setAiBusy(false); }
  }
  function basicDraft() {
    const f = formRef.current!;
    const fd = new FormData(f);
    const op = String(fd.get("operation") || "renta");
    const ty = typeLabel("es", String(fd.get("type") || "casa") as PropType);
    const col = String(fd.get("colonia") || "").trim();
    const opTxt = op === "venta" ? "en venta" : op === "traspaso" ? "en traspaso" : "en renta";
    const land = parseLand(fd.get("land_dims"));
    const facts = [
      num(fd.get("bedrooms")) != null && `${num(fd.get("bedrooms"))} recámaras`,
      num(fd.get("bathrooms")) != null && `${num(fd.get("bathrooms"))} baños`,
      land && `terreno de ${land.m2} m²${land.dims ? ` (${land.dims} m)` : ""}`,
      num(fd.get("built_m2")) != null && `${num(fd.get("built_m2"))} m² de construcción`,
      fd.get("lake_view") === "on" && "vista al lago",
    ].filter(Boolean) as string[];
    const lines = [`${ty} ${opTxt} en ${col ? col + ", " : ""}Pátzcuaro, Michoacán${facts.length ? `: ${facts.join(", ")}` : ""}.`];
    const labels = chosen().map((k) => featureLabel(k, "es")).filter(Boolean) as string[];
    if (labels.length) lines.push(`Características: ${labels.map((l) => l.toLowerCase()).join(", ")}.`);
    const near = String(fd.get("nearby") || "").trim();
    if (near) lines.push(`Ubicación: ${near}.`);
    lines.push("Agenda tu visita escribiendo por WhatsApp desde este anuncio.");
    const de = f.querySelector<HTMLTextAreaElement>('textarea[name="description"]');
    if (de) de.value = lines.join("\n\n");
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
      land_dims: fd.get("land_dims"), built_m2: fd.get("built_m2"), owner_kind: fd.get("owner_kind"),
      whatsapp: fd.get("whatsapp"), email: fd.get("email"), website: fd.get("website"), lang,
      accept: fd.get("accept") === "on", photos,
      lat: geo?.lat ?? null, lng: geo?.lng ?? null, lake_view: fd.get("lake_view") === "on", features: chosen(),
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
    <form ref={formRef} onSubmit={onSubmit} onWheel={(e) => { const el = e.target as HTMLElement; if (el instanceof HTMLInputElement && el.type === "number") el.blur(); }} className="form wizard" noValidate>
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
            <select name="operation" required defaultValue="renta" onChange={(e) => setOpSel(e.target.value)}>
              {(Object.keys(OPERATIONS) as Operation[]).map((k) => <option key={k} value={k}>{opLabel(lang, k)}</option>)}
            </select>
          </label>
          <label>{t("Tipo de inmueble", "Property type")}
            <select name="type" required defaultValue="casa" onChange={(e) => setTypeSel(e.target.value)}>
              {(Object.keys(TYPES) as PropType[]).map((k) => <option key={k} value={k}>{typeLabel(lang, k)}</option>)}
            </select>
          </label>
        </div>
        <label>{t("Título del anuncio", "Listing title")}
          <input name="title" required minLength={8} maxLength={90} placeholder={t("Casa de 3 recámaras cerca de la Plaza Vasco de Quiroga", "3-bedroom house near Plaza Vasco de Quiroga")} />
        </label>
        <div className="grid2">
          <label>{t("Precio (MXN)", "Price (MXN)")}
            <input type="text" inputMode="numeric" autoComplete="off" aria-describedby="price-hint" placeholder={t("Vacío = “a tratar”", "Empty = “negotiable”")}
              value={priceDigits ? Number(priceDigits).toLocaleString("en-US") : ""}
              onChange={(e) => setPriceDigits(e.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 10))} />
            <input type="hidden" name="price" value={priceDigits} />
            <small id="price-hint" className={priceWarn(priceNum) ? "error" : "muted"}>
              {priceNum ? <>= ${priceNum.toLocaleString("en-US")} MXN{opSel === "renta" ? t(" por mes", " per month") : ""} ({priceWords(priceNum)}){priceWarn(priceNum) ? ` — ${priceWarn(priceNum)}` : ""}</> : t("Solo números, sin comas ni signos.", "Numbers only, no commas or signs.")}
            </small>
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
          <label>{t("Terreno (ej. 10x21)", "Lot (e.g. 10x21)")}
            <input name="land_dims" value={landIn} onChange={(e) => { const v = e.target.value; setLandIn(v); e.target.setCustomValidity(v.trim() !== "" && !parseLand(v) ? t("Escríbelo como 10x21 o 210", "Write it as 10x21 or 210") : ""); }} inputMode="text" autoComplete="off" maxLength={30}
              placeholder="10x21" aria-describedby="land-hint"
              />
            <small id="land-hint" className="muted">{landIn.trim() === "" ? t("Frente x fondo en metros, o solo m².", "Width x depth in meters, or just m².") : landParsed ? `= ${landParsed.m2} m²` : t("Escríbelo como 10x21 o 210", "Write it as 10x21 or 210")}</small>
          </label>
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
              {photos.length > 1 && <p className="muted small" style={{ margin: "8px 0 0" }}>{t("Arrastra una foto para cambiar el orden. La primera es la principal. En el celular, toca ★ para hacerla principal.", "Drag a photo to reorder. The first one is the main photo. On a phone, tap ★ to make it the main one.")}</p>}
              {uploading && <p className="muted small" role="status">{t("Subiendo fotos…", "Uploading photos…")}</p>}
              <div className="thumbs">
                {photos.map((u, idx) => (
                  <div
                    key={u}
                    className={`thumb${dragIdx === idx ? " dragging" : ""}${overIdx === idx && dragIdx !== idx ? " over" : ""}`}
                    draggable
                    onDragStart={(e) => { setDragIdx(idx); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(idx)); }}
                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (overIdx !== idx) setOverIdx(idx); }}
                    onDrop={(e) => { e.preventDefault(); movePhoto(dragIdx, idx); setDragIdx(null); setOverIdx(null); }}
                    onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt={t(`Foto ${idx + 1}`, `Photo ${idx + 1}`)} draggable={false} />
                    {idx === 0 && <span className="thumb-main">{t("Principal", "Main")}</span>}
                    {idx > 0 && <button type="button" className="thumb-star" title={t("Hacer principal", "Make main")} aria-label={t(`Hacer principal la foto ${idx + 1}`, `Make photo ${idx + 1} the main one`)} onClick={() => movePhoto(idx, 0)}>★</button>}
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
          {step === 1 && <LocationPicker value={geo} onChange={setGeo} />}
        </fieldset>
        <fieldset className="feats">
          <legend>{t("Características principales", "Main features")}</legend>
          <p className="muted small" style={{ margin: "0 0 10px" }}>{t("Marca solo lo que sí tiene. Con esto se arma tu descripción y aparece en tu anuncio.", "Tick only what it really has. This builds your description and appears on your listing.")}</p>
          {(["servicios", "espacios", "zona", "condiciones"] as Feature["group"][]).map((g) => {
            const items = avail.filter((f) => f.group === g);
            if (!items.length) return null;
            return (
              <div key={g} className="feat-group">
                <p className="feat-title">{GROUP_LABEL[g][lang]}</p>
                <div className="feat-list">
                  {items.map((f) => (
                    <label key={f.key} className="feat">
                      <input type="checkbox" checked={feat.includes(f.key)} onChange={(e) => setFeat((cur) => (e.target.checked ? [...cur, f.key] : cur.filter((k) => k !== f.key)))} />
                      <span>{f[lang]}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </fieldset>
        <label>{t("Cerca de (opcional)", "Nearby (optional)")}
          <input name="nearby" maxLength={250} placeholder={t("A 5 min a pie de la Plaza Vasco de Quiroga, junto al mercado…", "5 min walk from Plaza Vasco de Quiroga, next to the market…")} />
          <small className="muted">{t("Lugares conocidos cercanos: ayudan a que te encuentren en Google.", "Well-known places nearby: they help people find you on Google.")}</small>
        </label>
        {aiEnabled && (
          <div className="ai-box">
            <label>{t("Algo más que quieras contar (opcional)", "Anything else you want to say (optional)")}
              <textarea name="notes" rows={3} maxLength={1500} placeholder={t("Estado de la propiedad, depósito, mascotas, horarios para ver, lo que la hace especial… aunque sea en lista.", "Condition, deposit, pets, viewing hours, what makes it special… a bullet list is fine. You can write in English; the listing is written in Spanish.")} />
            </label>
            <button type="button" className="btn btn-small" onClick={askAi} disabled={aiBusy || uploading} style={{ marginTop: 10 }}>
              {aiBusy ? t("Redactando…", "Writing…") : t("✨ Redactar mi anuncio", "✨ Write my listing")}
            </button>
            <p className="muted small" style={{ margin: "6px 0 0" }}>
              {t("El asistente escribe el título y la descripción con tus datos, características y fotos, pensados para que Google y los buscadores con IA te encuentren. Solo usa lo que tú marcaste o dijiste; tú revisas y decides.", "The assistant writes the title and description from your data, features and photos, built so Google and AI search can find you. It only uses what you ticked or said; you review and decide. It writes in Spanish, the site’s main language.")}
            </p>
            {aiMsg && <p className="error small" role="alert">{aiMsg}</p>}
            {sugg && (
              <div className="ai-sugg" role="region" aria-label={t("Sugerencia", "Suggestion")}>
                <p className="small muted" style={{ margin: 0 }}>{t("Propuesta (revísala antes de usarla):", "Proposal (review it before using it):")}</p>
                <p style={{ margin: "6px 0", fontWeight: 700 }}>{sugg.titulo}</p>
                <p style={{ margin: "0 0 8px", whiteSpace: "pre-line" }}>{sugg.descripcion}</p>
                {sugg.preguntas.length > 0 && (
                  <>
                    <p className="small" style={{ margin: "0 0 4px" }}><strong>{t("Datos que podrías agregar:", "Details you could add:")}</strong></p>
                    <ul className="small" style={{ margin: "0 0 8px", paddingLeft: 18 }}>{sugg.preguntas.map((q) => <li key={q}>{q}</li>)}</ul>
                  </>
                )}
                <div className="row">
                  <button type="button" className="btn btn-small" onClick={useSugg}>{t("Usar título y descripción", "Use title and description")}</button>
                  <button type="button" className="linklike small" onClick={() => setSugg(null)}>{t("Descartar", "Dismiss")}</button>
                </div>
              </div>
            )}
          </div>
        )}
        <label>{t("Descripción de tu anuncio", "Your listing description")}
          <textarea name="description" required minLength={30} maxLength={3000} rows={9} placeholder={aiEnabled ? t("Aquí aparecerá la descripción que te proponga el asistente. También puedes escribirla tú.", "The description proposed by the assistant will appear here. You can also write it yourself.") : t("Estado de la propiedad, servicios, distancia al centro, condiciones de renta o venta (depósito, contrato, mascotas)… The listing is published in Spanish; English readers see an automatic translation.", "Condition, utilities, distance to downtown, rental or sale terms (deposit, contract, pets)… The listing is published in Spanish; English readers see an automatic translation.")} />
          <small className="muted">{t("Esto es lo que se publicará. Puedes editarla.", "This is what will be published. You can edit it.")}{!aiEnabled && <> <button type="button" className="linklike small" onClick={basicDraft}>{t("Armar un borrador con mis datos", "Build a draft from my data")}</button></>}</small>
        </label>
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
          <label>{t("Tu correo (no se muestra)", "Your email (not shown)")}
            <input name="email" type="email" required maxLength={120} autoComplete="email" placeholder="tu@correo.com" />
            <small className="muted">{t("Lo usamos para confirmar tu anuncio y avisarte. No lo publicamos.", "We use it to confirm your listing and contact you. We never publish it.")}</small>
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
