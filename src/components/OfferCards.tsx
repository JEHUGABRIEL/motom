import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Home, LandPlot, KeyRound, Sun, CalendarDays, CalendarRange, Calendar } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import ProgressiveImage from "./ProgressiveImage";
import { site } from "../data/site";

// Cartes « en vedette » tant qu'aucune annonce n'est cochée au back-office :
// elles présentent les offres de l'affiche (pas de bien ni de prix inventés).
type Offer = {
  key: string;
  icon: LucideIcon;
  image: string;
  /** Lien interne, ou WhatsApp prérempli quand `whatsapp` est vrai */
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

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 gap-6 ${
        offers.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"
      }`}
    >
      {offers.map((o) => {
        const title = t(`${base}.${o.key}.title`);
        const body = (
          <>
            <div className="relative h-44">
              <ProgressiveImage
                src={o.image}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                wrapperClassName="w-full h-full overflow-hidden"
              />
              <span className="absolute -bottom-6 left-6 w-12 h-12 rounded-full bg-gold border-4 border-white flex items-center justify-center">
                <o.icon size={20} className="text-navy" />
              </span>
            </div>
            <div className="p-6 pt-9 flex flex-col flex-1">
              <h3 className="font-display font-bold text-navy text-lg">{title}</h3>
              <p className="text-sm text-slate leading-relaxed mt-2">{t(`${base}.${o.key}.text`)}</p>
              <span className="mt-auto pt-5 inline-flex items-center gap-2 text-sm font-semibold text-navy group-hover:text-gold-dark transition-colors">
                {o.whatsapp ? t("home.featured.book") : t("home.featured.see")} <ArrowRight size={16} />
              </span>
            </div>
          </>
        );
        const cls =
          "group bg-white rounded-2xl overflow-hidden border border-navy/10 hover:border-gold transition-colors flex flex-col";
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
