import { useTranslation } from "react-i18next";

/** Grille de cartes squelettes pendant le chargement des annonces. */
export default function CardSkeleton({ count = 3 }: { count?: number }) {
  const { t } = useTranslation();

  return (
    <div
      role="status"
      aria-label={t("common.loading")}
      className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-xl border border-line bg-white"
          aria-hidden
        >
          <div className="aspect-[4/3] bg-cream" />
          <div className="space-y-3 p-5">
            <div className="h-2 w-16 rounded bg-line" />
            <div className="h-4 w-3/4 rounded bg-line" />
            <div className="h-3 w-1/2 rounded bg-line" />
            <div className="h-4 w-24 rounded bg-line" />
          </div>
        </div>
      ))}
      <span className="sr-only">{t("common.loading")}</span>
    </div>
  );
}
