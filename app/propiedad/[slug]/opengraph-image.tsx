import { ImageResponse } from "next/og";
import { getBySlug } from "@/lib/properties";
import { formatPrice } from "@/lib/format";
import { getLang, opLabel } from "@/lib/lang";

export const alt = "Propiedad en Pátzcuaro";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lang = await getLang();
  const p = await getBySlug(slug).catch(() => null);
  const photo = p?.photos?.[0];
  const title = p?.title ?? "Inmuebles Pátzcuaro";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#1d1815", position: "relative" }}>
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" width={1200} height={630} style={{ position: "absolute", inset: 0, width: 1200, height: 630, objectFit: "cover" }} />
        )}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", padding: "40px 56px", background: "linear-gradient(transparent, rgba(29,24,23,.95))", color: "#fff" }}>
          <div style={{ display: "flex", fontSize: 30, color: "#e3b765", fontWeight: 700 }}>
            {p ? `${opLabel(lang, p.operation)} · ${p.colonia}` : "Pátzcuaro, Michoacán"}
          </div>
          <div style={{ display: "flex", fontSize: 58, fontWeight: 800, lineHeight: 1.1, marginTop: 8 }}>{title.slice(0, 70)}</div>
          <div style={{ display: "flex", fontSize: 50, fontWeight: 800, color: "#fff", marginTop: 8 }}>{p ? formatPrice(p.price, p.operation, lang) : ""}</div>
          <div style={{ display: "flex", fontSize: 26, color: "#cdbdaa", marginTop: 8 }}>Inmuebles Pátzcuaro</div>
        </div>
      </div>
    ),
    size,
  );
}
