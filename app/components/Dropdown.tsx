"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface DropdownOption {
  value: string;
  label: string;
}

export interface DropdownGroup {
  label: string;
  options: DropdownOption[];
}

/**
 * Un desplegable con la lista redondeada y del color de la app.
 *
 * Existe porque la lista que abre un <select> la pinta el sistema, y no hay
 * CSS que la redondee ni le cambie la letra: salía el cuadro gris de Windows
 * en mitad de la página. Se maneja igual que uno de verdad: con el ratón, con
 * las flechas, Intro para elegir y Escape para cerrar.
 */
export default function Dropdown({
  value,
  onChange,
  options,
  groups,
  ariaLabel,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  /** Opciones sueltas, o… */
  options?: DropdownOption[];
  /** …agrupadas con un título por grupo. */
  groups?: DropdownGroup[];
  ariaLabel: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const allGroups: DropdownGroup[] = groups ?? [{ label: "", options: options ?? [] }];
  const flat = allGroups.flatMap((group) => group.options);
  const current = flat.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    // La elegida, a la vista nada más abrir.
    listRef.current
      ?.querySelector<HTMLElement>(`[data-value="${CSS.escape(value)}"]`)
      ?.scrollIntoView({ block: "nearest" });
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, value]);

  const choose = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  const move = (step: number) => {
    const index = flat.findIndex((option) => option.value === (active ?? value));
    const next = flat[Math.min(flat.length - 1, Math.max(0, index + step))];
    if (!next) return;
    setActive(next.value);
    listRef.current
      ?.querySelector<HTMLElement>(`[data-value="${CSS.escape(next.value)}"]`)
      ?.scrollIntoView({ block: "nearest" });
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setActive(value);
        setOpen(true);
        return;
      }
      move(event.key === "ArrowDown" ? 1 : -1);
      return;
    }
    if ((event.key === "Enter" || event.key === " ") && open && active) {
      event.preventDefault();
      choose(active);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${open ? "z-50" : ""} ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          setActive(value);
          setOpen((was) => !was);
        }}
        onKeyDown={onKeyDown}
        className={`flex w-full min-w-0 items-center gap-2 rounded-2xl border bg-slate-900/90 px-3.5 py-2.5 text-left text-sm text-white outline-none transition ${
          open ? "border-amber-300/60" : "border-white/10 hover:border-white/25 focus-visible:border-amber-300/60"
        }`}
      >
        <span className="min-w-0 flex-1 truncate">{current?.label ?? "Elige…"}</span>
        <ChevronDown
          size={16}
          className={`flex-shrink-0 text-white/50 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className="scroll-thin absolute left-0 right-0 top-[calc(100%+0.4rem)] max-h-72 min-w-[12rem] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/98 p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl"
        >
          {allGroups.map((group) => (
            <div key={group.label || "_"} role="group" aria-label={group.label || undefined}>
              {group.label && (
                <p className="px-3 pb-1 pt-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                  {group.label}
                </p>
              )}
              {group.options.map((option) => {
                const selected = option.value === value;
                const highlighted = option.value === active;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    data-value={option.value}
                    onMouseEnter={() => setActive(option.value)}
                    onClick={() => choose(option.value)}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                      selected ? "font-bold text-amber-200" : "text-white/85"
                    } ${highlighted ? "bg-white/10" : ""}`}
                  >
                    <span className="min-w-0 flex-1">{option.label}</span>
                    {selected && <Check size={14} className="flex-shrink-0 text-amber-300" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
