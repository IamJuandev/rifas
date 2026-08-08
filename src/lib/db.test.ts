import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rifas-test-"));

let mod: typeof import("./db");

beforeAll(async () => {
  process.env.DATABASE_PATH = path.join(tmpDir, "rifas.db");
  process.env.ADMIN_USER = "tester";
  process.env.ADMIN_PASSWORD = "secreto";
  mod = await import("./db");
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function crearRifa(nombre: string, valor: number): number {
  return Number(
    mod
      .getDb()
      .prepare("INSERT INTO rifas (nombre, valor_numero) VALUES (?, ?)")
      .run(nombre, valor).lastInsertRowid,
  );
}

function crearTicket(rifaId: number, numero: string, valor: number): number {
  return Number(
    mod
      .getDb()
      .prepare(
        `INSERT INTO tickets (rifa_id, numeracion, numero, nombre, valor_a_pagar)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(rifaId, mod.nextNumeracion(rifaId), numero, "Ana", valor)
      .lastInsertRowid,
  );
}

describe("database bootstrap", () => {
  it("creates the schema and seeds the admin user", () => {
    const user = mod
      .getDb()
      .prepare("SELECT username FROM users WHERE username = ?")
      .get("tester");

    expect(user).toEqual({ username: "tester" });
  });

  it("records the current schema version", () => {
    expect(mod.getDb().pragma("user_version", { simple: true })).toBe(3);
  });

  it("gives every ticket three empty apostado notes", () => {
    const rifaId = crearRifa("Rifa apostado", 20000);
    const ticketId = crearTicket(rifaId, "0808", 20000);

    const row = mod
      .getDb()
      .prepare(
        "SELECT apostado_1, apostado_2, apostado_3 FROM tickets WHERE id = ?",
      )
      .get(ticketId);

    expect(row).toEqual({ apostado_1: "", apostado_2: "", apostado_3: "" });
  });

  it("stores free-form text in the apostado notes", () => {
    const db = mod.getDb();
    const rifaId = crearRifa("Rifa texto libre", 20000);
    const ticketId = crearTicket(rifaId, "0909", 20000);

    db.prepare(
      "UPDATE tickets SET apostado_1 = ?, apostado_2 = ?, apostado_3 = ? WHERE id = ?",
    ).run("2000 efectivo", "2000", "pendiente", ticketId);

    const row = db
      .prepare(
        "SELECT apostado_1, apostado_2, apostado_3 FROM tickets WHERE id = ?",
      )
      .get(ticketId);

    expect(row).toEqual({
      apostado_1: "2000 efectivo",
      apostado_2: "2000",
      apostado_3: "pendiente",
    });
  });

  it("gives every raffle exactly 3 draw slots", () => {
    const rifaId = crearRifa("Rifa de prueba", 50000);
    mod.ensureSorteos(rifaId);
    mod.ensureSorteos(rifaId); // idempotent

    const sorteos = mod
      .getDb()
      .prepare("SELECT orden FROM sorteos WHERE rifa_id = ? ORDER BY orden")
      .all(rifaId);

    expect(sorteos).toEqual([{ orden: 1 }, { orden: 2 }, { orden: 3 }]);
  });

  it("rejects a duplicate number within the same raffle", () => {
    const rifaId = crearRifa("Rifa duplicados", 10000);
    crearTicket(rifaId, "0042", 10000);

    expect(() => crearTicket(rifaId, "0042", 10000)).toThrow(/UNIQUE/);
  });

  it("advances numeracion per raffle", () => {
    const rifaId = crearRifa("Rifa consecutivo", 10000);
    expect(mod.nextNumeracion(rifaId)).toBe(1);

    crearTicket(rifaId, "0001", 10000);
    expect(mod.nextNumeracion(rifaId)).toBe(2);
  });
});

describe("abonos ledger", () => {
  it("sums deposits as the total collected for a ticket", () => {
    const db = mod.getDb();
    const rifaId = crearRifa("Rifa abonos", 30000);
    const ticketId = crearTicket(rifaId, "4444", 30000);

    const insert = db.prepare(
      "INSERT INTO abonos (ticket_id, monto, fecha) VALUES (?, ?, ?)",
    );
    insert.run(ticketId, 1000, "2026-08-01");
    insert.run(ticketId, 5000, "2026-08-05");

    const { abonado } = db
      .prepare(
        "SELECT COALESCE(SUM(monto), 0) AS abonado FROM abonos WHERE ticket_id = ?",
      )
      .get(ticketId) as { abonado: number };

    expect(abonado).toBe(6000);
  });

  it("deletes the deposits when the ticket is deleted", () => {
    const db = mod.getDb();
    const rifaId = crearRifa("Rifa cascada", 30000);
    const ticketId = crearTicket(rifaId, "5555", 30000);

    db.prepare(
      "INSERT INTO abonos (ticket_id, monto, fecha) VALUES (?, ?, ?)",
    ).run(ticketId, 3000, "2026-08-01");

    db.prepare("DELETE FROM tickets WHERE id = ?").run(ticketId);

    const restantes = db
      .prepare("SELECT COUNT(*) AS total FROM abonos WHERE ticket_id = ?")
      .get(ticketId) as { total: number };

    expect(restantes.total).toBe(0);
  });
});
