"use client";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { GEO_GRID, MAP_CENTER, inBounds } from "@/lib/config";
import { useT } from "./LangProvider";

type Pt = { lat: number; lng: number } | null;

export default function LocationPicker({ value, onChange }: { value: Pt; onChange: (p: Pt) => void }) {
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").Circle | null>(null);
  const libRef = useRef<typeof import("leaflet") | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);
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
      // Si el contenedor cambia de tamaño (paso que se muestra, rotar el celular), recalcula los mosaicos.
      if (typeof ResizeObserver !== "undefined") { roRef.current = new ResizeObserver(() => map.invalidateSize()); roRef.current.observe(ref.current); }
      setTimeout(() => map.invalidateSize(), 50);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 17, updateWhenIdle: false, keepBuffer: 3,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      map.on("click", (e: import("leaflet").LeafletMouseEvent) => {
        if (!inBounds(e.latlng.lat, e.latlng.lng)) { setMsg(t("Esa zona queda fuera de Pátzcuaro y sus alrededores.", "That area is outside Pátzcuaro and its surroundings.")); return; }
        setMsg("");
        const p = { lat: e.latlng.lat, lng: e.latlng.lng };
        draw(p); onChange(p);
      });
      draw(value);
    })();
    return () => { cancelled = true; roRef.current?.disconnect(); mapRef.current?.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function useMyLocation() {
    setMsg("");
    if (!navigator.geolocation) return setMsg(t("Tu navegador no permite usar la ubicación.", "Your browser does not allow location access."));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (!inBounds(p.lat, p.lng)) return setMsg(t("Tu ubicación actual no está en Pátzcuaro. Toca el mapa para marcar la zona.", "Your current location is not in Pátzcuaro. Tap the map to mark the area."));
        mapRef.current?.setView([p.lat, p.lng], 15); draw(p); onChange(p);
      },
      () => setMsg(t("No pudimos obtener tu ubicación. Toca el mapa para marcar la zona.", "We could not get your location. Tap the map to mark the area.")),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  return (
    <div className="stack">
      <div ref={ref} className="map map-pick" role="application" aria-label={t("Mapa para marcar la zona aproximada", "Map to mark the approximate area")} />
      <div className="row">
        <button type="button" className="btn btn-small btn-ghost" onClick={useMyLocation}>{t("Usar mi ubicación", "Use my location")}</button>
        {value && <button type="button" className="btn btn-small btn-ghost" onClick={() => { draw(null); onChange(null); }}>{t("Quitar zona", "Remove area")}</button>}
      </div>
      <p className="muted small" role="status">
        {msg || (value ? t("Zona marcada. En el anuncio se muestra un área de unos 300 m, nunca tu dirección exacta.", "Area marked. The listing shows an area of about 300 m, never your exact address.") : t("Toca el mapa para marcar la zona. Es opcional, pero tu anuncio aparecerá en el mapa.", "Tap the map to mark the area. It is optional, but your listing will appear on the map."))}
      </p>
    </div>
  );
}
