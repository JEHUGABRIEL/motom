import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import ProgressiveImage from "./ProgressiveImage";
import { poles, type PoleSlug } from "../data/poles";

type Props = {
  /** Pôle à exclure (page du pôle courant) */
  exclude?: PoleSlug;
};

// Cartes des pôles, sur le modèle de l'affiche : photo, pastille jaune à
// icône noire, titre en capitales, phrase d'accroche et mots-clés.
export default function PolesGrid({ exclude }: Props) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {poles
        .filter((p) => p.slug !== exclude)
        .map((p) => {
          const tags = t(`poles.${p.slug}.tags`, { returnObjects: true }) as string[];
          return (
            <Link
              key={p.slug}
              to={p.to}
              className="group bg-white rounded-2xl overflow-hidden border border-navy/10 hover:border-gold transition-colors flex flex-col"
            >
              <div className="relative h-48">
                <ProgressiveImage
                  src={p.image.replace("w=1600", "w=800")}
                  alt={t(`poles.${p.slug}.title`)}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  wrapperClassName="w-full h-full overflow-hidden"
                />
                <span className="absolute -bottom-6 left-6 w-14 h-14 rounded-full bg-gold border-4 border-white flex items-center justify-center">
                  <p.icon size={24} className="text-navy" />
                </span>
              </div>
              <div className="p-6 pt-9 flex flex-col flex-1">
                <h3 className="font-display font-bold uppercase tracking-wide text-navy text-lg">
                  {t(`poles.${p.slug}.title`)}
                </h3>
                <p className="text-sm text-slate leading-relaxed mt-2">
                  {t(`poles.${p.slug}.short`)}
                </p>
                <p className="text-xs font-semibold text-gold-dark mt-4">
                  {tags.join(" · ")}
                </p>
                <span className="mt-auto pt-5 inline-flex items-center gap-2 text-sm font-semibold text-navy group-hover:text-gold-dark transition-colors">
                  {t("poles.discover")} <ArrowRight size={16} />
                </span>
              </div>
            </Link>
          );
        })}
    </div>
  );
}
