import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rifas-guards-"));

type GlobalWithDb = typeof globalThis & { __rifasDb?: { close(): void } };

beforeEach(() => {
  vi.resetModules();

  // The connection is cached on globalThis, so a fresh import alone is not enough.
  const cached = (globalThis as GlobalWithDb).__rifasDb;
  cached?.close();
  delete (globalThis as GlobalWithDb).__rifasDb;
});

afterEach(() => {
  vi.unstubAllEnvs();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("production guards", () => {
  it("refuses to boot the database without ADMIN_PASSWORD", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ADMIN_PASSWORD", "");
    vi.stubEnv("DATABASE_PATH", path.join(tmpDir, "guard-admin.db"));

    const { getDb } = await import("./db");

    expect(() => getDb()).toThrow(/ADMIN_PASSWORD is required in production/);
  });

  it("refuses to build a session secret without SESSION_SECRET", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "");

    const { sessionSecret } = await import("./session-secret");

    expect(() => sessionSecret()).toThrow(
      /SESSION_SECRET is required in production/,
    );
  });

  it("uses the configured secret when it is present", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "un-secreto-real");

    const { sessionSecret } = await import("./session-secret");

    expect(sessionSecret()).toBe("un-secreto-real");
  });

  it("still boots in development with the local defaults", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ADMIN_PASSWORD", "");
    vi.stubEnv("ADMIN_USER", "admin");
    vi.stubEnv("DATABASE_PATH", path.join(tmpDir, "guard-dev.db"));

    const { getDb } = await import("./db");

    expect(() =>
      getDb().prepare("SELECT 1 FROM users LIMIT 1").get(),
    ).not.toThrow();
  });
});
