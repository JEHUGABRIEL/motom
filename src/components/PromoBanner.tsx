import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Megaphone, X, ArrowRight, MessageCircle, Timer } from "lucide-react";
import { properties, formatPrice } from "../data/properties";
import { vehicles, formatVehiclePrice } from "../data/vehicles";
import { useProperties, useVehicles } from "../lib/api";
import {
  isPromoActive,
  isPromoExpired,
  formatPromoEnd,
  promoCountdown,
} from "../lib/promo";
import ContactModal from "./ContactModal";

type PromoItem = {
  kind: "property" | "vehicle";
  id: string;
  title: string;
  price: string;
  image: string;
  to: string;
  promoEndsAt?: string | null;
};

const STATIC_PROMOS: PromoItem[] = [
  ...properties
    .filter((p) => p.promo)
    .map((p) => ({
      kind: "property" as const,
      id: p.id,
      title: p.title,
      price: formatPrice(p.price, p.priceUnit),
      image: p.image,
      to: `/proprietes/${p.id}`,
    })),
  ...vehicles
    .filter((v) => v.promo)
    .map((v) => ({
      kind: "vehicle" as const,
      id: v.id,
      title: v.name,
      price: formatVehiclePrice(v.price, v.priceUnit),
      image: v.image,
      to: `/vehicules/${v.id}`,
    })),
];



const AUTO_CLOSE_MS = 15000;
/** Période de rafraîchissement du compte à rebours. */
const COUNTDOWN_TICK_MS = 30_000;

export default function PromoBanner() {
  const { t, i18n } = useTranslation();
  const { data: apiProperties, isFetched: propertiesFetched } = useProperties();
  const { data: apiVehicles, isFetched: vehiclesFetched } = useVehicles();
  const [visible, setVisible] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [contactItem, setContactItem] = useState<{
    kind: "property" | "vehicle";
    title: string;
  } | null>(null);

  
  
  useEffect(() => {
    if (!visible || dismissed) return;
    const timer = setTimeout(() => setVisible(false), AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [visible, dismissed]);

  const promos = useMemo<PromoItem[]>(() => {
    if (!propertiesFetched || !vehiclesFetched) return STATIC_PROMOS;
    const props = apiProperties ?? [];
    const vehs = apiVehicles ?? [];
    if (props.length === 0 && vehs.length === 0) return STATIC_PROMOS;
    return [
      ...props
        .filter((p) => isPromoActive(p) && !p.promoPaused)
        .map((p) => ({
          kind: "property" as const,
          id: p.id,
          title: p.title,
          price: formatPrice(p.price, p.priceUnit),
          image: p.image,
          to: `/proprietes/${p.id}`,
          promoEndsAt: p.promoEndsAt ?? null,
        })),
      ...vehs
        .filter((v) => isPromoActive(v) && !v.promoPaused)
        .map((v) => ({
          kind: "vehicle" as const,
          id: v.id,
          title: v.name,
          price: formatVehiclePrice(v.price, v.priceUnit),
          image: v.image,
          to: `/vehicules/${v.id}`,
          promoEndsAt: v.promoEndsAt ?? null,
        })),
    ];
  }, [apiProperties, apiVehicles, propertiesFetched, vehiclesFetched]);

  // Horloge partagée : un seul tick pour rafraîchir tous les comptes à rebours.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!visible || dismissed) return;
    const hasDeadlines = promos.some((p) => p.promoEndsAt);
    if (!hasDeadlines) return;
    const interval = setInterval(() => setNow(Date.now()), COUNTDOWN_TICK_MS);
    return () => clearInterval(interval);
  }, [visible, dismissed, promos]);

  // Filtre les promos devenues échues pendant l'affichage.
  const livePromos = promos.filter((p) => !isPromoExpired(p.promoEndsAt, now));

  const promosToRender = livePromos;
  if (!visible || dismissed || promosToRender.length === 0) return null;

  return (
    <>
    <ContactModal
      open={!!contactItem}
      onClose={() => setContactItem(null)}
      item={contactItem ?? undefined}
    />
    <div className="fixed bottom-24 right-6 z-40 w-[calc(100%-3rem)] max-w-sm sm:max-w-md">
      <div className="bg-white border border-line rounded-xl shadow-xl shadow-ink/10 overflow-hidden animate-fade-up">
        <div className="flex items-center justify-between gap-3 px-5 pt-4">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-gold-dark">
            <Megaphone size={14} />
            {t("promo.title")}
          </p>
          <button
            onClick={() => setVisible(false)}
            className="w-7 h-7 rounded flex items-center justify-center text-muted hover:text-ink hover:bg-cream transition-all"
            aria-label={t("common.close")}
          >
            <X size={15} />
          </button>
        </div>
        <div className="px-5 pb-4">
          <div className="space-y-2 mt-2">
            {promosToRender.slice(0, 3).map((p) => {
              return (
              <Link
                key={`${p.kind}-${p.id}`}
                to={p.to}
                onClick={() => setDismissed(true)}
                className="group flex items-center gap-3 rounded-lg bg-cream border border-line p-2.5 hover:border-gold/60 transition-all"
              >
                <img
                  src={p.image}
                  alt={p.title}
                  className="w-12 h-12 rounded-lg object-cover shrink-0"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-ink truncate transition-colors">
                    {p.title}
                  </p>
                  <p className="text-[11px] font-medium text-ink mt-0.5">
                    {p.price}
                    {p.promoEndsAt && (
                      <span className="text-muted font-normal"> · {t("promo.until", { date: formatPromoEnd(p.promoEndsAt, i18n.language) })}</span>
                    )}
                  </p>
                  {(() => {
                    const cd = promoCountdown(p.promoEndsAt, now);
                    if (!cd) return null;
                    return (
                      <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-gold-dark bg-gold/10 border border-gold/30 rounded px-1.5 py-0.5 tabular-nums">
                        <Timer size={11} />
                        {cd.days > 0
                          ? t("promo.countdownDays", { days: cd.days, hours: cd.hours })
                          : cd.hours > 0
                            ? t("promo.countdownHours", { hours: cd.hours, minutes: cd.minutes })
                            : t("promo.countdownMinutes", { minutes: cd.minutes })}
                      </span>
                    );
                  })()}
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setContactItem({ kind: p.kind, title: p.title });
                  }}
                  className="flex items-center gap-1.5 text-[10px] font-medium bg-white border border-line text-ink px-2.5 py-1.5 rounded hover:border-ink/30 transition-colors shrink-0"
                  title={t("common.askInfo")}
                >
                  <MessageCircle size={12} />
                  {t("common.askInfo")}
                </button>
                <ArrowRight size={14} className="text-muted group-hover:text-ink transition-colors shrink-0" />
              </Link>
            );
            })}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}