"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Lock } from "lucide-react";
import Backdrop from "./Backdrop";
import SiteFooter from "./SiteFooter";
import { categoryOf, type CategoryId } from "@/lib/games";

type IconComponent = React.ElementType<{
  size?: number;
  className?: string;
  strokeWidth?: number;
}>;

export interface SubMenuOption {
  title: string;
  description: string;
  href: string;
  Icon: IconComponent;
  /** Etiqueta corta opcional: "Nivel 1", "Nuevo"… */
  badge?: string;
  /**
   * true = pide cuenta y todavía no hay ninguna. Se enseña apagado y con
   * candado, igual que los modos cerrados del menú principal, y lleva al
   * login en vez de al nivel.
   */
  locked?: boolean;
}

/**
 * Menú de segundo nivel (Oído, Intervalos, Ritmo, Acordes…).
 * Antes cada uno era una copia del mismo archivo con otro color; ahora el
 * color sale de la categoría a la que pertenece el modo.
 */
export default function SubMenu({
  eyebrow,
  title,
  intro,
  category,
  options,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  category: CategoryId;
  options: SubMenuOption[];
}) {
  const palette = categoryOf(category);

  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans text-white">
      <Backdrop />

      <div className="relative z-10 flex min-h-screen flex-col px-4 py-5 md:px-8 md:py-7">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-slate-950/50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/60 backdrop-blur-sm transition hover:border-amber-300/40 hover:text-white"
        >
          <ArrowLeft size={14} />
          Menú principal
        </Link>

        <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-start py-9 md:py-10">
          <div className="mb-6 md:mb-7">
            <p
              className={`mb-2.5 flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.32em] ${palette.accent}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${palette.dot}`} />
              {eyebrow}
            </p>
            <h1 className="text-3xl font-black italic tracking-tight md:text-4xl">{title}</h1>
            {intro && (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">{intro}</p>
            )}
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            {options.map(({ title: optionTitle, description, href, Icon, badge, locked }) => (
              <Link
                key={href}
                href={locked ? "/login" : href}
                aria-label={locked ? `${optionTitle} — solo para alumnos` : optionTitle}
                className={`group relative flex min-h-[132px] flex-col rounded-2xl border p-5 shadow-xl backdrop-blur-sm transition duration-200 ${
                  locked
                    ? "border-white/[0.06] bg-slate-950/40 hover:border-amber-300/30 hover:bg-slate-950/60"
                    : `border-white/10 bg-slate-950/70 hover:-translate-y-0.5 hover:bg-slate-950/85 ${palette.hoverBorder}`
                }`}
              >
                {locked && (
                  <span
                    title="Solo para alumnos de la escuela"
                    className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full border border-white/10 bg-slate-900/80 text-white/40 transition-colors group-hover:border-amber-300/40 group-hover:text-amber-300"
                  >
                    <Lock size={12} strokeWidth={2.25} />
                  </span>
                )}

                <div
                  className={`mb-4 flex items-center justify-between gap-3 ${
                    locked ? "opacity-45 grayscale" : ""
                  }`}
                >
                  <span
                    className={`grid h-12 w-12 place-items-center rounded-xl transition-transform duration-200 ${
                      locked ? "" : "group-hover:scale-105"
                    } ${palette.iconBg}`}
                  >
                    <Icon size={22} className={palette.accent} strokeWidth={1.75} />
                  </span>
                  {badge && !locked && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-white/50">
                      {badge}
                    </span>
                  )}
                </div>

                <h2
                  className={`text-xl font-black italic leading-tight tracking-tight md:text-2xl ${
                    locked ? "text-white/70" : "text-white"
                  }`}
                >
                  {optionTitle}
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/45 transition-colors group-hover:text-white/65">
                  {description}
                </p>

                {locked ? (
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 transition-colors group-hover:text-amber-300/70">
                    Solo alumnos
                    <ArrowRight size={13} />
                  </span>
                ) : (
                  <span
                    className={`mt-auto inline-flex items-center gap-1.5 pt-4 text-[10px] font-black uppercase tracking-[0.2em] opacity-0 transition-opacity group-hover:opacity-100 ${palette.accent}`}
                  >
                    Empezar
                    <ArrowRight size={13} />
                  </span>
                )}
              </Link>
            ))}
          </div>
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}
