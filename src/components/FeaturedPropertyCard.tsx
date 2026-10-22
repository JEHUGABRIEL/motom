import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowUpRight,
  Bath,
  BedDouble,
  MapPin,
  MessageCircle,
  RotateCw,
  Ruler,
} from "lucide-react";
import type { Property } from "../data/properties";
import { formatPrice } from "../data/properties";
import ProgressiveImage from "./ProgressiveImage";
import Badge from "./Badge";
import ContactModal from "./ContactModal";

/**
 * Carte « vedette » : l'image occupe toute la carte, et un retournement montre
 * les détails. Le retournement se déclenche au survol sur ordinateur, et quand
 * la carte entre au centre de l'écran sur mobile (IntersectionObserver).
 */
export default function FeaturedPropertyCard({ property }: { property: Property }) {
  const { t } = useTranslation();
  const cardRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [inView, setInView] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const mobile = window.matchMedia("(max-width: 767px)");
    let observer: IntersectionObserver | null = null;

    const observe = () => {
      observer?.disconnect();
      if (!mobile.matches) {
        setInView(false);
        return;
      }
      observer = new IntersectionObserver(
        ([entry]) => setInView(entry.isIntersecting),
        { threshold: 0.6, rootMargin: "-12% 0px -12% 0px" },
      );
      observer.observe(el);
    };

    observe();
    mobile.addEventListener("change", observe);
    return () => {
      observer?.disconnect();
      mobile.removeEventListener("change", observe);
    };
  }, []);

  const flipped = hovered || focused || inView;
  const href = `/proprietes/${property.id}`;
  const stats = [
    property.bedrooms > 0 && {
      icon: BedDouble,
      value: property.bedrooms,
      label: t("propertyDetails.bedrooms"),
    },
    property.bathrooms > 0 && {
      icon: Bath,
      value: property.bathrooms,
      label: t("propertyDetails.bathrooms"),
    },
    {
      icon: Ruler,
      value: `${property.area} m²`,
      label: t("propertyDetails.area"),
    },
  ].filter(Boolean) as { icon: typeof BedDouble; value: string | number; label: string }[];

  return (
    <>
      <div
        ref={cardRef}
        className="group relative h-[470px] w-full [perspective:1600px]"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={() => setFocused(false)}
      >
        <div
          className={`relative h-full w-full transition-transform duration-700 ease-out [transform-style:preserve-3d] motion-reduce:transition-none ${
            flipped ? "[transform:rotateY(180deg)]" : ""
          }`}
        >
          {/* Recto : le visuel du bien */}
          <div
            aria-hidden={flipped}
            className={`absolute inset-0 overflow-hidden rounded-2xl bg-cream [backface-visibility:hidden] ${
              flipped ? "pointer-events-none" : ""
            }`}
          >
            <ProgressiveImage
              src={property.image}
              alt={property.title}
              className="h-full w-full object-cover"
              wrapperClassName="h-full w-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/40 to-transparent" />

            <div className="absolute left-4 top-4 flex flex-wrap gap-1.5">
              <Badge variant="gold">{property.type}</Badge>
              {property.featured && <Badge variant="navy">{t("home.featured.badge")}</Badge>}
              {property.promo && <Badge variant="navy">{t("promo.badge")}</Badge>}
            </div>

            <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
              <p className="text-[0.625rem] font-medium uppercase tracking-[0.18em] text-gold">
                {property.category}
              </p>
              <h3 className="mt-2 font-display text-[1.25rem] font-semibold leading-snug text-white md:text-[1.35rem]">
                {property.title}
              </h3>
              <p className="mt-1.5 flex items-center gap-1 text-xs text-white/70">
                <MapPin size={12} className="shrink-0 text-gold" />
                {property.neighborhood}, {property.city}
              </p>
              <div className="mt-4 flex items-end justify-between gap-3 border-t border-white/20 pt-4">
                <p className="font-display text-[1.0625rem] font-semibold text-white">
                  {formatPrice(property.price, property.priceUnit)}
                </p>
                <span className="hidden items-center gap-1.5 text-[0.6875rem] text-white/60 md:inline-flex">
                  <RotateCw size={12} /> {t("home.featured.flipHint")}
                </span>
              </div>
            </div>

            <Link
              to={href}
              tabIndex={flipped ? -1 : 0}
              aria-label={`${t("common.learnMore")} — ${property.title}`}
              className="absolute inset-0 z-10"
            />
          </div>

          {/* Verso : les détails et les actions */}
          <div
            aria-hidden={!flipped}
            className={`absolute inset-0 flex flex-col overflow-hidden rounded-2xl bg-ink p-5 text-white [backface-visibility:hidden] [transform:rotateY(180deg)] md:p-6 ${
              flipped ? "" : "pointer-events-none"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-[0.625rem] font-medium uppercase tracking-[0.18em] text-gold">
                {property.category}
              </p>
              <span className="rounded bg-white/10 px-2 py-0.5 text-[0.625rem] font-medium uppercase tracking-[0.12em] text-white/70">
                {property.type}
              </span>
            </div>

            <h3 className="mt-3 line-clamp-2 font-display text-[1.15rem] font-semibold leading-snug text-white">
              {property.title}
            </h3>
            <p className="mt-1.5 flex items-center gap-1 text-xs text-white/55">
              <MapPin size={12} className="shrink-0 text-gold" />
              {property.neighborhood}, {property.city}
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2 border-y border-white/10 py-4">
              {stats.map(({ icon: Icon, value, label }) => (
                <div key={label} className="min-w-0">
                  <Icon size={15} className="text-gold" />
                  <p className="mt-1.5 truncate text-[0.8125rem] font-medium text-white">
                    {value}
                  </p>
                  <p className="truncate text-[0.625rem] uppercase tracking-[0.1em] text-white/45">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-4 line-clamp-2 text-[0.8125rem] leading-relaxed text-white/60 md:line-clamp-3">
              {property.description}
            </p>

            <p className="mt-3 font-display text-[1.0625rem] font-semibold text-white">
              {formatPrice(property.price, property.priceUnit)}
            </p>

            <div className="mt-auto flex flex-col gap-2 pt-5 sm:flex-row">
              <Link
                to={href}
                tabIndex={flipped ? 0 : -1}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-gold px-4 py-2.5 text-[0.8125rem] font-medium text-ink transition-colors hover:bg-gold-light"
              >
                {t("common.learnMore")} <ArrowUpRight size={14} />
              </Link>
              <button
                type="button"
                tabIndex={flipped ? 0 : -1}
                onClick={() => setContactOpen(true)}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/25 px-4 py-2.5 text-[0.8125rem] font-medium text-white transition-colors hover:border-gold hover:text-gold"
              >
                <MessageCircle size={14} /> {t("common.contactUs")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ContactModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        item={{ kind: "property", title: property.title }}
      />
    </>
  );
}
