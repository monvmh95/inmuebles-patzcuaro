"use client";
import { useT } from "./LangProvider";

export default function WhatsAppButton({ slug, href, label }: { slug: string; href: string; label?: string }) {
  const t = useT();
  function track() {
    try {
      const data = JSON.stringify({ slug });
      if (navigator.sendBeacon) navigator.sendBeacon("/api/track", new Blob([data], { type: "application/json" }));
      else fetch("/api/track", { method: "POST", body: data, keepalive: true, headers: { "content-type": "application/json" } });
    } catch {}
  }
  return (
    <a className="btn btn-wa" href={href} target="_blank" rel="noopener noreferrer nofollow" onClick={track}>
      {label ?? t("Escribir por WhatsApp", "Message on WhatsApp")}
    </a>
  );
}
