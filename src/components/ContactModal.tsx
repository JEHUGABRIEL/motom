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

  const subject = item
    ? t("common.requestAbout", { item: item.title })
    : t("contact.form.initialSubject");

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

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/70 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-line bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-5">
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">
              {sent ? t("common.requestSent") : t("common.askInfo")}
            </h3>
            {item && !sent && (
              <p className="mt-0.5 max-w-[260px] truncate text-xs text-muted">{item.title}</p>
            )}
          </div>
          <button
            onClick={close}
            className="flex h-8 w-8 items-center justify-center rounded text-muted transition-colors hover:bg-cream hover:text-ink"
            aria-label={t("common.close")}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {sent ? (
            <div className="py-4 text-center">
              <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cream">
                <CheckCircle2 size={24} className="text-gold-dark" />
              </span>
              <p className="text-sm leading-relaxed text-slate">
                {t("common.requestSentText", { item: item?.title ?? "" })}
              </p>
              <button onClick={close} className="btn btn-dark mt-6">
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
                  className="field"
                />
                <input
                  required
                  type="tel"
                  placeholder={t("common.yourPhone")}
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="field"
                />
              </div>
              <input
                type="email"
                placeholder={t("common.yourEmail")}
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="field"
              />
              <textarea
                required
                rows={4}
                placeholder={t("common.yourMessage")}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                className="field resize-none"
              />
              {error && (
                <p className="flex items-center gap-2 rounded bg-red-50 px-3 py-2 text-xs text-red-700">
                  <AlertCircle size={14} /> {t("contact.form.error")}
                </p>
              )}
              <button
                type="submit"
                disabled={sending}
                className="btn btn-dark w-full disabled:opacity-50"
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
