import { guardarSorteos } from "@/app/actions";
import type { SorteoRow } from "@/lib/db";

export function SorteosForm({
  rifaId,
  sorteos,
}: {
  rifaId: number;
  sorteos: SorteoRow[];
}) {
  return (
    <form action={guardarSorteos} className="mt-4 space-y-4">
      <input type="hidden" name="rifaId" value={rifaId} />

      <div className="grid gap-4 sm:grid-cols-3">
        {sorteos.map((sorteo) => (
          <fieldset
            key={sorteo.id}
            className="rounded-xl border border-slate-200 p-3"
          >
            <legend className="px-1 text-sm font-medium">
              Sorteo {sorteo.orden}
            </legend>

            <label
              htmlFor={`fecha_${sorteo.orden}`}
              className="block text-xs text-slate-500"
            >
              Fecha
            </label>
            <input
              id={`fecha_${sorteo.orden}`}
              name={`fecha_${sorteo.orden}`}
              type="date"
              defaultValue={sorteo.fecha ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none focus:border-teal-600"
            />

            <label
              htmlFor={`ganador_${sorteo.orden}`}
              className="mt-3 block text-xs text-slate-500"
            >
              Número ganador
            </label>
            <input
              id={`ganador_${sorteo.orden}`}
              name={`ganador_${sorteo.orden}`}
              inputMode="numeric"
              maxLength={4}
              placeholder="0000"
              defaultValue={sorteo.numero_ganador ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base font-mono tracking-widest outline-none focus:border-teal-600"
            />
          </fieldset>
        ))}
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white sm:w-auto"
      >
        Guardar sorteos
      </button>
    </form>
  );
}
