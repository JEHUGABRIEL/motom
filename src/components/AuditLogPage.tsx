import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import Pagination from "./Pagination";
import {
  useAuditLog,
  type AuditEvent,
  type AuditStatus,
} from "../lib/api";

const PAGE_SIZE = 25;

const ENTITY_LABELS: Record<string, string> = {
  auth: "Authentification",
  admin: "Administration",
  property: "Bien immobilier",
  vehicle: "Véhicule",
  service: "Service",
  faq: "FAQ",
  message: "Message",
  review: "Avis",
  media: "Média",
};

const ACTION_LABELS: Record<string, string> = {
  "auth.login.success": "Connexion réussie",
  "auth.login.failure": "Échec de connexion",
  "auth.login.locked": "Compte verrouillé",
  "auth.login.blocked": "Connexion refusée",
  "auth.logout": "Déconnexion",
  "auth.mfa.challenge": "Double authentification demandée",
  "auth.mfa.verify.success": "Code MFA validé",
  "auth.mfa.verify.failure": "Code MFA refusé",
  "auth.mfa.recovery.success": "Code de secours utilisé",
  "auth.mfa.recovery.failure": "Code de secours refusé",
  "auth.mfa.setup": "Configuration MFA démarrée",
  "auth.mfa.activate": "MFA activée",
  "auth.mfa.disable": "MFA désactivée",
  "auth.mfa.recovery-codes": "Codes de secours régénérés",
  "admin.invite": "Invitation envoyée",
  "admin.accept": "Invitation acceptée",
  "admin.update": "Profil administrateur modifié",
  "admin.block": "Administrateur bloqué",
  "admin.unblock": "Administrateur débloqué",
  "admin.delete": "Administrateur supprimé",
  "admin.reset.request": "Réinitialisation demandée",
  "admin.reset.accept": "Mot de passe réinitialisé",
  "admin.forgot.request": "Mot de passe oublié",
  "property.create": "Bien créé",
  "property.update": "Bien modifié",
  "property.delete": "Bien supprimé",
  "vehicle.create": "Véhicule créé",
  "vehicle.update": "Véhicule modifié",
  "vehicle.delete": "Véhicule supprimé",
  "service.create": "Service créé",
  "service.update": "Service modifié",
  "service.delete": "Service supprimé",
  "faq.create": "Question créée",
  "faq.update": "Question modifiée",
  "faq.delete": "Question supprimée",
  "message.create": "Message reçu",
  "message.read": "Message lu",
  "message.delete": "Message supprimé",
  "review.create": "Avis déposé",
  "review.approve": "Avis publié",
  "review.reject": "Avis rejeté",
  "review.delete": "Avis supprimé",
  "media.sign": "Signature d'upload",
};

function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

function entityLabel(entityType: string): string {
  return ENTITY_LABELS[entityType] ?? entityType;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
}

function readMetadataValue(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    const items = value.filter((item) => typeof item === "string");
    if (items.length > 0) return items.join(", ");
  }
  return null;
}

function metadataSummary(event: AuditEvent): string {
  const preferred = [
    "title",
    "name",
    "question",
    "subject",
    "email",
    "fields",
    "reason",
    "status",
  ];
  for (const key of preferred) {
    const value = readMetadataValue(event.metadata[key]);
    if (value) {
      const summary = value.replace(/\s+/g, " ").trim();
      return summary.length > 110 ? `${summary.slice(0, 107)}…` : summary;
    }
  }
  return event.entityId ?? "";
}

function actorLabel(event: AuditEvent): string {
  if (event.actor) {
    return event.actor.username || event.actor.email || event.actor.id || "Administrateur";
  }
  return event.entityType === "auth" ? "Non authentifié" : "Visiteur";
}

