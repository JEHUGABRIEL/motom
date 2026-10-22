import type { ReactNode } from "react";

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
}: FilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-4 py-1.5 text-[0.8125rem] transition-colors ${
        active
          ? "border-ink bg-ink font-medium text-white"
          : "border-line bg-white text-slate hover:border-ink/30 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
