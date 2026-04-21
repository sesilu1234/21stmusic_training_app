"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { armaduras_data, ArmaduraData } from "./notes_images";

export default function ArmadurasGame() {
  const router = useRouter();
  
  // 1. FILTRADO Y MEZCLA SEGURO
  // Solo usamos las preguntas que existen físicamente en tu lista armaduras_data
  const quizList = useMemo(() => {
    return [...armaduras_data]
      .sort(() => Math.random() - 0.5)
      .slice(0, 24);
  }, []);

  const [step, setStep] = useState(0);
  const [results, setResults] = useState<(null | "correct" | "wrong")[]>(Array(24).fill(null));
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>(Array(24).fill(null));
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [isNavigatingBack, setIsNavigatingBack] = useState(false);

  // LA PREGUNTA ACTUAL: Es un objeto que ya tiene la ruta .image correcta
  const currentQuestion = quizList[step];

  // 2. DETECCIÓN DEL TIPO (MAYOR O MENOR)
  // Blindaje: Miramos si el ARCHIVO termina en " M.png" o " men.png"
  // Esto evita que el juego pregunte "Menor" para un "Dob" que solo tiene imagen "M"
  const isAskingMayor = currentQuestion?.image.toLowerCase().includes(" m.png");

  const notas = useMemo(() => 
    ["Do", "Do#", "Reb", "Re", "Re#", "Mib", "Mi", "Fa", "Fa#", "Solb", "Sol", "Sol#", "Lab", "La", "La#", "Sib", "Si", "Dob"].sort()
  , []);

  useEffect(() => {
    setIsImageLoading(true);
  }, [step]);

  const handleNoteClick = (n: string) => {
    if (gameOver || userAnswers[step] !== null) return;

    setIsNavigatingBack(false);

    // Comparamos contra la propiedad exacta del objeto cargado
    const correctAnswer = isAskingMayor ? currentQuestion?.mayor : currentQuestion?.menor;
    const isCorrect = n === correctAnswer;
    
    const newResults = [...results];
    newResults[step] = isCorrect ? "correct" : "wrong";
    setResults(newResults);

    const newAnswers = [...userAnswers];
    newAnswers[step] = n;
    setUserAnswers(newAnswers);

    if (step < 23) {
      setTimeout(() => setStep(step + 1), 200); 
    } else {
      setGameOver(true);
    }
  };

  const goBack = () => {
    setIsNavigatingBack(true);
    setStep(prev => Math.max(0, prev - 1));
  };

  const goNext = () => {
    if (userAnswers[step + 1] === null) setIsNavigatingBack(false);
    setStep(prev => Math.min(23, prev + 1));
  };

  const resetGame = () => window.location.reload();

  const isReviewing = userAnswers[step] !== null;
  const showNextButton = isNavigatingBack && isReviewing && step < 23;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-cover bg-center overflow-hidden"
         style={{ backgroundImage: "url('/assets/background.jpeg')" }}>
      
      <button onClick={() => router.push("/play")} className="absolute top-8 left-8 text-white/50 hover:text-white text-[10px] font-bold uppercase tracking-widest bg-black/20 px-4 py-2 rounded-full border border-white/10 z-20">
        ← Menú Principal
      </button>

      {gameOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
          <div className="text-center text-white p-10 bg-white/5 rounded-[3rem] border border-white/10 shadow-2xl">
            <h2 className="text-4xl font-black mb-4 italic tracking-tighter uppercase">¡Finalizado!</h2>
            <p className="text-xl mb-8 font-light">Puntuación: <span className="text-amber-400 font-bold">{results.filter(r => r === "correct").length}</span> / 24</p>
            <div className="flex gap-4">
              <button onClick={resetGame} className="px-8 py-4 bg-amber-500 text-black font-black rounded-2xl hover:scale-105 transition-all uppercase text-xs">Reintentar</button>
              <button onClick={() => router.push("/play")} className="px-8 py-4 bg-white/10 text-white font-black rounded-2xl border border-white/10 hover:bg-white/20 transition-all uppercase text-xs">Salir</button>
            </div>
          </div>
        </div>
      )}

      {/* TITULO DINÁMICO: Solo dice lo que el ARCHIVO indica */}
      <div className="mb-6 text-center">
        <h2 className="text-white text-2xl font-light tracking-wide">
          ¿Qué tonalidad <span className={`font-black border-b-4 uppercase italic px-2 transition-colors ${isAskingMayor ? 'border-amber-400' : 'border-sky-400'}`}>
            {isAskingMayor ? "Mayor" : "Menor"}
          </span> indica esta armadura?
        </h2>
        {isReviewing && <p className="text-amber-500/60 text-[10px] font-bold mt-2 tracking-widest uppercase">Modo Revisión</p>}
      </div>

      {/* IMAGEN: CARGA DIRECTA Y ÚNICA */}
      <div className="bg-white/95 p-10 rounded-[3.5rem] shadow-2xl mb-8 w-full max-w-md h-52 flex items-center justify-center border-4 border-white/20 relative">
        <div className="absolute top-4 right-6 text-black/10 font-black italic text-xl">#{step + 1}</div>
        {currentQuestion && (
          <img 
            key={currentQuestion.image} 
            src={currentQuestion.image} // RUTA LITERAL DEL ARRAY
            alt="Armadura" 
            onLoad={() => setIsImageLoading(false)}
            className={`max-h-full transition-all duration-300 ${isImageLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`} 
          />
        )}
      </div>

      {/* TECLADO */}
      <div className={`bg-black/30 p-8 rounded-[3rem] border border-white/10 w-full max-w-2xl backdrop-blur-lg transition-all ${isReviewing ? 'opacity-50' : 'opacity-100'}`}>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {notas.map(n => {
            const isThisSelected = userAnswers[step] === n;
            const isCorrect = results[step] === "correct";
            return (
              <button key={n} disabled={isReviewing || gameOver} onClick={() => handleNoteClick(n)} 
                className={`py-4 rounded-2xl border text-sm font-bold transition-all
                  ${isThisSelected 
                    ? (isCorrect ? "bg-green-500 text-white border-green-400" : "bg-red-500 text-white border-red-400") 
                    : "bg-white/5 border-white/10 text-white hover:bg-white/10"}`}>
                {n}
              </button>
            );
          })}
        </div>
      </div>

      {/* NAVEGACIÓN */}
      <div className="w-full max-w-2xl flex flex-col items-center gap-6 mt-8">
        <div className="flex gap-4 h-10 items-center">
          {step > 0 && (
            <button onClick={goBack} className="px-6 py-2 bg-white/5 border border-white/10 text-white text-[10px] font-bold rounded-full uppercase tracking-widest">
              ← Anterior
            </button>
          )}
          {showNextButton && (
            <button onClick={goNext} className="px-6 py-2 bg-amber-500 text-black text-[10px] font-bold rounded-full uppercase tracking-widest">
              Siguiente →
            </button>
          )}
        </div>

        <div className="grid grid-cols-8 sm:grid-cols-12 gap-1.5 p-4 bg-black/20 rounded-2xl border border-white/5">
          {results.map((res, i) => (
            <div key={i} 
              onClick={() => { if(userAnswers[i] !== null) { setIsNavigatingBack(true); setStep(i); } }} 
              className={`w-6 h-6 rounded-md border flex items-center justify-center text-[8px] font-black cursor-pointer ${
                res === "correct" ? "bg-green-500 text-white border-green-400" : 
                res === "wrong" ? "bg-red-500 text-white border-red-400" : 
                i === step ? "border-amber-400 bg-white/20 text-white scale-110" : "border-white/5 text-white/10"
              }`}>
              {i + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}