function StatusBadge({ status }: { status: AuditStatus }) {
  return status === "success" ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
      <CheckCircle2 size={11} />
      Succès
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full border border-red-500/25 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400">
      <AlertTriangle size={11} />
      Échec
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/30">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm text-white/75">{value}</dd>
    </div>
  );
}

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [entityType, setEntityType] = useState("");
  const [status, setStatus] = useState<AuditStatus | "all">("all");
  const [days, setDays] = useState(7);
  const [selected, setSelected] = useState<AuditEvent | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const filters = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      q: query,
      entityType,
      status,
      days,
    }),
    [page, query, entityType, status, days],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useAuditLog(filters);
  const events = data?.events ?? [];
  const total = data?.total ?? 0;

  const resetFilters = () => {
    setSearch("");
    setQuery("");
    setEntityType("");
    setStatus("all");
    setDays(7);
    setPage(1);
  };

  const selectClass =
    "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition-all focus:border-gold bo-select";

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 font-display text-2xl font-bold text-white sm:text-3xl">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold">
              <ShieldCheck size={21} />
            </span>
            Journal d'audit
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/40">
            Historique des actions sensibles et des modifications effectuées dans l'application.
            Les secrets, mots de passe et jetons ne sont jamais enregistrés.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isFetching && !isLoading && (
            <span className="flex items-center gap-1.5 text-xs text-white/30">
              <RefreshCw size={13} className="animate-spin" />
              Actualisation…
            </span>
          )}
          <span className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2 text-xs text-white/50">
            <span className="font-semibold text-white">{total.toLocaleString("fr-FR")}</span>{" "}
            événement{total > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="relative block">
            <span className="sr-only">Rechercher</span>
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Acteur, action, identifiant, IP…"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-all placeholder:text-white/25 focus:border-gold"
            />
          </label>

          <label>
            <span className="sr-only">Type d'événement</span>
            <select
              value={entityType}
              onChange={(event) => {
                setEntityType(event.target.value);
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="">Tous les domaines</option>
              {Object.entries(ENTITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="sr-only">Statut</span>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as AuditStatus | "all");
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="all">Tous les statuts</option>
              <option value="success">Succès</option>
              <option value="failure">Échecs</option>
            </select>
          </label>

          <div className="flex gap-2">
            <label className="min-w-0 flex-1">
              <span className="sr-only">Période</span>
              <select
                value={days}
                onChange={(event) => {
                  setDays(Number(event.target.value));
                  setPage(1);
                }}
                className={selectClass}
              >
                <option value={1}>Dernières 24 h</option>
                <option value={7}>7 derniers jours</option>
                <option value={30}>30 derniers jours</option>
                <option value={90}>90 derniers jours</option>
                <option value={0}>Tout l'historique</option>
              </select>
            </label>
            <button
              type="button"
              onClick={resetFilters}
              title="Réinitialiser les filtres"
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
        {isError ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <AlertTriangle size={26} className="text-red-400" />
            <p className="text-sm text-white/60">
              {error instanceof Error ? error.message : "Impossible de charger le journal."}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-xl bg-gold px-4 py-2 text-xs font-semibold text-navy transition-colors hover:bg-gold-light"
            >
              Réessayer
            </button>
          </div>
        ) : isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-xl bg-white/[0.04]" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <Clock size={26} className="text-white/20" />
            <p className="text-sm text-white/40">
              Aucun événement ne correspond à ces filtres.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-medium text-gold/80 transition-colors hover:text-gold"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-white/[0.06] text-[10px] font-semibold uppercase tracking-wider text-white/30">
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Acteur</th>
                  <th className="px-5 py-3.5">Action</th>
                  <th className="px-5 py-3.5">Cible</th>
                  <th className="px-5 py-3.5">Statut</th>
                  <th className="px-5 py-3.5">IP</th>
                  <th className="w-10 px-3 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr
                    key={event.id}
                    onClick={() => setSelected(event)}
                    className="cursor-pointer border-b border-white/[0.04] transition-colors last:border-0 hover:bg-white/[0.035]"
                  >
                    <td className="whitespace-nowrap px-5 py-3.5 text-xs text-white/45">
                      {formatDate(event.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.05] text-white/35">
                          <UserRound size={13} />
                        </span>
                        <div className="min-w-0">
                          <p className="max-w-[170px] truncate text-xs font-medium text-white/75">
                            {actorLabel(event)}
                          </p>
                          {event.actor?.role && (
                            <p className="text-[10px] capitalize text-white/25">
                              {event.actor.role}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-xs font-medium text-white/75">
                        {actionLabel(event.action)}
                      </p>
                      <p className="mt-0.5 max-w-[270px] truncate text-[11px] text-white/30">
                        {metadataSummary(event) || event.action}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-white/50">
                        {entityLabel(event.entityType)}
                      </span>
                      {event.entityId && (
                        <p className="mt-1 max-w-[150px] truncate font-mono text-[10px] text-white/25">
                          {event.entityId}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={event.status} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 font-mono text-[10px] text-white/30">
                      {event.ip || "—"}
                    </td>
                    <td className="px-3 py-3.5">
                      <ChevronRight size={15} className="text-white/20" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination
        currentPage={page}
        totalItems={total}
        perPage={PAGE_SIZE}
        onPageChange={setPage}
      />

      {selected && (
        <div
          className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-navy/80 p-4 pt-12 backdrop-blur-sm"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Détail de l'événement"
        >
          <div
            className="relative w-full max-w-2xl rounded-2xl border border-gold/20 bg-gradient-to-b from-navy-light to-navy-dark p-6 shadow-2xl sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Fermer"
            >
              <X size={16} />
            </button>

            <div className="mb-6 flex items-start gap-3 pr-8">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
                <ShieldCheck size={19} />
              </span>
              <div>
                <h2 className="font-display text-lg font-semibold text-white">
                  {actionLabel(selected.action)}
                </h2>
                <p className="mt-1 text-xs text-white/35">{formatDate(selected.createdAt)}</p>
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <DetailRow label="Acteur" value={actorLabel(selected)} />
              <DetailRow label="Rôle" value={selected.actor?.role ?? ""} />
              <DetailRow
                label="Email"
                value={selected.actor?.email && selected.actor.email !== actorLabel(selected)
                  ? selected.actor.email
                  : ""}
              />
              <DetailRow label="Domaine" value={entityLabel(selected.entityType)} />
              <DetailRow label="Identifiant cible" value={selected.entityId ?? ""} />
              <DetailRow
                label="Statut"
                value={selected.status === "success" ? "Succès" : "Échec"}
              />
              <DetailRow label="Adresse IP" value={selected.ip} />
              <DetailRow label="Action technique" value={selected.action} />
            </dl>

            <div className="mt-6">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30">
                Métadonnées
              </p>
              <pre className="mt-2 max-h-64 overflow-auto rounded-xl border border-white/[0.06] bg-black/20 p-4 text-[11px] leading-relaxed text-white/55">
                {JSON.stringify(selected.metadata ?? {}, null, 2)}
              </pre>
            </div>

            {selected.userAgent && (
              <div className="mt-5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30">
                  Navigateur / appareil
                </p>
                <p className="mt-1 break-words text-xs text-white/45">{selected.userAgent}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
