"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
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

        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center py-10 md:py-14">
          <div className="mb-8 md:mb-10">
            <p
              className={`mb-2.5 flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.32em] ${palette.accent}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${palette.dot}`} />
              {eyebrow}
            </p>
            <h1 className="text-3xl font-black italic tracking-tight md:text-5xl">{title}</h1>
            {intro && (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">{intro}</p>
            )}
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2 md:gap-4">
            {options.map(({ title: optionTitle, description, href, Icon, badge }) => (
              <Link
                key={href}
                href={href}
                className={`group flex flex-col rounded-2xl border border-white/10 bg-slate-950/70 p-5 shadow-xl backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:bg-slate-950/85 md:p-6 ${palette.hoverBorder}`}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span
                    className={`grid h-12 w-12 place-items-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${palette.iconBg}`}
                  >
                    <Icon size={22} className={palette.accent} strokeWidth={1.75} />
                  </span>
                  {badge && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-white/50">
                      {badge}
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-black italic leading-tight tracking-tight text-white md:text-2xl">
                  {optionTitle}
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/45 transition-colors group-hover:text-white/65">
                  {description}
                </p>

                <span
                  className={`mt-5 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] opacity-0 transition-opacity group-hover:opacity-100 ${palette.accent}`}
                >
                  Empezar
                  <ArrowRight size={13} />
                </span>
              </Link>
            ))}
          </div>
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}
