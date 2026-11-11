import { ImageResponse } from "next/og";

export const alt = "Inmuebles Pátzcuaro";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#f7f0e3", padding: 64, borderBottom: "24px solid #9c3a22" }}>
        <div style={{ display: "flex", fontSize: 34, color: "#9c3a22", fontWeight: 700 }}>Pueblo Mágico · Michoacán</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 92, color: "#2b1f19", fontWeight: 800, lineHeight: 1.05 }}>Inmuebles Pátzcuaro</div>
          <div style={{ fontSize: 40, color: "#655548", marginTop: 20 }}>Casas, terrenos y locales en renta y venta, con trato directo por WhatsApp</div>
        </div>
      </div>
    ),
    size,
  );
}
