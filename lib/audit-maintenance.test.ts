import type { VercelRequest, VercelResponse } from "@vercel/node";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { queryMock } = vi.hoisted(() => ({ queryMock: vi.fn() }));

vi.mock("./db.js", () => ({ query: queryMock }));
vi.mock("./email.js", () => ({}));
vi.mock("./rate-limit.js", () => ({
  createRateLimiter: () => () => true,
  createDbRateLimiter: () => async () => true,
}));
vi.mock("./auth.js", () => ({
  requireAdmin: vi.fn(),
  requireSuperAdmin: vi.fn(async () => ({
    id: "admin-1",
    email: "boss@motom.cf",
    username: "boss",
    role: "superadmin",
  })),
  sessionCookie: vi.fn(),
  createSessionToken: vi.fn(),
  sessionIssuedAt: vi.fn(),
}));

import handler from "../api/admins/[id].ts";

type MockResponse = {
  statusCode: number;
  payload: unknown;
  headers: Record<string, string>;
  status: (code: number) => MockResponse;
  json: (payload: unknown) => MockResponse;
  setHeader: (key: string, value: string) => MockResponse;
};

function makeRes(): MockResponse {
  return {
    statusCode: 200,
    payload: undefined,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
    setHeader(key, value) {
      this.headers[key] = value;
      return this;
    },
  };
}

function asResponse(res: MockResponse): VercelResponse {
  return res as unknown as VercelResponse;
}

function makeReq(options: {
  method: string;
  query?: Record<string, string>;
  body?: unknown;
}): VercelRequest {
  return {
    method: options.method,
    query: { id: "audit", ...options.query },
    headers: { "user-agent": "vitest", "x-forwarded-for": "41.202.1.1" },
    body: options.body,
  } as unknown as VercelRequest;
}

function importInserts() {
  return queryMock.mock.calls.filter(([sql]) =>
    String(sql).includes("ON CONFLICT (id) DO NOTHING")
  );
}

function auditEvents(action: string) {
  return queryMock.mock.calls.filter(
    ([sql, ...params]) =>
      String(sql).includes("INSERT INTO audit_log") && params[5] === action
  );
}

describe("import du journal d'audit", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("importe les événements valides et compte doublons et invalides", async () => {
    queryMock.mockImplementation(async (sql: string, ...params: unknown[]) => {
      if (String(sql).includes("ON CONFLICT (id) DO NOTHING")) {
        return params[0] === "audit-exists" ? [] : [{ id: params[0] }];
      }
      return [];
    });

    const res = makeRes();
    await handler(
      makeReq({
        method: "POST",
        body: {
          events: [
            {
              id: "audit-new",
              action: "property.create",
              entityType: "property",
              createdAt: "2026-01-01T10:00:00.000Z",
              metadata: { title: "Villa" },
              ip: "41.202.1.1",
            },
            { action: "auth.login.success", entityType: "auth" },
            { id: "audit-exists", action: "faq.create", entityType: "faq" },
            { action: "", entityType: "faq" },
            { action: "faq.update", entityType: "faq", metadata: "pas du json" },
          ],
        },
      }),
      asResponse(res)
    );

    expect(res.statusCode).toBe(200);
    expect(res.payload).toMatchObject({
      success: true,
      imported: 2,
      skipped: 1,
      invalid: 2,
    });
    expect(importInserts()).toHaveLength(3);

    const [trace] = auditEvents("audit.import");
    expect(trace?.[1]).toMatch(/^audit-/);
    expect(JSON.parse(String(trace?.[12]))).toMatchObject({
      imported: 2,
      skipped: 1,
      invalid: 2,
    });
  });

  it("refuse un corps sans tableau events", async () => {
    const res = makeRes();
    await handler(makeReq({ method: "POST", body: {} }), asResponse(res));

    expect(res.statusCode).toBe(400);
    expect(importInserts()).toHaveLength(0);
    expect(auditEvents("audit.import")).toHaveLength(0);
  });

  it("refuse plus de 5 000 événements", async () => {
    const res = makeRes();
    await handler(
      makeReq({
        method: "POST",
        body: { events: Array.from({ length: 5001 }, () => ({ action: "faq.create", entityType: "faq" })) },
      }),
      asResponse(res)
    );

    expect(res.statusCode).toBe(413);
    expect(importInserts()).toHaveLength(0);
  });
});

describe("purge du journal d'audit", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("supprime les événements plus anciens que la période demandée", async () => {
    queryMock.mockImplementation(async (sql: string) => {
      if (String(sql).includes("DELETE FROM audit_log")) {
        return [{ id: "audit-1" }, { id: "audit-2" }, { id: "audit-3" }];
      }
      return [];
    });

    const res = makeRes();
    await handler(
      makeReq({ method: "DELETE", query: { id: "audit", beforeDays: "90" } }),
      asResponse(res)
    );

    expect(res.statusCode).toBe(200);
    expect(res.payload).toMatchObject({ success: true, deleted: 3, olderThanDays: 90 });

    const [deleteCall] = queryMock.mock.calls.filter(([sql]) =>
      String(sql).includes("DELETE FROM audit_log")
    );
    expect(String(deleteCall?.[0])).toContain("make_interval(days => $1)");
    expect(deleteCall?.[1]).toBe(90);

    const [trace] = auditEvents("audit.purge");
    expect(JSON.parse(String(trace?.[12]))).toMatchObject({
      deleted: 3,
      scope: "plus de 90 jours",
    });
  });

  it("purge tout l'historique quand aucune période n'est fournie", async () => {
    queryMock.mockImplementation(async (sql: string) =>
      String(sql).includes("DELETE FROM audit_log") ? [{ id: "audit-1" }] : []
    );

    const res = makeRes();
    await handler(makeReq({ method: "DELETE", query: { id: "audit" } }), asResponse(res));

    expect(res.statusCode).toBe(200);
    expect(res.payload).toMatchObject({ deleted: 1, olderThanDays: 0 });

    const [deleteCall] = queryMock.mock.calls.filter(([sql]) =>
      String(sql).includes("DELETE FROM audit_log")
    );
    expect(String(deleteCall?.[0])).not.toContain("WHERE");

    const [trace] = auditEvents("audit.purge");
    expect(JSON.parse(String(trace?.[12]))).toMatchObject({ scope: "tout l'historique" });
  });
});
