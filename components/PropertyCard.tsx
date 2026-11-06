import Link from "next/link";
import { OPERATIONS, TYPES } from "@/lib/config";
import type { Property } from "@/lib/properties";
import { formatPrice } from "@/lib/util";

export default function PropertyCard({ p, featured = false }: { p: Property; featured?: boolean }) {
  const photo = p.photos?.[0];
  return (
    <article className={`card${featured ? " card-featured" : ""}`}>
      <Link href={`/propiedad/${p.slug}`} className="card-link">
        <div className="card-img">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt={p.title} loading={featured ? "eager" : "lazy"} width={640} height={480} />
          ) : (
            <div className="card-noimg" aria-hidden>Sin foto</div>
          )}
          <span className="badge badge-op">{OPERATIONS[p.operation].label}</span>
        </div>
        <div className="card-body">
          <p className="card-price">{formatPrice(p.price, p.operation)}</p>
          <h3 className="card-title">{p.title}</h3>
          <p className="card-meta">
            {TYPES[p.type].label} · {p.colonia}
          </p>
          <p className="card-facts">
            {p.bedrooms != null && <span>{p.bedrooms} rec.</span>}
            {p.bathrooms != null && <span>{p.bathrooms} baños</span>}
            {p.built_m2 != null && <span>{p.built_m2} m² const.</span>}
            {p.land_m2 != null && <span>{p.land_m2} m² terreno</span>}
          </p>
        </div>
      </Link>
    </article>
  );
}
