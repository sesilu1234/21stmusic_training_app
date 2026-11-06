"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, ChevronDown, ChevronRight, Lock } from "lucide-react";
import Dropdown from "./Dropdown";
import { LevelMedal, MedalAward } from "./MedalBadge";
import type { Category } from "@/lib/games";
import type { SubMenuGroup, SubMenuLayout, SubMenuOption } from "./SubMenu";

/**
 * Las maneras de enseñar un submenú que no son la rejilla de tarjetas.
 *
 * Están a prueba: las tarjetas grandes, con cinco u ocho niveles, llenaban la
 * pantalla y abrumaban. Cada modo de Lenguaje musical lleva una distinta para
 * compararlas en uso real y quedarse con la que funcione.
 */

type HasMedal = (href: string) => boolean;

interface LayoutProps {
  options: SubMenuOption[];
  groups?: SubMenuGroup[];
  palette: Category;
  hasMedal: HasMedal;
}

const PANEL =
  "rounded-2xl border border-white/10 bg-slate-950/70 shadow-xl backdrop-blur-sm";

/** "Nivel 3" no dice nada que no diga ya el orden; "Contrarreloj" sí. */
const isPlainLevel = (badge?: string) => !badge || /^Nivel \d+$/.test(badge);

const targetOf = (option: SubMenuOption) => (option.locked ? "/login" : option.href);

const ariaOf = (option: SubMenuOption) =>
  option.locked ? `${option.title} — solo para alumnos` : option.title;

/** El icono (o la imagen) en pequeño, para las filas. */
function Thumb({
  option,
  palette,
  size = "sm",
}: {
  option: SubMenuOption;
  palette: Category;
  size?: "sm" | "lg";
}) {
  const { Icon, image, locked } = option;
  const box = size === "lg" ? "h-12" : "h-9";
  if (image) {
    return (
      <span
        className={`flex ${box} flex-shrink-0 items-center gap-0.5 rounded-lg bg-white px-1 py-0.5 [&_img]:h-full ${
          locked ? "opacity-45 grayscale" : ""
        }`}
      >
        {image}
      </span>
    );
  }
  return (
    <span
      className={`grid ${box} ${size === "lg" ? "w-12" : "w-9"} flex-shrink-0 place-items-center rounded-lg ${palette.iconBg} ${
        locked ? "opacity-45 grayscale" : ""
      }`}
    >
      <Icon size={size === "lg" ? 22 : 17} className={palette.accent} strokeWidth={1.9} />
    </span>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span className="shrink-0 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-white/45">
      {text}
    </span>
  );
}

/** Una fila enlazada: icono, título, descripción corta y flecha. */
function Row({
  option,
  palette,
  medal,
  showDescription = true,
  bigMedal = false,
}: {
  option: SubMenuOption;
  palette: Category;
  medal: boolean;
  showDescription?: boolean;
  /**
   * La medalla en grande a la derecha. Sin ganar, la misma medalla apagada: se
   * ve lo que hay por conseguir.
   */
  bigMedal?: boolean;
}) {
  return (
    <Link
      href={targetOf(option)}
      aria-label={medal ? `${ariaOf(option)} — pleno` : ariaOf(option)}
      className="group flex items-center gap-3.5 rounded-xl px-3 py-3 transition-colors hover:bg-white/[0.06]"
    >
      <Thumb option={option} palette={palette} />
      <span className={`min-w-0 flex-1 ${option.locked ? "opacity-50" : ""}`}>
        <span className="flex items-center gap-2">
          <span className="text-[15px] font-black italic leading-tight tracking-tight text-white md:text-base">
            {option.title}
          </span>
          {medal && !bigMedal && <LevelMedal id={`row-${option.href}`} />}
        </span>
        {showDescription && (
          <span className="mt-0.5 block text-xs leading-5 text-white/45 transition-colors group-hover:text-white/65">
            {option.description}
          </span>
        )}
      </span>
      {option.badge && !option.locked && (
        <span className="hidden sm:inline-flex">
          <Badge text={option.badge} />
        </span>
      )}
      {bigMedal && !option.locked && (
        <span
          className={`flex-shrink-0 transition-transform duration-200 ${
            medal ? "group-hover:scale-110" : "opacity-[0.18] grayscale"
          }`}
        >
          <MedalAward id={`big-${option.href}`} count={medal ? 1 : 0} total={1} size={30} />
        </span>
      )}
      {option.locked ? (
        <Lock size={14} className="flex-shrink-0 text-white/35 group-hover:text-amber-300" />
      ) : (
        <ChevronRight
          size={17}
          className="flex-shrink-0 text-white/25 transition group-hover:translate-x-0.5 group-hover:text-white/70"
        />
      )}
    </Link>
  );
}

