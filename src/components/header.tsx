import Link from "next/link";
import { logoutAction } from "@/app/actions";

export function Header({ username }: { username: string }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="font-semibold">
          Control de Rifas
        </Link>

        <form action={logoutAction} className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-500 sm:inline">
            {username}
          </span>
          <button
            type="submit"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          >
            Salir
          </button>
        </form>
      </div>
    </header>
  );
}
