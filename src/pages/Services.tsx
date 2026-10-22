import { useTranslation } from "react-i18next";
import { LayoutGrid, type LucideIcon } from "lucide-react";
import PageHero from "../components/PageHero";
import CtaBand from "../components/CtaBand";
import { site } from "../data/site";
import { poles } from "../data/poles";
import { usePublicServices } from "../lib/api";

const poleRank = (id?: string) => {
  const i = poles.findIndex((p) => p.slug === id);
  return i === -1 ? poles.length : i;
};

export default function Services() {
  const { t } = useTranslation();
  const { data: apiServices, isError } = usePublicServices();

  const services = (isError || !apiServices || apiServices.length === 0
    ? (t("services.items", { returnObjects: true }) as {
        title: string;
        text: string;
        points: string[];
      }[])
    : [...apiServices]
        .sort((a, b) => poleRank(a.id) - poleRank(b.id))
        .map((s) => ({ id: s.id, title: s.title, text: s.text, points: s.points }))
  ) as { id?: string; title: string; text: string; points: string[] }[];

  return (
    <div>
      <PageHero
        title={t("services.hero.title")}
        description={t("services.hero.text")}
        crumb={t("navbar.services")}
        image="https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80"
        imageAlt={t("services.hero.title")}
      />

      <section className="py-16 md:py-20">
        <div className="container-page grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => {
            const Icon: LucideIcon = poles[s.id ? poleRank(s.id) : i]?.icon ?? LayoutGrid;
            return (
              <div
                key={s.title}
                className="flex flex-col rounded-xl border border-line bg-white p-7"
              >
                <Icon size={20} strokeWidth={1.75} className="text-gold-dark" />
                <h2 className="mt-5 font-display text-[1.0625rem] font-semibold text-ink">
                  {s.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate">{s.text}</p>
                <ul className="mt-5 space-y-2 border-t border-line pt-5">
                  {s.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2 text-[0.8125rem] text-slate">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <CtaBand
        title={t("services.cta.title")}
        text={t("services.cta.text", { phone: site.whatsapp })}
        label={t("common.contactUs")}
        to="/contact"
      />
    </div>
  );
}
