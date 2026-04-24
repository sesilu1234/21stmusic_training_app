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
  Music2,
  Layers,
  ArrowLeft,
  Activity,
  Music,
  Trash2,
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
    desc: "Tonalidades y alteraciones.",
    icon: Hash,
    bg: "bg-amber-500/20",
    accent: "text-amber-400",
    slug: "/play/armadura",
  },
  {
    id: 2,
    titulo: "Diapasón",
    desc: "Ubica notas en el mástil.",
    icon: Target,
    bg: "bg-sky-500/20",
    accent: "text-sky-400",
    slug: "/play/diapason",
  },
  {
    id: 3,
    titulo: "Acordes",
    desc: "Estructura de los acordes.",
    icon: Headphones,
    bg: "bg-emerald-500/20",
    accent: "text-emerald-400",
    slug: "/play/diapason_acordes",
    hasSubmenu: true,
  },
  {
    id: 4,
    titulo: "Intervalos",
    desc: "Distancia entre notas.",
    icon: Activity,
    bg: "bg-fuchsia-500/20",
    accent: "text-fuchsia-400",
    slug: "/play/intervalos",
  },
  {
    id: 5,
    titulo: "Trivial",
    desc: "Cultura general y artistas.",
    icon: Music,
    bg: "bg-red-500/20",
    accent: "text-red-400",
    slug: "/play/trivia",
  },
];

