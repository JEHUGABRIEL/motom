import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowUpRight,
  Calendar,
  CalendarDays,
  CalendarRange,
  Home,
  LandPlot,
  KeyRound,
  RotateCw,
  Sun,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import ProgressiveImage from "./ProgressiveImage";
import Badge from "./Badge";
import { site } from "../data/site";

type Offer = {
  key: string;
  icon: LucideIcon;
  image: string;
  to?: string;
  whatsapp?: boolean;
};

const photo = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;

const propertyOffers: Offer[] = [
  { key: "houseSale", icon: Home, image: photo("1628744448840-55bdb2497bd4"), to: "/biens-a-vendre" },
  { key: "landSale", icon: LandPlot, image: photo("1500382017468-9049fed747ef"), to: "/biens-a-vendre" },
  { key: "houseRent", icon: KeyRound, image: photo("1592595896551-12b371d546d5"), to: "/biens-a-louer" },
  { key: "seasonal", icon: Sun, image: photo("1600210492486-724fe5c67fb0"), to: "/biens-a-louer?saison=1" },
];

const vehicleOffers: Offer[] = [
  { key: "day", icon: CalendarDays, image: photo("1533473359331-0135ef1b58bf"), whatsapp: true },
  { key: "week", icon: CalendarRange, image: photo("1519641471654-76ce0107ad1b"), whatsapp: true },
  { key: "month", icon: Calendar, image: photo("1449965408869-eaa3f722e40d"), whatsapp: true },
];

/**
 * Carte d'offre « vedette » : même carte que FeaturedVehicleCard, avec l'image
 * en recto et les détails en verso. Le retournement se déclenche au survol sur
 * ordinateur et quand la carte entre au centre de l'écran sur mobile
 * (IntersectionObserver).
 */
function OfferCard({
  offer,
  base,
  href,
  external,
}: {
  offer: Offer;
  base: string;
  href: string;
  external: boolean;
}) {
  const { t } = useTranslation();
  const cardRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [inView, setInView] = useState(false);
  const Icon = offer.icon;
  const title = t(`${base}.${offer.key}.title`);
  const text = t(`${base}.${offer.key}.text`);
  const cta = offer.whatsapp ? t("home.featured.book") : t("home.featured.see");

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

  return (
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
        {/* Recto : le visuel de l'offre */}
        <div
          aria-hidden={flipped}
          className={`absolute inset-0 overflow-hidden rounded-2xl bg-cream [backface-visibility:hidden] ${
            flipped ? "pointer-events-none" : ""
          }`}
        >
          <ProgressiveImage
            src={offer.image}
            alt={title}
            className="h-full w-full object-cover"
            wrapperClassName="h-full w-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/40 to-transparent" />

          <div className="absolute left-4 top-4 flex flex-wrap gap-1.5">
            <Badge variant="navy">{t("home.fleet.title")}</Badge>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
            <p className="text-[0.625rem] font-medium uppercase tracking-[0.18em] text-gold">
              {t("home.fleet.badge")}
            </p>
            <h3 className="mt-2 font-display text-[1.25rem] font-semibold leading-snug text-white md:text-[1.35rem]">
              {title}
            </h3>
            <p className="mt-1.5 flex items-center gap-1 text-xs text-white/70">
              <Icon size={12} className="shrink-0 text-gold" />
              <span className="line-clamp-1">{text}</span>
            </p>
            <div className="mt-4 flex items-end justify-between gap-3 border-t border-white/20 pt-4">
              <p className="font-display text-[1.0625rem] font-semibold text-white">{cta}</p>
              <span className="hidden items-center gap-1.5 text-[0.6875rem] text-white/60 md:inline-flex">
                <RotateCw size={12} /> {t("home.featured.flipHint")}
              </span>
            </div>
          </div>

          {external ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={flipped ? -1 : 0}
              aria-label={`${cta} — ${title}`}
              className="absolute inset-0 z-10"
            />
          ) : (
            <Link
              to={href}
              tabIndex={flipped ? -1 : 0}
              aria-label={`${cta} — ${title}`}
              className="absolute inset-0 z-10"
            />
          )}
        </div>

        {/* Verso : les détails et l'action */}
        <div
          aria-hidden={!flipped}
          className={`absolute inset-0 flex flex-col overflow-hidden rounded-2xl bg-ink p-5 text-white [backface-visibility:hidden] [transform:rotateY(180deg)] md:p-6 ${
            flipped ? "" : "pointer-events-none"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-[0.625rem] font-medium uppercase tracking-[0.18em] text-gold">
              {t("home.fleet.badge")}
            </p>
            <span className="rounded bg-white/10 px-2 py-0.5 text-[0.625rem] font-medium uppercase tracking-[0.12em] text-white/70">
              {t("home.fleet.rentVehicle")}
            </span>
          </div>

          <h3 className="mt-3 line-clamp-2 font-display text-[1.15rem] font-semibold leading-snug text-white">
            {title}
          </h3>
          <p className="mt-1.5 flex items-center gap-1 text-xs text-white/55">
            <Icon size={12} className="shrink-0 text-gold" />
            {t("home.fleet.headline")}
          </p>

          <div className="mt-5 border-y border-white/10 py-4">
            <p className="text-[0.8125rem] leading-relaxed text-white/70">{text}</p>
          </div>

          <div className="mt-auto flex flex-col gap-2 pt-5">
            {external ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={flipped ? 0 : -1}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gold px-4 py-2.5 text-[0.8125rem] font-medium text-ink transition-colors hover:bg-gold-light"
              >
                {cta} <ArrowUpRight size={14} />
              </a>
            ) : (
              <Link
                to={href}
                tabIndex={flipped ? 0 : -1}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gold px-4 py-2.5 text-[0.8125rem] font-medium text-ink transition-colors hover:bg-gold-light"
              >
                {cta} <ArrowUpRight size={14} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OfferCards({ kind }: { kind: "properties" | "vehicles" }) {
  const { t } = useTranslation();
  const offers = kind === "properties" ? propertyOffers : vehicleOffers;
  const base = `home.featured.offers.${kind}`;

  return (
    <div
      className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${
        offers.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"
      }`}
    >
      {offers.map((o) => {
        const href = o.whatsapp
          ? `${site.whatsappHref}?text=${encodeURIComponent(
              t("home.featured.whatsappMessage", {
                offer: t(`${base}.${o.key}.title`).toLowerCase(),
              }),
            )}`
          : o.to!;

        return (
          <OfferCard
            key={o.key}
            offer={o}
            base={base}
            href={href}
            external={Boolean(o.whatsapp)}
          />
        );
      })}
    </div>
  );
}
