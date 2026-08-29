"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, LogIn, LogOut, StickyNote } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { logout } from "@/app/actions";

/**
 * Esquina derecha de la cabecera. Con sesión: la inicial del alumno, que abre
 * un desplegable con el tema y el cerrar sesión. Sin sesión: un botón de entrar
 * y el tema suelto, porque entrar es opcional y no queremos dar la impresión de
 * que la app está cerrada.
 */
export default function UserMenu({ displayName }: { displayName?: string | null }) {
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

  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Cuenta de ${displayName}`}
        className={`group relative grid h-10 w-10 place-items-center rounded-full p-[2px] transition duration-300 ${
          isOpen
            ? "bg-gradient-to-br from-amber-300 to-amber-500 shadow-[0_0_0_3px_rgba(251,191,36,0.16)]"
            : "bg-gradient-to-br from-white/25 to-white/5 hover:from-amber-300/70 hover:to-amber-500/40"
        }`}
      >
        <span className="grid h-full w-full place-items-center rounded-full bg-slate-950 text-xs font-black text-amber-300">
          {initial}
        </span>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.6rem)] z-50 w-60 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-[0_24px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl"
        >
          <div className="border-b border-white/5 px-3 pb-3 pt-2">
            <p className="truncate text-sm font-bold text-white">{displayName}</p>
            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-300/85">
              <GraduationCap size={12} />
              Alumno de la escuela
            </p>
          </div>

          <div className="mt-1.5 space-y-0.5">
            {/* Las notas son del alumno y se guardan en su cuenta, así que se
                buscan aquí y no en la barra de navegación. */}
            <Link
              href="/notas"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-white/50 transition hover:bg-white/5 hover:text-white"
            >
              <StickyNote size={16} strokeWidth={1.75} />
              Mis notas
            </Link>

            <ThemeToggle withLabel />

            <form action={logout}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-white/50 transition hover:bg-rose-500/10 hover:text-rose-300"
              >
                <LogOut size={16} strokeWidth={1.75} />
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
