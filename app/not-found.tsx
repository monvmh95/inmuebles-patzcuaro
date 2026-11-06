import L from "@/components/L";
import { getLang, tf } from "@/lib/lang";

export default async function NotFound() {
  const t = tf(await getLang());
  return (
    <div className="empty">
      <h1>{t("No encontramos esta página", "We could not find this page")}</h1>
      <p>{t("Puede que el anuncio ya no esté disponible.", "The listing may no longer be available.")}</p>
      <L href="/" className="btn">{t("Ver propiedades", "Browse properties")}</L>
    </div>
  );
}
