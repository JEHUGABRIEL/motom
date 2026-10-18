import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Send, CheckCircle2, AlertCircle } from "lucide-react";

type ContactModalProps = {
  open: boolean;
  onClose: () => void;
  
  item?: { kind: "property" | "vehicle"; title: string };
};


export default function ContactModal({ open, onClose, item }: ContactModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);

  if (!open) return null;

  const subject = item ? t("common.requestAbout", { item: item.title }) : t("contact.form.initialSubject");

  const reset = () => {
    setForm({ name: "", phone: "", email: "", message: "" });
    setSent(false);
    setError(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(false);
    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          subject,
          message: form.message,
        }),
      });
      setSent(true);
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  };

  const inputCls =
    "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all";

  return (
    <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl overflow-hidden animate-fade-up">
        {}
        <div className="flex items-center justify-between gap-3 px-6 pt-6">
          <div>
            <h3 className="font-display font-semibold text-white text-lg">
              {sent ? t("common.requestSent") : t("common.askInfo")}
            </h3>
            {item && !sent && (
              <p className="text-xs text-gold mt-0.5 truncate max-w-[260px]">{item.title}</p>
            )}
          </div>
          <button
            onClick={close}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={t("common.close")}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {sent ? (
            <div className="text-center py-4">
              <span className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={26} className="text-emerald-400" />
              </span>
              <p className="text-sm text-white/70">
                {t("common.requestSentText", { item: item?.title ?? "" })}
              </p>
              <button
                onClick={close}
                className="mt-6 px-6 py-2.5 rounded-xl bg-gold text-navy text-sm font-semibold hover:bg-gold-light transition-colors"
              >
                {t("common.close")}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  type="text"
                  placeholder={t("common.yourName")}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className={inputCls}
                />
                <input
                  required
                  type="tel"
                  placeholder={t("common.yourPhone")}
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <input
                type="email"
                placeholder={t("common.yourEmail")}
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className={inputCls}
              />
              <textarea
                required
                rows={4}
                placeholder={t("common.yourMessage")}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                className={`${inputCls} resize-none`}
              />
              {error && (
                <p className="flex items-center gap-2 text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
                  <AlertCircle size={14} /> {t("contact.form.error")}
                </p>
              )}
              <button
                type="submit"
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 bg-gold hover:bg-gold-light text-navy font-semibold py-3 rounded-xl transition-all disabled:opacity-50"
              >
                {sending ? t("common.sending") : t("common.sendRequest")} <Send size={15} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}