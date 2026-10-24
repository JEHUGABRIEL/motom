import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Plus,
  Search,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import SectionHeading from "../components/SectionHeading";
import FeaturedPropertyCard from "../components/FeaturedPropertyCard";
import VehicleCard from "../components/VehicleCard";
import OfferCards from "../components/OfferCards";
import ReviewsSection from "../components/ReviewsSection";
import SocialIcons from "../components/SocialIcons";
import CardSkeleton from "../components/CardSkeleton";
import { useCreateMessage, useProperties, usePublicFaqs, useVehicles } from "../lib/api";
import { site } from "../data/site";
import type { Property } from "../data/properties";
import { getPoleBySlug } from "../data/poles";

const homeServiceSlugs = ["immobilier", "construction", "location-voitures", "demenagement"] as const;

const heroSlides = [
  { image: getPoleBySlug("immobilier").image, to: "/biens-a-vendre" },
  { image: getPoleBySlug("construction").image, to: "/construction" },
  { image: getPoleBySlug("location-voitures").image, to: "/vehicules-a-louer" },
  { image: getPoleBySlug("decoration").image, to: "/decoration-interieure" },
];

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: apiFaqs = [] } = usePublicFaqs();
  const { data: allProperties = [], isLoading: propertiesLoading } = useProperties();
  const { data: allVehicles = [], isLoading: vehiclesLoading } = useVehicles();
  const createMessage = useCreateMessage();

  const [heroTab, setHeroTab] = useState<"buy" | "rent">("buy");
  const [query, setQuery] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);

  const [appointment, setAppointment] = useState({
    name: "",
    email: "",
    phone: "",
    subject: t("contact.form.initialSubject"),
    message: "",
  });
  const [appointmentSending, setAppointmentSending] = useState(false);
  const [appointmentSent, setAppointmentSent] = useState(false);

  const subjects = t("contact.form.subjects", { returnObjects: true }) as string[];
  const faqs =
    apiFaqs.length > 0
      ? apiFaqs.map((f) => ({ q: f.question, r: f.answer }))
      : (t("home.faq.items", { returnObjects: true }) as { q: string; r: string }[]);

  const spotlightOrder = (a: Property, b: Property) =>
    Number(b.featured) - Number(a.featured) ||
    new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
  const spotlightSales = allProperties
    .filter((p) => p.type === "Vente")
    .sort(spotlightOrder)
    .slice(0, 3);
  const spotlightRentals = allProperties
    .filter((p) => p.type === "Location")
    .sort(spotlightOrder)
    .slice(0, 3);
  const featuredVehicles = allVehicles.filter((v) => v.featured);
  const vehiclesToShow = (featuredVehicles.length > 0 ? featuredVehicles : allVehicles).slice(0, 3);

  useEffect(() => {
    if (heroPaused) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;
    const timer = setInterval(() => {
      setCurrentSlide((i) => (i + 1) % heroSlides.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [heroPaused]);

  const values = [
    { title: t("home.why.transparency"), text: t("home.why.transparencyText") },
    { title: t("home.why.legal"), text: t("home.why.legalText") },
    { title: t("home.why.dual"), text: t("home.why.dualText") },
    { title: t("home.why.custom"), text: t("home.why.customText") },
  ];

  const serviceCta = (slug: (typeof homeServiceSlugs)[number]) => {
    if (slug === "immobilier") return t("footer.propertiesForSale");
    if (slug === "location-voitures") return t("home.fleet.rentVehicle");
    return t("poles.quote");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const base = heroTab === "buy" ? "/biens-a-vendre" : "/biens-a-louer";
    navigate(query.trim() ? `${base}?q=${encodeURIComponent(query.trim())}` : base);
  };

  const handleAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setAppointmentSending(true);
    try {
      await createMessage.mutateAsync(appointment);
      setAppointmentSent(true);
    } catch {
      alert(t("contact.form.error"));
    } finally {
      setAppointmentSending(false);
    }
  };

  return (
    <div>
      {/* Hero encadré */}
      <section className="pt-24 md:pt-28">
        <div className="mx-3 md:mx-5">
          <div
            className="relative overflow-hidden rounded-2xl bg-ink"
            onMouseEnter={() => setHeroPaused(true)}
            onMouseLeave={() => setHeroPaused(false)}
            onFocusCapture={() => setHeroPaused(true)}
            onBlurCapture={() => setHeroPaused(false)}
          >
            {heroSlides.map((slide, i) => (
              <img
                key={slide.image}
                src={slide.image}
                alt={t(`home.hero.badge.${i}`)}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                  i === currentSlide ? "opacity-100" : "opacity-0"
                }`}
                loading={i === 0 ? "eager" : "lazy"}
                aria-hidden={i !== currentSlide}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/50 to-ink/30" />

            <div className="relative flex min-h-[560px] flex-col items-center justify-center px-5 py-16 text-center md:min-h-[620px]">
              <div
                key={currentSlide}
                className="flex min-h-[195px] animate-fade-up flex-col items-center justify-center md:min-h-[235px]"
                aria-live="polite"
              >
                <h1 className="mx-auto max-w-4xl font-display text-[2.35rem] font-bold leading-[1.08] tracking-tight text-white md:text-[3.9rem]">
                  {t(`home.hero.title.${currentSlide}`)}
                </h1>
                <span className="mt-6 block h-1 w-24 rounded-full bg-gold mx-auto" />
                <p className="mx-auto mt-5 max-w-2xl text-[0.9375rem] leading-relaxed text-white/75">
                  {t(`home.hero.text.${currentSlide}`)}
                </p>
              </div>

              <div className="mt-7 inline-flex rounded-full border border-white/20 bg-white/10 p-1 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => setHeroTab("buy")}
                  className={`rounded-full px-7 py-2.5 text-[0.8125rem] font-medium transition-colors md:px-9 ${
                    heroTab === "buy"
                      ? "bg-gold text-ink"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  {t("navbar.buy")}
                </button>
                <button
                  type="button"
                  onClick={() => setHeroTab("rent")}
                  className={`rounded-full px-7 py-2.5 text-[0.8125rem] font-medium transition-colors md:px-9 ${
                    heroTab === "rent"
                      ? "bg-gold text-ink"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  {t("navbar.rent")}
                </button>
              </div>

              <form onSubmit={handleSearch} className="mt-4 w-full max-w-2xl">
                <div className="flex items-center rounded-full bg-white p-1.5 pl-5">
                  <MapPin size={18} className="shrink-0 text-muted" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("home.search.placeholder")}
                    aria-label={t("home.search.placeholder")}
                    className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-ink outline-none placeholder:text-muted"
                  />
                  <button
                    type="submit"
                    aria-label={t("home.search.search")}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold text-ink transition-colors hover:bg-gold-light"
                  >
                    <Search size={18} />
                  </button>
                </div>
              </form>

              <Link to={heroSlides[currentSlide].to} className="btn btn-gold mt-5 px-8">
                {t(`home.hero.cta.${currentSlide}`)}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 md:py-24">
        <div className="container-page">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading
              title={t("home.poles.title")}
              description={t("home.poles.description")}
            />
            <Link
              to="/services"
              className="hidden shrink-0 items-center gap-1.5 text-[0.8125rem] font-medium text-ink transition-colors hover:text-gold-dark md:flex"
            >
              {t("footer.ourServices")} <ArrowUpRight size={15} />
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {homeServiceSlugs.map((slug) => {
              const pole = getPoleBySlug(slug);
              const Icon = pole.icon;
              return (
                <div
                  key={slug}
                  className="flex flex-col rounded-lg bg-sand p-7 transition-colors hover:bg-[#eef0f0]"
                >
                  <Icon size={22} strokeWidth={1.6} className="text-gold-dark" />
                  <h3 className="mt-5 font-display text-[1.0625rem] font-semibold leading-snug text-ink">
                    {t(`poles.${slug}.title`)}
                  </h3>
                  <p className="mt-2 text-[0.875rem] leading-relaxed text-slate">
                    {t(`poles.${slug}.short`)}
                  </p>
                  <Link
                    to={pole.to}
                    className="mt-6 inline-flex w-fit items-center justify-center rounded-full bg-gold px-5 py-2.5 text-[0.8125rem] font-medium text-ink transition-colors hover:bg-gold-light"
                  >
                    {serviceCta(slug)}
                  </Link>
                </div>
              );
            })}
          </div>

          <Link
            to="/services"
            className="mt-8 inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-ink transition-colors hover:text-gold-dark md:hidden"
          >
            {t("footer.ourServices")} <ArrowUpRight size={15} />
          </Link>
        </div>
      </section>

      {/* Ventes en vedette */}
      <section className="bg-sand py-20 md:py-24">
        <div className="container-page">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading
              title={t("home.featured.salesTitle")}
              description={t("home.featured.salesText")}
            />
            <Link
              to="/biens-a-vendre"
              className="hidden shrink-0 items-center gap-1.5 text-[0.8125rem] font-medium text-ink transition-colors hover:text-gold-dark md:flex"
            >
              {t("common.seeAll")} <ArrowUpRight size={15} />
            </Link>
          </div>

          <div className="mt-12">
            {propertiesLoading ? (
              <CardSkeleton count={3} />
            ) : spotlightSales.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {spotlightSales.map((p) => (
                  <FeaturedPropertyCard key={p.id} property={p} />
                ))}
              </div>
            ) : (
              <SpotlightEmpty
                message={t("home.featured.emptySale")}
                to="/biens-a-vendre"
              />
            )}
          </div>

          <Link
            to="/biens-a-vendre"
            className="mt-8 inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-ink transition-colors hover:text-gold-dark md:hidden"
          >
            {t("common.seeAll")} <ArrowUpRight size={15} />
          </Link>
        </div>
      </section>

      {/* Locations en vedette */}
      <section className="py-20 md:py-24">
        <div className="container-page">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading
              title={t("home.featured.rentalsTitle")}
              description={t("home.featured.rentalsText")}
            />
            <Link
              to="/biens-a-louer"
              className="hidden shrink-0 items-center gap-1.5 text-[0.8125rem] font-medium text-ink transition-colors hover:text-gold-dark md:flex"
            >
              {t("common.seeAll")} <ArrowUpRight size={15} />
            </Link>
          </div>

          <div className="mt-12">
            {propertiesLoading ? (
              <CardSkeleton count={3} />
            ) : spotlightRentals.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {spotlightRentals.map((p) => (
                  <FeaturedPropertyCard key={p.id} property={p} />
                ))}
              </div>
            ) : (
              <SpotlightEmpty
                message={t("home.featured.emptyRent")}
                to="/biens-a-louer"
              />
            )}
          </div>

          <Link
            to="/biens-a-louer"
            className="mt-8 inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-ink transition-colors hover:text-gold-dark md:hidden"
          >
            {t("common.seeAll")} <ArrowUpRight size={15} />
          </Link>
        </div>
      </section>

      {/* Voitures */}
      <section className="bg-sand py-20 md:py-24">
        <div className="container-page">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading
              title={t("home.fleet.title")}
              description={t("home.fleet.description")}
            />
            <Link
              to="/vehicules-a-louer"
              className="hidden shrink-0 items-center gap-1.5 text-[0.8125rem] font-medium text-ink transition-colors hover:text-gold-dark md:flex"
            >
              {t("common.seeAllFleet")} <ArrowUpRight size={15} />
            </Link>
          </div>

          <div className="mt-12">
            {vehiclesLoading ? (
              <CardSkeleton count={3} />
            ) : vehiclesToShow.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {vehiclesToShow.map((v) => (
                  <VehicleCard key={v.id} vehicle={v} />
                ))}
              </div>
            ) : (
              <OfferCards kind="vehicles" />
            )}
          </div>

          <Link
            to="/vehicules-a-louer"
            className="mt-8 inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-ink transition-colors hover:text-gold-dark md:hidden"
          >
            {t("common.seeAllFleet")} <ArrowUpRight size={15} />
          </Link>
        </div>
      </section>

      {/* Grand visuel */}
      <section className="pb-16 md:pb-20">
        <div className="container-page">
          <SectionHeading title={t("home.rethink.title")} />
          <div className="mt-8 overflow-hidden rounded-2xl bg-cream">
            <img
              src="https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?auto=format&fit=crop&w=1800&q=80"
              alt={t("home.rethink.imageAlt")}
              className="aspect-[16/8] w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* Panneau noir + photo */}
      <section className="pb-16 md:pb-20">
        <div className="container-page grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-2xl bg-ink p-8 text-white md:p-12">
            <h2 className="max-w-md font-display text-[1.65rem] font-bold leading-tight text-white md:text-[2.1rem]">
              {t("home.why.title")}
            </h2>
            <span className="mt-5 block h-1 w-16 rounded-full bg-gold" />

            <ul className="mt-8 space-y-5">
              {values.map((v) => (
                <li key={v.title} className="flex gap-4">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold text-ink">
                    <Check size={13} strokeWidth={3} />
                  </span>
                  <div>
                    <h3 className="text-[0.9375rem] font-medium text-white">{v.title}</h3>
                    <p className="mt-1 text-[0.8125rem] leading-relaxed text-white/55">
                      {v.text}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="overflow-hidden rounded-2xl bg-cream">
            <img
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"
              alt={t("home.why.imageAlt")}
              className="aspect-[4/3] h-full w-full object-cover lg:aspect-auto"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <ReviewsSection />

      {/* Rendez-vous */}
      <section className="bg-ink py-20 md:py-24">
        <div className="container-page grid grid-cols-1 gap-12 lg:grid-cols-[0.85fr_1.2fr] lg:items-center lg:gap-10">
          <div>
            <p className="font-display text-[0.9375rem] font-medium italic text-gold">
              {t("home.appointment.eyebrow")}
            </p>
            <h2 className="mt-4 font-display text-[1.9rem] font-bold leading-tight text-white md:text-[2.4rem]">
              {t("home.appointment.title")}
            </h2>
            <p className="mt-4 max-w-sm text-[0.9375rem] leading-relaxed text-white/60">
              {t("home.appointment.text")}
            </p>

            <div className="mt-7 space-y-3 text-[0.8125rem] text-white/65">
              {site.phones.map((p) => (
                <a
                  key={p.href}
                  href={p.href}
                  className="flex items-center gap-2.5 transition-colors hover:text-white"
                >
                  <Phone size={15} className="text-gold" />
                  {p.label}
                </a>
              ))}
              <a
                href={site.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 transition-colors hover:text-white"
              >
                <MessageCircle size={15} className="text-gold" />
                WhatsApp {site.whatsapp}
              </a>
            </div>
          </div>

          <div>
            {appointmentSent ? (
              <div className="rounded-xl border border-white/10 px-6 py-10 text-center">
                <CheckCircle2 size={24} className="mx-auto text-gold" />
                <h3 className="mt-3 font-display text-lg font-semibold text-white">
                  {t("contact.form.sentTitle")}
                </h3>
                <p className="mt-2 text-sm text-white/55">{t("contact.form.sentText")}</p>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleAppointment}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[0.75rem] text-white/60">
                      {t("common.fullName")}
                    </label>
                    <input
                      required
                      type="text"
                      value={appointment.name}
                      onChange={(e) =>
                        setAppointment((f) => ({ ...f, name: e.target.value }))
                      }
                      className="w-full rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-gold/60"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[0.75rem] text-white/60">
                      {t("common.phone")}
                    </label>
                    <input
                      required
                      type="tel"
                      placeholder="+236 ..."
                      value={appointment.phone}
                      onChange={(e) =>
                        setAppointment((f) => ({ ...f, phone: e.target.value }))
                      }
                      className="w-full rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-gold/60"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[0.75rem] text-white/60">
                    {t("common.email")}
                  </label>
                  <input
                    type="email"
                    required
                    placeholder={t("contact.form.emailPlaceholder")}
                    value={appointment.email}
                    onChange={(e) =>
                      setAppointment((f) => ({ ...f, email: e.target.value }))
                    }
                    className="w-full rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-gold/60"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[0.75rem] text-white/60">
                    {t("contact.form.subject")}
                  </label>
                  <div className="relative">
                    <select
                      value={appointment.subject}
                      onChange={(e) =>
                        setAppointment((f) => ({ ...f, subject: e.target.value }))
                      }
                      className="w-full appearance-none rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 pr-10 text-sm text-white outline-none focus:border-gold/60"
                    >
                      {subjects.map((s) => (
                        <option key={s} className="bg-ink text-white">
                          {s}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={15}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[0.75rem] text-white/60">
                    {t("common.message")}
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder={t("common.placeholder")}
                    value={appointment.message}
                    onChange={(e) =>
                      setAppointment((f) => ({ ...f, message: e.target.value }))
                    }
                    className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-gold/60"
                  />
                </div>

                <button
                  type="submit"
                  disabled={appointmentSending}
                  className="w-full rounded-full bg-gold px-6 py-3.5 text-sm font-medium text-ink transition-colors hover:bg-gold-light disabled:opacity-50"
                >
                  {appointmentSending ? t("common.sending") : t("common.sendRequest")}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Bandeau contact */}
      <section className="bg-sand py-14">
        <div className="container-page text-center">
          <h2 className="font-display text-xl font-bold text-ink md:text-2xl">
            {t("home.social.title")}
          </h2>
          <span className="mx-auto mt-4 block h-1 w-16 rounded-full bg-gold" />
          <SocialIcons variant="light" size="lg" className="mt-7 justify-center" />
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 md:py-24">
        <div className="container-page">
          <h2 className="font-display text-[1.85rem] font-bold text-ink md:text-[2.3rem]">
            {t("home.faq.title")}
          </h2>
          <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-slate">
            {t("home.faq.description")}
          </p>

          <div className="mt-10 border-t border-line">
            {faqs.map((faq, i) => (
              <FaqItem key={faq.q} question={faq.q} answer={faq.r} defaultOpen={i === 0} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function SpotlightEmpty({ message, to }: { message: string; to: string }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-line bg-white px-6 py-8 sm:flex-row sm:items-center sm:justify-between md:px-8">
      <div>
        <p className="font-display text-[1.0625rem] font-semibold text-ink">{message}</p>
        <p className="mt-1.5 max-w-xl text-[0.875rem] leading-relaxed text-slate">
          {t("home.featured.emptyText")}
        </p>
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <Link to={to} className="btn btn-dark justify-center">
          {t("home.featured.emptyCta")}
        </Link>
        <Link to="/contact" className="btn btn-outline justify-center">
          {t("common.contactUs")}
        </Link>
      </div>
    </div>
  );
}

function FaqItem({
  question,
  answer,
  defaultOpen = false,
}: {
  question: string;
  answer: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-line">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-6 py-5 text-left"
        aria-expanded={open}
      >
        <span className="text-[0.9375rem] font-medium text-ink">{question}</span>
        <Plus
          size={20}
          className={`shrink-0 text-ink transition-transform duration-300 ${
            open ? "rotate-45" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <p className="max-w-3xl pb-6 pr-8 text-[0.875rem] leading-relaxed text-slate">
          {answer}
        </p>
      </div>
    </div>
  );
}
