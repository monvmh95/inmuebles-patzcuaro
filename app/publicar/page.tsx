import type { Metadata } from "next";
import PublishForm from "@/components/PublishForm";
import { CITY } from "@/lib/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Publicar propiedad gratis",
  description: `Publica gratis tu casa, terreno, departamento o local en renta, venta o traspaso en ${CITY}.`,
  alternates: { canonical: "/publicar" },
};

export default function Publicar() {
  return (
    <>
      <h1>Publica tu propiedad gratis</h1>
      <p className="muted" style={{ maxWidth: "60ch" }}>
        No necesitas crear cuenta. Revisamos cada anuncio antes de mostrarlo para cuidar a quienes buscan. Recibirás un enlace privado para ver tus visitas y darlo de baja.
      </p>
      <PublishForm photosEnabled={Boolean(process.env.BLOB_READ_WRITE_TOKEN)} />
    </>
  );
}
