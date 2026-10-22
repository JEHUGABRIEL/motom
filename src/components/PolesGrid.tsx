import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowUpRight } from "lucide-react";
import ProgressiveImage from "./ProgressiveImage";
import { poles, type PoleSlug } from "../data/poles";

type Props = {
  exclude?: PoleSlug;
};

export default function PolesGrid({ exclude }: Props) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {poles
        .filter((p) => p.slug !== exclude)
        .map((p) => {
          const tags = t(`poles.${p.slug}.tags`, { returnObjects: true }) as string[];
          return (
            <Link
              key={p.slug}
              to={p.to}
              className="group flex flex-col overflow-hidden rounded-xl border border-line bg-white transition-colors duration-300 hover:border-ink/30"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-cream">
                <ProgressiveImage
                  src={p.image.replace("w=1600", "w=800")}
                  alt={t(`poles.${p.slug}.title`)}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  wrapperClassName="h-full w-full"
                />
              </div>

              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center gap-2 text-muted">
                  <p.icon size={17} strokeWidth={1.75} />
                  <span className="text-[0.625rem] font-medium uppercase tracking-[0.16em]">
                    {tags.join(" · ")}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-[1.0625rem] font-semibold text-ink">
                  {t(`poles.${p.slug}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate">
                  {t(`poles.${p.slug}.short`)}
                </p>
                <span className="mt-auto flex items-center gap-1 pt-5 text-[0.8125rem] font-medium text-slate transition-colors group-hover:text-ink">
                  {t("poles.discover")}
                  <ArrowUpRight size={15} />
                </span>
              </div>
            </Link>
          );
        })}
    </div>
  );
}
