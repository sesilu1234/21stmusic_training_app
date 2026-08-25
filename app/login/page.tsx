import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { currentStudent } from "@/lib/session";
import SiteFooter from "../components/SiteFooter";
import LoginForm from "./LoginForm";

const errorMessage = (error?: string) => {
  if (!error) return undefined;
  if (error === "CredentialsSignin") return "Usuario o contraseña incorrectos.";
  // Auth.js manda "Configuration" cuando le falta AUTH_SECRET en ese despliegue.
  if (error === "Configuration")
    return "A este despliegue le faltan variables de entorno. Avisa a la academia.";
  return "No se ha podido iniciar sesión. Inténtalo de nuevo.";
};

/** Solo rutas internas: un ?next=https://otro.sitio sería un redirector abierto. */
const safeNext = (value?: string) =>
  value && value.startsWith("/") && !value.startsWith("//") ? value : "/";

export const metadata = { title: "Acceso · 21st Century Music" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; next?: string }>;
}) {
  const params = (await searchParams) || {};
  const next = safeNext(params.next);

  // Si ya hay sesión de alumno no se enseña el formulario.
  if (await currentStudent()) redirect(next);

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

          <LoginForm initialError={errorMessage(params.error)} next={next} />

          <p className="mt-4 text-center text-[9px] leading-relaxed text-white/35">
            Las cuentas las da de alta la academia. Sin cuenta puedes usar casi
            todos los modos igualmente.
          </p>

          <Link
            href="/"
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] text-white/45 transition hover:border-white/25 hover:text-white"
          >
            <ArrowLeft size={12} />
            Seguir sin cuenta
          </Link>
        </section>
      </main>

      <SiteFooter className="relative" />
    </div>
  );
}
