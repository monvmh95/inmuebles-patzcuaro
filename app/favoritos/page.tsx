import type { Metadata } from "next";
import FavoritesList from "@/components/FavoritesList";
import { getLang, tf } from "@/lib/lang";

export async function generateMetadata(): Promise<Metadata> {
  const t = tf(await getLang());
  return {
    title: t("Mis favoritos", "My favorites"),
    description: t("Propiedades que guardaste en este dispositivo.", "Properties you saved on this device."),
    robots: { index: false, follow: true },
  };
}

export default async function Favoritos() {
  const t = tf(await getLang());
  return (
    <div className="stack">
      <h1>{t("Mis favoritos", "My favorites")}</h1>
      <p className="muted">{t("Se guardan solo en este dispositivo, sin crear cuenta. Si borras los datos del navegador, se pierden.", "They are stored only on this device, no account needed. If you clear your browser data, they are lost.")}</p>
      <FavoritesList />
    </div>
  );
}
