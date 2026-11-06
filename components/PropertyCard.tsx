import Link from "next/link";
import { OPERATIONS, TYPES } from "@/lib/config";
import type { Property } from "@/lib/properties";
import { formatPrice, pricePerM2, timeAgo } from "@/lib/format";
import { PlaceholderArt } from "./Art";
import VerifiedBadge from "./VerifiedBadge";

type CardProps = {
  p: Pick<Property, "operation" | "type" | "title" | "price" | "colonia" | "bedrooms" | "bathrooms" | "built_m2" | "land_m2" | "photos" | "verified_at"> &
    Partial<Pick<Property, "slug" | "approved_at" | "created_at" | "confirmed_at">>;
  featured?: boolean;
  /** Vista previa dentro del formulario: no es un enlace. */
  preview?: boolean;
};

export default function PropertyCard({ p, featured = false, preview = false }: CardProps) {
  const photo = p.photos?.[0];
  const perM2 = pricePerM2(p);
  const posted = p.approved_at ?? p.created_at;

  const body = (
    <>
      <div className="card-img">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={p.title} loading={featured ? "eager" : "lazy"} width={640} height={480} />
        ) : (
          <PlaceholderArt label={TYPES[p.type].label} />
        )}
        <span className="badge badge-op">{OPERATIONS[p.operation].label}</span>
        {p.verified_at && <span className="badge-verified"><VerifiedBadge small /></span>}
      </div>
      <div className="card-body">
        <p className="card-price">
          {formatPrice(p.price, p.operation)}
          {perM2 != null && <span className="card-perm2"> · ${new Intl.NumberFormat("es-MX").format(perM2)}/m²</span>}
        </p>
        <h3 className="card-title">{p.title}</h3>
        <p className="card-meta">{TYPES[p.type].label} · {p.colonia}</p>
        <p className="card-facts">
          {p.bedrooms != null && <span>{p.bedrooms} rec.</span>}
          {p.bathrooms != null && <span>{p.bathrooms} baños</span>}
          {p.built_m2 != null && <span>{p.built_m2} m² const.</span>}
          {p.land_m2 != null && <span>{p.land_m2} m² terreno</span>}
        </p>
        {posted && <p className="card-date">Publicado {timeAgo(posted)}</p>}
      </div>
    </>
  );

  return (
    <article className={`card${featured ? " card-featured" : ""}`}>
      {preview || !p.slug ? <div className="card-link">{body}</div> : <Link href={`/propiedad/${p.slug}`} className="card-link">{body}</Link>}
    </article>
  );
}
