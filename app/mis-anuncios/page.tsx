import type { Metadata } from "next";
import AccountLogin from "@/components/AccountLogin";
import MyListings, { type MyItem } from "@/components/MyListings";
import { getSession } from "@/lib/account";
import { query } from "@/lib/db";
import { mailEnabled } from "@/lib/mail";
import { formatDate } from "@/lib/util";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mis anuncios", robots: { index: false, follow: false } };

export default async function MisAnuncios() {
  if (!mailEnabled()) {
    return <div className="notice"><h1>Mis anuncios</h1><p>Esta sección estará disponible muy pronto. Mientras tanto, usa el enlace privado que recibiste al publicar cada anuncio.</p></div>;
  }
  const s = await getSession().catch(() => null);
  if (!s) return <AccountLogin />;
  const rows = await query<{ slug: string; title: string; description: string; price: number | null; whatsapp: string; status: string; operation: string; views: number; wa_clicks: number; photos: string[]; confirmed_at: string; edited_at: string | null }>(
    `SELECT slug, title, description, price, whatsapp, status, operation, views, wa_clicks, photos, confirmed_at, edited_at
       FROM properties WHERE email_norm = $1 ORDER BY (status = 'archived'), created_at DESC LIMIT 100`, [s.email_norm]);
  const items: MyItem[] = rows.map((r) => ({
    slug: r.slug, title: r.title, description: r.description, price: r.price, whatsapp: r.whatsapp, status: r.status, operation: r.operation,
    views: r.views, wa_clicks: r.wa_clicks, photo: r.photos?.[0] ?? null,
    expires: formatDate(new Date(new Date(r.confirmed_at).getTime() + 90 * 86_400_000)),
    edited: Boolean(r.edited_at && Date.now() - new Date(r.edited_at).getTime() < 7 * 86_400_000),
  }));
  return <MyListings items={items} email={s.email} />;
}
