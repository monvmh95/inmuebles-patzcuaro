import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ManageActions from "@/components/ManageActions";
import { query } from "@/lib/db";
import { safe } from "@/lib/safe";
import { formatDate, sha256 } from "@/lib/util";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mi anuncio", robots: { index: false, follow: false } };

const STATUS: Record<string, string> = {
  pending: "En revisión",
  approved: "Publicado",
  rejected: "No aprobado",
  archived: "Dado de baja",
};

export default async function MyListing({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const rows = await safe(
    () => query<{ slug: string; title: string; status: string; views: number; wa_clicks: number; created_at: string; confirmed_at: string }>(
      `SELECT slug, title, status, views, wa_clicks, created_at, confirmed_at FROM properties WHERE token_hash = $1`, [sha256(token)]),
    [],
  );
  const p = rows[0];
  if (!p) notFound();
  const expires = new Date(new Date(p.confirmed_at).getTime() + 90 * 86_400_000);

  return (
    <div className="stack" style={{ maxWidth: 680 }}>
      <h1>Mi anuncio</h1>
      <div className="panel stack">
        <h2 style={{ margin: 0 }}>{p.title}</h2>
        <p>Estado: <strong>{STATUS[p.status] ?? p.status}</strong></p>
        {p.status === "approved" && <p><Link href={`/propiedad/${p.slug}`}>Ver mi anuncio publicado</Link></p>}
        {p.status === "pending" && <p className="muted">Lo estamos revisando. Normalmente lo aprobamos el mismo día.</p>}
        {p.status === "rejected" && <p className="muted">No cumplió nuestras reglas (fotos, datos o contenido). Puedes publicar uno nuevo corrigiéndolo.</p>}
        <div className="stats">
          <div className="stat"><b>{p.views}</b>visitas</div>
          <div className="stat"><b>{p.wa_clicks}</b>clics a WhatsApp</div>
        </div>
        {p.status === "approved" && (
          <p className="muted small">Se mostrará hasta el {formatDate(expires)} (90 días desde tu última confirmación). Confirma que sigue disponible para renovarlo.</p>
        )}
        <ManageActions token={token} status={p.status} />
      </div>
      <p className="muted small">Guarda este enlace: es la única forma de administrar tu anuncio. No lo compartas.</p>
    </div>
  );
}
