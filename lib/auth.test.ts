import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createSessionToken,
  createMfaPendingToken,
  readMfaPending,
  getSessionAdmin,
  sessionCookie,
  mfaPendingCookie,
  sessionIssuedAt,
  safeEqual,
  isSecure,
  requireAdmin,
  requireSuperAdmin,
} from "./auth.js";

process.env.SESSION_SECRET = "secret-de-test";

const queryMock = vi.hoisted(() => vi.fn());
vi.mock("./db.js", () => ({ query: queryMock }));

const SESSION_MS = 1000 * 60 * 60 * 12;

const activeAdminRow = {
  id: "superadmin-jehubin",
  email: "jehubin@gmail.com",
  username: "jehubin",
  role: "superadmin",
  status: "active",
  password_hash: "scrypt$aa$bb",
  avatar: null,
  password_changed_at: null,
};

function reqWithCookie(cookie?: string) {
  return { headers: cookie ? { cookie } : {} } as never;
}

function mockRes() {
  const res: {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  } = {
    status: vi.fn(() => res),
    json: vi.fn(() => res),
  };
  return res as unknown as import("@vercel/node").VercelResponse;
}

beforeEach(() => {
  queryMock.mockReset();
});

describe("createSessionToken / getSessionAdmin", () => {
  it("accepte un jeton valide pour un compte actif", async () => {
    const token = createSessionToken(SESSION_MS, "superadmin-jehubin");
    queryMock.mockResolvedValue([activeAdminRow]);

    const admin = await getSessionAdmin(
      reqWithCookie(`motom_admin=${token}`),
    );

    expect(admin).toMatchObject({
      id: "superadmin-jehubin",
      email: "jehubin@gmail.com",
      role: "superadmin",
      status: "active",
    });
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("FROM admins WHERE id"),
      "superadmin-jehubin",
    );
  });

  it("refuse un jeton sans cookie (aucune requête en base)", async () => {
    expect(await getSessionAdmin(reqWithCookie())).toBeNull();
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("refuse un jeton falsifié (signature altérée)", async () => {
    const token = createSessionToken(SESSION_MS, "superadmin-jehubin");
    const [exp, iat, adminId] = token.split(".");
    const tampered = `${exp}.${iat}.${adminId}.${"0".repeat(64)}`;
    expect(await getSessionAdmin(reqWithCookie(`motom_admin=${tampered}`))).toBeNull();
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("refuse un jeton dont l'identifiant a été modifié", async () => {
    const token = createSessionToken(SESSION_MS, "superadmin-jehubin");
    const parts = token.split(".");
    const swapped = `${parts[0]}.${parts[1]}.${"autre-admin"}.${parts[3]}`;
    expect(await getSessionAdmin(reqWithCookie(`motom_admin=${swapped}`))).toBeNull();
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("refuse un jeton expiré", async () => {
    const issuedAt = Date.now() - SESSION_MS - 1000;
    const token = createSessionToken(SESSION_MS, "superadmin-jehubin", issuedAt);
    expect(await getSessionAdmin(reqWithCookie(`motom_admin=${token}`))).toBeNull();
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("refuse un jeton malformé", async () => {
    expect(await getSessionAdmin(reqWithCookie("motom_admin=trop.court"))).toBeNull();
    expect(
      await getSessionAdmin(reqWithCookie("motom_admin=a.b.c.d")),
    ).toBeNull();
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("retourne null si le compte n'existe plus", async () => {
    const token = createSessionToken(SESSION_MS, "fantome");
    queryMock.mockResolvedValue([]);
    expect(await getSessionAdmin(reqWithCookie(`motom_admin=${token}`))).toBeNull();
  });

  it("refuse un compte bloqué", async () => {
    const token = createSessionToken(SESSION_MS, "superadmin-jehubin");
    queryMock.mockResolvedValue([{ ...activeAdminRow, status: "blocked" }]);
    expect(await getSessionAdmin(reqWithCookie(`motom_admin=${token}`))).toBeNull();
  });

  it("invalide les sessions émises avant un changement de mot de passe", async () => {
    const token = createSessionToken(
      SESSION_MS,
      "superadmin-jehubin",
      Date.now() - 60_000,
    );
    queryMock.mockResolvedValue([
      { ...activeAdminRow, password_changed_at: new Date().toISOString() },
    ]);
    expect(await getSessionAdmin(reqWithCookie(`motom_admin=${token}`))).toBeNull();
  });

  it("retourne null si la base échoue (jamais d'exception)", async () => {
    const token = createSessionToken(SESSION_MS, "superadmin-jehubin");
    queryMock.mockRejectedValue(new Error("panne réseau"));
    expect(await getSessionAdmin(reqWithCookie(`motom_admin=${token}`))).toBeNull();
  });
});

describe("cookies de session", () => {
  const secureReq = {
    headers: { "x-forwarded-proto": "https" },
  } as never;
  const plainReq = { headers: {} } as never;

  it("sessionCookie pose HttpOnly, SameSite=Lax, Path, Max-Age", () => {
    const cookie = sessionCookie(secureReq, "jeton", 43200);
    expect(cookie).toContain("motom_admin=jeton");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("Max-Age=43200");
    expect(cookie).toContain("Secure");
  });

  it("pas de Secure sur une connexion non chiffrée", () => {
    expect(sessionCookie(plainReq, "jeton", 43200)).not.toContain("Secure");
  });

  it("mfaPendingCookie utilise le même durcissement", () => {
    const cookie = mfaPendingCookie(secureReq, "attente", 600);
    expect(cookie).toContain("motom_mfa=attente");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
  });
});

describe("isSecure", () => {
  it("lit x-forwarded-proto (liste ou chaîne simple)", () => {
    expect(isSecure({ headers: { "x-forwarded-proto": "https" } } as never)).toBe(true);
    expect(
      isSecure({ headers: { "x-forwarded-proto": ["https", "http"] } } as never),
    ).toBe(true);
    expect(isSecure({ headers: { "x-forwarded-proto": "https, http" } } as never)).toBe(
      true,
    );
    expect(isSecure({ headers: { "x-forwarded-proto": "http" } } as never)).toBe(false);
    expect(isSecure({ headers: {} } as never)).toBe(false);
  });
});

describe("jeton MFA en attente", () => {
  it("aller-retour valide", () => {
    const token = createMfaPendingToken("superadmin-jehubin");
    const req = reqWithCookie(`motom_mfa=${token}`);
    expect(readMfaPending(req)).toBe("superadmin-jehubin");
  });

  it("refuse un jeton falsifié", () => {
    const token = createMfaPendingToken("superadmin-jehubin");
    const [exp, adminId] = token.split(".");
    const tampered = `${exp}.${adminId}.${"f".repeat(64)}`;
    expect(readMfaPending(reqWithCookie(`motom_mfa=${tampered}`))).toBeNull();
  });

  it("refuse un jeton expiré", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-01-01T10:00:00Z"));
      const token = createMfaPendingToken("superadmin-jehubin");
      expect(readMfaPending(reqWithCookie(`motom_mfa=${token}`))).toBe(
        "superadmin-jehubin",
      );
      vi.setSystemTime(new Date("2026-01-01T10:11:00Z")); // > 10 min
      expect(readMfaPending(reqWithCookie(`motom_mfa=${token}`))).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("refuse un jeton de session utilisé à la place du jeton MFA", () => {
    const session = createSessionToken(SESSION_MS, "superadmin-jehubin");
    expect(readMfaPending(reqWithCookie(`motom_mfa=${session}`))).toBeNull();
  });

  it("refuse l'absence de cookie", () => {
    expect(readMfaPending(reqWithCookie())).toBeNull();
  });
});

describe("requireAdmin / requireSuperAdmin", () => {
  it("401 JSON sans session", async () => {
    const res = mockRes();
    expect(await requireAdmin(reqWithCookie(), res)).toBeNull();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Non autorisé" });
  });

  it("retourne l'admin connecté", async () => {
    const token = createSessionToken(SESSION_MS, "superadmin-jehubin");
    queryMock.mockResolvedValue([activeAdminRow]);
    const admin = await requireAdmin(
      reqWithCookie(`motom_admin=${token}`),
      mockRes(),
    );
    expect(admin).toMatchObject({ id: "superadmin-jehubin" });
  });

  it("403 pour un admin non superadmin sur requireSuperAdmin", async () => {
    const token = createSessionToken(SESSION_MS, "superadmin-jehubin");
    queryMock.mockResolvedValue([{ ...activeAdminRow, role: "admin" }]);
    const res = mockRes();
    expect(await requireSuperAdmin(reqWithCookie(`motom_admin=${token}`), res)).toBeNull();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: "Accès réservé au superadmin",
    });
  });

  it("accepte un superadmin sur requireSuperAdmin", async () => {
    const token = createSessionToken(SESSION_MS, "superadmin-jehubin");
    queryMock.mockResolvedValue([activeAdminRow]);
    const admin = await requireSuperAdmin(
      reqWithCookie(`motom_admin=${token}`),
      mockRes(),
    );
    expect(admin).toMatchObject({ role: "superadmin" });
  });
});

describe("divers", () => {
  it("sessionIssuedAt ne recule jamais avant le dernier changement de mot de passe", () => {
    const now = Date.now();
    expect(sessionIssuedAt(null)).toBeGreaterThanOrEqual(now);
    // Changement passé : on reprend "maintenant", jamais une date antérieure
    const past = new Date("2020-01-01T00:00:00Z").toISOString();
    expect(sessionIssuedAt(past)).toBeGreaterThanOrEqual(now);
    // Changement future (horloge décalée) : on respecte la date du changement
    const future = new Date(Date.now() + 60_000).toISOString();
    expect(sessionIssuedAt(future)).toBe(new Date(future).getTime());
  });

  it("safeEqual compare sans révéler la longueur", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcde")).toBe(false);
  });
});