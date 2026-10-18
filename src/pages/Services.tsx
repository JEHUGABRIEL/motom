import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, LayoutGrid, type LucideIcon } from "lucide-react";
import { site } from "../data/site";
import { poles } from "../data/poles";
import { usePublicServices } from "../lib/api";

// Les services seedés portent l'identifiant de leur pôle : on leur rend l'icône
// et l'ordre de l'affiche. Un service ajouté au back-office passe en fin de liste.
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
      <section className="relative pt-40 pb-24 bg-navy overflow-hidden">
        <div className="absolute inset-0 opacity-25">
          <img
            src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1920&q=80"
            alt={t("services.hero.alt")}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="container-page relative z-10 text-center">
          <h1 className="font-display font-bold text-white text-4xl md:text-5xl">
            {t("services.hero.title")}
          </h1>
          <p className="text-white/60 max-w-2xl mx-auto mt-5">
            {t("services.hero.text")}
          </p>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="container-page grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((s, i) => {
            // Sans identifiant (textes de secours), l'ordre suit celui des pôles
            const Icon: LucideIcon =
              poles[s.id ? poleRank(s.id) : i]?.icon ?? LayoutGrid;
            return (
              <div
                key={s.title}
                className="bg-cream border border-navy/5 rounded-2xl p-8 flex flex-col hover:shadow-lg transition-shadow"
              >
                <span className="w-14 h-14 rounded-xl bg-navy flex items-center justify-center mb-6">
                  <Icon size={24} className="text-gold" />
                </span>
                <h3 className="font-display text-xl font-semibold text-navy mb-3">
                  {s.title}
                </h3>
                <p className="text-sm text-slate leading-relaxed mb-5">{s.text}</p>
                <ul className="space-y-2 mt-auto">
                  {s.points.map((pt) => (
                    <li
                      key={pt}
                      className="flex items-start gap-2 text-sm text-slate"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-gold mt-2 shrink-0" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section className="py-20 bg-gold">
        <div className="container-page flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div>
            <h2 className="font-display font-bold text-navy text-3xl md:text-4xl">
              {t("services.cta.title")}
            </h2>
            <p className="text-navy/70 mt-3 max-w-xl">
              {t("services.cta.text", { phone: site.whatsapp })}
            </p>
          </div>
          <Link
            to="/contact"
            className="bg-navy text-white font-semibold px-8 py-4 rounded-full hover:bg-white hover:text-navy transition-colors shrink-0 flex items-center gap-2"
          >
            {t("common.contactUs")} <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}