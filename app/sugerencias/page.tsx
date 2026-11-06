import type { Metadata } from "next";
import SuggestForm from "@/components/SuggestForm";

export const metadata: Metadata = { title: "Sugerencias y dudas", description: "Cuéntanos qué mejorar en Inmuebles Pátzcuaro o pregúntanos lo que necesites.", robots: { index: false, follow: true } };

export default function Sugerencias() {
  return (
    <div className="stack">
      <h1>Sugerencias y dudas</h1>
      <p className="muted" style={{ maxWidth: 560 }}>Este sitio es nuevo y lo estamos construyendo con la comunidad de Pátzcuaro. Dinos qué te gustaría que hiciera, qué te estorba o qué no entendiste.</p>
      <SuggestForm />
    </div>
  );
}
