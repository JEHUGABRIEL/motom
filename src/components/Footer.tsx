import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MapPin, Phone, Mail, MessageCircle } from "lucide-react";
import Logo from "./Logo";
import { site } from "../data/site";
import { poles } from "../data/poles";

const FacebookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z" />
  </svg>
);

const InstagramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const TikTokIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48Z" />
  </svg>
);

const YouTubeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.3 31.3 0 0 0 24 12a31.3 31.3 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45Z" />
  </svg>
);

const socialLinks = [
  { name: "Facebook", href: site.social.facebook, Icon: FacebookIcon },
  { name: "Instagram", href: site.social.instagram, Icon: InstagramIcon },
  { name: "TikTok", href: site.social.tiktok, Icon: TikTokIcon },
  { name: "YouTube", href: site.social.youtube, Icon: YouTubeIcon },
  { name: "LinkedIn", href: site.social.linkedin, Icon: LinkedInIcon },
].filter((l) => l.href);

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
    <footer className="bg-navy text-white">
      <div className="container-page py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <Logo variant="light" />

            <p className="text-sm text-white/60 mt-5 leading-relaxed">
              {t("footer.tagline", { name: site.legalName, city: site.city })}
            </p>
            <p className="text-sm font-semibold text-gold mt-3">{site.signature}</p>

            <div className="flex gap-3 mt-6">
              {socialLinks.map(({ name, href, Icon }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${name} ${site.shortName}`}
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-gold hover:text-navy hover:border-gold transition-colors"
                >
                  <Icon />
                </a>
              ))}
              <a
                href={site.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`WhatsApp ${site.shortName}`}
                className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-green hover:border-green transition-colors"
              >
                <MessageCircle size={16} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-display text-lg font-semibold mb-5">
              {t("footer.quickLinks")}
            </h4>
            <ul className="space-y-3 text-sm text-white/70">
              {quickLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="hover:text-gold transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display text-lg font-semibold mb-5">
              {t("footer.ourServices")}
            </h4>
            <ul className="space-y-3 text-sm text-white/70">
              {poles.map((p) => (
                <li key={p.slug}>
                  <Link to={p.to} className="hover:text-gold transition-colors">
                    {t(`poles.${p.slug}.title`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display text-lg font-semibold mb-5">
              {t("footer.contactUs")}
            </h4>
            <ul className="space-y-4 text-sm text-white/70">
              <li className="flex items-start gap-3">
                <MapPin size={17} className="text-gold mt-0.5 shrink-0" />
                {site.address}
              </li>
              <li className="flex items-start gap-3">
                <Phone size={17} className="text-gold shrink-0 mt-0.5" />
                <span className="flex flex-col gap-1">
                  {site.phones.map((p) => (
                    <a key={p.href} href={p.href} className="hover:text-gold transition-colors">
                      {p.label}
                    </a>
                  ))}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <MessageCircle size={17} className="text-gold shrink-0" />
                <a
                  href={site.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gold transition-colors"
                >
                  WhatsApp {site.whatsapp}
                </a>
              </li>
              {site.email && (
                <li className="flex items-center gap-3">
                  <Mail size={17} className="text-gold shrink-0" />
                  <a href={site.emailHref} className="hover:text-gold transition-colors">
                    {site.email}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 w-full">
            <p>
              © {new Date().getFullYear()} {site.legalName}. {t("footer.rightsReserved")}
            </p>
            <div className="flex items-center gap-4">
              <Link to="/confidentialite" className="hover:text-gold transition-colors">
                {t("footer.privacy")}
              </Link>
              <Link to="/mentions-legales" className="hover:text-gold transition-colors">
                {t("footer.legalNotice")}
              </Link>
            </div>
            {site.legal.niu && site.legal.rccm && (
              <p className="hidden lg:block">
                NIU : {site.legal.niu} · RCCM : {site.legal.rccm}
              </p>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}