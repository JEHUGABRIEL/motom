import { useTranslation } from "react-i18next";
import PageHero from "../components/PageHero";

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
      <PageHero
        title={heroTitle}
        description={heroText}
        crumb={heroTitle}
      />

      <section className="py-16 md:py-20">
        <div className="container-page max-w-3xl">
          <div>
            {sections.map((s, i) => (
              <div key={i} className="border-b border-line py-8 first:pt-0 last:border-0">
                <h2 className="font-display text-lg font-semibold text-ink">{s.title}</h2>
                <div className="mt-3 space-y-3">
                  {s.paragraphs.map((p, j) => (
                    <p key={j} className="text-[0.9375rem] leading-relaxed text-slate">
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
