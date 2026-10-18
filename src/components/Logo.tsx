import { site } from "../data/site";

type LogoProps = {
  variant?: "dark" | "light";
  className?: string;
  showTagline?: boolean;
};

export default function Logo({
  variant = "dark",
  className = "",
  showTagline = true,
}: LogoProps) {
  const dark = variant === "dark";
  const taglineColor = dark ? "text-slate" : "text-white/60";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Sur fond sombre, le noir du logo passe en blanc */}
      <img
        src={dark ? "/logo.svg" : "/logo-light.svg"}
        alt={`Logo ${site.shortName}`}
        className="h-10 w-auto shrink-0"
      />
      <div className="leading-none">
        <div
          className={`font-display font-extrabold tracking-tight text-lg md:text-xl ${
            dark ? "text-navy" : "text-white"
          }`}
        >
          MOTOM
        </div>
        <div
          className={`text-[9px] font-semibold uppercase tracking-[0.22em] mt-1 ${
            dark ? "text-gold-dark" : "text-gold"
          }`}
        >
          Agence immobilière
        </div>
        {showTagline && (
          <div className={`text-[10px] tracking-[0.04em] mt-1.5 ${taglineColor}`}>
            {site.tagline}
          </div>
        )}
      </div>
    </div>
  );
}
