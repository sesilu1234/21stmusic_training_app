"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Volume2 } from "lucide-react";
import ThemeToggle from "@/app/components/ThemeToggle";
import Backdrop from "@/app/components/Backdrop";
import GameOverModal from "@/app/components/GameOverModal";
import RoundFooter from "@/app/components/RoundFooter";
import { useAudio } from "@/app/play/oido/audio";
import {
  acordeQuiz,
  escalaQuiz,
  FILAS_NOTAS,
  intervaloQuiz,
  mismaNota,
  nombreNota,
  type DeletreoNivel,
  type Nota,
  type Pregunta,
} from "@/lib/noteSpelling";
import { ROUND_LENGTH } from "@/lib/roundLength";

interface Ronda {
  preguntas: Pregunta[];
  /** Lo pulsado en cada pregunta, en orden. */
  respuestas: (Nota[] | null)[];
}

/**
 * ¿Está bien?
 *
 * Nota a nota y EN ORDEN, también en los acordes. En el piano un acorde vale
 * pulsado en cualquier orden porque suena a la vez, pero deletrearlo es otra
 * cosa: un acorde se dice de abajo arriba —Do, Mi, Sol— y decirlo del revés es
 * no saberlo decir.
 *
 * Y se comparan letras, no semitonos: Fa# y Solb suenan igual y aquí no son la
 * misma respuesta. Es el ejercicio entero.
 */
const acierta = (dadas: Nota[], esperadas: Nota[]) =>
  dadas.length === esperadas.length &&
  dadas.every((nota, index) => mismaNota(nota, esperadas[index]));

/**
 * Las preguntas de una partida.
 *
 * Los intervalos no llevan nivel: son un solo ejercicio (ver `intervaloQuiz`).
 */
const crearPreguntas = (tipo: TipoDeletreo, nivel?: DeletreoNivel) => {
  if (tipo === "intervalo") return intervaloQuiz(ROUND_LENGTH);
  const quiz = tipo === "escala" ? escalaQuiz : acordeQuiz;
  return quiz(nivel!, ROUND_LENGTH);
};

export type TipoDeletreo = "escala" | "acorde" | "intervalo";

