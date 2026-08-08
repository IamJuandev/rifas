import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Health probe. `adminSince` is the creation date of the seeded admin user: if
 * it changes after a redeploy, the SQLite volume is NOT persisting and the
 * database was rebuilt from scratch.
 */
export function GET() {
  try {
    const db = getDb();

    const admin = db
      .prepare("SELECT created_at FROM users ORDER BY id LIMIT 1")
      .get() as { created_at: string } | undefined;

    const counts = db
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM rifas) AS rifas,
           (SELECT COUNT(*) FROM tickets) AS tickets,
           (SELECT COUNT(*) FROM abonos) AS abonos`,
      )
      .get() as { rifas: number; tickets: number; abonos: number };

    return NextResponse.json({
      ok: true,
      schemaVersion: db.pragma("user_version", { simple: true }),
      adminSince: admin?.created_at ?? null,
      ...counts,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "unknown" },
      { status: 500 },
    );
  }
}
