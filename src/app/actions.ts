"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession, login, logout } from "@/lib/auth";
import {
  ensureSorteos,
  getDb,
  nextNumeracion,
  SORTEOS_POR_RIFA,
  type RifaRow,
} from "@/lib/db";
import { fechaLocal, normalizeNumero, saldo } from "@/lib/tickets";
import { puedeEliminarse, type SorteoFecha } from "@/lib/rifas";

export type FormState = { error?: string };

async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

function toInt(value: FormDataEntryValue | null): number {
  const parsed = Number(String(value ?? "").replace(/[^\d-]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : 0;
}

function hoy(): string {
  return fechaLocal(new Date());
}

function abonadoDe(ticketId: number): number {
  const row = getDb()
    .prepare(
      "SELECT COALESCE(SUM(monto), 0) AS total FROM abonos WHERE ticket_id = ?",
    )
    .get(ticketId) as { total: number };

  return row.total;
}

export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Usuario y contraseña son obligatorios." };
  }

  if (!(await login(username, password))) {
    return { error: "Credenciales inválidas." };
  }

  redirect("/");
}

export async function logoutAction() {
  await logout();
  redirect("/login");
}

export async function crearRifa(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSession();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const valorNumero = toInt(formData.get("valorNumero"));

  if (!nombre) return { error: "El nombre de la rifa es obligatorio." };

  const result = getDb()
    .prepare("INSERT INTO rifas (nombre, valor_numero) VALUES (?, ?)")
    .run(nombre, valorNumero);

  ensureSorteos(Number(result.lastInsertRowid));
  revalidatePath("/");

  return {};
}

export async function actualizarRifa(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSession();

  const rifaId = Number(formData.get("rifaId"));
  const nombre = String(formData.get("nombre") ?? "").trim();
  const valorNumero = toInt(formData.get("valorNumero"));

  if (!nombre) return { error: "El nombre de la rifa es obligatorio." };

  // Tickets keep the price they were sold at; only new ones use the new value.
  getDb()
    .prepare("UPDATE rifas SET nombre = ?, valor_numero = ? WHERE id = ?")
    .run(nombre, valorNumero, rifaId);

  revalidatePath(`/rifas/${rifaId}`);
  revalidatePath("/");

  return {};
}

export async function eliminarRifa(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSession();

  const db = getDb();
  const rifaId = Number(formData.get("rifaId"));

  const sorteos = db
    .prepare("SELECT orden, fecha FROM sorteos WHERE rifa_id = ? ORDER BY orden")
    .all(rifaId) as SorteoFecha[];

  // Checked again here: the button can be hidden, the request can still arrive.
  const veredicto = puedeEliminarse(sorteos, hoy());
  if (!veredicto.puede) return { error: veredicto.motivo };

  db.prepare("DELETE FROM rifas WHERE id = ?").run(rifaId);

  revalidatePath("/");
  redirect("/");
}

export async function guardarSorteos(formData: FormData) {
  await requireSession();

  const rifaId = Number(formData.get("rifaId"));
  const update = getDb().prepare(
    "UPDATE sorteos SET fecha = ?, numero_ganador = ? WHERE rifa_id = ? AND orden = ?",
  );

  const tx = getDb().transaction(() => {
    for (let orden = 1; orden <= SORTEOS_POR_RIFA; orden += 1) {
      const fecha = String(formData.get(`fecha_${orden}`) ?? "").trim();
      const ganador = normalizeNumero(
        String(formData.get(`ganador_${orden}`) ?? ""),
      );

      update.run(fecha || null, ganador, rifaId, orden);
    }
  });

  tx();
  revalidatePath(`/rifas/${rifaId}`);
}

