"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { readFavs } from "@/lib/favs";
import PropertyCard from "./PropertyCard";
import type { Property } from "@/lib/properties";

export default function FavoritesList() {
  const [items, setItems] = useState<Omit<Property, "whatsapp">[] | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      const slugs = readFavs();
      if (!slugs.length) return alive && setItems([]);
      try {
        const r = await fetch(`/api/favoritos?slugs=${encodeURIComponent(slugs.join(","))}`);
        const j = await r.json();
        if (alive) setItems(j.items ?? []);
      } catch { if (alive) setItems([]); }
    }
    load();
    return () => { alive = false; };
  }, []);

  if (items === null) return <p className="muted" role="status">Cargando tus favoritos…</p>;
  if (!items.length) {
    return (
      <div className="empty">
        <p><strong>Aún no guardas ninguna propiedad.</strong></p>
        <p>Toca el corazón en cualquier anuncio para guardarlo aquí. Se guardan en este dispositivo, sin crear cuenta.</p>
        <Link href="/" className="btn">Ver propiedades</Link>
      </div>
    );
  }
  return <div className="grid">{items.map((p) => <PropertyCard key={p.id} p={p} />)}</div>;
}
