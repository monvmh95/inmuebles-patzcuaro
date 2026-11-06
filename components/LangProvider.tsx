"use client";
import { createContext, useContext } from "react";
import { localizePath, type Lang } from "@/lib/i18n";

const Ctx = createContext<Lang>("es");
export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <Ctx.Provider value={lang}>{children}</Ctx.Provider>;
}
export const useLang = () => useContext(Ctx);
export function useT() {
  const l = useLang();
  return (es: string, en: string) => (l === "en" ? en : es);
}
export function useHref() {
  const l = useLang();
  return (href: string) => localizePath(l, href);
}
