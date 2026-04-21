"use client";
import { useState, useEffect } from "react";
import { chords_images } from "./chords_images";

export default function GamePage() {
  const [currentQuestion, setCurrentQuestion] = useState<{
    image: string;
    answer: string;
  } | null>(null);

  const [step, setStep] = useState(0);
  const [results, setResults] = useState<(null | "correct" | "wrong")[]>(
    Array(10).fill(null),
  );

  const [isImageLoading, setIsImageLoading] = useState(true);

  const notas = ["Mayor", "Menor", "Aumentado", "Disminuido"];

  const notes_images_length = chords_images.length;

  const getRandomImage = () => {
    setIsImageLoading(true);
    const randomIndex = Math.floor(Math.random() * notes_images_length);
    const randomFileName = chords_images[randomIndex];
    setCurrentQuestion(randomFileName);
  };

  useEffect(() => {
    requestAnimationFrame(() => {
      getRandomImage();
    });
  }, []);

  const handleAnswer = (notaSeleccionada: string) => {
    if (step >= 10 || !currentQuestion || isImageLoading) return;

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

    if (step < 9) {
      setStep(step + 1);
      getRandomImage();
    } else {
      const score = newResults.filter((r) => r === "correct").length;
      alert(`¡Juego terminado! Puntuación: ${score}/10`);
    }
  };

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-cover bg-center overflow-hidden"
      style={{ backgroundImage: "url('/assets/background.jpeg')" }}
    >
      {/* Logos */}
      <img
        src="/assets/logo21stCM_no_white_1.png"
        className="absolute top-8 left-12 h-16 md:h-24 shadow-none hidden sm:block"
        alt="logo"
      />
      <img
        src="/assets/logo21stCM_no_white_1.png"
        className="absolute top-8 right-12 h-16 md:h-24 shadow-none hidden sm:block"
        alt="logo"
      />

      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-4xl px-4">
        <h1 className="text-white text-2xl md:text-3xl font-black drop-shadow-lg uppercase tracking-tighter">
          ¿QUÉ NOTA ES?
        </h1>

        {/* Imagen Card */}
        <div className="relative bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-2xl w-full max-w-2xl h-[200px] md:h-[300px] flex items-center justify-center overflow-hidden">
          {currentQuestion && (
            <img
              src={`/assets/diapason_acordes/${currentQuestion.image}`}
              alt="Nota"
              onLoad={() => setIsImageLoading(false)}
              className={`max-w-full max-h-full h-auto rounded-lg transition-opacity duration-300 ${
                isImageLoading ? "opacity-0" : "opacity-100"
              }`}
            />
          )}
        </div>

        {/* Improved Buttons Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl">
          {notas.map((nota) => (
            <button
              key={nota}
              disabled={isImageLoading}
              onClick={() => handleAnswer(nota)}
              className="flex items-center justify-center py-4 px-2 bg-white/10 hover:bg-yellow-500 hover:text-black border border-white/20 text-white text-lg md:text-xl font-bold rounded-xl transition-all active:scale-95 backdrop-blur-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {nota}
            </button>
          ))}
        </div>

        <p className="text-white/20 text-[10px] mt-4 uppercase tracking-[0.2em]">
          21st Century Music
        </p>

        {/* Progress Panel - Adjusted for better responsiveness */}
        <div className="hidden xl:flex absolute -right-48 top-1/2 -translate-y-1/2 flex-col items-center gap-3">
          <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">
            Progreso
          </p>
          <div className="grid grid-cols-2 gap-3 bg-black/30 p-4 rounded-2xl backdrop-blur-sm border border-white/10 shadow-2xl">
            {results.map((res, index) => (
              <div
                key={index}
                className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  index === step
                    ? "border-yellow-400 bg-gray-600 scale-110 shadow-[0_0_15px_rgba(250,204,21,0.5)] text-white"
                    : "border-white/10 bg-white/5 text-white/40"
                } ${res === "correct" ? "!bg-green-500 !border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.4)] !text-white" : ""} ${
                  res === "wrong"
                    ? "!bg-red-500 !border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.4)] !text-white"
                    : ""
                }`}
              >
                {index + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}