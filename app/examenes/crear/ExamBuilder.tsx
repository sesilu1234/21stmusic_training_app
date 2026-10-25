"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import Dropdown from "@/app/components/Dropdown";
import { CATEGORIES } from "@/lib/games";
import { EXAM_LIMITS, EXAM_MODES, findExamMode } from "@/lib/exams/catalog";
import ShareCode from "../ShareCode";
import { publishExam } from "./actions";

interface Block {
  /** Solo para el `key` de React. */
  id: number;
  mode: string;
  level: string | null;
  count: number;
  seconds: number;
}

const firstLevel = (mode: string) => findExamMode(mode)?.levels[0]?.slug ?? null;

const newBlock = (id: number): Block => ({
  id,
  mode: EXAM_MODES[0].slug,
  level: firstLevel(EXAM_MODES[0].slug),
  count: 10,
  seconds: EXAM_LIMITS.secondsDefault,
});

/** Los modos, agrupados como en el menú de juegos. */
const MODE_GROUPS = CATEGORIES.map((category) => ({
  label: category.label,
  options: EXAM_MODES.filter((mode) => mode.category === category.id).map((mode) => ({
    value: mode.slug,
    label: mode.label,
  })),
})).filter((group) => group.options.length > 0);

const SECONDS_OPTIONS = EXAM_LIMITS.secondsOptions.map((seconds) => ({
  value: String(seconds),
  label: `${seconds} s`,
}));

/**
 * Cuántas preguntas: un número con − y + a los lados. Las flechitas del
 * <input type="number"> las dibuja el sistema y no se pueden poner bonitas, así
 * que se esconden (`appearance`) y se ponen estos dos botones, que además se
 * aciertan mejor con el dedo. Se puede escribir el número igualmente.
 */
