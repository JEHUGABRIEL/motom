import { useTranslation } from "react-i18next";
import { ShieldCheck, TrendingUp, Users, Award, Quote } from "lucide-react";
import SectionHeading from "../components/SectionHeading";
import PolesGrid from "../components/PolesGrid";
import PageHero from "../components/PageHero";
import CtaBand from "../components/CtaBand";
import { poles } from "../data/poles";
import { site } from "../data/site";

const valueKeys = [
  { icon: ShieldCheck, title: "about.values.items.0.title", text: "about.values.items.0.text" },
  { icon: Award, title: "about.values.items.1.title", text: "about.values.items.1.text" },
  { icon: TrendingUp, title: "about.values.items.2.title", text: "about.values.items.2.text" },
  { icon: Users, title: "about.values.items.3.title", text: "about.values.items.3.text" },
];

export default function About() {
  const { t } = useTranslation();

  return (
    <div>
      <PageHero
        title={t("about.hero.title")}
        description={t("about.hero.text")}
        crumb={t("navbar.about")}
        image="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&q=80"
        imageAlt={t("about.story.teamAlt")}
      />

      <section className="py-16 md:py-20">
        <div className="container-page grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading
              title={t("about.story.title")}
              description={t("about.story.description")}
            />
            <p className="mt-6 max-w-xl text-[0.9375rem] leading-relaxed text-slate">
              {t("about.story.text")}
            </p>

            <div className="mt-10 grid grid-cols-3 divide-x divide-line border-y border-line">
              <div className="py-6 pr-4">
                <p className="font-display text-2xl font-bold text-ink">{poles.length}</p>
                <p className="mt-1 text-[0.6875rem] leading-snug text-muted">
                  {t("about.story.trades")}
                </p>
              </div>
              <div className="px-4 py-6">
                <p className="font-display text-2xl font-bold text-ink">1</p>
                <p className="mt-1 text-[0.6875rem] leading-snug text-muted">
                  {t("about.story.single")}
                </p>
              </div>
              <div className="py-6 pl-4">
                <p className="font-display text-2xl font-bold text-ink">PK11</p>
                <p className="mt-1 text-[0.6875rem] leading-snug text-muted">
                  {t("about.story.location")}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl bg-ink p-8 text-white md:p-10">
            <Quote size={26} className="text-gold" />
            <p className="mt-8 font-display text-[1.35rem] font-medium leading-snug text-white md:text-[1.55rem]">
              « {site.signature} »
            </p>
            <div className="mt-8 border-t border-white/10 pt-5">
              <p className="text-[0.6875rem] uppercase tracking-[0.18em] text-gold">
                {site.name}
              </p>
              <p className="mt-1 text-[0.75rem] text-white/50">{site.tagline}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-sand py-16 md:py-20">
        <div className="container-page">
          <SectionHeading title={t("about.values.title")} />
          <div className="mt-10 grid grid-cols-1 gap-x-12 gap-y-0 md:grid-cols-2">
            {valueKeys.map((v) => (
              <div key={v.title} className="flex gap-5 border-b border-line py-7">
                <v.icon size={19} strokeWidth={1.75} className="mt-0.5 shrink-0 text-gold-dark" />
                <div>
                  <h3 className="font-display text-[1rem] font-semibold text-ink">
                    {t(v.title)}
                  </h3>
                  <p className="mt-2 max-w-md text-[0.875rem] leading-relaxed text-slate">
                    {t(v.text)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container-page">
          <SectionHeading
            title={t("about.poles.title")}
            description={t("about.poles.description")}
          />
          <div className="mt-10">
            <PolesGrid />
          </div>
        </div>
      </section>

      <CtaBand
        title={t("about.cta.title")}
        text={t("about.cta.text")}
        label={t("common.bookAppointment")}
        to="/contact"
      />
    </div>
  );
}
