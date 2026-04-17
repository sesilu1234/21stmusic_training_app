"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Play, Music, Clock, ListOrdered } from "lucide-react";

export default function SetupPage() {
  const router = useRouter();
  const [mode, setMode] = useState("single");
  const [timer, setTimer] = useState("60");
  const [questions, setQuestions] = useState("10");

  const handleStart = () => {
    // Pasamos los datos por la URL
    router.push(`/diapason/play?mode=${mode}&time=${timer}&q=${questions}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white text-center">
          <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
            <Music size={32} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Note Master Pro</h1>
        </div>

        <div className="p-8 space-y-8">
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Settings size={14} /> Modo
            </label>
            <div className="grid grid-cols-2 gap-3">
              {["single", "all"].map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`p-4 rounded-2xl border-2 transition-all font-semibold ${
                    mode === m
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-slate-100 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {m === "single" ? "Una Cuerda" : "Todas"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Clock size={14} /> Tiempo
              </label>
              <select
                value={timer}
                onChange={(e) => setTimer(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 outline-none transition-all cursor-pointer font-medium"
              >
                <option value="30">30 seg</option>
                <option value="60">60 seg</option>
                <option value="120">2 min</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ListOrdered size={14} /> Notas
              </label>
              <select
                value={questions}
                onChange={(e) => setQuestions(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 outline-none transition-all cursor-pointer font-medium"
              >
                <option value="10">10 preguntas</option>
                <option value="20">20 preguntas</option>
                <option value="50">50 preguntas</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleStart}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
          >
            ACEPTAR Y EMPEZAR <Play size={18} fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
}
