import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, Home, LandPlot, KeyRound, Sun, CalendarDays, CalendarRange, Calendar } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import ProgressiveImage from "./ProgressiveImage";
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

export default function OfferCards({ kind }: { kind: "properties" | "vehicles" }) {
  const { t } = useTranslation();
  const offers = kind === "properties" ? propertyOffers : vehicleOffers;
  const base = `home.featured.offers.${kind}`;
  const cls =
    "group flex flex-col overflow-hidden rounded-xl border border-line bg-white transition-colors duration-300 hover:border-ink/30";

  return (
    <div
      className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${
        offers.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"
      }`}
    >
      {offers.map((o) => {
        const title = t(`${base}.${o.key}.title`);
        const body = (
          <>
            <div className="relative aspect-[16/10] overflow-hidden bg-cream">
              <ProgressiveImage
                src={o.image}
                alt={title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                wrapperClassName="h-full w-full"
              />
            </div>
            <div className="flex flex-1 flex-col p-6">
              <div className="flex items-center gap-2 text-muted">
                <o.icon size={16} strokeWidth={1.75} />
                <h3 className="font-display text-[1rem] font-semibold text-ink">{title}</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate">{t(`${base}.${o.key}.text`)}</p>
              <span className="mt-auto flex items-center gap-1 pt-5 text-[0.8125rem] font-medium text-slate transition-colors group-hover:text-ink">
                {o.whatsapp ? t("home.featured.book") : t("home.featured.see")}
                <ArrowUpRight size={15} />
              </span>
            </div>
          </>
        );

        return o.whatsapp ? (
          <a
            key={o.key}
            href={`${site.whatsappHref}?text=${encodeURIComponent(
              t("home.featured.whatsappMessage", { offer: title.toLowerCase() }),
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cls}
          >
            {body}
          </a>
        ) : (
          <Link key={o.key} to={o.to!} className={cls}>
            {body}
          </Link>
        );
      })}
    </div>
  );
}
