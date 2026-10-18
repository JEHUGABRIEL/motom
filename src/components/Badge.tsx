import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type BadgeProps = {
  children: ReactNode;
  variant?: "gold" | "navy" | "green";
  size?: "sm" | "md";
  icon?: LucideIcon;
  className?: string;
};

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  gold: "bg-gold text-navy shadow-sm shadow-gold/30",
  navy: "bg-navy/80 backdrop-blur-sm text-white border border-white/15",
  green: "bg-green text-white shadow-sm shadow-green/30",
};

export default function Badge({
  children,
  variant = "gold",
  size = "md",
  icon: Icon,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold uppercase tracking-wide ${
        size === "sm" ? "text-[10px] px-2.5 py-1" : "text-xs px-3 py-1.5"
      } ${variantClasses[variant]} ${className}`}
    >
      {Icon && <Icon size={size === "sm" ? 11 : 13} strokeWidth={2.5} />}
      {children}
    </span>
  );
}