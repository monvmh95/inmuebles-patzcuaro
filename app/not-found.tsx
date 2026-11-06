import Link from "next/link";

export default function NotFound() {
  return (
    <div className="empty">
      <h1>No encontramos esta página</h1>
      <p>Puede que el anuncio ya no esté disponible.</p>
      <Link href="/" className="btn">Ver propiedades</Link>
    </div>
  );
}
