import Link from "next/link";
import { localizePath, type Lang } from "@/lib/i18n";
import { VerifiedIcon } from "./Art";

export default function VerifiedBadge({ link = false, small = false, lang = "es" }: { link?: boolean; small?: boolean; lang?: Lang }) {
  const en = lang === "en";
  const inner = (
    <>
      <VerifiedIcon size={small ? 13 : 15} />
      <span>{en ? "Verified" : "Verificado"}</span>
    </>
  );
  const cls = `verified${small ? " verified-sm" : ""}`;
  return link ? (
    <Link href={localizePath(lang, "/verificacion")} className={cls} title={en ? "What does verified mean?" : "¿Qué significa verificado?"}>{inner}</Link>
  ) : (
    <span className={cls}>{inner}</span>
  );
}
