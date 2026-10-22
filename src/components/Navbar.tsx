import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronDown, X } from "lucide-react";
import Logo from "./Logo";
import LanguageSwitcher from "./LanguageSwitcher";
import { site } from "../data/site";
import { poles } from "../data/poles";

type SubLink = { to: string; key: string };

export default function Navbar() {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const location = useLocation();

  const menus: { id: string; key: string; links: SubLink[] }[] = [
    {
      id: "immobilier",
      key: "properties",
      links: [
        { to: "/biens-a-vendre", key: "buy" },
        { to: "/biens-a-louer", key: "rent" },
        { to: "/biens-a-louer?saison=1", key: "seasonal" },
      ],
    },
    {
      id: "services",
      key: "services",
      links: [
        ...poles
          .filter((p) => p.slug !== "immobilier")
          .map((p) => ({ to: p.to, key: `poles.${p.slug}` })),
        { to: "/services", key: "allServices" },
      ],
    },
  ];

  const isSubActive = (to: string) => {
    const [path, query] = to.split("?");
    if (query) return location.pathname === path && location.search === `?${query}`;
    if (path === "/biens-a-louer" && location.search) return false;
    return path === "/vehicules-a-louer"
      ? location.pathname.startsWith("/vehicules")
      : location.pathname.startsWith(path);
  };

  const isMenuActive = (id: string) =>
    id === "immobilier"
      ? location.pathname.startsWith("/biens-") || location.pathname.startsWith("/proprietes")
      : menus.find((m) => m.id === id)!.links.some((l) => isSubActive(l.to));

  const subLabel = (key: string) =>
    key.startsWith("poles.") ? t(`${key}.title`) : t(`navbar.${key}`);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setMobileMenu(null);
    setOpenMenu(null);
  }, [location.pathname, location.search]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b bg-white transition-colors duration-300 ${
        scrolled ? "border-line" : "border-transparent"
      }`}
    >
      <div className="container-page">
        <div className="flex h-20 items-center justify-between">
          <Link to="/" aria-label={site.name}>
            <Logo showTagline={false} />
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `text-[0.875rem] transition-colors ${
                  isActive ? "font-semibold text-ink" : "text-slate hover:text-ink"
                }`
              }
            >
              {t("navbar.home")}
            </NavLink>

            {menus.map((menu) => {
              const active = isMenuActive(menu.id);
              const hovered = openMenu === menu.id;
              return (
                <div
                  key={menu.id}
                  className="relative"
                  onMouseEnter={() => setOpenMenu(menu.id)}
                  onMouseLeave={() => setOpenMenu(null)}
                >
                  <button
                    className={`flex items-center gap-1 text-[0.875rem] transition-colors ${
                      active ? "font-semibold text-ink" : "text-slate hover:text-ink"
                    }`}
                    aria-expanded={hovered}
                  >
                    {t(`navbar.${menu.key}`)}
                    <ChevronDown
                      size={13}
                      className={`transition-transform duration-200 ${hovered ? "rotate-180" : ""}`}
                    />
                  </button>

                  <div
                    className={`absolute left-0 top-full pt-4 transition-all duration-200 ${
                      hovered
                        ? "visible translate-y-0 opacity-100"
                        : "invisible -translate-y-1 opacity-0"
                    }`}
                  >
                    <div className="min-w-[220px] rounded-xl border border-line bg-white py-2">
                      {menu.links.map((sl) => (
                        <Link
                          key={sl.to}
                          to={sl.to}
                          className={`block px-5 py-2.5 text-[0.875rem] transition-colors ${
                            isSubActive(sl.to)
                              ? "font-medium text-ink"
                              : "text-slate hover:bg-cream hover:text-ink"
                          }`}
                        >
                          {subLabel(sl.key)}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            <NavLink
              to="/vehicules-a-louer"
              className={({ isActive }) =>
                `text-[0.875rem] transition-colors ${
                  isActive ? "font-semibold text-ink" : "text-slate hover:text-ink"
                }`
              }
            >
              {t("navbar.vehicles")}
            </NavLink>

            <NavLink
              to="/a-propos"
              className={({ isActive }) =>
                `text-[0.875rem] transition-colors ${
                  isActive ? "font-semibold text-ink" : "text-slate hover:text-ink"
                }`
              }
            >
              {t("navbar.about")}
            </NavLink>
          </nav>

          <div className="hidden items-center gap-4 lg:flex">
            <LanguageSwitcher />
            <Link to="/contact" className="btn btn-gold">
              {t("common.contactUs")}
            </Link>
          </div>

          <button
            className="flex h-11 w-11 items-center justify-center lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? t("navbar.closeMenu") : t("navbar.openMenu")}
          >
            {open ? (
              <X size={22} />
            ) : (
              <span className="flex w-5 flex-col gap-1.5">
                <span className="h-px w-full bg-ink" />
                <span className="h-px w-full bg-ink" />
                <span className="h-px w-full bg-ink" />
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      <div
        className={`fixed inset-0 top-20 z-40 overflow-y-auto bg-white transition-all duration-300 lg:hidden ${
          open ? "visible opacity-100" : "invisible -translate-y-2 opacity-0"
        }`}
      >
        <nav className="container-page flex flex-col py-8">
          <NavLink
            to="/"
            end
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `border-b border-line py-4 text-[0.95rem] ${
                isActive ? "font-semibold text-ink" : "text-slate"
              }`
            }
          >
            {t("navbar.home")}
          </NavLink>

          {menus.map((menu) => {
            const expanded = mobileMenu === menu.id;
            return (
              <div key={menu.id} className="border-b border-line">
                <button
                  onClick={() => setMobileMenu(expanded ? null : menu.id)}
                  aria-expanded={expanded}
                  className={`flex w-full items-center justify-between py-4 text-left text-[0.95rem] ${
                    isMenuActive(menu.id) ? "font-semibold text-ink" : "text-slate"
                  }`}
                >
                  {t(`navbar.${menu.key}`)}
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    expanded ? "max-h-96 pb-3" : "max-h-0"
                  }`}
                >
                  {menu.links.map((sl) => (
                    <Link
                      key={sl.to}
                      to={sl.to}
                      onClick={() => setOpen(false)}
                      className={`block py-2.5 pl-4 text-sm ${
                        isSubActive(sl.to) ? "text-gold-dark" : "text-slate"
                      }`}
                    >
                      {subLabel(sl.key)}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}

          <NavLink
            to="/a-propos"
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `border-b border-line py-4 text-[0.95rem] ${
                isActive ? "font-semibold text-ink" : "text-slate"
              }`
            }
          >
            {t("navbar.about")}
          </NavLink>

          <div className="flex items-center justify-between py-6">
            <LanguageSwitcher />
            <a href={site.phoneHref} className="text-sm font-medium text-ink">
              {site.phone}
            </a>
          </div>

          <Link to="/contact" onClick={() => setOpen(false)} className="btn btn-gold w-full">
            {t("common.contactUs")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
