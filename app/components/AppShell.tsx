"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Award, Gamepad2, LogOut, Moon, StickyNote, Sun, Trophy } from "lucide-react";
import Avatar from "./Avatar";
import { useStoredThemeMode } from "@/lib/themeMode";
import { logout } from "@/app/actions";

export interface ShellUser {
  displayName: string;
  image?: string | null;
  medals: number;
}

const links = [
  { href: "/", label: "Juegos", Icon: Gamepad2 },
  { href: "/medallas", label: "Medallas", Icon: Award },
  { href: "/ranking", label: "Ranking", Icon: Trophy },
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
  const [isDarkMode, setIsDarkMode] = useStoredThemeMode();

  const activeClass = "bg-amber-300 text-slate-950";
  const idleClass = "text-white/60 hover:text-white hover:bg-white/10";
  const tabClass = (href: string) =>
    `rounded-full px-3 py-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider transition-colors ${
      pathname === href ? activeClass : idleClass
    }`;

  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans text-white">
      <div
        className="fixed inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/assets/background.jpeg')" }}
      >
        <div
          className={`absolute inset-0 ${
            isDarkMode ? "bg-slate-950/75 backdrop-blur-[2px]" : "bg-slate-900/35"
          }`}
        />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="px-3 pt-3 md:px-4 md:pt-4">
          <nav className="mx-auto flex max-w-6xl items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 shadow-2xl backdrop-blur-xl md:px-4 md:py-3">
            <Link href="/" className="flex min-w-0 items-center gap-2 md:gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/logo21stCM_no_white_1.png"
                className="h-9 w-auto flex-shrink-0 md:h-12 lg:h-14"
                alt="21st Century Music"
              />
              <div className="flex min-w-0 flex-col">
                <span
                  className="whitespace-nowrap text-sm font-black italic leading-tight tracking-tighter text-white md:text-lg lg:text-2xl"
                  style={{ fontFamily: "Chaney, sans-serif" }}
                >
                  21st Century Music
                </span>
                <span className="whitespace-nowrap text-[7px] font-bold uppercase tracking-[0.28em] text-amber-400 md:text-[8px]">
                  Escuela de música moderna
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-1.5 md:gap-3">
              <button
                type="button"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="rounded-full bg-white/5 p-2 text-amber-400 transition hover:bg-white/10"
                aria-label="Cambiar tema"
              >
                {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
              </button>

              {links.map(({ href, label, Icon }) => (
                <Link key={href} href={href} className={tabClass(href)}>
                  <Icon size={14} />
                  <span className="hidden md:inline">{label}</span>
                </Link>
              ))}

              <Link
                href="/perfil"
                className={`flex items-center gap-2 rounded-2xl px-2 py-1 text-[10px] font-black uppercase transition-colors ${
                  pathname === "/perfil" ? activeClass : idleClass
                }`}
              >
                <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-2xl border border-amber-300/30 bg-black/40">
                  <Avatar
                    src={user.image}
                    name={user.displayName}
                    size={36}
                    className="h-full w-full text-sm"
                  />
                </span>
                <span className="hidden flex-col items-start leading-tight lg:flex">
                  <span className="max-w-24 truncate">{user.displayName}</span>
                  <span className="mt-0.5 flex items-center gap-1 text-amber-400">
                    <Award size={11} />
                    {user.medals}
                  </span>
                </span>
              </Link>

              <form action={logout}>
                <button
                  type="submit"
                  className="rounded-full p-2 text-white/50 transition hover:text-white"
                  title="Cerrar sesión"
                  aria-label="Cerrar sesión"
                >
                  <LogOut size={16} />
                </button>
              </form>
            </div>
          </nav>
        </header>

        <main className="flex-1 px-3 py-5 md:px-6 md:py-8">{children}</main>

        <footer className="py-6 text-center text-[8px] uppercase tracking-[0.4em] text-white/25">
          © 2026 21st Century Music
        </footer>
      </div>
    </div>
  );
}
