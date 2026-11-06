"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { PlaceholderArt } from "./Art";
import { useLang } from "./LangProvider";

export default function Gallery({ photos, title, label }: { photos: string[]; title: string; label: string }) {
  const lang = useLang();
  const en = lang === "en";
  const [i, setI] = useState(0); // foto en pantalla completa
  const [cur, setCur] = useState(0); // foto visible en el carrusel
  const dlg = useRef<HTMLDialogElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const thumbs = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);
  const raf = useRef<number | null>(null);
  const n = photos.length;

  const go = useCallback((d: number) => setI((v) => (v + d + n) % n), [n]);
  const open = (idx: number) => { setI(idx); dlg.current?.showModal(); };
  const slideTo = useCallback((idx: number, smooth = true) => {
    const el = track.current;
    if (!el) return;
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: ((idx + n) % n) * el.clientWidth, behavior: smooth && !reduce ? "smooth" : "auto" });
  }, [n]);

  // El carrusel se desliza con el dedo (scroll-snap nativo); aquí solo seguimos cuál foto se ve.
  function onScroll() {
    if (raf.current != null) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = null;
      const el = track.current;
      if (!el || !el.clientWidth) return;
      const idx = Math.round(el.scrollLeft / el.clientWidth);
      setCur((c) => (c === idx ? c : Math.max(0, Math.min(n - 1, idx))));
    });
  }

  // Mantiene la miniatura activa a la vista, sin mover la página.
  useEffect(() => {
    const c = thumbs.current;
    const t = c?.children[cur] as HTMLElement | undefined;
    if (c && t) c.scrollTo({ left: t.offsetLeft - c.clientWidth / 2 + t.clientWidth / 2, behavior: "smooth" });
  }, [cur]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!dlg.current?.open) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [go]);

  if (n === 0) return <div className="gallery-main"><PlaceholderArt label={label} lang={lang} /></div>;

  return (
    <>
      <div className="gallery-slider">
        <div
          ref={track}
          className="gallery-track"
          onScroll={onScroll}
          tabIndex={0}
          role="group"
          aria-roledescription="carousel"
          aria-label={en ? `Photos of ${title}` : `Fotos de ${title}`}
          onKeyDown={(e) => { if (e.key === "ArrowRight") { e.preventDefault(); slideTo(cur + 1); } if (e.key === "ArrowLeft") { e.preventDefault(); slideTo(cur - 1); } }}
        >
          {photos.map((u, idx) => (
            <button type="button" key={u} className="gallery-slide" onClick={() => open(idx)} aria-label={en ? `View photo ${idx + 1} of ${n} full screen` : `Ver foto ${idx + 1} de ${n} en pantalla completa`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt={en ? `${title}, photo ${idx + 1} of ${n}` : `${title}, foto ${idx + 1} de ${n}`} width={1200} height={900} loading={idx === 0 ? "eager" : "lazy"} fetchPriority={idx === 0 ? "high" : "auto"} draggable={false} />
            </button>
          ))}
        </div>
        {n > 1 && (
          <>
            <button type="button" className="gal-arrow gal-prev" onClick={() => slideTo(cur - 1)} aria-label={en ? "Previous photo" : "Foto anterior"}>‹</button>
            <button type="button" className="gal-arrow gal-next" onClick={() => slideTo(cur + 1)} aria-label={en ? "Next photo" : "Foto siguiente"}>›</button>
            <span className="gallery-count" aria-live="polite">{cur + 1} / {n}</span>
          </>
        )}
      </div>
      {n > 1 && (
        <div className="gallery-thumbs" ref={thumbs} role="tablist" aria-label={en ? "Photo thumbnails" : "Miniaturas de las fotos"}>
          {photos.map((u, idx) => (
            <button type="button" role="tab" aria-selected={idx === cur} key={u} className={idx === cur ? "on" : ""} onClick={() => slideTo(idx)} aria-label={en ? `Show photo ${idx + 1} of ${n}` : `Mostrar foto ${idx + 1} de ${n}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" loading="lazy" width={300} height={225} draggable={false} />
            </button>
          ))}
        </div>
      )}

      <dialog
        ref={dlg}
        className="lightbox"
        aria-label={en ? `Photos of ${title}` : `Fotos de ${title}`}
        onClick={(e) => { if (e.target === dlg.current) dlg.current?.close(); }}
        onClose={() => slideTo(i, false)}
        onTouchStart={(e) => { startX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (startX.current == null) return;
          const dx = e.changedTouches[0].clientX - startX.current;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
          startX.current = null;
        }}
      >
        <div className="lightbox-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[i]} alt={en ? `${title}, photo ${i + 1} of ${n}` : `${title}, foto ${i + 1} de ${n}`} />
          <p className="lightbox-count" aria-live="polite">{i + 1} / {n}</p>
          <button type="button" className="lb-btn lb-close" onClick={() => dlg.current?.close()} aria-label={en ? "Close" : "Cerrar"}>×</button>
          {n > 1 && (
            <>
              <button type="button" className="lb-btn lb-prev" onClick={() => go(-1)} aria-label={en ? "Previous photo" : "Foto anterior"}>‹</button>
              <button type="button" className="lb-btn lb-next" onClick={() => go(1)} aria-label={en ? "Next photo" : "Foto siguiente"}>›</button>
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
