"use client";
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { GEO_GRID } from "@/lib/config";

export default function ZoneMap({ lat, lng }: { lat: number; lng: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let map: import("leaflet").Map | null = null;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !ref.current) return;
      map = L.map(ref.current, { scrollWheelZoom: false, dragging: false, zoomControl: true }).setView([lat, lng], 14);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 16,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      L.circle([lat, lng], { radius: GEO_GRID * 111_000 / 2, color: "#9c3a22", fillColor: "#9c3a22", fillOpacity: 0.18, weight: 2 }).addTo(map);
    })();
    return () => { cancelled = true; map?.remove(); };
  }, [lat, lng]);
  return <div ref={ref} className="map map-sm" role="img" aria-label="Zona aproximada de la propiedad" />;
}
