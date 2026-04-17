"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronLeft, CheckCircle2, Music } from "lucide-react";

export default function GamePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Obtenemos los valores de la URL
  const mode = searchParams.get("mode") || "single";
  const time = searchParams.get("time") || "60";
  const totalQ = searchParams.get("q") || "10";

  return (
    <div className="min-h-screen bg-white flex flex-col items-center p-6">
      {/* Header del Juego */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-12">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-semibold transition-colors"
        >
          <ChevronLeft /> Volver
        </button>

        <div className="flex gap-4">
          <div className="px-6 py-2 bg-indigo-50 text-indigo-700 rounded-full font-bold border border-indigo-100">
            ⏱️ {time}s
          </div>
          <div className="px-6 py-2 bg-slate-900 text-white rounded-full font-bold">
            Modo: {mode.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Área Central: La Nota */}
      <div className="flex-1 w-full max-w-xl flex flex-col justify-center items-center">
        <div className="w-full aspect-video bg-slate-50 rounded-[40px] border-4 border-slate-100 flex flex-col items-center justify-center mb-12 shadow-inner group transition-all hover:border-indigo-200">
          <div className="text-9xl mb-4 animate-bounce">🎸</div>
          <p className="text-slate-400 font-medium tracking-widest uppercase">
            Identifica la nota
          </p>
        </div>

        {/* Teclado de Opciones */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 w-full">
          {["C", "D", "E", "F", "G", "A", "B"].map((nota) => (
            <button
              key={nota}
              className="h-20 rounded-2xl bg-white border-2 border-slate-100 hover:border-indigo-500 hover:text-indigo-600 hover:shadow-xl hover:shadow-indigo-100 font-black text-2xl transition-all active:scale-90"
            >
              {nota}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-12 text-slate-300 font-medium">
        Progreso: 1 de {totalQ}
      </div>
    </div>
  );
}
