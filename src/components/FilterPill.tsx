import type { ReactNode } from "react";
import { Check } from "lucide-react";

type FilterPillProps = {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  tone?: "navy" | "gold";
};

export default function FilterPill({
  active,
  onClick,
  children,
  tone = "navy",
}: FilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ${
        active
          ? tone === "gold"
            ? "border-gold bg-gold text-navy shadow-md shadow-gold/25"
            : "border-navy bg-navy text-white shadow-md shadow-navy/25"
          : "border-navy/5 bg-cream text-slate hover:border-gold/40 hover:bg-white hover:text-navy"
      }`}
    >
      {active && <Check size={14} strokeWidth={3} />}
      {children}
    </button>
  );
}