const historialTabla = [
  {
    fecha: "24 Abr",
    armaduras: "24/24",
    diapason: "20/24",
    acordes: "18/24",
    intervalos: "21/24",
  },
  {
    fecha: "23 Abr",
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
      contenido: "Repasar la escala de Mi bemol mayor.",
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

  const eliminarNota = (id: number) =>
    setNotas(notas.filter((n) => n.id !== id));

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-amber-500/30">
      {/* BACKGROUND FIX */}
      <div
        className="fixed inset-0 bg-cover bg-center z-0 opacity-40 pointer-events-none transition-transform duration-1000"
        style={{
          backgroundImage: "url('/assets/background.jpeg')",
          transform: showAcordesMenu ? "scale(1.1)" : "scale(1)",
        }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/90 to-slate-950 z-0 pointer-events-none" />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* NAVBAR RESPONSIVE */}
        <header className="sticky top-0 z-50 p-4">
          <nav className="max-w-5xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-3 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <img
                src="/assets/logo21stCM_no_white_1.png"
                className="h-10 md:h-14 w-auto"
                alt="logo"
              />
              <div className="flex flex-col leading-none">
                <span className="italic font-black tracking-tighter text-sm md:text-xl uppercase">
                  21st Century
                </span>
                <span className="font-bold tracking-[0.3em] text-[7px] uppercase text-amber-400">
                  Music Academy
                </span>
              </div>
            </div>

            <div className="flex bg-black/20 p-1 rounded-2xl w-full sm:w-auto">
              {[
                { id: "juegos", icon: Gamepad2, label: "Jugar" },
                { id: "progreso", icon: History, label: "Stats" },
                { id: "notas", icon: StickyNote, label: "Notas" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setView(item.id as any);
                    setShowAcordesMenu(false);
                  }}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === item.id ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" : "text-slate-400 hover:text-white"}`}
                >
                  <item.icon size={14} />
                  <span
                    className={`${view === item.id ? "inline" : "hidden sm:inline"}`}
                  >
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </nav>
        </header>

        {/* CONTENIDO PRINCIPAL CON SCROLL NATURAL */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 md:py-12">
          {/* VISTA JUEGOS */}
          {view === "juegos" && !showAcordesMenu && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-4xl md:text-8xl font-black italic tracking-tighter mb-8 text-center md:text-left">
                ELIGE TU <span className="text-amber-400">D</span>ESAFÍO
              </h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {juegos.map((j) => (
                  <button
                    key={j.id}
                    onClick={() =>
                      j.hasSubmenu
                        ? setShowAcordesMenu(true)
                        : (window.location.href = j.slug)
                    }
                    className="group relative overflow-hidden p-6 rounded-[2rem] border border-white/5 bg-slate-900/40 hover:bg-slate-800/60 backdrop-blur-md transition-all text-left flex flex-col gap-4"
                  >
                    <div
                      className={`${j.bg} w-12 h-12 rounded-2xl flex items-center justify-center ${j.accent} group-hover:scale-110 transition-transform`}
                    >
                      <j.icon size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black italic uppercase group-hover:text-amber-400 transition-colors">
                        {j.titulo}
                      </h2>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {j.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SUBMENÚ ACORDES */}
          {showAcordesMenu && (
            <div className="animate-in zoom-in-95 duration-500 max-w-4xl mx-auto">
              <button
                onClick={() => setShowAcordesMenu(false)}
                className="flex items-center gap-2 text-white/40 hover:text-emerald-400 uppercase text-[10px] tracking-widest mb-8"
              >
                <ArrowLeft size={14} /> Volver
              </button>
              <h2 className="text-4xl md:text-7xl font-black italic mb-10 leading-tight">
                MODO DE <span className="text-emerald-400">ACORDES</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  {
                    title: "Tríadas",
                    slug: "triadas",
                    icon: Music2,
                    desc: "Fundamental, 3ª y 5ª.",
                  },
                  {
                    title: "Séptimas",
                    slug: "septimas",
                    icon: Layers,
                    desc: "Añade color con la 7ª.",
                  },
                ].map((sub) => (
                  <Link
                    key={sub.slug}
                    href={`/play/acordes/diapason_${sub.slug}`}
                    className="group p-8 rounded-[2.5rem] bg-slate-900/80 border border-white/10 hover:border-emerald-500/50 transition-all"
                  >
                    <sub.icon
                      size={40}
                      className="text-emerald-400 mb-6 group-hover:scale-110 transition-transform"
                    />
                    <h3 className="text-2xl font-bold mb-2">{sub.title}</h3>
                    <p className="text-sm text-white/40">{sub.desc}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* VISTA PROGRESO */}
          {view === "progreso" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-4xl font-black italic mb-8 uppercase tracking-tighter">
                Mi <span className="text-amber-400">Progreso</span>
              </h2>
              <div className="bg-white/5 rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 text-[10px] uppercase tracking-widest text-amber-400 font-black">
                        <th className="p-6">Fecha</th>
                        <th className="p-6">Armaduras</th>
                        <th className="p-6">Diapasón</th>
                        <th className="p-6">Acordes</th>
                        <th className="p-6">Intervalos</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm font-medium">
                      {historialTabla.map((fila, i) => (
                        <tr
                          key={i}
                          className="border-t border-white/5 hover:bg-white/5 transition-colors"
                        >
                          <td className="p-6 font-bold">{fila.fecha}</td>
                          <td className="p-6 text-slate-300">
                            {fila.armaduras}
                          </td>
                          <td className="p-6 text-slate-300">
                            {fila.diapason}
                          </td>
                          <td className="p-6 text-slate-300">{fila.acordes}</td>
                          <td className="p-6 text-slate-300">
                            {fila.intervalos}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VISTA NOTAS */}
          {view === "notas" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto w-full">
              <h2 className="text-4xl font-black italic mb-8 uppercase tracking-tighter text-center">
                Cuaderno de <span className="text-amber-400">Estudio</span>
              </h2>

              <div className="bg-slate-900/80 p-4 rounded-3xl border border-white/10 flex gap-4 mb-10 shadow-xl">
                <textarea
                  value={nuevaNota}
                  onChange={(e) => setNuevaNota(e.target.value)}
                  placeholder="Escribe algo importante para tu práctica..."
                  className="flex-1 bg-transparent text-white text-sm outline-none resize-none h-12 pt-3"
                />
                <button
                  onClick={agregarNota}
                  className="bg-amber-500 text-black p-3 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg"
                >
                  <Plus size={24} strokeWidth={3} />
                </button>
              </div>

              <div className="space-y-4">
                {notas.map((n) => (
                  <div
                    key={n.id}
                    className="group p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-all flex justify-between items-start"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
                        {n.fecha}
                      </span>
                      <p className="text-sm text-slate-200 leading-relaxed">
                        {n.contenido}
                      </p>
                    </div>
                    <button
                      onClick={() => eliminarNota(n.id)}
                      className="text-white/10 group-hover:text-red-400 transition-colors p-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        <footer className="py-12 text-center text-slate-700 text-[10px] font-bold tracking-[0.5em] uppercase">
          © 2026 21st Century Music Academy
        </footer>
      </div>
    </div>
  );
}
