import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ShieldCheck,
  TrendingUp,
  Users,
  Award,
  ArrowRight,
} from "lucide-react";
import SectionHeading from "../components/SectionHeading";
import PolesGrid from "../components/PolesGrid";
import { poles } from "../data/poles";

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
      <section className="relative pt-40 pb-24 bg-navy overflow-hidden">
        <div className="absolute inset-0 opacity-25">
          <img
            src="https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1920&q=80"
            alt={t("about.hero.alt")}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="container-page relative z-10 text-center">
          <h1 className="font-display font-bold text-white text-4xl md:text-5xl">
            {t("about.hero.title")}
          </h1>
          <p className="text-white/60 max-w-2xl mx-auto mt-5">
            {t("about.hero.text")}
          </p>
        </div>
      </section>

      {}
      <section className="py-24 bg-white">
        <div className="container-page grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <SectionHeading
              title={t("about.story.title")}
              description={t("about.story.description")}
            />
            <p className="text-slate leading-relaxed mt-6">
              {t("about.story.text")}
            </p>
            <div className="grid grid-cols-3 gap-6 mt-10">
              <div>
                <p className="font-display text-gold-dark text-3xl font-bold">{poles.length}</p>
                <p className="text-xs text-slate mt-1">
                  {t("about.story.trades")}
                </p>
              </div>
              <div>
                <p className="font-display text-gold-dark text-3xl font-bold">1</p>
                <p className="text-xs text-slate mt-1">
                  {t("about.story.single")}
                </p>
              </div>
              <div>
                <p className="font-display text-gold-dark text-3xl font-bold">PK11</p>
                <p className="text-xs text-slate mt-1">
                  {t("about.story.location")}
                </p>
              </div>
            </div>
          </div>
          <img
            src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=900&q=80"
            alt={t("about.story.teamAlt")}
            className="rounded-2xl w-full h-[460px] object-cover"
          />
        </div>
      </section>

      {}
      <section className="py-24 bg-cream">
        <div className="container-page">
          <SectionHeading
            title={t("about.values.title")}
            align="center"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-14">
            {valueKeys.map((v) => (
              <div
                key={v.title}
                className="bg-white rounded-2xl p-8 text-center border border-navy/5 hover:shadow-lg transition-shadow"
              >
                <span className="w-14 h-14 rounded-full bg-navy flex items-center justify-center mx-auto mb-5">
                  <v.icon size={22} className="text-gold" />
                </span>
                <h3 className="font-display font-semibold text-lg text-navy mb-2">
                  {t(v.title)}
                </h3>
                <p className="text-sm text-slate leading-relaxed">{t(v.text)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {}
      <section className="py-24 bg-white">
        <div className="container-page">
          <SectionHeading
            title={t("about.poles.title")}
            description={t("about.poles.description")}
          />
          <div className="mt-12">
            <PolesGrid />
          </div>
        </div>
      </section>

      <section className="py-20 bg-gold">
        <div className="container-page flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div>
            <h2 className="font-display font-bold text-navy text-3xl md:text-4xl">
              {t("about.cta.title")}
            </h2>
            <p className="text-navy/70 mt-3 max-w-xl">
              {t("about.cta.text")}
            </p>
          </div>
          <Link
            to="/contact"
            className="bg-navy text-white font-semibold px-8 py-4 rounded-full hover:bg-white hover:text-navy transition-colors shrink-0 flex items-center gap-2"
          >
            {t("common.bookAppointment")} <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
