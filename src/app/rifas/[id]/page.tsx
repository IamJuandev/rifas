import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  getDb,
  ensureSorteos,
  type AbonoRow,
  type RifaRow,
  type SorteoRow,
  type TicketConAbonos,
} from "@/lib/db";
import { fechaLocal, formatMoney, totales } from "@/lib/tickets";
import { puedeEliminarse } from "@/lib/rifas";
import { Header } from "@/components/header";
import { SorteosForm } from "@/components/sorteos-form";
import { TicketForm } from "@/components/ticket-form";
import { TicketsTable } from "@/components/tickets-table";
import { AbonosPanel } from "@/components/abonos-panel";
import {
  EditarRifaForm,
  EliminarRifaBoton,
} from "@/components/rifa-acciones";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string; abonos?: string; editar?: string }>;
};

export default async function RifaPage({ params, searchParams }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const db = getDb();
  const { id } = await params;
  const { edit, abonos, editar } = await searchParams;
  const rifaId = Number(id);

  const rifa = db.prepare("SELECT * FROM rifas WHERE id = ?").get(rifaId) as
    | RifaRow
    | undefined;

  if (!rifa) notFound();

  ensureSorteos(rifa.id);

  const sorteos = db
    .prepare("SELECT * FROM sorteos WHERE rifa_id = ? ORDER BY orden")
    .all(rifa.id) as SorteoRow[];

  const tickets = db
    .prepare(
      `SELECT t.*, COALESCE(SUM(a.monto), 0) AS abonado
       FROM tickets t
       LEFT JOIN abonos a ON a.ticket_id = t.id
       WHERE t.rifa_id = ?
       GROUP BY t.id
       ORDER BY t.numeracion`,
    )
    .all(rifa.id) as TicketConAbonos[];

  const resumen = totales(
    tickets.map((t) => ({ valorAPagar: t.valor_a_pagar, abonado: t.abonado })),
  );

  const veredicto = puedeEliminarse(sorteos, fechaLocal(new Date()));
  const bloqueo = veredicto.puede ? null : veredicto.motivo;

  const fechasSorteo = sorteos.map((s) => s.fecha);
  const editandoRifa = editar === "1";
  const editing = tickets.find((t) => t.id === Number(edit));
  const abonando = tickets.find((t) => t.id === Number(abonos));

  const historico = abonando
    ? (db
        .prepare(
          "SELECT * FROM abonos WHERE ticket_id = ? ORDER BY fecha DESC, id DESC",
        )
        .all(abonando.id) as AbonoRow[])
    : [];

  return (
    <>
      <Header username={session.username} />

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <div>
          <Link href="/" className="text-sm text-teal-700">
            ← Volver
          </Link>

          <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">{rifa.nombre}</h1>
              <p className="text-sm text-slate-500">
                Valor por número: {formatMoney(rifa.valor_numero)}
              </p>
            </div>

            <div className="flex items-start gap-2">
              <Link
                href={`/rifas/${rifa.id}?editar=1`}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              >
                Editar
              </Link>
              <EliminarRifaBoton rifa={rifa} bloqueo={bloqueo} />
            </div>
          </div>

          {bloqueo ? (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {bloqueo}
            </p>
          ) : null}
        </div>

        {editandoRifa ? (
          <section className="rounded-2xl border-2 border-teal-600 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold">Editar rifa</h2>
            <EditarRifaForm rifa={rifa} />
          </section>
        ) : null}

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            label="Números vendidos"
            value={`${resumen.vendidos} (${resumen.pagos} pagos)`}
          />
          <Stat label="Esperado" value={formatMoney(resumen.esperado)} />
          <Stat
            label="Recaudado"
            value={formatMoney(resumen.recaudado)}
            tone="text-teal-700"
          />
          <Stat
            label="Pendiente"
            value={formatMoney(resumen.pendiente)}
            tone="text-amber-600"
          />
        </dl>

        {abonando ? (
          <AbonosPanel
            rifaId={rifa.id}
            ticket={abonando}
            abonos={historico}
            fechasSorteo={fechasSorteo}
          />
        ) : null}

        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold">
            {editing ? `Editar número ${editing.numero}` : "Registrar número"}
          </h2>
          <TicketForm
            rifaId={rifa.id}
            valorNumero={rifa.valor_numero}
            ticket={editing}
          />
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold">Fechas de sorteo</h2>
          <p className="text-sm text-slate-500">
            Cada número participa en los 3 sorteos de esta rifa.
          </p>
          <SorteosForm rifaId={rifa.id} sorteos={sorteos} />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Números</h2>
          <TicketsTable tickets={tickets} fechasSorteo={fechasSorteo} />
        </section>
      </main>
    </>
  );
}

function Stat({
  label,
  value,
  tone = "",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className={`mt-1 text-lg font-semibold ${tone}`}>{value}</dd>
    </div>
  );
}
