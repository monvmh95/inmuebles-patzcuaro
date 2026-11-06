import Link from "next/link";
import { VerifiedIcon } from "./Art";

export default function VerifiedBadge({ link = false, small = false }: { link?: boolean; small?: boolean }) {
  const inner = (
    <>
      <VerifiedIcon size={small ? 13 : 15} />
      <span>Verificado</span>
    </>
  );
  const cls = `verified${small ? " verified-sm" : ""}`;
  return link ? (
    <Link href="/verificacion" className={cls} title="¿Qué significa verificado?">{inner}</Link>
  ) : (
    <span className={cls}>{inner}</span>
  );
}
