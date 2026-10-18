import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ChevronDown,
  X,
  Home,
  Info,
  ShoppingBag,
  KeyRound,
  Phone,
  LayoutGrid,
  Sun,
} from "lucide-react";
import Logo from "./Logo";
import LanguageSwitcher from "./LanguageSwitcher";
import { site } from "../data/site";
import { poles } from "../data/poles";

type SubLink = { to: string; key: string; icon: React.ReactNode };

export default function Navbar() {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState<string | null>(null);
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const location = useLocation();

  const mainLinks = [
    { to: "/", key: "home", icon: <Home size={18} /> },
    { to: "/a-propos", key: "about", icon: <Info size={18} /> },
  ];

  const menus: {
    id: string;
    key: string;
    icon: React.ReactNode;
    links: SubLink[];
  }[] = [
    {
      id: "immobilier",
      key: "properties",
      icon: <Home size={18} />,
      links: [
        { to: "/biens-a-vendre", key: "buy", icon: <ShoppingBag size={14} /> },
        { to: "/biens-a-louer", key: "rent", icon: <KeyRound size={14} /> },
        { to: "/biens-a-louer?saison=1", key: "seasonal", icon: <Sun size={14} /> },
      ],
    },
    {
      id: "services",
      key: "services",
      icon: <LayoutGrid size={18} />,
      links: [
        ...poles
          .filter((p) => p.slug !== "immobilier")
          .map((p) => ({
            to: p.to,
            key: `poles.${p.slug}`,
            icon: <p.icon size={14} />,
          })),
        { to: "/services", key: "allServices", icon: <LayoutGrid size={14} /> },
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
      ? location.pathname.startsWith("/biens-") ||
        location.pathname.startsWith("/proprietes")
      : menus.find((m) => m.id === id)!.links.some((l) => isSubActive(l.to));

  // Sous-liens : clés du menu (navbar.*) ou titre d'un pôle (poles.*)
  const subLabel = (key: string) =>
    key.startsWith("poles.") ? t(`${key}.title`) : t(`navbar.${key}`);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setMobileMenu(null);
  }, [location.pathname]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 bg-white transition-shadow duration-300 ${
        scrolled ? "shadow-sm" : ""
      }`}
    >
      <div className="container-page">
        <div className="flex items-center justify-between h-20">
          <Link to="/">
            <Logo showTagline={false} />
          </Link>

          {}
          <nav className="hidden lg:flex items-center gap-8">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `relative text-sm font-medium tracking-wide transition-colors ${
                  isActive ? "text-navy" : "text-slate hover:text-navy"
                } after:content-[''] after:absolute after:-bottom-1.5 after:left-0 after:h-[2px] after:bg-gold after:transition-all ${
                  isActive ? "after:w-full" : "after:w-0 hover:after:w-full"
                }`
              }
            >
              {t("navbar.home")}
            </NavLink>

            {}
            {menus.map((menu) => {
              const active = isMenuActive(menu.id);
              const hovered = hoveredMenu === menu.id;
              return (
                <div
                  key={menu.id}
                  className="relative group"
                  onMouseEnter={() => setHoveredMenu(menu.id)}
                  onMouseLeave={() => setHoveredMenu(null)}
                >
                  <button
                    className={`relative text-sm font-medium tracking-wide transition-colors flex items-center gap-1 ${
                      active ? "text-navy" : "text-slate hover:text-navy"
                    } after:content-[''] after:absolute after:-bottom-1.5 after:left-0 after:h-[2px] after:bg-gold after:transition-all ${
                      active ? "after:w-full" : "after:w-0 group-hover:after:w-full"
                    }`}
                  >
                    {t(`navbar.${menu.key}`)}
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${
                        hovered ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <div
                    className={`absolute top-full left-1/2 -translate-x-1/2 pt-3 transition-all duration-200 ${
                      hovered
                        ? "opacity-100 visible translate-y-0"
                        : "opacity-0 invisible -translate-y-2"
                    }`}
                  >
                    <div className="bg-white rounded-xl shadow-[0_8px_32px_rgba(20,20,20,0.14)] border border-navy/5 py-2 min-w-[230px]">
                      {menu.links.map((sl) => (
                        <Link
                          key={sl.to}
                          to={sl.to}
                          className={`block px-5 py-2.5 text-sm font-medium transition-colors ${
                            isSubActive(sl.to)
                              ? "text-gold-dark bg-gold/5"
                              : "text-slate hover:text-navy hover:bg-navy/[0.02]"
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

            {}
            {mainLinks.filter((l) => l.to !== "/").map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `relative text-sm font-medium tracking-wide transition-colors ${
                    isActive ? "text-navy" : "text-slate hover:text-navy"
                  } after:content-[''] after:absolute after:-bottom-1.5 after:left-0 after:h-[2px] after:bg-gold after:transition-all ${
                    isActive ? "after:w-full" : "after:w-0 hover:after:w-full"
                  }`
                }
              >
                {t(`navbar.${l.key}`)}
              </NavLink>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              to="/contact"
              className="bg-gold hover:bg-gold-light text-navy font-semibold text-sm px-6 py-3 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-gold/20 active:scale-95"
            >
              {t("common.contactUs")}
            </Link>
          </div>

          {}
          <button
            className="lg:hidden relative w-11 h-11 flex items-center justify-center rounded-xl hover:bg-navy/5 transition-colors"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? t("navbar.closeMenu") : t("navbar.openMenu")}
          >
            <div className="relative w-5 h-5">
              <span
                className={`absolute left-0 h-[2px] w-full bg-navy rounded-full transition-all duration-300 ${
                  open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"
                }`}
              />
              <span
                className={`absolute left-0 h-[2px] w-full bg-navy rounded-full transition-all duration-300 ${
                  open ? "opacity-0 scale-0" : "top-1/2 -translate-y-1/2"
                }`}
              />
              <span
                className={`absolute left-0 h-[2px] w-full bg-navy rounded-full transition-all duration-300 ${
                  open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0"
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      {}
      <div
        className={`fixed inset-0 bg-navy/40 backdrop-blur-sm transition-all duration-300 z-40 ${
          open ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 transition-all duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 h-20 border-b border-navy/5">
          <Link to="/" onClick={() => setOpen(false)}>
            <Logo showTagline={false} />
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-navy/5 transition-colors"
            aria-label={t("navbar.closeMenu")}
          >
            <X size={22} />
          </button>
        </div>

        <nav className="px-6 py-8 flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-5rem)]">
          <NavLink
            to="/"
            end
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-gold/10 text-gold-dark font-semibold"
                  : "text-slate hover:bg-navy/[0.03] hover:text-navy"
              }`
            }
          >
            <span
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                location.pathname === "/"
                  ? "bg-gold/20 text-gold-dark"
                  : "bg-navy/5 text-slate"
              }`}
            >
              <Home size={18} />
            </span>
            {t("navbar.home")}
          </NavLink>

          {}
          {menus.map((menu) => {
            const active = isMenuActive(menu.id);
            const expanded = mobileMenu === menu.id;
            return (
              <div key={menu.id} className="px-4 py-1">
                <button
                  onClick={() => setMobileMenu(expanded ? null : menu.id)}
                  aria-expanded={expanded}
                  className={`flex items-center justify-between w-full text-sm font-medium transition-colors ${
                    active ? "text-gold-dark" : "text-slate hover:text-navy"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-navy/5 text-slate">
                      {menu.icon}
                    </span>
                    {t(`navbar.${menu.key}`)}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${
                      expanded ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    expanded ? "max-h-96 mt-2" : "max-h-0"
                  }`}
                >
                  <div className="ml-12 flex flex-col gap-0.5 border-l-2 border-gold/20 pl-3">
                    {menu.links.map((sl) => {
                      const subActive = isSubActive(sl.to);
                      return (
                        <Link
                          key={sl.to}
                          to={sl.to}
                          onClick={() => setOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                            subActive
                              ? "text-gold-dark bg-gold/5"
                              : "text-slate hover:text-navy hover:bg-navy/[0.02]"
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-md flex items-center justify-center ${
                              subActive ? "text-gold-dark" : "text-slate/60"
                            }`}
                          >
                            {sl.icon}
                          </span>
                          {subLabel(sl.key)}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {}
          <div className="my-3 h-px bg-gradient-to-r from-transparent via-navy/10 to-transparent" />

          {}
          {mainLinks.filter((l) => l.to !== "/").map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-gold/10 text-gold-dark font-semibold"
                    : "text-slate hover:bg-navy/[0.03] hover:text-navy"
                }`
              }
            >
              <span
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                  location.pathname === l.to ||
                  (l.to !== "/" && location.pathname.startsWith(l.to))
                    ? "bg-gold/20 text-gold-dark"
                    : "bg-navy/5 text-slate"
                }`}
              >
                {l.icon}
              </span>
              {t(`navbar.${l.key}`)}
            </NavLink>
          ))}

          {}
          <div className="px-4 pt-2">
            <LanguageSwitcher />
          </div>

          {}
          <div className="px-4 pt-1">
            <Link
              to="/contact"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 bg-gold hover:bg-gold-light text-navy font-semibold text-sm px-6 py-3.5 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-gold/20 active:scale-[0.98] w-full"
            >
              <Phone size={16} />
              {t("common.contactUs")}
            </Link>
          </div>

          <p className="mt-6 text-center text-[11px] text-slate/40 tracking-wide">
            {site.name} © {new Date().getFullYear()}
          </p>
        </nav>
      </div>
    </header>
  );
}