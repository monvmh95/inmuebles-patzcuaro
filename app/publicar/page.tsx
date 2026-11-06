import Link from "next/link";
import type { Metadata } from "next";
import PublishForm from "@/components/PublishForm";
import { CITY } from "@/lib/config";
import { aiEnabled } from "@/lib/ai";
import { alternatesFor } from "@/lib/alternates";
import { getLang, tf } from "@/lib/lang";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  const t = tf(lang);
  return {
    title: t("Publicar propiedad gratis", "List your property for free"),
    description: t(`Publica gratis tu casa, terreno, departamento o local en renta, venta o traspaso en ${CITY}.`, `List your house, land, apartment or commercial space for rent, sale or transfer in ${CITY} for free.`),
    alternates: alternatesFor(lang, "/publicar"),
  };
}

export default async function Publicar() {
  const t = tf(await getLang());
  return (
    <>
      <h1>{t("Publica tu propiedad gratis", "List your property for free")}</h1>
      <p className="muted" style={{ maxWidth: "60ch" }}>
        {t(
          "Confirmas tu celular con un código SMS (solo la primera vez en cada dispositivo) y listo: no hay contraseñas. Revisamos cada anuncio antes de mostrarlo para cuidar a quienes buscan. Después administras tus anuncios, fotos y calendario desde Mis anuncios.",
          "You confirm your phone with an SMS code (only the first time on each device) and that is it: no passwords. We review every listing before showing it, to protect people who are searching. Afterwards you manage your listings, photos and calendar from My listings. Listings are published in Spanish, the site’s main language, and shown to English readers with an automatic translation.",
        )}
      </p>
      <p className="small" style={{ marginTop: 8 }}>{t("¿Ya publicaste?", "Already listed?")} <Link href="/mis-anuncios">{t("Entra a Mis anuncios", "Go to My listings")}</Link></p>
      <PublishForm photosEnabled={Boolean(process.env.BLOB_READ_WRITE_TOKEN)} aiEnabled={aiEnabled()} />
    </>
  );
}
