"use client";

import { useActionState, useEffect, useRef } from "react";
import { agregarAbono, type FormState } from "@/app/actions";
import { formatMoney } from "@/lib/tickets";

const initialState: FormState = {};

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none focus:border-teal-600";

export function AbonoForm({
  rifaId,
  ticketId,
  pendiente,
}: {
  rifaId: number;
  ticketId: number;
  pendiente: number;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(agregarAbono, initialState);

  useEffect(() => {
    if (!pending && !state.error) formRef.current?.reset();
  }, [pending, state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="mt-4 grid gap-3 sm:grid-cols-3"
    >
      <input type="hidden" name="rifaId" value={rifaId} />
      <input type="hidden" name="ticketId" value={ticketId} />

      <div>
        <label htmlFor="monto" className="block text-sm font-medium">
          Monto del abono
        </label>
        <input
          id="monto"
          name="monto"
          type="number"
          min={1}
          max={pendiente}
          step={1}
          inputMode="numeric"
          required
          className={inputClass}
        />
        <p className="mt-1 text-xs text-slate-500">
          Máximo {formatMoney(pendiente)}
        </p>
      </div>

      <div>
        <label htmlFor="fecha" className="block text-sm font-medium">
          Fecha del pago
        </label>
        <input
          id="fecha"
          name="fecha"
          type="date"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-slate-500">Vacío = hoy</p>
      </div>

      <div>
        <label htmlFor="nota" className="block text-sm font-medium">
          Nota <span className="text-slate-400">(opcional)</span>
        </label>
        <input
          id="nota"
          name="nota"
          placeholder="Efectivo, Nequi..."
          className={inputClass}
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-red-600 sm:col-span-3">
          {state.error}
        </p>
      ) : null}

      <div className="sm:col-span-3">
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-teal-700 px-4 py-2.5 font-medium text-white disabled:opacity-60 sm:w-auto"
        >
          {pending ? "Registrando..." : "Registrar abono"}
        </button>
      </div>
    </form>
  );
}
