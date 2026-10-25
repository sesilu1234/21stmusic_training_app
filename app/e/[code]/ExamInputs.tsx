"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Delete } from "lucide-react";
import PianoKeyboard, { noteName, type KeyMark } from "@/app/components/PianoKeyboard";
import SimpleMovingScore, { type MusicRef } from "@/app/play/ritmo/MusicDisplay";
import { playNow } from "@/app/components/notePlayer";
import { RHYTHM_LEVELS } from "@/lib/rhythm";
import type { ExamInput } from "@/lib/exams/types";

type Submit = (given: string | string[] | number[] | null) => void;

/** Elegir una: se toca y ya está contestada. Sin corrección hasta el final. */
const ChoiceInput = ({ options, onSubmit, disabled }: { options: string[]; onSubmit: Submit; disabled: boolean }) => {
  const [chosen, setChosen] = useState<string | null>(null);
  return (
    <div className="mx-auto grid w-full max-w-xl grid-cols-1 gap-2.5 sm:grid-cols-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          disabled={disabled || chosen !== null}
          onClick={() => {
            setChosen(option);
            onSubmit(option);
          }}
          className={`min-h-[3.25rem] rounded-2xl border px-4 py-3 text-base font-black tracking-tight transition active:scale-[0.98] ${
            chosen === option
              ? "border-amber-300 bg-amber-400/25 text-amber-50"
              : "border-white/10 bg-white/5 text-white hover:border-amber-300/50 hover:bg-amber-400/15 disabled:opacity-50"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
};

/** Las casillas de lo que se lleva dicho. */
const Slots = ({ values, length, onUndo, disabled }: { values: string[]; length: number; onUndo: () => void; disabled: boolean }) => (
  <div className="flex flex-wrap items-center justify-center gap-2">
    {Array.from({ length }, (_, index) => (
      <span
        key={index}
        className={`grid h-11 min-w-11 place-items-center rounded-xl border px-2 text-sm font-black ${
          values[index]
            ? "border-amber-300/60 bg-amber-400/20 text-white"
            : "border-dashed border-white/15 text-white/25"
        }`}
      >
        {values[index] ?? index + 1}
      </span>
    ))}
    <button
      type="button"
      onClick={onUndo}
      disabled={disabled || !values.length}
      aria-label="Borrar la última"
      className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 text-white/60 transition hover:text-white disabled:opacity-30"
    >
      <Delete size={18} />
    </button>
  </div>
);

/** Decir varias de una botonera fija. Al completar, se entrega sola. */
const SequenceInput = ({
  input,
  onSubmit,
  disabled,
}: {
  input: Extract<ExamInput, { type: "sequence" }>;
  onSubmit: Submit;
  disabled: boolean;
}) => {
  const [values, setValues] = useState<string[]>([]);
  const sent = values.length >= input.length;

  const press = (value: string) => {
    if (disabled || sent) return;
    // Sin orden (un acorde escrito), una nota no se dice dos veces.
    if (!input.ordered && values.includes(value)) return;
    const next = [...values, value];
    setValues(next);
    if (next.length >= input.length) onSubmit(next);
  };

  const columns = Math.max(...input.pad.map((row) => row.length));

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Slots values={values} length={input.length} onUndo={() => setValues(values.slice(0, -1))} disabled={disabled || sent} />
      <div className="space-y-2 rounded-[1.75rem] border border-white/10 bg-slate-950/50 p-3 md:p-4">
        {input.pad.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="grid gap-1.5 md:gap-2"
            style={{ gridTemplateColumns: `repeat(${Math.min(columns, 9)}, minmax(0, 1fr))` }}
          >
            {row.map((value) => (
              <button
                key={value}
                type="button"
                disabled={disabled || sent || (!input.ordered && values.includes(value))}
                onClick={() => press(value)}
                className="rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-black text-white transition hover:border-amber-300/50 hover:bg-amber-400/20 active:scale-95 disabled:opacity-35"
              >
                {value}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/** Pulsar teclas. Con orden, tecla a tecla; sin orden (un acorde), se encienden y se apagan. */
const PianoInput = ({
  input,
  onSubmit,
  disabled,
}: {
  input: Extract<ExamInput, { type: "piano" }>;
  onSubmit: Submit;
  disabled: boolean;
}) => {
  const [keys, setKeys] = useState<number[]>([]);
  const sent = keys.length >= input.count;

  const press = (semitone: number) => {
    if (disabled || sent) return;
    playNow(semitone);
    let next: number[];
    if (!input.ordered) {
      next = keys.includes(semitone) ? keys.filter((key) => key !== semitone) : [...keys, semitone];
    } else {
      next = [...keys, semitone];
    }
    setKeys(next);
    if (next.length >= input.count) onSubmit(next);
  };

  const marks: Record<number, KeyMark> = { ...(input.marks as Record<number, KeyMark> | undefined) };
  keys.forEach((key) => {
    marks[key] = "hint";
  });

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      {input.count > 1 && (
        <Slots
          values={keys.map(noteName)}
          length={input.count}
          onUndo={() => setKeys(keys.slice(0, -1))}
          disabled={disabled || sent}
        />
      )}
      <PianoKeyboard
        from={input.from}
        octaves={input.octaves}
        marks={marks}
        badges={input.badges}
        markLabels={false}
        onPress={press}
        disabled={disabled || sent}
      />
    </div>
  );
};

/**
 * Dar los golpes de un ritmo. El primer toque arranca la partitura (con su
 * compás de entrada); al acabar, las pulsaciones se mandan al servidor, que es
 * quien corrige. Aquí no se dice si ha ido bien.
 */
const TapsInput = ({
  input,
  onSubmit,
  disabled,
}: {
  input: Extract<ExamInput, { type: "taps" }>;
  onSubmit: Submit;
  disabled: boolean;
}) => {
  const musicRef = useRef<MusicRef>(null);
  const bpmRef = useRef(input.bpm);
  const measuresRef = useRef(2);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const startedRef = useRef(false);
  const submitRef = useRef(onSubmit);
  useEffect(() => {
    submitRef.current = onSubmit;
  }, [onSubmit]);

  const tap = useCallback(() => {
    if (disabled || finished) return;
    musicRef.current?.handleStart(startedRef.current);
    if (!startedRef.current) {
      startedRef.current = true;
      setStarted(true);
    }
  }, [disabled, finished]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      event.preventDefault();
      tap();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tap]);

  const onTaps = useCallback((times: number[]) => {
    setFinished(true);
    submitRef.current(times);
  }, []);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <div data-score-frame className="mx-auto w-full max-w-[95%] overflow-hidden rounded-[2rem] border-4 border-white bg-white py-3 shadow-2xl">
        <SimpleMovingScore
          ref={musicRef}
          level={RHYTHM_LEVELS[0]}
          BPM={bpmRef}
          measures={measuresRef}
          fixedScore={input.score}
          onTaps={onTaps}
          controls={false}
        />
      </div>
      <button
        type="button"
        onPointerDown={(event) => {
          event.preventDefault();
          tap();
        }}
        disabled={disabled || finished}
        className="mx-auto flex h-24 w-full max-w-md select-none items-center justify-center rounded-[2rem] border border-amber-300/40 bg-amber-400/15 text-sm font-black uppercase tracking-[0.2em] text-amber-100 transition active:scale-[0.98] active:bg-amber-400/30 disabled:opacity-40"
        style={{ touchAction: "manipulation" }}
      >
        {finished ? "Hecho" : started ? "Toca aquí (o espacio)" : `Empezar · ${input.bpm} bpm`}
      </button>
      <p className="text-center text-[11px] text-white/45">
        Primero suena un compás de entrada. Toca cada nota en su sitio y sin golpes de más.
      </p>
    </div>
  );
};

export default function ExamInputView({
  input,
  onSubmit,
  disabled,
}: {
  input: ExamInput;
  onSubmit: Submit;
  disabled: boolean;
}) {
  if (input.type === "choice") return <ChoiceInput options={input.options} onSubmit={onSubmit} disabled={disabled} />;
  if (input.type === "sequence") return <SequenceInput input={input} onSubmit={onSubmit} disabled={disabled} />;
  if (input.type === "piano") return <PianoInput input={input} onSubmit={onSubmit} disabled={disabled} />;
  return <TapsInput input={input} onSubmit={onSubmit} disabled={disabled} />;
}
