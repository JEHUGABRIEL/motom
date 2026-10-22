import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MapPin, Phone, Mail, MessageCircle, ArrowUpRight } from "lucide-react";
import Logo from "./Logo";
import SocialIcons from "./SocialIcons";
import { site } from "../data/site";
import { poles } from "../data/poles";

export default function Footer() {
  const { t } = useTranslation();

  const quickLinks = [
    { to: "/", label: t("navbar.home") },
    { to: "/a-propos", label: t("footer.aboutUs") },
    { to: "/biens-a-vendre", label: t("footer.propertiesForSale") },
    { to: "/biens-a-louer", label: t("footer.propertiesForRent") },
    { to: "/services", label: t("footer.ourServices") },
    { to: "/contact", label: t("common.contactUs") },
  ];

  return (
    <footer className="bg-white px-3 pb-3 md:px-5 md:pb-5">
      <div className="rounded-2xl bg-ink text-white">
        <div className="container-page">
          <div className="grid grid-cols-1 gap-12 py-14 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.15fr] lg:gap-10">
            <div>
              <Logo variant="light" />
              <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/55">
                {t("footer.tagline", { name: site.legalName, city: site.city })}
              </p>

              <Link to="/contact" className="btn btn-gold mt-6">
                {t("common.bookAppointment")} <ArrowUpRight size={15} />
              </Link>

              <SocialIcons variant="dark" bordered className="mt-7" />
            </div>

            <div>
              <h4 className="mb-5 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-white/40">
                {t("footer.quickLinks")}
              </h4>
              <ul className="space-y-3 text-sm text-white/65">
                {quickLinks.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="transition-colors hover:text-gold">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-5 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-white/40">
                {t("footer.ourServices")}
              </h4>
              <ul className="space-y-3 text-sm text-white/65">
                {poles.map((p) => (
                  <li key={p.slug}>
                    <Link to={p.to} className="transition-colors hover:text-gold">
                      {t(`poles.${p.slug}.title`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-5 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-white/40">
                {t("footer.contactUs")}
              </h4>
              <ul className="space-y-4 text-sm text-white/65">
                <li className="flex items-start gap-3">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-gold" />
                  {site.address}
                </li>
                <li className="flex items-start gap-3">
                  <Phone size={16} className="mt-0.5 shrink-0 text-gold" />
                  <span className="flex flex-col gap-1">
                    {site.phones.map((p) => (
                      <a key={p.href} href={p.href} className="transition-colors hover:text-gold">
                        {p.label}
                      </a>
                    ))}
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <MessageCircle size={16} className="shrink-0 text-gold" />
                  <a
                    href={site.whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-gold"
                  >
                    WhatsApp {site.whatsapp}
                  </a>
                </li>
                {site.email && (
                  <li className="flex items-center gap-3">
                    <Mail size={16} className="shrink-0 text-gold" />
                    <a href={site.emailHref} className="transition-colors hover:text-gold">
                      {site.email}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 py-7">
            <p className="max-w-4xl text-[0.75rem] leading-relaxed text-white/35">
              {site.legalName} — {site.address}. {site.signature}
              {site.legal.niu && site.legal.rccm
                ? ` NIU : ${site.legal.niu} · RCCM : ${site.legal.rccm}.`
                : ""}
            </p>
            <div className="mt-5 flex flex-col gap-3 text-[0.75rem] text-white/40 md:flex-row md:items-center md:justify-between">
              <p>
                © {new Date().getFullYear()} {site.legalName}. {t("footer.rightsReserved")}
              </p>
              <div className="flex flex-wrap items-center gap-5">
                <Link to="/confidentialite" className="transition-colors hover:text-white">
                  {t("footer.privacy")}
                </Link>
                <Link to="/mentions-legales" className="transition-colors hover:text-white">
                  {t("footer.legalNotice")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
