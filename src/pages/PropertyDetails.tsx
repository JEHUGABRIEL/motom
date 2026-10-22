import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  MapPin,
  BedDouble,
  Bath,
  Ruler,
  CheckCircle2,
  Phone,
  Mail,
  MessageCircle,
  ArrowLeft,
  ArrowUpRight,
  Megaphone,
} from "lucide-react";
import { formatPrice } from "../data/properties";
import { useProperty, useProperties } from "../lib/api";
import { formatPromoEnd, isPromoExpired } from "../lib/promo";
import { site } from "../data/site";
import PropertyCard from "../components/PropertyCard";
import Badge from "../components/Badge";
import PromoCountdownChip from "../components/PromoCountdownChip";

export default function PropertyDetails() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const { data: property } = useProperty(id);
  const { data: properties = [] } = useProperties();
  const [activeImage, setActiveImage] = useState(0);

  const [contactForm, setContactForm] = useState({ name: "", phone: "", message: "" });
  const [contactSending, setContactSending] = useState(false);
  const [contactSent, setContactSent] = useState(false);

  if (!property) {
    return (
      <div className="container-page pb-24 pt-40 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">
          {t("common.propertyNotFound")}
        </h1>
        <p className="mt-3 text-sm text-slate">{t("common.propertyNotFoundText")}</p>
        <Link to="/biens-a-vendre" className="btn btn-dark mt-8">
          <ArrowLeft size={15} /> {t("common.backToProperties")}
        </Link>
      </div>
    );
  }

  const whatsappLink = `${site.whatsappHref}?text=${encodeURIComponent(
    `Bonjour ${site.shortName}, je suis intéressé(e) par le bien « ${property.title} ».`,
  )}`;

  const similar = properties
    .filter((p) => p.id !== property.id && p.category === property.category)
    .slice(0, 3);

  const submitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSending(true);
    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactForm.name,
          phone: contactForm.phone,
          subject: t("common.requestAbout", { item: property.title }),
          message: contactForm.message,
        }),
      });
      setContactSent(true);
    } catch {
      alert(t("contact.form.error"));
    } finally {
      setContactSending(false);
    }
  };

  return (
    <div>
      <section className="border-b border-line pb-10 pt-28 md:pt-32">
        <div className="container-page">
          <Link
            to="/biens-a-vendre"
            className="mb-7 inline-flex items-center gap-1.5 text-[0.75rem] text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft size={13} /> {t("common.backToProperties")}
          </Link>

          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="eyebrow">
                  {property.type} · {property.category}
                </p>
                {property.promo && (
                  <Badge variant="gold" icon={Megaphone}>
                    {property.promoEndsAt && !isPromoExpired(property.promoEndsAt)
                      ? t("promo.until", {
                          date: formatPromoEnd(property.promoEndsAt, i18n.language),
                        })
                      : t("promo.title")}
                  </Badge>
                )}
                {property.promo && <PromoCountdownChip promoEndsAt={property.promoEndsAt} />}
              </div>

              <h1 className="mt-4 max-w-3xl font-display text-[1.85rem] font-bold leading-tight text-ink md:text-[2.5rem]">
                {property.title}
              </h1>
              <p className="mt-3 flex items-center gap-1.5 text-sm text-slate">
                <MapPin size={14} className="text-muted" />
                {property.neighborhood}, {property.city} — {t("common.republicCentralAfrican")}
              </p>
            </div>

            <div className="shrink-0 text-left md:text-right">
              <p className="text-[0.6875rem] uppercase tracking-[0.16em] text-muted">
                {t("common.price")}
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-ink md:text-[1.75rem]">
                {formatPrice(property.price, property.priceUnit)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="container-page">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
            <div className="aspect-[16/10] overflow-hidden rounded-xl bg-cream">
              <img
                src={property.gallery[activeImage]}
                alt={property.title}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="grid grid-cols-3 gap-3 lg:grid-cols-2">
              {property.gallery.map((src, i) => (
                <button
                  key={src}
                  onClick={() => setActiveImage(i)}
                  className={`aspect-[4/3] overflow-hidden rounded-lg border transition-colors ${
                    activeImage === i ? "border-ink" : "border-line hover:border-ink/30"
                  }`}
                >
                  <img
                    src={src}
                    alt={t("common.view", { number: i + 1 })}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="container-page grid grid-cols-1 gap-12 lg:grid-cols-[2fr_1fr]">
          <div>
            <div className="grid grid-cols-3 divide-x divide-line border-y border-line">
              {property.bedrooms > 0 && (
                <div className="px-4 py-6">
                  <BedDouble size={18} className="text-muted" />
                  <p className="mt-2 font-display text-lg font-semibold text-ink">
                    {property.bedrooms}
                  </p>
                  <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-muted">
                    {t("propertyDetails.bedrooms")}
                  </p>
                </div>
              )}
              {property.bathrooms > 0 && (
                <div className="px-4 py-6">
                  <Bath size={18} className="text-muted" />
                  <p className="mt-2 font-display text-lg font-semibold text-ink">
                    {property.bathrooms}
                  </p>
                  <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-muted">
                    {t("propertyDetails.bathrooms")}
                  </p>
                </div>
              )}
              <div className="px-4 py-6">
                <Ruler size={18} className="text-muted" />
                <p className="mt-2 font-display text-lg font-semibold text-ink">
                  {property.area} m²
                </p>
                <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-muted">
                  {t("propertyDetails.area")}
                </p>
              </div>
            </div>

            <h2 className="mt-12 font-display text-xl font-semibold text-ink">
              {t("common.description")}
            </h2>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-slate">{property.description}</p>

            <h2 className="mt-10 font-display text-xl font-semibold text-ink">
              {t("common.features")}
            </h2>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {property.features.map((f) => (
                <div key={f} className="flex items-center gap-2.5">
                  <CheckCircle2 size={16} className="shrink-0 text-gold-dark" />
                  <span className="text-sm text-slate">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <aside>
            <div className="sticky top-28 rounded-xl bg-ink p-6 md:p-7">
              <h3 className="font-display text-lg font-semibold text-white">
                {t("common.interested")}
              </h3>
              <p className="mt-2 text-[0.8125rem] leading-relaxed text-white/55">
                {t("common.contactTeam")}
              </p>

              <div className="mt-6 space-y-2.5">
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg bg-gold px-4 py-3 text-ink transition-colors hover:bg-gold-light"
                >
                  <MessageCircle size={16} />
                  <span className="text-sm font-medium">WhatsApp {site.whatsapp}</span>
                </a>
                {site.phones.map((p) => (
                  <a
                    key={p.href}
                    href={p.href}
                    className="flex items-center gap-3 rounded-lg border border-white/10 px-4 py-3 text-white transition-colors hover:border-white/25"
                  >
                    <Phone size={16} className="text-white/50" />
                    <span className="text-sm">{p.label}</span>
                  </a>
                ))}
                {site.email && (
                  <a
                    href={site.emailHref}
                    className="flex items-center gap-3 rounded-lg border border-white/10 px-4 py-3 text-white transition-colors hover:border-white/25"
                  >
                    <Mail size={16} className="text-white/50" />
                    <span className="text-sm">{site.email}</span>
                  </a>
                )}
              </div>

              <div className="my-6 h-px bg-white/10" />

              {contactSent ? (
                <div className="rounded-lg border border-white/10 px-4 py-6 text-center">
                  <CheckCircle2 size={20} className="mx-auto text-gold" />
                  <p className="mt-2 text-sm text-white">{t("common.requestSent")}</p>
                  <p className="mt-1 text-xs text-white/45">
                    {t("common.requestSentText", { item: property.title })}
                  </p>
                </div>
              ) : (
                <form className="space-y-2.5" onSubmit={submitContact}>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder={t("common.yourName")}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-gold/60"
                  />
                  <input
                    type="tel"
                    required
                    value={contactForm.phone}
                    onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder={t("common.yourPhone")}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-gold/60"
                  />
                  <textarea
                    required
                    value={contactForm.message}
                    onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder={t("common.yourMessage")}
                    rows={3}
                    className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-gold/60"
                  />
                  <button
                    type="submit"
                    disabled={contactSending}
                    className="btn btn-gold w-full disabled:opacity-50"
                  >
                    {contactSending ? t("common.sending") : t("common.sendRequest")}
                  </button>
                </form>
              )}
            </div>
          </aside>
        </div>
      </section>

      {similar.length > 0 && (
        <section className="bg-sand py-20">
          <div className="container-page">
            <div className="flex items-end justify-between gap-6">
              <h2 className="font-display text-2xl font-bold text-ink md:text-[1.75rem]">
                {t("common.similarProperties")}
              </h2>
              <Link
                to="/biens-a-vendre"
                className="hidden items-center gap-1.5 text-[0.8125rem] font-medium text-ink transition-colors hover:text-gold-dark sm:flex"
              >
                {t("common.seeAll")} <ArrowUpRight size={15} />
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
              {similar.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
