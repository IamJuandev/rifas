import Link from "next/link";
import { abonarSaldo, eliminarTicket } from "@/app/actions";
import type { TicketConAbonos } from "@/lib/db";
import { estaPagado, formatMoney, saldo } from "@/lib/tickets";
import { DeleteButton } from "@/components/delete-button";

function Chulito({ pagado }: { pagado: boolean }) {
  return (
    <span
      title={pagado ? "Pagado" : "Pendiente"}
      className={`flex h-8 w-8 items-center justify-center rounded-full border text-base ${
        pagado
          ? "border-teal-600 bg-teal-600 text-white"
          : "border-slate-300 text-slate-300"
      }`}
    >
      ✓
    </span>
  );
}

function Apostado({ ticket }: { ticket: TicketConAbonos }) {
  const valores = [ticket.apostado_1, ticket.apostado_2, ticket.apostado_3];

  if (valores.every((v) => !v)) {
    return <span className="text-slate-300">—</span>;
  }

  return (
    <ul className="space-y-0.5 text-xs">
      {valores.map((valor, i) => (
        <li key={i}>
          <span className="text-slate-500">S{i + 1}:</span>{" "}
          <span>{valor || "—"}</span>
        </li>
      ))}
    </ul>
  );
}

function Acciones({ ticket }: { ticket: TicketConAbonos }) {
  const pendiente = saldo(ticket.valor_a_pagar, ticket.abonado);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={`/rifas/${ticket.rifa_id}?abonos=${ticket.id}`}
        className="rounded-lg border border-teal-600 px-3 py-1.5 text-sm text-teal-700"
      >
        Abonos
      </Link>

      {pendiente > 0 ? (
        <form action={abonarSaldo}>
          <input type="hidden" name="ticketId" value={ticket.id} />
          <input type="hidden" name="rifaId" value={ticket.rifa_id} />
          <button
            type="submit"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          >
            Pagar saldo
          </button>
        </form>
      ) : null}

      <Link
        href={`/rifas/${ticket.rifa_id}?edit=${ticket.id}`}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
      >
        Editar
      </Link>

      <form action={eliminarTicket}>
        <input type="hidden" name="ticketId" value={ticket.id} />
        <input type="hidden" name="rifaId" value={ticket.rifa_id} />
        <DeleteButton
          label={`¿Eliminar el número ${ticket.numero} y sus abonos?`}
        />
      </form>
    </div>
  );
}

export function TicketsTable({ tickets }: { tickets: TicketConAbonos[] }) {
  if (tickets.length === 0) {
    return (
      <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
        Todavía no hay números registrados en esta rifa.
      </p>
    );
  }

  return (
    <>
      {/* Mobile: one card per ticket */}
      <ul className="space-y-3 md:hidden">
        {tickets.map((ticket) => (
          <li key={ticket.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xl font-semibold tracking-widest">
                  {ticket.numero}
                </p>
                <p className="text-xs text-slate-500">#{ticket.numeracion}</p>
              </div>
              <Chulito pagado={estaPagado(ticket.valor_a_pagar, ticket.abonado)} />
            </div>

            <p className="mt-2 font-medium">{ticket.nombre}</p>
            {ticket.telefono ? (
              <a
                href={`tel:${ticket.telefono}`}
                className="text-sm text-teal-700"
              >
                {ticket.telefono}
              </a>
            ) : null}

            <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <div>
                <dt className="text-xs text-slate-500">A pagar</dt>
                <dd>{formatMoney(ticket.valor_a_pagar)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Abonado</dt>
                <dd className="text-teal-700">{formatMoney(ticket.abonado)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Saldo</dt>
                <dd className="font-medium text-amber-600">
                  {formatMoney(saldo(ticket.valor_a_pagar, ticket.abonado))}
                </dd>
              </div>
            </dl>

            <div className="mt-3 border-t border-slate-100 pt-2">
              <p className="text-xs text-slate-500">Apostado por sorteo</p>
              <div className="mt-1">
                <Apostado ticket={ticket} />
              </div>
            </div>

            <div className="mt-3">
              <Acciones ticket={ticket} />
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop: full table */}
      <div className="hidden overflow-x-auto rounded-2xl bg-white shadow-sm md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Número</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Apostado</th>
              <th className="px-4 py-3 text-right">A pagar</th>
              <th className="px-4 py-3 text-right">Abonado</th>
              <th className="px-4 py-3 text-right">Saldo</th>
              <th className="px-4 py-3 text-center">Pagó</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="border-b border-slate-100">
                <td className="px-4 py-3 text-slate-500">{ticket.numeracion}</td>
                <td className="px-4 py-3 font-mono font-semibold tracking-widest">
                  {ticket.numero}
                </td>
                <td className="px-4 py-3">{ticket.nombre}</td>
                <td className="px-4 py-3">{ticket.telefono}</td>
                <td className="px-4 py-3">
                  <Apostado ticket={ticket} />
                </td>
                <td className="px-4 py-3 text-right">
                  {formatMoney(ticket.valor_a_pagar)}
                </td>
                <td className="px-4 py-3 text-right text-teal-700">
                  {formatMoney(ticket.abonado)}
                </td>
                <td className="px-4 py-3 text-right text-amber-600">
                  {formatMoney(saldo(ticket.valor_a_pagar, ticket.abonado))}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    <Chulito
                      pagado={estaPagado(ticket.valor_a_pagar, ticket.abonado)}
                    />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Acciones ticket={ticket} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
