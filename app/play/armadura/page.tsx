"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import GameChrome from "@/app/components/GameChrome";
import { ROUND_LENGTH } from "@/lib/roundLength";
import { getArmaduras, type ArmaduraData, type Clave } from "./notes_images";
import { CheckCircle2, XCircle, ArrowLeft, ArrowRight } from "lucide-react";
import GameOverModal from "@/app/components/GameOverModal";
import { useAbandono } from "@/app/components/useAbandono";
import Backdrop from "@/app/components/Backdrop";

export default function ArmadurasGame() {

  const todasLasNotas = useMemo(
    () => [
      "Do",
      "Do#",
      "Reb",
      "Re",
      "Re#",
      "Mib",
      "Mi",
      "Fa",
      "Fa#",
      "Solb",
      "Sol",
      "Sol#",
      "Lab",
      "La",
      "La#",
      "Sib",
      "Si",
      "Dob",
    ],
    [],
  );

  // 1. Hydration Fix: Start with empty state
  const [selectedClaves, setSelectedClaves] = useState<Clave[] | null>(null);
  const [quizList, setQuizList] = useState<ArmaduraData[]>([]);
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

  // Si se va a media partida, queda apuntada como abandonada. Lo que ve el
  // alumno no cambia: esto no pinta nada.
  useAbandono(results, gameOver);
  const [isReviewing, setIsReviewing] = useState(false);
  const [showFeedback, setShowFeedback] = useState<null | "correct" | "wrong">(
    null,
  );

  // 2. Marca montaje en cliente (evita hydration mismatch)
  useEffect(() => {
    setIsMounted(true);
  }, []);


  // Inicia la partida con las claves seleccionadas
  const startGame = (claves: Clave[]) => {
    const shuffled = [...getArmaduras(claves)]
      .sort(() => Math.random() - 0.5)
      .slice(0, ROUND_LENGTH);
    setQuizList(shuffled);
    setSelectedClaves(claves);
    setStep(0);
    setResults(Array(shuffled.length).fill(null));
    setUserAnswers(Array(shuffled.length).fill(null));
    setGameOver(false);
    setIsReviewing(false);
    setShowFeedback(null);
  };

  const currentQuestion = quizList[step];
  // Solo se pregunta por la tonalidad mayor. La relativa menor comparte
  // armadura, asi que con la imagen delante no habia nada que leer: ver
  // `notes_images.tsx`.
  const respuestaCorrecta = currentQuestion?.mayor;

  /**
   * La nota de la respuesta tal y como aparece en los botones. Los datos la
   * guardan con la alteracion escrita ("Dos mayor"), asi que hay que traducirla
   * al "Do#" de la botonera. Estaba dentro del manejador del click; ahora hace
   * falta tambien al pintar, para poder marcar en verde la que era.
   */
  const solucionNormalizada = (respuestaCorrecta?.split(" ")[0] || "")
    .replace("Dos", "Do#")
    .replace("Res", "Re#")
    .replace("Fas", "Fa#")
    .replace("Sols", "Sol#")
    .replace("Las", "La#");

  /** Lo contestado en esta pregunta, o null si todavia esta en juego. */
  const answeredHere = userAnswers[step] ?? null;

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
    const index = userAnswers.indexOf(null);
    return index === -1 ? quizList.length : index;
  }, [userAnswers, quizList]);
  const correctCount = useMemo(
    () => results.filter((r) => r === "correct").length,
    [results],
  );
  const totalQuestions = quizList.length || 24;


  if (!isMounted) {
    return <div className="min-h-screen bg-slate-900" />;
  }

  // Pantalla de selección de clave (antes de empezar)
  if (selectedClaves === null) {
    const opciones: { claves: Clave[]; titulo: string; sub: string; imgs: string[] }[] = [
      {
        claves: ["sol"],
        titulo: "Clave de Sol",
        sub: "Solo clave de Sol",
        imgs: ["/assets/armaduras/SolM.png"],
      },
      {
        claves: ["fa"],
        titulo: "Clave de Fa",
        sub: "Solo clave de Fa",
        imgs: ["/assets/armaduras_fa/SolM.png"],
      },
      {
        claves: ["sol", "fa"],
        titulo: "Ambas claves",
        sub: "Sol y Fa mezcladas",
        imgs: ["/assets/armaduras/SolM.png", "/assets/armaduras_fa/SolM.png"],
      },
    ];

    return (
      <div className="relative min-h-screen flex flex-col font-sans overflow-x-hidden text-white">
        <Backdrop />

        <div className="relative z-10 min-h-screen flex flex-col">
      <GameChrome>
        ¿Qué tonalidad
        <span className="text-black mx-2 drop-shadow-[0_1.2px_1.2px_rgba(255,255,255,0.8)] uppercase">
          MAYOR
        </span>
        es?
      </GameChrome>

        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-4 pt-4 md:px-6 md:pb-6 md:pt-6 z-10 w-full max-w-5xl mx-auto">
          <div className="mb-10 text-center">
            <h2
              className="text-white text-2xl md:text-4xl font-black italic tracking-tighter leading-tight"
              style={{ fontFamily: "Chaney, sans-serif" }}
            >
              Armaduras
            </h2>
            <p className="text-white/60 text-xs md:text-sm font-bold uppercase tracking-[0.25em] mt-3">
              Elige con qué clave quieres jugar
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 w-full">
            {opciones.map((op) => (
              <button
                key={op.titulo}
                onClick={() => startGame(op.claves)}
                className="group flex flex-col items-center gap-4 bg-black/40 hover:bg-amber-500 p-6 md:p-8 rounded-[2rem] border border-white/10 hover:border-amber-400 backdrop-blur-md transition-all active:scale-95 shadow-xl"
              >
                <div className="bg-white rounded-2xl w-full h-28 md:h-32 flex items-center justify-center gap-2 p-3 overflow-hidden">
                  {op.imgs.map((src) => (
                    <img
                      key={src}
                      src={encodeURI(src)}
                      alt=""
                      className="max-h-full max-w-full object-contain"
                    />
                  ))}
                </div>
                <div className="text-center">
                  <div className="text-white group-hover:text-black text-base md:text-lg font-black italic uppercase tracking-tight transition-colors">
                    {op.titulo}
                  </div>
                  <div className="text-white/50 group-hover:text-black/70 text-[10px] font-bold uppercase tracking-widest mt-1 transition-colors">
                    {op.sub}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <footer className="py-8 text-center text-slate-600 text-[8px] tracking-[0.6em] uppercase z-10">
          © 2026 21st Century Music
        </footer>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return <div className="min-h-screen bg-slate-900" />;
  }

  const formatearSolucion = (texto: string) => {
    if (!texto) return "";
    let res = texto
      .replace("Dos", "Do#")
      .replace("Res", "Re#")
      .replace("Fas", "Fa#")
      .replace("Sols", "Sol#")
      .replace("Las", "La#");
    return res.charAt(0).toUpperCase() + res.slice(1).toLowerCase();
  };

  const handleNoteClick = (notaBoton: string) => {
    if (gameOver || userAnswers[step] !== null || showFeedback) return;
    setIsReviewing(false);

    const isCorrect = notaBoton === solucionNormalizada;
    setShowFeedback(isCorrect ? "correct" : "wrong");

    const newResults = [...results];
    newResults[step] = isCorrect ? "correct" : "wrong";
    setResults(newResults);

    const newAnswers = [...userAnswers];
    newAnswers[step] = notaBoton;
    setUserAnswers(newAnswers);

    // Acertando se pasa rapido, que no hay nada que mirar. Fallando hay que
    // dar tiempo a ver cual era la buena: es el unico momento en el que se
    // aprende algo.
    setTimeout(
      () => {
        setShowFeedback(null);
        if (step < quizList.length - 1) {
          setStep(step + 1);
        } else {
          setGameOver(true);
        }
      },
      isCorrect ? 700 : 1600,
    );
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
    <div className="relative min-h-screen flex flex-col font-sans overflow-x-hidden text-white">
      <Backdrop />

      <div className="relative z-10 min-h-screen flex flex-col">
      {/* Top Navigation */}
      <GameChrome />

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-4 pt-4 md:px-6 md:pb-6 md:pt-6 z-10 w-full max-w-6xl mx-auto">
        {/* Title */}

        {/* Question Card */}
        <div className="relative flex flex-col items-center w-full max-w-sm md:max-w-md mb-10">
          <div
            className={`bg-white p-0 md:p-0 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl w-full h-40 md:h-48 flex items-center justify-center border-4 relative overflow-hidden transition-all duration-300 ${
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
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center backdrop-blur-[1px] bg-white/40">
                {showFeedback === "correct" ? (
                  <CheckCircle2 className="text-green-500 w-16 h-16 md:w-20 md:h-20 animate-bounce" />
                ) : (
                  <XCircle className="text-red-500 w-16 h-16 md:w-20 md:h-20" />
                )}
              </div>
            )}

            <img
              key={currentQuestion.image}
              src={encodeURI(currentQuestion.image)}
              alt="Armadura"
              onLoad={() => setIsImageLoading(false)}
              className={`max-h-full max-w-full object-contain transition-all duration-300 ${isImageLoading ? "opacity-0" : "opacity-100"}`}
            />
          </div>

          {/* Solution Badge */}
          <div
            className={`absolute -bottom-8 left-1/2 -translate-x-1/2 z-30 transition-all duration-500 transform ${(isReviewing || showFeedback === "wrong") && userAnswers[step] !== null ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"}`}
          >
            <div className="mx-auto px-6 py-2 rounded-2xl border-2 border-amber-400/50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center shadow-2xl min-w-[140px]">
              <span className="text-[7px] text-amber-400 uppercase font-black tracking-widest">
                Solución
              </span>
              <span className="text-sm md:text-lg font-bold text-white uppercase italic">
                {formatearSolucion(respuestaCorrecta || "")}
              </span>
            </div>
          </div>
        </div>

        {/* Responsive Note Grid */}
        {/* La rejilla entera se iba a `opacity-20` al contestar, asi que la
            correccion no se veia: se apagaba justo el sitio donde habia que
            mirar. Ahora se queda encendida y sin clicks, y son los botones los
            que dicen lo que ha pasado — verde el bueno, rojo el pulsado si
            estaba mal, apagados los demas. */}
        <div
          className={`bg-black/40 p-4 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-white/10 w-full backdrop-blur-md transition-all ${answeredHere !== null ? "pointer-events-none" : ""}`}
        >
          <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-9 gap-2 md:gap-4">
            {todasLasNotas.map((nota) => {
              const isSolution = nota === solucionNormalizada;
              const isMistake = nota === answeredHere && !isSolution;

              return (
                <button
                  key={nota}
                  disabled={answeredHere !== null || !!showFeedback}
                  onClick={() => handleNoteClick(nota)}
                  className={`py-3 md:py-5 rounded-xl border transition-all active:scale-95 shadow-sm ${
                    answeredHere === null
                      ? "border-white/10 bg-white/5 text-white hover:bg-amber-500 hover:text-black"
                      : isSolution
                        ? "border-green-400 bg-green-500/80 text-white"
                        : isMistake
                          ? "border-red-400 bg-red-500/80 text-white"
                          : "border-white/5 bg-white/5 text-white/20"
                  }`}
                >
                  <span className="text-xs md:text-sm font-bold font-sans">
                    {nota}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation & Progress */}
        <div className="w-full mt-12 md:mt-16 flex flex-col items-center gap-6">
          <div className="flex items-center justify-between w-full max-w-md gap-4">
            <button
              onClick={goBack}
              className={`p-3 bg-white/5 border border-white/10 text-white rounded-full transition-all ${step === 0 ? "opacity-0" : "opacity-100"}`}
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

      {/* Game Over Modal */}
      {gameOver && (
        <GameOverModal correct={correctCount} total={totalQuestions} />
      )}
      </div>
    </div>
  );
}
