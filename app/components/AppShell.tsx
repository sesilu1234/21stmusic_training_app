"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Award, Gamepad2, StickyNote } from "lucide-react";
import SiteFooter from "./SiteFooter";
import UserMenu from "./UserMenu";
import { useStoredThemeMode } from "@/lib/themeMode";

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
  const [isDarkMode] = useStoredThemeMode();

  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans text-white">
      {/*
        El fondo es una foto, así que sin un velo fuerte el texto pequeño se
        pelea con ella. El degradado oscurece más arriba y abajo, que es donde
        caen la cabecera y el pie.
      */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/assets/background.jpeg')" }}
      >
        <div
          className={`absolute inset-0 backdrop-blur-[3px] ${
            isDarkMode
              ? "bg-gradient-to-b from-slate-950/92 via-slate-950/82 to-slate-950/95"
              : "bg-gradient-to-b from-slate-900/65 via-slate-900/45 to-slate-900/70"
          }`}
        />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="px-3 pt-3 md:px-6 md:pt-5">
          <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2.5 shadow-2xl backdrop-blur-xl md:px-5 md:py-3">
            <Link href="/" className="flex min-w-0 items-center gap-2.5 md:gap-3.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/logo21stCM_no_white_1.png"
                className="h-9 w-auto flex-shrink-0 md:h-11"
                alt="21st Century Music"
              />
              <span
                className="truncate text-sm font-black italic leading-none tracking-tighter text-white md:text-xl"
                style={{ fontFamily: "Chaney, sans-serif" }}
              >
                21st Century Music
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

        <main className="flex-1 px-4 py-7 pb-28 md:px-8 md:py-12 md:pb-14">{children}</main>

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