export default function NotasGame({
  tipo,
  nivel,
  backHref,
  subtitulo,
}: {
  tipo: TipoDeletreo;
  /** El nivel, en escalas y acordes. Los intervalos no tienen. */
  nivel?: DeletreoNivel;
  backHref: string;
  /** La línea pequeña de debajo del titular: "Nivel 2 · Todas las mayores". */
  subtitulo: string;
}) {
  const { playSequence } = useAudio();

  const [ronda, setRonda] = useState<Ronda | null>(null);
  const [step, setStep] = useState(0);
  /** Lo pulsado en la pregunta de ahora, todavía sin corregir. */
  const [borrador, setBorrador] = useState<Nota[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [revisando, setRevisando] = useState(false);

  const avanceRef = useRef<number | null>(null);

  useEffect(() => {
    // Las preguntas salen de Math.random(): sortearlas durante el render del
    // servidor daría unas distintas al hidratar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRonda({
      preguntas: crearPreguntas(tipo, nivel),
      respuestas: Array<Nota[] | null>(ROUND_LENGTH).fill(null),
    });
    setStep(0);
    setBorrador([]);
    setGameOver(false);
    setRevisando(false);
  }, [tipo, nivel]);

  useEffect(
    () => () => {
      if (avanceRef.current) window.clearTimeout(avanceRef.current);
    },
    [],
  );

  const total = ronda?.preguntas.length ?? 0;
  const pregunta = ronda?.preguntas[step];
  const contestada = ronda?.respuestas[step] ?? null;
  const aciertos =
    ronda?.respuestas.reduce<number>(
      (suma, respuesta, index) =>
        respuesta && acierta(respuesta, ronda.preguntas[index].notas)
          ? suma + 1
          : suma,
      0,
    ) ?? 0;

  /**
   * Cómo suena la respuesta: el acorde de golpe y lo demás una nota detrás de
   * otra. En los intervalos suena primero la nota de la pregunta, que es la
   * referencia, y por eso `sonido` la lleva delante.
   */
  const oir = useCallback(
    (item: Pregunta) => {
      if (item.juntas) {
        playSequence([item.sonido], 0, 0);
      } else {
        playSequence(
          item.sonido.map((altura) => [altura]),
          item.notas.length === 1 ? 440 : 260,
          0,
        );
      }
    },
    [playSequence],
  );

  /**
   * Pulsar una nota.
   *
   * Aquí no suena nada al pulsar, al revés que en los modos de piano. Las
   * notas de la botonera no tienen octava: sonarían todas dentro de la misma,
   * así que una escala que sube se oiría bajando en cuanto pasara de Si. Se
   * oye entera al terminar, que es cuando ya se sabe a qué altura va cada una.
   */
  const pulsar = (nota: Nota) => {
    if (!ronda || !pregunta || contestada !== null || gameOver) return;

    const esperadas = pregunta.notas;
    const siguiente = [...borrador, nota];

    if (siguiente.length < esperadas.length) {
      setBorrador(siguiente);
      return;
    }

    const respuestas = [...ronda.respuestas];
    respuestas[step] = siguiente;
    setRonda({ ...ronda, respuestas });
    setBorrador(siguiente);

    const bien = acierta(siguiente, esperadas);
    if (bien) window.setTimeout(() => oir(pregunta), 200);

    avanceRef.current = window.setTimeout(
      () => {
        if (step < total - 1) {
          setStep(step + 1);
          setBorrador([]);
        } else {
          setGameOver(true);
        }
      },
      bien ? 1900 : 2600,
    );
  };

  /** Quita la última, mientras la respuesta no esté cerrada. */
  const borrar = () => {
    if (contestada !== null || !borrador.length) return;
    setBorrador(borrador.slice(0, -1));
  };

  /** En qué pregunta va la partida. -1 = ya están todas contestadas. */
  const liveStep = ronda?.respuestas.findIndex((item) => item === null) ?? 0;

  const irA = (index: number) => {
    const ultima = liveStep === -1 ? total - 1 : liveStep;
    if (index < 0 || index > ultima || index === step) return;

    if (avanceRef.current) window.clearTimeout(avanceRef.current);
    setRevisando(index !== ultima);
    setStep(index);
    setBorrador([]);

    if (liveStep === -1 && index === total - 1) setGameOver(true);
  };

  if (!ronda || !pregunta) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  const esperadas = pregunta.notas;
  const bien = contestada !== null && acierta(contestada, esperadas);
  const puestas = contestada ?? borrador;
  const faltan = esperadas.length - puestas.length;

  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans text-white">
      <Backdrop />

      {gameOver && <GameOverModal correct={aciertos} total={total} />}

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1100px] flex-col px-4 pb-5 pt-4 md:px-8 md:pb-7 md:pt-5">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 md:gap-4">
          <Link
            href={backHref}
            className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-slate-950/50 px-2.5 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/60 backdrop-blur-sm transition hover:border-amber-300/50 hover:text-white md:px-4"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Volver</span>
          </Link>

          <div className="min-w-0 text-center">
            <h1
              className="text-balance text-xl font-black italic uppercase leading-tight tracking-tighter text-white sm:text-2xl md:text-3xl"
              style={{ fontFamily: "Chaney, sans-serif" }}
            >
              {pregunta.pide}{" "}
              {/* normal-case: el titular va en mayúsculas y el cifrado
                  distingue mayúsculas de minúsculas — "m7b5" en mayúsculas se
                  lee "M7B5", que es otro acorde. Ver lib/chordNames.ts. */}
              <span className="normal-case text-amber-300">{pregunta.objeto}</span>
            </h1>
            <p className="mt-1 truncate text-[9px] font-black uppercase tracking-[0.28em] text-white/35">
              {subtitulo}
            </p>
          </div>

          {/* Hueco al otro lado para que el titular quede centrado de verdad. */}
          <div className="flex w-10 md:w-20 flex-shrink-0 justify-end">
            <ThemeToggle onPhoto />
          </div>
        </div>

        <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col justify-center pb-8 pt-6 md:pb-10 md:pt-8">
          {/* Una casilla por nota que hay que decir. */}
          <div className="mb-7 flex flex-wrap items-center justify-center gap-2">
            {esperadas.map((esperada, index) => {
              const dada = puestas[index];
              const malEsta =
                contestada !== null && (!dada || !mismaNota(dada, esperada));

              return (
                <span
                  key={index}
                  className={`grid h-12 min-w-[3.5rem] place-items-center rounded-xl border px-2 text-sm font-black transition ${
                    !dada
                      ? "border-dashed border-white/15 bg-white/[0.03] text-white/20"
                      : contestada === null
                        ? "border-amber-300/50 bg-amber-400/15 text-amber-100"
                        : malEsta
                          ? "border-rose-400/50 bg-rose-400/15 text-rose-100"
                          : "border-emerald-400/50 bg-emerald-400/15 text-emerald-100"
                  }`}
                >
                  {dada ? nombreNota(dada) : index + 1}
                </span>
              );
            })}
          </div>

          {/* La botonera: columna = letra, fila = alteración. Siempre igual. */}
          <div className="mx-auto flex w-full max-w-[640px] flex-col gap-1.5">
            {FILAS_NOTAS.map((fila) => (
              <div key={fila.alter} className="grid grid-cols-7 gap-1.5">
                {fila.notas.map((nota) => (
                  <button
                    key={nombreNota(nota)}
                    type="button"
                    onClick={() => pulsar(nota)}
                    disabled={contestada !== null || gameOver}
                    className={`h-12 rounded-xl border text-[11px] font-black tracking-tight transition sm:text-sm md:h-14 ${
                      fila.alter === 0
                        ? "border-white/15 bg-white/[0.07] text-white"
                        : "border-white/10 bg-white/[0.03] text-white/65"
                    } enabled:hover:border-amber-300/60 enabled:hover:bg-amber-400/15 enabled:hover:text-white enabled:active:scale-95 disabled:opacity-30`}
                  >
                    {nombreNota(nota)}
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-6 flex min-h-[2.5rem] flex-col items-center justify-center gap-2">
            {contestada === null ? (
              <div className="flex flex-wrap items-center justify-center gap-3">
                <p className="text-center text-[11px] uppercase tracking-[0.2em] text-white/25">
                  {esperadas.length === 1
                    ? "Pulsa la nota"
                    : `Nota a nota y en orden · faltan ${faltan}`}
                </p>
                <button
                  type="button"
                  onClick={borrar}
                  disabled={!borrador.length}
                  className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-white/35 transition hover:text-white/70 disabled:cursor-default disabled:opacity-25 disabled:hover:text-white/35"
                >
                  <RotateCcw size={12} />
                  Borrar
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <p
                    className={`text-center text-xs font-black uppercase tracking-[0.2em] ${
                      bien ? "text-emerald-300" : "text-rose-300"
                    }`}
                  >
                    {bien ? "¡Bien!" : "Era esto"}
                  </p>
                  <button
                    type="button"
                    onClick={() => oir(pregunta)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/50 transition hover:border-amber-300/50 hover:text-white"
                  >
                    <Volume2 size={12} />
                    Oír
                  </button>
                </div>

                {/* La respuesta buena, escrita. Al fallar es lo único que se
                    quiere ver, y en las casillas está lo que se ha puesto. */}
                {!bien && (
                  <p className="text-center text-sm font-black tracking-tight text-emerald-200/90">
                    {esperadas.map(nombreNota).join("  ·  ")}
                  </p>
                )}
              </>
            )}
          </div>
        </main>

        <RoundFooter
          step={step}
          total={total}
          liveStep={liveStep}
          results={ronda.preguntas.map((item, index) => {
            const dada = ronda.respuestas[index];
            return dada === null ? null : acierta(dada, item.notas);
          })}
          correctCount={aciertos}
          reviewing={revisando}
          onGoTo={irA}
          accent="amber"
        />
      </div>
    </div>
  );
}
