import { afterEach, describe, expect, it, vi } from "vitest";
import { adminOrigin } from "./http.js";

describe("adminOrigin", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("vise le back-office par défaut", () => {
    vi.stubEnv("ADMIN_URL", "");
    expect(adminOrigin()).toBe("https://motom-admin.vercel.app");
  });

  it("respecte ADMIN_URL et retire la barre oblique finale", () => {
    vi.stubEnv("ADMIN_URL", "https://admin.exemple.cf/");
    expect(adminOrigin()).toBe("https://admin.exemple.cf");
  });
});
