import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  /** Libellé de la page courante dans le fil d'Ariane */
  crumb?: string;
  image?: string;
  imageAlt?: string;
  /** Actions ou informations complémentaires sous le texte */
  children?: ReactNode;
};

/**
 * En-tête commun aux pages intérieures : fil d'Ariane, accroche, titre et,
 * au besoin, un visuel éditorial à droite.
 */
export default function PageHero({
  eyebrow,
  title,
  description,
  crumb,
  image,
  imageAlt,
  children,
}: PageHeroProps) {
  const { t } = useTranslation();

  return (
    <section className="border-b border-line bg-sand pb-14 pt-28 md:pb-16 md:pt-32">
      <div className="container-page">
        <nav
          aria-label={t("common.breadcrumb")}
          className="flex flex-wrap items-center gap-1.5 text-[0.625rem] font-medium uppercase tracking-[0.16em] text-muted"
        >
          <Link to="/" className="transition-colors hover:text-ink">
            {t("navbar.home")}
          </Link>
          <ChevronRight size={11} className="text-line" aria-hidden />
          <span className="text-ink/70">{crumb ?? title}</span>
        </nav>

        <div
          className={`mt-8 ${
            image
              ? "grid grid-cols-1 gap-10 lg:grid-cols-[1.12fr_0.88fr] lg:items-center lg:gap-14"
              : ""
          }`}
        >
          <div className={image ? "" : "max-w-3xl"}>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h1 className="mt-4 font-display text-[2rem] font-bold leading-[1.1] tracking-tight text-ink md:text-[2.75rem]">
              {title}
            </h1>
            <span className="accent-line" />
            {description && (
              <p className="mt-5 max-w-2xl text-[0.9375rem] leading-relaxed text-slate">
                {description}
              </p>
            )}
            {children}
          </div>

          {image && (
            <div className="overflow-hidden rounded-2xl bg-cream">
              <img
                src={image}
                alt={imageAlt ?? title}
                className="aspect-[4/3] h-full w-full object-cover"
                loading="eager"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
