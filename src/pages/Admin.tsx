import { useState, useMemo, useEffect, useRef, useCallback, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Home,
  KeyRound,
  MapPin,
  LogOut,
  Plus,
  Edit3,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Upload,
  MessageSquare,
  Mail,
  Phone,
  User,
  Eye,
  CalendarDays,
  TrendingUp,
  DollarSign,
  PieChart,
  LayoutDashboard,
  Menu,
  Send,
  Reply,
  Link as LinkIcon,
  ArrowLeft as ArrowLeftIcon,
  ArrowRight as ArrowRightIcon,
  Car,
  CarFront,
  Sparkles,
  Megaphone,
  Wrench,
  HelpCircle,
  CheckSquare,
  Users,
  EyeOff,
  UserRound,
  Copy,
  ShieldCheck,
  ShieldX,
  Loader2,
  Star,
  Bell,
  Smartphone,
  Monitor,
  Laptop,
  Tablet,
  LogIn,
  Pause,
  Play,
} from "lucide-react";
import { formatPrice, type Property } from "../data/properties";
import { formatVehiclePrice, type Vehicle } from "../data/vehicles";
import {
  useProperties,
  useCreateProperty,
  useUpdateProperty,
  useDeleteProperty,
  useVehicles,
  useCreateVehicle,
  useUpdateVehicle,
  useDeleteVehicle,
  useServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
  useMessages,
  useCreateMessage,
  useUpdateMessage,
  useDeleteMessage,
  useStats,
  useFaqs,
  useCreateFaq,
  useUpdateFaq,
  useDeleteFaq,
  type Message,
  type Service,
  type Faq,
} from "../lib/api";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";
import { ToastProvider } from "../components/ToastProvider";
import { useToast } from "../components/toast-context";
import {
  openSignedUploadWidget,
  loadCloudinaryWidgetScript,
} from "../lib/cloudinary";
import {
  isoToDatetimeLocal,
  promoEndsAtToIso,
  isPromoExpired,
  formatPromoEnd,
} from "../lib/promo";

type Page =
  | "login"
  | "dashboard"
  | "properties-vente"
  | "properties-location"
  | "vehicles"
  | "vehicles-vente"
  | "vehicles-location"
  | "promos"
  | "services"
  | "faqs"
  | "messages"
  | "admins"
  | "reviews";

export type AdminProfile = {
  id: string;
  email: string;
  username: string | null;
  role: "superadmin" | "admin";
  avatar?: string;
};

