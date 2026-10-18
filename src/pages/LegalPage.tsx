import { useTranslation } from "react-i18next";
import { FileText, ShieldCheck } from "lucide-react";

export default function LegalPage({ kind }: { kind: "privacy" | "legal" }) {
  const { t } = useTranslation();
  const key = kind === "privacy" ? "privacy" : "legal";
  const heroTitle = t(`${key}.hero.title`);
  const heroText = t(`${key}.hero.text`);
  const sections = t(`${key}.sections`, { returnObjects: true }) as {
    title: string;
    paragraphs: string[];
  }[];

  return (
    <div>
      <section className="relative pt-40 pb-24 bg-navy overflow-hidden">
        <div className="absolute inset-0 opacity-25">
          <img
            src="https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1920&q=80"
            alt={heroTitle}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="container-page relative z-10 text-center">
          <span className="inline-flex items-center gap-2 text-gold text-xs font-semibold tracking-[0.2em] uppercase mb-4">
            {kind === "privacy" ? <ShieldCheck size={16} /> : <FileText size={16} />}
            {heroTitle}
          </span>
          <h1 className="font-display font-bold text-white text-4xl md:text-5xl">
            {heroTitle}
          </h1>
          <p className="text-white/60 max-w-2xl mx-auto mt-5">{heroText}</p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container-page max-w-3xl">
          <div className="space-y-10">
            {sections.map((s, i) => (
              <div key={i}>
                <h2 className="font-display font-bold text-2xl text-navy mb-4">
                  {s.title}
                </h2>
                <div className="space-y-3">
                  {s.paragraphs.map((p, j) => (
                    <p key={j} className="text-slate leading-relaxed text-sm">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}