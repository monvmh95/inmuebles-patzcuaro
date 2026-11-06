"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { PlaceholderArt } from "./Art";

export default function Gallery({ photos, title, label }: { photos: string[]; title: string; label: string }) {
  const [i, setI] = useState(0);
  const dlg = useRef<HTMLDialogElement>(null);
  const startX = useRef<number | null>(null);
  const n = photos.length;

  const go = useCallback((d: number) => setI((v) => (v + d + n) % n), [n]);
  const open = (idx: number) => { setI(idx); dlg.current?.showModal(); };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!dlg.current?.open) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [go]);

  if (n === 0) return <div className="gallery-main"><PlaceholderArt label={label} /></div>;

  return (
    <>
      <button type="button" className="gallery-main gallery-open" onClick={() => open(0)} aria-label={`Ver fotos de ${title} en pantalla completa`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photos[0]} alt={`${title}, foto 1 de ${n}`} width={1200} height={900} fetchPriority="high" />
        {n > 1 && <span className="gallery-count">1 / {n} · Ver fotos</span>}
      </button>
      {n > 1 && (
        <div className="gallery-thumbs">
          {photos.slice(1).map((u, idx) => (
            <button type="button" key={u} onClick={() => open(idx + 1)} aria-label={`Ver foto ${idx + 2} de ${n}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" loading="lazy" width={300} height={225} />
            </button>
          ))}
        </div>
      )}

      <dialog
        ref={dlg}
        className="lightbox"
        aria-label={`Fotos de ${title}`}
        onClick={(e) => { if (e.target === dlg.current) dlg.current?.close(); }}
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
          <img src={photos[i]} alt={`${title}, foto ${i + 1} de ${n}`} />
          <p className="lightbox-count" aria-live="polite">{i + 1} / {n}</p>
          <button type="button" className="lb-btn lb-close" onClick={() => dlg.current?.close()} aria-label="Cerrar">×</button>
          {n > 1 && (
            <>
              <button type="button" className="lb-btn lb-prev" onClick={() => go(-1)} aria-label="Foto anterior">‹</button>
              <button type="button" className="lb-btn lb-next" onClick={() => go(1)} aria-label="Foto siguiente">›</button>
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
