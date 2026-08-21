"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import GameChrome from "@/app/components/GameChrome";
import { getStoredRoundLength } from "@/lib/roundLength";
import { chords_images } from "./chords_images";
import { CheckCircle2, XCircle, ArrowLeft, ArrowRight } from "lucide-react";
import GameOverModal from "@/app/components/GameOverModal";

export default function ChordsGame() {

  const opcionesSeptimas = [
    "Mayor 7",
    "Menor 7",
    "Dominante 7",
    "Semidisminuido",
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
      .slice(0, getStoredRoundLength());
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

  const handleAnswer = (notaSeleccionada: string) => {
    if (userAnswers[step] !== null || gameOver || !!showFeedback) return;
    setIsReviewing(false);

    const mapping: Record<string, string> = {
      "Mayor 7": "maj7",
      "Menor 7": "min 7",
      "Dominante 7": "7",
      Semidisminuido: "min 7 b5",
    };

    const isCorrect = mapping[notaSeleccionada] === currentQuestion.answer;
    setShowFeedback(isCorrect ? "correct" : "wrong");

    const newResults = [...results];
    newResults[step] = isCorrect ? "correct" : "wrong";
    setResults(newResults);

    const newAnswers = [...userAnswers];
    newAnswers[step] = notaSeleccionada;
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
      isCorrect ? 300 : 700,
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

  const getSolucionTexto = () => {
    const mapping: any = {
      maj7: "Mayor 7",
      "min 7": "Menor 7",
      "7": "Dominante 7",
      "min 7 b5": "Semidisminuido",
    };
    return mapping[currentQuestion.answer] || "";
  };

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
              <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
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
              <span className="text-xs md:text-sm font-bold text-white uppercase italic">
                {getSolucionTexto()}
              </span>
            </div>
          </div>
        </div>

        {/* GRID DE BOTONES RESPONSIVE */}
        <div
          className={`bg-black/40 p-4 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-white/10 w-full backdrop-blur-md transition-all ${userAnswers[step] !== null || showFeedback ? "opacity-40 pointer-events-none" : "opacity-100"}`}
        >
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {opcionesSeptimas.map((nota) => (
              <button
                key={nota}
                disabled={userAnswers[step] !== null || !!showFeedback}
                onClick={() => handleAnswer(nota)}
                className="py-4 md:py-6 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-amber-500 hover:text-black transition-all active:scale-95"
              >
                <span className="text-xs md:text-sm font-bold">{nota}</span>
              </button>
            ))}
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
