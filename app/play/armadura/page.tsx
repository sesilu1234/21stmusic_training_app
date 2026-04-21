"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { armaduras_data } from "./notes_images";

export default function ArmadurasGame() {
  const router = useRouter();

  const todasLasNotas = useMemo(() => [
    "Do", "Do#", "Reb", "Re", "Re#", "Mib", "Mi", "Fa", "Fa#", "Solb", "Sol", "Sol#", "Lab", "La", "La#", "Sib", "Si", "Dob"
  ], []);

  const quizList = useMemo(() => {
    return [...armaduras_data].sort(() => Math.random() - 0.5).slice(0, 24);
  }, []);

  const [step, setStep] = useState(0);
  const [results, setResults] = useState<(null | "correct" | "wrong")[]>(Array(24).fill(null));
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>(Array(24).fill(null));
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  
  // Este estado controlará si el botón "Siguiente" debe ser visible
  const [isReviewing, setIsReviewing] = useState(false);

  const currentQuestion = quizList[step];
  const esPreguntaMayor = currentQuestion?.image.includes(" M.png");
  const respuestaCorrecta = esPreguntaMayor ? currentQuestion?.mayor : currentQuestion?.menor;

  // El progreso máximo alcanzado hasta ahora
  const progresoMaximo = useMemo(() => {
    const index = userAnswers.indexOf(null);
    return index === -1 ? 24 : index;
  }, [userAnswers]);

  const formatearSolucion = (texto: string) => {
    if (!texto) return "";
    return texto.replace('Dos', 'Do#').replace('Res', 'Re#').replace('Fas', 'Fa#').replace('Sols', 'Sol#').replace('Las', 'La#');
  };

  useEffect(() => {
    setIsImageLoading(true);
  }, [step]);

  const handleNoteClick = (notaBoton: string) => {
    if (gameOver || userAnswers[step] !== null) return;
    
    // Al contestar una nueva, dejamos de estar en modo revisión "histórica"
    setIsReviewing(false);

    const primeraPalabraSolucion = respuestaCorrecta?.split(" ")[0] || "";
    const solucionNormalizada = primeraPalabraSolucion
      .replace('Dos', 'Do#').replace('Res', 'Re#')
      .replace('Fas', 'Fa#').replace('Sols', 'Sol#')
      .replace('Las', 'La#');

    const isCorrect = notaBoton === solucionNormalizada;
    
    const newResults = [...results];
    newResults[step] = isCorrect ? "correct" : "wrong";
    setResults(newResults);

    const newAnswers = [...userAnswers];
    newAnswers[step] = notaBoton; 
    setUserAnswers(newAnswers);

    if (step < 23) {
      setTimeout(() => setStep(step + 1), 400);
    } else {
      setTimeout(() => setGameOver(true), 1200);
    }
  };

  const goBack = () => {
    setIsReviewing(true); // Activamos el modo revisión al ir atrás
    setStep(prev => Math.max(0, prev - 1));
  };

  const goNext = () => {
    const nextStep = step + 1;
    setStep(nextStep);
    
    // Si al avanzar llegamos a la pregunta que aún no se ha contestado,
    // o a la última contestada, ocultamos el botón Siguiente
    if (nextStep >= progresoMaximo) {
      setIsReviewing(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-cover bg-center overflow-hidden"
         style={{ backgroundImage: "url('/assets/background.jpeg')" }}>
      
      <button onClick={() => router.push("/play")} className="absolute top-8 left-8 text-white/50 hover:text-white text-[10px] font-bold uppercase tracking-widest bg-black/20 px-4 py-2 rounded-full border border-white/10 z-20">
        ← Menú Principal
      </button>

      <div className="mb-6 text-center">
        <h2 className="text-white text-2xl font-light tracking-wide">
          ¿Qué tonalidad <span className={`font-black border-b-4 uppercase italic px-2 ${esPreguntaMayor ? 'border-amber-400' : 'border-sky-400'}`}>
            {esPreguntaMayor ? "Mayor" : "Menor"}
          </span> indica esta armadura?
        </h2>
      </div>

      <div className="relative flex flex-col items-center w-full max-w-md mb-8">
        <div className="bg-white p-8 rounded-[3.5rem] shadow-2xl w-full h-48 flex items-center justify-center border-4 border-white relative">
          <div className="absolute top-4 right-6 text-black/5 font-black italic text-xl">#{step + 1}</div>
          {currentQuestion && (
            <img 
              key={currentQuestion.image} 
              src={encodeURI(currentQuestion.image)} 
              alt="Armadura" 
              onLoad={() => setIsImageLoading(false)}
              className={`max-h-full transition-all duration-300 ${isImageLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`} 
            />
          )}
        </div>

        {/* SOLUCIÓN: Solo visible si hemos vuelto atrás (isReviewing) y hay respuesta */}
        <div className={`absolute -bottom-12 left-0 right-0 z-30 transition-all duration-500 transform ${isReviewing && userAnswers[step] !== null ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95 pointer-events-none'}`}>
          <div className="mx-auto w-48 h-16 rounded-2xl border-2 border-amber-400/50 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center shadow-2xl">
            <span className="text-[8px] text-amber-400 uppercase font-black tracking-widest">Solución</span>
            <span className="text-xl font-black text-white italic uppercase tracking-tighter" style={{ fontFamily: 'Chaney, sans-serif' }}>
              {formatearSolucion(respuestaCorrecta || "")}
            </span>
          </div>
        </div>
      </div>

      <div className={`bg-black/40 p-8 rounded-[3rem] border border-white/10 w-full max-w-6xl backdrop-blur-md transition-all ${userAnswers[step] !== null ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
        <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-9 gap-4">
          {todasLasNotas.map(nota => (
            <button 
              key={nota} 
              disabled={userAnswers[step] !== null || gameOver} 
              onClick={() => handleNoteClick(nota)} 
              className="py-5 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-amber-500/10 hover:border-amber-500/50 transition-all shadow-sm active:scale-95"
              style={{ fontFamily: 'Chaney, sans-serif', fontStyle: 'italic', fontWeight: 'bold' }}
            >
              <span className="text-sm uppercase tracking-tighter">{nota}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="w-full max-w-2xl flex flex-col items-center gap-6 mt-12">
        <div className="flex gap-4 h-10 items-center">
          <button 
            onClick={goBack} 
            className={`px-6 py-2 bg-white/5 border border-white/10 text-white text-[10px] font-bold rounded-full uppercase tracking-widest hover:bg-white/10 transition-all ${step === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          >
            ← Anterior
          </button>

          {/* Botón Siguiente: Solo si isReviewing es verdadero y no estamos en la última posible */}
          <button 
            onClick={goNext} 
            className={`px-6 py-2 bg-amber-500 text-black text-[10px] font-bold rounded-full uppercase tracking-widest hover:scale-105 transition-all 
              ${(isReviewing && step < progresoMaximo) ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
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