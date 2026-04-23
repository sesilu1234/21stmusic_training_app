"use client";

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
  Calendar,
  Activity,
  Music,
  Layers,
  ChevronLeft,
} from "lucide-react";

// --- TIPOS ---
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

// --- DATOS DE JUEGOS ---
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
    titulo: "Intervalos",
    desc: "Mide la distancia entre dos notas.",
    icon: Activity,
    bg: "bg-fuchsia-500/20",
    accent: "text-fuchsia-400",
    slug: "/play/intervalos",
  },
  {
    id: 5,
    titulo: "Trivial",
    desc: "Cultura general de guitarra y artistas.",
    icon: Music,
    bg: "bg-red-500/20",
    accent: "text-red-400",
    slug: "/play/trivia",
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
    <div className="min-h-screen bg-slate-950 relative overflow-hidden font-sans">
      {/* --- BACKGROUND CON ZOOM --- */}
      <div
        className="fixed inset-0 bg-cover bg-center transition-transform duration-1000 ease-out z-0"
        style={{
          backgroundImage: "url('/assets/background.jpeg')",
          transform: showAcordesMenu ? "scale(1.1)" : "scale(1)",
        }}
      >
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* --- NAVBAR --- */}
        <div className="pt-6 px-4">
          <nav className="max-w-5xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl px-8 py-5 flex justify-between items-center shadow-2xl">
            <div className="flex items-center gap-6">
              <img
                src="/assets/logo21stCM_no_white_1.png"
                className="h-24 w-auto brightness-99"
                alt="logo"
              />
              <div className="flex flex-col">
                <span
                  className="text-white italic font-black tracking-tighter text-2xl"
                  style={{ fontFamily: "Chaney" }}
                >
                  21st Century Music
                </span>
                <span className="font-light tracking-[0.3em] text-[8px] uppercase text-amber-400">
                  Music Academy
                </span>
              </div>
            </div>

            <div className="hidden md:flex gap-8 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">
              <button
                onClick={() => {
                  setView("juegos");
                  setShowAcordesMenu(false);
                }}
                className={`transition-all pb-1 flex items-center gap-2 ${view === "juegos" ? "text-white border-b border-amber-400" : "hover:text-white"}`}
              >
                <Gamepad2 size={14} /> Juegos
              </button>
              <button
                onClick={() => setView("progreso")}
                className={`transition-all pb-1 flex items-center gap-2 ${view === "progreso" ? "text-white border-b border-amber-400" : "hover:text-white"}`}
              >
                <History size={14} /> Progreso
              </button>
              <button
                onClick={() => setView("notas")}
                className={`transition-all pb-1 flex items-center gap-2 ${view === "notas" ? "text-white border-b border-amber-400" : "hover:text-white"}`}
              >
                <StickyNote size={14} /> Notas
              </button>
            </div>
          </nav>
        </div>

        {/* --- CONTENEDOR PRINCIPAL --- */}
        <main className="flex-1 relative mt-10">
          {/* SECCIÓN JUEGOS PRINCIPAL (Efecto Zoom Out) */}
          <div
            className={`absolute inset-0 transition-all duration-500 ease-in-out px-6 flex flex-col justify-center items-center 
            ${view === "juegos" && !showAcordesMenu ? "opacity-100 scale-100" : "opacity-0 scale-90 blur-md pointer-events-none"}`}
          >
            <header className="mb-10 text-center">
              <h1
                className="text-5xl md:text-8xl italic font-black tracking-tighter text-white drop-shadow-2xl"
                style={{ fontFamily: "Chaney" }}
              >
                ELIGE TU <span className="text-amber-400">D</span>ESAFÍO
              </h1>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full">
              {juegos.map((j) => (
                <button
                  key={j.id}
                  onClick={() =>
                    j.hasSubmenu
                      ? setShowAcordesMenu(true)
                      : (window.location.href = j.slug)
                  }
                  className="group p-8 rounded-[2.5rem] border bg-black/40 border-white/10 hover:bg-black/60 hover:scale-105 hover:border-amber-400/50 backdrop-blur-md transition-all text-left shadow-2xl"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 ${j.bg}`}
                  >
                    <j.icon size={28} className={j.accent} />
                  </div>
                  <h2
                    className="text-xl italic font-black text-white uppercase group-hover:text-amber-400 transition-colors"
                    style={{ fontFamily: "Chaney" }}
                  >
                    {j.titulo}
                  </h2>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    {j.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* SUBMENÚ ACORDES (Efecto Zoom In) */}
          <div
            className={`absolute inset-0 transition-all duration-500 ease-out px-6 flex flex-col justify-center items-center 
            ${showAcordesMenu ? "opacity-100 scale-100" : "opacity-0 scale-110 blur-xl pointer-events-none"}`}
          >
            <div className="w-full max-w-4xl">
              <button
                onClick={() => setShowAcordesMenu(false)}
                className="group mb-8 flex items-center gap-2 text-white/50 hover:text-amber-400 transition-colors uppercase text-[10px] tracking-[0.3em] font-bold"
              >
                <ChevronLeft
                  size={16}
                  className="group-hover:-translate-x-1 transition-transform"
                />{" "}
                Volver a juegos
              </button>
              <header className="mb-12 text-center md:text-left">
                <h2
                  className="text-5xl md:text-7xl italic font-black text-white uppercase"
                  style={{ fontFamily: "Chaney" }}
                >
                  Modo de <span className="text-emerald-400">A</span>cordes
                </h2>
                <p className="text-slate-400 mt-4 tracking-[0.2em] text-[10px] uppercase">
                  Selecciona el nivel de complejidad
                </p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Link
                  href="/play/acordes/diapason_triadas"
                  className="group p-1 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-[3rem] transition-transform hover:scale-[1.02]"
                >
                  <div className="bg-slate-900/80 backdrop-blur-2xl p-10 rounded-[2.9rem] h-full border border-white/5 group-hover:border-emerald-400/40 transition-all">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6">
                      <Layers size={32} />
                    </div>
                    <h3
                      className="text-3xl italic font-black text-white mb-2"
                      style={{ fontFamily: "Chaney" }}
                    >
                      Tríadas
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Fundamental, tercera y quinta. La base de toda la armonía
                      moderna.
                    </p>
                  </div>
                </Link>

                <Link
                  href="/play/acordes/diapason_septimas"
                  className="group p-1 bg-gradient-to-br from-indigo-500/20 to-transparent rounded-[3rem] transition-transform hover:scale-[1.02]"
                >
                  <div className="bg-slate-900/80 backdrop-blur-2xl p-10 rounded-[2.9rem] h-full border border-white/5 group-hover:border-indigo-400/40 transition-all">
                    <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6">
                      <Music size={32} />
                    </div>
                    <h3
                      className="text-3xl italic font-black text-white mb-2"
                      style={{ fontFamily: "Chaney" }}
                    >
                      Séptimas
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Añade color y tensión. Acordes May7, Dom7, m7 y m7b5.
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* SECCIÓN PROGRESO */}
          <div
            className={`absolute inset-0 transition-all duration-700 px-6 flex flex-col justify-center items-center 
            ${view === "progreso" ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"}`}
          >
            <div className="w-full max-w-5xl">
              <h2
                className="text-white text-5xl italic font-black tracking-tighter uppercase text-center mb-16"
                style={{ fontFamily: "Chaney" }}
              >
                Tu <span className="text-amber-400">P</span>rogreso
              </h2>
              <table className="w-full text-left border-separate border-spacing-y-4">
                <thead>
                  <tr
                    className="italic font-black uppercase text-xs text-white/40"
                    style={{ fontFamily: "Chaney" }}
                  >
                    <th className="px-8 pb-4">Día</th>
                    <th className="px-8 pb-4 text-amber-400">Armaduras</th>
                    <th className="px-8 pb-4 text-sky-400">Diapasón</th>
                    <th className="px-8 pb-4 text-emerald-400">Acordes</th>
                    <th className="px-8 pb-4 text-fuchsia-400">Intervalos</th>
                  </tr>
                </thead>
                <tbody>
                  {historialTabla.map((fila, i) => (
                    <tr key={i} className="text-white">
                      <td className="px-8 py-6 bg-white/5 rounded-l-[2rem] border-y border-l border-white/10 font-bold">
                        {fila.fecha}
                      </td>
                      <td
                        className="px-8 py-6 bg-white/5 border-y border-white/10 italic font-black"
                        style={{ fontFamily: "Chaney" }}
                      >
                        {fila.armaduras}
                      </td>
                      <td
                        className="px-8 py-6 bg-white/5 border-y border-white/10 italic font-black"
                        style={{ fontFamily: "Chaney" }}
                      >
                        {fila.diapason}
                      </td>
                      <td
                        className="px-8 py-6 bg-white/5 border-y border-white/10 italic font-black"
                        style={{ fontFamily: "Chaney" }}
                      >
                        {fila.acordes}
                      </td>
                      <td
                        className="px-8 py-6 bg-white/5 rounded-r-[2rem] border-y border-r border-white/10 italic font-black"
                        style={{ fontFamily: "Chaney" }}
                      >
                        {fila.intervalos}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECCIÓN NOTAS */}
          <div
            className={`absolute inset-0 transition-all duration-700 px-6 flex flex-col justify-center items-center 
            ${view === "notas" ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"}`}
          >
            <div className="w-full max-w-3xl">
              <h2
                className="text-white text-5xl italic font-black text-center mb-10"
                style={{ fontFamily: "Chaney" }}
              >
                Notas de <span className="text-amber-400">E</span>studio
              </h2>
              <div className="bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-[2.5rem] mb-8 flex gap-4">
                <textarea
                  value={nuevaNota}
                  onChange={(e) => setNuevaNota(e.target.value)}
                  placeholder="Escribe algo sobre tu práctica..."
                  className="flex-1 bg-transparent text-white border-none focus:ring-0 placeholder:text-white/20 resize-none h-12"
                />
                <button
                  onClick={agregarNota}
                  className="bg-amber-500 text-black p-4 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-amber-500/20"
                >
                  <Plus size={20} strokeWidth={3} />
                </button>
              </div>
              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {notas.map((n) => (
                  <div
                    key={n.id}
                    className="bg-white/5 border border-white/10 p-6 rounded-3xl"
                  >
                    <div className="flex items-center gap-2 text-amber-400/60 text-[10px] font-black uppercase tracking-widest mb-2">
                      <Calendar size={12} /> {n.fecha}
                    </div>
                    <p className="text-slate-200 text-sm font-medium">
                      {n.contenido}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        <footer className="py-12 text-center text-slate-600 text-[8px] tracking-[0.8em] uppercase">
          © 2026 21st Century Music
        </footer>
      </div>
    </div>
  );
}
