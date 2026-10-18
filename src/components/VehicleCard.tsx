import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Users,
  Gauge,
  Fuel,
  Calendar,
  ArrowRight,
  Car,
  Tag,
} from "lucide-react";
import type { Vehicle } from "../data/vehicles";
import { formatVehiclePrice } from "../data/vehicles";
import ProgressiveImage from "./ProgressiveImage";
import Badge from "./Badge";

const typeIcon = (type: Vehicle["type"]) =>
  type === "Vente" ? Tag : Car;

export default function VehicleCard({
  vehicle,
  compact,
}: {
  vehicle: Vehicle;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  if (compact) {
    return (
      <div className="relative bg-white rounded-2xl overflow-hidden border border-navy/5 shadow-sm">
        <div className="relative overflow-hidden aspect-[3/1]">
          <img
            src={vehicle.image}
            alt={vehicle.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-navy/85 via-navy/40 to-navy/15" />
          <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
            <Badge variant="gold" size="sm" icon={typeIcon(vehicle.type)}>
              {vehicle.type}
            </Badge>
            <Badge variant="navy" size="sm">
              {vehicle.category}
            </Badge>
          </div>
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-4 z-10">
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm leading-snug truncate">
                {vehicle.name}
              </p>
              <p className="text-gold font-bold text-sm mt-0.5">
                {formatVehiclePrice(vehicle.price, vehicle.priceUnit)}
              </p>
            </div>
            <Link
              to={`/vehicules/${vehicle.id}`}
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
      to={`/vehicules/${vehicle.id}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-navy/5 shadow-[0_4px_24px_rgba(20,20,20,0.08)] hover:shadow-[0_12px_32px_rgba(20,20,20,0.16)] transition-all duration-300"
    >
      <div className="relative overflow-hidden aspect-[4/3]">
        <ProgressiveImage
          src={vehicle.image}
          alt={vehicle.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          wrapperClassName="w-full h-full"
        />
        <div className="absolute top-4 left-4 z-10">
          <Badge variant="gold" icon={typeIcon(vehicle.type)}>
            {vehicle.type}
          </Badge>
        </div>
        <div className="absolute top-4 right-4 z-10">
          <Badge variant="navy">{vehicle.category}</Badge>
        </div>
        {vehicle.withDriver && (
          <div className="absolute bottom-4 left-4 z-10">
            <Badge variant="green" size="sm" icon={Users}>
              {t("common.withDriver")}
            </Badge>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="flex items-center gap-1.5 text-xs text-slate mb-2">
          <Calendar size={13} className="text-gold-dark" />
          {vehicle.brand} — {vehicle.year}
        </div>
        <h3 className="font-display text-lg font-semibold text-navy leading-snug group-hover:text-gold-dark transition-colors">
          {vehicle.name}
        </h3>

        <p className="text-gold-dark font-semibold text-lg mt-3">
          {formatVehiclePrice(vehicle.price, vehicle.priceUnit)}
        </p>

        <div className="flex items-center gap-5 mt-4 pt-4 border-t border-navy/10 text-sm text-slate">
          <span className="flex items-center gap-1.5">
            <Users size={16} className="text-navy/60" />
            {vehicle.seats}
          </span>
          <span className="flex items-center gap-1.5">
            <Gauge size={16} className="text-navy/60" />
            {vehicle.transmission === "Automatique" ? t("common.auto") : t("common.manual")}
          </span>
          <span className="flex items-center gap-1.5">
            <Fuel size={16} className="text-navy/60" />
            {vehicle.fuel}
          </span>
        </div>
      </div>
    </Link>
  );
}