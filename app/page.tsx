"use client";

import { Music2, ArrowLeft, Sun, Moon } from "lucide-react";
import React, { useState } from "react";
import Link from "next/link";
import {
  Hash,
  Target,
  Headphones,
  History,
  Gamepad2,
  StickyNote,
  Plus,
  Activity,
  Music,
  Layers,
  BookOpen,
} from "lucide-react";

interface Juego {
  id: number;
  titulo: string;
  desc: string;
  icon: any;
  bg: string;
  accent: string;
  slug: string;
  hasSubmenu?: boolean;
}

interface Nota {
  id: number;
  fecha: string;
  contenido: string;
}

const juegos: Juego[] = [
  {
    id: 1,
    titulo: "Armaduras",
    desc: "Identifica tonalidades y alteraciones.",
    icon: Hash,
    bg: "bg-amber-500/20",
    accent: "text-amber-400",
    slug: "/play/armadura",
  },
  {
    id: 2,
    titulo: "Diapasón",
    desc: "Ubica notas en el mástil rápidamente.",
    icon: Target,
    bg: "bg-sky-500/20",
    accent: "text-sky-400",
    slug: "/play/diapason",
  },
  {
    id: 3,
    titulo: "Acordes",
    desc: "Reconoce la estructura de los acordes.",
    icon: Headphones,
    bg: "bg-emerald-500/20",
    accent: "text-emerald-400",
    slug: "/play/diapason_acordes",
    hasSubmenu: true,
  },
  {
    id: 4,
    titulo: "Modos Griegos",
    desc: "Identifica escalas y modos en el pentagrama.",
    icon: Music2,
    bg: "bg-indigo-500/20",
    accent: "text-indigo-400",
    slug: "/play/modos",
  },
  {
    id: 5,
    titulo: "Intervalos",
    desc: "Mide la distancia entre dos notas.",
    icon: Activity,
    bg: "bg-fuchsia-500/20",
    accent: "text-fuchsia-400",
    slug: "/play/intervalos",
    hasSubmenu: true, // Habilitado submenú
  },
  {
    id: 6,
    titulo: "Trivial",
    desc: "Cultura general de guitarra y artistas.",
    icon: Music,
    bg: "bg-red-500/20",
    accent: "text-red-400",
    slug: "/play/trivia",
  },
  {
    id: 7,
    titulo: "Ritmo",
    desc: "Pulsa al ritmo exacto de la partitura.",
    icon: Activity,
    bg: "bg-orange-500/20",
    accent: "text-orange-400",
    slug: "/play/ritmo",
  },
];

const historialTabla = [
  {
    fecha: "Hoy",
    armaduras: "24/24",
    diapason: "20/24",
    acordes: "18/24",
    intervalos: "21/24",
  },
  {
    fecha: "Ayer",
    armaduras: "22/24",
    diapason: "15/24",
    acordes: "24/24",
    intervalos: "19/24",
  },
];

