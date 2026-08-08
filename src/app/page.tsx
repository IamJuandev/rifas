import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDb, type RifaRow } from "@/lib/db";
import { formatMoney } from "@/lib/tickets";
import { Header } from "@/components/header";
import { RifaForm } from "@/components/rifa-form";

type RifaResumen = RifaRow & {
  vendidos: number;
  recaudado: number;
  esperado: number;
};

function listarRifas(): RifaResumen[] {
  return getDb()
    .prepare(
      `SELECT r.*,
              COUNT(t.id) AS vendidos,
              COALESCE(SUM(t.valor_a_pagar), 0) AS esperado,
              COALESCE(
                (SELECT SUM(a.monto)
                 FROM abonos a
                 JOIN tickets t2 ON t2.id = a.ticket_id
                 WHERE t2.rifa_id = r.id),
                0
              ) AS recaudado
       FROM rifas r
       LEFT JOIN tickets t ON t.rifa_id = r.id
       GROUP BY r.id
       ORDER BY r.created_at DESC, r.id DESC`,
    )
    .all() as RifaResumen[];
}

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const rifas = listarRifas();

  return (
    <>
      <Header username={session.username} />

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold">Nueva rifa</h2>
          <RifaForm />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Rifas</h2>

          {rifas.length === 0 ? (
            <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
              Todavía no hay rifas creadas.
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {rifas.map((rifa) => (
                <li key={rifa.id}>
                  <Link
                    href={`/rifas/${rifa.id}`}
                    className="block rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md"
                  >
                    <p className="font-medium">{rifa.nombre}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Valor por número: {formatMoney(rifa.valor_numero)}
                    </p>
                    <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
                      <div>
                        <dt className="text-slate-500">Números</dt>
                        <dd className="font-semibold">{rifa.vendidos}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Recaudado</dt>
                        <dd className="font-semibold text-teal-700">
                          {formatMoney(rifa.recaudado)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Pendiente</dt>
                        <dd className="font-semibold text-amber-600">
                          {formatMoney(
                            Math.max(0, rifa.esperado - rifa.recaudado),
                          )}
                        </dd>
                      </div>
                    </dl>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
