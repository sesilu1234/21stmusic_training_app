"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Award, LogOut, User } from "lucide-react";
import Avatar from "./Avatar";
import ThemeToggle from "./ThemeToggle";
import { logout } from "@/app/actions";

/**
 * Antes el tema y el cerrar sesión vivían sueltos en la barra, que acababa con
 * ocho cosas seguidas. Ahora cuelgan del avatar y la cabecera respira.
 */
export default function UserMenu({
  displayName,
  image,
  medals,
}: {
  displayName: string;
  image?: string | null;
  medals: number;
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

  return (
    <div ref={containerRef} className="relative">
      {/* Solo el avatar, con un anillo que se enciende al abrir: la píldora con
          chevron ocupaba sitio y no decía nada que el avatar no dijera ya. */}
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
        <span className="grid h-full w-full place-items-center overflow-hidden rounded-full bg-slate-950">
          <Avatar src={image} name={displayName} size={36} className="h-full w-full text-xs" />
        </span>

        {medals > 0 && (
          <span className="absolute -bottom-0.5 -right-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full border-2 border-slate-950 bg-amber-300 px-1 text-[9px] font-black leading-none text-slate-950">
            {medals > 99 ? "99+" : medals}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.6rem)] z-50 w-60 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-[0_24px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl"
        >
          <div className="border-b border-white/5 px-3 pb-3 pt-2">
            <p className="truncate text-sm font-bold text-white">{displayName}</p>
            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-300/85">
              <Award size={12} />
              {medals} {medals === 1 ? "medalla" : "medallas"}
            </p>
          </div>

          <div className="mt-1.5 space-y-0.5">
            <Link
              href="/perfil"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <User size={16} strokeWidth={1.75} />
              Tu perfil
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