/** El botón grande de entrar al nivel elegido. */
function StartButton({
  option,
  palette,
  small = false,
}: {
  option: SubMenuOption;
  palette: Category;
  small?: boolean;
}) {
  return (
    <Link
      href={targetOf(option)}
      aria-label={option.locked ? `${option.title} — entrar para jugar` : `Empezar: ${option.title}`}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-black uppercase tracking-[0.2em] transition hover:brightness-110 active:scale-[0.98] ${
        small ? "px-4 py-2 text-[10px]" : "w-full px-6 py-3 text-[11px] sm:w-auto"
      } ${option.locked ? "border border-white/15 bg-white/5 text-white/70" : palette.solid}`}
    >
      {option.locked ? "Solo alumnos · entrar" : "Empezar"}
      <ArrowRight size={small ? 13 : 15} />
    </Link>
  );
}

/** La ficha del nivel elegido, debajo del selector (desplegable y chips). */
function DetailPanel({
  option,
  palette,
  medal,
}: {
  option: SubMenuOption;
  palette: Category;
  medal: boolean;
}) {
  return (
    <div className={`${PANEL} mt-4 p-5 md:p-6`}>
      <div className="flex items-start gap-4">
        <Thumb option={option} palette={palette} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {option.badge && <Badge text={option.badge} />}
            {medal && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-amber-300">
                <LevelMedal id={`detail-${option.href}`} />
                Pleno
              </span>
            )}
          </div>
          <h2 className="mt-2 text-2xl font-black italic leading-tight tracking-tight text-white">
            {option.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/55">{option.description}</p>
        </div>
      </div>
      <div className="mt-5">
        <StartButton option={option} palette={palette} />
      </div>
    </div>
  );
}

/** Abre y cierra con altura animada. `inert` saca lo cerrado del tabulador. */
function Collapse({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div
      inert={!open}
      className={`grid transition-[grid-template-rows] duration-300 ease-out ${
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      }`}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

/**
 * Reparte las opciones en sus grupos. Sin grupos, un único grupo con todo; con
 * uno solo, van todas a él sin tener que marcarlas.
 */
const sectionsOf = (options: SubMenuOption[], groups?: SubMenuGroup[]) =>
  groups && groups.length === 1
    ? [{ ...groups[0], options }]
    : groups && groups.length > 0
    ? groups
        .map((group) => ({ ...group, options: options.filter((o) => o.group === group.id) }))
        .filter((group) => group.options.length > 0)
    : [{ id: "_", title: "Niveles", description: undefined, options }];

/** El primero sin pleno: es por donde se sigue. */
const firstPending = (options: SubMenuOption[], hasMedal: HasMedal) =>
  Math.max(
    0,
    options.findIndex((o) => !o.locked && !hasMedal(o.href)),
  );

// ---------------------------------------------------------------------------
// 1. Acordeón: un desplegable por grupo, con los niveles dentro en filas.
// ---------------------------------------------------------------------------
/**
 * Las medallas van en grande: a la derecha de cada fila (apagada si todavía no
 * está ganada) y con la cuenta en la cabecera de cada bloque.
 */
function AccordionLayout({ options, groups, palette, hasMedal }: LayoutProps) {
  const sections = sectionsOf(options, groups);
  const [open, setOpen] = useState<Set<string>>(() => new Set([sections[0]?.id]));

  const toggle = (id: string) =>
    setOpen((was) => {
      const next = new Set(was);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="flex w-full flex-col gap-3">
      {sections.map((section) => {
        const isOpen = open.has(section.id);
        const done = section.options.filter((o) => hasMedal(o.href)).length;
        return (
          <section key={section.id} className={PANEL}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => toggle(section.id)}
              className="flex w-full items-center gap-3 rounded-2xl px-5 py-4 text-left transition-colors hover:bg-white/[0.03]"
            >
              <span className={`h-2 w-2 flex-shrink-0 rounded-full ${palette.dot}`} />
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-black italic leading-tight tracking-tight text-white">
                  {section.title}
                </span>
                {section.description && (
                  <span className="mt-0.5 block text-xs leading-5 text-white/45">
                    {section.description}
                  </span>
                )}
              </span>
              {done > 0 ? (
                <span className="flex-shrink-0">
                  <MedalAward
                    id={`section-${section.id}`}
                    count={done}
                    total={section.options.length}
                    size={28}
                  />
                </span>
              ) : (
                <span className="flex-shrink-0 text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
                  {done > 0 ? `${done}/${section.options.length}` : `${section.options.length} ${section.options.length === 1 ? "nivel" : "niveles"}`}
                </span>
              )}
              <ChevronDown
                size={18}
                className={`flex-shrink-0 text-white/45 transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <Collapse open={isOpen}>
              <div className="border-t border-white/[0.06] p-2">
                {section.options.map((option) => (
                  <Row
                    key={option.href}
                    option={option}
                    palette={palette}
                    medal={!option.locked && hasMedal(option.href)}
                    bigMedal
                  />
                ))}
              </div>
            </Collapse>
          </section>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. Desplegable: un selector de nivel y la ficha del elegido debajo.
// ---------------------------------------------------------------------------
function SelectLayout({ options, groups, palette, hasMedal }: LayoutProps) {
  const [chosen, setChosen] = useState<string | null>(null);
  // Hasta que se elige algo, sale el siguiente nivel por hacer.
  const current =
    options.find((o) => o.href === chosen) ?? options[firstPending(options, hasMedal)];

  const labelOf = (o: SubMenuOption) =>
    `${o.badge && isPlainLevel(o.badge) ? `${o.badge} · ` : ""}${o.title}${
      hasMedal(o.href) ? "  ★" : ""
    }${o.locked ? "  🔒" : ""}`;

  const sections = sectionsOf(options, groups);

  return (
    <div className="max-w-2xl">
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/40">
        Nivel
      </p>
      <Dropdown
        ariaLabel="Elige el nivel"
        value={current.href}
        onChange={setChosen}
        className="[&>button]:py-3.5 [&>button]:text-base [&>button]:font-bold"
        groups={sections.map((section) => ({
          label: sections.length > 1 ? section.title : "",
          options: section.options.map((o) => ({ value: o.href, label: labelOf(o) })),
        }))}
      />
      <DetailPanel
        option={current}
        palette={palette}
        medal={!current.locked && hasMedal(current.href)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. Pestañas: un interruptor arriba (p. ej. Nombrar / Escribir) y sus
//    niveles en lista debajo.
// ---------------------------------------------------------------------------
function TabsLayout({ options, groups, palette, hasMedal }: LayoutProps) {
  const sections = sectionsOf(options, groups);
  const [active, setActive] = useState(sections[0]?.id);
  const section = sections.find((s) => s.id === active) ?? sections[0];

  return (
    <div className="max-w-2xl">
      <div
        role="tablist"
        className="flex w-full rounded-full border border-white/10 bg-slate-950/70 p-1 backdrop-blur-sm sm:inline-flex sm:w-auto"
      >
        {sections.map((s) => {
          const selected = s.id === section.id;
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(s.id)}
              className={`flex-1 rounded-full px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.16em] transition sm:flex-none ${
                selected ? palette.solid : "text-white/55 hover:text-white"
              }`}
            >
              {s.title}
            </button>
          );
        })}
      </div>

      {section.description && (
        <p className="mt-4 text-sm leading-6 text-white/55">{section.description}</p>
      )}

      <div role="tabpanel" className={`${PANEL} mt-4 p-2`}>
        {section.options.map((option) => (
          <Row
            key={option.href}
            option={option}
            palette={palette}
            medal={!option.locked && hasMedal(option.href)}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. Lista: todos los niveles en un único panel, fila a fila.
// ---------------------------------------------------------------------------
function ListLayout({ options, palette, hasMedal }: LayoutProps) {
  return (
    <div className={`${PANEL} max-w-2xl divide-y divide-white/[0.06] p-2`}>
      {options.map((option) => (
        <div key={option.href} className="py-0.5">
          <Row option={option} palette={palette} medal={!option.locked && hasMedal(option.href)} />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. Camino: los niveles como pasos numerados unidos por una línea.
// ---------------------------------------------------------------------------
function TimelineLayout({ options, palette, hasMedal }: LayoutProps) {
  const next = firstPending(options, hasMedal);
  return (
    <ol className="max-w-2xl">
      {options.map((option, index) => {
        const medal = !option.locked && hasMedal(option.href);
        const isNext = index === next && !medal;
        const last = index === options.length - 1;
        return (
          <li key={option.href} className="relative flex gap-4 pb-3">
            {!last && (
              <span
                aria-hidden
                className={`absolute bottom-0 left-[19px] top-10 w-0.5 ${
                  medal ? "bg-amber-300/40" : "bg-white/10"
                }`}
              />
            )}
            <span
              className={`relative z-[1] mt-1.5 grid h-10 w-10 flex-shrink-0 place-items-center rounded-full border text-sm font-black transition ${
                medal
                  ? "border-amber-300/60 bg-amber-400/20 text-amber-200"
                  : isNext
                    ? `border-transparent ${palette.solid}`
                    : "border-white/15 bg-slate-950/85 text-white/60"
              }`}
            >
              {medal ? <Check size={17} strokeWidth={3} /> : index + 1}
            </span>
            <Link
              href={targetOf(option)}
              aria-label={ariaOf(option)}
              className={`group flex min-w-0 flex-1 items-center gap-3 rounded-xl border bg-slate-950/65 px-4 py-3 backdrop-blur-sm transition hover:bg-slate-950/85 ${
                isNext ? "border-white/20" : "border-white/[0.08]"
              } ${palette.hoverBorder}`}
            >
              <span className={`min-w-0 flex-1 ${option.locked ? "opacity-50" : ""}`}>
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-black italic leading-tight tracking-tight text-white">
                    {option.title}
                  </span>
                  {!isPlainLevel(option.badge) && <Badge text={option.badge!} />}
                  {isNext && (
                    <span
                      className={`text-[9px] font-black uppercase tracking-[0.18em] ${palette.accent}`}
                    >
                      · Siguiente
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-xs leading-5 text-white/45 transition-colors group-hover:text-white/65">
                  {option.description}
                </span>
              </span>
              {option.locked ? (
                <Lock size={14} className="flex-shrink-0 text-white/35" />
              ) : (
                <ChevronRight
                  size={17}
                  className="flex-shrink-0 text-white/25 transition group-hover:translate-x-0.5 group-hover:text-white/70"
                />
              )}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// 6. Chips: los niveles en botoncitos y la ficha del elegido debajo.
// ---------------------------------------------------------------------------
function PillsLayout({ options, palette, hasMedal }: LayoutProps) {
  const [chosen, setChosen] = useState<string | null>(null);
  const current =
    options.find((o) => o.href === chosen) ?? options[firstPending(options, hasMedal)];

  return (
    <div className="max-w-2xl">
      <div className="flex flex-wrap gap-2">
        {options.map((option, index) => {
          const selected = option.href === current.href;
          const medal = !option.locked && hasMedal(option.href);
          return (
            <button
              key={option.href}
              type="button"
              aria-pressed={selected}
              onClick={() => setChosen(option.href)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition ${
                selected
                  ? `border-transparent ${palette.solid}`
                  : "border-white/10 bg-slate-950/70 text-white/70 backdrop-blur-sm hover:border-white/25 hover:text-white"
              }`}
            >
              <span className={`text-[10px] font-black ${selected ? "opacity-60" : "text-white/35"}`}>
                {index + 1}
              </span>
              {option.title}
              {medal && <LevelMedal id={`pill-${option.href}`} />}
              {option.locked && <Lock size={12} className="opacity-60" />}
            </button>
          );
        })}
      </div>
      <DetailPanel
        option={current}
        palette={palette}
        medal={!current.locked && hasMedal(current.href)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 7. Desplegable por nivel: cada fila se abre y enseña su descripción y el
//    botón de empezar. Solo una abierta a la vez.
// ---------------------------------------------------------------------------
function ExpandLayout({ options, palette, hasMedal }: LayoutProps) {
  const [openHref, setOpenHref] = useState<string | null>(null);
  return (
    <div className={`${PANEL} max-w-2xl divide-y divide-white/[0.06] overflow-hidden`}>
      {options.map((option) => {
        const isOpen = openHref === option.href;
        const medal = !option.locked && hasMedal(option.href);
        return (
          <div key={option.href} className={isOpen ? "bg-white/[0.035]" : ""}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenHref(isOpen ? null : option.href)}
              className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.04]"
            >
              <Thumb option={option} palette={palette} />
              <span className={`flex min-w-0 flex-1 items-center gap-2 ${option.locked ? "opacity-50" : ""}`}>
                <span className="text-[15px] font-black italic leading-tight tracking-tight text-white md:text-base">
                  {option.title}
                </span>
                {medal && <LevelMedal id={`exp-${option.href}`} />}
              </span>
              {option.badge && <Badge text={option.badge} />}
              {option.locked && <Lock size={13} className="flex-shrink-0 text-white/35" />}
              <ChevronDown
                size={17}
                className={`flex-shrink-0 text-white/40 transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <Collapse open={isOpen}>
              <div className="flex flex-col gap-3 px-4 pb-4 sm:flex-row sm:items-end sm:justify-between sm:pl-[66px]">
                <p className="text-sm leading-6 text-white/55">{option.description}</p>
                <StartButton option={option} palette={palette} small />
              </div>
            </Collapse>
          </div>
        );
      })}
    </div>
  );
}

const LAYOUTS: Record<Exclude<SubMenuLayout, "cards">, (props: LayoutProps) => React.ReactNode> = {
  accordion: AccordionLayout,
  select: SelectLayout,
  tabs: TabsLayout,
  list: ListLayout,
  timeline: TimelineLayout,
  pills: PillsLayout,
  expand: ExpandLayout,
};

export default function SubMenuLayoutView({
  layout,
  ...props
}: LayoutProps & { layout: Exclude<SubMenuLayout, "cards"> }) {
  const View = LAYOUTS[layout];
  return <View {...props} />;
}
