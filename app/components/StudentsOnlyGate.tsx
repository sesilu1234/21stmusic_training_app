import Link from "next/link";
import { ArrowLeft, Lock, LogIn } from "lucide-react";
import Backdrop from "./Backdrop";
import SiteFooter from "./SiteFooter";
import { currentStudent } from "@/lib/session";

/**
 * Puerta de los modos marcados como `studentsOnly` en el catálogo.
 *
 * Se usa como `layout.tsx` de la carpeta del modo: así el juego (que es cliente)
 * no se entera de nada y la comprobación pasa siempre en el servidor, que es el
 * único sitio donde vale de algo.
 */
export default async function StudentsOnlyGate({
  children,
  backHref = "/",
}: {
  children: React.ReactNode;
  backHref?: string;
}) {
  if (await currentStudent()) return <>{children}</>;

  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans text-white">
      <Backdrop />

      <div className="relative z-10 flex min-h-screen flex-col px-4 py-5 md:px-8 md:py-7">
        <Link
          href={backHref}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-slate-950/50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/60 backdrop-blur-sm transition hover:border-amber-300/40 hover:text-white"
        >
          <ArrowLeft size={14} />
          Menú principal
        </Link>

        <main className="flex flex-1 items-center justify-center py-10">
          <section className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-slate-950/75 p-8 text-center shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            <span className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-amber-300/25 bg-amber-400/10">
              <Lock size={26} strokeWidth={1.6} className="text-amber-300" />
            </span>

            <h1
              className="text-balance text-2xl font-black uppercase italic leading-tight tracking-tighter text-white"
              style={{ fontFamily: "Chaney, sans-serif" }}
            >
              Solo para alumnos de la escuela
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/50">
              Este modo está reservado a los alumnos de 21st Century Music. Entra
              con el usuario que te ha dado la academia para abrirlo.
            </p>

            <Link
              href="/login"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-950 transition hover:bg-amber-300"
            >
              <LogIn size={14} />
              Entrar
            </Link>

            <Link
              href={backHref}
              className="mt-3 flex w-full items-center justify-center rounded-2xl border border-white/10 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-white/45 transition hover:border-white/25 hover:text-white"
            >
              Ver los demás modos
            </Link>
          </section>
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}
