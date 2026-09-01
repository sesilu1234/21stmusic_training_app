"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookMarked, Gamepad2, Lock, TrendingUp } from "lucide-react";
import Backdrop from "./Backdrop";
import SiteFooter from "./SiteFooter";
import UserMenu from "./UserMenu";
import type { StudentRole } from "@/lib/students";

/**
 * Qué hace cada enlace cuando no hay sesión:
 *
 *  - `abierto`  se usa igual sin cuenta.
 *  - `candado`  se enseña apagado y con candado. Es para la guía: material de
 *               la escuela que interesa que se vea que existe, aunque no se
 *               pueda abrir todavía.
 *  - `oculto`   no se pinta siquiera. El progreso sin cuenta no es que esté
 *               cerrado: es que no hay nada que enseñar, porque sin sesión no
 *               se guarda ninguna partida. Un candado ahí solo daba a entender
 *               que la app está más cerrada de lo que está.
 *
 * "Mis notas" no está aquí: vive en el desplegable de la cuenta, que es donde
 * se busca algo que es tuyo y solo tuyo.
 */
const links = [
  { href: "/", label: "Juegos", Icon: Gamepad2, guest: "abierto" },
  { href: "/guia", label: "Guía", Icon: BookMarked, guest: "candado" },
  { href: "/progreso", label: "Progreso", Icon: TrendingUp, guest: "oculto" },
] as const;

/**
 * `displayName` viene de la sesión (null si no hay). No es obligatorio entrar:
 * solo cambia la esquina de la cabecera y qué modos están abiertos.
 */
export default function AppShell({
  displayName = null,
  role,
  children,
}: {
  displayName?: string | null;
  /** Rol del alumno de la sesión: decide qué páginas internas salen en el menú. */
  role?: StudentRole;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const visibleLinks = links.filter(
    (link) => displayName || link.guest !== "oculto",
  );

  // La guía tiene rutas hijas (/guia/notas), así que ahí no vale el igual.
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans text-white">
      <Backdrop />

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* z-50: si no, las tarjetas del menú (que llevan blur y crean su
            propio contexto de apilado) tapan el desplegable del usuario. */}
        <header className="relative z-50 px-3 pt-3 md:px-6 md:pt-5">
          <nav className="mx-auto flex max-w-5xl items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2.5 shadow-2xl backdrop-blur-xl md:px-5 md:py-3">
            <Link href="/" className="flex min-w-0 items-center gap-2.5 md:gap-3.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/logo21stCM_no_white_1-192.png"
                className="h-9 w-auto flex-shrink-0 md:h-12"
                alt="21st Century Music"
              />
              <span className="flex min-w-0 flex-col">
                <span
                  className="truncate text-sm font-black italic leading-tight tracking-tighter text-white md:text-xl"
                  style={{ fontFamily: "Chaney, sans-serif" }}
                >
                  21st Century Music
                </span>
                <span className="truncate text-[7px] font-bold uppercase tracking-[0.28em] text-amber-400 md:text-[9px]">
                  Escuela de música moderna
                </span>
              </span>
            </Link>

            <div className="flex flex-shrink-0 items-center gap-2">
              <div className="hidden items-center gap-1 md:flex">
                {visibleLinks.map(({ href, label, Icon, guest }) => {
                  const locked = guest === "candado" && !displayName;
                  return (
                    <Link
                      key={href}
                      href={href}
                      title={locked ? "Solo para alumnos de la escuela" : undefined}
                      className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[10px] font-black uppercase tracking-wider transition-colors ${
                        isActive(href)
                          ? "bg-amber-300 text-slate-950"
                          : locked
                            ? "text-white/25 hover:bg-white/5 hover:text-white/45"
                            : "text-white/55 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icon size={14} strokeWidth={2} />
                      {label}
                      {locked && <Lock size={10} strokeWidth={2.5} className="ml-0.5" />}
                    </Link>
                  );
                })}
              </div>

              <UserMenu displayName={displayName} role={role} />
            </div>
          </nav>
        </header>

        <main className="flex-1 px-4 py-6 pb-28 md:px-8 md:py-9 md:pb-14">{children}</main>

        <SiteFooter className="pb-24 md:pb-6" />

        {/* Navegación de móvil: abajo, al alcance del pulgar.

            Sin `backdrop-blur`: al 90% de opacidad no pasaba luz suficiente
            para que se notara, y en una barra fija el navegador tiene que
            releer y desenfocar lo que hay detrás en cada fotograma de scroll.
            Justo en la pantalla donde más caro sale. */}
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/90 md:hidden">
          <div className="mx-auto flex max-w-md items-stretch">
            {visibleLinks.map(({ href, label, Icon, guest }) => {
              const active = isActive(href);
              const locked = guest === "candado" && !displayName;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[9px] font-black uppercase tracking-wider transition-colors ${
                    active ? "text-amber-300" : locked ? "text-white/25" : "text-white/45"
                  }`}
                >
                  <span
                    className={`relative grid h-8 w-12 place-items-center rounded-full transition-colors ${
                      active ? "bg-amber-300/15" : ""
                    }`}
                  >
                    <Icon size={17} strokeWidth={2} />
                    {locked && (
                      <Lock
                        size={9}
                        strokeWidth={3}
                        className="absolute -right-0.5 -top-0.5 text-white/40"
                      />
                    )}
                  </span>
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
