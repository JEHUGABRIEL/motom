type Props = {
  title: string;
  align?: "left" | "center";
  light?: boolean;
  description?: string;
  eyebrow?: string;
};

export default function SectionHeading({
  title,
  align = "left",
  light = false,
  description,
  eyebrow,
}: Props) {
  const centered = align === "center";

  return (
    <div className={centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && (
        <p
          className={`eyebrow mb-4 ${centered ? "justify-center" : ""} ${
            light ? "text-white/60" : "text-muted"
          }`}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={`font-display text-[1.75rem] font-bold leading-[1.15] tracking-tight md:text-[2.35rem] ${
          light ? "text-white" : "text-ink"
        }`}
      >
        {title}
      </h2>
      <span className={`accent-line ${centered ? "mx-auto" : ""}`} />
      {description && (
        <p
          className={`mt-5 text-[0.95rem] leading-relaxed ${
            light ? "text-white/65" : "text-slate"
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
