import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  SlidersHorizontal,
  ArrowRight,
  ArrowLeftRight,
  LayoutGrid,
  MapPin,
  Filter,
  X,
  RotateCcw,
} from "lucide-react";
import PropertyCard from "../components/PropertyCard";
import FilterPill from "../components/FilterPill";
import { useProperties } from "../lib/api";

const categories = ["Tous", "Villa", "Maison", "Appartement", "Terrain", "Bureau", "Studio"] as const;
const types = ["Tous", "Vente", "Location"] as const;
const cities = ["Toutes", "Bangui", "Bimbo"] as const;

export default function Properties({ defaultType }: { defaultType?: string }) {
  const { t } = useTranslation();
  const { data: properties = [] } = useProperties();
  // /biens-a-louer?saison=1 : location saisonnière (tarif à la nuit)
  const [searchParams] = useSearchParams();
  const seasonal = searchParams.has("saison");
  const [category, setCategory] = useState<(typeof categories)[number]>("Tous");
  const [type, setType] = useState<(typeof types)[number]>(
    (defaultType as (typeof types)[number]) || "Tous",
  );
  const [city, setCity] = useState<(typeof cities)[number]>("Toutes");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      if (category !== "Tous" && p.category !== category) return false;
      if (type !== "Tous" && p.type !== type) return false;
      if (city !== "Toutes" && p.city !== city) return false;
      if (seasonal && p.priceUnit !== "FCFA/nuit") return false;
      return true;
    });
  }, [category, type, city, seasonal, properties]);

  const heroTitle = seasonal
    ? t("properties.hero.titleSeasonal")
    : defaultType
    ? defaultType === "Vente"
      ? t("properties.hero.titleSale")
      : t("properties.hero.titleRent")
    : t("properties.hero.titleAll");

  const heroText = seasonal
    ? t("properties.hero.textSeasonal")
    : defaultType === "Vente"
    ? t("properties.hero.textSale")
    : defaultType === "Location"
      ? t("properties.hero.textRent")
      : t("properties.hero.textAll");

  return (
    <div>
      <section className="relative pt-40 pb-24 bg-navy overflow-hidden">
        <div className="absolute inset-0 opacity-25">
          <img
            src="https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1920&q=80"
            alt={t("properties.hero.alt")}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="container-page relative z-10 text-center">
          <h1 className="font-display font-bold text-white text-4xl md:text-5xl">
            {heroTitle}
          </h1>
          <p className="text-white/60 max-w-xl mx-auto mt-5">
            {heroText}
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container-page">
          {}
          <div className="bg-white border border-navy/10 rounded-2xl shadow-lg shadow-navy/5 mb-12 overflow-hidden">
            {}
            <div className="flex items-center justify-between gap-3 px-6 py-4 bg-navy">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-gold" />
                <span className="text-xs font-bold text-white uppercase tracking-widest">
                  {t("properties.filters")}
                </span>
              </div>

              {}
              <button
                onClick={() => setMobileFiltersOpen((o) => !o)}
                className="lg:hidden inline-flex items-center gap-2 text-xs font-medium text-white/80 hover:text-gold transition-colors"
                aria-label={mobileFiltersOpen ? t("common.close") : t("properties.filter")}
              >
                {mobileFiltersOpen ? (
                  <>
                    {t("common.close")} <X size={16} />
                  </>
                ) : (
                  <>
                    <Filter size={16} />
                    {t("properties.filter")}
                  </>
                )}
              </button>
            </div>

            {}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                mobileFiltersOpen
                  ? "max-h-[800px] opacity-100"
                  : "max-h-0 opacity-0 lg:max-h-[800px] lg:opacity-100"
              }`}
            >
              <div className="px-6 py-6 space-y-6">
                {}
                <div>
                  <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate uppercase tracking-widest mb-3">
                    <ArrowLeftRight size={12} className="text-gold-dark" />
                    {t("properties.transaction")}
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
                        {ty === "Tous" ? t("properties.all") : ty}
                      </FilterPill>
                    ))}
                  </div>
                </div>

                {}
                <div>
                  <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate uppercase tracking-widest mb-3">
                    <LayoutGrid size={12} className="text-gold-dark" />
                    {t("properties.category")}
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
                        {c === "Tous" ? t("properties.all") : c}
                      </FilterPill>
                    ))}
                  </div>
                </div>

                {}
                <div>
                  <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate uppercase tracking-widest mb-3">
                    <MapPin size={12} className="text-gold-dark" />
                    {t("properties.city")}
                  </p>
                  <select
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value as (typeof cities)[number]);
                      setMobileFiltersOpen(false);
                    }}
                    className="select-filter w-full sm:w-auto rounded-xl border border-navy/10 bg-cream px-4 py-2.5 text-sm font-medium text-navy transition-all hover:border-gold/60 focus:border-gold focus:ring-2 focus:ring-gold/15 focus:outline-none"
                  >
                    {cities.map((c) => (
                      <option key={c} value={c}>
                        {c === "Toutes" ? t("properties.allCities") : c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {}
            <div className="px-6 py-4 flex flex-wrap items-center gap-3 border-t border-navy/10 bg-cream/60">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-navy">
                <span className="w-2 h-2 rounded-full bg-gold" />
                {t(filtered.length > 1 ? "properties.resultsPlural" : "properties.results", { count: filtered.length })}
              </span>
              {(type !== "Tous" || category !== "Tous" || city !== "Toutes") && (
                <button
                  onClick={() => {
                    setType((defaultType as (typeof types)[number]) || "Tous");
                    setCategory("Tous");
                    setCity("Toutes");
                  }}
                  className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-gold-dark hover:text-gold transition-colors"
                >
                  <RotateCcw size={13} /> {t("common.reset")}
                </button>
              )}
            </div>
          </div>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-slate">
              {t("properties.noResults")}
            </div>
          )}
        </div>
      </section>

      {}
      <section className="py-20 bg-gold">
        <div className="container-page flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div>
            <h2 className="font-display font-bold text-navy text-3xl md:text-4xl">
              {t("properties.cta.title")}
            </h2>
            <p className="text-navy/70 mt-3 max-w-xl">
              {t("properties.cta.text")}
            </p>
          </div>
          <Link
            to="/contact"
            className="bg-navy text-white font-semibold px-8 py-4 rounded-full hover:bg-white hover:text-navy transition-colors shrink-0 flex items-center gap-2"
          >
            {t("common.bookAppointment")} <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}