const CountStepper = ({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
}) => {
  const set = (next: number) =>
    onChange(Math.min(EXAM_LIMITS.perBlockMax, Math.max(1, Math.floor(next) || 1)));
  const button =
    "grid h-full w-8 flex-shrink-0 place-items-center text-white/50 transition hover:text-amber-200 disabled:opacity-25 disabled:hover:text-white/50";

  return (
    <div className="flex h-[2.625rem] items-stretch overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 focus-within:border-amber-300/60">
      <button
        type="button"
        onClick={() => set(value - 1)}
        disabled={value <= 1}
        aria-label={`Una pregunta menos (${label})`}
        className={button}
      >
        <Minus size={14} strokeWidth={2.5} />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={EXAM_LIMITS.perBlockMax}
        value={Number.isFinite(value) ? value : ""}
        onChange={(event) => onChange(Math.floor(Number(event.target.value)))}
        onBlur={() => set(value)}
        aria-label={label}
        title="Preguntas"
        className="w-full min-w-0 appearance-none bg-transparent text-center text-sm font-bold tabular-nums text-white outline-none [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => set(value + 1)}
        disabled={value >= EXAM_LIMITS.perBlockMax}
        aria-label={`Una pregunta más (${label})`}
        className={button}
      >
        <Plus size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
};

export default function ExamBuilder({ defaultTitle }: { defaultTitle: string }) {
  const [title, setTitle] = useState(defaultTitle);
  const [blocks, setBlocks] = useState<Block[]>([newBlock(1)]);
  const [nextId, setNextId] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const [published, setPublished] = useState<{ id: string; code: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const total = blocks.reduce((sum, block) => sum + (Number.isFinite(block.count) ? block.count : 0), 0);

  const update = (id: number, patch: Partial<Block>) =>
    setBlocks((list) => list.map((block) => (block.id === id ? { ...block, ...patch } : block)));

  const publish = () => {
    setError(null);
    startTransition(async () => {
      const result = await publishExam(
        title,
        blocks.map(({ mode, level, count, seconds }) => ({ mode, level, count, seconds })),
      );
      if (result.ok) setPublished({ id: result.id, code: result.code });
      else setError(result.error);
    });
  };

  if (published) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
          <p className="text-xs text-white/55">Publicado</p>
          <p className="mt-1 text-xl font-black text-white">{title.trim()}</p>
          <p className="mt-1 text-xs text-white/55">
            {total} {total === 1 ? "pregunta" : "preguntas"}. Pásale el enlace a quien tenga que hacerlo.
          </p>
        </div>
        <ShareCode code={published.code} title={title.trim()} />
        <div className="flex flex-wrap gap-3 text-sm font-bold">
          <Link href={`/examenes/${published.id}`} className="text-amber-300 hover:text-amber-200">
            Ver resultados →
          </Link>
          <Link href="/examenes" className="text-white/60 hover:text-white">
            Mis exámenes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-xs font-bold text-white/60">Título</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={EXAM_LIMITS.titleMax}
          // Mientras sea el de por defecto, se ve tenue y al entrar se selecciona
          // entero: se nota que es una sugerencia y se cambia escribiendo encima.
          onFocus={(event) => {
            if (title === defaultTitle) event.currentTarget.select();
          }}
          className={`w-full rounded-2xl border border-white/10 bg-slate-900/90 px-3.5 py-3 text-base outline-none transition-colors focus:border-amber-300/60 ${
            title === defaultTitle ? "text-white/45" : "text-white"
          }`}
        />
      </label>

      <div className="space-y-2.5">
        <p className="text-xs font-bold text-white/60">Bloques</p>
        {blocks.map((block, index) => {
          const mode = findExamMode(block.mode);
          return (
            <div
              key={block.id}
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/70 p-3 sm:grid-cols-[minmax(0,1.25fr)_minmax(0,1.25fr)_6.5rem_5.5rem_auto]"
            >
              <Dropdown
                ariaLabel={`Modo del bloque ${index + 1}`}
                value={block.mode}
                groups={MODE_GROUPS}
                onChange={(value) => update(block.id, { mode: value, level: firstLevel(value) })}
                className="col-span-3 sm:col-span-1"
              />

              {mode && mode.levels.length > 0 ? (
                <Dropdown
                  ariaLabel={`Nivel del bloque ${index + 1}`}
                  value={block.level ?? ""}
                  options={mode.levels.map((level) => ({ value: level.slug, label: level.title }))}
                  onChange={(value) => update(block.id, { level: value })}
                  className="col-span-3 sm:col-span-1"
                />
              ) : (
                <span className="col-span-3 px-1 text-xs text-white/40 sm:col-span-1">Sin niveles</span>
              )}

              <CountStepper
                value={block.count}
                onChange={(count) => update(block.id, { count })}
                label={`Preguntas del bloque ${index + 1}`}
              />

              <Dropdown
                ariaLabel={`Tiempo por pregunta del bloque ${index + 1}`}
                value={String(block.seconds)}
                options={SECONDS_OPTIONS}
                onChange={(value) => update(block.id, { seconds: Number(value) })}
              />

              <button
                type="button"
                onClick={() => setBlocks((list) => list.filter((item) => item.id !== block.id))}
                disabled={blocks.length === 1}
                aria-label={`Quitar el bloque ${index + 1}`}
                className="grid h-10 w-10 place-items-center justify-self-end rounded-2xl border border-white/10 text-white/50 transition hover:border-rose-300/40 hover:text-rose-300 disabled:opacity-30"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => {
            setBlocks((list) => [...list, newBlock(nextId)]);
            setNextId(nextId + 1);
          }}
          disabled={blocks.length >= EXAM_LIMITS.blocksMax}
          className="inline-flex items-center gap-1.5 rounded-2xl border border-dashed border-white/20 px-3.5 py-2 text-xs font-bold text-white/70 transition hover:border-amber-300/50 hover:text-white disabled:opacity-40"
        >
          <Plus size={14} />
          Añadir bloque
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
        <p className={`text-sm ${total > EXAM_LIMITS.totalMax ? "text-rose-300" : "text-white/60"}`}>
          {total} {total === 1 ? "pregunta" : "preguntas"} en total
          {total > EXAM_LIMITS.totalMax && ` · como mucho ${EXAM_LIMITS.totalMax}`}
        </p>
        <button
          type="button"
          onClick={publish}
          disabled={pending || !title.trim() || total < 1}
          className="rounded-2xl bg-amber-400 px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-slate-950 transition hover:bg-amber-300 disabled:opacity-50"
        >
          {pending ? "Publicando…" : "Publicar"}
        </button>
      </div>
      <p className="text-[11px] leading-5 text-white/45">
        Cada bloque es un modo de juego, un nivel, cuántas preguntas y cuánto tiempo para cada una. Todos
        reciben las mismas preguntas y en el mismo orden. Al publicar, el examen ya no se puede cambiar.
      </p>
      {error && <p className="text-sm text-rose-300">{error}</p>}
    </div>
  );
}
