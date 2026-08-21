"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import GameChrome from "@/app/components/GameChrome";
import { getStoredRoundLength } from "@/lib/roundLength";
import { diapason_data } from "./diapason_data";
import { CheckCircle2, XCircle, ArrowLeft, ArrowRight } from "lucide-react";
import GameOverModal from "@/app/components/GameOverModal";

export default function DiapasonGame() {

  const botonesNotas = [
    "Do",
    "Do#/Reb",
    "Re",
    "Re#/Mib",
    "Mi",
    "Fa",
    "Fa#/Solb",
    "Sol",
    "Sol#/Lab",
    "La",
    "La#/Sib",
    "Si",
  ];

  // 1. We start with state for the quiz list to avoid hydration mismatch
  const [quizList, setQuizList] = useState<typeof diapason_data>([]);
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

  // 2. Initialize the game only on the client
  useEffect(() => {
    const shuffled = [...diapason_data]
      .sort(() => Math.random() - 0.5)
      .slice(0, getStoredRoundLength());
    setQuizList(shuffled);
    setResults(Array(shuffled.length).fill(null));
    setUserAnswers(Array(shuffled.length).fill(null));
    setIsMounted(true);
  }, []);

  const currentQuestion = quizList[step];

  // 3. Preload images
  useEffect(() => {
    if (quizList.length > 0) {
      quizList.forEach((q) => {
        const img = new Image();
        img.src = encodeURI(q.image);
      });
    }
  }, [quizList]);

  useEffect(() => {
    if (currentQuestion) {
      setIsImageLoading(true);
      const img = new Image();
      img.src = encodeURI(currentQuestion.image);
      if (img.complete) setIsImageLoading(false);
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


  // Prevent rendering until mounted to avoid mismatch
  if (!isMounted || quizList.length === 0) {
    return <div className="min-h-screen bg-slate-900" />;
  }

  const handleAnswer = (nota: string) => {
    if (userAnswers[step] !== null || gameOver || !!showFeedback) return;
    setIsReviewing(false);

    const isCorrect = nota === currentQuestion.answer;
    setShowFeedback(isCorrect ? "correct" : "wrong");

    const newResults = [...results];
    newResults[step] = isCorrect ? "correct" : "wrong";
    setResults(newResults);

    const newAnswers = [...userAnswers];
    newAnswers[step] = nota;
    setUserAnswers(newAnswers);

    const delay = isCorrect ? 250 : 600;

    setTimeout(() => {
      setShowFeedback(null);
      if (step < quizList.length - 1) {
        setStep(step + 1);
      } else {
        setGameOver(true);
      }
    }, delay);
  };

  const goBack = () => {
    setIsReviewing(true);
    setShowFeedback(null);
    setStep((prev) => Math.max(0, prev - 1));
  };

  const goNext = () => {
    if (step < quizList.length - 1) {
      const nextStep = step + 1;
      setStep(nextStep);
      setShowFeedback(null);
      if (nextStep >= progresoMaximo) setIsReviewing(false);
    }
  };

  return (
    <div
      className="relative min-h-screen flex flex-col bg-slate-900 bg-cover bg-center overflow-x-hidden font-sans"
      style={{ backgroundImage: "url('/assets/background.jpeg')" }}
    >
      <GameChrome>
        ¿<span className="uppercase">Q</span>ué{" "}
        <span className="text-black mx-1 md:mx-2 drop-shadow-[0_1.2px_1.2px_rgba(255,255,255,0.8)] uppercase">
        NOTA
        </span>{" "}
        es?
      </GameChrome>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-4 pt-4 md:px-6 md:pb-6 md:pt-6 z-10 w-full max-w-6xl mx-auto">

        <div className="relative flex flex-col items-center w-full max-w-md md:max-w-2xl mb-6 md:mb-10">
          <div
            className={`bg-white p-4 md:p-6 rounded-[2rem] md:rounded-[3.5rem] shadow-2xl w-full h-52 md:h-64 flex items-center justify-center border-4 relative overflow-hidden transition-all duration-150 ${
              showFeedback === "correct"
                ? "border-green-500 scale-[1.02]"
                : showFeedback === "wrong"
                  ? "border-red-500 animate-shake"
                  : "border-white"
            }`}
          >
            <div className="absolute top-3 right-5 text-black/10 font-black italic text-lg">
              #{step + 1}
            </div>

            {showFeedback && (
              <div className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-[1px]">
                {showFeedback === "correct" ? (
                  <CheckCircle2 className="text-green-500 w-16 h-16 md:w-24 md:h-24 animate-in zoom-in duration-150 fill-green-500/10" />
                ) : (
                  <XCircle className="text-red-500 w-16 h-16 md:w-20 md:h-20 fill-red-500/10 animate-in zoom-in duration-150" />
                )}
              </div>
            )}

            {currentQuestion && (
              <img
                key={currentQuestion.image}
                src={encodeURI(currentQuestion.image)}
                alt="Nota"
                onLoad={() => setIsImageLoading(false)}
                className={`max-h-full max-w-full object-contain transition-opacity duration-100 ${isImageLoading ? "opacity-0" : "opacity-100"}`}
              />
            )}
          </div>

          <div
            className={`absolute -bottom-6 left-1/2 -translate-x-1/2 z-30 transition-all duration-200 transform ${(isReviewing || showFeedback === "wrong") && userAnswers[step] !== null ? "translate-y-0 opacity-100 scale-100" : "translate-y-4 opacity-0 pointer-events-none"}`}
          >
            <div className="px-6 py-2 rounded-xl border-2 border-amber-400/50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center shadow-2xl min-w-[120px]">
              <span className="text-[8px] text-amber-400 uppercase font-black tracking-widest">
                Solución
              </span>
              <span className="text-sm font-bold text-white">
                {currentQuestion?.answer}
              </span>
            </div>
          </div>
        </div>

        <div
          className={`bg-black/40 p-4 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-white/10 w-full backdrop-blur-md transition-opacity duration-150 ${userAnswers[step] !== null || showFeedback ? "opacity-40 pointer-events-none" : "opacity-100"}`}
        >
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-4">
            {botonesNotas.map((nota) => (
              <button
                key={nota}
                disabled={userAnswers[step] !== null || !!showFeedback}
                onClick={() => handleAnswer(nota)}
                className="py-3 md:py-5 rounded-lg md:rounded-xl border border-white/10 bg-white/5 text-white hover:bg-amber-500 hover:text-black transition-all active:scale-90 flex items-center justify-center"
              >
                <span className="text-xs md:text-sm font-bold">{nota}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="w-full mt-8 md:mt-12 flex flex-col items-center gap-6 px-2">
          <div className="flex items-center justify-between w-full max-w-md gap-4">
            <button
              onClick={goBack}
              className={`p-3 bg-white/5 border border-white/10 text-white rounded-full transition-all ${step === 0 ? "opacity-0" : "opacity-100"}`}
            >
              <ArrowLeft size={20} />
            </button>

            <div className="flex flex-wrap justify-center gap-1.5 p-2 md:p-3 bg-black/20 rounded-2xl border border-white/5 shadow-inner max-w-[280px] md:max-w-none">
              {results.map((res, i) => (
                <div
                  key={i}
                  onClick={() => {
                    if (userAnswers[i] !== null) {
                      setIsReviewing(true);
                      setStep(i);
                    }
                  }}
                  className={`w-5 h-5 md:w-6 md:h-6 rounded-md border flex items-center justify-center text-[8px] font-black cursor-pointer transition-all ${
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
              className={`p-3 bg-amber-500 text-black rounded-full transition-all shadow-lg shadow-amber-500/20 ${isReviewing || (userAnswers[step] !== null && !showFeedback) ? "opacity-100" : "opacity-0"}`}
            >
              <ArrowRight size={20} />
            </button>
          </div>
        </div>

        <footer className="mt-auto py-8 text-center text-slate-600 text-[8px] tracking-[0.6em] uppercase">
          © 2026 21st Century Music
        </footer>
      </div>

      {gameOver && (
        <GameOverModal correct={correctCount} total={totalQuestions} />
      )}
    </div>
  );
}
