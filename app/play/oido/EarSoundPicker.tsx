"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { EAR_SOUNDS, earSoundIcon } from "./audio";

/**
 * Los botones de sonido de los modos de intervalos. Un instrumento con
 * versiones (la guitarra: acero o nylon) lleva una flecha que abre un
 * desplegable para elegirla. Pulsar el instrumento solo lo elige.
 */
export default function EarSoundPicker({
  soundIdx,
  setSoundIdx,
  variantIdx,
  setVariantIdx,
}: {
  soundIdx: number;
  setSoundIdx: (index: number) => void;
  variantIdx: number;
  setVariantIdx: (index: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Se cierra al pulsar fuera o con Escape.
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
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

  // El texto va en cada botón: un botón no hereda las mayúsculas de su caja.
  const text = "text-[9px] font-black uppercase tracking-wider";

  return (
    // `relative z-30`: con el desenfoque de fondo esta caja hace su propia capa,
    // y sin subirla el desplegable quedaría debajo de los botones de respuesta.
    <div className="relative z-30 flex items-center bg-black/50 border border-white/10 rounded-md p-2 backdrop-blur-md gap-2">
      {EAR_SOUNDS.map((sound, index) => {
        const selected = soundIdx === index;
        return (
          <div key={sound.label} className="relative" ref={sound.variants ? menuRef : undefined}>
            <div
              className={`flex items-center rounded-md border-2 transition-all duration-100
                ${selected
                  ? "bg-amber-400 text-black border-black shadow-[4px_4px_0px_#000]"
                  : "bg-white/5 text-white/40 border-transparent hover:text-white/80 hover:bg-white/10"
                }`}
            >
              <button
                type="button"
                onClick={() => {
                  setSoundIdx(index);
                  setOpen(false);
                }}
                aria-pressed={selected}
                className={`flex items-center gap-1.5 py-1.5 pl-3 ${sound.variants ? "pr-1" : "pr-3"} ${text}`}
              >
                <span className="text-sm leading-none">{earSoundIcon(sound, variantIdx)}</span>
                <span className="hidden sm:inline">{sound.label}</span>
              </button>
              {sound.variants && (
                <button
                  type="button"
                  onClick={() => setOpen((was) => !was)}
                  aria-label={`Elegir ${sound.label.toLowerCase()}`}
                  aria-haspopup="listbox"
                  aria-expanded={open}
                  className="grid self-stretch place-items-center rounded-r-[4px] pl-1 pr-2 transition hover:bg-black/10"
                >
                  <ChevronDown size={12} strokeWidth={3} className={`transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
              )}
            </div>

            {sound.variants && open && (
              <ul
                role="listbox"
                aria-label={sound.label}
                className="absolute left-0 top-full mt-2 flex w-full min-w-[8.5rem] flex-col gap-0.5 rounded-md border border-white/10 bg-neutral-950/95 p-1 shadow-[4px_4px_0px_#000]"
              >
                {sound.variants.map((option, optionIdx) => {
                  const chosen = variantIdx === optionIdx;
                  return (
                    <li key={option.label}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={chosen}
                        onClick={() => {
                          setSoundIdx(index);
                          setVariantIdx(optionIdx);
                          setOpen(false);
                        }}
                        className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition ${text}
                          ${chosen ? "bg-white/10 text-amber-400" : "text-white/55 hover:bg-white/5 hover:text-white"}`}
                      >
                        <span className="text-sm leading-none">{option.icon}</span>
                        {option.label}
                        {chosen && <Check size={11} strokeWidth={3} className="ml-auto" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
