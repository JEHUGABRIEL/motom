import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Users, Gauge, Fuel, Calendar, ArrowUpRight, UserCheck } from "lucide-react";
import type { Vehicle } from "../data/vehicles";
import { formatVehiclePrice } from "../data/vehicles";
import ProgressiveImage from "./ProgressiveImage";
import Badge from "./Badge";

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
      <Link
        to={`/vehicules/${vehicle.id}`}
        className="group flex gap-4 overflow-hidden rounded-xl border border-line bg-white p-3 transition-colors hover:border-ink/25"
      >
        <div className="h-24 w-32 shrink-0 overflow-hidden bg-cream">
          <img
            src={vehicle.image}
            alt={vehicle.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <p className="text-[0.625rem] uppercase tracking-[0.14em] text-muted">
            {vehicle.type} · {vehicle.category}
          </p>
          <p className="mt-1 truncate font-display text-sm font-semibold text-ink">
            {vehicle.name}
          </p>
          <p className="mt-1 text-xs text-slate">
            {vehicle.brand} — {vehicle.year}
          </p>
          <p className="mt-2 text-sm font-medium text-ink">
            {formatVehiclePrice(vehicle.price, vehicle.priceUnit)}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/vehicules/${vehicle.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-line bg-white transition-colors duration-300 hover:border-ink/30"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-cream">
        <ProgressiveImage
          src={vehicle.image}
          alt={vehicle.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          wrapperClassName="h-full w-full"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge variant="navy">{vehicle.type}</Badge>
          {vehicle.promo && <Badge variant="gold">{t("promo.badge")}</Badge>}
          {vehicle.withDriver && (
            <Badge variant="green">
              <UserCheck size={11} className="mr-1 inline" />
              {t("common.withDriver")}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-[0.625rem] font-medium uppercase tracking-[0.16em] text-muted">
          {vehicle.category}
        </p>
        <h3 className="mt-2 font-display text-[1.0625rem] font-semibold leading-snug text-ink">
          {vehicle.name}
        </h3>
        <p className="mt-1.5 flex items-center gap-1 text-xs text-slate">
          <Calendar size={12} className="text-muted" />
          {vehicle.brand} — {vehicle.year}
        </p>

        <div className="mt-4 flex items-center gap-4 text-xs text-slate">
          <span className="flex items-center gap-1.5">
            <Users size={14} className="text-muted" />
            {vehicle.seats}
          </span>
          <span className="flex items-center gap-1.5">
            <Gauge size={14} className="text-muted" />
            {vehicle.transmission === "Automatique" ? t("common.auto") : t("common.manual")}
          </span>
          <span className="flex items-center gap-1.5">
            <Fuel size={14} className="text-muted" />
            {vehicle.fuel}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-line pt-4">
          <p className="font-display text-[0.9375rem] font-semibold text-ink">
            {formatVehiclePrice(vehicle.price, vehicle.priceUnit)}
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
