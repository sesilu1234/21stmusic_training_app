"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Award, ChevronDown, LogOut, User } from "lucide-react";
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
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-2 transition ${
          isOpen
            ? "border-amber-300/45 bg-white/10"
            : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10"
        }`}
      >
        <span className="grid h-8 w-8 flex-shrink-0 place-items-center overflow-hidden rounded-full border border-amber-300/30 bg-slate-900">
          <Avatar src={image} name={displayName} size={32} className="h-full w-full text-xs" />
        </span>
        <ChevronDown
          size={14}
          className={`text-white/45 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
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
