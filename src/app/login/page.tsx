import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  if (await getSession()) redirect("/");

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-xl font-semibold">Control de Rifas</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ingresa con tu usuario para administrar los números.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
