import type { Metadata } from "next";
import L from "@/components/L";
import VerifiedBadge from "@/components/VerifiedBadge";
import { alternatesFor } from "@/lib/alternates";
import { getLang, tf } from "@/lib/lang";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  const t = tf(lang);
  return {
    title: t("Qué significa “Verificado”", "What “Verified” means"),
    description: t("Qué revisamos antes de poner el sello Verificado en un anuncio de Inmuebles Pátzcuaro, y qué no garantiza.", "What we check before adding the Verified badge to an Inmuebles Pátzcuaro listing, and what it does not guarantee."),
    alternates: alternatesFor(lang, "/verificacion"),
  };
}

export default async function Verificacion() {
  const lang = await getLang();
  const t = tf(lang);
  return (
    <article className="legal stack">
      <h1>{t("Qué significa", "What")} <VerifiedBadge lang={lang} /> {lang === "en" && "means"}</h1>
      <p>{t("El sello", "The")} <strong>{t("Verificado", "Verified")}</strong> {t("lo pone manualmente el equipo del sitio, anuncio por anuncio. Es una señal de confianza, no una garantía.", "badge is added manually by the site team, listing by listing. It is a trust signal, not a guarantee.")}</p>
      <h2>{t("Qué revisamos", "What we check")}</h2>
      <ul>
        <li>{t("Que el número de WhatsApp responde y quien contesta dice ser el dueño o su representante.", "That the WhatsApp number answers and the person says they are the owner or their representative.")}</li>
        <li>{t("Que las fotos corresponden a la propiedad descrita (no son imágenes de internet).", "That the photos match the property described (they are not images from the internet).")}</li>
        <li>{t("Que el precio, la zona y los datos principales coinciden con lo publicado.", "That the price, area and main details match what is posted.")}</li>
      </ul>
      <h2>{t("Qué NO garantiza", "What it does NOT guarantee")}</h2>
      <ul>
        <li>{t("No revisamos escrituras, derechos de propiedad ni adeudos.", "We do not review deeds, ownership rights or debts.")}</li>
        <li>{t("No intermediamos pagos ni operaciones.", "We do not intermediate payments or transactions.")}</li>
        <li>{t("Un anuncio sin sello no es necesariamente malo; solo no ha sido revisado.", "A listing without the badge is not necessarily bad; it simply has not been reviewed.")}</li>
      </ul>
      <p>{t("Aun con el sello, visita la propiedad antes de pagar. Lee la", "Even with the badge, visit the property before paying. Read the")} <L href="/guias/como-evitar-fraudes-al-rentar">{t("guía para evitar fraudes", "guide to avoiding scams")}</L>.</p>
      <p>{t("¿Quieres que revisemos tu anuncio? Al publicar, déjanos tu WhatsApp y te contactaremos.", "Want us to review your listing? When you publish, leave your WhatsApp number and we will contact you.")}</p>
    </article>
  );
}
