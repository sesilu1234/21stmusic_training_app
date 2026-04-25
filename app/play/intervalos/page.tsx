"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { intervalos_data } from "./intervalos_data";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function IntervalosGame() {
  const router = useRouter();

  // Single array for a flexible grid
  const todosBotones = [
    "Unisono",
    "b2",
    "2",
    "b3",
    "3",
    "4",
    "#4",
    "b5",
    "5",
    "#5",
    "b6",
    "6",
    "b7",
    "7",
    "8",
  ];

  const [quizList, setQuizList] = useState<typeof intervalos_data>([]);
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

  // Initialize Game on Client
  useEffect(() => {
    const shuffled = [...intervalos_data]
      .sort(() => Math.random() - 0.5)
      .slice(0, 24);
    setQuizList(shuffled);
    setIsMounted(true);
  }, []);

  const currentQuestion = quizList[step];

  const progresoMaximo = useMemo(() => {
    const firstEmpty = userAnswers.indexOf(null);
    return firstEmpty === -1 ? 24 : firstEmpty;
  }, [userAnswers]);

  useEffect(() => {
    setIsImageLoading(true);
    if (currentQuestion) {
      const img = new Image();
      const safePath = currentQuestion.image
        .split("/")
        .map((part) => encodeURIComponent(part))
        .join("/");
      img.src = safePath;
      img.onload = () => setIsImageLoading(false);
      img.onerror = () => setIsImageLoading(false);
    }
  }, [step, currentQuestion]);

  if (!isMounted || !currentQuestion) {
    return <div className="min-h-screen bg-slate-900" />;
  }

  const handleAnswer = (val: string) => {
    if (userAnswers[step] !== null || gameOver) return;
    setIsReviewing(false);

    const answerToCompare = val === "Unisono" ? "0" : val;
    const isCorrect = answerToCompare === currentQuestion.answer;

    const newResults = [...results];
    newResults[step] = isCorrect ? "correct" : "wrong";
    setResults(newResults);

    const newAnswers = [...userAnswers];
    newAnswers[step] = val;
    setUserAnswers(newAnswers);

    if (step < 23) {
      setTimeout(() => setStep(step + 1), 400);
    } else {
      setTimeout(() => setGameOver(true), 800);
    }
  };

  const formatAnswer = (text: string) => {
    if (text === "0") return "Unisono";
    return text.replace(/B/g, "b");
  };

  const goBack = () => {
    setIsReviewing(true);
    setStep((prev) => Math.max(0, prev - 1));
  };

  const goNext = () => {
    const nextStep = step + 1;
    if (nextStep <= progresoMaximo) {
      setStep(nextStep);
      setIsReviewing(nextStep < progresoMaximo);
    }
  };

  return (
    <div
      className="relative min-h-screen flex flex-col bg-slate-900 bg-cover bg-center font-sans"
      style={{ backgroundImage: "url('/assets/background.jpeg')" }}
    >
      {/* HEADER SECTION */}
      <div className="w-full px-4 pt-6 md:px-12 flex justify-between items-start z-20">
        <button
          onClick={() => router.push("/")}
          className="text-white/50 hover:text-white text-[10px] font-bold uppercase tracking-widest bg-black/40 px-4 py-2 rounded-full border border-white/10 transition-all"
        >
          ← <span className="hidden sm:inline">Menú Principal</span>
          <span className="sm:hidden">Menú</span>
        </button>

        {/* Logos responsive: hide on very small, show on medium */}
        <div className="flex gap-4 md:gap-8 opacity-40 md:opacity-90">
          <img
            src="/assets/logo21stCM_no_white_1.png"
            className="h-12 md:h-24 w-auto drop-shadow-2xl"
            alt="logo"
          />
          <img
            src="/assets/logo21stCM_no_white_1.png"
            className="hidden sm:block h-12 md:h-24 w-auto drop-shadow-2xl"
            alt="logo"
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 z-10 w-full max-w-5xl mx-auto">
        {/* TITLE */}
        <div className="mb-6 text-center">
          <h2
            className="text-white text-xl md:text-3xl font-black italic tracking-tighter leading-tight uppercase"
            style={{ fontFamily: "Chaney, sans-serif" }}
          >
            ¿Qué{" "}
            <span className="text-black bg-white/90 px-2 rounded-sm drop-shadow-sm">
              INTERVALO
            </span>{" "}
            es?
          </h2>
        </div>

        {/* QUESTION IMAGE */}
        <div className="relative flex flex-col items-center w-full max-w-sm md:max-w-md mb-8">
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl w-full h-40 md:h-48 flex items-center justify-center border-4 border-white relative overflow-hidden">
            <div className="absolute top-3 right-5 text-black/10 font-black italic text-lg">
              #{step + 1}
            </div>

            {isImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            <img
              src={currentQuestion.image
                .split("/")
                .map((part) => encodeURIComponent(part))
                .join("/")}
              alt="Pregunta"
              className={`max-h-full transition-all duration-300 ${isImageLoading ? "opacity-0" : "opacity-100"}`}
            />
          </div>

          {/* SOLUTION BADGE */}
          <div
            className={`absolute -bottom-8 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 transform ${isReviewing && userAnswers[step] !== null ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"}`}
          >
            <div className="px-6 py-2 rounded-xl border border-amber-400/50 bg-black/90 backdrop-blur-xl flex flex-col items-center shadow-2xl min-w-[140px]">
              <span className="text-[7px] text-amber-400 uppercase font-black tracking-widest">
                Solución
              </span>
              <span className="text-sm font-bold text-white uppercase">
                {formatAnswer(currentQuestion.answer)}
              </span>
            </div>
          </div>
        </div>

        {/* RESPONSIVE BUTTON GRID */}
        <div
          className={`bg-black/40 p-4 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-white/10 w-full backdrop-blur-md transition-all ${userAnswers[step] !== null ? "opacity-20 pointer-events-none" : "opacity-100"}`}
        >
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-2 md:gap-3">
            {todosBotones.map((btn) => (
              <button
                key={btn}
                onClick={() => handleAnswer(btn)}
                className={`flex items-center justify-center h-12 md:h-14 rounded-lg md:rounded-xl border border-white/10 bg-white/5 text-white hover:bg-amber-500 hover:text-black transition-all active:scale-90 ${btn === "Unisono" ? "col-span-2 md:col-span-1" : ""}`}
              >
                <span className="text-[10px] md:text-sm font-bold">{btn}</span>
              </button>
            ))}
          </div>
        </div>

        {/* NAVIGATION & PROGRESS */}
        <div className="w-full mt-10 md:mt-16 flex flex-col items-center gap-6">
          <div className="flex items-center justify-between w-full max-w-md gap-4">
            <button
              onClick={goBack}
              className={`p-3 bg-white/5 border border-white/10 text-white rounded-full transition-all ${step === 0 ? "opacity-0 pointer-events-none" : "opacity-100"}`}
            >
              <ArrowLeft size={18} />
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
                          ? "border-amber-400 bg-white/20 text-white scale-110 shadow-[0_0_10px_rgba(251,191,36,0.4)]"
                          : "border-white/5 text-white/5"
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>

            <button
              onClick={goNext}
              className={`p-3 bg-amber-500 text-black rounded-full shadow-lg transition-all ${isReviewing ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        <footer className="mt-auto py-8 text-center text-slate-600 text-[8px] tracking-[0.6em] uppercase">
          © 2026 21st Century Music
        </footer>
      </div>

      {/* FINAL MODAL */}
      {gameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
          <div className="text-center p-8 md:p-12 bg-white/5 rounded-[2.5rem] md:rounded-[4rem] border border-white/10 max-w-sm w-full animate-in zoom-in duration-300">
            <h2
              className="text-3xl font-black text-white mb-2 uppercase italic tracking-tighter"
              style={{ fontFamily: "Chaney, sans-serif" }}
            >
              ¡Hecho!
            </h2>
            <div
              className="text-4xl font-black text-amber-400 my-6 italic"
              style={{ fontFamily: "Chaney, sans-serif" }}
            >
              {results.filter((r) => r === "correct").length}
              <span className="text-white/20 text-2xl mx-2">/</span>24
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-amber-500 text-black font-black rounded-2xl text-xs uppercase tracking-widest hover:scale-105 transition-all"
            >
              Reiniciar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
