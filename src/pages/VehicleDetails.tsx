import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Users,
  Gauge,
  Fuel,
  Calendar,
  Route,
  CheckCircle2,
  Phone,
  Mail,
  MessageCircle,
  ArrowLeft,
  UserCheck,
  Car,
  Tag,
  Megaphone,
} from "lucide-react";
import { formatVehiclePrice } from "../data/vehicles";
import { useVehicle, useVehicles } from "../lib/api";
import { formatPromoEnd, isPromoExpired } from "../lib/promo";
import { site } from "../data/site";
import VehicleCard from "../components/VehicleCard";
import Badge from "../components/Badge";
import PromoCountdownChip from "../components/PromoCountdownChip";

export default function VehicleDetails() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const { data: vehicle } = useVehicle(id);
  const { data: vehicles = [] } = useVehicles();
  const [activeImage, setActiveImage] = useState(0);

  
  const [contactForm, setContactForm] = useState({ name: "", phone: "", message: "" });
  const [contactSending, setContactSending] = useState(false);
  const [contactSent, setContactSent] = useState(false);

  const rentalPoints = t("vehicleDetails.rentalPoints", { returnObjects: true }) as string[];

  if (!vehicle) {
    return (
      <div className="pt-40 pb-24 text-center container-page">
        <h1 className="font-display text-3xl font-bold">{t("common.vehicleNotFound")}</h1>
        <p className="text-slate mt-4">
          {t("common.vehicleNotFoundText")}
        </p>
        <Link
          to="/vehicules"
          className="inline-flex items-center gap-2 mt-8 bg-navy text-white px-6 py-3 rounded-full font-semibold"
        >
          <ArrowLeft size={16} /> {t("common.backToVehicles")}
        </Link>
      </div>
    );
  }

  
  
  const sameCategory = vehicles.filter(
    (v) => v.id !== vehicle.id && v.category === vehicle.category
  );
  const sameType = vehicles.filter(
    (v) =>
      v.id !== vehicle.id &&
      v.category !== vehicle.category &&
      v.type === vehicle.type
  );
  const similar = [...sameCategory, ...sameType].slice(0, 3);

  const whatsappLink = `${site.whatsappHref}?text=${encodeURIComponent(
    `Bonjour ${site.shortName}, je suis intéressé(e) par le véhicule « ${vehicle.name} » (${vehicle.type.toLowerCase()}).`,
  )}`;

  return (
    <div>
      <section className="pt-32 pb-10 bg-cream">
        <div className="container-page">
          <Link
            to="/vehicules"
            className="inline-flex items-center gap-2 text-sm text-slate hover:text-navy mb-6"
          >
            <ArrowLeft size={15} /> {t("common.backToVehicles")}
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge
                  variant="gold"
                  icon={vehicle.type === "Vente" ? Tag : Car}
                >
                  {vehicle.type}
                </Badge>
                <Badge variant="navy">{vehicle.category}</Badge>
                {vehicle.promo && (
                  <Badge variant="gold" icon={Megaphone}>
                    {vehicle.promoEndsAt && !isPromoExpired(vehicle.promoEndsAt)
                      ? t("promo.until", { date: formatPromoEnd(vehicle.promoEndsAt, i18n.language) })
                      : t("promo.title")}
                  </Badge>
                )}
                {vehicle.promo && (
                  <PromoCountdownChip promoEndsAt={vehicle.promoEndsAt} />
                )}
                {vehicle.withDriver && (
                  <Badge variant="green" icon={UserCheck}>
                    {t("common.withDriver")}
                  </Badge>
                )}
              </div>
              <h1 className="font-display font-bold text-3xl md:text-4xl text-navy">
                {vehicle.name}
              </h1>
              <p className="flex items-center gap-2 text-slate mt-2">
                <Calendar size={16} className="text-gold-dark" />
                {vehicle.brand} — {vehicle.year} · {t("common.availability", { city: vehicle.city })}
              </p>
            </div>
            <div className="text-left md:text-right shrink-0">
              <p className="text-sm text-slate">
                {vehicle.type === "Location" ? t("common.rate") : t("common.price")}
              </p>
              <p className="font-display font-bold text-2xl md:text-3xl text-gold-dark">
                {formatVehiclePrice(vehicle.price, vehicle.priceUnit)}
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
                src={vehicle.gallery[activeImage]}
                alt={vehicle.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-3 lg:grid-cols-2 gap-3">
              {vehicle.gallery.map((src, i) => (
                <button
                  key={src}
                  onClick={() => setActiveImage(i)}
                  className={`rounded-xl overflow-hidden aspect-[4/3] border-2 transition-colors ${
                    activeImage === i ? "border-gold" : "border-transparent"
                  }`}
                >
                  <img
                    src={src}
                    alt={`${t("common.view", { number: i + 1 })} — ${vehicle.name}`}
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
              <div className="bg-cream rounded-xl p-5 text-center">
                <Users className="mx-auto text-gold-dark mb-2" size={22} />
                <p className="font-semibold text-navy">{vehicle.seats}</p>
                <p className="text-xs text-slate">{t("vehicleDetails.seats")}</p>
              </div>
              <div className="bg-cream rounded-xl p-5 text-center">
                <Gauge className="mx-auto text-gold-dark mb-2" size={22} />
                <p className="font-semibold text-navy">{vehicle.transmission}</p>
                <p className="text-xs text-slate">{t("vehicleDetails.gearbox")}</p>
              </div>
              <div className="bg-cream rounded-xl p-5 text-center">
                <Fuel className="mx-auto text-gold-dark mb-2" size={22} />
                <p className="font-semibold text-navy">{vehicle.fuel}</p>
                <p className="text-xs text-slate">{t("vehicleDetails.fuel")}</p>
              </div>
              <div className="bg-cream rounded-xl p-5 text-center">
                {vehicle.mileage ? (
                  <>
                    <Route className="mx-auto text-gold-dark mb-2" size={22} />
                    <p className="font-semibold text-navy">
                      {vehicle.mileage.toLocaleString("fr-FR")} km
                    </p>
                    <p className="text-xs text-slate">{t("vehicleDetails.mileage")}</p>
                  </>
                ) : (
                  <>
                    <Calendar className="mx-auto text-gold-dark mb-2" size={22} />
                    <p className="font-semibold text-navy">{vehicle.year}</p>
                    <p className="text-xs text-slate">{t("vehicleDetails.year")}</p>
                  </>
                )}
              </div>
            </div>

            <h2 className="font-display font-bold text-2xl text-navy mb-4">
              {t("common.description")}
            </h2>
            <p className="text-slate leading-relaxed">{vehicle.description}</p>

            <h2 className="font-display font-bold text-2xl text-navy mt-10 mb-5">
              {t("common.equipment")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {vehicle.features.map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-gold-dark shrink-0" />
                  <span className="text-sm text-slate">{f}</span>
                </div>
              ))}
            </div>

            {vehicle.type === "Location" && (
              <div className="mt-10 bg-cream border border-navy/5 rounded-2xl p-6">
                <h3 className="font-display font-semibold text-navy mb-2">
                  {t("common.rentalConditions")}
                </h3>
                <ul className="text-sm text-slate space-y-2">
                  {rentalPoints.map((pt) => (
                    <li key={pt}>• {pt}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {}
          <aside>
            <div className="bg-navy rounded-2xl p-7 sticky top-28">
              <h3 className="font-display font-semibold text-lg text-white mb-2">
                {vehicle.type === "Location"
                  ? t("common.rentThisVehicle")
                  : t("common.interestedVehicle")}
              </h3>
              <p className="text-white/60 text-sm mb-6">
                {t("common.contactTeamVehicle")}
              </p>

              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-green rounded-xl px-4 py-3 mb-3 hover:bg-green-dark transition-colors"
              >
                <MessageCircle size={17} className="text-white" />
                <span className="text-sm text-white font-medium">
                  {t("common.whatsapp", { number: site.whatsapp })}
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
                    {t("common.requestSentText", { item: vehicle.name })}
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
                          subject: t("common.requestAbout", { item: vehicle.name }),
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
                    placeholder={
                      vehicle.type === "Location"
                        ? t("vehicleDetails.datesPlaceholder")
                        : t("common.yourMessage")
                    }
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
              {t("common.similarVehicles")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {similar.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}