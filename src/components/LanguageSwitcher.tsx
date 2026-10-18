import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import { setLanguage } from "../i18n";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith("en") ? "en" : "fr";

  return (
    <div
      className="flex items-center gap-0.5 rounded-full border border-navy/10 bg-white p-0.5"
      role="group"
      aria-label="Language"
    >
      <Languages size={14} className="text-slate/50 ml-1.5 mr-0.5" />
      {(["fr", "en"] as const).map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => setLanguage(lang)}
          aria-pressed={current === lang}
          className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full transition-all duration-200 ${
            current === lang
              ? "bg-gold text-navy shadow-sm"
              : "text-slate/60 hover:text-navy"
          }`}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}