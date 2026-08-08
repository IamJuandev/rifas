import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";

export const SORTEOS_POR_RIFA = 3;

const DB_PATH =
  process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "rifas.db");

function createConnection() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  const connection = new Database(DB_PATH, { timeout: 5000 });
  connection.pragma("journal_mode = WAL");
  connection.pragma("foreign_keys = ON");

  migrate(connection);
  seedAdmin(connection);

  return connection;
}

const SCHEMA_VERSION = 3;

function migrate(connection: Database.Database) {
  const current = connection.pragma("user_version", {
    simple: true,
  }) as number;

  if (current < 1) migrateToV1(connection);
  if (current < 2) migrateToV2(connection);
  if (current < 3) migrateToV3(connection);

  connection.pragma(`user_version = ${SCHEMA_VERSION}`);
}

function migrateToV1(connection: Database.Database) {
  connection.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS rifas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      valor_numero INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sorteos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rifa_id INTEGER NOT NULL REFERENCES rifas(id) ON DELETE CASCADE,
      orden INTEGER NOT NULL,
      fecha TEXT,
      numero_ganador TEXT,
      UNIQUE (rifa_id, orden)
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rifa_id INTEGER NOT NULL REFERENCES rifas(id) ON DELETE CASCADE,
      numeracion INTEGER NOT NULL,
      numero TEXT NOT NULL,
      nombre TEXT NOT NULL,
      telefono TEXT NOT NULL DEFAULT '',
      valor_pagado INTEGER NOT NULL DEFAULT 0,
      valor_abonado INTEGER NOT NULL DEFAULT 0,
      pagado INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (rifa_id, numero)
    );

    CREATE INDEX IF NOT EXISTS idx_tickets_rifa ON tickets(rifa_id);
  `);
}

/**
 * Payments become a ledger: `abonos` is the single source of truth for how much
 * a ticket has paid, so the cached `valor_abonado` / `pagado` columns are gone
 * and the price is always the raffle price (`valor_a_pagar`).
 */
function migrateToV2(connection: Database.Database) {
  const tx = connection.transaction(() => {
    connection.exec(`
      CREATE TABLE IF NOT EXISTS abonos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
        monto INTEGER NOT NULL,
        fecha TEXT NOT NULL,
        nota TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_abonos_ticket ON abonos(ticket_id);

      ALTER TABLE tickets RENAME COLUMN valor_pagado TO valor_a_pagar;

      INSERT INTO abonos (ticket_id, monto, fecha, nota)
      SELECT id, valor_abonado, date(created_at, 'localtime'), 'Abono migrado'
      FROM tickets
      WHERE valor_abonado > 0;

      ALTER TABLE tickets DROP COLUMN valor_abonado;
      ALTER TABLE tickets DROP COLUMN pagado;
    `);
  });

  tx();
}

/**
 * Free-form "apostado" note per draw. The client asked for the fields without
 * explaining what goes in them, so they stay TEXT: any content fits, and no
 * data is lost when the meaning is finally pinned down.
 */
function migrateToV3(connection: Database.Database) {
  connection.exec(`
    ALTER TABLE tickets ADD COLUMN apostado_1 TEXT NOT NULL DEFAULT '';
    ALTER TABLE tickets ADD COLUMN apostado_2 TEXT NOT NULL DEFAULT '';
    ALTER TABLE tickets ADD COLUMN apostado_3 TEXT NOT NULL DEFAULT '';
  `);
}

function seedAdmin(connection: Database.Database) {
  const username = process.env.ADMIN_USER ?? "admin";
  const password = process.env.ADMIN_PASSWORD;

  // A published default password is no password at all.
  if (!password) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "ADMIN_PASSWORD is required in production so the app never boots with a known password.",
      );
    }

    return seed(connection, username, "admin123");
  }

  return seed(connection, username, password);
}

function seed(
  connection: Database.Database,
  username: string,
  password: string,
) {
  const existing = connection
    .prepare("SELECT id FROM users WHERE username = ?")
    .get(username);

  if (existing) return;

  connection
    .prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
    .run(username, bcrypt.hashSync(password, 10));
}

const globalForDb = globalThis as unknown as { __rifasDb?: Database.Database };

/**
 * Opens the connection lazily: the build step evaluates these modules without
 * ever serving a request, and eager connections collide on the WAL lock.
 */
export function getDb(): Database.Database {
  if (!globalForDb.__rifasDb) {
    globalForDb.__rifasDb = createConnection();
  }

  return globalForDb.__rifasDb;
}

export type RifaRow = {
  id: number;
  nombre: string;
  valor_numero: number;
  created_at: string;
};

export type SorteoRow = {
  id: number;
  rifa_id: number;
  orden: number;
  fecha: string | null;
  numero_ganador: string | null;
};

export type TicketRow = {
  id: number;
  rifa_id: number;
  numeracion: number;
  numero: string;
  nombre: string;
  telefono: string;
  valor_a_pagar: number;
  apostado_1: string;
  apostado_2: string;
  apostado_3: string;
  created_at: string;
};

/** A ticket plus the total already collected through its `abonos` ledger. */
export type TicketConAbonos = TicketRow & { abonado: number };

export type AbonoRow = {
  id: number;
  ticket_id: number;
  monto: number;
  fecha: string;
  nota: string;
  created_at: string;
};

/** Ensures a raffle always exposes exactly SORTEOS_POR_RIFA draw slots. */
export function ensureSorteos(rifaId: number) {
  const insert = getDb().prepare(
    "INSERT OR IGNORE INTO sorteos (rifa_id, orden) VALUES (?, ?)",
  );

  const tx = getDb().transaction(() => {
    for (let orden = 1; orden <= SORTEOS_POR_RIFA; orden += 1) {
      insert.run(rifaId, orden);
    }
  });

  tx();
}

export function nextNumeracion(rifaId: number): number {
  const row = getDb()
    .prepare(
      "SELECT COALESCE(MAX(numeracion), 0) AS max FROM tickets WHERE rifa_id = ?",
    )
    .get(rifaId) as { max: number };

  return row.max + 1;
}
