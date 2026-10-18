import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, CheckCircle2, MessageCircle } from "lucide-react";
import SectionHeading from "../components/SectionHeading";
import PolesGrid from "../components/PolesGrid";
import { getPoleBySlug, type PoleSlug } from "../data/poles";
import { site } from "../data/site";

// Page d'un pôle de service sans catalogue (construction, transport,
// déménagement, décoration) : présentation, prestations, déroulé, devis.
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
      <section className="relative pt-40 pb-24 bg-navy overflow-hidden">
        <div className="absolute inset-0 opacity-35">
          <img src={pole.image} alt={title} className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/80 to-navy/30" />
        <div className="container-page relative z-10">
          <span className="w-16 h-16 rounded-full bg-gold flex items-center justify-center">
            <pole.icon size={28} className="text-navy" />
          </span>
          <h1 className="font-display font-bold text-white text-4xl md:text-6xl uppercase mt-6 max-w-3xl">
            {title}
          </h1>
          <p className="text-white/75 text-lg max-w-2xl mt-5">{t(`poles.${slug}.short`)}</p>
          <p className="text-gold font-semibold mt-6">{tags.join(" · ")}</p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container-page grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">
          <div>
            <SectionHeading
              title={t(`poles.${slug}.heading`)}
              description={t(`poles.${slug}.text`)}
            />
            <div className="flex flex-wrap gap-4 mt-10">
              <Link
                to={`/contact?sujet=${slug}`}
                className="bg-gold hover:bg-gold-light text-navy font-semibold px-8 py-4 rounded-full transition-colors flex items-center gap-2"
              >
                {t("poles.quote")} <ArrowRight size={18} />
              </Link>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="border-2 border-navy/15 hover:border-green hover:text-green text-navy font-semibold px-8 py-4 rounded-full transition-colors flex items-center gap-2"
              >
                <MessageCircle size={18} /> {t("poles.whatsappQuote")}
              </a>
            </div>
          </div>

          <div className="bg-cream rounded-2xl p-8 border border-navy/5">
            <h2 className="font-display font-bold text-navy text-xl mb-6">
              {t("poles.services")}
            </h2>
            <ul className="space-y-4">
              {points.map((pt) => (
                <li key={pt} className="flex items-start gap-3 text-slate">
                  <CheckCircle2 size={20} className="text-gold-dark shrink-0 mt-0.5" />
                  {pt}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="py-20 bg-navy">
        <div className="container-page">
          <SectionHeading title={t("poles.steps.title")} light />
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {steps.map((s, i) => (
              <li key={s.title} className="border-t-2 border-gold pt-6">
                <span className="font-display text-gold text-4xl font-bold">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display font-semibold text-white text-lg mt-3">
                  {s.title}
                </h3>
                <p className="text-white/60 text-sm leading-relaxed mt-2">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-20 bg-cream">
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
