import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, Check, MessageCircle } from "lucide-react";
import SectionHeading from "../components/SectionHeading";
import PolesGrid from "../components/PolesGrid";
import PageHero from "../components/PageHero";
import { getPoleBySlug, type PoleSlug } from "../data/poles";
import { site } from "../data/site";

export default function PolePage({ slug }: { slug: PoleSlug }) {
  const { t } = useTranslation();
  const pole = getPoleBySlug(slug);
  const title = t(`poles.${slug}.title`);
  const points = t(`poles.${slug}.points`, { returnObjects: true }) as string[];
  const tags = t(`poles.${slug}.tags`, { returnObjects: true }) as string[];
  const steps = t("poles.steps.items", { returnObjects: true }) as {
    title: string;
    text: string;
  }[];
  const whatsappHref = `${site.whatsappHref}?text=${encodeURIComponent(
    t("poles.whatsappMessage", { pole: title }),
  )}`;

  return (
    <div>
      <PageHero
        eyebrow={tags.join(" · ")}
        title={title}
        description={t(`poles.${slug}.short`)}
        crumb={title}
        image={pole.image}
        imageAlt={title}
      />

      <section className="py-16 md:py-20">
        <div className="container-page grid grid-cols-1 gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <SectionHeading
              title={t(`poles.${slug}.heading`)}
              description={t(`poles.${slug}.text`)}
            />

            <div className="mt-9 flex flex-wrap gap-3">
              <Link to={`/contact?sujet=${slug}`} className="btn btn-dark">
                {t("poles.quote")} <ArrowUpRight size={15} />
              </Link>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
              >
                <MessageCircle size={15} /> {t("poles.whatsappQuote")}
              </a>
            </div>
          </div>

          <ul className="grid grid-cols-1 gap-x-10 border-t border-line self-start sm:grid-cols-2">
            {points.map((pt) => (
              <li
                key={pt}
                className="flex items-start gap-3 border-b border-line py-4 text-[0.875rem] text-slate"
              >
                <Check size={15} className="mt-0.5 shrink-0 text-gold-dark" />
                {pt}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-ink py-16 md:py-20">
        <div className="container-page">
          <SectionHeading title={t("poles.steps.title")} light />
          <ol className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="border-t border-white/15 pt-6">
                <span className="font-display text-[0.8125rem] font-semibold tracking-[0.16em] text-gold">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-display text-[1.0625rem] font-semibold text-white">
                  {s.title}
                </h3>
                <p className="mt-2 text-[0.8125rem] leading-relaxed text-white/55">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-sand py-16 md:py-20">
        <div className="container-page">
          <SectionHeading title={t("poles.others")} />
          <div className="mt-10">
            <PolesGrid exclude={slug} />
          </div>
        </div>
      </section>
    </div>
  );
}
