import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  SlidersHorizontal,
  ArrowUpRight,
  ArrowLeftRight,
  LayoutGrid,
  MapPin,
  Filter,
  X,
  RotateCcw,
} from "lucide-react";
import PropertyCard from "../components/PropertyCard";
import FilterPill from "../components/FilterPill";
import PageHero from "../components/PageHero";
import CtaBand from "../components/CtaBand";
import CardSkeleton from "../components/CardSkeleton";
import { useProperties } from "../lib/api";

const categories = ["Tous", "Villa", "Maison", "Appartement", "Terrain", "Bureau", "Studio"] as const;
const types = ["Tous", "Vente", "Location"] as const;
const cities = ["Toutes", "Bangui", "Bimbo"] as const;

export default function Properties({ defaultType }: { defaultType?: string }) {
  const { t } = useTranslation();
  const { data: properties = [], isLoading } = useProperties();
  const [searchParams, setSearchParams] = useSearchParams();
  const seasonal = searchParams.has("saison");
  const query = searchParams.get("q")?.trim() ?? "";
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
      if (query) {
        const haystack = `${p.title} ${p.neighborhood} ${p.city} ${p.category} ${p.type} ${p.description}`.toLowerCase();
        if (!haystack.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }, [category, type, city, seasonal, query, properties]);

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

  const dirtyFilters = type !== "Tous" || category !== "Tous" || city !== "Toutes" || !!query;

  const clearQuery = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("q");
    setSearchParams(next, { replace: true });
  };

  const resetFilters = () => {
    setType((defaultType as (typeof types)[number]) || "Tous");
    setCategory("Tous");
    setCity("Toutes");
    if (query) clearQuery();
  };

  return (
    <div>
      <PageHero
        title={heroTitle}
        description={heroText}
        crumb={t("navbar.properties")}
        image={
          seasonal
            ? "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80"
            : defaultType === "Location"
              ? "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"
              : "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80"
        }
        imageAlt={heroTitle}
      />

      <section className="py-12 md:py-16">
        <div className="container-page">
          <div className="mb-10 border-y border-line py-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-muted">
                <SlidersHorizontal size={14} />
                {t("properties.filters")}
              </div>

              <div className="flex items-center gap-4">
                {!isLoading && (
                  <span className="text-xs text-muted">
                    {t(filtered.length > 1 ? "properties.resultsPlural" : "properties.results", {
                      count: filtered.length,
                    })}
                  </span>
                )}

                {dirtyFilters && (
                  <button
                    onClick={resetFilters}
                    className="flex items-center gap-1.5 text-[0.75rem] font-medium text-gold-dark transition-colors hover:text-ink"
                  >
                    <RotateCcw size={12} /> {t("common.reset")}
                  </button>
                )}

                <button
                  onClick={() => setMobileFiltersOpen((o) => !o)}
                  className="flex items-center gap-1.5 text-[0.75rem] font-medium text-ink lg:hidden"
                  aria-label={mobileFiltersOpen ? t("common.close") : t("properties.filter")}
                >
                  {mobileFiltersOpen ? (
                    <>
                      {t("common.close")} <X size={14} />
                    </>
                  ) : (
                    <>
                      <Filter size={14} /> {t("properties.filter")}
                    </>
                  )}
                </button>
              </div>
            </div>

            {query && (
              <div className="mt-4 flex items-center gap-2 text-[0.8125rem] text-slate">
                <span>{t("properties.resultsFor", { query })}</span>
                <button
                  onClick={clearQuery}
                  aria-label={t("common.reset")}
                  className="flex h-5 w-5 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-ink/30 hover:text-ink"
                >
                  <X size={11} />
                </button>
              </div>
            )}

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

                <div>
                  <p className="mb-3 flex items-center gap-1.5 text-[0.6875rem] uppercase tracking-[0.12em] text-muted">
                    <LayoutGrid size={12} />
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

                <div>
                  <p className="mb-3 flex items-center gap-1.5 text-[0.6875rem] uppercase tracking-[0.12em] text-muted">
                    <MapPin size={12} />
                    {t("properties.city")}
                  </p>
                  <select
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value as (typeof cities)[number]);
                      setMobileFiltersOpen(false);
                    }}
                    className="select-filter field w-full py-2 pl-4 pr-10 sm:w-48"
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
          </div>

          {isLoading ? (
            <CardSkeleton count={6} />
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          ) : (
            <div className="border border-line py-20 text-center">
              <p className="mx-auto max-w-md px-6 text-sm leading-relaxed text-slate">
                {t("properties.noResults")}
              </p>
              <Link to="/contact" className="btn btn-outline mt-6">
                {t("common.contactUs")} <ArrowUpRight size={15} />
              </Link>
            </div>
          )}
        </div>
      </section>

      <CtaBand
        title={t("properties.cta.title")}
        text={t("properties.cta.text")}
        label={t("common.bookAppointment")}
        to="/contact"
      />
    </div>
  );
}
