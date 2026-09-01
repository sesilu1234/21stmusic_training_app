"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import GameChrome from "@/app/components/GameChrome";
import { ROUND_LENGTH } from "@/lib/roundLength";
import { chords_images } from "./chords_images";
import { CheckCircle2, XCircle, ArrowLeft, ArrowRight } from "lucide-react";
import GameOverModal from "@/app/components/GameOverModal";
import LoadingBars from "@/app/components/LoadingBars";

export default function ChordsGame() {

  // El cifrado manda y el nombre hablado va debajo. Antes los botones decían
  // "Mayor 7", que según a quién preguntes es maj7 o es dominante: el mismo
  // lío que teníamos con las mayúsculas. `answer` es el id de la imagen y no
  // se toca.
  const opcionesSeptimas = [
    { symbol: "maj7", word: "séptima mayor", answer: "maj7" },
    { symbol: "m7", word: "séptima menor", answer: "min 7" },
    { symbol: "7", word: "dominante", answer: "7" },
    { symbol: "m7b5", word: "semidisminuido", answer: "min 7 b5" },
  ];

  // Hydration fix: Mezclar en el cliente
  const [quizList, setQuizList] = useState<typeof chords_images>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [step, setStep] = useState(0);
  const [results, setResults] = useState<(null | "correct" | "wrong")[]>(
    Array(24).fill(null),
  );
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>(
    Array(24).fill(null),
  );
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [showFeedback, setShowFeedback] = useState<null | "correct" | "wrong">(
    null,
  );

  useEffect(() => {
    const shuffled = [...chords_images]
      .sort(() => Math.random() - 0.5)
      .slice(0, ROUND_LENGTH);
    setQuizList(shuffled);
    setResults(Array(shuffled.length).fill(null));
    setUserAnswers(Array(shuffled.length).fill(null));
    setIsMounted(true);
  }, []);

  const currentQuestion = quizList[step];

  useEffect(() => {
    if (quizList.length > 0) {
      quizList.forEach((q) => {
        const img = new Image();
        img.src = `/assets/diapason_septimas/${q.image}`;
      });
    }
  }, [quizList]);

  useEffect(() => {
    if (currentQuestion) {
      setIsImageLoading(true);
      const img = new Image();
      img.src = `/assets/diapason_septimas/${currentQuestion.image}`;
      if (img.complete) setIsImageLoading(false);
      img.onload = () => setIsImageLoading(false);
    }
  }, [step, currentQuestion?.image]);

  const progresoMaximo = useMemo(() => {
    const firstEmpty = userAnswers.indexOf(null);
    return firstEmpty === -1 ? quizList.length : firstEmpty;
  }, [userAnswers, quizList]);
  const correctCount = useMemo(
    () => results.filter((r) => r === "correct").length,
    [results],
  );
  const totalQuestions = quizList.length || 24;


  if (!isMounted || !currentQuestion)
    return <div className="min-h-screen bg-slate-900" />;

  const handleAnswer = (opcion: (typeof opcionesSeptimas)[number]) => {
    if (userAnswers[step] !== null || gameOver || !!showFeedback) return;
    setIsReviewing(false);

    const isCorrect = opcion.answer === currentQuestion.answer;
    setShowFeedback(isCorrect ? "correct" : "wrong");

    const newResults = [...results];
    newResults[step] = isCorrect ? "correct" : "wrong";
    setResults(newResults);

    const newAnswers = [...userAnswers];
    newAnswers[step] = opcion.symbol;
    setUserAnswers(newAnswers);

    setTimeout(
      () => {
        setShowFeedback(null);
        if (step < quizList.length - 1) {
          setStep(step + 1);
        } else {
          setGameOver(true);
        }
      },
      isCorrect ? 900 : 1800,
    );
  };

  const goBack = () => {
    setIsReviewing(true);
    setShowFeedback(null);
    setStep((prev) => Math.max(0, prev - 1));
  };

  const goNext = () => {
    const nextStep = step + 1;
    setStep(nextStep);
    setShowFeedback(null);
    if (nextStep >= progresoMaximo) setIsReviewing(false);
  };

  const getSolucion = () =>
    opcionesSeptimas.find((opcion) => opcion.answer === currentQuestion.answer);

  return (
    <div
      className="relative min-h-screen flex flex-col bg-slate-900 bg-cover bg-center font-sans overflow-x-hidden"
      style={{ backgroundImage: "url('/assets/background.jpeg')" }}
    >
      {/* HEADER / NAVIGATION */}
      <GameChrome>
        ¿Qué tipo de{" "}
        <span className="text-black drop-shadow-[0_1.2px_1.2px_rgba(255,255,255,0.8)]">
        ACORDE
        </span>{" "}
        es?
      </GameChrome>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-4 pt-4 md:px-6 md:pb-6 md:pt-6 z-10 w-full max-w-5xl mx-auto">
        {/* TITULO */}

        {/* CARTA DE PREGUNTA */}
        <div className="relative flex flex-col items-center w-full max-w-lg md:max-w-xl mb-10">
          <div
            className={`bg-white p-2 md:p-2 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl w-full h-44 md:h-52 flex items-center justify-center border-4 relative overflow-hidden transition-all duration-300 ${
              showFeedback === "correct"
                ? "border-green-500 scale-[1.02]"
                : showFeedback === "wrong"
                  ? "border-red-500 animate-shake"
                  : "border-white"
            }`}
          >
            <div className="absolute top-3 right-5 text-black/5 font-black italic text-lg md:text-xl">
              #{step + 1}
            </div>

            {showFeedback && (
              <div className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-[1px] bg-white/40">
                {showFeedback === "correct" ? (
                  <CheckCircle2 className="text-green-500 w-16 h-16 md:w-24 md:h-24 animate-bounce" />
                ) : (
                  <XCircle className="text-red-500 w-16 h-16 md:w-20 md:h-20" />
                )}
              </div>
            )}

            {isImageLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
                <LoadingBars className="h-6 text-amber-500" label="Cargando el ejercicio" />
              </div>
            )}

            <img
              key={currentQuestion.image}
              src={`/assets/diapason_septimas/${currentQuestion.image}`}
              alt="Acorde"
              className={`max-h-full max-w-full object-contain transition-all duration-300  ${isImageLoading ? "opacity-0" : "opacity-100"}`}
            />
          </div>

          {/* SOLUCIÓN BADGE */}
          <div
            className={`absolute -bottom-8 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 transform ${(isReviewing || showFeedback === "wrong") && userAnswers[step] !== null ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"}`}
          >
            <div className="px-6 py-2 rounded-2xl border-2 border-amber-400/50 bg-black/90 backdrop-blur-xl flex flex-col items-center shadow-2xl min-w-[140px]">
              <span className="text-[7px] text-amber-400 uppercase font-black tracking-widest">
                Solución
              </span>
              {/* normal-case: el cifrado distingue mayúsculas de minúsculas,
                  y "m7b5" en mayúsculas se lee "M7B5", que es otro acorde.
                  Ver lib/chordNames.ts. */}
              <span className="text-sm md:text-base font-bold text-white italic normal-case">
                {getSolucion()?.symbol}
              </span>
              <span className="text-[8px] text-white/40 uppercase tracking-wider">
                {getSolucion()?.word}
              </span>
            </div>
          </div>
        </div>

        {/* GRID DE BOTONES RESPONSIVE */}
        <div
          className={`bg-black/40 p-3 md:p-5 rounded-[1.75rem] md:rounded-[2.5rem] border border-white/10 w-full backdrop-blur-md transition-all ${userAnswers[step] !== null || showFeedback ? "pointer-events-none" : ""}`}
        >
          <div className="grid grid-cols-2 gap-2.5 md:gap-3">
            {opcionesSeptimas.map((opcion) => {
              // Corregida: verde la buena y rojo la que pulsaste si fallaste,
              // como en el resto de modos.
              const contestada = userAnswers[step];
              const esSolucion = opcion.answer === currentQuestion.answer;
              const laPulsaste = contestada === opcion.symbol;

              const estado =
                contestada === null
                  ? "border-white/10 bg-white/5 text-white hover:bg-amber-500 hover:text-black"
                  : esSolucion
                    ? "border-emerald-400 bg-emerald-400/25 text-emerald-100"
                    : laPulsaste
                      ? "border-rose-400 bg-rose-500/25 text-rose-100"
                      : "border-white/5 bg-white/5 text-white/25";

              return (
                <button
                  key={opcion.symbol}
                  disabled={contestada !== null || !!showFeedback}
                  onClick={() => handleAnswer(opcion)}
                  className={`group py-2.5 md:py-3.5 rounded-xl border transition-all active:scale-95 disabled:cursor-default ${estado}`}
                >
                  <span className="block text-sm md:text-base font-black">
                    {opcion.symbol}
                  </span>
                  <span className="mt-0.5 block text-[8px] md:text-[9px] font-bold uppercase tracking-wider opacity-50 group-hover:opacity-70">
                    {opcion.word}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* NAVEGACIÓN Y PROGRESO */}
        <div className="w-full mt-10 md:mt-16 flex flex-col items-center gap-6">
          <div className="flex items-center justify-between w-full max-w-md gap-4">
            <button
              onClick={goBack}
              className={`p-3 bg-white/5 border border-white/10 text-white rounded-full transition-all ${step === 0 ? "opacity-0 pointer-events-none" : "opacity-100"}`}
            >
              <ArrowLeft size={20} />
            </button>

            <div className="flex flex-wrap justify-center gap-1 p-2 bg-black/20 rounded-2xl border border-white/5 max-w-[240px] md:max-w-none">
              {results.map((res, i) => (
                <div
                  key={i}
                  onClick={() => {
                    if (userAnswers[i] !== null) {
                      setIsReviewing(true);
                      setStep(i);
                    }
                  }}
                  className={`w-5 h-5 md:w-6 md:h-6 rounded-md border flex items-center justify-center text-[7px] font-black cursor-pointer transition-all ${
                    res === "correct"
                      ? "bg-green-500 text-white border-green-400"
                      : res === "wrong"
                        ? "bg-red-500 text-white border-red-400"
                        : i === step
                          ? "border-amber-400 bg-white/20 scale-110 shadow-[0_0_10px_rgba(251,191,36,0.4)]"
                          : "border-white/5 text-white/5"
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>

            <button
              onClick={goNext}
              className={`p-3 bg-amber-500 text-black rounded-full shadow-lg transition-all ${isReviewing || (userAnswers[step] !== null && !showFeedback) ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            >
              <ArrowRight size={20} />
            </button>
          </div>
        </div>

        <footer className="mt-auto py-8 text-center text-slate-600 text-[8px] tracking-[0.6em] uppercase">
          © 2026 21st Century Music
        </footer>
      </div>

      {/* MODAL FINAL */}
      {gameOver && (
        <GameOverModal correct={correctCount} total={totalQuestions} />
      )}
    </div>
  );
}
