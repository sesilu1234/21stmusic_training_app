"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { chords_images } from "./chords_images";

export default function ChordsGame() {
  const router = useRouter();

  const opcionesAcordes = ["Mayor", "Menor", "Aumentado", "Disminuido"];

  // 1. Selección y barajado de 24 preguntas al inicio
  const quizList = useMemo(() => {
    return [...chords_images].sort(() => Math.random() - 0.5).slice(0, 24);
  }, []);

  const [step, setStep] = useState(0);
  const [results, setResults] = useState<(null | "correct" | "wrong")[]>(Array(24).fill(null));
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>(Array(24).fill(null));
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);

  const currentQuestion = quizList[step];

  // --- ESTRATEGIA DE PREPROCESADO (PRELOADING) ---
  
  // Precarga masiva al iniciar para que no haya parpadeos
  useEffect(() => {
    quizList.forEach((q) => {
      const img = new Image();
      img.src = `/assets/diapason_acordes/${q.image}`;
    });
  }, [quizList]);

  // Control de carga individual por pregunta
  useEffect(() => {
    setIsImageLoading(true);
    const img = new Image();
    img.src = `/assets/diapason_acordes/${currentQuestion.image}`;
    
    if (img.complete) {
      setIsImageLoading(false);
    }
    
    img.onload = () => setIsImageLoading(false);
  }, [step, currentQuestion.image]);

  const progresoMaximo = useMemo(() => {
    const firstEmpty = userAnswers.indexOf(null);
    return firstEmpty === -1 ? 24 : firstEmpty;
  }, [userAnswers]);

  // --- LÓGICA DE JUEGO ---

  const handleAnswer = (notaSeleccionada: string) => {
    if (userAnswers[step] !== null || gameOver) return;
    setIsReviewing(false);

    const mapping: Record<string, string> = {
      "Mayor": "Mayores",
      "Menor": "Menores",
      "Aumentado": "aug",
      "Disminuido": "dim"
    };

    const isCorrect = mapping[notaSeleccionada] === currentQuestion.answer;
    
    const newResults = [...results];
    newResults[step] = isCorrect ? "correct" : "wrong";
    setResults(newResults);

    const newAnswers = [...userAnswers];
    newAnswers[step] = notaSeleccionada;
    setUserAnswers(newAnswers);

    if (step < 23) {
      setTimeout(() => setStep(step + 1), 400);
    } else {
      setTimeout(() => setGameOver(true), 1200);
    }
  };

  // --- FUNCIONES DE NAVEGACIÓN (Aquí estaban las que faltaban) ---

  const goBack = () => {
    setIsReviewing(true);
    setStep((prev) => Math.max(0, prev - 1));
  };

  const goNext = () => {
    const nextStep = step + 1;
    setStep(nextStep);
    if (nextStep >= progresoMaximo) {
      setIsReviewing(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-cover bg-center overflow-hidden"
         style={{ backgroundImage: "url('/assets/background.jpeg')" }}>
      
      {/* Botón Volver al Menú */}
      <button 
        onClick={() => router.push("/play")} 
        className="absolute top-8 left-8 text-white/50 hover:text-white text-[10px] font-bold uppercase tracking-widest bg-black/20 px-4 py-2 rounded-full border border-white/10 z-20 transition-all"
      >
        ← Menú Principal
      </button>

      {/* PREGUNTA: Chaney font-black italic, solo Q y ACORDE en mayúsculas */}
      <div className="mb-6 text-center max-w-2xl px-4">
        <h2 className="text-white text-3xl font-black italic tracking-tighter leading-tight" 
            style={{ fontFamily: 'Chaney, sans-serif' }}>
          ¿<span className="uppercase">Q</span>ué tipo de 
          <span className="text-black mx-2 drop-shadow-[0_1.2px_1.2px_rgba(255,255,255,0.8)] uppercase">
            ACORDE
          </span> 
          es este?
        </h2>
      </div>

      <div className="relative flex flex-col items-center w-full max-w-2xl mb-8">
        {/* Card de Imagen con Spinner de carga */}
        <div className="bg-white p-8 rounded-[3.5rem] shadow-2xl w-full h-64 flex items-center justify-center border-4 border-white relative overflow-hidden">
          <div className="absolute top-4 right-6 text-black/5 font-black italic text-xl">#{step + 1}</div>
          
          {isImageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          <img 
            key={currentQuestion.image} 
            src={`/assets/diapason_acordes/${currentQuestion.image}`} 
            alt="Acorde" 
            className={`max-h-full w-auto object-contain transition-all duration-300 ${isImageLoading ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`} 
          />
        </div>

        {/* SOLUCIÓN: Solo visible en revisión */}
        <div className={`absolute -bottom-14 left-0 right-0 z-30 transition-all duration-500 transform ${isReviewing && userAnswers[step] !== null ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95 pointer-events-none'}`}>
          <div className="mx-auto w-56 h-14 rounded-2xl border-2 border-amber-400/50 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center shadow-2xl">
            <span className="text-[8px] text-amber-400 uppercase font-black tracking-widest">Solución</span>
            <span className="text-lg font-black text-white italic uppercase tracking-tighter" style={{ fontFamily: 'Chaney, sans-serif' }}>
              {Object.keys({ "Mayor": "Mayores", "Menor": "Menores", "Aumentado": "aug", "Disminuido": "dim" }).find(k => {
                const m: any = { "Mayor": "Mayores", "Menor": "Menores", "Aumentado": "aug", "Disminuido": "dim" };
                return m[k] === currentQuestion.answer;
              })}
            </span>
          </div>
        </div>
      </div>

      {/* BOTONES DE RESPUESTA: font-semibold Sans */}
      <div className={`bg-black/40 p-8 rounded-[3rem] border border-white/10 w-full max-w-4xl backdrop-blur-md transition-all ${userAnswers[step] !== null ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {opcionesAcordes.map(nota => (
            <button 
              key={nota} 
              disabled={userAnswers[step] !== null || gameOver} 
              onClick={() => handleAnswer(nota)} 
              className="py-6 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all active:scale-95 shadow-sm"
            >
              <span className="text-sm font-semibold font-sans tracking-normal">{nota}</span>
            </button>
          ))}
        </div>
      </div>

      {/* NAVEGACIÓN Y PROGRESO (24 pasos) */}
      <div className="w-full max-w-2xl flex flex-col items-center gap-6 mt-16">
        <div className="flex gap-4 h-10 items-center">
          <button 
            onClick={goBack} 
            className={`px-6 py-2 bg-white/5 border border-white/10 text-white text-[10px] font-bold rounded-full uppercase tracking-widest hover:bg-white/10 transition-all ${step === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          >
            ← Anterior
          </button>
          <button 
            onClick={goNext} 
            className={`px-6 py-2 bg-amber-500 text-black text-[10px] font-bold rounded-full uppercase tracking-widest hover:scale-105 transition-all ${(isReviewing && step < progresoMaximo) ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            Siguiente →
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-1.5 p-4 bg-black/20 rounded-2xl border border-white/5">
          {results.map((res, i) => (
            <div 
              key={i} 
              onClick={() => { if(userAnswers[i] !== null) { setIsReviewing(true); setStep(i); } }}
              className={`w-6 h-6 rounded-md border flex items-center justify-center text-[8px] font-black cursor-pointer transition-all ${
                res === "correct" ? "bg-green-500 text-white border-green-400" : 
                res === "wrong" ? "bg-red-500 text-white border-red-400" : 
                i === step ? "border-amber-400 bg-white/20 text-white scale-110 shadow-[0_0_15px_rgba(251,191,36,0.5)]" : "border-white/5 text-white/10"
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* MODAL DE RESULTADO FINAL */}
      {gameOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md">
          <div className="text-center p-12 bg-white/5 rounded-[4rem] border border-white/10 max-w-sm w-full mx-4 shadow-2xl">
            <h2 className="text-4xl font-black text-white mb-2 uppercase italic tracking-tighter" style={{ fontFamily: 'Chaney, sans-serif' }}>¡Hecho!</h2>
            <div className="text-5xl font-black text-amber-400 my-8 italic" style={{ fontFamily: 'Chaney, sans-serif' }}>
              {results.filter(r => r === "correct").length}<span className="text-white/20 text-2xl mx-2">/</span>24
            </div>
            <button onClick={() => window.location.reload()} className="w-full py-4 bg-amber-500 text-black font-black rounded-2xl text-xs uppercase tracking-widest hover:scale-105 transition-all">Reiniciar</button>
          </div>
        </div>
      )}
    </div>
  );
}