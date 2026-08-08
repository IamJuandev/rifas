import Link from "next/link";
import { eliminarAbono } from "@/app/actions";
import type { AbonoRow, TicketConAbonos } from "@/lib/db";
import { formatFecha, formatMoney, saldo } from "@/lib/tickets";
import { AbonoForm } from "@/components/abono-form";
import { CopiarMensaje } from "@/components/copiar-mensaje";
import { linkWhatsApp, mensajeEstado } from "@/lib/mensajes";

export function AbonosPanel({
  rifaId,
  ticket,
  abonos,
  fechasSorteo,
}: {
  rifaId: number;
  ticket: TicketConAbonos;
  abonos: AbonoRow[];
  fechasSorteo: Array<string | null>;
}) {
  const pendiente = saldo(ticket.valor_a_pagar, ticket.abonado);

  // The panel follows a deposit, so the message announces the latest one.
  const mensaje = mensajeEstado({
    numero: ticket.numero,
    valorAPagar: ticket.valor_a_pagar,
    abonado: ticket.abonado,
    ultimoAbono: abonos[0]?.monto,
    fechasSorteo,
  });

  return (
    <section className="rounded-2xl border-2 border-teal-600 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            Abonos del número{" "}
            <span className="font-mono tracking-widest">{ticket.numero}</span>
          </h2>
          <p className="text-sm text-slate-500">{ticket.nombre}</p>
        </div>

        <Link
          href={`/rifas/${rifaId}`}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
        >
          Cerrar
        </Link>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-xs text-slate-500">A pagar</dt>
          <dd className="font-semibold">{formatMoney(ticket.valor_a_pagar)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Abonado</dt>
          <dd className="font-semibold text-teal-700">
            {formatMoney(ticket.abonado)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Saldo</dt>
          <dd className="font-semibold text-amber-600">
            {formatMoney(pendiente)}
          </dd>
        </div>
      </dl>

      {pendiente > 0 ? (
        <AbonoForm rifaId={rifaId} ticketId={ticket.id} pendiente={pendiente} />
      ) : (
        <p className="mt-4 rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-800">
          Este número ya está pago por completo.
        </p>
      )}

      <div className="mt-4 rounded-xl border border-slate-200 p-3">
        <p className="text-sm font-medium">Mensaje para el cliente</p>
        <CopiarMensaje
          mensaje={mensaje}
          whatsapp={linkWhatsApp(ticket.telefono, mensaje)}
        />
      </div>

      <h3 className="mt-6 text-sm font-semibold uppercase text-slate-500">
        Histórico
      </h3>

      {abonos.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">
          Todavía no registró ningún abono.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-slate-100">
          {abonos.map((abono) => (
            <li
              key={abono.id}
              className="flex items-center justify-between gap-3 py-2"
            >
              <div>
                <p className="font-medium">{formatMoney(abono.monto)}</p>
                <p className="text-xs text-slate-500">
                  {formatFecha(abono.fecha)}
                  {abono.nota ? ` · ${abono.nota}` : ""}
                </p>
              </div>

              <form action={eliminarAbono}>
                <input type="hidden" name="abonoId" value={abono.id} />
                <input type="hidden" name="rifaId" value={rifaId} />
                <button
                  type="submit"
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600"
                >
                  Anular
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
