"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Backdrop from "@/app/components/Backdrop";
import SiteFooter from "@/app/components/SiteFooter";
import PianoKeyboard, { type KeyMark } from "@/app/components/PianoKeyboard";
import { findVoice, useFreeSynth } from "@/lib/freeSynth";
import { Field, Legend, Stepper, Transport } from "@/app/play/vocalControls";
import {
  GRADES,
  ROCKSCHOOL_EXERCISES,
  exercisesOfGrade,
  type Grade,
  type RockschoolExercise,
  type RockschoolKind,
} from "@/lib/rockschool";
import {
  ACCOMPANIMENTS,
  buildPlan,
  buildRoots,
  fullNoteName,
  type AccompanimentMode,
} from "@/lib/vocalPlan";

/**
 * Los ejercicios del método Rockschool, para cantarlos.
 *
 * Es la misma máquina que Vocalizaciones — patrón, recorrido y modos de
 * acompañamiento salen de `vocalPlan` — con dos diferencias: los patrones
 * vienen del libro y arriba se enseña el pentagrama original escaneado, que
 * es lo que el alumno tiene delante en clase.
 */

/** El piano toca el patrón; el golpe de tónica suena a cuerdas, más redondo. */
const PATTERN_VOICE = findVoice("piano");
const CUE_VOICE = findVoice("cuerdas");

const MIN_BPM = 40;
const MAX_BPM = 200;

/** Un color por familia, para leer la lista de un vistazo. */
const KIND_STYLE: Record<RockschoolKind, string> = {
  escala: "text-sky-300",
  arpegio: "text-emerald-300",
  intervalo: "text-amber-300",
};

const KIND_LABEL: Record<RockschoolKind, string> = {
  escala: "Escala",
  arpegio: "Arpegio",
  intervalo: "Intervalo",
};

