"use client";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { GEO_GRID, MAP_CENTER, inBounds } from "@/lib/config";

type Pt = { lat: number; lng: number } | null;

export default function LocationPicker({ value, onChange }: { value: Pt; onChange: (p: Pt) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").Circle | null>(null);
  const libRef = useRef<typeof import("leaflet") | null>(null);
  const [msg, setMsg] = useState("");

  function draw(p: Pt) {
    const L = libRef.current, map = mapRef.current;
    if (!L || !map) return;
    layerRef.current?.remove();
    layerRef.current = null;
    if (p) {
      layerRef.current = L.circle([p.lat, p.lng], { radius: GEO_GRID * 111_000 / 2, color: "#9c3a22", fillColor: "#9c3a22", fillOpacity: 0.2, weight: 2 }).addTo(map);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !ref.current) return;
      libRef.current = L;
      const map = L.map(ref.current, { scrollWheelZoom: false }).setView(value ? [value.lat, value.lng] : MAP_CENTER, value ? 15 : 13);
      mapRef.current = map;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 17,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      map.on("click", (e: import("leaflet").LeafletMouseEvent) => {
        if (!inBounds(e.latlng.lat, e.latlng.lng)) { setMsg("Esa zona queda fuera de Pátzcuaro y sus alrededores."); return; }
        setMsg("");
        const p = { lat: e.latlng.lat, lng: e.latlng.lng };
        draw(p); onChange(p);
      });
      draw(value);
    })();
    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function useMyLocation() {
    setMsg("");
    if (!navigator.geolocation) return setMsg("Tu navegador no permite usar la ubicación.");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (!inBounds(p.lat, p.lng)) return setMsg("Tu ubicación actual no está en Pátzcuaro. Toca el mapa para marcar la zona.");
        mapRef.current?.setView([p.lat, p.lng], 15); draw(p); onChange(p);
      },
      () => setMsg("No pudimos obtener tu ubicación. Toca el mapa para marcar la zona."),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  return (
    <div className="stack">
      <div ref={ref} className="map map-pick" role="application" aria-label="Mapa para marcar la zona aproximada" />
      <div className="row">
        <button type="button" className="btn btn-small btn-ghost" onClick={useMyLocation}>Usar mi ubicación</button>
        {value && <button type="button" className="btn btn-small btn-ghost" onClick={() => { draw(null); onChange(null); }}>Quitar zona</button>}
      </div>
      <p className="muted small" role="status">
        {msg || (value ? "Zona marcada. En el anuncio se muestra un área de unos 300 m, nunca tu dirección exacta." : "Toca el mapa para marcar la zona. Es opcional, pero tu anuncio aparecerá en el mapa.")}
      </p>
    </div>
  );
}
