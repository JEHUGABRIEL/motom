import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Timer } from "lucide-react";
import { promoCountdown } from "../lib/promo";

const TICK_MS = 30_000;

/**
 * Pastille « temps restant » d'une promo à durée limitée (compte à rebours
 * auto-rafraîchi). Ne rend rien sans date de fin ou une fois la promo échue.
 */
export default function PromoCountdownChip({
  promoEndsAt,
  className = "",
}: {
  promoEndsAt: string | null | undefined;
  className?: string;
}) {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!promoEndsAt) return;
    const interval = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(interval);
  }, [promoEndsAt]);

  const cd = promoCountdown(promoEndsAt, now);
  if (!cd) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-gold/15 text-gold-dark border border-gold/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide tabular-nums ${className}`}
    >
      <Timer size={11} strokeWidth={2.5} />
      {cd.days > 0
        ? t("promo.countdownDays", { days: cd.days, hours: cd.hours })
        : cd.hours > 0
          ? t("promo.countdownHours", { hours: cd.hours, minutes: cd.minutes })
          : t("promo.countdownMinutes", { minutes: cd.minutes })}
    </span>
  );
}