export default function Admin() {
  const [page, setPage] = useState<Page>("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotDone, setForgotDone] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [error, setError] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [autoAddVehicle, setAutoAddVehicle] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [mfaPending, setMfaPending] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaError, setMfaError] = useState("");
  const [mfaBusy, setMfaBusy] = useState(false);
  const [mfaRecoveryMode, setMfaRecoveryMode] = useState(false);

  const navItems: { id: Page; label: string; icon: ReactNode; group?: string; superadminOnly?: boolean }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { id: "promos", label: "Promotions", icon: <Megaphone size={18} /> },
    { id: "properties-vente", label: "Biens à vendre", icon: <Home size={18} />, group: "Biens" },
    { id: "properties-location", label: "Biens à louer", icon: <KeyRound size={18} />, group: "Biens" },
    { id: "vehicles-vente", label: "Véhicules à vendre", icon: <Car size={18} />, group: "Véhicules" },
    { id: "vehicles-location", label: "Véhicules à louer", icon: <CarFront size={18} />, group: "Véhicules" },
    { id: "services", label: "Services", icon: <Wrench size={18} /> },
    { id: "faqs", label: "FAQ", icon: <HelpCircle size={18} /> },
    { id: "messages", label: "Messages", icon: <MessageSquare size={18} /> },
    { id: "admins", label: "Administrateurs", icon: <Users size={18} />, group: "Gestion" },
    { id: "reviews", label: "Avis", icon: <Star size={18} />, group: "Gestion" },
  ];

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((data: { authenticated?: boolean; admin?: AdminProfile | null }) => {
        if (data.authenticated) {
          setAuthenticated(true);
          setAdmin(data.admin ?? null);
          setPage("dashboard");
        }
      })
      .catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.mfaRequired) {
        
        setMfaPending(true);
        setMfaCode("");
        setMfaError("");
        setPassword("");
        return;
      }
      if (res.ok && data.success) {
        setAuthenticated(true);
        setAdmin(data.admin ?? null);
        setPage("dashboard");
      } else {
        setError(data.error || "Identifiant ou mot de passe incorrect");
      }
    } catch {
      setError("Erreur de connexion au serveur");
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaError("");
    setMfaBusy(true);
    try {
      const res = await fetch("/api/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: mfaRecoveryMode ? "recovery" : "verify",
          code: mfaCode,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setMfaPending(false);
        setMfaCode("");
        setAuthenticated(true);
        setAdmin(data.admin ?? null);
        setPage("dashboard");
      } else {
        setMfaError(data.error || "Code incorrect");
        setMfaCode("");
      }
    } catch {
      setMfaError("Erreur de connexion au serveur");
    } finally {
      setMfaBusy(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    try {
      const res = await fetch("/api/admins/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setForgotDone(true);
      } else {
        setForgotError(data.error || "Impossible d'envoyer le lien");
      }
    } catch {
      setForgotError("Erreur de connexion au serveur");
    }
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    fetch("/api/auth", { method: "DELETE" }).catch(() => {});
    setAuthenticated(false);
    setPage("login");
  };

  if (!authenticated && mfaPending) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gold flex items-center justify-center mx-auto mb-5 shadow-xl shadow-gold/20">
              <ShieldCheck size={28} className="text-navy" />
            </div>
            <h1 className="font-display font-bold text-white text-2xl">
              Vérification en deux étapes
            </h1>
            <p className="text-white/50 text-sm mt-2">
              {mfaRecoveryMode
                ? "Saisissez l'un de vos codes de secours"
                : "Saisissez le code affiché par votre application"}
            </p>
          </div>

          <form
            onSubmit={handleMfaSubmit}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/40 ring-1 ring-white/5 space-y-4"
          >
            <input
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              autoFocus
              autoComplete="one-time-code"
              inputMode={mfaRecoveryMode ? "text" : "numeric"}
              placeholder={mfaRecoveryMode ? "XXXXX-XXXXX" : "123456"}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-center text-white text-lg tracking-[0.3em] placeholder:text-white/25 placeholder:tracking-normal focus:outline-none focus:border-gold transition-all"
            />

            {mfaError && (
              <p className="text-red-300 text-sm text-center">{mfaError}</p>
            )}

            <button
              type="submit"
              disabled={mfaBusy || !mfaCode.trim()}
              className="w-full px-4 py-3 rounded-xl text-sm font-semibold bg-gold hover:bg-gold-light text-navy disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {mfaBusy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {mfaBusy ? "Vérification…" : "Valider"}
            </button>

            <div className="flex flex-col gap-2 pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setMfaRecoveryMode((v) => !v);
                  setMfaCode("");
                  setMfaError("");
                }}
                className="text-white/50 hover:text-gold text-xs transition-colors"
              >
                {mfaRecoveryMode
                  ? "Utiliser plutôt mon application d'authentification"
                  : "Je n'ai pas accès à mon application"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMfaPending(false);
                  setMfaRecoveryMode(false);
                  setMfaCode("");
                  setMfaError("");
                }}
                className="text-white/30 hover:text-white/60 text-xs transition-colors"
              >
                Revenir à la connexion
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gold flex items-center justify-center mx-auto mb-5 shadow-xl shadow-gold/20">
              <Building2 size={28} className="text-navy" />
            </div>
            <h1 className="font-display font-bold text-white text-2xl">
              Administration
            </h1>
            <p className="text-white/50 text-sm mt-2">
              MOTOM — Accès réservé
            </p>
          </div>

          {!forgotMode && (
          <form
            onSubmit={handleLogin}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/40 ring-1 ring-white/5 space-y-4"
          >
            <div>
              <label className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5 block">
                Email ou nom d'utilisateur
              </label>
              <div className="relative">
                <UserRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5 block">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Entrez le mot de passe"
                  className="w-full pl-4 pr-11 py-3 rounded-xl bg-white/10 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-white/30 hover:text-gold transition-colors"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setForgotMode(true);
                setForgotDone(false);
                setForgotError("");
              }}
              className="w-full text-center text-sm text-white/40 hover:text-gold transition-colors"
            >
              Mot de passe oublié ?
            </button>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-xl px-4 py-3">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-gold hover:bg-gold-light text-navy font-semibold py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-gold/20"
            >
              Se connecter
            </button>
          </form>
          )}

          {forgotMode && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/30">
              {forgotDone ? (
                <div className="text-center">
                  <CheckCircle2 size={28} className="text-green-400 mx-auto mb-3" />
                  <p className="text-sm text-white/70 leading-relaxed">
                    Si un compte existe pour cette adresse, un lien de réinitialisation vient d'être envoyé (valable 1 heure).
                  </p>
                  <button
                    onClick={() => setForgotMode(false)}
                    className="mt-5 w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-gold hover:bg-gold-light text-navy transition-all"
                  >
                    Retour à la connexion
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5 block">
                      Adresse email du compte
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="votre@email.com"
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
                      required
                      autoFocus
                    />
                  </div>
                  {forgotError && (
                    <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-xl px-4 py-3">
                      <AlertCircle size={16} />
                      {forgotError}
                    </div>
                  )}
                  <button
                    type="submit"
                    className="w-full bg-gold hover:bg-gold-light text-navy font-semibold py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-gold/20"
                  >
                    Envoyer le lien
                  </button>
                  <button
                    type="button"
                    onClick={() => setForgotMode(false)}
                    className="w-full text-center text-sm text-white/40 hover:text-white/60 transition-colors"
                  >
                    ← Retour à la connexion
                  </button>
                </form>
              )}
            </div>
          )}

          <Link
            to="/"
            className="block text-center text-white/30 text-xs mt-8 hover:text-white/50 transition-colors"
          >
            ← Retour au site
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
    <div className="min-h-screen bg-navy/95 flex">
      {}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-navy/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-gradient-to-b from-zinc-900 to-navy border-r border-white/[0.06] flex flex-col transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {}
        <div className="px-5 py-6 border-b border-white/[0.06]">
          <Link to="/" className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold to-amber-500 flex items-center justify-center text-navy font-bold text-sm shadow-lg shadow-gold/20">
              D
            </span>
            <div>
              <p className="font-display font-bold text-white text-sm leading-tight">
                MOTOM
              </p>
              <p className="text-[10px] text-white/30">Administration</p>
            </div>
          </Link>
        </div>

        {}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems
            .filter((item) => !item.superadminOnly || admin?.role === "superadmin")
            .map((item, i) => {
              const visibleItems = navItems.filter(
                (it) => !it.superadminOnly || admin?.role === "superadmin"
              );
              const isActive = page === item.id;
              const prev = i > 0 ? visibleItems[i - 1] : null;
              const showGroup = item.group && (!prev || prev.group !== item.group);
              return (
                <div key={item.id}>
                  {showGroup && (
                    <p className="px-3.5 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-white/25">
                      {item.group}
                    </p>
                  )}
                  <button
                    onClick={() => {
                      setPage(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                      isActive
                        ? "bg-gradient-to-r from-gold/15 to-gold/5 text-gold shadow-sm"
                        : "text-white/50 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <span className={`transition-colors duration-200 ${
                      isActive ? "text-gold" : "text-white/30 group-hover:text-white/60"
                    }`}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gold" />
                    )}
                  </button>
                </div>
              );
            })}
        </nav>

        {}
        <div className="px-3 py-4 border-t border-white/[0.06] space-y-1.5">
          {admin && (
            <div className="px-2 pb-2">
              <button
                onClick={() => setShowProfileModal(true)}
                className="w-full flex items-center gap-3 rounded-xl bg-white/[0.04] border border-white/[0.06] p-3 hover:border-gold/40 hover:bg-white/[0.07] transition-all group"
                title="Modifier mon profil"
              >
                {admin.avatar ? (
                  <img
                    src={admin.avatar}
                    alt={admin.username || "avatar"}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-gold/30 shrink-0"
                  />
                ) : (
                  <span className="w-9 h-9 rounded-full bg-gradient-to-br from-gold to-amber-500 flex items-center justify-center text-navy font-bold text-xs uppercase shrink-0">
                    {(admin.username || admin.email || "A").slice(0, 2)}
                  </span>
                )}
                <div className="min-w-0 text-left">
                  <p className="text-sm font-semibold text-white truncate">
                    {admin.username || admin.email}
                  </p>
                  <p className="text-[10px] text-white/40 truncate">
                    {admin.role === "superadmin" ? "Superadmin" : "Admin"} · Modifier
                  </p>
                </div>
                <Edit3 size={13} className="ml-auto text-white/20 group-hover:text-gold transition-colors" />
              </button>
            </div>
          )}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-red-400 hover:bg-red-400/[0.08] transition-all"
          >
            <LogOut size={16} />
            <span>Déconnexion</span>
          </button>
          <div className="px-3.5 pt-2">
            <p className="text-[10px] text-white/20">
              <PropertiesCount />
            </p>
          </div>
        </div>
      </aside>

      {}
      <ConfirmDialog
        open={showLogoutConfirm}
        title="Déconnexion"
        message="Voulez-vous vraiment vous déconnecter du panneau d'administration ?"
        confirmLabel="Se déconnecter"
        variant="danger"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          handleLogout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {}
        <header className="sticky top-0 z-30 lg:hidden bg-navy/80 backdrop-blur-xl border-b border-white/[0.06] px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-white text-sm">MOTOM</span>
            <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
              Admin
            </span>
          </div>
          <div className="w-9 h-9" /> {}
        </header>

        {}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {page === "dashboard" && (
            <Dashboard
              onNavigate={setPage}
              admin={admin}
              onAddVehicle={() => {
                setPage("vehicles-vente");
                setAutoAddVehicle(true);
              }}
            />
          )}
          {(page === "properties-vente" || page === "properties-location") && (
            <PropertiesList
              defaultType={page === "properties-vente" ? "Vente" : "Location"}
            />
          )}
          {(page === "vehicles-vente" || page === "vehicles-location") && (
            <VehiclesList
              defaultType={page === "vehicles-vente" ? "Vente" : "Location"}
              autoOpenAdd={autoAddVehicle}
              onAutoAddHandled={() => setAutoAddVehicle(false)}
            />
          )}
          {page === "promos" && <PromosList />}
          {page === "services" && <ServicesList />}
          {page === "faqs" && <FaqsList />}
          {page === "messages" && <MessagesSection />}
          {page === "admins" && <AdminsPage me={admin} />}
          {page === "reviews" && <ReviewsPage />}
        </main>
      </div>
      <MessagesWatcher />
      <NotificationsBell />
      <ProfileModal
        open={showProfileModal}
        admin={admin}
        onClose={() => setShowProfileModal(false)}
        onSaved={(updated) => {
          setAdmin((prev) => (prev ? { ...prev, ...updated } : prev));
          setShowProfileModal(false);
        }}
      />
    </div>
    </ToastProvider>
  );
}


function MessagesWatcher() {
  const { info } = useToast();
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch("/api/messages");
        if (!res.ok) return;
        const msgs = await res.json();
        if (cancelled) return;
        
        if (seenRef.current.size === 0) {
          msgs.forEach((m: Message) => seenRef.current.add(m.id));
          return;
        }
        const fresh = msgs.filter(
          (m: Message) => !seenRef.current.has(m.id) && !m.read
        );
        fresh.forEach((m: Message) => {
          seenRef.current.add(m.id);
          info(`📩 Nouveau message de ${m.name} — ${m.subject}`);
        });
      } catch {
        
      }
    };
    check();
    const interval = setInterval(check, 20000); 
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [info]);

  return null;
}


function PropertiesCount() {
  const { data } = useProperties();
  return <>{data?.length ?? 0} biens enregistrés</>;
}


function Dashboard({
  onNavigate,
  admin,
  onAddVehicle,
}: {
  onNavigate: (p: Page) => void;
  admin: AdminProfile | null;
  onAddVehicle: () => void;
}) {
  const { data: properties = [] } = useProperties();
  const { data: msgs = [] } = useMessages();
  const { data: serverStats } = useStats();
  const createProperty = useCreateProperty();
  const createMessage = useCreateMessage();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const total = properties.length;
  const sales = properties.filter((p) => p.type === "Vente").length;
  const rentals = properties.filter((p) => p.type === "Location").length;
  const cities = [...new Set(properties.map((p) => p.city))].length;
  const unread = msgs.filter((m) => !m.read).length;
  const totalValue = properties.reduce((s, p) => s + p.price, 0);
  const avgPrice = total > 0 ? Math.round(totalValue / total) : 0;

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const stats = [
    { label: "Total biens", value: total, icon: Building2, accent: "text-amber-400", bar: "from-amber-500 to-yellow-400", ring: "ring-amber-500/20", sub: `${cities} ville${cities > 1 ? "s" : ""} couverte${cities > 1 ? "s" : ""}` },
    { label: "À vendre", value: sales, icon: Home, accent: "text-emerald-400", bar: "from-emerald-500 to-green-400", ring: "ring-emerald-500/20", sub: total > 0 ? `${Math.round((sales / total) * 100)}% du portefeuille` : "—" },
    { label: "À louer", value: rentals, icon: KeyRound, accent: "text-blue-400", bar: "from-blue-500 to-cyan-400", ring: "ring-blue-500/20", sub: total > 0 ? `${Math.round((rentals / total) * 100)}% du portefeuille` : "—" },
    { label: "Messages non lus", value: unread, icon: MessageSquare, accent: "text-purple-400", bar: "from-purple-500 to-pink-400", ring: "ring-purple-500/20", sub: unread > 0 ? "À traiter" : "Boîte à jour" },
  ];

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    properties.forEach((p) => {
      map[p.category] = (map[p.category] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [properties]);

  const byCity = useMemo(() => {
    const map: Record<string, number> = {};
    properties.forEach((p) => {
      map[p.city] = (map[p.city] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [properties]);

  const topValue = useMemo(() => {
    return [...properties].sort((a, b) => b.price - a.price).slice(0, 4);
  }, [properties]);

  const recent = useMemo(() => {
    return [...properties].reverse().slice(0, 5);
  }, [properties]);

  const recentMsgs = useMemo(() => {
    return [...msgs]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 4);
  }, [msgs]);

  const typePct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
  const salesPct = typePct(sales);
  const rentalsPct = typePct(rentals);
  const maxCity = byCity[0]?.[1] ?? 1;

  
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = admin?.username || admin?.email?.split("@")[0] || "";
    const variants = [
      ["Bonjour", "content de vous revoir"],
      ["Bonjour", "ravi de vous accueillir"],
      ["Hello", "c'est toujours un plaisir"],
      ["Salut", "belle journée qui s'annonce"],
      ["Bonjour", "on se remet au travail ?"],
    ] as const;
    const night = [
      ["Bonsoir", "belle soirée en perspective"],
      ["Bonne nuit", "merci pour votre travail"],
      ["Bonsoir", "bienvenue à cette heure tardive"],
      ["Bonsoir", "heureux de vous voir"],
    ] as const;
    const pool = hour >= 19 || hour < 5 ? night : variants;
    
    const idx = Math.floor((Date.now() / 1000 / 15) % pool.length);
    const [salut, detail] = pool[idx];
    const emoji = hour >= 19 || hour < 5 ? "🌙" : "☀️";
    return { title: `${salut}${name ? ", " + name : ""} ${emoji}`, detail };
  }, [admin]);

  return (
    <div className="animate-fade-in">
      {}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-fade-up ${
          toast.type === "success"
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            : "bg-red-500/20 text-red-400 border border-red-500/30"
        }`}>
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-white text-2xl sm:text-3xl">
            {greeting.title}
          </h1>
          <p className="text-sm text-white/40 mt-1.5 capitalize">
            {greeting.detail} · {today}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <DollarSign size={15} className="text-gold" />
            <span className="text-xs text-white/50">
              Portefeuille : <span className="text-gold font-semibold">{(totalValue / 1_000_000).toFixed(0)} M FCFA</span>
            </span>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-gold hover:bg-gold-light text-navy font-semibold text-xs px-4 py-2.5 rounded-xl transition-all"
          >
            <Plus size={15} />
            Ajouter un bien
          </button>
        </div>
      </div>

      {}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => {
          const maxStat = Math.max(sales, rentals, 1);
          const share = s.label === "À vendre" ? sales / maxStat : s.label === "À louer" ? rentals / maxStat : 1;
          return (
            <div
              key={s.label}
              className="relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-300 group"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.04] ring-1 ${s.ring} ${s.accent}`}>
                  <s.icon size={20} />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">
                  KPI 0{i + 1}
                </span>
              </div>
              <p className="font-display font-bold text-white text-2xl sm:text-3xl tracking-tight tabular-nums">
                {s.value}
              </p>
              <p className="text-xs text-white/40 mt-1 font-medium">{s.label}</p>
              <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${s.bar} transition-all duration-700 ease-out`}
                  style={{ width: `${Math.max(share * 100, 8)}%` }}
                />
              </div>
              <p className="text-[10px] text-white/25 mt-2">{s.sub}</p>
            </div>
          );
        })}
      </div>

      {}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Total véhicules",
            value: serverStats?.vehicles.total ?? "—",
            icon: Car,
            accent: "text-sky-400",
            bar: "from-sky-500 to-cyan-400",
            ring: "ring-sky-500/20",
            sub: serverStats ? `${serverStats.vehicles.sale} à vendre · ${serverStats.vehicles.rental} à louer` : "Chargement…",
          },
          {
            label: "Véhicules en vedette",
            value: serverStats?.vehicles.featured ?? "—",
            icon: Sparkles,
            accent: "text-amber-400",
            bar: "from-amber-500 to-yellow-400",
            ring: "ring-amber-500/20",
            sub: "Mis en avant sur le site",
          },
          {
            label: "Avis clients",
            value: serverStats?.reviews.total ?? "—",
            icon: Star,
            accent: "text-rose-400",
            bar: "from-rose-500 to-pink-400",
            ring: "ring-rose-500/20",
            sub: serverStats ? `${serverStats.reviews.approved} publiés` : "Chargement…",
          },
          {
            label: "Avis en attente",
            value: serverStats?.reviews.pending ?? "—",
            icon: MessageSquare,
            accent: "text-orange-400",
            bar: "from-orange-500 to-amber-400",
            ring: "ring-orange-500/20",
            sub: serverStats && serverStats.reviews.pending > 0 ? "À modérer" : "Tout est à jour",
          },
        ].map((s, i) => (
          <div
            key={s.label}
            className="relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-300"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.04] ring-1 ${s.ring} ${s.accent}`}>
                <s.icon size={20} />
              </span>
            </div>
            <p className="font-display font-bold text-white text-2xl sm:text-3xl tracking-tight tabular-nums">
              {s.value}
            </p>
            <p className="text-xs text-white/40 mt-1 font-medium">{s.label}</p>
            <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
              <div className={`h-full rounded-full bg-gradient-to-r ${s.bar} transition-all duration-700 ease-out`} style={{ width: "100%" }} />
            </div>
            <p className="text-[10px] text-white/25 mt-2">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {}
        <div className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-gold/15 flex items-center justify-center">
                <PieChart size={14} className="text-gold" />
              </span>
              <h3 className="font-display font-semibold text-white text-sm">
                Performance du portefeuille
              </h3>
            </div>
            <button
              onClick={() => onNavigate("promos")}
              className="text-[11px] font-medium text-gold/70 hover:text-gold transition-colors"
            >
              Gérer les promotions →
            </button>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8">
            {}
            <div className="relative w-40 h-40 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
                {sales > 0 && (
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    stroke="#10b981" strokeWidth="3.5" strokeLinecap="round"
                    strokeDasharray={`${salesPct * 3.6} ${360 - salesPct * 3.6}`}
                    transform="rotate(-90 18 18)"
                  />
                )}
                {rentals > 0 && (
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    stroke="#3b82f6" strokeWidth="3.5" strokeLinecap="round"
                    strokeDasharray={`${rentalsPct * 3.6} ${360 - rentalsPct * 3.6}`}
                    strokeDashoffset={-salesPct * 3.6}
                    transform="rotate(-90 18 18)"
                  />
                )}
                <text x="18" y="17.5" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="5.5" fontWeight="bold">
                  {total}
                </text>
                <text x="18" y="22" textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.4)" fontSize="2.4">
                  biens
                </text>
              </svg>
            </div>

            {}
            <div className="flex-1 w-full space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/[0.07] border border-emerald-500/15">
                <span className="flex items-center gap-2.5 text-sm text-white/80">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  À vendre
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-sm text-white font-semibold tabular-nums">{sales}</span>
                  <span className="text-xs text-emerald-400 font-medium w-10 text-right">{salesPct}%</span>
                </span>
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-500/[0.07] border border-blue-500/15">
                <span className="flex items-center gap-2.5 text-sm text-white/80">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  À louer
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-sm text-white font-semibold tabular-nums">{rentals}</span>
                  <span className="text-xs text-blue-400 font-medium w-10 text-right">{rentalsPct}%</span>
                </span>
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="flex items-center gap-2.5 text-sm text-white/80">
                  <DollarSign size={14} className="text-gold" />
                  Prix moyen
                </span>
                <span className="text-xs text-white/60 font-medium tabular-nums">
                  {(avgPrice / 1_000_000).toFixed(1)} M FCFA
                </span>
              </div>
            </div>
          </div>

          {}
          <div className="mt-8 pt-6 border-t border-white/[0.06]">
            <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-4 flex items-center gap-2">
              <MapPin size={13} className="text-gold" />
              Biens par ville
            </p>
            <div className="space-y-3">
              {byCity.map(([city, count]) => {
                const pct = Math.round((count / maxCity) * 100);
                return (
                  <div key={city} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-xs text-white/60 truncate">{city}</span>
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-gold to-amber-400 transition-all duration-700"
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right text-xs text-white/40 font-mono tabular-nums">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {}
        <div className="space-y-6">
          {}
          <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center">
                  <MessageSquare size={14} className="text-purple-400" />
                </span>
                <h3 className="font-display font-semibold text-white text-sm">
                  Messages récents
                </h3>
              </div>
              {unread > 0 && (
                <span className="text-[10px] font-bold bg-gold/20 text-gold px-2 py-1 rounded-full">
                  {unread} non lu{unread > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="space-y-1.5">
              {recentMsgs.length === 0 ? (
                <p className="text-xs text-white/30 text-center py-6">Aucun message</p>
              ) : (
                recentMsgs.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onNavigate("messages")}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-all text-left"
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${m.read ? "bg-white/10" : "bg-gold"}`} />
                    <span className="min-w-0 flex-1">
                      <span className={`block text-xs truncate ${m.read ? "text-white/50" : "text-white font-medium"}`}>
                        {m.name}
                      </span>
                      <span className="block text-[10px] text-white/30 truncate">{m.subject}</span>
                    </span>
                    <span className="text-[10px] text-white/25 shrink-0">
                      {new Date(m.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </span>
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => onNavigate("messages")}
              className="w-full mt-3 text-center text-[11px] font-medium text-gold/70 hover:text-gold transition-colors"
            >
              Gérer les messages →
            </button>
          </div>

          {}
          <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <span className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <TrendingUp size={14} className="text-blue-400" />
              </span>
              <h3 className="font-display font-semibold text-white text-sm">
                Top biens par valeur
              </h3>
            </div>
            <div className="space-y-2">
              {topValue.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.03] transition-all"
                >
                  <span className="w-6 h-6 rounded-lg bg-white/[0.05] text-[10px] font-bold text-white/40 flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <img
                    src={p.image}
                    alt={p.title}
                    className="w-9 h-9 rounded-lg object-cover ring-1 ring-white/[0.06] shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-white font-medium truncate">{p.title}</p>
                    <p className="text-[10px] text-white/30">{p.city}</p>
                  </div>
                  <span className="text-[11px] text-gold font-medium shrink-0 tabular-nums">
                    {formatPrice(p.price, p.priceUnit)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {}
          <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <LayoutDashboard size={14} className="text-emerald-400" />
              </span>
              <h3 className="font-display font-semibold text-white text-sm">
                Actions rapides
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-3 py-3 rounded-xl bg-gold/15 text-gold text-xs font-medium hover:bg-gold/25 transition-all"
              >
                <Plus size={14} /> Ajouter un bien
              </button>
              <button
                onClick={() => setShowComposeModal(true)}
                className="flex items-center gap-2 px-3 py-3 rounded-xl bg-purple-500/15 text-purple-300 text-xs font-medium hover:bg-purple-500/25 transition-all"
              >
                <Send size={14} /> Nouveau message
              </button>
              <button
                onClick={onAddVehicle}
                className="flex items-center gap-2 px-3 py-3 rounded-xl bg-cyan-500/15 text-cyan-300 text-xs font-medium hover:bg-cyan-500/25 transition-all"
              >
                <Car size={14} /> Ajouter un véhicule
              </button>
              <button
                onClick={() => onNavigate("promos")}
                className="flex items-center gap-2 px-3 py-3 rounded-xl bg-blue-500/15 text-blue-300 text-xs font-medium hover:bg-blue-500/25 transition-all"
              >
                <Megaphone size={14} /> Promotions
              </button>
              <button
                onClick={() => onNavigate("reviews")}
                className="flex items-center gap-2 px-3 py-3 rounded-xl bg-white/[0.05] text-white/60 text-xs font-medium hover:bg-white/10 transition-all"
              >
                <Star size={14} /> Avis clients
              </button>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-6">
          <div className="flex items-center gap-2.5 mb-6">
            <span className="w-7 h-7 rounded-lg bg-gold/15 flex items-center justify-center">
              <PieChart size={14} className="text-gold" />
            </span>
            <h3 className="font-display font-semibold text-white text-sm">
              Répartition par catégorie
            </h3>
          </div>
          <div className="space-y-4">
            {byCategory.map(([cat, count]) => {
              const max = byCategory[0][1];
              const pct = Math.round((count / max) * 100);
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-white/70">{cat}</span>
                    <span className="text-xs text-white/40 font-mono">{count}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold to-amber-400 transition-all duration-700 ease-out"
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-6">
          <div className="flex items-center gap-2.5 mb-6">
            <span className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center">
              <TrendingUp size={14} className="text-blue-400" />
            </span>
            <h3 className="font-display font-semibold text-white text-sm">
              Derniers biens ajoutés
            </h3>
          </div>
          <div className="space-y-2">
            {recent.map((p, i) => (
              <div
                key={p.id}
                className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.03] transition-all"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="relative shrink-0">
                  <img
                    src={p.image}
                    alt={p.title}
                    className="w-11 h-11 rounded-lg object-cover ring-1 ring-white/[0.06]"
                  />
                  <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-navy ${
                    p.type === "Vente" ? "bg-emerald-500" : "bg-blue-500"
                  }`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white font-medium truncate group-hover:text-gold transition-colors">
                    {p.title}
                  </p>
                  <p className="text-[11px] text-white/40">
                    {p.type} · {p.city}
                  </p>
                </div>
                <span className="text-xs text-gold font-medium shrink-0 tabular-nums">
                  {formatPrice(p.price, p.priceUnit)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {}
      {showAddModal && (
        <PropertyFormModal
          onClose={() => setShowAddModal(false)}
          onSave={(prop) => {
            createProperty.mutate(prop, {
              onSuccess: () => showToast("success", "Bien ajouté avec succès"),
            });
            setShowAddModal(false);
          }}
        />
      )}
      {showComposeModal && (
        <MessageComposeModal
          onClose={() => setShowComposeModal(false)}
          onSend={(msg) => {
            createMessage.mutate(msg);
            setShowComposeModal(false);
          }}
        />
      )}
    </div>
  );
}


function PropertiesList({ defaultType = "all" }: { defaultType?: "all" | "Vente" | "Location" }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "Vente" | "Location">(defaultType);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const { data: list = [] } = useProperties();
  const createProperty = useCreateProperty();
  const updateProperty = useUpdateProperty();
  const deleteProperty = useDeleteProperty();

  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 5;

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = useMemo(() => {
    return list.filter((p) => {
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.neighborhood.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [list, typeFilter, search]);

  
  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PER_PAGE;
    return filtered.slice(start, start + PER_PAGE);
  }, [filtered, currentPage]);

  const handleDelete = (id: string) => {
    deleteProperty.mutate(id, {
      onSuccess: () => {
        setDeleteConfirm(null);
        showToast("success", "Bien supprimé avec succès");
      },
    });
  };

  const detailsProp = detailsId ? list.find((p) => p.id === detailsId) ?? null : null;
  if (detailsProp) {
    return (
      <PropertyDetailsModal
        property={detailsProp}
        onClose={() => setDetailsId(null)}
        onEdit={() => {
          setEditingId(detailsId);
          setDetailsId(null);
        }}
        onDelete={() => {
          setDeleteConfirm(detailsId);
          setDetailsId(null);
        }}
      />
    );
  }

  return (
    <div>
      {}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-fade-up ${
          toast.type === "success"
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            : "bg-red-500/20 text-red-400 border border-red-500/30"
        }`}>
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h2 className="font-display font-bold text-white text-2xl">
          Gestion des biens
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gold hover:bg-gold-light text-navy font-semibold text-sm px-5 py-2.5 rounded-xl transition-all"
        >
          <Plus size={16} />
          Ajouter un bien
        </button>
      </div>

      {}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par titre, ville ou quartier..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
        />
        <div className="flex gap-1.5">
          {(["all", "Vente", "Location"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                typeFilter === t
                  ? "bg-gold/20 text-gold"
                  : "bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              {t === "all" ? "Tous" : t}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-white/30 mb-4">
        {filtered.length} bien{filtered.length > 1 ? "s" : ""} sur {list.length}
      </p>

      {}
      <div className="bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4">
                  Bien
                </th>
                <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4 hidden md:table-cell">
                  Type
                </th>
                <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4 hidden md:table-cell">
                  Catégorie
                </th>
                <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4 hidden lg:table-cell">
                  Promo
                </th>
                <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4 hidden lg:table-cell">
                  Localisation
                </th>
                <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4 hidden xl:table-cell">
                  Ajouté le
                </th>
                <th className="text-right text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4">
                  Prix
                </th>
                <th className="text-right text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((p) => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image}
                        alt={p.title}
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate max-w-[200px]">
                          {p.title}
                        </p>
                        <p className="text-[11px] text-white/30">{p.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${
                      p.type === "Vente"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-blue-500/15 text-blue-400"
                    }`}>
                      {p.type}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-white/60 text-sm hidden md:table-cell">
                    {p.category}
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    {p.promo ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-gold/20 text-gold">
                        <Sparkles size={12} /> Promo
                      </span>
                    ) : (
                      <span className="text-xs text-white/25">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-white/60 text-sm hidden lg:table-cell">
                    {p.neighborhood}, {p.city}
                  </td>
                  <td className="px-5 py-4 text-white/40 text-xs hidden xl:table-cell">
                    {p.created_at ? formatDate(p.created_at) : "—"}
                  </td>
                  <td className="px-5 py-4 text-right text-gold text-sm font-medium">
                    {formatPrice(p.price, p.priceUnit)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setDetailsId(p.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-gold hover:bg-gold/10 transition-all"
                        title="Voir les détails"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => setEditingId(p.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-gold hover:bg-gold/10 transition-all"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(p.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-white/30 text-sm">
                    Aucun bien trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {}
      <Pagination
        currentPage={currentPage}
        totalItems={filtered.length}
        perPage={PER_PAGE}
        onPageChange={setCurrentPage}
      />

      {}
      {(showAddModal || editingId) && (
        <PropertyFormModal
          property={editingId ? list.find((p) => p.id === editingId) : undefined}
          onClose={() => {
            setShowAddModal(false);
            setEditingId(null);
          }}
          onSave={(prop) => {
            if (editingId) {
              updateProperty.mutate(prop, {
                onSuccess: () => showToast("success", "Bien modifié avec succès"),
              });
            } else {
              createProperty.mutate(prop, {
                onSuccess: () => showToast("success", "Bien ajouté avec succès"),
              });
            }
            setShowAddModal(false);
            setEditingId(null);
          }}
        />
      )}

      {}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-gradient-to-b from-navy-light to-navy-dark rounded-2xl border border-gold/20 p-8 max-w-sm w-full border-white/10">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-red-400/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={24} className="text-red-400" />
              </div>
              <h3 className="font-display font-semibold text-white text-lg mb-2">
                Confirmer la suppression
              </h3>
              <p className="text-sm text-white/50 mb-6">
                Cette action est irréversible. Voulez-vous vraiment supprimer ce bien ?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-all"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function MessagesSection() {
  const { data: msgs = [] } = useMessages();
  const createMessage = useCreateMessage();
  const updateMessage = useUpdateMessage();
  const deleteMessage = useDeleteMessage();

  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [msgPage, setMsgPage] = useState(1);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [deleteMsgConfirm, setDeleteMsgConfirm] = useState<string | null>(null);
  const MSGS_PER_PAGE = 10;

  const markAsRead = (id: string) => {
    updateMessage.mutate({ id, read: true });
    setSelectedMsg((prev) => prev ? { ...prev, read: true } : null);
  };

  const deleteMsg = (id: string) => {
    deleteMessage.mutate(id);
    if (selectedMsg?.id === id) setSelectedMsg(null);
  };

  const unreadCount = msgs.filter((m) => !m.read).length;
  const filtered = filter === "unread" ? msgs.filter((m) => !m.read) : msgs;

  
  useEffect(() => {
    setMsgPage(1);
  }, [filter]);

  const paginatedMsgs = useMemo(() => {
    const start = (msgPage - 1) * MSGS_PER_PAGE;
    return filtered.slice(start, start + MSGS_PER_PAGE);
  }, [filtered, msgPage]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h2 className="font-display font-bold text-white text-2xl">
          Messages{unreadCount > 0 ? ` (${unreadCount} non lu${unreadCount > 1 ? "s" : ""})` : ""}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowComposeModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gold/20 text-gold text-xs font-medium hover:bg-gold/30 transition-all"
          >
            <Send size={13} />
            Nouveau
          </button>
          {(["all", "unread"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                filter === f
                  ? "bg-gold/20 text-gold"
                  : "bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              {f === "all" ? "Tous" : `Non lus (${unreadCount})`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {}
        <div className="lg:col-span-3 bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-y-auto max-h-[540px]">
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-white/30 text-sm">
                Aucun message
              </div>
            ) : (
              paginatedMsgs.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedMsg(m);
                    if (!m.read) markAsRead(m.id);
                  }}
                  className={`w-full text-left px-5 py-4 border-b border-white/5 flex items-start gap-4 transition-colors hover:bg-white/[0.02] ${
                    selectedMsg?.id === m.id ? "bg-white/[0.04]" : ""
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                    m.read ? "bg-transparent" : "bg-gold"
                  }`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-sm truncate ${m.read ? "text-white/60" : "text-white font-medium"}`}>
                        {m.name}
                      </span>
                      <span className="text-[10px] text-white/30 shrink-0">
                        {new Date(m.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    <p className={`text-xs truncate ${m.read ? "text-white/40" : "text-white/70"}`}>
                      {m.subject}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
          {}
          <div className="hidden lg:block border-t border-white/5 px-5 py-3">
            <Pagination
              currentPage={msgPage}
              totalItems={filtered.length}
              perPage={MSGS_PER_PAGE}
              onPageChange={setMsgPage}
            />
          </div>
        </div>

        {}
        <div className="lg:col-span-2">
          {}
          <div className="lg:hidden mb-4">
            <Pagination
              currentPage={msgPage}
              totalItems={filtered.length}
              perPage={MSGS_PER_PAGE}
              onPageChange={setMsgPage}
            />
          </div>
          {selectedMsg ? (
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-semibold text-white text-sm">
                  Détail du message
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      updateMessage.mutate({ id: selectedMsg.id, read: !selectedMsg.read });
                      setSelectedMsg((prev) => prev ? { ...prev, read: !prev.read } : null);
                    }}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedMsg.read
                        ? "text-white/40 hover:text-gold hover:bg-gold/10"
                        : "text-gold bg-gold/15"
                    }`}
                  >
                    {selectedMsg.read ? "Marquer non lu" : "Lu"}
                  </button>
                  <button
                    onClick={() => setDeleteMsgConfirm(selectedMsg.id)}
                    className="text-white/30 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User size={15} className="text-gold mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-white/40">Nom</p>
                    <p className="text-sm text-white">{selectedMsg.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail size={15} className="text-gold mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-white/40">E-mail</p>
                    <a href={`mailto:${selectedMsg.email}`} className="text-sm text-gold hover:underline">
                      {selectedMsg.email}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone size={15} className="text-gold mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-white/40">Téléphone</p>
                    <p className="text-sm text-white">{selectedMsg.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MessageSquare size={15} className="text-gold mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-white/40">Sujet</p>
                    <p className="text-sm text-white font-medium">{selectedMsg.subject}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CalendarDays size={15} className="text-gold mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-white/40">Date</p>
                    <p className="text-sm text-white">
                      {new Date(selectedMsg.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10">
                  <p className="text-xs text-white/40 mb-2">Message</p>
                  <p className="text-sm text-white/80 leading-relaxed">{selectedMsg.message}</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <a
                    href={`mailto:${selectedMsg.email}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold/20 text-gold text-xs font-medium hover:bg-gold/30 transition-all"
                  >
                    <Mail size={14} />
                    Répondre
                  </a>
                  <button
                    onClick={() => {
                      setShowComposeModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/15 text-blue-400 text-xs font-medium hover:bg-blue-500/25 transition-all"
                  >
                    <Reply size={14} />
                    Nouveau message
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 flex items-center justify-center h-40">
              <p className="text-sm text-white/30">Sélectionnez un message</p>
            </div>
          )}
        </div>
      </div>
      {}
      <ConfirmDialog
        open={!!deleteMsgConfirm}
        title="Supprimer le message"
        message="Voulez-vous vraiment supprimer ce message ? Cette action est irréversible."
        confirmLabel="Supprimer"
        variant="danger"
        onConfirm={() => {
          if (deleteMsgConfirm) deleteMsg(deleteMsgConfirm);
          setDeleteMsgConfirm(null);
        }}
        onCancel={() => setDeleteMsgConfirm(null)}
      />

      {}
      {showComposeModal && (
        <MessageComposeModal
          onClose={() => setShowComposeModal(false)}
          onSend={(msg) => {
            createMessage.mutate(msg);
            setShowComposeModal(false);
          }}
        />
      )}
    </div>
  );
}


function MessageComposeModal({
  onClose,
  onSend,
}: {
  onClose: () => void;
  onSend: (msg: { name: string; email: string; phone: string; subject: string; message: string }) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      subject: form.subject,
      message: form.message,
    };
    onSend(msg);
  };

  return (
    <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto">
      <div className="bg-gradient-to-b from-navy-light to-navy-dark rounded-2xl border border-gold/20 p-6 max-w-lg w-full border-white/10 my-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-semibold text-white text-lg">
            Nouveau message
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                Nom
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-gold transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                Téléphone
              </label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-gold transition-all"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
              E-mail
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-gold transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
              Sujet
            </label>
            <input
              required
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-gold transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
              Message
            </label>
            <textarea
              required
              rows={4}
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-gold transition-all resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-[2] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-gold text-navy hover:bg-gold-light transition-all"
            >
              <Send size={14} />
              Envoyer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}





function PropertyFormModal({
  property,
  onClose,
  onSave,
}: {
  property?: Property;
  onClose: () => void;
  onSave: (property: Property) => void;
}) {
  const [form, setForm] = useState({
    title: property?.title || "",
    type: property?.type || "Vente" as const,
    seasonal: property?.priceUnit === "FCFA/nuit",
    category: property?.category || "Villa" as const,
    city: property?.city || "Bangui",
    neighborhood: property?.neighborhood || "",
    price: property?.price || 0,
    bedrooms: property?.bedrooms || 0,
    bathrooms: property?.bathrooms || 0,
    area: property?.area || 0,
    description: property?.description || "",
    features: property?.features.join(", ") || "",
    image: property?.image || "",
    gallery: property?.gallery?.length ? property.gallery : [],
    promo: property?.promo || false,
    promoEndsAt: isoToDatetimeLocal(property?.promoEndsAt),
  });
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    loadCloudinaryWidgetScript();
  }, []);

  const openCloudinaryUpload = async () => {
    if (!window.cloudinary) {
      alert("Le widget Cloudinary n'est pas encore chargé. Réessayez dans un instant.");
      return;
    }
    setUploading(true);
    try {
      await openSignedUploadWidget((url) => {
        setForm((f) => {
          const gallery = f.gallery.includes(url)
            ? f.gallery
            : [...f.gallery, url];
          return { ...f, image: gallery[0], gallery };
        });
      });
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      alert("Impossible d'initialiser l'upload (session expirée ?).");
    } finally {
      setUploading(false);
    }
  };

  const addImageUrl = () => {
    const url = prompt("Collez l'URL de l'image (https://…)");
    if (!url || !url.trim()) return;
    setForm((f) => {
      const gallery = f.gallery.includes(url.trim())
        ? f.gallery
        : [...f.gallery, url.trim()];
      return { ...f, image: gallery[0], gallery };
    });
  };

  const removeImage = (url: string) => {
    setForm((f) => {
      const gallery = f.gallery.filter((u) => u !== url);
      return { ...f, gallery, image: gallery[0] || "" };
    });
  };

  const moveImage = (index: number, dir: -1 | 1) => {
    setForm((f) => {
      const gallery = [...f.gallery];
      const target = index + dir;
      if (target < 0 || target >= gallery.length) return f;
      [gallery[index], gallery[target]] = [gallery[target], gallery[index]];
      return { ...f, gallery, image: gallery[0] };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mainImage = form.gallery[0] || form.image;
    if (!mainImage) {
      setFormError("Une photo est obligatoire pour publier ce bien. Ajoutez au moins une image.");
      return;
    }
    setFormError("");
    const features = form.features
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);
    const id = property?.id || `admin-${Date.now()}`;
    const newProp: Property = {
      id,
      title: form.title,
      type: form.type,
      category: form.category,
      city: form.city,
      neighborhood: form.neighborhood,
      price: form.price,
      priceUnit: form.type === "Vente" ? "FCFA" : form.seasonal ? "FCFA/nuit" : "FCFA/mois",
      bedrooms: form.bedrooms,
      bathrooms: form.bathrooms,
      area: form.area,
      featured: property?.featured || false,
      promo: form.promo,
      promoEndsAt: form.promo ? promoEndsAtToIso(form.promoEndsAt) : null,
      image: mainImage,
      gallery: form.gallery.length ? form.gallery : [mainImage],
      description: form.description,
      features,
    };
    onSave(newProp);
  };

  return (
    <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto">
      <div className="bg-gradient-to-b from-navy-light to-navy-dark rounded-2xl border border-gold/20 p-8 max-w-xl w-full border-white/10 my-8">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display font-semibold text-white text-lg">
            {property ? "Modifier le bien" : "Ajouter un bien"}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-[11px] text-white/30 mb-5">
          <span className="text-gold">*</span> champs obligatoires
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
              Titre <span className="text-gold">*</span>
            </label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-gold transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                Type
              </label>
              <select
                value={form.type === "Location" && form.seasonal ? "Saisonniere" : form.type}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm((f) => ({
                    ...f,
                    type: value === "Vente" ? "Vente" : "Location",
                    seasonal: value === "Saisonniere",
                  }));
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-gold transition-all bo-select"
              >
                <option value="Vente">Vente</option>
                <option value="Location">Location (loyer mensuel)</option>
                <option value="Saisonniere">Location saisonnière (à la nuit)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                Catégorie <span className="text-gold">*</span>
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Property["category"] }))}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-gold transition-all bo-select"
              >
                {["Villa", "Maison", "Appartement", "Terrain", "Bureau", "Studio"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                Ville <span className="text-gold">*</span>
              </label>
              <input
                required
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-gold transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                Quartier <span className="text-gold">*</span>
              </label>
              <input
                required
                value={form.neighborhood}
                onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-gold transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                Prix (FCFA) <span className="text-gold">*</span>
              </label>
              <input
                type="number"
                required
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-gold transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                Pièces
              </label>
              <input
                type="number"
                value={form.bedrooms}
                onChange={(e) => setForm((f) => ({ ...f, bedrooms: Number(e.target.value) }))}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-gold transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                Salles de bain
              </label>
              <input
                type="number"
                value={form.bathrooms}
                onChange={(e) => setForm((f) => ({ ...f, bathrooms: Number(e.target.value) }))}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-gold transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                Surface m²
              </label>
              <input
                type="number"
                required
                value={form.area}
                onChange={(e) => setForm((f) => ({ ...f, area: Number(e.target.value) }))}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-gold transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
              Description
            </label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-gold transition-all resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
              Caractéristiques (séparées par des virgules)
            </label>
            <input
              value={form.features}
              onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))}
              placeholder="Piscine, Garage, Jardin..."
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gold transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
              Photos <span className="text-gold">*</span> ({form.gallery.length || 0}) — la première est l'image principale
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                type="button"
                onClick={openCloudinaryUpload}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold/20 text-gold text-sm font-medium hover:bg-gold/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                <Upload size={15} />
                {uploading ? "..." : "Ajouter des photos"}
              </button>
              <button
                type="button"
                onClick={addImageUrl}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 text-white/60 text-sm font-medium hover:bg-white/10 transition-all"
              >
                <LinkIcon size={15} />
                Coller une URL
              </button>
            </div>
            {form.gallery.length === 0 ? (
              <p className="text-xs text-white/25">
                Aucune photo. Ajoutez-en via Cloudinary ou par URL — une propriété peut avoir une ou plusieurs images.
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {form.gallery.map((url, i) => (
                  <div
                    key={url}
                    className="relative group aspect-[4/3] rounded-xl overflow-hidden bg-white/5 border border-white/10"
                  >
                    <img
                      src={url}
                      alt={`Photo ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {i === 0 && (
                      <span className="absolute top-1.5 left-1.5 text-[9px] font-bold uppercase tracking-wide bg-gold text-navy px-1.5 py-0.5 rounded-md">
                        Principale
                      </span>
                    )}
                    <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/40 transition-all" />
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 p-1.5 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        type="button"
                        onClick={() => moveImage(i, -1)}
                        disabled={i === 0}
                        className="w-7 h-7 rounded-lg bg-white/90 text-navy flex items-center justify-center hover:bg-gold transition-colors disabled:opacity-30"
                        title="Déplacer avant"
                      >
                        <ArrowLeftIcon size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(i, 1)}
                        disabled={i === form.gallery.length - 1}
                        className="w-7 h-7 rounded-lg bg-white/90 text-navy flex items-center justify-center hover:bg-gold transition-colors disabled:opacity-30"
                        title="Déplacer après"
                      >
                        <ArrowRightIcon size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(url)}
                        className="w-7 h-7 rounded-lg bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          
          <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-gold/10 border border-gold/25">
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="checkbox"
                aria-checked={form.promo}
                onClick={() => setForm((f) => ({ ...f, promo: !f.promo }))}
                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                  form.promo
                    ? "bg-gold border-gold text-navy"
                    : "border-white/30 text-transparent hover:border-gold"
                }`}
              >
                <CheckSquare size={15} />
              </button>
              <div>
                <p className="text-sm font-semibold text-gold">
                  Mettre ce bien en promo
                </p>
                <p className="text-xs text-white/50">
                  Il apparaîtra dans le bandeau promo du site public.
                </p>
              </div>
            </div>
            {form.promo && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide bg-gold text-navy px-2.5 py-1 rounded-lg shrink-0">
                <Megaphone size={12} /> Promo
              </span>
            )}
          </div>
          {form.promo && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                Fin de la promo (facultatif)
              </label>
              <input
                type="datetime-local"
                value={form.promoEndsAt}
                onChange={(e) => setForm((f) => ({ ...f, promoEndsAt: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-gold transition-all [color-scheme:dark]"
              />
              <p className="text-[11px] text-white/30 mt-1.5">
                Laissez vide pour une promo sans limite de durée. Une fois la date passée, la
                promo sera désactivée automatiquement.
              </p>
            </div>
          )}

          {formError && (
            <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/25 text-red-400 text-xs rounded-xl px-4 py-3">
              <AlertCircle size={15} />
              {formError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-[2] px-4 py-2.5 rounded-xl text-sm font-medium bg-gold text-navy hover:bg-gold-light transition-all"
            >
              {property ? "Enregistrer les modifications" : "Ajouter le bien"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


function VehiclesList({
  defaultType = "all",
  autoOpenAdd = false,
  onAutoAddHandled,
}: {
  defaultType?: "all" | "Vente" | "Location";
  autoOpenAdd?: boolean;
  onAutoAddHandled?: () => void;
}) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "Vente" | "Location">(defaultType);
  const [showAddModal, setShowAddModal] = useState(autoOpenAdd);

  const autoAddHandledRef = useRef(false);
  useEffect(() => {
    if (!autoOpenAdd || autoAddHandledRef.current) return;
    autoAddHandledRef.current = true;
    setShowAddModal(true);
    onAutoAddHandled?.();
  }, [autoOpenAdd, onAutoAddHandled]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const { data: list = [] } = useVehicles();
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();
  const deleteVehicle = useDeleteVehicle();

  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 5;

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = useMemo(() => {
    return list.filter((v) => {
      if (typeFilter !== "all" && v.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          v.name.toLowerCase().includes(q) ||
          v.brand.toLowerCase().includes(q) ||
          v.city.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [list, typeFilter, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PER_PAGE;
    return filtered.slice(start, start + PER_PAGE);
  }, [filtered, currentPage]);

  const handleDelete = (id: string) => {
    deleteVehicle.mutate(id, {
      onSuccess: () => {
        setDeleteConfirm(null);
        showToast("success", "Véhicule supprimé avec succès");
      },
    });
  };

  const detailsVehicle = detailsId ? list.find((v) => v.id === detailsId) ?? null : null;
  if (detailsVehicle) {
    return (
      <VehicleDetailsModal
        vehicle={detailsVehicle}
        onClose={() => setDetailsId(null)}
        onEdit={() => {
          setEditingId(detailsId);
          setDetailsId(null);
        }}
        onDelete={() => {
          setDeleteConfirm(detailsId);
          setDetailsId(null);
        }}
      />
    );
  }

  return (
    <div>
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-fade-up ${
          toast.type === "success"
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            : "bg-red-500/20 text-red-400 border border-red-500/30"
        }`}>
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h2 className="font-display font-bold text-white text-2xl">
          Gestion des véhicules
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gold hover:bg-gold-light text-navy font-semibold text-sm px-5 py-2.5 rounded-xl transition-all"
        >
          <Plus size={16} />
          Ajouter un véhicule
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom, marque ou ville..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
        />
        <div className="flex gap-1.5">
          {(["all", "Vente", "Location"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                typeFilter === t
                  ? "bg-gold/20 text-gold"
                  : "bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              {t === "all" ? "Tous" : t}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-white/30 mb-4">
        {filtered.length} véhicule{filtered.length > 1 ? "s" : ""} sur {list.length}
      </p>

      <div className="bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4">Véhicule</th>
                <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4 hidden md:table-cell">Type</th>
                <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4 hidden md:table-cell">Catégorie</th>
                <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4 hidden lg:table-cell">Promo</th>
                <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4 hidden xl:table-cell">Ajouté le</th>
                <th className="text-right text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4">Prix</th>
                <th className="text-right text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((v) => (
                <tr key={v.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img src={v.image} alt={v.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate max-w-[200px]">{v.name}</p>
                        <p className="text-[11px] text-white/30">{v.brand} — {v.year}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${
                      v.type === "Vente" ? "bg-emerald-500/15 text-emerald-400" : "bg-blue-500/15 text-blue-400"
                    }`}>
                      {v.type}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-white/60 text-sm hidden md:table-cell">{v.category}</td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    {v.promo ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-gold/20 text-gold">
                        <Sparkles size={12} /> Promo
                      </span>
                    ) : (
                      <span className="text-xs text-white/25">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-white/40 text-xs hidden xl:table-cell">
                    {v.created_at ? formatDate(v.created_at) : "—"}
                  </td>
                  <td className="px-5 py-4 text-right text-gold text-sm font-medium">
                    {formatVehiclePrice(v.price, v.priceUnit)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setDetailsId(v.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-gold hover:bg-gold/10 transition-all"
                        title="Voir les détails"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => setEditingId(v.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-gold hover:bg-gold/10 transition-all"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(v.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-white/30 text-sm">Aucun véhicule trouvé</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalItems={filtered.length}
        perPage={PER_PAGE}
        onPageChange={setCurrentPage}
      />

      {(showAddModal || editingId) && (
        <VehicleFormModal
          vehicle={editingId ? list.find((v) => v.id === editingId) : undefined}
          onClose={() => {
            setShowAddModal(false);
            setEditingId(null);
          }}
          onSave={(v) => {
            if (editingId) {
              updateVehicle.mutate(v, { onSuccess: () => showToast("success", "Véhicule modifié avec succès") });
            } else {
              createVehicle.mutate(v, { onSuccess: () => showToast("success", "Véhicule ajouté avec succès") });
            }
            setShowAddModal(false);
            setEditingId(null);
          }}
        />
      )}      {deleteConfirm && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-gradient-to-b from-navy-light to-navy-dark rounded-2xl border border-gold/20 p-8 max-w-sm w-full border-white/10">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-red-400/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={24} className="text-red-400" />
              </div>
              <h3 className="font-display font-semibold text-white text-lg mb-2">
                Confirmer la suppression
              </h3>
              <p className="text-sm text-white/50 mb-6">
                Cette action est irréversible. Voulez-vous vraiment supprimer ce véhicule ?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all">Annuler</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-all">Supprimer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function VehicleFormModal({
  vehicle,
  onClose,
  onSave,
}: {
  vehicle?: Vehicle;
  onClose: () => void;
  onSave: (vehicle: Vehicle) => void;
}) {
  const [form, setForm] = useState({
    name: vehicle?.name || "",
    brand: vehicle?.brand || "",
    type: vehicle?.type || ("Location" as const),
    category: vehicle?.category || ("SUV / 4x4" as const),
    year: vehicle?.year || new Date().getFullYear(),
    seats: vehicle?.seats || 5,
    transmission: vehicle?.transmission || ("Automatique" as const),
    fuel: vehicle?.fuel || ("Diesel" as const),
    mileage: vehicle?.mileage?.toString() || "",
    price: vehicle?.price || 0,
    city: vehicle?.city || "Bangui",
    description: vehicle?.description || "",
    features: vehicle?.features.join(", ") || "",
    withDriver: vehicle?.withDriver || false,
    available: vehicle?.available !== false,
    promo: vehicle?.promo || false,
    promoEndsAt: isoToDatetimeLocal(vehicle?.promoEndsAt),
    gallery: vehicle?.gallery?.length ? vehicle.gallery : vehicle?.image ? [vehicle.image] : [],
  });
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    loadCloudinaryWidgetScript();
  }, []);

  const openCloudinaryUpload = async () => {
    if (!window.cloudinary) {
      alert("Le widget Cloudinary n'est pas encore chargé. Réessayez dans un instant.");
      return;
    }
    setUploading(true);
    try {
      await openSignedUploadWidget((url) => {
        setForm((f) => {
          const gallery = f.gallery.includes(url) ? f.gallery : [...f.gallery, url];
          return { ...f, gallery };
        });
      });
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      alert("Impossible d'initialiser l'upload (session expirée ?).");
    } finally {
      setUploading(false);
    }
  };

  const addImageUrl = () => {
    const url = prompt("Collez l'URL de l'image (https://…)");
    if (!url || !url.trim()) return;
    setForm((f) => {
      const gallery = f.gallery.includes(url.trim()) ? f.gallery : [...f.gallery, url.trim()];
      return { ...f, gallery };
    });
  };

  const removeImage = (url: string) => {
    setForm((f) => ({ ...f, gallery: f.gallery.filter((u) => u !== url) }));
  };

  const moveImage = (index: number, dir: -1 | 1) => {
    setForm((f) => {
      const gallery = [...f.gallery];
      const target = index + dir;
      if (target < 0 || target >= gallery.length) return f;
      [gallery[index], gallery[target]] = [gallery[target], gallery[index]];
      return { ...f, gallery };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mainImage = form.gallery[0];
    if (!mainImage) {
      setFormError("Une photo est obligatoire pour publier ce véhicule. Ajoutez au moins une image.");
      return;
    }
    setFormError("");
    const features = form.features.split(",").map((x) => x.trim()).filter(Boolean);
    const id = vehicle?.id || `admin-${Date.now()}`;
    const newVehicle: Vehicle = {
      id,
      name: form.name,
      brand: form.brand,
      type: form.type,
      category: form.category,
      year: form.year,
      seats: form.seats,
      transmission: form.transmission,
      fuel: form.fuel,
      mileage: form.mileage ? Number(form.mileage) : undefined,
      price: form.price,
      priceUnit: form.type === "Location" ? "FCFA/jour" : "FCFA",
      city: form.city,
      featured: vehicle?.featured || false,
      promo: form.promo,
      promoEndsAt: form.promo ? promoEndsAtToIso(form.promoEndsAt) : null,
      available: form.available,
      withDriver: form.withDriver,
      image: mainImage,
      gallery: form.gallery.length ? form.gallery : [mainImage],
      description: form.description,
      features,
    };
    onSave(newVehicle);
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl bg-navy-light/60 border border-white/10 text-sm text-white focus:outline-none focus:border-gold transition-all";
  const labelCls = "text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block";

  return (
    <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto">
      <div className="bg-gradient-to-b from-navy-light to-navy-dark rounded-2xl border border-gold/20 p-8 max-w-2xl w-full border-white/10 my-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-semibold text-white text-lg">
            {vehicle ? "Modifier le véhicule" : "Ajouter un véhicule"}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>
        <p className="text-[11px] text-white/30 mb-5">
          <span className="text-gold">*</span> champs obligatoires
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Nom <span className="text-gold">*</span></label>
              <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Marque <span className="text-gold">*</span></label>
              <input required value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className={labelCls}>Type</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "Vente" | "Location" }))} className={`${inputCls} bo-select`}>
                <option value="Location">Location</option>
                <option value="Vente">Vente</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Catégorie</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Vehicle["category"] }))} className={`${inputCls} bo-select`}>
                {["SUV / 4x4", "Pick-up", "Berline", "Citadine", "Minibus", "Utilitaire"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Année</label>
              <input type="number" value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Places</label>
              <input type="number" value={form.seats} onChange={(e) => setForm((f) => ({ ...f, seats: Number(e.target.value) }))} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className={labelCls}>Boîte</label>
              <select value={form.transmission} onChange={(e) => setForm((f) => ({ ...f, transmission: e.target.value as "Automatique" | "Manuelle" }))} className={`${inputCls} bo-select`}>
                <option value="Automatique">Automatique</option>
                <option value="Manuelle">Manuelle</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Carburant</label>
              <select value={form.fuel} onChange={(e) => setForm((f) => ({ ...f, fuel: e.target.value as "Diesel" | "Essence" }))} className={`${inputCls} bo-select`}>
                <option value="Diesel">Diesel</option>
                <option value="Essence">Essence</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Kilométrage (km)</label>
              <input type="number" value={form.mileage} onChange={(e) => setForm((f) => ({ ...f, mileage: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Prix (FCFA) <span className="text-gold">*</span></label>
              <input type="number" required value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Ville <span className="text-gold">*</span></label>
            <input required value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea required rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={`${inputCls} resize-none`} />
          </div>

          <div>
            <label className={labelCls}>Équipements (séparés par des virgules)</label>
            <input value={form.features} onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))} placeholder="Climatisation, GPS, Bluetooth..." className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:border-gold/40 transition-all">
              <button
                type="button"
                role="checkbox"
                aria-checked={form.withDriver}
                onClick={() => setForm((f) => ({ ...f, withDriver: !f.withDriver }))}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                  form.withDriver ? "bg-gold border-gold text-navy" : "border-white/30 text-transparent"
                }`}
              >
                <CheckSquare size={13} />
              </button>
              <span className="text-sm text-white/70">Avec chauffeur</span>
            </label>
            <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:border-gold/40 transition-all">
              <button
                type="button"
                role="checkbox"
                aria-checked={form.available}
                onClick={() => setForm((f) => ({ ...f, available: !f.available }))}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                  form.available ? "bg-gold border-gold text-navy" : "border-white/30 text-transparent"
                }`}
              >
                <CheckSquare size={13} />
              </button>
              <span className="text-sm text-white/70">Disponible</span>
            </label>
          </div>

          <div>
            <label className={labelCls}>Photos <span className="text-gold">*</span> ({form.gallery.length}) — la première est l'image principale</label>
            <div className="flex flex-wrap gap-2 mb-3">
              <button type="button" onClick={openCloudinaryUpload} disabled={uploading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold/20 text-gold text-sm font-medium hover:bg-gold/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0">
                <Upload size={15} />
                {uploading ? "..." : "Ajouter des photos"}
              </button>
              <button type="button" onClick={addImageUrl}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 text-white/60 text-sm font-medium hover:bg-white/10 transition-all">
                <LinkIcon size={15} />
                Coller une URL
              </button>
            </div>
            {form.gallery.length === 0 ? (
              <p className="text-xs text-white/25">Aucune photo. Ajoutez-en via Cloudinary ou par URL — un véhicule peut avoir une ou plusieurs images.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {form.gallery.map((url, i) => (
                  <div key={url} className="relative group aspect-[4/3] rounded-xl overflow-hidden bg-white/5 border border-white/10">
                    <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                    {i === 0 && (
                      <span className="absolute top-1.5 left-1.5 text-[9px] font-bold uppercase tracking-wide bg-gold text-navy px-1.5 py-0.5 rounded-md">Principale</span>
                    )}
                    <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/40 transition-all" />
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 p-1.5 opacity-0 group-hover:opacity-100 transition-all">
                      <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0}
                        className="w-7 h-7 rounded-lg bg-white/90 text-navy flex items-center justify-center hover:bg-gold transition-colors disabled:opacity-30" title="Déplacer avant">
                        <ArrowLeftIcon size={13} />
                      </button>
                      <button type="button" onClick={() => moveImage(i, 1)} disabled={i === form.gallery.length - 1}
                        className="w-7 h-7 rounded-lg bg-white/90 text-navy flex items-center justify-center hover:bg-gold transition-colors disabled:opacity-30" title="Déplacer après">
                        <ArrowRightIcon size={13} />
                      </button>
                      <button type="button" onClick={() => removeImage(url)}
                        className="w-7 h-7 rounded-lg bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors" title="Supprimer">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          
          <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-gold/10 border border-gold/25">
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="checkbox"
                aria-checked={form.promo}
                onClick={() => setForm((f) => ({ ...f, promo: !f.promo }))}
                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                  form.promo ? "bg-gold border-gold text-navy" : "border-white/30 text-transparent hover:border-gold"
                }`}
              >
                <CheckSquare size={15} />
              </button>
              <div>
                <p className="text-sm font-semibold text-gold">Mettre ce véhicule en promo</p>
                <p className="text-xs text-white/50">Il apparaîtra dans le bandeau promo du site public.</p>
              </div>
            </div>
            {form.promo && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide bg-gold text-navy px-2.5 py-1 rounded-lg shrink-0">
                <Megaphone size={12} /> Promo
              </span>
            )}
          </div>
          {form.promo && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                Fin de la promo (facultatif)
              </label>
              <input
                type="datetime-local"
                value={form.promoEndsAt}
                onChange={(e) => setForm((f) => ({ ...f, promoEndsAt: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-gold transition-all [color-scheme:dark]"
              />
              <p className="text-[11px] text-white/30 mt-1.5">
                Laissez vide pour une promo sans limite de durée. Une fois la date passée, la
                promo sera désactivée automatiquement.
              </p>
            </div>
          )}

          {formError && (
            <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/25 text-red-400 text-xs rounded-xl px-4 py-3">
              <AlertCircle size={15} />
              {formError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all">Annuler</button>
            <button type="submit" className="flex-[2] px-4 py-2.5 rounded-xl text-sm font-medium bg-gold text-navy hover:bg-gold-light transition-all">
              {vehicle ? "Enregistrer les modifications" : "Ajouter le véhicule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


function ServicesList() {
  const { data: list = [] } = useServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = (id: string) => {
    deleteService.mutate(id, {
      onSuccess: () => {
        setDeleteConfirm(null);
        showToast("success", "Service supprimé avec succès");
      },
    });
  };

  const toggleActive = (s: Service) => {
    updateService.mutate({ ...s, active: !s.active });
  };

  return (
    <div>
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-fade-up ${
          toast.type === "success" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
        }`}>
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h2 className="font-display font-bold text-white text-2xl">Gestion des services</h2>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gold hover:bg-gold-light text-navy font-semibold text-sm px-5 py-2.5 rounded-xl transition-all">
          <Plus size={16} />
          Ajouter un service
        </button>
      </div>

      <p className="text-xs text-white/30 mb-4">{list.length} service{list.length > 1 ? "s" : ""} — les services actifs s'affichent sur la page Services du site.</p>

      <div className="bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4">Service</th>
                <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4 hidden md:table-cell">Points</th>
                <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4">Statut</th>
                <th className="text-right text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-white text-sm font-medium">{s.title}</p>
                    <p className="text-[11px] text-white/30 max-w-xs truncate">{s.text}</p>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-xs text-white/50">{s.points.length} point{s.points.length > 1 ? "s" : ""}</span>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => toggleActive(s)}
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        s.active ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25" : "bg-white/5 text-white/40 hover:bg-white/10"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${s.active ? "bg-emerald-400" : "bg-white/25"}`} />
                      {s.active ? "Actif" : "Inactif"}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setEditingId(s.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-gold hover:bg-gold/10 transition-all">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => setDeleteConfirm(s.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-white/30 text-sm">Aucun service pour le moment</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(showAddModal || editingId) && (
        <ServiceFormModal
          service={editingId ? list.find((s) => s.id === editingId) : undefined}
          onClose={() => { setShowAddModal(false); setEditingId(null); }}
          onSave={(s) => {
            if (editingId) {
              updateService.mutate(s, { onSuccess: () => showToast("success", "Service modifié avec succès") });
            } else {
              createService.mutate(s, { onSuccess: () => showToast("success", "Service ajouté avec succès") });
            }
            setShowAddModal(false);
            setEditingId(null);
          }}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-gradient-to-b from-navy-light to-navy-dark rounded-2xl border border-gold/20 p-8 max-w-sm w-full border-white/10">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-red-400/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={24} className="text-red-400" />
              </div>
              <h3 className="font-display font-semibold text-white text-lg mb-2">Confirmer la suppression</h3>
              <p className="text-sm text-white/50 mb-6">Cette action est irréversible. Voulez-vous vraiment supprimer ce service ?</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all">Annuler</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-all">Supprimer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function FaqsList() {
  const { data: list = [] } = useFaqs();
  const createFaq = useCreateFaq();
  const updateFaq = useUpdateFaq();
  const deleteFaq = useDeleteFaq();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = (id: string) => {
    deleteFaq.mutate(id, {
      onSuccess: () => {
        setDeleteConfirm(null);
        showToast("success", "Question supprimée avec succès");
      },
    });
  };

  const toggleActive = (f: Faq) => {
    updateFaq.mutate({ id: f.id, active: !f.active });
  };

  return (
    <div>
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[70] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-medium ${
            toast.type === "success"
              ? "bg-emerald-950 border-emerald-500/40 text-emerald-300"
              : "bg-red-950 border-red-500/40 text-red-300"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h2 className="font-display font-bold text-white text-2xl">Questions fréquentes</h2>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gold hover:bg-gold-light text-navy font-semibold text-sm px-5 py-2.5 rounded-xl transition-all">
          <Plus size={16} />
          Ajouter une question
        </button>
      </div>

      <p className="text-xs text-white/30 mb-4">{list.length} question{list.length > 1 ? "s" : ""} — les questions actives s'affichent dans la section FAQ de la page d'accueil.</p>

      <div className="bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4">Question</th>
                <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4 hidden md:table-cell">Réponse</th>
                <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4">Statut</th>
                <th className="text-right text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((f) => (
                <tr key={f.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-white text-sm font-medium max-w-md">{f.question}</p>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <p className="text-xs text-white/50 max-w-md line-clamp-2">{f.answer}</p>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => toggleActive(f)}
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        f.active ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25" : "bg-white/5 text-white/40 hover:bg-white/10"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${f.active ? "bg-emerald-400" : "bg-white/25"}`} />
                      {f.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setEditingId(f.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-gold hover:bg-gold/10 transition-all">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => setDeleteConfirm(f.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-white/30 text-sm">Aucune question pour le moment</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(showAddModal || editingId) && (
        <FaqFormModal
          faq={editingId ? list.find((f) => f.id === editingId) : undefined}
          onClose={() => { setShowAddModal(false); setEditingId(null); }}
          onSave={(f) => {
            if (editingId) {
              updateFaq.mutate(f, { onSuccess: () => showToast("success", "Question modifiée avec succès") });
            } else {
              createFaq.mutate(f, { onSuccess: () => showToast("success", "Question ajoutée avec succès") });
            }
            setShowAddModal(false);
            setEditingId(null);
          }}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-gradient-to-b from-navy-light to-navy-dark rounded-2xl border border-gold/20 p-8 max-w-sm w-full border-white/10">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-red-400/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={24} className="text-red-400" />
              </div>
              <h3 className="font-display font-semibold text-white text-lg mb-2">Confirmer la suppression</h3>
              <p className="text-sm text-white/50 mb-6">Cette action est irréversible. Voulez-vous vraiment supprimer cette question ?</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all">Annuler</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-all">Supprimer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function FaqFormModal({
  faq,
  onClose,
  onSave,
}: {
  faq?: Faq;
  onClose: () => void;
  onSave: (faq: Faq) => void;
}) {
  const [form, setForm] = useState({
    question: faq?.question || "",
    answer: faq?.answer || "",
    active: faq?.active !== false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = faq?.id || `faq-${Date.now()}`;
    onSave({ id, question: form.question, answer: form.answer, position: faq?.position ?? 0, active: form.active });
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl bg-navy-light/60 border border-white/10 text-sm text-white focus:outline-none focus:border-gold transition-all";
  const labelCls = "text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block";

  return (
    <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto">
      <div className="bg-gradient-to-b from-navy-light to-navy-dark rounded-2xl border border-gold/20 p-8 max-w-xl w-full border-white/10 my-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-semibold text-white text-lg">
            {faq ? "Modifier la question" : "Ajouter une question"}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Question *</label>
            <input required value={form.question} onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Réponse *</label>
            <textarea required rows={5} value={form.answer} onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))} className={`${inputCls} resize-none`} />
          </div>
          <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:border-gold/40 transition-all">
            <button
              type="button"
              role="checkbox"
              aria-checked={form.active}
              onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                form.active ? "bg-gold border-gold text-navy" : "border-white/30 text-transparent"
              }`}
            >
              <CheckSquare size={13} />
            </button>
            <span className="text-sm text-white/70">Question visible sur le site public</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all">Annuler</button>
            <button type="submit" className="flex-[2] px-4 py-2.5 rounded-xl text-sm font-medium bg-gold text-navy hover:bg-gold-light transition-all">
              {faq ? "Enregistrer les modifications" : "Ajouter la question"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


function ServiceFormModal({
  service,
  onClose,
  onSave,
}: {
  service?: Service;
  onClose: () => void;
  onSave: (service: Service) => void;
}) {
  const [form, setForm] = useState({
    title: service?.title || "",
    text: service?.text || "",
    points: service?.points?.join(", ") || "",
    active: service?.active !== false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const points = form.points.split(",").map((x) => x.trim()).filter(Boolean);
    const id = service?.id || `svc-${Date.now()}`;
    onSave({ id, title: form.title, text: form.text, points, active: form.active });
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl bg-navy-light/60 border border-white/10 text-sm text-white focus:outline-none focus:border-gold transition-all";
  const labelCls = "text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block";

  return (
    <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto">
      <div className="bg-gradient-to-b from-navy-light to-navy-dark rounded-2xl border border-gold/20 p-8 max-w-xl w-full border-white/10 my-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-semibold text-white text-lg">
            {service ? "Modifier le service" : "Ajouter un service"}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Titre</label>
            <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea required rows={3} value={form.text} onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))} className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className={labelCls}>Points forts (séparés par des virgules)</label>
            <input value={form.points} onChange={(e) => setForm((f) => ({ ...f, points: e.target.value }))} placeholder="Estimation gratuite, Suivi notarié..." className={inputCls} />
          </div>
          <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:border-gold/40 transition-all">
            <button
              type="button"
              role="checkbox"
              aria-checked={form.active}
              onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                form.active ? "bg-gold border-gold text-navy" : "border-white/30 text-transparent"
              }`}
            >
              <CheckSquare size={13} />
            </button>
            <span className="text-sm text-white/70">Service visible sur le site public</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all">Annuler</button>
            <button type="submit" className="flex-[2] px-4 py-2.5 rounded-xl text-sm font-medium bg-gold text-navy hover:bg-gold-light transition-all">
              {service ? "Enregistrer les modifications" : "Ajouter le service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


function PromosList() {
  const { data: properties = [] } = useProperties();
  const { data: vehicles = [] } = useVehicles();
  const updateProperty = useUpdateProperty();
  const updateVehicle = useUpdateVehicle();
  const { success, error: notifyError } = useToast();

  const [removeConfirm, setRemoveConfirm] = useState<{
    kind: "property" | "vehicle";
    id: string;
    title: string;
  } | null>(null);
  const [detailsId, setDetailsId] = useState<{ kind: "property" | "vehicle"; id: string } | null>(null);

  const promos = useMemo(() => {
    const props = properties
      .filter((p) => p.promo)
      .map((p) => ({
        kind: "property" as const,
        id: p.id,
        title: p.title,
        image: p.image,
        price: formatPrice(p.price, p.priceUnit),
        type: p.type,
        paused: Boolean(p.promoPaused),
        promoEndsAt: p.promoEndsAt ?? null,
        item: p as Property,
      }));
    const vehs = vehicles
      .filter((v) => v.promo)
      .map((v) => ({
        kind: "vehicle" as const,
        id: v.id,
        title: v.name,
        image: v.image,
        price: formatVehiclePrice(v.price, v.priceUnit),
        type: v.type,
        paused: Boolean(v.promoPaused),
        promoEndsAt: v.promoEndsAt ?? null,
        item: v as Vehicle,
      }));
    return [...props, ...vehs];
  }, [properties, vehicles]);

  const detailsProp = detailsId?.kind === "property" ? (properties.find((p) => p.id === detailsId.id) ?? null) : null;
  const detailsVehicle = detailsId?.kind === "vehicle" ? (vehicles.find((v) => v.id === detailsId.id) ?? null) : null;

  const handleTogglePause = (p: (typeof promos)[number]) => {
    const body = { promoPaused: !p.paused };
    try {
      if (p.kind === "property") {
        updateProperty.mutate({ id: p.id, ...body }, {
          onSuccess: () => success(p.paused ? `« ${p.title} » reprend la promotion` : `« ${p.title} » mis en pause`),
        });
      } else {
        updateVehicle.mutate({ id: p.id, ...body }, {
          onSuccess: () => success(p.paused ? `« ${p.title} » reprend la promotion` : `« ${p.title} » mis en pause`),
        });
      }
    } catch {
      notifyError("Erreur lors de la mise à jour de la promotion");
    }
  };

  const handleRemove = () => {
    if (!removeConfirm) return;
    const { kind, id } = removeConfirm;
    const body = { promo: false };
    try {
      if (kind === "property") {
        updateProperty.mutate({ id, ...body }, {
          onSuccess: () => success(`« ${removeConfirm.title} » retiré des promotions`),
        });
      } else {
        updateVehicle.mutate({ id, ...body }, {
          onSuccess: () => success(`« ${removeConfirm.title} » retiré des promotions`),
        });
      }
      setRemoveConfirm(null);
    } catch {
      notifyError("Erreur lors du retrait de la promotion");
    }
  };

  
  
  if (detailsProp) {
    return (
      <PropertyDetailsModal
        property={detailsProp}
        onClose={() => setDetailsId(null)}
        onEdit={() => setDetailsId(null)}
        onDelete={() => setDetailsId(null)}
      />
    );
  }
  if (detailsVehicle) {
    return (
      <VehicleDetailsModal
        vehicle={detailsVehicle}
        onClose={() => setDetailsId(null)}
        onEdit={() => setDetailsId(null)}
        onDelete={() => setDetailsId(null)}
      />
    );
  }

  const promoCount = promos.length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-display font-bold text-white text-2xl">
            Promotions
          </h2>
          <p className="text-xs text-white/30 mt-1">
            {promoCount} élément{promoCount > 1 ? "s" : ""} en promo — affiché{promoCount > 1 ? "s" : ""} dans le bandeau du site public.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 text-xs font-semibold bg-gold/15 text-gold px-4 py-2 rounded-xl">
          <Megaphone size={14} />
          {promoCount} promo{promoCount > 1 ? "s" : ""} active{promoCount > 1 ? "s" : ""}
        </span>
      </div>

      {promoCount === 0 ? (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-12 text-center">
          <Megaphone size={32} className="mx-auto text-white/20 mb-4" />
          <p className="text-sm text-white/40">
            Aucune promotion active. Ouvrez un bien ou un véhicule et cochez
            « Mettre en promo » pour qu'il apparaisse ici et dans le bandeau public.
          </p>
        </div>
      ) : (
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4">Élément</th>
                  <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4 hidden md:table-cell">Type</th>
                  <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4 hidden md:table-cell">Transaction</th>
                  <th className="text-right text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4">Prix</th>
                  <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4 hidden lg:table-cell">Statut</th>
                  <th className="text-right text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {promos.map((p) => (
                  <tr key={`${p.kind}-${p.id}`} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${p.paused ? "opacity-60" : ""}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img src={p.image} alt={p.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        <p className="text-white text-sm font-medium truncate max-w-[220px]">{p.title}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${
                        p.kind === "property" ? "bg-amber-500/15 text-amber-400" : "bg-blue-500/15 text-blue-400"
                      }`}>
                        {p.kind === "property" ? "Bien" : "Véhicule"}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-xs text-white/50">{p.type}</span>
                    </td>
                    <td className="px-5 py-4 text-right text-gold text-sm font-medium">{p.price}</td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg ${
                        p.paused ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${p.paused ? "bg-amber-400" : "bg-emerald-400"}`} />
                        {p.paused ? "En pause" : "Active"}
                      </span>
                      {p.promoEndsAt && !isPromoExpired(p.promoEndsAt) && (
                        <span className="block mt-1.5 text-[11px] text-white/40">
                          Fin le {formatPromoEnd(p.promoEndsAt, "fr")}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setDetailsId({ kind: p.kind, id: p.id })}
                          title="Voir les détails"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-gold hover:bg-gold/10 transition-all"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleTogglePause(p)}
                          title={p.paused ? "Reprendre la promotion" : "Mettre en pause"}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                            p.paused
                              ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                              : "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25"
                          }`}
                        >
                          {p.paused ? <Play size={14} /> : <Pause size={14} />}
                        </button>
                        <button
                          onClick={() => setRemoveConfirm({ kind: p.kind, id: p.id, title: p.title })}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all"
                          title="Retirer la promo"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      
      <ConfirmDialog
        open={!!removeConfirm}
        title="Retirer la promotion"
        message={
          removeConfirm
            ? `Voulez-vous vraiment retirer « ${removeConfirm.title} » des promotions ? Il ne sera plus affiché dans le bandeau public.`
            : ""
        }
        confirmLabel="Retirer la promo"
        variant="danger"
        onConfirm={handleRemove}
        onCancel={() => setRemoveConfirm(null)}
      />
    </div>
  );
}


type AdminRow = {
  id: string;
  email: string;
  username: string | null;
  role: "superadmin" | "admin";
  status: "invited" | "active" | "blocked";
  createdAt?: string | null;
};

function AdminsPage({ me }: { me: AdminProfile | null }) {
  const { success, error } = useToast();
  const isSuper = me?.role === "superadmin";
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteResult, setInviteResult] = useState<{ url: string; emailSent: boolean } | null>(null);
  const [inviteError, setInviteError] = useState("");
  const [inviting, setInviting] = useState(false);
  const [blockConfirm, setBlockConfirm] = useState<AdminRow | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<AdminRow | null>(null);
  const [resetConfirm, setResetConfirm] = useState<AdminRow | null>(null);
  const [resetResult, setResetResult] = useState<{ url: string; emailSent: boolean } | null>(null);
  const [resetting, setResetting] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admins")
      .then((r) => r.json())
      .then((data: { admins?: AdminRow[] }) => setAdmins(data.admins ?? []))
      .catch(() => error("Erreur lors du chargement des admins"))
      .finally(() => setLoading(false));
  }, [error]);

  useEffect(() => {
    load();
  }, [load]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError("");
    setInviting(true);
    setInviteResult(null);
    try {
      const res = await fetch("/api/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setInviteEmail("");
        setInviteResult({ url: data.inviteUrl, emailSent: data.emailSent });
        load();
        success("Invitation envoyée");
      } else {
        setInviteError(data.error || "Impossible d'envoyer l'invitation");
      }
    } catch {
      setInviteError("Erreur de connexion au serveur");
    } finally {
      setInviting(false);
    }
  };

  const handleBlock = async (admin: AdminRow) => {
    try {
      const res = await fetch(`/api/admins/${admin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: admin.status === "blocked" ? "active" : "blocked" }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        success(admin.status === "blocked" ? "Admin débloqué" : "Admin bloqué");
        setBlockConfirm(null);
        load();
      } else {
        error(data.error || "Action impossible");
        setBlockConfirm(null);
      }
    } catch {
      error("Erreur de connexion au serveur");
      setBlockConfirm(null);
    }
  };

  const handleDelete = async (admin: AdminRow) => {
    try {
      const res = await fetch(`/api/admins/${admin.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        success("Admin supprimé");
        setDeleteConfirm(null);
        load();
      } else {
        error(data.error || "Suppression impossible");
        setDeleteConfirm(null);
      }
    } catch {
      error("Erreur de connexion au serveur");
      setDeleteConfirm(null);
    }
  };

  const handleReset = async (admin: AdminRow) => {
    setResetting(true);
    setResetResult(null);
    try {
      const res = await fetch("/api/admins/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: admin.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setResetResult({ url: data.resetUrl, emailSent: data.emailSent });
        success("Lien de réinitialisation envoyé");
      } else {
        error(data.error || "Impossible de réinitialiser le mot de passe");
        setResetConfirm(null);
      }
    } catch {
      error("Erreur de connexion au serveur");
      setResetConfirm(null);
    } finally {
      setResetting(false);
    }
  };

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      success("Lien copié");
    } catch {
      error("Impossible de copier");
    }
  };

  const statusBadge = (a: AdminRow) => {
    if (a.status === "invited") return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20">En attente</span>;
    if (a.status === "blocked") return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-400/10 text-red-400 border border-red-400/20">Bloqué</span>;
    return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-400/10 text-green-400 border border-green-400/20">Actif</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-white text-xl sm:text-2xl">Administrateurs</h1>
          <p className="text-sm text-white/40 mt-1">
            {isSuper
              ? "Gérez les accès au back-office. Seul le superadmin peut inviter, bloquer ou supprimer."
              : "Vous consultez vos informations de compte."}
          </p>
        </div>
        {isSuper && (
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-navy font-semibold text-sm transition-all"
          >
            <Plus size={16} />
            Inviter un admin
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-white/40">
          <Loader2 size={20} className="animate-spin mr-2" /> Chargement…
        </div>
      ) : (
        <div className="grid gap-3">
          {admins.map((a) => {
            const isSelf = me?.id === a.id;
            return (
              <div
                key={a.id}
                className={`bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 sm:p-5 flex items-center gap-4 ${
                  isSelf ? "ring-1 ring-gold/20" : ""
                }`}
              >
                <span className="w-11 h-11 rounded-full bg-gradient-to-br from-navy-light to-navy-dark border border-white/10 flex items-center justify-center text-white font-bold text-sm uppercase shrink-0">
                  {(a.username || a.email).slice(0, 2)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-white text-sm truncate">
                      {a.username || "—"}
                    </p>
                    {a.role === "superadmin" && (
                      <ShieldCheck size={14} className="text-gold" />
                    )}
                    {isSelf && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20">
                        Vous
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/40 truncate">{a.email}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {statusBadge(a)}
                    <span className="text-[10px] text-white/30">
                      {a.role === "superadmin" ? "Superadmin" : "Admin"}
                    </span>
                    {a.createdAt && (
                      <span className="text-[10px] text-white/30">
                        · depuis le {new Date(a.createdAt).toLocaleDateString("fr-FR")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isSuper && a.role !== "superadmin" && (
                    <>
                      <button
                        onClick={() => setResetConfirm(a)}
                        className="w-9 h-9 rounded-xl bg-white/[0.05] hover:bg-blue-400/10 text-white/50 hover:text-blue-400 border border-white/[0.06] flex items-center justify-center transition-all"
                        title="Réinitialiser le mot de passe"
                      >
                        <KeyRound size={16} />
                      </button>
                      <button
                        onClick={() => setBlockConfirm(a)}
                        className="w-9 h-9 rounded-xl bg-white/[0.05] hover:bg-amber-400/10 text-white/50 hover:text-amber-400 border border-white/[0.06] flex items-center justify-center transition-all"
                        title={a.status === "blocked" ? "Débloquer" : "Bloquer"}
                      >
                        {a.status === "blocked" ? <ShieldCheck size={16} /> : <ShieldX size={16} />}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(a)}
                        className="w-9 h-9 rounded-xl bg-white/[0.05] hover:bg-red-400/10 text-white/50 hover:text-red-400 border border-white/[0.06] flex items-center justify-center transition-all"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {admins.length === 0 && (
            <div className="text-center py-16 text-white/40 text-sm">
              Aucun administrateur pour le moment.
            </div>
          )}
        </div>
      )}

      
      {showInvite && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-navy-light rounded-2xl p-8 max-w-md w-full border border-white/10 shadow-2xl animate-fade-up relative">
            <button
              onClick={() => { setShowInvite(false); setInviteResult(null); setInviteError(""); }}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={16} />
            </button>
            <h3 className="font-display font-semibold text-white text-lg mb-1">Inviter un administrateur</h3>
            <p className="text-sm text-white/50 mb-6">
              Un email avec un lien d'activation sera envoyé à l'adresse indiquée.
            </p>

            {!inviteResult ? (
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                    Adresse email
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="admin@exemple.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold transition-all"
                    required
                    autoFocus
                  />
                </div>
                {inviteError && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-xl px-4 py-3">
                    <AlertCircle size={16} />
                    {inviteError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={inviting}
                  className="w-full bg-gold hover:bg-gold-light disabled:opacity-60 text-navy font-semibold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                >
                  {inviting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {inviting ? "Envoi…" : "Envoyer l'invitation"}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                {inviteResult.emailSent ? (
                  <div className="flex items-start gap-2 text-green-400 text-sm bg-green-400/10 rounded-xl px-4 py-3">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                    Email envoyé. L'invité recevra le lien d'activation.
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-amber-400 text-sm bg-amber-400/10 rounded-xl px-4 py-3">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    Email non envoyé (service non configuré ou domaine non vérifié). Transmettez le lien manuellement :
                  </div>
                )}
                <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-xl p-3">
                  <p className="text-xs text-white/60 break-all flex-1">{inviteResult.url}</p>
                  <button
                    onClick={() => copyLink(inviteResult.url)}
                    className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/10 text-white/50 hover:text-gold flex items-center justify-center shrink-0 transition-colors"
                    title="Copier le lien"
                  >
                    {copied ? <CheckCircle2 size={14} className="text-green-400" /> : <Copy size={14} />}
                  </button>
                </div>
                <button
                  onClick={() => { setShowInvite(false); setInviteResult(null); setInviteError(""); }}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      
      {resetConfirm && !resetResult && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-gradient-to-b from-navy-light to-navy-dark rounded-2xl p-8 max-w-md w-full border border-gold/20 shadow-2xl animate-fade-up relative">
            <button
              onClick={() => { setResetConfirm(null); setResetResult(null); }}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={16} />
            </button>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-blue-400/10 flex items-center justify-center mx-auto mb-5">
                <KeyRound size={24} className="text-blue-400" />
              </div>
              <h3 className="font-display font-semibold text-white text-lg mb-2">
                Réinitialiser le mot de passe ?
              </h3>
              <p className="text-sm text-white/50 mb-7 leading-relaxed">
                Un lien de réinitialisation (valable 1 heure) sera envoyé à « {resetConfirm.email} ». L'admin pourra choisir un nouveau mot de passe.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setResetConfirm(null); setResetResult(null); }}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleReset(resetConfirm)}
                  disabled={resetting}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white transition-all flex items-center justify-center gap-2"
                >
                  {resetting ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                  {resetting ? "Envoi…" : "Envoyer le lien"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      
      {resetResult && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-gradient-to-b from-navy-light to-navy-dark rounded-2xl p-8 max-w-md w-full border border-gold/20 shadow-2xl animate-fade-up relative">
            <button
              onClick={() => { setResetConfirm(null); setResetResult(null); }}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={16} />
            </button>
            <h3 className="font-display font-semibold text-white text-lg mb-4">Réinitialisation demandée</h3>
            {resetResult.emailSent ? (
              <div className="flex items-start gap-2 text-green-400 text-sm bg-green-400/10 rounded-xl px-4 py-3 mb-4">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                Email envoyé. L'admin recevra le lien de réinitialisation (valable 1 heure).
              </div>
            ) : (
              <div className="flex items-start gap-2 text-amber-400 text-sm bg-amber-400/10 rounded-xl px-4 py-3 mb-4">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                Email non envoyé (service non configuré ou domaine non vérifié). Transmettez le lien manuellement :
              </div>
            )}
            <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-xl p-3 mb-6">
              <p className="text-xs text-white/60 break-all flex-1">{resetResult.url}</p>
              <button
                onClick={() => copyLink(resetResult.url)}
                className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/10 text-white/50 hover:text-gold flex items-center justify-center shrink-0 transition-colors"
                title="Copier le lien"
              >
                {copied ? <CheckCircle2 size={14} className="text-green-400" /> : <Copy size={14} />}
              </button>
            </div>
            <button
              onClick={() => { setResetConfirm(null); setResetResult(null); }}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      
      <ConfirmDialog
        open={!!blockConfirm}
        title={blockConfirm?.status === "blocked" ? "Débloquer cet admin ?" : "Bloquer cet admin ?"}
        message={
          blockConfirm
            ? blockConfirm.status === "blocked"
              ? `Réactiver l'accès de « ${blockConfirm.email} » au back-office ?`
              : `« ${blockConfirm.email} » perdra immédiatement l'accès au back-office.`
            : ""
        }
        confirmLabel={blockConfirm?.status === "blocked" ? "Débloquer" : "Bloquer"}
        variant="warning"
        onConfirm={() => blockConfirm && handleBlock(blockConfirm)}
        onCancel={() => setBlockConfirm(null)}
      />

      
      <ConfirmDialog
        open={!!deleteConfirm}
        title="Supprimer cet admin ?"
        message={
          deleteConfirm
            ? `Le compte de « ${deleteConfirm.email} » sera définitivement supprimé. Cette action est irréversible.`
            : ""
        }
        confirmLabel="Supprimer"
        variant="danger"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}


type LoginEvent = {
  id: string;
  email: string;
  username: string | null;
  ip: string;
  device: string;
  createdAt: string;
};

function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<LoginEvent[]>([]);
  const [hasNew, setHasNew] = useState(false);
  const lastSeenRef = useRef<number>(Date.now());

  const load = useCallback(() => {
    fetch("/api/admins/login-events")
      .then((r) => r.json())
      .then((data: { events?: LoginEvent[] }) => {
        const evts = data.events ?? [];
        setEvents(evts);
        if (evts.some((e) => new Date(e.createdAt).getTime() > lastSeenRef.current)) {
          setHasNew(true);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const markSeen = () => {
    lastSeenRef.current = Date.now();
    setHasNew(false);
  };

  const deviceIcon = (device: string) => {
    const d = device.toLowerCase();
    if (d.includes("iphone") || d.includes("mobile") || d.includes("android")) return <Smartphone size={14} />;
    if (d.includes("tablet") || d.includes("ipad")) return <Tablet size={14} />;
    if (d.includes("mac") || d.includes("linux")) return <Laptop size={14} />;
    return <Monitor size={14} />;
  };

  return (
    <div className="fixed top-4 right-4 z-[60]">
      <button
        onClick={() => {
          setOpen((o) => !o);
          markSeen();
        }}
        className="relative w-10 h-10 rounded-xl bg-navy-light/80 backdrop-blur-xl border border-white/10 text-white/70 hover:text-gold hover:border-gold/40 shadow-lg shadow-black/20 flex items-center justify-center transition-all"
        aria-label="Notifications de connexion"
      >
        <Bell size={18} />
        {hasNew && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-navy" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[-1]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[70vh] overflow-y-auto rounded-2xl bg-gradient-to-b from-navy-light to-navy-dark border border-gold/20 shadow-2xl p-4 animate-fade-up">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-white text-sm">
                Connexions récentes
              </h3>
              <span className="text-[10px] text-white/40">24 dernières heures</span>
            </div>
            {events.length === 0 ? (
              <p className="text-sm text-white/40 text-center py-8">
                Aucune connexion détectée pour le moment.
              </p>
            ) : (
              <div className="space-y-2">
                {events.map((e) => (
                  <div key={e.id} className="flex items-start gap-3 rounded-xl bg-white/[0.04] border border-white/[0.06] p-3">
                    <span className="w-8 h-8 rounded-lg bg-gold/15 text-gold flex items-center justify-center shrink-0">
                      {deviceIcon(e.device)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-white flex items-center gap-1.5">
                        <LogIn size={12} className="text-gold" />
                        Nouvelle connexion
                      </p>
                      <p className="text-[11px] text-white/60 mt-0.5">
                        {e.device || "Appareil inconnu"} · {e.ip || "IP inconnue"}
                      </p>
                      <p className="text-[11px] text-white/40">
                        {e.username || e.email}
                      </p>
                      <p className="text-[10px] text-white/30 mt-0.5">
                        {new Date(e.createdAt).toLocaleString("fr-FR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}


type Review = {
  id: string;
  author: string;
  avatar?: string;
  rating: number;
  comment: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

function ReviewsPage() {
  const { success, error } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<Review | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((rows) => setReviews(Array.isArray(rows) ? rows : []))
      .catch(() => error("Impossible de charger les avis"))
      .finally(() => setLoading(false));
  }, [error]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (review: Review, status: "approved" | "rejected") => {
    try {
      const res = await fetch(`/api/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        success(status === "approved" ? "Avis publié" : "Avis rejeté");
        load();
      } else {
        error(data.error || "Action impossible");
      }
    } catch {
      error("Erreur de connexion au serveur");
    }
  };

  const remove = async (review: Review) => {
    try {
      const res = await fetch(`/api/reviews/${review.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        success("Avis supprimé");
        setDeleteConfirm(null);
        load();
      } else {
        error(data.error || "Suppression impossible");
        setDeleteConfirm(null);
      }
    } catch {
      error("Erreur de connexion au serveur");
      setDeleteConfirm(null);
    }
  };

  const filtered = reviews.filter((r) => filter === "all" || r.status === filter);
  const counts = {
    all: reviews.length,
    pending: reviews.filter((r) => r.status === "pending").length,
    approved: reviews.filter((r) => r.status === "approved").length,
    rejected: reviews.filter((r) => r.status === "rejected").length,
  };

  const filterBtn = (key: "all" | "pending" | "approved" | "rejected", label: string) => (
    <button
      key={key}
      onClick={() => setFilter(key)}
      className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
        filter === key
          ? "bg-gold text-navy"
          : "bg-white/[0.04] text-white/50 hover:text-white hover:bg-white/[0.08]"
      }`}
    >
      {label} <span className="opacity-60">({counts[key]})</span>
    </button>
  );

  const stars = (n: number) => (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={13} className={i <= n ? "text-gold fill-gold" : "text-white/20"} />
      ))}
    </span>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-white text-xl sm:text-2xl">Avis clients</h1>
        <p className="text-sm text-white/40 mt-1">
          Les avis publiés sur le site apparaissent ici. Validez ceux que vous souhaitez afficher.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {filterBtn("all", "Tous")}
        {filterBtn("pending", "À valider")}
        {filterBtn("approved", "Publiés")}
        {filterBtn("rejected", "Rejetés")}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-white/40">
          <Loader2 size={20} className="animate-spin mr-2" /> Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-white/40 text-sm">
          Aucun avis dans cette catégorie.
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((r) => (
            <div key={r.id} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  {r.avatar ? (
                    <img src={r.avatar} alt={r.author} className="w-11 h-11 rounded-full object-cover ring-2 ring-gold/40 shrink-0" />
                  ) : (
                    <span className="w-11 h-11 rounded-full bg-gold/15 text-gold font-semibold text-sm flex items-center justify-center shrink-0">
                      {r.author.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?"}
                    </span>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <p className="font-semibold text-white text-sm">{r.author}</p>
                      {stars(r.rating)}
                    </div>
                    <p className="text-[11px] text-white/30 mt-0.5">
                      {new Date(r.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  r.status === "approved"
                    ? "bg-green-400/10 text-green-400 border-green-400/20"
                    : r.status === "rejected"
                      ? "bg-red-400/10 text-red-400 border-red-400/20"
                      : "bg-amber-400/10 text-amber-400 border-amber-400/20"
                }`}>
                  {r.status === "approved" ? "Publié" : r.status === "rejected" ? "Rejeté" : "À valider"}
                </span>
              </div>
              <p className="text-sm text-white/70 leading-relaxed mt-3">{r.comment}</p>
              <div className="flex items-center gap-2 mt-4">
                {r.status !== "approved" && (
                  <button
                    onClick={() => updateStatus(r, "approved")}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500/15 text-green-400 text-xs font-medium hover:bg-green-500/25 transition-all"
                  >
                    <CheckCircle2 size={14} /> Publier
                  </button>
                )}
                {r.status !== "rejected" && (
                  <button
                    onClick={() => updateStatus(r, "rejected")}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 text-amber-400 text-xs font-medium hover:bg-amber-500/25 transition-all"
                  >
                    <X size={14} /> Rejeter
                  </button>
                )}
                <button
                  onClick={() => setDeleteConfirm(r)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-all"
                >
                  <Trash2 size={14} /> Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Supprimer cet avis ?"
        message={deleteConfirm ? `L'avis de « ${deleteConfirm.author} » sera définitivement supprimé.` : ""}
        confirmLabel="Supprimer"
        variant="danger"
        onConfirm={() => deleteConfirm && remove(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}


function MfaSection() {
  const { success, error } = useToast();
  const [status, setStatus] = useState<{ enabled: boolean; recoveryCodesLeft: number } | null>(null);
  const [setup, setSetup] = useState<{ qrCode: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [confirming, setConfirming] = useState<null | "disable" | "regenerate">(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/mfa");
      if (res.ok) setStatus(await res.json());
    } catch {
      
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const call = async (action: string, payload: Record<string, unknown> = {}) => {
    const res = await fetch("/api/mfa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Opération impossible");
    return data;
  };

  const run = async (fn: () => Promise<void>, fallback: string) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      error(e instanceof Error ? e.message : fallback);
    } finally {
      setBusy(false);
    }
  };

  const startSetup = () =>
    run(async () => {
      const data = await call("setup");
      setSetup({ qrCode: data.qrCode, secret: data.secret });
      setCode("");
    }, "Impossible de démarrer la configuration");

  const activate = () =>
    run(async () => {
      const data = await call("activate", { code });
      setCodes(data.recoveryCodes);
      setSetup(null);
      setCode("");
      success("Double authentification activée");
      await load();
    }, "Code incorrect");

  const disable = () =>
    run(async () => {
      await call("disable", { password });
      setPassword("");
      setConfirming(null);
      setCodes(null);
      success("Double authentification désactivée");
      await load();
    }, "Mot de passe incorrect");

  const regenerate = () =>
    run(async () => {
      const data = await call("recovery-codes", { password });
      setCodes(data.recoveryCodes);
      setPassword("");
      setConfirming(null);
      success("Nouveaux codes de secours générés");
      await load();
    }, "Mot de passe incorrect");

  const copyCodes = () => {
    if (!codes) return;
    navigator.clipboard?.writeText(codes.join("\n")).then(
      () => success("Codes copiés"),
      () => error("Copie impossible")
    );
  };

  const field =
    "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold transition-all";

  return (
    <div className="mt-6 pt-6 border-t border-white/10">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck size={16} className="text-gold" />
        <h4 className="font-display font-semibold text-white text-sm">
          Vérification en deux étapes
        </h4>
        {status?.enabled && (
          <span className="ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-emerald-500/15 text-emerald-300">
            Active
          </span>
        )}
      </div>

      {codes && (
        <div className="mb-4 rounded-xl bg-gold/10 border border-gold/30 p-4">
          <p className="text-xs text-gold font-semibold mb-2">Conservez ces codes maintenant</p>
          <p className="text-[11px] text-white/60 mb-3">
            Ils ne seront plus jamais affichés. Chacun ne fonctionne qu'une fois et permet de
            vous connecter si vous perdez votre téléphone.
          </p>
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {codes.map((c) => (
              <code key={c} className="text-xs text-white bg-white/10 rounded-lg px-2 py-1.5 text-center tracking-wider">
                {c}
              </code>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={copyCodes} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all">
              <Copy size={13} /> Copier
            </button>
            <button type="button" onClick={() => setCodes(null)} className="flex-1 px-3 py-2 rounded-lg bg-gold hover:bg-gold-light text-navy text-xs font-semibold transition-all">
              J'ai noté ces codes
            </button>
          </div>
        </div>
      )}

      {!status?.enabled && !setup && !codes && (
        <>
          <p className="text-[11px] text-white/40 mb-3">
            Un code à six chiffres sera demandé à chaque connexion, en plus du mot de passe.
            Nécessite une application comme Google Authenticator ou Authy.
          </p>
          <button type="button" onClick={startSetup} disabled={busy} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-60 text-white text-sm font-medium transition-all">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Smartphone size={14} />}
            Activer
          </button>
        </>
      )}

      {setup && (
        <div className="space-y-3">
          <p className="text-[11px] text-white/50">
            1. Scannez ce QR code avec votre application d'authentification.
          </p>
          <div className="flex justify-center">
            <img src={setup.qrCode} alt="QR code de configuration" className="rounded-xl bg-white p-2" width={200} height={200} />
          </div>
          <details className="text-[11px] text-white/40">
            <summary className="cursor-pointer hover:text-white/60">Impossible de scanner ?</summary>
            <p className="mt-2">Saisissez cette clé manuellement :</p>
            <code className="block mt-1 text-white/70 bg-white/5 rounded-lg px-2 py-1.5 break-all tracking-wider">
              {setup.secret}
            </code>
          </details>
          <p className="text-[11px] text-white/50">2. Saisissez le code affiché pour confirmer.</p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            placeholder="123456"
            className={`${field} text-center tracking-[0.3em]`}
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => { setSetup(null); setCode(""); }} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all">
              Annuler
            </button>
            <button type="button" onClick={activate} disabled={busy || code.trim().length < 6} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gold hover:bg-gold-light text-navy disabled:opacity-60 transition-all flex items-center justify-center gap-2">
              {busy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Confirmer
            </button>
          </div>
        </div>
      )}

      {status?.enabled && !codes && (
        <div className="space-y-3">
          <p className="text-[11px] text-white/40">
            Codes de secours restants :{" "}
            <span className="text-white/70 font-semibold">{status.recoveryCodesLeft}</span>
            {status.recoveryCodesLeft <= 2 && (
              <span className="text-amber-300"> — pensez à en régénérer</span>
            )}
          </p>
          {confirming === null ? (
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirming("regenerate")} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium bg-white/10 text-white hover:bg-white/20 transition-all">
                <KeyRound size={13} /> Nouveaux codes
              </button>
              <button type="button" onClick={() => setConfirming("disable")} className="flex-1 px-4 py-2.5 rounded-xl text-xs font-medium bg-red-500/15 text-red-200 hover:bg-red-500/25 transition-all">
                Désactiver
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] text-white/50">
                {confirming === "disable"
                  ? "Confirmez la désactivation avec votre mot de passe :"
                  : "Confirmez avec votre mot de passe. Les anciens codes cesseront de fonctionner."}
              </p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Mot de passe"
                className={field}
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => { setConfirming(null); setPassword(""); }} className="flex-1 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all">
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={confirming === "disable" ? disable : regenerate}
                  disabled={busy || !password}
                  className={`flex-1 px-3 py-2 rounded-lg disabled:opacity-50 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    confirming === "disable"
                      ? "bg-red-500/20 hover:bg-red-500/30 text-red-200"
                      : "bg-gold hover:bg-gold-light text-navy"
                  }`}
                >
                  {busy && <Loader2 size={13} className="animate-spin" />}
                  {confirming === "disable" ? "Désactiver" : "Régénérer"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProfileModal({
  open,
  admin,
  onClose,
  onSaved,
}: {
  open: boolean;
  admin: AdminProfile | null;
  onClose: () => void;
  onSaved: (updated: Partial<AdminProfile>) => void;
}) {
  const { success, error } = useToast();
  const [username, setUsername] = useState(admin?.username ?? "");
  const [avatar, setAvatar] = useState(admin?.avatar ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      setUsername(admin?.username ?? "");
      setAvatar(admin?.avatar ?? "");
    }
  }, [open, admin]);

  useEffect(() => {
    loadCloudinaryWidgetScript();
  }, []);

  const pickAvatar = async () => {
    if (!window.cloudinary) {
      error("Le téléchargeur d'images n'est pas encore prêt. Réessayez dans un instant.");
      return;
    }
    setUploading(true);
    try {
      await openSignedUploadWidget((url) => {
        setAvatar(url);
        success("Photo téléchargée. Pensez à enregistrer.");
      });
    } catch (e) {
      error(e instanceof Error ? e.message : "Impossible de télécharger la photo");
    } finally {
      setUploading(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admins/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, avatar }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        success("Profil mis à jour");
        onSaved(data.admin);
      } else {
        error(data.error || "Impossible d'enregistrer les modifications");
      }
    } catch {
      error("Erreur de connexion au serveur");
    } finally {
      setSaving(false);
    }
  };

  if (!open || !admin) return null;

  return (
    <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-gradient-to-b from-navy-light to-navy-dark rounded-2xl p-8 max-w-md w-full border border-gold/20 shadow-2xl animate-fade-up relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={16} />
        </button>

        <h3 className="font-display font-semibold text-white text-lg mb-6">Mon profil</h3>

        <form onSubmit={save} className="space-y-5">
          <div className="flex flex-col items-center gap-3">
            {avatar ? (
              <img src={avatar} alt="avatar" className="w-20 h-20 rounded-full object-cover ring-2 ring-gold/40" />
            ) : (
              <span className="w-20 h-20 rounded-full bg-gradient-to-br from-gold to-amber-500 flex items-center justify-center text-navy font-bold text-xl uppercase">
                {(admin.username || admin.email || "A").slice(0, 2)}
              </span>
            )}
            <button
              type="button"
              onClick={pickAvatar}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-60 text-white text-xs font-medium transition-all"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {avatar ? "Changer la photo" : "Ajouter une photo"}
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
              Nom d'utilisateur
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Votre nom d'utilisateur"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold transition-all"
            />
            <p className="text-[11px] text-white/30 mt-1.5">
              3 à 30 caractères : lettres, chiffres, _ . -
            </p>
          </div>

          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
            <p className="text-[11px] text-white/40">
              Email du compte : <span className="text-white/70">{admin.email}</span>
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-gold hover:bg-gold-light text-navy disabled:opacity-60 transition-all flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>

        <MfaSection />
      </div>
    </div>
  );
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function DetailsRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-white/5 last:border-0">
      <span className="text-xs font-semibold text-white/40 uppercase tracking-wider shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-sm text-white text-right">{children}</span>
    </div>
  );
}function DetailsPageShell({
  title,
  onClose,
  onEdit,
  onDelete,
  onTogglePromo,
  isPromo,
  promoPaused,
  children,
}: {
  title: string;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onTogglePromo?: () => void;
  isPromo?: boolean;
  promoPaused?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white/60 hover:text-gold hover:border-gold/40 transition-all"
            aria-label="Retour"
          >
            <ArrowLeftIcon size={17} />
          </button>
          <h2 className="font-display font-bold text-white text-2xl">{title}</h2>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2.5">
          {onTogglePromo && (
            <button
              onClick={onTogglePromo}
              className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl font-semibold transition-all ${
                isPromo
                  ? "bg-gold/15 text-gold hover:bg-gold/25"
                  : "bg-white/[0.06] text-white/70 hover:bg-gold/15 hover:text-gold"
              }`}
            >
              <Megaphone size={15} />
              {isPromo ? (promoPaused ? "Reprendre la promo" : "Retirer la promo") : "Mettre en promo"}
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-2 bg-gold hover:bg-gold-light text-navy font-semibold text-sm px-4 py-2.5 rounded-xl transition-all"
            >
              <Edit3 size={15} />
              Modifier
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="flex items-center gap-2 bg-red-500/15 hover:bg-red-500/25 text-red-400 font-semibold text-sm px-4 py-2.5 rounded-xl transition-all"
            >
              <Trash2 size={15} />
              Supprimer
            </button>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-b from-navy-light to-navy-dark rounded-2xl border border-gold/20 p-7">
        {children}
      </div>
    </div>
  );
}


function PropertyDetailsModal({ property, onClose, onEdit, onDelete }: { property: Property | null; onClose: () => void; onEdit?: () => void; onDelete?: () => void }) {
  const updateProperty = useUpdateProperty();
  const { success, error: notifyError } = useToast();
  if (!property) return null;
  const handleTogglePromo = () => {
    const enable = !property.promo;
    updateProperty.mutate(
      { id: property.id, promo: enable, promoPaused: false },
      {
        onSuccess: () => success(enable ? `« ${property.title} » mis en promo` : `« ${property.title} » retiré des promos`),
        onError: () => notifyError("Impossible de modifier la promotion"),
      }
    );
  };
  return (
    <DetailsPageShell
      title="Détails du bien"
      onClose={onClose}
      onEdit={onEdit}
      onDelete={onDelete}
      onTogglePromo={handleTogglePromo}
      isPromo={property.promo}
      promoPaused={property.promoPaused}
    >
      {property.image && (
        <img src={property.image} alt={property.title} className="w-full h-60 object-cover rounded-xl mb-6" />
      )}
      <h4 className="font-display font-semibold text-white text-xl mb-1">{property.title}</h4>
      <p className="text-xs text-white/40 mb-5">Identifiant : {property.id}</p>
      <DetailsRow label="Type">{property.type}</DetailsRow>
      <DetailsRow label="Catégorie">{property.category}</DetailsRow>
      <DetailsRow label="Localisation">
        {property.neighborhood}, {property.city}
      </DetailsRow>
      <DetailsRow label="Prix">{formatPrice(property.price, property.priceUnit)}</DetailsRow>
      <DetailsRow label="Chambres">{property.bedrooms}</DetailsRow>
      <DetailsRow label="Salles de bain">{property.bathrooms}</DetailsRow>
      <DetailsRow label="Surface">{property.area} m²</DetailsRow>
      <DetailsRow label="Statut">
        <span className="flex flex-wrap items-center justify-end gap-2">
          {property.featured && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-gold/20 text-gold">
              <Star size={11} /> En vedette
            </span>
          )}
          {property.promo && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-gold/20 text-gold">
              <Megaphone size={11} /> Promo
              {property.promoEndsAt && !isPromoExpired(property.promoEndsAt) &&
                ` — jusqu'au ${formatPromoEnd(property.promoEndsAt, "fr")}`}
            </span>
          )}
        </span>
      </DetailsRow>
      <DetailsRow label="Ajouté le">
        {property.created_at ? formatDate(property.created_at) : "—"}
      </DetailsRow>
      <DetailsRow label="Description">
        <span className="block text-left text-white/70 text-sm leading-relaxed">{property.description || "—"}</span>
      </DetailsRow>
      <DetailsRow label="Équipements">
        <span className="flex flex-wrap gap-1.5 justify-end">
          {property.features.length > 0 ? (
            property.features.map((f) => (
              <span key={f} className="text-[11px] px-2 py-1 rounded-lg bg-white/10 text-white/70">{f}</span>
            ))
          ) : (
            "—"
          )}
        </span>
      </DetailsRow>
      {property.gallery.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Galerie ({property.gallery.length})</p>
          <div className="grid grid-cols-4 gap-2">
            {property.gallery.map((src) => (
              <img key={src} src={src} alt="" className="w-full h-16 object-cover rounded-lg" />
            ))}
          </div>
        </div>
      )}
    </DetailsPageShell>
  );
}

function VehicleDetailsModal({ vehicle, onClose, onEdit, onDelete }: { vehicle: Vehicle | null; onClose: () => void; onEdit?: () => void; onDelete?: () => void }) {
  const updateVehicle = useUpdateVehicle();
  const { success, error: notifyError } = useToast();
  if (!vehicle) return null;
  const handleTogglePromo = () => {
    const enable = !vehicle.promo;
    updateVehicle.mutate(
      { id: vehicle.id, promo: enable, promoPaused: false },
      {
        onSuccess: () => success(enable ? `« ${vehicle.name} » mis en promo` : `« ${vehicle.name} » retiré des promos`),
        onError: () => notifyError("Impossible de modifier la promotion"),
      }
    );
  };
  return (
    <DetailsPageShell
      title="Détails du véhicule"
      onClose={onClose}
      onEdit={onEdit}
      onDelete={onDelete}
      onTogglePromo={handleTogglePromo}
      isPromo={vehicle.promo}
      promoPaused={vehicle.promoPaused}
    >
      {vehicle.image && (
        <img src={vehicle.image} alt={vehicle.name} className="w-full h-60 object-cover rounded-xl mb-6" />
      )}
      <h4 className="font-display font-semibold text-white text-xl mb-1">{vehicle.name}</h4>
      <p className="text-xs text-white/40 mb-5">Identifiant : {vehicle.id}</p>
      <DetailsRow label="Marque">{vehicle.brand}</DetailsRow>
      <DetailsRow label="Type">{vehicle.type}</DetailsRow>
      <DetailsRow label="Catégorie">{vehicle.category}</DetailsRow>
      <DetailsRow label="Année">{vehicle.year}</DetailsRow>
      <DetailsRow label="Places">{vehicle.seats}</DetailsRow>
      <DetailsRow label="Transmission">{vehicle.transmission}</DetailsRow>
      <DetailsRow label="Carburant">{vehicle.fuel}</DetailsRow>
      {vehicle.mileage != null && <DetailsRow label="Kilométrage">{vehicle.mileage.toLocaleString("fr-FR")} km</DetailsRow>}
      <DetailsRow label="Ville">{vehicle.city}</DetailsRow>
      <DetailsRow label="Prix">{formatVehiclePrice(vehicle.price, vehicle.priceUnit)}</DetailsRow>
      <DetailsRow label="Avec chauffeur">{vehicle.withDriver ? "Oui" : "Non"}</DetailsRow>
      <DetailsRow label="Statut">
        <span className="flex flex-wrap items-center justify-end gap-2">
          {vehicle.featured && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-gold/20 text-gold">
              <Star size={11} /> En vedette
            </span>
          )}
          {vehicle.promo && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-gold/20 text-gold">
              <Megaphone size={11} /> Promo
              {vehicle.promoEndsAt && !isPromoExpired(vehicle.promoEndsAt) &&
                ` — jusqu'au ${formatPromoEnd(vehicle.promoEndsAt, "fr")}`}
            </span>
          )}
          {vehicle.available ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 size={11} /> Disponible
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-red-500/15 text-red-400">
              <X size={11} /> Indisponible
            </span>
          )}
        </span>
      </DetailsRow>
      <DetailsRow label="Ajouté le">
        {vehicle.created_at ? formatDate(vehicle.created_at) : "—"}
      </DetailsRow>
      <DetailsRow label="Description">
        <span className="block text-left text-white/70 text-sm leading-relaxed">{vehicle.description || "—"}</span>
      </DetailsRow>
      <DetailsRow label="Équipements">
        <span className="flex flex-wrap gap-1.5 justify-end">
          {vehicle.features.length > 0 ? (
            vehicle.features.map((f) => (
              <span key={f} className="text-[11px] px-2 py-1 rounded-lg bg-white/10 text-white/70">{f}</span>
            ))
          ) : (
            "—"
          )}
        </span>
      </DetailsRow>
      {vehicle.gallery.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Galerie ({vehicle.gallery.length})</p>
          <div className="grid grid-cols-4 gap-2">
            {vehicle.gallery.map((src) => (
              <img key={src} src={src} alt="" className="w-full h-16 object-cover rounded-lg" />
            ))}
          </div>
        </div>
      )}
    </DetailsPageShell>
  );
}
