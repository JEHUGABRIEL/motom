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
  Home as HomeIcon,
  KeyRound,
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
      <div className="pt-40 pb-24 text-center container-page">
        <h1 className="font-display text-3xl font-bold">{t("common.propertyNotFound")}</h1>
        <p className="text-slate mt-4">
          {t("common.propertyNotFoundText")}
        </p>
        <Link
          to="/biens-a-vendre"
          className="inline-flex items-center gap-2 mt-8 bg-navy text-white px-6 py-3 rounded-full font-semibold"
        >
          <ArrowLeft size={16} /> {t("common.backToProperties")}
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

  return (
    <div>
      <section className="pt-32 pb-10 bg-cream">
        <div className="container-page">
          <Link
            to="/biens-a-vendre"
            className="inline-flex items-center gap-2 text-sm text-slate hover:text-navy mb-6"
          >
            <ArrowLeft size={15} /> {t("common.backToProperties")}
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge
                  variant="gold"
                  icon={property.type === "Vente" ? HomeIcon : KeyRound}
                >
                  {property.type}
                </Badge>
                <Badge variant="navy">{property.category}</Badge>
                {property.promo && (
                  <Badge variant="gold" icon={Megaphone}>
                    {property.promoEndsAt && !isPromoExpired(property.promoEndsAt)
                      ? t("promo.until", { date: formatPromoEnd(property.promoEndsAt, i18n.language) })
                      : t("promo.title")}
                  </Badge>
                )}
                {property.promo && (
                  <PromoCountdownChip promoEndsAt={property.promoEndsAt} />
                )}
              </div>
              <h1 className="font-display font-bold text-3xl md:text-4xl text-navy">
                {property.title}
              </h1>
              <p className="flex items-center gap-2 text-slate mt-2">
                <MapPin size={16} className="text-gold-dark" />
                {property.neighborhood}, {property.city} — {t("common.republicCentralAfrican")}
              </p>
            </div>
            <div className="text-left md:text-right shrink-0">
              <p className="text-sm text-slate">{t("common.price")}</p>
              <p className="font-display font-bold text-2xl md:text-3xl text-gold-dark">
                {formatPrice(property.price, property.priceUnit)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container-page">
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
            <div className="rounded-2xl overflow-hidden aspect-[16/10]">
              <img
                src={property.gallery[activeImage]}
                alt={property.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-3 lg:grid-cols-2 gap-3">
              {property.gallery.map((src, i) => (
                <button
                  key={src}
                  onClick={() => setActiveImage(i)}
                  className={`rounded-xl overflow-hidden aspect-[4/3] border-2 transition-colors ${
                    activeImage === i ? "border-gold" : "border-transparent"
                  }`}
                >
                  <img
                    src={src}
                    alt={t("common.view", { number: i + 1 })}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20 bg-white">
        <div className="container-page grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-10">
          <div>
            <div className="grid grid-cols-3 gap-4 mb-10">
              {property.bedrooms > 0 && (
                <div className="bg-cream rounded-xl p-5 text-center">
                  <BedDouble className="mx-auto text-gold-dark mb-2" size={22} />
                  <p className="font-semibold text-navy">{property.bedrooms}</p>
                  <p className="text-xs text-slate">{t("propertyDetails.bedrooms")}</p>
                </div>
              )}
              {property.bathrooms > 0 && (
                <div className="bg-cream rounded-xl p-5 text-center">
                  <Bath className="mx-auto text-gold-dark mb-2" size={22} />
                  <p className="font-semibold text-navy">{property.bathrooms}</p>
                  <p className="text-xs text-slate">{t("propertyDetails.bathrooms")}</p>
                </div>
              )}
              <div className="bg-cream rounded-xl p-5 text-center">
                <Ruler className="mx-auto text-gold-dark mb-2" size={22} />
                <p className="font-semibold text-navy">{property.area} m²</p>
                <p className="text-xs text-slate">{t("propertyDetails.area")}</p>
              </div>
            </div>

            <h2 className="font-display font-bold text-2xl text-navy mb-4">
              {t("common.description")}
            </h2>
            <p className="text-slate leading-relaxed">{property.description}</p>

            <h2 className="font-display font-bold text-2xl text-navy mt-10 mb-5">
              {t("common.features")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {property.features.map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-gold-dark shrink-0" />
                  <span className="text-sm text-slate">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {}
          <aside>
            <div className="bg-navy rounded-2xl p-7 sticky top-28">
              <h3 className="font-display font-semibold text-lg text-white mb-2">
                {t("common.interested")}
              </h3>
              <p className="text-white/60 text-sm mb-6">
                {t("common.contactTeam")}
              </p>

              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-green rounded-xl px-4 py-3 mb-3 hover:bg-green-dark transition-colors"
              >
                <MessageCircle size={17} className="text-white" />
                <span className="text-sm text-white font-medium">
                  WhatsApp {site.whatsapp}
                </span>
              </a>
              {site.phones.map((p) => (
                <a
                  key={p.href}
                  href={p.href}
                  className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 mb-3 hover:bg-white/15 transition-colors"
                >
                  <Phone size={17} className="text-gold" />
                  <span className="text-sm text-white">{p.label}</span>
                </a>
              ))}
              {site.email && (
                <a
                  href={site.emailHref}
                  className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 mb-3 hover:bg-white/15 transition-colors"
                >
                  <Mail size={17} className="text-gold" />
                  <span className="text-sm text-white">{site.email}</span>
                </a>
              )}
              <div className="mb-6" />

              {contactSent ? (
                <div className="bg-white/10 rounded-xl px-4 py-5 text-center">
                  <CheckCircle2 size={22} className="mx-auto text-gold mb-2" />
                  <p className="text-sm text-white">{t("common.requestSent")}</p>
                  <p className="text-xs text-white/50 mt-1">
                    {t("common.requestSentText", { item: property.title })}
                  </p>
                </div>
              ) : (
                <form
                  className="space-y-3"
                  onSubmit={async (e) => {
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
                  }}
                >
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder={t("common.yourName")}
                    className="w-full bg-white/10 text-sm text-white placeholder:text-white/40 rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-gold"
                  />
                  <input
                    type="tel"
                    required
                    value={contactForm.phone}
                    onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder={t("common.yourPhone")}
                    className="w-full bg-white/10 text-sm text-white placeholder:text-white/40 rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-gold"
                  />
                  <textarea
                    required
                    value={contactForm.message}
                    onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder={t("common.yourMessage")}
                    rows={3}
                    className="w-full bg-white/10 text-sm text-white placeholder:text-white/40 rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-gold resize-none"
                  />
                  <button
                    type="submit"
                    disabled={contactSending}
                    className="w-full bg-gold hover:bg-gold-light text-navy font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
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
        <section className="py-20 bg-cream">
          <div className="container-page">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-navy mb-10">
              {t("common.similarProperties")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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