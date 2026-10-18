import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Search,
  Car,
  Handshake,
  ShieldCheck,
  Layers,
  ArrowRight,
  Star,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import SectionHeading from "../components/SectionHeading";
import PropertyCard from "../components/PropertyCard";
import VehicleCard from "../components/VehicleCard";
import ProgressiveImage from "../components/ProgressiveImage";
import Badge from "../components/Badge";
import ReviewsSection from "../components/ReviewsSection";
import PolesGrid from "../components/PolesGrid";
import { useProperties, useFeaturedProperties, useVehicles, usePublicFaqs } from "../lib/api";
import { site } from "../data/site";
import { getPoleBySlug, poles } from "../data/poles";

// Diaporama : un visuel par grand métier de l'affiche
const heroSlides = [
  { src: getPoleBySlug("immobilier").image, to: "/biens-a-vendre" },
  { src: getPoleBySlug("construction").image, to: "/construction" },
  { src: getPoleBySlug("location-voitures").image, to: "/vehicules-a-louer" },
  { src: getPoleBySlug("decoration").image, to: "/decoration-interieure" },
].map((slide, i) => ({
  ...slide,
  badge: `home.hero.badge.${i}`,
  title: `home.hero.title.${i}`,
  text: `home.hero.text.${i}`,
  cta: { to: slide.to, label: `home.hero.cta.${i}` },
}));


