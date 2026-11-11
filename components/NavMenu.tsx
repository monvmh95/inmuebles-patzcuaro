"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useHref, useLang, useT } from "./LangProvider";

/** Menú de hamburguesa solo para celular: todas las secciones, incluida "Mis anuncios". */
export default function NavMenu({ otherLang, signedIn }: { otherLang: string; signedIn: boolean }) {
  const t = useT();
  const h = useHref();
  const lang = useLang();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);

  return (
    <div className="navmenu">
      <button type="button" className="navmenu-btn" aria-expanded={open} aria-controls="navmenu-panel" onClick={() => setOpen((o) => !o)} aria-label={open ? t("Cerrar menú", "Close menu") : t("Abrir menú", "Open menu")}>
        <span aria-hidden>{open ? "✕" : "☰"}</span>
        <span className="navmenu-btn-t">{t("Menú", "Menu")}</span>
        {signedIn && !open && <i className="navmenu-dot" aria-hidden />}
      </button>
      {open && (
        <>
          <div className="navmenu-scrim" onClick={() => setOpen(false)} aria-hidden />
          <div id="navmenu-panel" className="navmenu-panel">
            <Link href="/mis-anuncios" className="navmenu-main">{signedIn ? "● " : ""}{t("Mis anuncios", "My listings")}<small>{t("Ver, editar y calendario de tus publicaciones", "View, edit and calendar of your listings")}</small></Link>
            <Link href={h("/renta")}>{t("Renta", "Rent")}</Link>
            <Link href={h("/venta")}>{t("Venta", "Sale")}</Link>
            <Link href={h("/hospedaje")}>{t("Hospedaje", "Lodging")}</Link>
            <Link href={h("/eventos")}>{t("Eventos", "Events")}</Link>
            <Link href={h("/mapa")}>{t("Mapa", "Map")}</Link>
            <Link href={h("/favoritos")}>♡ {t("Favoritos", "Favorites")}</Link>
            <Link href={h("/guias")}>{t("Guías", "Guides")}</Link>
            <a href={otherLang} lang={lang === "en" ? "es" : "en"}>{lang === "en" ? "Español" : "English"}</a>
          </div>
        </>
      )}
    </div>
  );
}
