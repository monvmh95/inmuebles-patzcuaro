import type { Metadata } from "next";
import { localizePath, type Lang } from "./i18n";

/** Canonical propio de cada idioma + hreflang cruzado. `esPath` es la ruta en español, sin query. */
export function alternatesFor(lang: Lang, esPath: string): Metadata["alternates"] {
  const en = localizePath("en", esPath);
  return {
    canonical: lang === "en" ? en : esPath,
    languages: { "es-MX": esPath, en, "x-default": esPath },
  };
}