export default function Home() {
  const { t } = useTranslation();
  const { data: allProperties = [] } = useProperties();
  const { data: featuredProps = [] } = useFeaturedProperties();
  const { data: allVehicles = [] } = useVehicles();
  const { data: apiFaqs = [] } = usePublicFaqs();
  const faqItems = apiFaqs.length > 0 ? apiFaqs : [];
  const featuredVehicles = allVehicles.filter((v) => v.featured);
  const featuredProperties = featuredProps.length > 0 ? featuredProps : allProperties.filter((p) => p.featured);
  const latest = (type: "Vente" | "Location") =>
    featuredProperties
      .filter((p) => p.type === type)
      .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
      .slice(0, 4);
  const saleProperties = latest("Vente");
  const rentalProperties = latest("Location");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused]);

  
  const [nouveauIndex, setNouveauIndex] = useState(0);
  const nouveauItems = allProperties.filter((p) => !p.featured);
  const [nouveauPaused, setNouveauPaused] = useState(false);

  
  useEffect(() => {
    if (nouveauPaused || nouveauItems.length <= 1) return;
    const timer = setInterval(() => {
      setNouveauIndex((prev) => (prev + 1) % nouveauItems.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [nouveauPaused, nouveauItems.length]);

  const slide = heroSlides[currentSlide];

  return (
    <div>
      {}
      <section
        className="relative min-h-[92vh] md:min-h-[85vh] flex items-center pt-24 pb-24 md:pb-16 overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="absolute inset-0">
          {heroSlides.map((s, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-1000 ${
                index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              <ProgressiveImage
                src={s.src}
                alt={t(s.badge)}
                className={`w-full h-full object-cover transition-all duration-[10s] ease-out ${
                  index === currentSlide ? "scale-110" : "scale-100"
                }`}
                wrapperClassName="w-full h-full"
                loading="eager"
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-navy/80 via-navy/60 to-navy/30 pointer-events-none" />
        </div>

        <div className="container-page relative z-10">
          <div key={currentSlide} className="max-w-4xl animate-fade-up">
            <h1 className="font-display font-bold text-white text-5xl md:text-7xl leading-[1.1] tracking-tight">
              {t(slide.title)}
            </h1>
            <p className="text-white/80 text-xl mt-8 leading-relaxed max-w-3xl">
              {t(slide.text)}
            </p>

            <div className="flex flex-wrap gap-5 mt-10">
              <Link
                to={slide.cta.to}
                className="bg-gold hover:bg-gold-light text-navy font-semibold px-10 py-4 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-gold/20 active:scale-95 flex items-center gap-2"
              >
                {t(slide.cta.label)} <ArrowRight size={18} />
              </Link>
              <Link
                to="/contact"
                className="border-2 border-white/30 hover:border-gold hover:text-gold text-white font-semibold px-10 py-4 rounded-full transition-all duration-300 hover:scale-105 active:scale-95"
              >
                {t("common.contactUs")}
              </Link>
            </div>
          </div>

          {}
          <div className="mt-12 bg-white rounded-2xl shadow-2xl p-3 md:p-4 grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-3 max-w-4xl">
            <select className="px-4 py-3 rounded-xl border border-navy/10 text-sm text-navy focus:outline-none focus:border-gold">
              <option>{t("home.search.transaction")}</option>
              <option>{t("properties.hero.titleSale")}</option>
              <option>{t("properties.hero.titleRent")}</option>
            </select>
            <select className="px-4 py-3 rounded-xl border border-navy/10 text-sm text-navy focus:outline-none focus:border-gold">
              <option>{t("home.search.propertyType")}</option>
              <option>Villa</option>
              <option>Maison</option>
              <option>Appartement</option>
              <option>Terrain</option>
              <option>Bureau</option>
            </select>
            <select className="px-4 py-3 rounded-xl border border-navy/10 text-sm text-navy focus:outline-none focus:border-gold">
              <option>{t("home.search.city")}</option>
              <option>Bangui</option>
              <option>Bimbo</option>
            </select>
            <Link
              to="/biens-a-vendre"
              className="bg-navy hover:bg-gold hover:text-navy text-white font-semibold px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Search size={17} /> {t("home.search.search")}
            </Link>
          </div>
        </div>

      </section>

      {nouveauItems.length > 0 && (
      <section className="py-12 pb-6 bg-cream overflow-hidden">
        <div className="container-page">
          <div
            onMouseEnter={() => setNouveauPaused(true)}
            onMouseLeave={() => setNouveauPaused(false)}
            className="overflow-hidden rounded-2xl"
          >
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{
                width: `${nouveauItems.length * 100}%`,
                transform: `translateX(-${nouveauIndex * (100 / nouveauItems.length)}%)`,
              }}
            >
              {nouveauItems.map((p) => (
                <div
                  key={p.id}
                  className="relative"
                  style={{ width: `${100 / nouveauItems.length}%` }}
                >
                  <div className="absolute top-3 right-3 z-20">
                    <Badge variant="gold" size="sm" icon={Sparkles}>
                      {t("home.newBadge")}
                    </Badge>
                  </div>
                  <PropertyCard property={p} compact />
                </div>
              ))}
            </div>
          </div>

          {}
          <div className="flex justify-center items-center gap-2 mt-3">
            {nouveauItems.map((_, i) => (
              <button
                key={i}
                onClick={() => setNouveauIndex(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === nouveauIndex
                    ? "w-8 bg-gold"
                    : "w-2 bg-navy/20 hover:bg-navy/40"
                }`}
                aria-label={t("home.goToProperty", { number: i + 1 })}
              />
            ))}
          </div>
        </div>
      </section>
      )}

      {}
      <section className="py-16 bg-white">
        <div className="container-page">
          <SectionHeading
            title={t("home.poles.title")}
            description={t("home.poles.description")}
          />
          <div className="mt-12">
            <PolesGrid />
          </div>
        </div>
      </section>

      {saleProperties.length > 0 && (
      <section className="py-16 bg-cream">
        <div className="container-page">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
            <SectionHeading
              title={t("home.sale.title")}
              description={t("home.sale.description")}
            />
            <Link
              to="/biens-a-vendre"
              className="hidden md:flex items-center gap-2 text-navy font-semibold hover:text-gold-dark transition-colors shrink-0"
            >
              {t("common.seeAll")} <ArrowRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {saleProperties.map((p, i) => (
                <div key={p.id} className={i === 3 ? "lg:hidden" : ""}>
                  <PropertyCard property={p} />
                </div>
              ))}
          </div>

          <div className="mt-10 md:hidden text-center">
            <Link
              to="/biens-a-vendre"
              className="inline-flex items-center gap-2 text-navy font-semibold"
            >
              {t("common.seeAll")} <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
      )}

      {rentalProperties.length > 0 && (
      <section className="py-16 bg-white">
        <div className="container-page">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
            <SectionHeading
              title={t("home.rental.title")}
              description={t("home.rental.description")}
            />
            <Link
              to="/biens-a-louer"
              className="hidden md:flex items-center gap-2 text-navy font-semibold hover:text-gold-dark transition-colors shrink-0"
            >
              {t("common.seeAll")} <ArrowRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-14 [&>*:only-child]:col-span-full [&>*:only-child]:max-w-md [&>*:only-child]:mx-auto">
            {rentalProperties.map((p, i) => (
                <div key={p.id} className={i === 3 ? "lg:hidden" : ""}>
                  <PropertyCard property={p} />
                </div>
              ))}
          </div>

        </div>
      </section>
      )}

      {}
      <section className="py-16 bg-cream">
        <div className="container-page">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
            <SectionHeading
              title={t("home.fleet.title")}
              description={t("home.fleet.description")}
            />
            <Link
              to="/vehicules-a-louer"
              className="hidden md:flex items-center gap-2 text-navy font-semibold hover:text-gold-dark transition-colors shrink-0"
            >
              {t("common.seeAllFleet")} <ArrowRight size={18} />
            </Link>
          </div>

          {featuredVehicles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
            {featuredVehicles
              .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
              .slice(0, 4)
              .map((v, i) => (
                <div key={v.id} className={i === 3 ? "lg:hidden" : ""}>
                  <VehicleCard vehicle={v} />
                </div>
              ))}
          </div>
          )}

          <div className="bg-navy rounded-3xl p-8 md:p-12 flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1">
              <span className="inline-flex items-center gap-2 text-gold text-xs font-semibold tracking-[0.2em] uppercase">
                <Car size={16} /> {t("home.fleet.badge")}
              </span>
              <h3 className="font-display font-bold text-white text-2xl md:text-3xl mt-4">
                {t("home.fleet.headline")}
              </h3>
              <p className="text-white/60 mt-4 max-w-2xl">
                {t("home.fleet.text")}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 w-full sm:w-auto">
              <Link
                to="/vehicules-a-louer"
                className="bg-gold hover:bg-gold-light text-navy font-semibold px-8 py-4 rounded-full text-center transition-colors"
              >
                {t("home.fleet.rentVehicle")}
              </Link>
              <a
                href={site.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="border-2 border-white/25 hover:border-gold hover:text-gold text-white font-semibold px-8 py-4 rounded-full text-center transition-colors"
              >
                WhatsApp {site.whatsapp}
              </a>
            </div>
          </div>

          <div className="mt-10 md:hidden text-center">
            <Link
              to="/vehicules-a-louer"
              className="inline-flex items-center gap-2 text-navy font-semibold"
            >
              {t("common.seeAllFleet")} <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {}
      <section className="py-16 bg-white">
        <div className="container-page grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <SectionHeading
              title={t("home.why.title")}
              description={t("home.why.description")}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10">
              <div className="flex gap-4">
                <span className="w-12 h-12 rounded-xl bg-navy flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} className="text-gold" />
                </span>
                <div>
                  <h4 className="font-semibold text-navy">{t("home.why.transparency")}</h4>
                  <p className="text-sm text-slate mt-1">
                    {t("home.why.transparencyText")}
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="w-12 h-12 rounded-xl bg-navy flex items-center justify-center shrink-0">
                  <Handshake size={20} className="text-gold" />
                </span>
                <div>
                  <h4 className="font-semibold text-navy">{t("home.why.legal")}</h4>
                  <p className="text-sm text-slate mt-1">
                    {t("home.why.legalText")}
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="w-12 h-12 rounded-xl bg-navy flex items-center justify-center shrink-0">
                  <Layers size={20} className="text-gold" />
                </span>
                <div>
                  <h4 className="font-semibold text-navy">{t("home.why.dual")}</h4>
                  <p className="text-sm text-slate mt-1">
                    {t("home.why.dualText")}
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="w-12 h-12 rounded-xl bg-navy flex items-center justify-center shrink-0">
                  <Star size={20} className="text-gold" />
                </span>
                <div>
                  <h4 className="font-semibold text-navy">{t("home.why.custom")}</h4>
                  <p className="text-sm text-slate mt-1">
                    {t("home.why.customText")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80"
              alt={t("home.why.imageAlt")}
              className="rounded-2xl w-full h-[480px] object-cover"
            />
            <div className="absolute -bottom-8 -left-8 bg-navy text-white rounded-2xl p-6 shadow-xl hidden sm:block max-w-[240px]">
              <p className="font-display text-gold text-3xl font-bold">{poles.length}</p>
              <p className="text-white/70 text-sm mt-1">
                {t("home.why.polesBadge")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {}
      <ReviewsSection />

      {}
      <section className="py-16 bg-cream">
        <div className="container-page max-w-3xl mx-auto">
          <SectionHeading
            title={t("home.faq.title")}
            align="center"
            description={t("home.faq.description")}
          />

          <div className="mt-14 space-y-3">
            {(faqItems.length > 0 ? faqItems : (t("home.faq.items", { returnObjects: true }) as { q: string; r: string }[])).map((faq, i) => (
              <FaqItem key={"id" in faq ? faq.id : i} question={"q" in faq ? faq.q : faq.question} answer={"r" in faq ? faq.r : faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {}
      <section className="py-14 bg-gold">
        <div className="container-page flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div>
            <h2 className="font-display font-bold text-navy text-3xl md:text-4xl">
              {t("home.cta.title")}
            </h2>
            <p className="text-navy/70 mt-3 max-w-xl">
              {t("home.cta.text")}
            </p>
          </div>
          <Link
            to="/contact"
            className="bg-navy text-white font-semibold px-8 py-4 rounded-full hover:bg-white hover:text-navy transition-colors shrink-0"
          >
            {t("common.bookAppointment")}
          </Link>
        </div>
      </section>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-navy/5 overflow-hidden transition-shadow duration-300 hover:shadow-md">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 px-7 py-5 text-left"
        aria-expanded={open}
      >
        <span className="font-semibold text-navy text-sm md:text-base pr-4">
          {question}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-gold-dark transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-7 pb-6 pt-0">
          <div className="h-px bg-gradient-to-r from-gold/30 via-gold/10 to-transparent mb-4" />
          <p className="text-slate text-sm leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  );
}