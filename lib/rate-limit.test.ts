import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createDbRateLimiter } from "./rate-limit.js";

const queryMock = vi.hoisted(() => vi.fn());
vi.mock("./db.js", () => ({ query: queryMock }));

function makeReq(ip = "41.202.10.5") {
  return { headers: { "x-forwarded-for": ip } } as unknown as import("@vercel/node").VercelRequest;
}

function makeRes() {
  const res = {
    status: vi.fn(() => res),
    json: vi.fn(() => res),
    setHeader: vi.fn(),
  };
  return { res, asResponse: res as unknown as import("@vercel/node").VercelResponse };
}

const inWindow = (count: number, minutes = 10) => [
  { count, reset_at: new Date(Date.now() + minutes * 60_000).toISOString() },
];

beforeEach(() => {
  queryMock.mockReset();
  // Désactive la purge opportuniste (1 chance sur 50) pour des assertions stables.
  vi.spyOn(Math, "random").mockReturnValue(0.5);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createDbRateLimiter", () => {
  it("autorise tant que le compteur reste sous le seuil", async () => {
    const limit = createDbRateLimiter({ windowMs: 60_000, max: 3, label: "login" });
    const { res, asResponse } = makeRes();

    queryMock.mockResolvedValue(inWindow(1));
    expect(await limit(makeReq(), asResponse)).toBe(true);
    queryMock.mockResolvedValue(inWindow(3));
    expect(await limit(makeReq(), asResponse)).toBe(true);

    expect(res.status).not.toHaveBeenCalled();
  });

  it("refuse au-delà du seuil avec 429 et Retry-After", async () => {
    const limit = createDbRateLimiter({ windowMs: 60_000, max: 3, label: "login" });
    const { res, asResponse } = makeRes();

    queryMock.mockResolvedValue(inWindow(4, 5));
    expect(await limit(makeReq(), asResponse)).toBe(false);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.setHeader).toHaveBeenCalledWith("Retry-After", expect.stringMatching(/^\d+$/));
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining("Trop de tentatives") }),
    );
  });

  it("remet le compteur à 1 quand la fenêtre est expirée (comportement SQL)", async () => {
    const limit = createDbRateLimiter({ windowMs: 60_000, max: 2, label: "login" });
    const { asResponse } = makeRes();

    // La requête SQL renvoie déjà count=1 pour une nouvelle fenêtre.
    queryMock.mockResolvedValue(inWindow(1));
    expect(await limit(makeReq(), asResponse)).toBe(true);
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("ON CONFLICT"),
      "login:41.202.10.5",
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    );
  });

  it("utilise la clé label + IP du client", async () => {
    const limit = createDbRateLimiter({ windowMs: 60_000, max: 3, label: "contact" });
    const { asResponse } = makeRes();

    queryMock.mockResolvedValue(inWindow(1));
    await limit(makeReq("196.44.1.2"), asResponse);

    expect(queryMock.mock.calls[0][1]).toBe("contact:196.44.1.2");
  });

  it("laisse passer sans casser l'appelant si la base est indisponible", async () => {
    const limit = createDbRateLimiter({ windowMs: 60_000, max: 3, label: "login" });
    const { res, asResponse } = makeRes();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    queryMock.mockRejectedValue(new Error("panne base"));
    expect(await limit(makeReq(), asResponse)).toBe(true);
    expect(res.status).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
  });
});
