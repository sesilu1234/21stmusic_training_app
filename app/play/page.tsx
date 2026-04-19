"use client";
import React, { useState, useRef } from "react";
import {
  Music,
  Hash,
  Target,
  Headphones,
  GraduationCap,
  Play,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";

const juegos = [
  {
    id: 1,
    titulo: "Armaduras",
    sub: "Teoría Visual",
    desc: "Identifica tonalidades y alteraciones en el pentagrama.",
    icon: Hash,
    bg: "bg-amber-500/20",
    accent: "text-amber-400",
    slug: "armaduras",
  },
  {
    id: 2,
    titulo: "Diapasón",
    sub: "Geometría",
    desc: "Ubica notas en el mástil de la guitarra rápidamente.",
    icon: Target,
    bg: "bg-sky-500/20",
    accent: "text-sky-400",
    slug: "diapason",
  },
  {
    id: 3,
    titulo: "Intervalos",
    sub: "Entrenamiento Auditivo",
    desc: "Reconoce la distancia exacta entre dos notas.",
    icon: Headphones,
    bg: "bg-emerald-500/20",
    accent: "text-emerald-400",
    slug: "intervalos",
  },
  {
    id: 4,
    titulo: "Acordes",
    sub: "Armonía",
    desc: "Entrena tu oído con triadas, séptimas e inversiones.",
    icon: Music,
    bg: "bg-rose-500/20",
    accent: "text-rose-400",
    slug: "acordes",
  },
];

export default function Home() {
  const [selectedGame, setSelectedGame] = useState(null);
  const optionsRef = useRef(null);

  const handleSelectGame = (juego) => {
    setSelectedGame(juego);
    // Pequeño delay para que el componente se renderice antes del scroll
    setTimeout(() => {
      optionsRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed font-sans selection:bg-amber-500/30"
      style={{ backgroundImage: "url('/assets/background.jpeg')" }}
    >
      <div className="min-h-screen bg-slate-900/40 backdrop-blur-[2px]">
        {/* Navbar mejorada */}
        <div className="pt-6 px-4">
          <nav className="max-w-5xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-8 py-4 flex justify-between items-center shadow-2xl">
            <div className="flex items-center gap-4">
              <img
                src="/assets/logo21stCM_no_white_1.png"
                className="h-10 w-auto brightness-0 invert opacity-80"
                alt="logo"
              />
              <div className="flex flex-col">
                <span className="font-bold tracking-tighter text-white leading-none">
                  21st Century
                </span>
                <span className="font-light tracking-[0.3em] text-[7px] uppercase text-amber-400">
                  Music Academy
                </span>
              </div>
            </div>
            <div className="hidden md:flex gap-8 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">
              <button className="hover:text-white transition-colors">
                Progreso
              </button>
              <button className="hover:text-white transition-colors">
                Lecciones
              </button>
              <button className="hover:text-white transition-colors border-b border-amber-400 pb-1">
                Juegos
              </button>
            </div>
          </nav>
        </div>

        {/* --- SECCIÓN 1: GRID DE SELECCIÓN --- */}
        <main className="max-w-6xl mx-auto px-6 py-24 min-h-[90vh] flex flex-col justify-center">
          <header className="mb-20 text-center">
            <h1 className="text-6xl md:text-8xl font-thin tracking-tighter text-white mb-6">
              Elige tu{" "}
              <span className="font-serif italic text-amber-400">desafío</span>
            </h1>
            <p className="text-slate-300 font-light text-lg max-w-xl mx-auto">
              Selecciona una disciplina para configurar tu sesión de
              entrenamiento.
            </p>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {juegos.map((j) => (
              <button
                key={j.id}
                onClick={() => handleSelectGame(j)}
                className={`group relative p-8 rounded-[2rem] transition-all duration-500 text-left border ${
                  selectedGame?.id === j.id
                    ? "bg-amber-400 border-amber-400 scale-105 shadow-2xl"
                    : "bg-white/5 border-white/10 hover:bg-white/10 backdrop-blur-md"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-colors ${
                    selectedGame?.id === j.id ? "bg-slate-900" : j.bg
                  }`}
                >
                  <j.icon
                    size={24}
                    className={
                      selectedGame?.id === j.id ? "text-amber-400" : j.accent
                    }
                  />
                </div>

                <h2
                  className={`text-2xl font-bold tracking-tight mb-2 ${selectedGame?.id === j.id ? "text-slate-900" : "text-white"}`}
                >
                  {j.titulo}
                </h2>
                <p
                  className={`text-sm leading-relaxed ${selectedGame?.id === j.id ? "text-slate-800 font-medium" : "text-slate-400"}`}
                >
                  {j.desc}
                </p>

                {selectedGame?.id === j.id && (
                  <div className="absolute top-4 right-4 animate-bounce">
                    <ChevronDown className="text-slate-900" size={20} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </main>

        {/* --- SECCIÓN 2: CONFIGURACIÓN (SCROLL DOWN) --- */}
        <div
          ref={optionsRef}
          className={`min-h-screen transition-all duration-1000 flex items-center justify-center p-6 ${
            selectedGame
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-20 pointer-events-none"
          }`}
        >
          {selectedGame && (
            <div className="w-full max-w-4xl bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row">
              {/* Lateral Informativo */}
              <div
                className={`md:w-1/3 p-12 flex flex-col justify-between ${selectedGame.bg} bg-opacity-10`}
              >
                <div>
                  <button
                    onClick={() =>
                      window.scrollTo({ top: 0, behavior: "smooth" })
                    }
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-8 hover:gap-3 transition-all"
                  >
                    <ArrowLeft size={14} /> Volver arriba
                  </button>
                  <selectedGame.icon
                    size={48}
                    className={`${selectedGame.accent} mb-4`}
                  />
                  <h3 className="text-4xl font-bold text-white mb-2">
                    {selectedGame.titulo}
                  </h3>
                  <p className="text-slate-400 italic text-sm">
                    {selectedGame.sub}
                  </p>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  MOD: 21CM-00{selectedGame.id}
                </div>
              </div>

              {/* Formulario de Opciones */}
              <div className="md:w-2/3 p-12 bg-slate-900/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Columna 1 */}
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] uppercase font-black text-amber-400 tracking-tighter block mb-4">
                        Nivel de dificultad
                      </label>
                      <div className="space-y-2">
                        {["Principiante", "Intermedio", "Maestro"].map(
                          (lvl) => (
                            <button
                              key={lvl}
                              className="w-full text-left py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:border-amber-400 transition-all"
                            >
                              {lvl}
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Columna 2 */}
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] uppercase font-black text-amber-400 tracking-tighter block mb-4">
                        Parámetros
                      </label>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-sm text-slate-300">
                            Tiempo de respuesta
                          </span>
                          <span className="text-xs text-white font-mono">
                            5s
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-sm text-slate-300">
                            Número de rondas
                          </span>
                          <span className="text-xs text-white font-mono">
                            20
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button className="mt-12 w-full bg-white text-slate-900 font-black py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-amber-400 transition-colors group">
                  <Play
                    size={20}
                    fill="currentColor"
                    className="group-hover:scale-110 transition-transform"
                  />
                  EMPEZAR ENTRENAMIENTO
                </button>
              </div>
            </div>
          )}
        </div>

        <footer className="py-20 text-center text-slate-600 text-[8px] tracking-[0.8em] uppercase">
          © 2026 21st Century Music — Crafted for excellence
        </footer>
      </div>
    </div>
  );
}
