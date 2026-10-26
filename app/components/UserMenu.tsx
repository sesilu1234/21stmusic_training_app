"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileCheck2, LogIn, LogOut, Palette, StickyNote, Trophy, Users } from "lucide-react";
import BarsAvatar from "./BarsAvatar";
import ThemeToggle from "./ThemeToggle";
import HonorToggle, { prefetchHonorSetting } from "@/app/honor/HonorToggle";
import { logout } from "@/app/actions";
import { canSeeAlumnario, canSeeMuestrario, roleLabel } from "@/lib/roles";
import { HONOR_ENABLED } from "@/lib/site";
import type { StudentRole } from "@/lib/students";

/**
 * Esquina derecha de la cabecera. Con sesión: el avatar del alumno, que abre
 * un desplegable con el tema y el cerrar sesión. Sin sesión: un botón de entrar
 * y el tema suelto, porque entrar es opcional y no queremos dar la impresión de
 * que la app está cerrada.
 *
 * Aquí es donde salen las páginas internas —el alumnario y el muestrario— y
 * solo para quien puede abrirlas. Enseñar un enlace que luego contesta "no
 * existe" es peor que no enseñarlo, así que el menú y las páginas preguntan lo
 * mismo a `lib/roles`.
 *
 * `role` llega del servidor, del alumno de la sesión. No se decide nada aquí
 * con ello: esto solo dibuja. Quien de verdad cierra la puerta es cada página,
 * que vuelve a mirar el rol en el servidor.
 */
export default function UserMenu({
  displayName,
  role,
}: {
  displayName?: string | null;
  role?: StudentRole;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Al navegar, el menú se cierra. Se ajusta durante el render en vez de con
  // un efecto: así no hay un frame con el menú abierto en la página nueva.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setIsOpen(false);
  }

  // El interruptor del cuadro se pide ya, con la página, y no al abrir el
  // menú: así no salta un segundo después de abrirlo.
  useEffect(() => {
    if (displayName && HONOR_ENABLED) void prefetchHonorSetting(displayName);
  }, [displayName]);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  if (!displayName) {
    return (
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Link
          href={`/login?next=${encodeURIComponent(pathname)}`}
          className="flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-amber-200 transition hover:border-amber-300/60 hover:bg-amber-400/20 hover:text-white"
        >
          <LogIn size={13} strokeWidth={2} />
          <span className="hidden sm:inline">Entrar</span>
        </Link>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Cuenta de ${displayName}`}
        // Sin aro ni halo: el dibujo ya tiene su propio fondo y cualquier
        // marco alrededor lo convertía en una medalla. Lo único que hace al
        // pasar por encima es crecer, y se queda algo crecido mientras el
        // menú está abierto.
        className={`group relative grid h-10 w-10 place-items-center rounded-full transition-transform duration-200 ease-out hover:scale-110 active:scale-95 ${
          isOpen ? "scale-105" : ""
        }`}
      >
        {/* El dibujo llena el hueco entero: la baldosa ya trae su propio
            fondo, así que se recorta en redondo y hace de avatar.

            La sombra va aquí y no en el SVG porque el `overflow-hidden` de
            este mismo span se comería un `drop-shadow` de dentro. Como el
            recorte es un círculo, un `box-shadow` normal lo sigue exacto. */}
        <span className="grid h-full w-full place-items-center overflow-hidden rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.55)]">
          <BarsAvatar name={displayName} className="h-full w-full" />
        </span>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 p-1.5 shadow-[0_18px_44px_rgba(0,0,0,0.55)] backdrop-blur-xl"
        >
          <div className="flex items-center gap-2.5 px-2.5 pb-2.5 pt-2">
            <span className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full">
              <BarsAvatar name={displayName} className="h-full w-full" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-bold leading-tight text-white">{displayName}</span>
              <span className="block truncate text-[10px] leading-tight text-amber-300/80">
                {role ? roleLabel(role) : "Alumno de la escuela"}
              </span>
            </span>
          </div>

          {/* Las notas son del alumno y se guardan en su cuenta, así que se
              buscan aquí y no en la barra de navegación. Exámenes: cualquiera
              con sesión los crea y los hace, no hay roles. */}
          <MenuSection label="General">
            <MenuLink href="/notas" Icon={StickyNote}>Mis notas</MenuLink>
            <MenuLink href="/examenes" Icon={FileCheck2}>Exámenes</MenuLink>
          </MenuSection>

          {/* Salir o no en los rankings es un ajuste de la cuenta, así que va
              aquí, junto al enlace, y no escondido al pie del cuadro. */}
          {HONOR_ENABLED && (
            <MenuSection label="Cuadro de honor">
              <MenuLink href="/honor" Icon={Trophy}>Ver el cuadro</MenuLink>
              <HonorToggle who={displayName} />
            </MenuSection>
          )}

          {(canSeeAlumnario(role) || canSeeMuestrario(role)) && (
            <MenuSection label="Profesorado">
              {canSeeAlumnario(role) && (
                <MenuLink href="/alumnario" Icon={Users}>Alumnario</MenuLink>
              )}
              {canSeeMuestrario(role) && (
                <MenuLink href="/muestrario" Icon={Palette}>Muestrario</MenuLink>
              )}
            </MenuSection>
          )}

          <div className="mt-1 flex items-center justify-between gap-2 border-t border-white/5 px-1 pt-1.5">
            <ThemeToggle compact />
            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-white/45 transition hover:bg-rose-500/10 hover:text-rose-300"
              >
                <LogOut size={13} strokeWidth={1.75} />
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const MenuSection = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="border-t border-white/5 py-1.5">
    <p className="px-2.5 pb-1 text-[9px] font-black uppercase tracking-[0.2em] text-white/25">{label}</p>
    {children}
  </div>
);

const MenuLink = ({
  href,
  Icon,
  children,
}: {
  href: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  children: React.ReactNode;
}) => (
  <Link
    href={href}
    role="menuitem"
    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white/60 transition hover:bg-white/5 hover:text-white"
  >
    <Icon size={14} strokeWidth={1.75} className="flex-shrink-0 text-white/35" />
    {children}
  </Link>
);
