"use client";
import { useEffect, useState } from "react";
import { readFavs, toggleFav } from "@/lib/favs";
import { useT } from "./LangProvider";

export default function FavoriteButton({ slug, className = "" }: { slug: string; className?: string }) {
  const t = useT();
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(readFavs().includes(slug));
    const h = () => setOn(readFavs().includes(slug));
    window.addEventListener("inm-favs", h);
    return () => window.removeEventListener("inm-favs", h);
  }, [slug]);
  return (
    <button
      type="button"
      className={`fav${on ? " fav-on" : ""} ${className}`}
      aria-pressed={on}
      aria-label={on ? t("Quitar de favoritos", "Remove from favorites") : t("Guardar en favoritos", "Save to favorites")}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOn(toggleFav(slug)); }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 21s-7.5-4.7-9.6-9.3C.9 8.2 3 5 6.2 5c2 0 3.4 1 4.3 2.4h3C14.4 6 15.8 5 17.8 5 21 5 23.1 8.2 21.6 11.700 19.500 16.300 12 21 12 21z" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
