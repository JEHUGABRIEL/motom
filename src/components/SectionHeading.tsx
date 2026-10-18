type Props = {
  title: string;
  align?: "left" | "center";
  light?: boolean;
  description?: string;
};

export default function SectionHeading({
  title,
  align = "left",
  light = false,
  description,
}: Props) {
  return (
    <div
      className={`max-w-2xl ${align === "center" ? "mx-auto text-center" : ""}`}
    >
      <h2
        className={`font-display font-bold leading-tight text-3xl md:text-4xl ${
          light ? "text-white" : "text-navy"
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-4 text-base leading-relaxed ${
            light ? "text-white/70" : "text-slate"
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
