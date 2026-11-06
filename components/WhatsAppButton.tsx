"use client";

export default function WhatsAppButton({ slug, href, label = "Escribir por WhatsApp" }: { slug: string; href: string; label?: string }) {
  function track() {
    try {
      const data = JSON.stringify({ slug });
      if (navigator.sendBeacon) navigator.sendBeacon("/api/track", new Blob([data], { type: "application/json" }));
      else fetch("/api/track", { method: "POST", body: data, keepalive: true, headers: { "content-type": "application/json" } });
    } catch {}
  }
  return (
    <a className="btn btn-wa" href={href} target="_blank" rel="noopener noreferrer nofollow" onClick={track}>
      {label}
    </a>
  );
}
