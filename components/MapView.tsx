"use client";
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { GEO_GRID, MAP_CENTER } from "@/lib/config";
import { localizePath, opLabel, typeLabel } from "@/lib/i18n";
import { useLang } from "./LangProvider";
import { formatPrice, shortPrice } from "@/lib/format";
import type { MapPoint } from "@/lib/properties";

export default function MapView({ points }: { points: MapPoint[] }) {
  const lang = useLang();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: import("leaflet").Map | null = null;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !ref.current) return;
      map = L.map(ref.current, { scrollWheelZoom: false }).setView(MAP_CENTER, 13);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 17,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const bounds: [number, number][] = [];
      for (const p of points) {
        if (p.lat == null || p.lng == null) continue;
        // Pequeño desplazamiento determinista para que anuncios en la misma celda no se encimen.
        const h = Array.from(p.slug).reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
        const lat = p.lat + (((h % 100) / 100) - 0.5) * GEO_GRID * 0.6;
        const lng = p.lng + ((((h >> 7) % 100) / 100) - 0.5) * GEO_GRID * 0.6;
        const icon = L.divIcon({
          className: "",
          html: `<span class="map-pin map-pin-${p.operation}">${shortPrice(p.price, lang)}</span>`,
          iconSize: [0, 0],
        });
        const m = L.marker([lat, lng], { icon, title: p.title }).addTo(map);
        const box = document.createElement("div");
        box.className = "map-pop";
        if (p.photos?.[0]) {
          const img = document.createElement("img");
          img.src = p.photos[0]; img.alt = ""; img.loading = "lazy";
          box.appendChild(img);
        }
        const a = document.createElement("a");
        a.href = localizePath(lang, `/propiedad/${p.slug}`);
        a.textContent = p.title;
        const price = document.createElement("strong");
        price.textContent = formatPrice(p.price, p.operation, lang);
        const meta = document.createElement("span");
        meta.textContent = `${typeLabel(lang, p.type)} · ${opLabel(lang, p.operation)} · ${p.colonia}`;
        box.append(price, a, meta);
        m.bindPopup(box, { minWidth: 200 });
        bounds.push([lat, lng]);
      }
      if (bounds.length > 1) map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
      else if (bounds.length === 1) map.setView(bounds[0], 15);
    })();
    return () => { cancelled = true; map?.remove(); };
  }, [points, lang]);

  return <div ref={ref} className="map" role="region" aria-label={lang === "en" ? "Map of properties (approximate areas)" : "Mapa de propiedades (zonas aproximadas)"} />;
}
