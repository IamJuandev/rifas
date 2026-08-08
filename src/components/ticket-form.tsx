"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { guardarTicket, type FormState } from "@/app/actions";
import type { TicketRow } from "@/lib/db";
import { formatMoney } from "@/lib/tickets";

const initialState: FormState = {};

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none focus:border-teal-600";

export function TicketForm({
  rifaId,
  valorNumero,
  ticket,
}: {
  rifaId: number;
  valorNumero: number;
  ticket?: TicketRow;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(guardarTicket, initialState);

  useEffect(() => {
    if (!pending && !state.error && !ticket) formRef.current?.reset();
  }, [pending, state, ticket]);

  return (
    <form
      ref={formRef}
      action={action}
      key={ticket?.id ?? "nuevo"}
      className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      <input type="hidden" name="rifaId" value={rifaId} />
      {ticket ? (
        <input type="hidden" name="ticketId" value={ticket.id} />
      ) : null}

      <div>
        <label htmlFor="numero" className="block text-sm font-medium">
          Número de la rifa
        </label>
        <input
          id="numero"
          name="numero"
          inputMode="numeric"
          maxLength={4}
          required
          placeholder="0000"
          defaultValue={ticket?.numero ?? ""}
          className={`${inputClass} font-mono tracking-widest`}
        />
      </div>

      <div>
        <label htmlFor="nombre" className="block text-sm font-medium">
          Nombre de la persona
        </label>
        <input
          id="nombre"
          name="nombre"
          required
          defaultValue={ticket?.nombre ?? ""}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="telefono" className="block text-sm font-medium">
          Teléfono
        </label>
        <input
          id="telefono"
          name="telefono"
          type="tel"
          inputMode="tel"
          defaultValue={ticket?.telefono ?? ""}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="valorAPagar" className="block text-sm font-medium">
          Valor a pagar
        </label>
        <input
          id="valorAPagar"
          value={formatMoney(ticket?.valor_a_pagar ?? valorNumero)}
          readOnly
          disabled
          className={`${inputClass} cursor-not-allowed bg-slate-100 text-slate-600`}
        />
        <p className="mt-1 text-xs text-slate-500">
          Es el valor de la rifa, no se edita acá.
        </p>
      </div>

      {ticket ? null : (
        <div>
          <label htmlFor="abonoInicial" className="block text-sm font-medium">
            Abono inicial <span className="text-slate-400">(opcional)</span>
          </label>
          <input
            id="abonoInicial"
            name="abonoInicial"
            type="number"
            min={0}
            max={valorNumero}
            step={1}
            inputMode="numeric"
            defaultValue={0}
            className={inputClass}
          />
        </div>
      )}

      {state.error ? (
        <p
          role="alert"
          className="text-sm text-red-600 sm:col-span-2 lg:col-span-3"
        >
          {state.error}
        </p>
      ) : null}

      <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-lg bg-teal-700 px-4 py-2.5 font-medium text-white disabled:opacity-60 sm:flex-none"
        >
          {pending
            ? "Guardando..."
            : ticket
              ? "Guardar cambios"
              : "Agregar número"}
        </button>

        {ticket ? (
          <Link
            href={`/rifas/${rifaId}`}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-center font-medium"
          >
            Cancelar
          </Link>
        ) : null}
      </div>
    </form>
  );
}
