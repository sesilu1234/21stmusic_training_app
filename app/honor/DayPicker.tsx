"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { shiftDay } from "@/lib/madrid";

/**
 * Qué día del reto se mira: flechas para ir de uno en uno y, al pulsar la
 * fecha, un calendario del mes. Solo deja elegir días con reto ya cerrado,
 * de `min` (el primero) a `max` (ayer).
 *
 * Los días van como "2026-10-29", el día de Madrid que manda el servidor. Todo
 * se calcula en UTC a mediodía para que el navegador no mueva la fecha.
 */

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

const asDate = (day: string) => new Date(`${day}T12:00:00Z`);

const format = (day: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("es-ES", { ...options, timeZone: "UTC" }).format(asDate(day));

/** "jue 29 oct" */
const shortLabel = (day: string) => format(day, { weekday: "short", day: "numeric", month: "short" }).replace(/\./g, "");

/** "2026-10" → los días del mes, con huecos delante para que el 1 caiga en su día de la semana. */
const monthGrid = (month: string) => {
  const first = `${month}-01`;
  const lead = (asDate(first).getUTCDay() + 6) % 7; // lunes = 0
  const days: (string | null)[] = Array(lead).fill(null);
  for (let day = first; day.startsWith(month); day = shiftDay(day, 1)) days.push(day);
  return days;
};

const shiftMonth = (month: string, by: number) => shiftDay(`${month}-15`, by * 30).slice(0, 7);

export default function DayPicker({
  value,
  min,
  max,
  onPick,
}: {
  value: string;
  min: string;
  max: string;
  onPick: (day: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(value.slice(0, 7));
  const boxRef = useRef<HTMLDivElement>(null);

  // Se cierra al pulsar fuera o con Escape.
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (day: string) => {
    setOpen(false);
    if (day !== value) onPick(day);
  };

  const toggle = () => {
    if (!open) setMonth(value.slice(0, 7));
    setOpen(!open);
  };

  const label = value === max ? "Ayer" : shortLabel(value);
  const canBack = value > min;
  const canForward = value < max;
  const arrow =
    "grid h-6 w-6 place-items-center rounded-md text-white/35 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-0";

  return (
    <div ref={boxRef} className="relative">
      <div className="-ml-1.5 flex items-center">
        <button
          type="button"
          aria-label="Día anterior"
          disabled={!canBack}
          onClick={() => pick(shiftDay(value, -1))}
          className={arrow}
        >
          <ChevronLeft size={13} />
        </button>
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label="Elegir otro día"
          onClick={toggle}
          className={`flex items-center gap-1 rounded-md px-1 text-sm font-black capitalize transition hover:text-amber-200 ${
            open ? "text-amber-200" : "text-white"
          }`}
        >
          {label}
          <ChevronDown size={12} className={`text-white/40 transition ${open ? "rotate-180" : ""}`} />
        </button>
        <button
          type="button"
          aria-label="Día siguiente"
          disabled={!canForward}
          onClick={() => pick(shiftDay(value, 1))}
          className={arrow}
        >
          <ChevronRight size={13} />
        </button>
      </div>

      {open && (
        <div
          role="dialog"
          aria-label="Elegir día"
          className="absolute left-0 top-full z-30 mt-1.5 w-56 rounded-xl border border-white/15 bg-slate-700/90 p-2.5 shadow-xl shadow-black/30 backdrop-blur-xl"
        >
          <div className="mb-1.5 flex items-center justify-between">
            <button
              type="button"
              aria-label="Mes anterior"
              disabled={month <= min.slice(0, 7)}
              onClick={() => setMonth(shiftMonth(month, -1))}
              className={arrow}
            >
              <ChevronLeft size={14} />
            </button>
            <p className="text-xs font-black capitalize text-white">
              {format(`${month}-15`, { month: "long" })} {month.slice(0, 4)}
            </p>
            <button
              type="button"
              aria-label="Mes siguiente"
              disabled={month >= max.slice(0, 7)}
              onClick={() => setMonth(shiftMonth(month, 1))}
              className={arrow}
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center">
            {WEEKDAYS.map((weekday) => (
              <span key={weekday} className="pb-0.5 text-[9px] font-black uppercase text-white/45">
                {weekday}
              </span>
            ))}
            {monthGrid(month).map((day, index) => {
              if (!day) return <span key={`gap-${index}`} />;
              const enabled = day >= min && day <= max;
              const selected = day === value;
              return (
                <button
                  key={day}
                  type="button"
                  disabled={!enabled}
                  aria-pressed={selected}
                  aria-label={format(day, { weekday: "long", day: "numeric", month: "long" })}
                  onClick={() => pick(day)}
                  className={`grid h-7 place-items-center rounded-md text-[11px] font-bold tabular-nums transition ${
                    selected
                      ? "bg-amber-400 text-slate-950"
                      : enabled
                        ? "text-white hover:bg-white/15"
                        : "text-white/25"
                  }`}
                >
                  {Number(day.slice(8))}
                </button>
              );
            })}
          </div>

          {value !== max && (
            <button
              type="button"
              onClick={() => pick(max)}
              className="mt-1.5 w-full rounded-md py-1 text-[11px] font-bold text-amber-200/90 transition hover:bg-white/10"
            >
              Volver a ayer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
