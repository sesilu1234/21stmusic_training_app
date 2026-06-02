import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const session = await auth();
  const params = (await searchParams) || {};
  if (session) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
        <h1 className="text-2xl font-black tracking-tight">Acceso de alumnos</h1>
        <p className="mt-2 text-sm text-slate-300">
          Inicia sesion con tu cuenta de Google autorizada por el profesor.
        </p>
        {params.error === "AccessDenied" && (
          <div className="mt-4 rounded-xl border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-200">
            Acceso denegado: tu correo no esta en la lista de alumnos autorizados.
          </div>
        )}

        <form
          className="mt-6"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-xl bg-white text-slate-900 font-bold py-3 hover:bg-slate-100 transition-colors"
          >
            Entrar con Google
          </button>
        </form>
      </section>
    </main>
  );
}
