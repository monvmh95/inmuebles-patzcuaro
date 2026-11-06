import { headers } from "next/headers";
import { localizePath, type Lang } from "./i18n";

/** Idioma de la petición actual (lo fija el middleware según el prefijo /en). */
export async function getLang(): Promise<Lang> {
  return (await headers()).get("x-lang") === "en" ? "en" : "es";
}
export async function getPublicPath(): Promise<string> {
  return (await headers()).get("x-path") || "/";
}
export const tf = (lang: Lang) => (es: string, en: string) => (lang === "en" ? en : es);
export const hf = (lang: Lang) => (href: string) => localizePath(lang, href);

export { opLabel, opPlural, typeLabel, typePlural } from "./i18n";
