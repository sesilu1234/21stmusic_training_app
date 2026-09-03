"use client";

import { useState, useMemo } from "react";
import GameChrome from "@/app/components/GameChrome";
import { CheckCircle2, XCircle } from "lucide-react";
import GameOverModal from "@/app/components/GameOverModal";
import { useAbandono } from "@/app/components/useAbandono";
import Backdrop from "@/app/components/Backdrop";
import type { TriviaQuestion } from "@/lib/trivia";

/**
 * La pantalla del trivial.
 *
 * Las preguntas llegan ya elegidas y barajadas desde el servidor (ver
 * `lib/triviaQuestions.ts`). Antes se importaba el archivo entero de preguntas
 * aquí dentro y se barajaba en el navegador, lo que obligaba a un `isMounted`
 * para no romper la hidratación —el servidor pintaba una pregunta y el cliente
 * otra— y hacía que el alumno se descargase todas las preguntas del juego, con
 * sus respuestas, para usar veinticuatro.
 */
export default function TriviaGame({
  questions,
  titulo,
}: {
  questions: TriviaQuestion[];
  /** El tema, tal y como se escribe en la cabecera: "Guitarra", "Orquesta"… */
  titulo: string;
}) {
  // Las preguntas no cambian mientras dure la partida: vienen del servidor y
  // son las mismas del primer render al último. Por eso el estado se inicializa
  // de una vez y no hay ningún efecto que las cargue.
  const quizList = questions;
  const [step, setStep] = useState(0);
  const [results, setResults] = useState<(null | "correct" | "wrong")[]>(() =>
    Array(questions.length).fill(null),
  );
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>(() =>
    Array(questions.length).fill(null),
  );
  const [gameOver, setGameOver] = useState(false);

  // Si se va a media partida, queda apuntada como abandonada. Lo que ve el
  // alumno no cambia: esto no pinta nada.
  useAbandono(results, gameOver);
  const [isReviewing, setIsReviewing] = useState(false);
  const [showFeedback, setShowFeedback] = useState<null | "correct" | "wrong">(
    null,
  );

  const progresoMaximo = useMemo(() => {
    const firstEmpty = userAnswers.indexOf(null);
    return firstEmpty === -1 ? quizList.length : firstEmpty;
  }, [userAnswers, quizList]);
  const correctCount = useMemo(
    () => results.filter((r) => r === "correct").length,
    [results],
  );
  const totalQuestions = quizList.length || 24;


  const currentQuestion = quizList[step];

  const handleAnswer = (opcionSeleccionada: string) => {
    if (userAnswers[step] !== null || gameOver || !!showFeedback) return;
    setIsReviewing(false);

    const isCorrect = opcionSeleccionada === currentQuestion.respuesta;
    setShowFeedback(isCorrect ? "correct" : "wrong");

    const newResults = [...results];
    newResults[step] = isCorrect ? "correct" : "wrong";
    setResults(newResults);

    const newAnswers = [...userAnswers];
    newAnswers[step] = opcionSeleccionada;
    setUserAnswers(newAnswers);

    // 700ms acierte o falle. Los 250 de antes eran un parpadeo: no daba tiempo
    // ni a ver el botón corregido ni a leer la tarjeta con la respuesta buena,
    // que en trivia es donde está lo que se aprende.
    setTimeout(() => {
      setShowFeedback(null);
      if (step < quizList.length - 1) {
        setStep(step + 1);
      } else {
        setGameOver(true);
      }
    }, 700);
  };

  const goBack = () => {
    setIsReviewing(true);
    setShowFeedback(null);
    setStep((prev) => Math.max(0, prev - 1));
  };

  const goNext = () => {
    const nextStep = step + 1;
    if (nextStep <= progresoMaximo && nextStep < quizList.length) {
      setStep(nextStep);
      setShowFeedback(null);
      setIsReviewing(nextStep < progresoMaximo);
    }
  };

  /** Lo contestado en esta pregunta, o null si todavía está en juego. */
  const answeredHere = userAnswers[step];

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden text-white">
      <Backdrop />

      <div className="relative z-10 min-h-screen flex flex-col">
      <GameChrome>
        ¿Cuánto sabes de{" "}
        <span className="text-black mx-1 drop-shadow-[0_1.2px_1.2px_rgba(255,255,255,0.8)]">
          {titulo.toUpperCase()}
        </span>
        ?
      </GameChrome>

      <div className="flex-1 flex flex-col items-center justify-start px-4 pt-4 pb-8 md:px-6 md:pb-6 md:pt-6 z-10">
        {/* CARTA DE PREGUNTA */}
        <div className="relative flex flex-col items-center w-full max-w-2xl mb-10">
          <div
            className={`bg-white px-6 py-8 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl w-full min-h-[10rem] md:min-h-[12rem] flex flex-col items-center justify-center border-4 relative overflow-hidden transition-all duration-150 ${
              showFeedback === "correct"
                ? "border-green-500 scale-[1.01]"
                : showFeedback === "wrong"
                  ? "border-red-500"
                  : "border-white"
            }`}
          >
            <div className="absolute top-4 right-6 text-black/5 font-black italic text-lg">
              #{step + 1}
            </div>

            {showFeedback && (
              <div className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-[1px]">
                {showFeedback === "correct" ? (
                  <CheckCircle2 className="text-green-500 w-16 h-16 md:w-24 md:h-24 animate-in zoom-in duration-150 fill-green-500/10" />
                ) : (
                  <XCircle className="text-red-500 w-16 h-16 md:w-20 md:h-20 animate-in zoom-in duration-150 fill-red-500/10" />
                )}
              </div>
            )}

            <p
              className={`text-black text-base md:text-xl font-bold text-center leading-snug transition-opacity duration-100 ${showFeedback ? "opacity-10" : "opacity-100"}`}
            >
              {currentQuestion.pregunta}
            </p>
          </div>

          {/* SOLUCIÓN */}
          <div
            className={`absolute -bottom-10 left-0 right-0 z-30 transition-all duration-200 transform ${
              isReviewing && userAnswers[step] !== null
                ? "translate-y-0 opacity-100 scale-100"
                : "translate-y-4 opacity-0 pointer-events-none"
            }`}
          >
            <div className="mx-auto w-64 h-14 rounded-2xl border-2 border-amber-400/50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center shadow-2xl">
              <span className="text-[8px] text-amber-400 uppercase font-black tracking-widest">
                Respuesta Correcta
              </span>
              <span className="text-sm font-semibold text-white font-sans">
                {currentQuestion.respuesta}
              </span>
            </div>
          </div>
        </div>

        {/* BOTONES DE RESPUESTA */}
        {/* La rejilla entera se iba a `opacity-40` al contestar, así que la
            corrección no se veía: se apagaba justo el sitio donde había que
            mirar. Ahora se queda encendida y sin clicks, y son los botones los
            que dicen lo que ha pasado — verde el bueno, rojo el pulsado si
            estaba mal, apagados los demás. */}
        <div
          className={`bg-black/40 p-4 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-white/10 w-full max-w-4xl backdrop-blur-md transition-opacity duration-150 ${
            answeredHere !== null ? "pointer-events-none" : ""
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {currentQuestion.opciones.map((opcion) => {
              const isSolution = opcion === currentQuestion.respuesta;
              const isMistake = opcion === answeredHere && !isSolution;

              return (
                <button
                  key={opcion}
                  disabled={answeredHere !== null || !!showFeedback}
                  onClick={() => handleAnswer(opcion)}
                  className={`py-4 md:py-5 px-4 md:px-6 rounded-xl border transition-all active:scale-90 text-left ${
                    answeredHere === null
                      ? "border-white/10 bg-white/5 text-white hover:bg-amber-500 hover:text-black"
                      : isSolution
                        ? "border-green-400 bg-green-500/80 text-white"
                        : isMistake
                          ? "border-red-400 bg-red-500/80 text-white"
                          : "border-white/5 bg-white/5 text-white/20"
                  }`}
                >
                  <span className="text-sm font-semibold font-sans">
                    {opcion}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* PROGRESO Y CONTROLES */}
        <div className="w-full max-w-4xl mt-10 md:mt-16 flex items-center justify-center gap-3 md:gap-4 px-2">
          <button
            onClick={goBack}
            className={`shrink-0 px-4 md:px-6 py-2.5 md:py-3 bg-white/5 border border-white/10 text-white text-[9px] md:text-[10px] font-bold rounded-full uppercase transition-all ${
              step === 0 ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          >
            ← Anterior
          </button>

          <div className="flex flex-wrap justify-center gap-1 md:gap-1.5 p-2 md:p-3 bg-black/20 rounded-2xl border border-white/5 shadow-inner max-w-[220px] md:max-w-none">
            {results.map((res, i) => (
              <div
                key={i}
                onClick={() => {
                  if (userAnswers[i] !== null) {
                    setIsReviewing(true);
                    setStep(i);
                  }
                }}
                className={`w-5 h-5 md:w-6 md:h-6 rounded-md border flex items-center justify-center text-[7px] md:text-[8px] font-black cursor-pointer transition-all ${
                  res === "correct"
                    ? "bg-green-500 text-white border-green-400"
                    : res === "wrong"
                      ? "bg-red-500 text-white border-red-400"
                      : i === step
                        ? "border-amber-400 bg-white/20 text-white scale-110 shadow-[0_0_10px_rgba(251,191,36,0.3)]"
                        : "border-white/5 text-white/10"
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>

          <button
            onClick={goNext}
            className={`shrink-0 px-5 md:px-8 py-2.5 md:py-3 bg-amber-500 text-black text-[9px] md:text-[10px] font-black rounded-full uppercase transition-all shadow-xl shadow-amber-500/20 ${
              isReviewing || (userAnswers[step] !== null && !showFeedback)
                ? "opacity-100"
                : "opacity-0 pointer-events-none"
            }`}
          >
            Siguiente →
          </button>
        </div>

        <footer className="py-10 md:py-12 text-center text-slate-600 text-[8px] tracking-[0.8em] uppercase">
          © 2026 21st Century Music
        </footer>
      </div>

      {/* MODAL GAME OVER */}
      {gameOver && (
        <GameOverModal correct={correctCount} total={totalQuestions} />
      )}
      </div>
    </div>
  );
}
