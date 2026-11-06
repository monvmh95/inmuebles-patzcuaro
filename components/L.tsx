import Link from "next/link";
import type { ComponentProps } from "react";
import { getLang } from "@/lib/lang";
import { localizePath } from "@/lib/i18n";

/** Enlace para componentes de servidor: recibe rutas en español y las lleva al idioma actual. */
export default async function L({ href, ...rest }: Omit<ComponentProps<typeof Link>, "href"> & { href: string }) {
  const lang = await getLang();
  return <Link href={localizePath(lang, href)} {...rest} />;
}
