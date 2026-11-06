import type { Metadata } from "next";
import FavoritesList from "@/components/FavoritesList";

export const metadata: Metadata = {
  title: "Mis favoritos",
  description: "Propiedades que guardaste en este dispositivo.",
  robots: { index: false, follow: true },
};

export default function Favoritos() {
  return (
    <div className="stack">
      <h1>Mis favoritos</h1>
      <p className="muted">Se guardan solo en este dispositivo, sin crear cuenta. Si borras los datos del navegador, se pierden.</p>
      <FavoritesList />
    </div>
  );
}
