import { Loader2 } from "lucide-react";

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center p-6">
      <img
        src="/logo-light.svg"
        alt=""
        className="w-20 h-20 animate-fade-up"
      />
      <h1 className="font-display font-extrabold text-white text-2xl mt-6 tracking-wide animate-fade-up">
        MOTOM
      </h1>
      <p className="text-gold text-[10px] font-semibold uppercase tracking-[0.25em] mt-1">
        Agence immobilière
      </p>
      <Loader2 size={22} className="text-gold mt-6 animate-spin" />
    </div>
  );
}
