import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  SlidersHorizontal,
  ArrowRight,
  ArrowLeftRight,
  LayoutGrid,
  Filter,
  X,
  Car,
  MapPin,
  Briefcase,
  PartyPopper,
  BadgeCheck,
} from "lucide-react";
import VehicleCard from "../components/VehicleCard";
import { vehicleBrands, vehicleCategories } from "../data/vehicles";
import { useVehicles } from "../lib/api";
import { site } from "../data/site";

const types = ["Tous", "Location", "Vente"] as const;
const categories = ["Toutes", ...vehicleCategories] as const;
const brands = ["Toutes", ...vehicleBrands] as const;

const usageIcons = [MapPin, Briefcase, PartyPopper];

export default function Vehicles({ defaultType }: { defaultType?: string }) {
  const { t } = useTranslation();
  const { data: vehicles = [] } = useVehicles();
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

  return (
    <div>
      {}
      <section className="relative pt-40 pb-24 bg-navy overflow-hidden">
        <div className="absolute inset-0 opacity-25">
          <img
            src="https://images.unsplash.com/photo-1587813369290-091c9d432daf?auto=format&fit=crop&w=1920&q=80"
            alt={t("vehicles.hero.alt")}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="container-page relative z-10 text-center">
          <h1 className="font-display font-bold text-white text-4xl md:text-5xl">
            {heroTitle}
          </h1>
          <p className="text-white/60 max-w-2xl mx-auto mt-5">
            {heroText}
          </p>

          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {badges.map((label) => (
              <span
                key={label}
                className="flex items-center gap-2 bg-white/10 border border-white/15 text-white/90 text-sm px-4 py-2 rounded-full"
              >
                <BadgeCheck size={15} className="text-gold" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {}
      <section className="py-16 bg-cream">
        <div className="container-page grid grid-cols-1 md:grid-cols-3 gap-6">
          {usages.map((u, i) => {
            const Icon = usageIcons[i % usageIcons.length];
            return (
              <div
                key={u.title}
                className="bg-white rounded-2xl p-7 border border-navy/5 shadow-sm"
              >
                <span className="w-12 h-12 rounded-xl bg-navy flex items-center justify-center mb-5">
                  <Icon size={20} className="text-gold" />
                </span>
                <h3 className="font-display font-semibold text-navy leading-snug">
                  {u.title}
                </h3>
                <p className="text-sm text-slate mt-2 leading-relaxed">{u.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {}
      <section className="py-16 bg-white">
        <div className="container-page">
          <div className="bg-white border border-navy/5 rounded-2xl shadow-sm mb-12 overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-gold-dark" />
                <span className="text-xs font-semibold text-slate uppercase tracking-widest">
                  {t("vehicles.filters")}
                </span>
              </div>

              <button
                onClick={() => setMobileFiltersOpen((o) => !o)}
                className="lg:hidden flex items-center gap-2 text-xs font-medium text-gold-dark hover:text-gold transition-colors"
                aria-label={
                  mobileFiltersOpen ? t("common.close") : t("vehicles.filter")
                }
              >
                {mobileFiltersOpen ? (
                  <>
                    {t("common.close")} <X size={16} />
                  </>
                ) : (
                  <>
                    <Filter size={16} />
                    {t("vehicles.filter")}
                  </>
                )}
              </button>
            </div>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                mobileFiltersOpen
                  ? "max-h-[800px] opacity-100"
                  : "max-h-0 opacity-0 lg:max-h-[800px] lg:opacity-100"
              }`}
            >
              <div className="px-6 pb-6 space-y-5">
                {}
                <div>
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate/70 uppercase tracking-widest mb-2.5">
                    <ArrowLeftRight size={12} className="text-gold-dark" />
                    {t("vehicles.type")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {types.map((ty) => (
                      <button
                        key={ty}
                        onClick={() => {
                          setType(ty);
                          setMobileFiltersOpen(false);
                        }}
                        className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          type === ty
                            ? "bg-navy text-white shadow-md shadow-navy/10"
                            : "bg-cream text-slate hover:bg-navy/5 hover:text-navy"
                        }`}
                      >
                        {ty === "Tous" ? t("vehicles.all") : ty}
                        {type === ty && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-gold rounded-full border-2 border-white" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {}
                <div>
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate/70 uppercase tracking-widest mb-2.5">
                    <LayoutGrid size={12} className="text-gold-dark" />
                    {t("vehicles.category")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          setCategory(c);
                          setMobileFiltersOpen(false);
                        }}
                        className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          category === c
                            ? "bg-gold text-navy shadow-md shadow-gold/20"
                            : "bg-cream text-slate hover:bg-navy/5 hover:text-navy"
                        }`}
                      >
                        {c === "Toutes" ? t("vehicles.all") : c}
                        {category === c && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-gold rounded-full border-2 border-white" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {}
                <div>
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate/70 uppercase tracking-widest mb-2.5">
                    <Car size={12} className="text-gold-dark" />
                    {t("vehicles.brand")}
                  </p>
                  <select
                    value={brand}
                    onChange={(e) => {
                      setBrand(e.target.value as (typeof brands)[number]);
                      setMobileFiltersOpen(false);
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-sm font-medium bg-cream border border-navy/5 text-slate focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/10 transition-all appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%234A5568' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 12px center",
                      paddingRight: "36px",
                    }}
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

            <div className="px-6 pb-5 flex flex-wrap items-center gap-2 border-t border-navy/5 pt-4">
              <span className="text-xs text-slate/60">
                {t(filtered.length > 1 ? "vehicles.resultsPlural" : "vehicles.results", { count: filtered.length })}
              </span>
              {(type !== "Tous" || category !== "Toutes" || brand !== "Toutes") && (
                <button
                  onClick={() => {
                    setType((defaultType as (typeof types)[number]) || "Tous");
                    setCategory("Toutes");
                    setBrand("Toutes");
                  }}
                  className="ml-auto text-xs font-medium text-gold-dark hover:text-gold transition-colors"
                >
                  {t("common.reset")}
                </button>
              )}
            </div>
          </div>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-slate">
              {t("vehicles.noResults")}
              <br />
              {t("vehicles.callUs", { phone: site.phone })}
            </div>
          )}
        </div>
      </section>

      {}
      <section className="py-20 bg-gold">
        <div className="container-page flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div>
            <h2 className="font-display font-bold text-navy text-3xl md:text-4xl">
              {t("vehicles.cta.title")}
            </h2>
            <p className="text-navy/70 mt-3 max-w-xl">
              {t("vehicles.cta.text", { phone: site.whatsapp })}
            </p>
          </div>
          <Link
            to="/contact"
            className="bg-navy text-white font-semibold px-8 py-4 rounded-full hover:bg-white hover:text-navy transition-colors shrink-0 flex items-center gap-2"
          >
            {t("vehicles.cta.book")} <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}