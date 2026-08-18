import { redirect } from "next/navigation";
import { safeAuth } from "@/lib/session";
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
  if (await safeAuth()) redirect("/");

  const params = (await searchParams) || {};

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-5">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/assets/background.jpeg')" }}
      />
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[3px]" />
      <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-amber-400/15 blur-3xl" />

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

        <LoginForm googleError={errorMessage(params.error)} />

        <p className="mt-4 text-center text-[9px] leading-relaxed text-white/35">
          Acceso solo para alumnos de la academia.
        </p>
      </section>
    </main>
  );
}
