"use client";
import { useState } from "react";

export default function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const text = `${title} ${url}`;
  async function nativeShare() {
    try {
      if (navigator.share) await navigator.share({ title, url });
      else await copy();
    } catch {}
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }
  return (
    <div className="share row">
      <a className="btn btn-small btn-ghost" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">Compartir por WhatsApp</a>
      <button type="button" className="btn btn-small btn-ghost" onClick={nativeShare}>{copied ? "¡Enlace copiado!" : "Copiar / compartir"}</button>
    </div>
  );
}
