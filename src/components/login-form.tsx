"use client";

import { useActionState } from "react";
import { loginAction, type FormState } from "@/app/actions";

const initialState: FormState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="mt-6 space-y-4">
      <div>
        <label htmlFor="username" className="block text-sm font-medium">
          Usuario
        </label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none focus:border-teal-600"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none focus:border-teal-600"
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-teal-700 px-4 py-2.5 font-medium text-white disabled:opacity-60"
      >
        {pending ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}
