import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  MessageCircle,
} from "lucide-react";
import SectionHeading from "../components/SectionHeading";
import { site } from "../data/site";
import { poles } from "../data/poles";

export default function Contact() {
  const { t } = useTranslation();
  // /contact?sujet=<pôle> : objet présélectionné depuis la page d'un pôle
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
      <section className="relative pt-40 pb-24 bg-navy overflow-hidden">
        <div className="absolute inset-0 opacity-25">
          <img
            src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1920&q=80"
            alt={t("contact.hero.alt")}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="container-page relative z-10 text-center">
          <h1 className="font-display font-bold text-white text-4xl md:text-5xl">
            {t("contact.hero.title")}
          </h1>
          <p className="text-white/60 max-w-xl mx-auto mt-5">
            {t("contact.hero.text")}
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container-page grid grid-cols-1 md:grid-cols-3 gap-6 -mt-32 mb-8 relative z-10">
          <div className="bg-white rounded-2xl p-7 shadow-xl border border-navy/5">
            <span className="w-12 h-12 rounded-xl bg-navy flex items-center justify-center mb-5">
              <Phone size={20} className="text-gold" />
            </span>
            <h3 className="font-semibold text-navy mb-1">{t("contact.phone")}</h3>
            {site.phones.map((p) => (
              <a key={p.href} href={p.href} className="block text-sm text-slate hover:text-gold-dark transition-colors">
                {p.label}
              </a>
            ))}
            <p className="flex items-center gap-1.5 text-sm text-slate mt-1">
              <MessageCircle size={13} className="text-green" />
              WhatsApp {site.whatsapp}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-7 shadow-xl border border-navy/5">
            <span className="w-12 h-12 rounded-xl bg-navy flex items-center justify-center mb-5">
              {site.email ? (
                <Mail size={20} className="text-gold" />
              ) : (
                <MapPin size={20} className="text-gold" />
              )}
            </span>
            {site.email ? (
              <>
                <h3 className="font-semibold text-navy mb-1">{t("contact.email")}</h3>
                <a href={site.emailHref} className="text-sm text-slate hover:text-gold-dark transition-colors">
                  {site.email}
                </a>
              </>
            ) : (
              <h3 className="font-semibold text-navy mb-1">{t("contact.address")}</h3>
            )}
            <p className="text-sm text-slate mt-1">{site.address}</p>
          </div>
          <div className="bg-white rounded-2xl p-7 shadow-xl border border-navy/5">
            <span className="w-12 h-12 rounded-xl bg-navy flex items-center justify-center mb-5">
              <Clock size={20} className="text-gold" />
            </span>
            <h3 className="font-semibold text-navy mb-1">{t("contact.hours")}</h3>
            {site.hours.length > 0 ? (
              site.hours.map((h) => (
                <p key={h.days} className="text-sm text-slate">
                  {h.days} : {h.time}
                </p>
              ))
            ) : (
              <p className="text-sm text-slate">{t("contact.hoursFallback")}</p>
            )}
          </div>
        </div>
      </section>

      {}
      <section className="pb-8 bg-white">
        <div className="container-page">
          <div className="rounded-2xl overflow-hidden shadow-sm border border-navy/5 aspect-[16/7]">
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

      <section className="pb-24 bg-white">
        <div className="container-page grid grid-cols-1 lg:grid-cols-2 gap-14">
          <div>
            <SectionHeading
              title={t("contact.form.title")}
              description={t("contact.form.description")}
            />

            {sent ? (
              <div className="mt-8 bg-cream border border-gold/30 rounded-2xl p-8 flex items-start gap-4">
                <CheckCircle2 className="text-gold-dark shrink-0" size={26} />
                <div>
                  <h3 className="font-semibold text-navy">{t("contact.form.sentTitle")}</h3>
                  <p className="text-sm text-slate mt-1">
                    {t("contact.form.sentText")}
                  </p>
                </div>
              </div>
            ) : (
              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-sm font-medium text-navy mb-1.5 block">
                      {t("common.fullName")}
                    </label>
                    <input
                      required
                      type="text"
                      placeholder={t("common.yourName")}
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-navy/10 text-sm focus:outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-navy mb-1.5 block">
                      {t("common.phone")}
                    </label>
                    <input
                      required
                      type="tel"
                      placeholder="+236 ..."
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-navy/10 text-sm focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-navy mb-1.5 block">
                    {t("common.email")}
                  </label>
                  <input
                    type="email"
                    required
                    placeholder={t("contact.form.emailPlaceholder")}
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-navy/10 text-sm focus:outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-navy mb-1.5 block">
                    {t("contact.form.subject")}
                  </label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-navy/10 text-sm focus:outline-none focus:border-gold text-slate"
                  >
                    {subjects.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-navy mb-1.5 block">
                    {t("common.message")}
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder={t("common.placeholder")}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-navy/10 text-sm focus:outline-none focus:border-gold resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="bg-gold hover:bg-gold-light text-navy font-semibold px-8 py-4 rounded-full transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {sending ? t("common.sending") : t("common.sendMessage")} <Send size={16} />
                </button>
              </form>
            )}
          </div>

          <div>
            <h3 className="font-display font-bold text-xl text-navy mb-6">
              {t("contact.offices")}
            </h3>
            <div className="bg-navy rounded-2xl p-7 text-white">
              <h4 className="font-semibold text-gold mb-4">{site.legalName}</h4>
              <p className="flex items-start gap-2 text-sm text-white/80 mb-3">
                <MapPin size={15} className="text-gold shrink-0 mt-0.5" />
                {site.address}
              </p>
              {site.phones.map((p) => (
                <a key={p.href} href={p.href} className="flex items-center gap-2 text-sm text-white/80 hover:text-gold mb-2">
                  <Phone size={15} className="text-gold shrink-0" />
                  {p.label}
                </a>
              ))}
              <a
                href={site.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-white/80 hover:text-gold"
              >
                <MessageCircle size={15} className="text-green shrink-0" />
                WhatsApp {site.whatsapp}
              </a>
              <p className="text-sm font-semibold text-gold mt-6">{site.signature}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}