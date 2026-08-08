"use client";

import Link from "next/link";
import { useActionState } from "react";
import { actualizarRifa, eliminarRifa, type FormState } from "@/app/actions";
import type { RifaRow } from "@/lib/db";

const initialState: FormState = {};

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none focus:border-teal-600";

export function EditarRifaForm({ rifa }: { rifa: RifaRow }) {
  const [state, action, pending] = useActionState(actualizarRifa, initialState);

  return (
    <form action={action} className="mt-4 grid gap-3 sm:grid-cols-3">
      <input type="hidden" name="rifaId" value={rifa.id} />

      <div className="sm:col-span-2">
        <label htmlFor="nombre" className="block text-sm font-medium">
          Nombre de la rifa
        </label>
        <input
          id="nombre"
          name="nombre"
          required
          defaultValue={rifa.nombre}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="valorNumero" className="block text-sm font-medium">
          Valor por número
        </label>
        <input
          id="valorNumero"
          name="valorNumero"
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          defaultValue={rifa.valor_numero}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-slate-500">
          Solo afecta a los números que registres de ahora en adelante.
        </p>
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-red-600 sm:col-span-3">
          {state.error}
        </p>
      ) : null}

      <div className="flex gap-2 sm:col-span-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-teal-700 px-4 py-2.5 font-medium text-white disabled:opacity-60"
        >
          {pending ? "Guardando..." : "Guardar rifa"}
        </button>
        <Link
          href={`/rifas/${rifa.id}`}
          className="rounded-lg border border-slate-300 px-4 py-2.5 font-medium"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}

export function EliminarRifaBoton({
  rifa,
  bloqueo,
}: {
  rifa: RifaRow;
  bloqueo: string | null;
}) {
  const [state, action, pending] = useActionState(eliminarRifa, initialState);

  if (bloqueo) {
    return (
      <span
        title={bloqueo}
        className="cursor-not-allowed rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-400"
      >
        Eliminar
      </span>
    );
  }

  return (
    <form
      action={action}
      onSubmit={(event) => {
        const ok = window.confirm(
          `¿Eliminar la rifa "${rifa.nombre}" con todos sus números y abonos? Esto no se puede deshacer.`,
        );
        if (!ok) event.preventDefault();
      }}
    >
      <input type="hidden" name="rifaId" value={rifa.id} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 disabled:opacity-60"
      >
        {pending ? "Eliminando..." : "Eliminar"}
      </button>
      {state.error ? (
        <p role="alert" className="mt-1 text-sm text-red-600">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
