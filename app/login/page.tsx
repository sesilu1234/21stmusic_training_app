import { redirect } from "next/navigation";
import { logout } from "@/app/actions";
import { safeAuth } from "@/lib/session";
import { getStudent } from "@/lib/students";
import SiteFooter from "../components/SiteFooter";
import LoginForm from "./LoginForm";

const errorMessage = (error?: string) => {
  if (!error) return undefined;
  if (error === "AccessDenied")
    return "Ese correo no está dado de alta como alumno de la academia.";
  if (error === "CredentialsSignin") return "Usuario o contraseña incorrectos.";
  return "No se ha podido iniciar sesión. Inténtalo de nuevo.";
};

export const metadata = { title: "Acceso · 21st Century Music" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const session = await safeAuth();

  // Solo se vuelve a la app si la sesión corresponde a un alumno de verdad.
  // Antes bastaba con que hubiera sesión, y una cookie de alguien que ya no
  // está en `students` rebotaba sin parar entre / y /login.
  let student = null;
  let databaseDown = false;
  try {
    student = session ? await getStudent(session.user?.email) : null;
  } catch {
    databaseDown = true;
  }
  if (student) redirect("/");

  const params = (await searchParams) || {};
  const staleSession = Boolean(session) && !databaseDown;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/assets/background.jpeg')" }}
      />
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[3px]" />
      <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-amber-400/15 blur-3xl" />

      <main className="relative flex flex-1 items-center justify-center p-5">
      <section className="relative w-full max-w-[19rem] rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <div className="mb-5 flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/logo21stCM_no_white_1.png"
            alt="21st Century Music"
            className="h-11 w-auto"
          />
          <h1
            className="mt-2 text-base font-black italic tracking-tighter text-white"
            style={{ fontFamily: "Chaney, sans-serif" }}
          >
            21st Century Music
          </h1>
          <p className="mt-1 text-[7px] font-bold uppercase tracking-[0.3em] text-amber-400">
            Escuela de música moderna
          </p>
        </div>

        {databaseDown && (
          <p className="mb-3 rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2.5 text-[11px] leading-4 text-rose-200">
            No se puede conectar con la base de datos. Avisa a la academia.
          </p>
        )}

        <LoginForm googleError={errorMessage(params.error)} />

        {staleSession && (
          <form action={logout} className="mt-3">
            <button
              type="submit"
              className="w-full rounded-xl border border-white/10 py-2.5 text-[10px] font-black uppercase tracking-widest text-white/45 transition hover:border-white/25 hover:text-white"
            >
              Salir de la sesión actual
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-[9px] leading-relaxed text-white/35">
          Acceso solo para alumnos de la academia.
        </p>
      </section>
      </main>

      <SiteFooter className="relative" />
    </div>
  );
}
