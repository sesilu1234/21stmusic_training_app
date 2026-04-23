"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { diapason_data } from "./diapason_data";
import { CheckCircle2, XCircle } from "lucide-react";

export default function DiapasonGame() {
  const router = useRouter();

  const botonesNotas = [
    "Do", "Do#/Reb", "Re", "Re#/Mib", "Mi", "Fa", "Fa#/Solb", "Sol", "Sol#/Lab", "La", "La#/Sib", "Si"
  ];

  const quizList = useMemo(() => {
    return [...diapason_data].sort(() => Math.random() - 0.5).slice(0, 24);
  }, []);

  const [step, setStep] = useState(0);
  const [results, setResults] = useState<(null | "correct" | "wrong")[]>(Array(24).fill(null));
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>(Array(24).fill(null));
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [showFeedback, setShowFeedback] = useState<null | "correct" | "wrong">(null);

  const currentQuestion = quizList[step];

  useEffect(() => {
    quizList.forEach((q) => {
      const img = new Image();
      img.src = encodeURI(q.image);
    });
  }, [quizList]);

  useEffect(() => {
    setIsImageLoading(true);
    const img = new Image();
    img.src = encodeURI(currentQuestion.image);
    if (img.complete) setIsImageLoading(false);
  }, [step, currentQuestion.image]);

  const progresoMaximo = useMemo(() => {
    const firstEmpty = userAnswers.indexOf(null);
    return firstEmpty === -1 ? 24 : firstEmpty;
  }, [userAnswers]);

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

    // VELOCIDAD ULTRA: 250ms si aciertas, 600ms si fallas
    const delay = isCorrect ? 250 : 600;

    setTimeout(() => {
      setShowFeedback(null);
      if (step < 23) {
        setStep(step + 1);
      } else {
        setGameOver(true);
      }
    }, delay);
  };

  const goBack = () => {
    setIsReviewing(true);
    setShowFeedback(null);
    setStep(prev => Math.max(0, prev - 1));
  };

  const goNext = () => {
    if (step < 23) {
      const nextStep = step + 1;
      setStep(nextStep);
      setShowFeedback(null);
      if (nextStep >= progresoMaximo) setIsReviewing(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-900 bg-cover bg-center overflow-x-hidden"
         style={{ backgroundImage: "url('/assets/background.jpeg')" }}>
      
      <div className="absolute top-8 left-12 z-20">
        <button 
          onClick={() => router.push("/play")} 
          className="text-white/50 hover:text-white text-[10px] font-bold uppercase tracking-widest bg-black/40 px-6 py-2.5 rounded-full border border-white/10 transition-all hover:bg-black/60"
        >
          ← Menú Principal
        </button>
      </div>

      <div className="absolute top-24 left-0 right-0 flex justify-between px-32 pointer-events-none z-0">
        <img src="/assets/logo21stCM_no_white_1.png" className="h-28 w-auto drop-shadow-2xl opacity-90" alt="logo" />
        <img src="/assets/logo21stCM_no_white_1.png" className="h-28 w-auto drop-shadow-2xl opacity-90" alt="logo" />
      </div>

      <div className="min-h-screen bg-black/10 flex flex-col items-center justify-center p-6 z-10">
        
        <div className="mb-6 text-center mt-20">
          <h2 className="text-white text-3xl font-black italic tracking-tighter leading-tight" 
              style={{ fontFamily: 'Chaney, sans-serif' }}>
            ¿<span className="uppercase">Q</span>ué <span className="text-black mx-2 drop-shadow-[0_1.2px_1.2px_rgba(255,255,255,0.8)] uppercase">NOTA</span> es?
          </h2>
        </div>

        <div className="relative flex flex-col items-center w-full max-w-md mb-8">
          <div className={`bg-white p-8 rounded-[3.5rem] shadow-2xl w-full h-48 flex items-center justify-center border-4 relative overflow-hidden transition-all duration-150 ${
            showFeedback === "correct" ? "border-green-500 scale-[1.01]" : 
            showFeedback === "wrong" ? "border-red-500" : "border-white"
          }`}>
            <div className="absolute top-4 right-6 text-black/5 font-black italic text-xl">#{step + 1}</div>
            
            {showFeedback && (
              <div className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-[1px]">
                {showFeedback === "correct" ? (
                  <CheckCircle2 className="text-green-500 w-24 h-24 animate-in zoom-in duration-150 fill-green-500/10" />
                ) : (
                  <div className="flex flex-col items-center animate-in zoom-in duration-150">
                    <XCircle className="text-red-500 w-20 h-20 fill-red-500/10" />
                  </div>
                )}
              </div>
            )}

            <img 
              key={currentQuestion.image} 
              src={encodeURI(currentQuestion.image)} 
              alt="Nota" 
              onLoad={() => setIsImageLoading(false)}
              className={`max-h-full transition-opacity duration-100 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`} 
            />
          </div>

          <div className={`absolute -bottom-12 left-0 right-0 z-30 transition-all duration-200 transform ${ (isReviewing || showFeedback === "wrong") && userAnswers[step] !== null ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}>
            <div className="mx-auto w-44 h-14 rounded-2xl border-2 border-amber-400/50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center shadow-2xl">
              <span className="text-[7px] text-amber-400 uppercase font-black tracking-widest">Solución</span>
              <span className="text-sm font-bold text-white font-sans">{currentQuestion?.answer}</span>
            </div>
          </div>
        </div>

        {/* Botones con opacidad menos agresiva para no distraer tanto en el salto rápido */}
        <div className={`bg-black/40 p-8 rounded-[3rem] border border-white/10 w-full max-w-6xl backdrop-blur-md transition-opacity duration-150 ${userAnswers[step] !== null || showFeedback ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {botonesNotas.map(nota => (
              <button 
                key={nota} 
                disabled={userAnswers[step] !== null || !!showFeedback} 
                onClick={() => handleAnswer(nota)} 
                className="py-5 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-amber-500 hover:text-black transition-all active:scale-90"
              >
                <span className="text-sm font-semibold font-sans">{nota}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="w-full max-w-4xl mt-16 flex items-center justify-center gap-4 px-4">
          <button onClick={goBack} className={`shrink-0 px-6 py-3 bg-white/5 border border-white/10 text-white text-[10px] font-bold rounded-full uppercase transition-all ${step === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>← Anterior</button>

          <div className="flex flex-wrap justify-center gap-1.5 p-3 bg-black/20 rounded-2xl border border-white/5 shadow-inner">
            {results.map((res, i) => (
              <div 
                key={i} 
                onClick={() => { if(userAnswers[i] !== null) { setIsReviewing(true); setStep(i); } }}
                className={`w-6 h-6 rounded-md border flex items-center justify-center text-[8px] font-black cursor-pointer transition-all ${
                  res === "correct" ? "bg-green-500 text-white border-green-400" : 
                  res === "wrong" ? "bg-red-500 text-white border-red-400" : 
                  i === step ? "border-amber-400 bg-white/20 text-white scale-110 shadow-[0_0_10px_rgba(251,191,36,0.3)]" : "border-white/5 text-white/10"
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>

          <button onClick={goNext} className={`shrink-0 px-8 py-3 bg-amber-500 text-black text-[10px] font-black rounded-full uppercase transition-all shadow-xl shadow-amber-500/20 ${ isReviewing || (userAnswers[step] !== null && !showFeedback) ? 'opacity-100' : 'opacity-0 pointer-events-none' }`}>Siguiente →</button>
        </div>

        <footer className="py-12 text-center text-slate-600 text-[8px] tracking-[0.8em] uppercase">© 2026 21st Century Music</footer>
      </div>

      {gameOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md">
          <div className="text-center p-12 bg-white/5 rounded-[4rem] border border-white/10 max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-300">
            <h2 className="text-4xl font-black text-white mb-2 uppercase italic tracking-tighter" style={{ fontFamily: 'Chaney, sans-serif' }}>¡Hecho!</h2>
            <div className="text-5xl font-black text-amber-400 my-8 italic" style={{ fontFamily: 'Chaney, sans-serif' }}>{results.filter(r => r === "correct").length}<span className="text-white/20 text-2xl mx-2">/</span>24</div>
            <button onClick={() => window.location.reload()} className="w-full py-4 bg-amber-500 text-black font-black rounded-2xl text-xs uppercase hover:scale-105 transition-all">Reiniciar</button>
          </div>
        </div>
      )}
    </div>
  );
}