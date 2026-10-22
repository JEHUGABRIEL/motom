import { Loader2 } from "lucide-react";

export default function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6">
      <img src="/logo.svg" alt="" className="h-16 w-auto animate-fade-up" />
      <h1 className="mt-5 font-display text-lg font-bold tracking-[0.08em] text-ink animate-fade-up">
        MOTOM
      </h1>
      <p className="mt-1 text-[0.625rem] font-medium uppercase tracking-[0.22em] text-muted">
        Agence immobilière
      </p>
      <Loader2 size={18} className="mt-6 animate-spin text-gold-dark" />
    </div>
  );
}
