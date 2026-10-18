import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BedDouble,
  Bath,
  Ruler,
  MapPin,
  ArrowRight,
  Home as HomeIcon,
  KeyRound,
} from "lucide-react";
import type { Property } from "../data/properties";
import { formatPrice } from "../data/properties";
import ProgressiveImage from "./ProgressiveImage";
import Badge from "./Badge";

const typeIcon = (type: Property["type"]) =>
  type === "Vente" ? HomeIcon : KeyRound;

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
      <div className="relative bg-white rounded-2xl overflow-hidden border border-navy/5 shadow-sm">
        <div className="relative overflow-hidden aspect-[3/1]">
          <img
            src={property.image}
            alt={property.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-navy/85 via-navy/40 to-navy/15" />
          <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
            <Badge variant="gold" size="sm" icon={typeIcon(property.type)}>
              {property.type}
            </Badge>
            <Badge variant="navy" size="sm">
              {property.category}
            </Badge>
          </div>
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-4 z-10">
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm leading-snug truncate">
                {property.title}
              </p>
              <p className="text-gold font-bold text-sm mt-0.5">
                {formatPrice(property.price, property.priceUnit)}
              </p>
            </div>
            <Link
              to={`/proprietes/${property.id}`}
              className="shrink-0 inline-flex items-center gap-1 bg-gold hover:bg-gold-light text-navy text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-md shadow-gold/30 transition-colors"
            >
              {t("common.details")} <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      to={`/proprietes/${property.id}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-navy/5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] transition-all duration-300"
    >
      <div className="relative overflow-hidden aspect-[4/3]">
        <ProgressiveImage
          src={property.image}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          wrapperClassName="w-full h-full"
        />
        <div className="absolute top-4 left-4 z-10">
          <Badge variant="gold" icon={typeIcon(property.type)}>
            {property.type}
          </Badge>
        </div>
        <div className="absolute top-4 right-4 z-10">
          <Badge variant="navy">{property.category}</Badge>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-1.5 text-xs text-slate mb-2">
          <MapPin size={13} className="text-gold" />
          {property.neighborhood}, {property.city}
        </div>
        <h3 className="font-display text-lg font-semibold text-navy leading-snug group-hover:text-gold-dark transition-colors">
          {property.title}
        </h3>

        <p className="text-gold-dark font-semibold text-lg mt-3">
          {formatPrice(property.price, property.priceUnit)}
        </p>

        <div className="flex items-center gap-5 mt-4 pt-4 border-t border-navy/10 text-sm text-slate">
          {property.bedrooms > 0 && (
            <span className="flex items-center gap-1.5">
              <BedDouble size={16} className="text-navy/60" />
              {property.bedrooms}
            </span>
          )}
          {property.bathrooms > 0 && (
            <span className="flex items-center gap-1.5">
              <Bath size={16} className="text-navy/60" />
              {property.bathrooms}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Ruler size={16} className="text-navy/60" />
            {property.area} m²
          </span>
        </div>
      </div>
    </Link>
  );
}