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
  gold: "bg-gold text-ink",
  navy: "bg-white/95 text-ink",
  green: "bg-white/95 text-green-dark",
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
      className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 font-medium ${
        size === "sm" ? "text-[0.625rem]" : "text-[0.6875rem]"
      } ${variantClasses[variant]} ${className}`}
    >
      {Icon && <Icon size={size === "sm" ? 11 : 12} strokeWidth={2} />}
      {children}
    </span>
  );
}
