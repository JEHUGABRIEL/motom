import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

type CtaBandProps = {
  title: string;
  text?: string;
  label: string;
  to: string;
};

/** Bandeau d'appel à l'action sombre, commun aux pages intérieures. */
export default function CtaBand({ title, text, label, to }: CtaBandProps) {
  return (
    <section className="bg-ink py-14 md:py-16">
      <div className="container-page flex flex-col items-start justify-between gap-7 md:flex-row md:items-center">
        <div>
          <h2 className="max-w-xl font-display text-2xl font-bold text-white md:text-[1.75rem]">
            {title}
          </h2>
          {text && (
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/55">{text}</p>
          )}
        </div>
        <Link to={to} className="btn btn-gold shrink-0">
          {label} <ArrowUpRight size={16} />
        </Link>
      </div>
    </section>
  );
}