export default function RockschoolPage() {
  const { play, click, releaseAll } = useFreeSynth();

  const [grade, setGrade] = useState<Grade>("Debut");
  const [exercise, setExercise] = useState<RockschoolExercise>(
    ROCKSCHOOL_EXERCISES[0],
  );
  const [transpose, setTranspose] = useState(0);
  const [up, setUp] = useState(0);
  const [down, setDown] = useState(0);
  const [bpm, setBpm] = useState(92);
  const [mode, setMode] = useState<AccompanimentMode>("guia");
  const [metronome, setMetronome] = useState(true);

  const [playing, setPlaying] = useState(false);
  /** Índice del evento que está sonando ahora, o -1 si no ha empezado. */
  const [cursor, setCursor] = useState(-1);

  const roots = useMemo(
    () => buildRoots(exercise.base + transpose, up, down),
    [exercise, transpose, up, down],
  );

  const plan = useMemo(
    () =>
      buildPlan({
        pattern: exercise.pattern,
        roots,
        bpm,
        mode,
        noteBeats: exercise.noteBeats,
      }),
    [exercise, roots, bpm, mode],
  );

  const planRef = useRef(plan);
  planRef.current = plan;

  // Se lee dentro del reloj: así encender o apagar el metrónomo a media
  // vuelta hace efecto sin tener que rehacer el plan ni parar nada.
  const metronomeRef = useRef(metronome);
  metronomeRef.current = metronome;

  const timerRef = useRef<number | null>(null);
  const tickTimerRef = useRef<number | null>(null);
  /** Próximo evento y próximo golpe de metrónomo por disparar. */
  const indexRef = useRef(0);
  const tickRef = useRef(0);
  /** Momento real en el que empezó (o se reanudó) la cuenta. */
  const originRef = useRef(0);

  const clearTimers = () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    if (tickTimerRef.current !== null) window.clearTimeout(tickTimerRef.current);
    timerRef.current = null;
    tickTimerRef.current = null;
  };

  /** Deja el ejercicio parado y al principio. */
  const stop = useCallback(() => {
    clearTimers();
    indexRef.current = 0;
    tickRef.current = 0;
    setCursor(-1);
    setPlaying(false);
  }, []);

  /** Suena un evento: el golpe de tónica lleva también su octava grave. */
  const fire = useCallback(
    (index: number) => {
      const event = planRef.current.events[index];
      setCursor(index);
      if (!event.audible) return;

      if (event.cue) {
        play(event.semitone - 12, CUE_VOICE);
        play(event.semitone, CUE_VOICE);
      } else {
        play(event.semitone, PATTERN_VOICE);
      }
    },
    [play],
  );

  /**
   * El reloj. Cada paso mira cuánto falta de verdad para el evento siguiente,
   * así que un retraso puntual no arrastra a los que vienen detrás.
   */
  const schedule = useCallback(() => {
    const { events, duration } = planRef.current;

    if (indexRef.current >= events.length) {
      // Se deja terminar la última nota antes de dar el ejercicio por acabado.
      const tail = duration - events[events.length - 1].at;
      timerRef.current = window.setTimeout(() => stop(), Math.max(0, tail));
      return;
    }

    const event = events[indexRef.current];
    const wait = event.at - (performance.now() - originRef.current);

    timerRef.current = window.setTimeout(
      () => {
        fire(indexRef.current);
        indexRef.current += 1;
        schedule();
      },
      Math.max(0, wait),
    );
  }, [fire, stop]);

  /** El pulso, en su propia cola. Mismo origen, así que van a la par. */
  const scheduleTicks = useCallback(() => {
    const { ticks } = planRef.current;
    if (tickRef.current >= ticks.length) return;

    const next = ticks[tickRef.current];
    const wait = next.at - (performance.now() - originRef.current);

    tickTimerRef.current = window.setTimeout(
      () => {
        if (metronomeRef.current) click(next.accent);
        tickRef.current += 1;
        scheduleTicks();
      },
      Math.max(0, wait),
    );
  }, [click]);

  const toggle = useCallback(() => {
    if (playing) {
      clearTimers();
      setPlaying(false);
      return;
    }

    const { events, ticks } = planRef.current;
    if (indexRef.current >= events.length) indexRef.current = 0;
    // Se retrocede el origen hasta donde se quedó: reanudar no vuelve a empezar.
    const at = events[indexRef.current].at;
    originRef.current = performance.now() - at;
    // El metrónomo se reengancha donde toque, no donde se quedó: si se pausó a
    // mitad de un pulso, el golpe de ese pulso ya ha pasado.
    tickRef.current = ticks.findIndex((tick) => tick.at >= at);
    if (tickRef.current < 0) tickRef.current = ticks.length;

    setPlaying(true);
    schedule();
    scheduleTicks();
  }, [playing, schedule, scheduleTicks]);

  // Tocar cualquier ajuste cambia el plan entero, así que lo que estuviera
  // sonando ya no valdría: se para y se vuelve al principio.
  useEffect(() => {
    stop();
  }, [exercise, transpose, up, down, bpm, mode, stop]);

  useEffect(
    () => () => {
      clearTimers();
      releaseAll();
    },
    [releaseAll],
  );

  // Barra espaciadora para arrancar y parar, que es lo que se busca a ciegas
  // cuando estás de pie cantando.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "BUTTON"].includes(target.tagName)) return;
      event.preventDefault();
      toggle();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  const pickExercise = (next: RockschoolExercise) => {
    setExercise(next);
    // La transposición era de otro ejercicio: no tiene por qué valer para este.
    setTranspose(0);
  };

  const current = cursor >= 0 ? plan.events[cursor] : null;

  // El teclado se ajusta a lo que va a sonar: se redondea al Do de abajo y se
  // dibujan las octavas justas para que quepa todo el recorrido.
  const from = Math.floor(plan.lowest / 12) * 12;
  const octaves = Math.min(5, Math.max(2, Math.ceil((plan.highest + 1 - from) / 12)));

  const marks = useMemo(() => {
    const result: Record<number, KeyMark> = {};
    if (!current) return result;
    // La tónica de la vuelta se queda encendida en ámbar de fondo: es la
    // referencia contra la que se canta todo lo demás.
    result[current.root] = "root";
    // Un solo color para la nota que va sonando: quién la toca ya lo dice el
    // modo de acompañamiento, y pintarlo aquí solo hacía leer dos veces.
    result[current.semitone] = "hint";
    return result;
  }, [current]);

  const progress = plan.events.length
    ? Math.min(1, (cursor + 1) / plan.events.length)
    : 0;

  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans text-white">
      <Backdrop />

      <div className="relative z-10 flex min-h-screen flex-col px-4 py-3.5 md:px-7 md:py-4">
        <Link
          href="/"
          className="absolute left-4 top-3.5 z-20 inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/50 px-3.5 py-1.5 text-[9px] font-black uppercase tracking-[0.22em] text-white/60 backdrop-blur-sm transition hover:border-slate-300/40 hover:text-white md:left-7 md:top-4"
        >
          <ArrowLeft size={12} />
        
        </Link>

        <main className="mx-auto w-full max-w-[1120px] flex-1 pb-4 pt-5 md:pt-4">
          <div className="mb-4 text-center">
            <p className="mb-1.5 text-[9px] font-black uppercase tracking-[0.32em] text-white/35">
              El método, grado a grado
            </p>
            <h1
              className="text-balance text-xl font-black italic uppercase leading-tight tracking-tighter text-white md:text-3xl"
              style={{ fontFamily: "Chaney, sans-serif" }}
            >
              Rockschool
            </h1>
            <p className="mx-auto mt-1.5 max-w-lg text-[12px] leading-5 text-white/45">
              Los ejercicios del libro, con su pentagrama y sonando. Puedes
              cambiarlos de tono y repetirlos subiendo y bajando, como en clase.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[264px_minmax(0,1fr)]">
            {/* --- El libro ---------------------------------------------- */}
            {/* `self-start`: la columna mide lo que ocupa su lista, no lo que
                ocupe el ejercicio de al lado. */}
            <aside className="self-start rounded-2xl border border-white/10 bg-slate-950/60 p-2.5 backdrop-blur-sm">
              <div className="mb-2 flex flex-wrap gap-1">
                {GRADES.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setGrade(option)}
                    className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] transition ${
                      grade === option
                        ? "bg-white text-slate-950"
                        : "text-white/40 hover:bg-white/10 hover:text-white/80"
                    }`}
                  >
                    {option === "Debut" ? "Debut" : option.replace("Grade ", "")}
                  </button>
                ))}
              </div>

              <ul className="flex flex-col gap-0.5">
                {exercisesOfGrade(grade).map((option) => {
                  const selected = option.slug === exercise.slug;
                  return (
                    <li key={option.slug}>
                      <button
                        type="button"
                        onClick={() => pickExercise(option)}
                        className={`w-full rounded-lg px-2.5 py-2 text-left transition ${
                          selected
                            ? "bg-white/10 text-white ring-1 ring-white/20"
                            : "text-white/55 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span className="block text-[11px] font-black uppercase tracking-[0.1em]">
                          {option.name}
                        </span>
                        <span
                          className={`mt-0.5 block text-[9px] font-black uppercase tracking-[0.14em] ${
                            selected ? KIND_STYLE[option.kind] : "text-white/25"
                          }`}
                        >
                          {KIND_LABEL[option.kind]}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </aside>

            {/* --- Ejercicio --------------------------------------------- */}
            <section className="flex flex-col gap-4">
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 backdrop-blur-sm md:p-5">
                {/* El transporte vive aquí arriba, en la misma línea del
                    título: es lo que más se pulsa y no merece una fila propia. */}
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.24em] text-white/30">
                      {exercise.grade}
                    </p>
                    <h2 className="mt-0.5 text-lg font-black italic tracking-tight md:text-xl">
                      {exercise.name}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span
                      className={`hidden rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] sm:block ${
                        KIND_STYLE[exercise.kind]
                      }`}
                    >
                      {KIND_LABEL[exercise.kind]}
                    </span>
                    <Transport
                      playing={playing}
                      onToggle={toggle}
                      onReset={stop}
                      canReset={cursor >= 0 || playing}
                    />
                  </div>
                </div>

                {/* El escaneo del libro. Es lo que el alumno tiene delante. */}
                <div className="mt-4 overflow-hidden rounded-xl bg-white p-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/assets/rockschool/${exercise.image}`}
                    alt={`${exercise.grade} · ${exercise.name}`}
                    className="mx-auto max-h-40 w-full object-contain"
                  />
                </div>

                {/* Dónde estamos: nota, tónica y vuelta. */}
                <div className="mt-4 flex flex-wrap items-end gap-x-7 gap-y-3">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">
                      Suena
                    </p>
                    <p
                      className={`text-3xl font-black italic leading-tight tracking-tight ${
                        current
                          ? current.audible
                            ? "text-sky-300"
                            : "text-emerald-300"
                          : "text-white/15"
                      }`}
                    >
                      {current ? fullNoteName(current.semitone) : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">
                      Empieza en
                    </p>
                    <p className="text-base font-black leading-tight text-amber-300">
                      {fullNoteName(current ? current.root : roots[0])}
                    </p>
                  </div>
                  {roots.length > 1 && (
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">
                        Vuelta
                      </p>
                      <p className="text-base font-black leading-tight text-white/60">
                        {current ? current.repetition + 1 : "–"}
                        <span className="text-white/25"> / {roots.length}</span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-3 h-0.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-white/50 transition-[width] duration-150 ease-linear"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
              </div>

              {/* --- Piano ------------------------------------------------ */}
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 backdrop-blur-sm md:p-4">
                <PianoKeyboard from={from} octaves={octaves} marks={marks} compact />
                <Legend />
              </div>

              {/* --- Ajustes ---------------------------------------------- */}
              <div className="grid gap-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4 backdrop-blur-sm md:grid-cols-2 md:p-5">
                <Field label="Acompañamiento">
                  <div className="flex flex-col gap-0.5">
                    {ACCOMPANIMENTS.map((option) => {
                      const selected = mode === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setMode(option.id)}
                          className={`rounded-lg px-2.5 py-1.5 text-left transition ${
                            selected
                              ? "bg-white/10 text-white ring-1 ring-white/20"
                              : "text-white/45 hover:bg-white/5 hover:text-white/80"
                          }`}
                        >
                          <span className="block text-[10px] font-black uppercase tracking-[0.12em]">
                            {option.label}
                          </span>
                          <span className="mt-0.5 block text-[10px] leading-4 text-white/30">
                            {option.hint}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setMetronome((value) => !value)}
                    className={`mt-2 inline-flex items-center gap-2 self-start rounded-lg px-2.5 py-1.5 transition ${
                      metronome
                        ? "bg-white/10 text-white ring-1 ring-white/20"
                        : "text-white/45 hover:bg-white/5 hover:text-white/80"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`h-1.5 w-1.5 rounded-full ${
                        metronome ? "bg-emerald-300" : "bg-white/20"
                      }`}
                    />
                    <span className="text-[10px] font-black uppercase tracking-[0.12em]">
                      Metrónomo
                    </span>
                  </button>
                </Field>

                <div className="flex flex-col gap-3">
                  <Field label="Tono">
                    <Stepper
                      value={
                        transpose === 0
                          ? "Original"
                          : `${transpose > 0 ? "+" : ""}${transpose} st`
                      }
                      onDown={() => setTranspose((value) => Math.max(-12, value - 1))}
                      onUp={() => setTranspose((value) => Math.min(12, value + 1))}
                      downLabel="Medio tono abajo"
                      upLabel="Medio tono arriba"
                      icons="arrows"
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Sube">
                      <Stepper
                        value={`${up} st`}
                        onDown={() => setUp((value) => Math.max(0, value - 1))}
                        onUp={() => setUp((value) => Math.min(12, value + 1))}
                        downLabel="Subir menos"
                        upLabel="Subir más"
                      />
                    </Field>
                    <Field label="Baja">
                      <Stepper
                        value={`${down} st`}
                        onDown={() => setDown((value) => Math.max(0, value - 1))}
                        onUp={() => setDown((value) => Math.min(12, value + 1))}
                        downLabel="Bajar menos"
                        upLabel="Bajar más"
                      />
                    </Field>
                  </div>

                  <Field label="Velocidad">
                    <Stepper
                      value={`${bpm} bpm`}
                      onDown={() => setBpm((value) => Math.max(MIN_BPM, value - 4))}
                      onUp={() => setBpm((value) => Math.min(MAX_BPM, value + 4))}
                      downLabel="Más lento"
                      upLabel="Más rápido"
                    />
                  </Field>
                </div>
              </div>

              <p className="text-center text-[10px] leading-relaxed text-white/25">
                El ejercicio suena tal como está escrito. Sube el tono solo hasta
                donde te salga cómodo. Barra espaciadora para arrancar y parar.
              </p>
            </section>
          </div>
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}
