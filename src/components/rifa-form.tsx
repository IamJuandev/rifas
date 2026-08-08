"use client";

import { useActionState, useEffect, useRef } from "react";
import { crearRifa, type FormState } from "@/app/actions";

const initialState: FormState = {};

export function RifaForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(crearRifa, initialState);

  useEffect(() => {
    if (!pending && !state.error) formRef.current?.reset();
  }, [pending, state]);

  return (
    <form ref={formRef} action={action} className="mt-4 grid gap-3 sm:grid-cols-3">
      <div className="sm:col-span-2">
        <label htmlFor="nombre" className="block text-sm font-medium">
          Nombre de la rifa
        </label>
        <input
          id="nombre"
          name="nombre"
          required
          placeholder="Rifa de la moto"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none focus:border-teal-600"
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
          defaultValue={0}
          inputMode="numeric"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none focus:border-teal-600"
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
          {pending ? "Creando..." : "Crear rifa"}
        </button>
      </div>
    </form>
  );
}
