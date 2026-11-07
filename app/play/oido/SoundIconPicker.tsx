"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export interface SoundIconOption {
  label: string;
  icon: ReactNode;
  /** Versiones a elegir (la guitarra: acero o nylon). Llevan desplegable. */
  variants?: { label: string; icon: ReactNode }[];
}

/**
 * Los iconos redondos de sonido de la cabecera, en los juegos de oído y de
 * piano. Un sonido con versiones enseña el icono de la elegida, y al tocarlo
 * se abre directamente el desplegable para cambiarla (y otra vez lo cierra).
 */
const SOLID: Record<string, string> = {
  "bg-violet-400/25": "bg-violet-400",
  "bg-emerald-400/25": "bg-emerald-400",
};

export default function SoundIconPicker({
  options,
  selectedIdx,
  onSelect,
  variantIdx,
  onVariant,
  activeClass,
}: {
  options: SoundIconOption[];
  selectedIdx: number;
  onSelect: (index: number) => void;
  variantIdx: number;
  onVariant: (index: number) => void;
  /** El fondo del icono elegido, con el color del juego. */
  activeClass: string;
}) {
  const [open, setOpen] = useState(false);
  /** Centro del icono que abre el menú, para colgarlo justo debajo. */
  const [anchor, setAnchor] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  // Se cierra al pulsar fuera o con Escape.
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const menuOption = options[selectedIdx]?.variants ? options[selectedIdx] : null;
  // En el menú, el color del juego en macizo. Escritas enteras: Tailwind solo
  // genera las clases que encuentra tal cual en el código.
  const solidActive = SOLID[activeClass] ?? "bg-amber-400";

  return (
    // El menú va fuera de la barra, como hermano: dentro, el desenfoque de la
    // barra le hace de fondo y el suyo propio no difumina nada.
    // `relative z-50` para que quede por encima de lo que hay debajo.
    <div ref={rootRef} className="relative z-50 flex-shrink-0">
      <div className="flex items-center gap-1 rounded-full border border-white/10 bg-slate-950/50 p-1 backdrop-blur-sm">
        {options.map((option, index) => {
          const selected = selectedIdx === index;
          const variant = option.variants?.[variantIdx] ?? option.variants?.[0];
          const label = variant ? `${option.label} (${variant.label})` : option.label;
          return (
            <button
              key={option.label}
              type="button"
              onClick={(event) => {
                if (option.variants) {
                  const button = event.currentTarget;
                  setAnchor(button.offsetLeft + button.offsetWidth / 2);
                  setOpen((was) => (selected ? !was : true));
                } else {
                  setOpen(false);
                }
                onSelect(index);
              }}
              title={label}
              aria-label={label}
              aria-haspopup={option.variants ? "listbox" : undefined}
              aria-expanded={option.variants ? selected && open : undefined}
              className={`grid h-7 w-7 place-items-center rounded-full text-xs transition md:h-8 md:w-8 md:text-sm ${
                selected ? activeClass : "opacity-40 hover:opacity-80"
              }`}
            >
              {variant?.icon ?? option.icon}
            </button>
          );
        })}
      </div>

      {open && menuOption?.variants && (
        <ul
          role="listbox"
          aria-label={menuOption.label}
          style={{ left: anchor }}
          className="absolute top-full mt-2 flex -translate-x-1/2 flex-col gap-1 rounded-lg border-2 border-black bg-neutral-900 p-1 shadow-[3px_3px_0px_#000]"
        >
          {menuOption.variants.map((choice, choiceIdx) => {
            const chosen = variantIdx === choiceIdx;
            return (
              <li key={choice.label}>
                <button
                  type="button"
                  role="option"
                  aria-selected={chosen}
                  onClick={() => {
                    onVariant(choiceIdx);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 whitespace-nowrap rounded-md py-1 pl-1 pr-3 text-[11px] font-bold uppercase tracking-[0.12em] transition ${
                    chosen ? `${solidActive} text-black` : "text-white/60 hover:bg-white/10 hover:text-white"
                  }`}
                  style={{ fontFamily: "var(--font-geist-mono), ui-monospace, monospace" }}
                >
                  <span className="grid h-6 w-6 place-items-center">{choice.icon}</span>
                  {choice.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
