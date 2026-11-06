import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/config";

export const metadata: Metadata = { title: "Aviso de privacidad", alternates: { canonical: "/privacidad" } };

export default function Privacidad() {
  const contact = process.env.CONTACT_EMAIL;
  return (
    <div className="legal">
      <h1>Aviso de privacidad</h1>
      <p className="muted">Borrador inicial conforme a la LFPDPPP. Revísalo con un abogado antes del lanzamiento formal.</p>
      <h2>Responsable</h2>
      <p>El responsable del tratamiento de tus datos es el titular de {SITE_NAME}, con domicilio en Pátzcuaro, Michoacán, México.{contact ? ` Contacto: ${contact}.` : ""}</p>
      <h2>Datos que recabamos</h2>
      <p>Al publicar: número de WhatsApp (se muestra en tu anuncio para que te contacten), correo electrónico (opcional, no se muestra), datos y fotos de la propiedad. De forma automática: un identificador cifrado derivado de tu dirección IP para limitar abuso y spam, y conteo de visitas y clics al anuncio.</p>
      <h2>Finalidades</h2>
      <p>Mostrar tu anuncio, permitir que te contacten, moderar contenido, prevenir fraude y spam, y ofrecerte estadísticas de tu anuncio.</p>
      <h2>Derechos ARCO</h2>
      <p>Puedes acceder, rectificar, cancelar u oponerte al tratamiento de tus datos. Para dar de baja tu anuncio usa el enlace privado que recibiste al publicar; para cualquier otra solicitud escríbenos{contact ? ` a ${contact}` : ""}.</p>
      <h2>Transferencias</h2>
      <p>Usamos proveedores de infraestructura (alojamiento, base de datos y almacenamiento de imágenes) que procesan datos por cuenta nuestra. No vendemos tus datos.</p>
      <h2>Cambios</h2>
      <p>Publicaremos cualquier modificación a este aviso en esta página.</p>
    </div>
  );
}
