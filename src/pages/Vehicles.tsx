import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  SlidersHorizontal,
  ArrowUpRight,
  ArrowLeftRight,
  LayoutGrid,
  Filter,
  X,
  Car,
  RotateCcw,
} from "lucide-react";
import VehicleCard from "../components/VehicleCard";
import FilterPill from "../components/FilterPill";
import PageHero from "../components/PageHero";
import CtaBand from "../components/CtaBand";
import CardSkeleton from "../components/CardSkeleton";
import { vehicleBrands, vehicleCategories } from "../data/vehicles";
import { useVehicles } from "../lib/api";
import { site } from "../data/site";

const types = ["Tous", "Location", "Vente"] as const;
const categories = ["Toutes", ...vehicleCategories] as const;
const brands = ["Toutes", ...vehicleBrands] as const;

export default function Vehicles({ defaultType }: { defaultType?: string }) {
  const { t } = useTranslation();
  const { data: vehicles = [], isLoading } = useVehicles();
  const [type, setType] = useState<(typeof types)[number]>(
    (defaultType as (typeof types)[number]) || "Tous",
  );
  const [category, setCategory] = useState<(typeof categories)[number]>("Toutes");
  const [brand, setBrand] = useState<(typeof brands)[number]>("Toutes");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const usages = t("vehicles.usages", { returnObjects: true }) as {
    title: string;
    text: string;
  }[];
  const badges = t("vehicles.hero.badges", { returnObjects: true }) as string[];

  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      if (type !== "Tous" && v.type !== type) return false;
      if (category !== "Toutes" && v.category !== category) return false;
      if (brand !== "Toutes" && v.brand !== brand) return false;
      return true;
    });
  }, [type, category, brand, vehicles]);

  const heroTitle =
    defaultType === "Location"
      ? t("vehicles.hero.titleRent")
      : defaultType === "Vente"
        ? t("vehicles.hero.titleSale")
        : t("vehicles.hero.titleAll");

  const heroText =
    defaultType === "Location"
      ? t("vehicles.hero.textRent")
      : defaultType === "Vente"
        ? t("vehicles.hero.textSale")
        : t("vehicles.hero.textAll");

  const dirtyFilters = type !== "Tous" || category !== "Toutes" || brand !== "Toutes";

  return (
    <div>
      <PageHero
        title={heroTitle}
        description={heroText}
        crumb={t("navbar.vehicles")}
        image="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80"
        imageAlt={heroTitle}
      >
        <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8125rem] text-muted">
          {badges.map((label, i) => (
            <span key={label} className="flex items-center gap-3">
              {i > 0 && <span className="h-1 w-1 rounded-full bg-line" />}
              {label}
            </span>
          ))}
        </p>
      </PageHero>

      <section className="border-b border-line">
        <div className="container-page grid grid-cols-1 divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0">
          {usages.map((u, i) => (
            <div key={u.title} className="py-8 md:px-8 first:md:pl-0 last:md:pr-0">
              <span className="text-[0.6875rem] font-medium tracking-[0.16em] text-gold-dark">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-2 font-display text-[1rem] font-semibold text-ink">{u.title}</h3>
              <p className="mt-2 text-[0.8125rem] leading-relaxed text-slate">{u.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container-page">
          <div className="mb-10 border-y border-line py-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-muted">
                <SlidersHorizontal size={14} />
                {t("vehicles.filters")}
              </div>

              <div className="flex items-center gap-4">
                {!isLoading && (
                  <span className="text-xs text-muted">
                    {t(filtered.length > 1 ? "vehicles.resultsPlural" : "vehicles.results", {
                      count: filtered.length,
                    })}
                  </span>
                )}

                {dirtyFilters && (
                  <button
                    onClick={() => {
                      setType((defaultType as (typeof types)[number]) || "Tous");
                      setCategory("Toutes");
                      setBrand("Toutes");
                    }}
                    className="flex items-center gap-1.5 text-[0.75rem] font-medium text-gold-dark transition-colors hover:text-ink"
                  >
                    <RotateCcw size={12} /> {t("common.reset")}
                  </button>
                )}

                <button
                  onClick={() => setMobileFiltersOpen((o) => !o)}
                  className="flex items-center gap-1.5 text-[0.75rem] font-medium text-ink lg:hidden"
                  aria-label={mobileFiltersOpen ? t("common.close") : t("vehicles.filter")}
                >
                  {mobileFiltersOpen ? (
                    <>
                      {t("common.close")} <X size={14} />
                    </>
                  ) : (
                    <>
                      <Filter size={14} /> {t("vehicles.filter")}
                    </>
                  )}
                </button>
              </div>
            </div>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                mobileFiltersOpen
                  ? "max-h-[900px] opacity-100"
                  : "max-h-0 opacity-0 lg:max-h-[900px] lg:opacity-100"
              }`}
            >
              <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="mb-3 flex items-center gap-1.5 text-[0.6875rem] uppercase tracking-[0.12em] text-muted">
                    <ArrowLeftRight size={12} />
                    {t("vehicles.type")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {types.map((ty) => (
                      <FilterPill
                        key={ty}
                        active={type === ty}
                        onClick={() => {
                          setType(ty);
                          setMobileFiltersOpen(false);
                        }}
                      >
                        {ty === "Tous" ? t("vehicles.all") : ty}
                      </FilterPill>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-3 flex items-center gap-1.5 text-[0.6875rem] uppercase tracking-[0.12em] text-muted">
                    <LayoutGrid size={12} />
                    {t("vehicles.category")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((c) => (
                      <FilterPill
                        key={c}
                        active={category === c}
                        tone="gold"
                        onClick={() => {
                          setCategory(c);
                          setMobileFiltersOpen(false);
                        }}
                      >
                        {c === "Toutes" ? t("vehicles.all") : c}
                      </FilterPill>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-3 flex items-center gap-1.5 text-[0.6875rem] uppercase tracking-[0.12em] text-muted">
                    <Car size={12} />
                    {t("vehicles.brand")}
                  </p>
                  <select
                    value={brand}
                    onChange={(e) => {
                      setBrand(e.target.value as (typeof brands)[number]);
                      setMobileFiltersOpen(false);
                    }}
                    className="select-filter field w-full py-2 pl-4 pr-10 sm:w-48"
                  >
                    {brands.map((b) => (
                      <option key={b} value={b}>
                        {b === "Toutes" ? t("vehicles.allBrands") : b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <CardSkeleton count={6} />
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          ) : (
            <div className="border border-line py-20 text-center">
              <p className="text-sm leading-relaxed text-slate">{t("vehicles.noResults")}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate">
                {t("vehicles.callUs", { phone: site.phone })}
              </p>
              <Link to="/contact" className="btn btn-outline mt-6">
                {t("common.contactUs")} <ArrowUpRight size={15} />
              </Link>
            </div>
          )}
        </div>
      </section>

      <CtaBand
        title={t("vehicles.cta.title")}
        text={t("vehicles.cta.text", { phone: site.whatsapp })}
        label={t("vehicles.cta.book")}
        to="/contact"
      />
    </div>
  );
}
