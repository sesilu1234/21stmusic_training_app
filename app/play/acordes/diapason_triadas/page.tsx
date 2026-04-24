"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { chords_images } from "./chords_images";
import {
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ArrowRight,
  Home,
} from "lucide-react";

export default function TriadsGame() {
  const router = useRouter();

  const opcionesAcordes = ["Mayor", "Menor", "Aumentado", "Disminuido"];

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
      .slice(0, 24);
    setQuizList(shuffled);
    setIsMounted(true);
  }, []);

  const currentQuestion = quizList[step];

  useEffect(() => {
    if (quizList.length > 0) {
      quizList.forEach((q) => {
        const img = new Image();
        img.src = `/assets/diapason_triadas/${q.image}`;
      });
    }
  }, [quizList]);

  useEffect(() => {
    if (currentQuestion) {
      setIsImageLoading(true);
      const img = new Image();
      img.src = `/assets/diapason_triadas/${currentQuestion.image}`;
      if (img.complete) setIsImageLoading(false);
      img.onload = () => setIsImageLoading(false);
    }
  }, [step, currentQuestion?.image]);

  const progresoMaximo = useMemo(() => {
    const firstEmpty = userAnswers.indexOf(null);
    return firstEmpty === -1 ? 24 : firstEmpty;
  }, [userAnswers]);

  if (!isMounted || !currentQuestion)
    return <div className="min-h-screen bg-slate-900" />;

  const mapping: Record<string, string> = {
    Mayor: "Mayores",
    Menor: "Menores",
    Aumentado: "aug",
    Disminuido: "dim",
  };

  const reverseMapping: Record<string, string> = {
    Mayores: "Mayor",
    Menores: "Menor",
    aug: "Aumentado",
    dim: "Disminuido",
  };

  // Opción correcta expresada como texto de botón ("Mayor", "Menor"...)
  const correctOption = reverseMapping[currentQuestion.answer] || "";

  const handleAnswer = (notaSeleccionada: string) => {
    if (userAnswers[step] !== null || gameOver || !!showFeedback) return;
    setIsReviewing(false);

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
        if (step < 23) {
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

  const getSolucionTexto = () => reverseMapping[currentQuestion.answer] || "";

  // Calcula el estilo de cada botón según el estado actual
  const getButtonStyle = (nota: string) => {
    const isAnswered = userAnswers[step] !== null;
    const isThisCorrect = nota === correctOption;
    const isThisSelected = nota === userAnswers[step];

    // Justo después de responder (showFeedback activo): marca correcto en verde y error en rojo
    if (showFeedback) {
      if (isThisCorrect)
        return "bg-green-500/30 border-green-400 text-white scale-[1.02]";
      if (isThisSelected && showFeedback === "wrong")
        return "bg-red-500/30 border-red-400 text-white";
      return "opacity-30 border-white/10 bg-white/5 text-white";
    }

    // Revisando una pregunta ya contestada: muestra correcto en verde y el error en rojo
    if (isReviewing && isAnswered) {
      if (isThisCorrect) return "bg-green-500/30 border-green-400 text-white";
      if (isThisSelected && results[step] === "wrong")
        return "bg-red-500/20 border-red-400/60 text-white";
      return "opacity-30 border-white/10 bg-white/5 text-white";
    }

    // Estado normal (sin responder aún)
    return "border-white/10 bg-white/5 text-white hover:bg-amber-500 hover:text-black";
  };

  return (
    <div
      className="relative min-h-screen flex flex-col bg-slate-900 bg-cover bg-center font-sans overflow-x-hidden"
      style={{ backgroundImage: "url('/assets/background.jpeg')" }}
    >
      {/* NAVEGACIÓN SUPERIOR */}
      <div className="w-full px-4 pt-6 md:px-12 flex justify-between items-center z-20">
        {/* 3 — Icono de casita en vez de texto */}
        <button
          onClick={() => router.push("/play")}
          className="text-white/50 hover:text-white bg-black/40 p-2.5 rounded-xl border border-white/10 transition-all hover:bg-black/60"
        >
          <Home size={16} />
        </button>
        <img
          src="/assets/logo21stCM_no_white_1.png"
          className="h-12 md:h-20 w-auto opacity-80"
          alt="logo"
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 z-10 w-full max-w-5xl mx-auto">
        {/* TÍTULO */}
        <div className="mb-6 text-center">
          <h2
            className="text-white text-xl md:text-3xl font-black italic tracking-tighter uppercase"
            style={{ fontFamily: "Chaney, sans-serif" }}
          >
            ¿Qué tipo de{" "}
            <span className="text-black bg-white/90 px-2 rounded drop-shadow-sm">
              ACORDE
            </span>{" "}
            es?
          </h2>
        </div>

        {/* CARTA DE PREGUNTA */}
        <div className="relative flex flex-col items-center w-full max-w-sm md:max-w-md mb-10">
          <div
            className={`bg-white p-6 md:p-8 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl w-full h-44 md:h-52 flex items-center justify-center border-4 relative overflow-hidden transition-all duration-300 ${
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
              src={`/assets/diapason_triadas/${currentQuestion.image}`}
              alt="Acorde"
              className={`max-h-full max-w-full object-contain transition-all duration-300 ${isImageLoading ? "opacity-0" : "opacity-100"}`}
            />
          </div>

          {/* BADGE DE SOLUCIÓN (Solo en revisión o error) */}
          <div
            className={`absolute -bottom-8 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 transform ${
              (isReviewing || showFeedback === "wrong") &&
              userAnswers[step] !== null
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0 pointer-events-none"
            }`}
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

        {/* BOTONES DE RESPUESTA GRID */}
        <div
          className={`bg-black/40 p-4 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-white/10 w-full backdrop-blur-md transition-all ${
            showFeedback ? "pointer-events-none" : ""
          }`}
        >
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {opcionesAcordes.map((nota) => (
              <button
                key={nota}
                disabled={userAnswers[step] !== null || !!showFeedback}
                onClick={() => handleAnswer(nota)}
                className={`py-4 md:py-6 rounded-xl border transition-all active:scale-95 shadow-sm ${getButtonStyle(nota)}`}
              >
                <span className="text-xs md:text-sm font-bold">{nota}</span>
              </button>
            ))}
          </div>
        </div>

        {/* PROGRESO Y CONTROLES */}
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
              className={`p-3 bg-amber-500 text-black rounded-full shadow-lg transition-all ${
                isReviewing || (userAnswers[step] !== null && !showFeedback)
                  ? "opacity-100"
                  : "opacity-0 pointer-events-none"
              }`}
            >
              <ArrowRight size={20} />
            </button>
          </div>
        </div>

        <footer className="mt-auto py-8 text-center text-slate-600 text-[8px] tracking-[0.6em] uppercase">
          © 2026 21st Century Music
        </footer>
      </div>

      {/* MODAL GAME OVER */}
      {gameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
          <div className="text-center p-8 md:p-12 bg-white/5 rounded-[2.5rem] md:rounded-[4rem] border border-white/10 max-w-sm w-full animate-in fade-in zoom-in duration-300">
            <h2
              className="text-3xl font-black text-white mb-2 uppercase italic"
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
              className="w-full py-4 bg-amber-500 text-black font-black rounded-2xl text-xs uppercase hover:scale-105 transition-all shadow-xl shadow-amber-500/20"
            >
              Reiniciar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