export default function Home() {
  const [view, setView] = useState<"juegos" | "progreso" | "notas">("juegos");
  const [showAcordesMenu, setShowAcordesMenu] = useState(false);
  const [showIntervalosMenu, setShowIntervalosMenu] = useState(false); // Estado para Intervalos
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notas, setNotas] = useState<Nota[]>([
    {
      id: 1,
      fecha: "21/04/2026",
      contenido: "Repasar la escala de Mi bemol mayor, me cuesta el diapasón.",
    },
  ]);
  const [nuevaNota, setNuevaNota] = useState("");

  const agregarNota = () => {
    if (!nuevaNota.trim()) return;
    const nota: Nota = {
      id: Date.now(),
      fecha: new Date().toLocaleDateString("es-ES"),
      contenido: nuevaNota,
    };
    setNotas([nota, ...notas]);
    setNuevaNota("");
  };

  return (
    <div className="min-h-screen relative overflow-hidden font-sans text-white">
      {/* BACKGROUND */}
      <div
        className="fixed inset-0 bg-cover bg-center transition-transform duration-1000 ease-out z-0"
        style={{
          backgroundImage: "url('/assets/background.jpeg')",
          transform:
            showAcordesMenu || showIntervalosMenu ? "scale(1.1)" : "scale(1)",
        }}
      >
        {isDarkMode ? (
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-[2px] transition-all duration-500" />
        ) : (
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[0px] transition-all duration-500" />
        )}
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* NAVBAR */}
        <div className="pt-3 px-3 md:pt-4 md:px-4">
          <nav className="max-w-5xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-3 py-2 md:px-4 md:py-3 flex justify-between items-center gap-2 shadow-2xl">
            <div className="flex items-center gap-2 md:gap-4 min-w-0">
              <img
                src="/assets/logo21stCM_no_white_1.png"
                className="h-10 md:h-16 lg:h-24 w-auto flex-shrink-0"
                alt="logo"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-white italic font-black tracking-tighter text-sm md:text-xl lg:text-5xl leading-tight ">
                  21st Century Music
                </span>
                <span className="font-light tracking-widest text-[6px] md:text-[8px] uppercase text-amber-400">
                  ESCUELA DE MÚSICA MODERNA
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 md:gap-8 flex-shrink-0">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-amber-400"
              >
                {!isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {[
                { key: "juegos", label: "Juegos", Icon: Gamepad2 },
                { key: "progreso", label: "Progreso", Icon: History },
                { key: "notas", label: "Notas", Icon: StickyNote },
              ].map(({ key, label, Icon }) => (
                <button
                  key={key}
                  onClick={() => {
                    setView(key as any);
                    setShowAcordesMenu(false);
                    setShowIntervalosMenu(false);
                  }}
                  className={`pb-0.5 flex flex-col md:flex-row items-center gap-1 text-[8px] md:text-[10px] font-bold uppercase tracking-[0.15em] md:tracking-[0.2em] transition-colors
                    ${view === key ? "text-white border-b border-amber-400" : "text-slate-400 hover:text-white"}`}
                >
                  <Icon size={13} className="md:hidden" />
                  <Icon size={14} className="hidden md:block" />
                  <span className="hidden md:inline">{label}</span>
                </button>
              ))}
            </div>
          </nav>
        </div>

        {/* MAIN */}
        <main className="flex-1 flex flex-col">
          {view === "juegos" && !showAcordesMenu && !showIntervalosMenu && (
            <div className="flex-1 flex flex-col justify-center items-center px-3 md:px-6 py-6 md:py-10 animate-fadeIn">
              <header className="mb-6 md:mb-10 text-center px-2">
                <h1 className="text-lg sm:text-5xl md:text-7xl lg:text-5xl italic  tracking-tighter text-white leading-none">
                  escuelademusicamoderna.com
                </h1>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 max-w-6xl w-full">
                {juegos.map((j) => (
                  <button
                    key={j.id}
                    onClick={() => {
                      if (j.titulo === "Acordes") setShowAcordesMenu(true);
                      else if (j.titulo === "Intervalos")
                        setShowIntervalosMenu(true);
                      else window.location.href = j.slug;
                    }}
                    className="group flex items-center md:flex-col md:items-start gap-4 md:gap-0 p-4 md:p-8 rounded-2xl md:rounded-3xl border bg-black/40 border-white/10 hover:bg-black/60 hover:scale-[1.02] md:hover:scale-105 backdrop-blur-md transition-all text-left shadow-xl"
                  >
                    <div
                      className={`w-11 h-11 md:w-14 md:h-14 flex-shrink-0 rounded-xl md:rounded-2xl flex items-center justify-center md:mb-6 ${j.bg}`}
                    >
                      <j.icon size={22} className={j.accent} />
                    </div>
                    <div>
                      <h2 className="text-sm md:text-xl italic font-black text-white group-hover:text-amber-400 transition-colors uppercase">
                        {j.titulo}
                      </h2>
                      <p className="text-[10px] md:text-xs text-slate-400 leading-relaxed font-light">
                        {j.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ACORDES SUBMENU */}
          {view === "juegos" && showAcordesMenu && (
            <div className="flex-1 flex flex-col justify-center items-center px-3 md:px-6 py-6 md:py-10 animate-fadeIn">
              <div className="w-full max-w-4xl">
                <button
                  onClick={() => setShowAcordesMenu(false)}
                  className="group mb-6 md:mb-8 text-white/40 hover:text-emerald-400 text-[10px] uppercase tracking-[0.3em] transition-colors flex items-center gap-2"
                >
                  <ArrowLeft
                    size={12}
                    className="group-hover:-translate-x-1 transition-transform"
                  />
                  Volver
                </button>
                <h2 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl italic font-black text-white mb-8 md:mb-12 leading-tight uppercase">
                  Modo de{" "}
                  <span className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                    Acordes
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-10">
                  <Link href="/play/acordes/diapason_triadas" className="group">
                    <div className="relative overflow-hidden bg-slate-900/60 p-6 md:p-12 rounded-[1.5rem] md:rounded-[2rem] border border-white/10 transition-all duration-500 hover:border-emerald-500/50 hover:bg-slate-800/80 hover:-translate-y-1 shadow-xl">
                      <div className="flex items-center md:flex-col md:items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                          <Music2 size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl md:text-3xl font-bold text-white mb-1 uppercase italic">
                            Tríadas
                          </h3>
                          <p className="text-white/40 text-xs md:text-base font-light">
                            Fundamental, tercera y quinta.
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                  <Link
                    href="/play/acordes/diapason_septimas"
                    className="group"
                  >
                    <div className="relative overflow-hidden bg-slate-900/60 p-6 md:p-12 rounded-[1.5rem] md:rounded-[2rem] border border-white/10 transition-all duration-500 hover:border-emerald-500/50 hover:bg-slate-800/80 hover:-translate-y-1 shadow-xl">
                      <div className="flex items-center md:flex-col md:items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                          <Layers size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl md:text-3xl font-bold text-white mb-1 uppercase italic">
                            Séptimas
                          </h3>
                          <p className="text-white/40 text-xs md:text-base font-light">
                            Acordes de 4 notas. Color y tensión.
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* INTERVALOS SUBMENU */}
          {view === "juegos" && showIntervalosMenu && (
            <div className="flex-1 flex flex-col justify-center items-center px-3 md:px-6 py-6 md:py-10 animate-fadeIn">
              <div className="w-full max-w-4xl">
                <button
                  onClick={() => setShowIntervalosMenu(false)}
                  className="group mb-6 md:mb-8 text-white/40 hover:text-fuchsia-400 text-[10px] uppercase tracking-[0.3em] transition-colors flex items-center gap-2"
                >
                  <ArrowLeft
                    size={12}
                    className="group-hover:-translate-x-1 transition-transform"
                  />
                  Volver
                </button>
                <h2 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl italic font-black text-white mb-8 md:mb-12 leading-tight uppercase">
                  Modo de{" "}
                  <span className="text-fuchsia-400 drop-shadow-[0_0_15px_rgba(192,38,211,0.3)]">
                    Intervalos
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-10">
                  <Link href="/play/intervalos/pentagrama" className="group">
                    <div className="relative overflow-hidden bg-slate-900/60 p-6 md:p-12 rounded-[1.5rem] md:rounded-[2rem] border border-white/10 transition-all duration-500 hover:border-fuchsia-500/50 hover:bg-slate-800/80 hover:-translate-y-1 shadow-xl">
                      <div className="flex items-center md:flex-col md:items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400">
                          <BookOpen size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl md:text-3xl font-bold text-white mb-1 uppercase italic">
                            Pentagrama
                          </h3>
                          <p className="text-white/40 text-xs md:text-base font-light">
                            Identifica intervalos visualmente en partitura.
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                  <Link href="/play/intervalos/diapason" className="group">
                    <div className="relative overflow-hidden bg-slate-900/60 p-6 md:p-12 rounded-[1.5rem] md:rounded-[2rem] border border-white/10 transition-all duration-500 hover:border-fuchsia-500/50 hover:bg-slate-800/80 hover:-translate-y-1 shadow-xl">
                      <div className="flex items-center md:flex-col md:items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400">
                          <Target size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl md:text-3xl font-bold text-white mb-1 uppercase italic">
                            Diapasón
                          </h3>
                          <p className="text-white/40 text-xs md:text-base font-light">
                            Ubica y mide distancias sobre el mástil.
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* PROGRESO */}
          {view === "progreso" && (
            <div className="flex-1 flex flex-col justify-center items-center px-3 md:px-6 py-6 md:py-10 animate-fadeIn">
              <div className="w-full max-w-5xl">
                <h2 className="text-2xl md:text-4xl italic font-black text-white mb-6 md:mb-8 uppercase tracking-tighter">
                  Tu <span className="text-amber-400">P</span>rogreso
                </h2>
                <div className="block md:hidden space-y-4">
                  {historialTabla.map((fila, i) => (
                    <div
                      key={i}
                      className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4"
                    >
                      <div className="text-amber-400 font-bold text-xs uppercase tracking-widest mb-3">
                        {fila.fecha}
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-[10px]">
                        <div className="bg-white/5 p-2 rounded-lg">
                          <span className="text-slate-500 block">
                            ARMADURAS
                          </span>{" "}
                          {fila.armaduras}
                        </div>
                        <div className="bg-white/5 p-2 rounded-lg">
                          <span className="text-slate-500 block">DIAPASÓN</span>{" "}
                          {fila.diapason}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="hidden md:block overflow-x-auto bg-black/20 rounded-3xl p-6 border border-white/5">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-widest text-slate-500 border-b border-white/10">
                        <th className="pb-4">Fecha</th>
                        <th className="pb-4">Armaduras</th>
                        <th className="pb-4">Diapasón</th>
                        <th className="pb-4">Acordes</th>
                        <th className="pb-4">Intervalos</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {historialTabla.map((f, i) => (
                        <tr
                          key={i}
                          className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                        >
                          <td className="py-4 font-bold">{f.fecha}</td>
                          <td className="py-4 text-amber-400 font-black">
                            {f.armaduras}
                          </td>
                          <td className="py-4 text-sky-400 font-black">
                            {f.diapason}
                          </td>
                          <td className="py-4 text-emerald-400 font-black">
                            {f.acordes}
                          </td>
                          <td className="py-4 text-fuchsia-400 font-black">
                            {f.intervalos}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* NOTAS */}
          {view === "notas" && (
            <div className="flex-1 flex flex-col justify-center items-center px-3 md:px-6 py-6 md:py-10 animate-fadeIn">
              <div className="w-full max-w-3xl">
                <h2 className="text-2xl md:text-4xl italic font-black text-white mb-6 md:mb-8 uppercase tracking-tighter">
                  Mis <span className="text-amber-400">N</span>otas
                </h2>
                <div className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-2xl mb-5 flex gap-3">
                  <textarea
                    value={nuevaNota}
                    onChange={(e) => setNuevaNota(e.target.value)}
                    placeholder="Escribe una nota de estudio..."
                    className="flex-1 bg-transparent text-white text-sm outline-none resize-none h-12 font-light"
                  />
                  <button
                    onClick={agregarNota}
                    className="bg-amber-400 text-black rounded-xl px-4 font-bold hover:bg-amber-300 transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <div className="space-y-3">
                  {notas.map((n) => (
                    <div
                      key={n.id}
                      className="bg-black/30 border border-white/5 p-4 rounded-2xl"
                    >
                      <div className="text-[8px] uppercase text-amber-400 mb-1">
                        {n.fecha}
                      </div>
                      <p className="text-sm text-slate-300 font-light">
                        {n.contenido}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>

        <footer className="py-6 text-center text-slate-600 text-[8px] tracking-widest uppercase">
          © 2026 21st Century Music
        </footer>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease forwards;
        }
      `}</style>
    </div>
  );
}
