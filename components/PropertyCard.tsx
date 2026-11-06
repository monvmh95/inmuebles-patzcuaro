import Link from "next/link";
import { localizePath, opLabel, typeLabel, type Lang } from "@/lib/i18n";
import type { Property } from "@/lib/properties";
import { formatPrice, pricePerM2, timeAgo } from "@/lib/format";
import { PlaceholderArt } from "./Art";
import VerifiedBadge from "./VerifiedBadge";
import FavoriteButton from "./FavoriteButton";

type CardProps = {
  p: Pick<Property, "operation" | "type" | "title" | "price" | "colonia" | "bedrooms" | "bathrooms" | "built_m2" | "land_m2" | "photos" | "verified_at"> &
    Partial<Pick<Property, "slug" | "approved_at" | "created_at" | "confirmed_at" | "lake_view" | "max_guests" | "beds">>;
  featured?: boolean;
  /** Vista previa dentro del formulario: no es un enlace. */
  preview?: boolean;
  lang?: Lang;
};

export default function PropertyCard({ p, featured = false, preview = false, lang = "es" }: CardProps) {
  const en = lang === "en";
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
          <PlaceholderArt label={typeLabel(lang, p.type)} lang={lang} />
        )}
        <span className="badge badge-op">{opLabel(lang, p.operation)}</span>
        {p.verified_at && <span className="badge-verified"><VerifiedBadge small lang={lang} /></span>}
        {p.lake_view && <span className="badge badge-lake">{en ? "Lake view" : "Vista al lago"}</span>}
      </div>
      <div className="card-body">
        <p className="card-price">
          {formatPrice(p.price, p.operation, lang)}
          {perM2 != null && <span className="card-perm2"> · ${new Intl.NumberFormat(en ? "en-US" : "es-MX").format(perM2)}/m²</span>}
        </p>
        <h3 className="card-title">{p.title}</h3>
        <p className="card-meta">{typeLabel(lang, p.type)} · {p.colonia}</p>
        <p className="card-facts">
          {p.operation === "hospedaje" && p.max_guests != null && <span>{en ? `up to ${p.max_guests} guests` : `hasta ${p.max_guests} personas`}</span>}
          {p.operation === "hospedaje" && p.beds != null && <span>{p.beds} {en ? "beds" : "camas"}</span>}
          {p.bedrooms != null && <span>{p.bedrooms} {en ? "bd" : "rec."}</span>}
          {p.bathrooms != null && <span>{p.bathrooms} {en ? "ba" : "baños"}</span>}
          {p.built_m2 != null && <span>{p.built_m2} m² {en ? "built" : "const."}</span>}
          {p.land_m2 != null && <span>{p.land_m2} m² {en ? "lot" : "terreno"}</span>}
        </p>
        {posted && <p className="card-date">{en ? "Posted" : "Publicado"} {timeAgo(posted, new Date(), lang)}</p>}
      </div>
    </>
  );

  return (
    <article className={`card${featured ? " card-featured" : ""}`}>
      {preview || !p.slug ? <div className="card-link">{body}</div> : <Link href={localizePath(lang, `/propiedad/${p.slug}`)} className="card-link">{body}</Link>}
      {!preview && p.slug && <FavoriteButton slug={p.slug} className="fav-card" />}
    </article>
  );
}
