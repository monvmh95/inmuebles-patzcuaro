import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { CITY, SITE_NAME, SITE_URL, STATE } from "@/lib/config";
import { JsonLd, websiteJsonLd } from "@/lib/seo";
import { Logo } from "@/components/Art";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Casas, terrenos y locales en renta y venta`,
    template: `%s | ${SITE_NAME}`,
  },
  description: `Encuentra casas, departamentos, terrenos y locales en renta, venta y traspaso en ${CITY}, ${STATE}. Publica tu propiedad gratis y contacta directo por WhatsApp.`,
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "es_MX", siteName: SITE_NAME, url: SITE_URL },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#9c3a22", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX">
      <body>
        <header className="site-header">
          <div className="wrap header-row">
            <Link href="/" className="logo">
              <Logo /> {SITE_NAME}
            </Link>
            <nav className="nav" aria-label="Principal">
              <Link href="/renta" className="nav-sec">Renta</Link>
              <Link href="/venta" className="nav-sec">Venta</Link>
              <Link href="/mapa" className="nav-sec">Mapa</Link>
              <Link href="/favoritos" className="nav-fav" aria-label="Mis favoritos" title="Mis favoritos">♡<span className="nav-fav-t"> Favoritos</span></Link>
              <Link href="/publicar" className="btn btn-small">Publicar gratis</Link>
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
              <p className="muted small">Tablón de propiedades de {CITY}, {STATE}. Conecta directo con dueños y agentes.</p>
            </div>
            <div className="small">
              <Link href="/guias/como-evitar-fraudes-al-rentar">Cómo evitar fraudes al rentar</Link><br />
              <Link href="/guias">Guías</Link><br />
              <Link href="/guias/colonias">Colonias de {CITY}</Link><br />
              <Link href="/verificacion">Qué es “Verificado”</Link><br />
              <Link href="/terminos">Términos</Link> · <Link href="/privacidad">Privacidad</Link>
            </div>
            <p className="muted small">
              {SITE_NAME} no es una inmobiliaria ni intermedia operaciones. No verificamos a las partes: nunca pagues anticipos sin ver la propiedad y comprobar a quién pagas.
            </p>
          </div>
        </footer>
        <JsonLd data={websiteJsonLd} />
      </body>
    </html>
  );
}
