import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BedDouble, Bath, Ruler, MapPin, ArrowUpRight } from "lucide-react";
import type { Property } from "../data/properties";
import { formatPrice } from "../data/properties";
import ProgressiveImage from "./ProgressiveImage";
import Badge from "./Badge";

export default function PropertyCard({
  property,
  compact,
}: {
  property: Property;
  compact?: boolean;
}) {
  const { t } = useTranslation();

  if (compact) {
    return (
      <Link
        to={`/proprietes/${property.id}`}
        className="group flex gap-4 overflow-hidden rounded-xl border border-line bg-white p-3 transition-colors hover:border-ink/25"
      >
        <div className="h-24 w-32 shrink-0 overflow-hidden bg-cream">
          <img
            src={property.image}
            alt={property.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <p className="text-[0.625rem] uppercase tracking-[0.14em] text-muted">
            {property.type} · {property.category}
          </p>
          <p className="mt-1 truncate font-display text-sm font-semibold text-ink">
            {property.title}
          </p>
          <p className="mt-1 text-xs text-slate">
            {property.neighborhood}, {property.city}
          </p>
          <p className="mt-2 text-sm font-medium text-ink">
            {formatPrice(property.price, property.priceUnit)}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/proprietes/${property.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-line bg-white transition-colors duration-300 hover:border-ink/30"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-cream">
        <ProgressiveImage
          src={property.image}
          alt={property.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          wrapperClassName="h-full w-full"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge variant="navy">{property.type}</Badge>
          {property.promo && <Badge variant="gold">{t("promo.badge")}</Badge>}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-[0.625rem] font-medium uppercase tracking-[0.16em] text-muted">
          {property.category}
        </p>
        <h3 className="mt-2 font-display text-[1.0625rem] font-semibold leading-snug text-ink">
          {property.title}
        </h3>
        <p className="mt-1.5 flex items-center gap-1 text-xs text-slate">
          <MapPin size={12} className="text-muted" />
          {property.neighborhood}, {property.city}
        </p>

        <div className="mt-4 flex items-center gap-4 text-xs text-slate">
          {property.bedrooms > 0 && (
            <span className="flex items-center gap-1.5">
              <BedDouble size={14} className="text-muted" />
              {property.bedrooms}
            </span>
          )}
          {property.bathrooms > 0 && (
            <span className="flex items-center gap-1.5">
              <Bath size={14} className="text-muted" />
              {property.bathrooms}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Ruler size={14} className="text-muted" />
            {property.area} m²
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-line pt-4">
          <p className="font-display text-[0.9375rem] font-semibold text-ink">
            {formatPrice(property.price, property.priceUnit)}
          </p>
          <span className="flex items-center gap-1 text-[0.75rem] font-medium text-slate transition-colors group-hover:text-ink">
            {t("common.details")}
            <ArrowUpRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}
