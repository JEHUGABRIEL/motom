import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, MessageCircle } from "lucide-react";
import SectionHeading from "../components/SectionHeading";
import PageHero from "../components/PageHero";
import { site } from "../data/site";
import { poles } from "../data/poles";

export default function Contact() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const requested = poles.find((p) => p.slug === searchParams.get("sujet"));
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: requested
      ? t(`poles.${requested.slug}.subject`)
      : t("contact.form.initialSubject"),
    message: "",
  });

  const subjects = t("contact.form.subjects", { returnObjects: true }) as string[];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSent(true);
    } catch {
      alert(t("contact.form.error"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHero
        title={t("contact.hero.title")}
        description={t("contact.hero.text")}
        crumb={t("common.contactUs")}
        image="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80"
        imageAlt={t("contact.offices")}
      />

      <section className="border-b border-line">
        <div className="container-page grid grid-cols-1 divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0">
          <div className="py-8 md:pr-8">
            <Phone size={18} strokeWidth={1.75} className="text-gold-dark" />
            <h2 className="mt-4 text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-muted">
              {t("contact.phone")}
            </h2>
            <div className="mt-2 space-y-1">
              {site.phones.map((p) => (
                <a
                  key={p.href}
                  href={p.href}
                  className="block text-sm text-ink transition-colors hover:text-gold-dark"
                >
                  {p.label}
                </a>
              ))}
              <p className="flex items-center gap-1.5 text-sm text-slate">
                <MessageCircle size={13} className="text-green" />
                WhatsApp {site.whatsapp}
              </p>
            </div>
          </div>

          <div className="py-8 md:px-8">
            {site.email ? (
              <Mail size={18} strokeWidth={1.75} className="text-gold-dark" />
            ) : (
              <MapPin size={18} strokeWidth={1.75} className="text-gold-dark" />
            )}
            <h2 className="mt-4 text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-muted">
              {site.email ? t("contact.email") : t("contact.address")}
            </h2>
            <div className="mt-2 space-y-1">
              {site.email && (
                <a
                  href={site.emailHref}
                  className="block text-sm text-ink transition-colors hover:text-gold-dark"
                >
                  {site.email}
                </a>
              )}
              <p className="text-sm leading-relaxed text-slate">{site.address}</p>
            </div>
          </div>

          <div className="py-8 md:pl-8">
            <Clock size={18} strokeWidth={1.75} className="text-gold-dark" />
            <h2 className="mt-4 text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-muted">
              {t("contact.hours")}
            </h2>
            <div className="mt-2 space-y-1">
              {site.hours.length > 0 ? (
                site.hours.map((h) => (
                  <p key={h.days} className="text-sm text-slate">
                    {h.days} : {h.time}
                  </p>
                ))
              ) : (
                <p className="text-sm leading-relaxed text-slate">{t("contact.hoursFallback")}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container-page">
          <div className="aspect-[16/7] overflow-hidden rounded-xl border border-line">
            <iframe
              title={t("contact.mapTitle")}
              src={site.mapsEmbed}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="container-page grid grid-cols-1 gap-14 lg:grid-cols-2">
          <div>
            <SectionHeading
              title={t("contact.form.title")}
              description={t("contact.form.description")}
            />

            {sent ? (
              <div className="mt-8 flex items-start gap-4 border-l-2 border-gold bg-white px-6 py-6">
                <CheckCircle2 size={22} className="shrink-0 text-gold-dark" />
                <div>
                  <h3 className="text-sm font-medium text-ink">{t("contact.form.sentTitle")}</h3>
                  <p className="mt-1 text-sm text-slate">{t("contact.form.sentText")}</p>
                </div>
              </div>
            ) : (
              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[0.75rem] font-medium uppercase tracking-[0.1em] text-muted">
                      {t("common.fullName")}
                    </label>
                    <input
                      required
                      type="text"
                      placeholder={t("common.yourName")}
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="field"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[0.75rem] font-medium uppercase tracking-[0.1em] text-muted">
                      {t("common.phone")}
                    </label>
                    <input
                      required
                      type="tel"
                      placeholder="+236 ..."
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      className="field"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[0.75rem] font-medium uppercase tracking-[0.1em] text-muted">
                    {t("common.email")}
                  </label>
                  <input
                    type="email"
                    required
                    placeholder={t("contact.form.emailPlaceholder")}
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="field"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[0.75rem] font-medium uppercase tracking-[0.1em] text-muted">
                    {t("contact.form.subject")}
                  </label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    className="field select-filter pr-10 text-slate"
                  >
                    {subjects.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[0.75rem] font-medium uppercase tracking-[0.1em] text-muted">
                    {t("common.message")}
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder={t("common.placeholder")}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    className="field resize-none"
                  />
                </div>

                <button type="submit" disabled={sending} className="btn btn-dark disabled:opacity-50">
                  {sending ? t("common.sending") : t("common.sendMessage")} <Send size={15} />
                </button>
              </form>
            )}
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold text-ink">{t("contact.offices")}</h2>
            <div className="mt-6 rounded-xl bg-ink p-7 text-white">
              <h3 className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-gold">
                {site.legalName}
              </h3>
              <p className="mt-4 flex items-start gap-2.5 text-sm leading-relaxed text-white/70">
                <MapPin size={15} className="mt-0.5 shrink-0 text-white/40" />
                {site.address}
              </p>
              <div className="mt-4 space-y-2">
                {site.phones.map((p) => (
                  <a
                    key={p.href}
                    href={p.href}
                    className="flex items-center gap-2.5 text-sm text-white/70 transition-colors hover:text-white"
                  >
                    <Phone size={15} className="shrink-0 text-white/40" />
                    {p.label}
                  </a>
                ))}
                <a
                  href={site.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-sm text-white/70 transition-colors hover:text-white"
                >
                  <MessageCircle size={15} className="shrink-0 text-gold" />
                  WhatsApp {site.whatsapp}
                </a>
              </div>
              <p className="mt-7 border-t border-white/10 pt-5 text-[0.8125rem] font-medium text-gold">
                {site.signature}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