export async function guardarTicket(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSession();

  const db = getDb();
  const rifaId = Number(formData.get("rifaId"));
  const ticketId = Number(formData.get("ticketId")) || null;

  const numero = normalizeNumero(String(formData.get("numero") ?? ""));
  const nombre = String(formData.get("nombre") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  const abonoInicial = toInt(formData.get("abonoInicial"));
  const apostados = [1, 2, 3].map((n) =>
    String(formData.get(`apostado_${n}`) ?? "").trim(),
  );

  if (!numero) return { error: "El número debe tener entre 1 y 4 dígitos." };
  if (!nombre) return { error: "El nombre de la persona es obligatorio." };

  const rifa = db.prepare("SELECT * FROM rifas WHERE id = ?").get(rifaId) as
    | RifaRow
    | undefined;

  if (!rifa) return { error: "La rifa no existe." };

  if (abonoInicial > rifa.valor_numero) {
    return { error: "El abono no puede superar el valor de la rifa." };
  }

  try {
    if (ticketId) {
      // The price always mirrors the raffle price, so editing never touches it.
      db.prepare(
        `UPDATE tickets
         SET numero = ?, nombre = ?, telefono = ?,
             apostado_1 = ?, apostado_2 = ?, apostado_3 = ?
         WHERE id = ? AND rifa_id = ?`,
      ).run(numero, nombre, telefono, ...apostados, ticketId, rifaId);
    } else {
      const tx = db.transaction(() => {
        const inserted = db
          .prepare(
            `INSERT INTO tickets
               (rifa_id, numeracion, numero, nombre, telefono, valor_a_pagar,
                apostado_1, apostado_2, apostado_3)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(
            rifaId,
            nextNumeracion(rifaId),
            numero,
            nombre,
            telefono,
            rifa.valor_numero,
            ...apostados,
          );

        if (abonoInicial > 0) {
          db.prepare(
            "INSERT INTO abonos (ticket_id, monto, fecha, nota) VALUES (?, ?, ?, ?)",
          ).run(
            Number(inserted.lastInsertRowid),
            abonoInicial,
            hoy(),
            "Abono inicial",
          );
        }
      });

      tx();
    }
  } catch (error) {
    if (String(error).includes("UNIQUE")) {
      return { error: `El número ${numero} ya está asignado en esta rifa.` };
    }
    throw error;
  }

  revalidatePath(`/rifas/${rifaId}`);
  return {};
}

export async function agregarAbono(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSession();

  const db = getDb();
  const rifaId = Number(formData.get("rifaId"));
  const ticketId = Number(formData.get("ticketId"));
  const monto = toInt(formData.get("monto"));
  const fecha = String(formData.get("fecha") ?? "").trim() || hoy();
  const nota = String(formData.get("nota") ?? "").trim();

  if (monto <= 0) return { error: "El abono debe ser mayor a cero." };

  const ticket = db
    .prepare("SELECT valor_a_pagar FROM tickets WHERE id = ? AND rifa_id = ?")
    .get(ticketId, rifaId) as { valor_a_pagar: number } | undefined;

  if (!ticket) return { error: "El número no existe en esta rifa." };

  const pendiente = saldo(ticket.valor_a_pagar, abonadoDe(ticketId));
  if (monto > pendiente) {
    return { error: "El abono no puede superar el saldo pendiente." };
  }

  db.prepare(
    "INSERT INTO abonos (ticket_id, monto, fecha, nota) VALUES (?, ?, ?, ?)",
  ).run(ticketId, monto, fecha, nota);

  revalidatePath(`/rifas/${rifaId}`);
  return {};
}

/** Marks a ticket as paid by recording the outstanding balance as one deposit. */
export async function abonarSaldo(formData: FormData) {
  await requireSession();

  const db = getDb();
  const rifaId = Number(formData.get("rifaId"));
  const ticketId = Number(formData.get("ticketId"));

  const ticket = db
    .prepare("SELECT valor_a_pagar FROM tickets WHERE id = ? AND rifa_id = ?")
    .get(ticketId, rifaId) as { valor_a_pagar: number } | undefined;

  if (!ticket) return;

  const pendiente = saldo(ticket.valor_a_pagar, abonadoDe(ticketId));
  if (pendiente <= 0) return;

  db.prepare(
    "INSERT INTO abonos (ticket_id, monto, fecha, nota) VALUES (?, ?, ?, ?)",
  ).run(ticketId, pendiente, hoy(), "Saldo cancelado");

  revalidatePath(`/rifas/${rifaId}`);
}

export async function eliminarAbono(formData: FormData) {
  await requireSession();

  const rifaId = Number(formData.get("rifaId"));
  getDb()
    .prepare("DELETE FROM abonos WHERE id = ?")
    .run(Number(formData.get("abonoId")));

  revalidatePath(`/rifas/${rifaId}`);
}

export async function eliminarTicket(formData: FormData) {
  await requireSession();

  const rifaId = Number(formData.get("rifaId"));
  getDb()
    .prepare("DELETE FROM tickets WHERE id = ?")
    .run(Number(formData.get("ticketId")));

  revalidatePath(`/rifas/${rifaId}`);
}
