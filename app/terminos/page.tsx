import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/config";

export const metadata: Metadata = { title: "Términos y condiciones", alternates: { canonical: "/terminos" } };

export default function Terminos() {
  return (
    <div className="legal">
      <h1>Términos y condiciones</h1>
      <p className="muted">Borrador inicial. Revísalo con un abogado antes del lanzamiento formal.</p>
      <h2>1. Qué es {SITE_NAME}</h2>
      <p>Es un tablón en línea donde personas y agentes publican propiedades en renta, venta o traspaso. {SITE_NAME} no es inmobiliaria, no es parte de ninguna operación y no cobra comisión por los tratos que se hagan entre usuarios.</p>
      <h2>2. Responsabilidad de quien publica</h2>
      <p>Quien publica declara que tiene derecho a ofrecer la propiedad, que los datos y fotos son verdaderos y que las fotos son propias o autorizadas. Está prohibido publicar contenido falso, engañoso, ilegal o que infrinja derechos de terceros.</p>
      <h2>3. Verificación</h2>
      <p>Revisamos los anuncios antes de publicarlos, pero no verificamos la propiedad, la identidad ni la solvencia de las partes. Cada usuario debe comprobar por su cuenta antes de pagar o firmar.</p>
      <h2>4. Moderación</h2>
      <p>Podemos rechazar, editar o retirar cualquier anuncio sin previo aviso, en particular si recibimos reportes o sospechamos fraude. Los anuncios caducan a los 90 días si el publicante no confirma que siguen disponibles.</p>
      <h2>5. Servicios de pago futuros</h2>
      <p>Hoy publicar es gratis. Si en el futuro se ofrecen servicios de pago (por ejemplo, destacar un anuncio), se informarán claramente su precio y condiciones antes de cobrar, y los pagos se considerarán definitivos salvo error de cobro.</p>
      <h2>6. Limitación de responsabilidad</h2>
      <p>{SITE_NAME} no se hace responsable por pérdidas derivadas de operaciones entre usuarios, por la exactitud de los anuncios ni por la disponibilidad continua del sitio.</p>
      <h2>7. Cambios</h2>
      <p>Podemos actualizar estos términos. El uso continuo del sitio implica aceptarlos.</p>
    </div>
  );
}
