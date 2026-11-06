import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { CITY, SITE_NAME, SITE_URL, STATE } from "@/lib/config";
import { JsonLd, websiteJsonLd } from "@/lib/seo";
import { Logo } from "@/components/Art";
import { LangProvider } from "@/components/LangProvider";
import { getLang, getPublicPath, hf, tf } from "@/lib/lang";
import { switchPath } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = tf(await getLang());
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: t(`${SITE_NAME} | Casas, terrenos y locales en renta y venta`, `${SITE_NAME} | Houses, land and commercial space for rent and sale`),
      template: `%s | ${SITE_NAME}`,
    },
    description: t(
      `Encuentra casas, departamentos, terrenos y locales en renta, venta y traspaso en ${CITY}, ${STATE}. Publica tu propiedad gratis y contacta directo por WhatsApp.`,
      `Find houses, apartments, land and commercial space for rent, sale and transfer in ${CITY}, ${STATE}, Mexico. List your property for free and contact owners directly on WhatsApp.`,
    ),
    openGraph: { type: "website", locale: t("es_MX", "en_US"), siteName: SITE_NAME },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = { themeColor: "#9c3a22", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  const t = tf(lang);
  const h = hf(lang);
  const other = switchPath(lang, await getPublicPath());
  return (
    <html lang={lang === "en" ? "en" : "es-MX"}>
      <body>
        <LangProvider lang={lang}>
          <header className="site-header">
            <div className="wrap header-row">
              <Link href={h("/")} className="logo">
                <Logo /> {SITE_NAME}
              </Link>
              <nav className="nav" aria-label={t("Principal", "Main")}>
                <Link href={h("/renta")} className="nav-sec">{t("Renta", "Rent")}</Link>
                <Link href={h("/venta")} className="nav-sec">{t("Venta", "Sale")}</Link>
                <Link href={h("/mapa")} className="nav-sec">{t("Mapa", "Map")}</Link>
                <Link href="/mis-anuncios" className="nav-sec">{t("Mis anuncios", "My listings")}</Link>
                <Link href={h("/favoritos")} className="nav-fav" aria-label={t("Mis favoritos", "My favorites")} title={t("Mis favoritos", "My favorites")}>♡<span className="nav-fav-t"> {t("Favoritos", "Favorites")}</span></Link>
                <a href={other} className="lang-switch" hrefLang={lang === "en" ? "es-MX" : "en"} lang={lang === "en" ? "es" : "en"} aria-label={lang === "en" ? "Ver en español" : "View in English"}>{lang === "en" ? "ES" : "EN"}</a>
                <Link href={h("/publicar")} className="btn btn-small">{t("Publicar gratis", "List for free")}</Link>
              </nav>
            </div>
          </header>
          <div className="rebozo-bar" aria-hidden />
          <main className="wrap main">{children}</main>
          <footer className="site-footer">
            <div className="roof-divider" aria-hidden />
            <div className="wrap footer-grid">
              <div>
                <strong>{SITE_NAME}</strong>
                <p className="muted small">{t(`Tablón de propiedades de ${CITY}, ${STATE}. Conecta directo con dueños y agentes.`, `Property board for ${CITY}, ${STATE}, Mexico. Connect directly with owners and agents.`)}</p>
              </div>
              <div className="small">
                <Link href={h("/guias/como-evitar-fraudes-al-rentar")}>{t("Cómo evitar fraudes al rentar", "How to avoid rental scams")}</Link><br />
                <Link href={h("/guias")}>{t("Guías", "Guides")}</Link><br />
                <Link href={h("/guias/colonias")}>{t(`Colonias de ${CITY}`, `${CITY} neighborhoods`)}</Link><br />
                <Link href={h("/verificacion")}>{t("Qué es “Verificado”", "What “Verified” means")}</Link><br />
                <Link href="/mis-anuncios">{t("Mis anuncios", "My listings")}</Link><br />
                <Link href="/sugerencias">{t("Sugerencias", "Feedback")}</Link><br />
                <Link href="/terminos">{t("Términos", "Terms")}</Link> · <Link href="/privacidad">{t("Privacidad", "Privacy")}</Link>{lang === "en" && <span className="muted"> (Spanish)</span>}
              </div>
              <p className="muted small">
                {t(
                  `${SITE_NAME} no es una inmobiliaria ni intermedia operaciones. No verificamos a las partes: nunca pagues anticipos sin ver la propiedad y comprobar a quién pagas.`,
                  `${SITE_NAME} is not a real-estate agency and does not intermediate transactions. We do not vouch for the parties: never pay deposits without seeing the property and confirming who you are paying.`,
                )}
              </p>
            </div>
          </footer>
          <JsonLd data={websiteJsonLd(lang)} />
        </LangProvider>
      </body>
    </html>
  );
}
