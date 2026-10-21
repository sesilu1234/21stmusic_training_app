"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Lock } from "lucide-react";
import Backdrop from "./Backdrop";
import { MedalSticker } from "./MedalBadge";
import { useLevelMedals } from "./useLevelMedals";
import ThemeToggle from "./ThemeToggle";
import { useBackHref } from "./useBackHref";
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
  /**
   * Una imagen en lugar del icono, en el mismo sitio y a la misma altura. Para
   * los modos en los que lo que distingue un nivel se ve mejor que se dice
   * (las claves de Armaduras).
   */
  image?: React.ReactNode;
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
  beforeOptions,
  compact = false,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  category: CategoryId;
  options: SubMenuOption[];
  /** Algo que va entre la introducción y las tarjetas, como un selector de nivel. */
  beforeOptions?: React.ReactNode;
  /**
   * Tarjetas más apretadas y en tres columnas. Para menús con pocas opciones
   * y textos cortos (Armaduras), donde la tarjeta normal deja mucho hueco.
   */
  compact?: boolean;
}) {
  const palette = categoryOf(category);
  const hasMedal = useLevelMedals();
  const back = useBackHref();

  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans text-white">
      <Backdrop />

      <div className="relative z-10 flex min-h-screen flex-col px-4 py-5 md:px-8 md:py-7">
        <div className="flex items-center justify-between gap-3">
          <Link
            href={back.href}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-slate-950/50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/60 backdrop-blur-sm transition hover:border-amber-300/40 hover:text-white"
          >
            <ArrowLeft size={14} />
            {back.href === "/" ? "Menú principal" : "Atrás"}
          </Link>
          <ThemeToggle onPhoto />
        </div>

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

          {beforeOptions}

          <div className={`grid gap-3.5 sm:grid-cols-2 ${compact ? "lg:grid-cols-3" : ""}`}>
            {options.map(({ title: optionTitle, description, href, Icon, image, badge, locked }) => {
              const medal = !locked && hasMedal(href);
              return (
              <Link
                key={href}
                href={locked ? "/login" : href}
                aria-label={locked ? `${optionTitle} — solo para alumnos` : optionTitle}
                /* Con medalla va por encima de las demás: la medalla se sale de
                   la tarjeta, y el desenfoque del fondo hace de cada tarjeta su
                   propia capa, así que la siguiente la taparía. */
                className={`group relative flex flex-col rounded-2xl border shadow-xl ${compact ? "p-4" : "min-h-[132px] p-5"} backdrop-blur-sm transition duration-200 ${
                  medal ? "z-10" : ""
                } ${
                  locked
                    ? "border-white/[0.06] bg-slate-950/40 hover:border-amber-300/30 hover:bg-slate-950/60"
                    : `border-white/10 bg-slate-950/70 hover:-translate-y-0.5 hover:bg-slate-950/85 ${palette.hoverBorder}`
                }`}
              >
                {/* Pleno en partida larga en este nivel: la misma medalla del
                    menú principal, pegada en la esquina. */}
                {medal && <MedalSticker id={href} count={1} total={1} />}

                {locked && (
                  <span
                    title="Solo para alumnos de la escuela"
                    className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full border border-white/10 bg-slate-900/80 text-white/40 transition-colors group-hover:border-amber-300/40 group-hover:text-amber-300"
                  >
                    <Lock size={12} strokeWidth={2.25} />
                  </span>
                )}

                <div
                  className={`${compact ? "mb-3" : "mb-4"} flex items-center justify-between gap-3 ${
                    locked ? "opacity-45 grayscale" : ""
                  }`}
                >
                  {/* La imagen va donde iría el icono y a la misma altura: es
                      un icono más, no una portada de la tarjeta. */}
                  {image ? (
                    <span
                      className={`flex h-12 items-center gap-1 rounded-xl bg-white px-1.5 py-1 transition-transform duration-200 ${
                        locked ? "" : "group-hover:scale-105"
                      }`}
                    >
                      {image}
                    </span>
                  ) : (
                  <span
                    className={`grid h-12 w-12 place-items-center rounded-xl transition-transform duration-200 ${
                      locked ? "" : "group-hover:scale-105"
                    } ${palette.iconBg}`}
                  >
                    <Icon size={22} className={palette.accent} strokeWidth={1.75} />
                  </span>
                  )}
                  {badge && !locked && (
                    <span
                      className={`shrink-0 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-white/50 ${
                        medal ? "mr-6" : ""
                      }`}
                    >
                      {badge}
                    </span>
                  )}
                </div>

                <h2
                  className={`font-black italic leading-tight tracking-tight ${
                    compact ? "text-lg md:text-xl" : "text-xl md:text-2xl"
                  } ${
                    locked ? "text-white/70" : "text-white"
                  }`}
                >
                  {optionTitle}
                </h2>
                <p className={`text-sm text-white/45 ${compact ? "mt-1 leading-5" : "mt-2 leading-6"} transition-colors group-hover:text-white/65`}>
                  {description}
                </p>

                {locked ? (
                  <span className={`mt-auto inline-flex items-center gap-1.5 ${compact ? "pt-3" : "pt-4"} text-[10px] font-black uppercase tracking-[0.2em] text-white/30 transition-colors group-hover:text-amber-300/70`}>
                    Solo alumnos
                    <ArrowRight size={13} />
                  </span>
                ) : (
                  <span
                    className={`mt-auto inline-flex items-center gap-1.5 ${compact ? "pt-3" : "pt-4"} text-[10px] font-black uppercase tracking-[0.2em] opacity-0 transition-opacity group-hover:opacity-100 ${palette.accent}`}
                  >
                    Empezar
                    <ArrowRight size={13} />
                  </span>
                )}
              </Link>
              );
            })}
          </div>
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}
