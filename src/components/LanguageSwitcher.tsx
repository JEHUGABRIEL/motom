import { useTranslation } from "react-i18next";
import { setLanguage } from "../i18n";

const languages = [
  { code: "fr", label: "FR", name: "Français" },
  { code: "en", label: "EN", name: "English" },
] as const;

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith("en") ? "en" : "fr";

  return (
    <div
      role="group"
      aria-label="Langue / Language"
      className="inline-flex items-center rounded-full border border-line bg-white p-0.5"
    >
      {languages.map((lang) => {
        const active = current === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLanguage(lang.code)}
            aria-pressed={active}
            aria-label={lang.name}
            title={lang.name}
            className={`rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] transition-colors duration-200 ${
              active
                ? "bg-ink text-white"
                : "text-muted hover:bg-cream hover:text-ink"
            }`}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
}
