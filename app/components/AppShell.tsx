"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Award, Gamepad2, StickyNote } from "lucide-react";
import Backdrop from "./Backdrop";
import SiteFooter from "./SiteFooter";
import UserMenu from "./UserMenu";

export interface ShellUser {
  displayName: string;
  image?: string | null;
  medals: number;
}

const links = [
  { href: "/", label: "Juegos", Icon: Gamepad2 },
  { href: "/medallas", label: "Medallas", Icon: Award },
  { href: "/notas", label: "Notas", Icon: StickyNote },
] as const;

export default function AppShell({
  user,
  children,
}: {
  user: ShellUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

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
                src="/assets/logo21stCM_no_white_1.png"
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
                {links.map(({ href, label, Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[10px] font-black uppercase tracking-wider transition-colors ${
                      pathname === href
                        ? "bg-amber-300 text-slate-950"
                        : "text-white/55 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon size={14} strokeWidth={2} />
                    {label}
                  </Link>
                ))}
              </div>

              <UserMenu
                displayName={user.displayName}
                image={user.image}
                medals={user.medals}
              />
            </div>
          </nav>
        </header>

        <main className="flex-1 px-4 py-6 pb-28 md:px-8 md:py-9 md:pb-14">{children}</main>

        <SiteFooter className="pb-24 md:pb-6" />

        {/* Navegación de móvil: abajo, al alcance del pulgar. */}
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/90 backdrop-blur-xl md:hidden">
          <div className="mx-auto flex max-w-md items-stretch">
            {links.map(({ href, label, Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[9px] font-black uppercase tracking-wider transition-colors ${
                    isActive ? "text-amber-300" : "text-white/45"
                  }`}
                >
                  <span
                    className={`grid h-8 w-12 place-items-center rounded-full transition-colors ${
                      isActive ? "bg-amber-300/15" : ""
                    }`}
                  >
                    <Icon size={17} strokeWidth={2} />
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
