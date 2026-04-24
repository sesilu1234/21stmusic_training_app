"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Home } from "lucide-react";
interface Pregunta {
  pregunta: string;
  opciones: string[];
  respuesta: string;
}
import { preguntasTrivial } from "./preguntasTrivial";

export default function TrivialGuitarra() {
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  const [quizList, setQuizList] = useState<Pregunta[]>([]);
  const [step, setStep] = useState(0);
  const [results, setResults] = useState<(null | "correct" | "wrong")[]>([]);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [showFeedback, setShowFeedback] = useState<null | "correct" | "wrong">(
    null,
  );

  useEffect(() => {
    const shuffled = [...preguntasTrivial]
      .sort(() => Math.random() - 0.5)
      .slice(0, 24);
    setQuizList(shuffled);
    setResults(Array(shuffled.length).fill(null));
    setUserAnswers(Array(shuffled.length).fill(null));
    setIsMounted(true);
  }, []);

  const progresoMaximo = useMemo(() => {
    const firstEmpty = userAnswers.indexOf(null);
    return firstEmpty === -1 ? quizList.length : firstEmpty;
  }, [userAnswers, quizList]);

  if (!isMounted || quizList.length === 0) return null;

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

    setTimeout(() => {
      setShowFeedback(null);
      if (step < quizList.length - 1) {
        setStep(step + 1);
      } else {
        setGameOver(true);
      }
    }, 250);
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

  return (
    <div
      className="relative min-h-screen flex flex-col bg-slate-900 bg-cover bg-center overflow-x-hidden"
      style={{ backgroundImage: "url('/assets/background.jpeg')" }}
    >
      {/* NAVBAR */}
      <div className="relative z-20 w-full px-4 pt-5 md:px-12 flex justify-between items-center">
        <button
          onClick={() => router.push("/play")}
          className="text-white/50 hover:text-white bg-black/40 p-2.5 rounded-full border border-white/10 transition-all hover:bg-black/60"
        >
          <Home size={16} />
        </button>
        <img
          src="/assets/logo21stCM_no_white_1.png"
          className="h-12 md:h-20 w-auto opacity-80"
          alt="logo"
        />
      </div>

      <div className="min-h-screen  flex flex-col items-center justify-center px-4 py-8 md:p-6 z-10">
        {/* TÍTULO */}
        <div className="mb-6 text-center px-2">
          <h2
            className="text-white text-xl md:text-3xl font-black italic tracking-tighter leading-tight"
            style={{ fontFamily: "Chaney, sans-serif" }}
          >
            ¿<span className="uppercase">Q</span>uánto sabes de{" "}
            <span className="text-black mx-1 drop-shadow-[0_1.2px_1.2px_rgba(255,255,255,0.8)] uppercase">
              GUITARRA
            </span>
            ?
          </h2>
        </div>

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
        <div
          className={`bg-black/40 p-4 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-white/10 w-full max-w-4xl backdrop-blur-md transition-opacity duration-150 ${
            userAnswers[step] !== null || showFeedback
              ? "opacity-40 pointer-events-none"
              : "opacity-100"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {currentQuestion.opciones.map((opcion) => (
              <button
                key={opcion}
                onClick={() => handleAnswer(opcion)}
                className="py-4 md:py-5 px-4 md:px-6 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-amber-500 hover:text-black transition-all active:scale-90 text-left"
              >
                <span className="text-sm font-semibold font-sans">
                  {opcion}
                </span>
              </button>
            ))}
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
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
          <div className="text-center p-8 md:p-12 bg-white/5 rounded-[2.5rem] md:rounded-[4rem] border border-white/10 max-w-sm w-full animate-in fade-in zoom-in duration-300">
            <h2
              className="text-4xl font-black text-white mb-2 uppercase italic tracking-tighter"
              style={{ fontFamily: "Chaney, sans-serif" }}
            >
              ¡Hecho!
            </h2>
            <div
              className="text-5xl font-black text-amber-400 my-8 italic"
              style={{ fontFamily: "Chaney, sans-serif" }}
            >
              {results.filter((r) => r === "correct").length}
              <span className="text-white/20 text-2xl mx-2">/</span>24
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-amber-500 text-black font-black rounded-2xl text-xs uppercase hover:scale-105 transition-all"
            >
              Reiniciar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
