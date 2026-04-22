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
  Calendar
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
}

interface Nota {
  id: number;
  fecha: string;
  contenido: string;
}

// --- DATOS DE EJEMPLO ---
const juegos: Juego[] = [
  { id: 1, titulo: "Armaduras", desc: "Identifica tonalidades y alteraciones.", icon: Hash, bg: "bg-amber-500/20", accent: "text-amber-400", slug: "/play/armadura" },
  { id: 2, titulo: "Diapasón", desc: "Ubica notas en el mástil rápidamente.", icon: Target, bg: "bg-sky-500/20", accent: "text-sky-400", slug: "/play/diapason" },
  { id: 3, titulo: "Acordes", desc: "Reconoce la estructura de los acordes.", icon: Headphones, bg: "bg-emerald-500/20", accent: "text-emerald-400", slug: "/play/diapason_acordes" },
];

const historialTabla = [
  { fecha: "Hoy", armaduras: "24/24", diapason: "20/24", acordes: "18/24" },
  { fecha: "Ayer", armaduras: "22/24", diapason: "15/24", acordes: "24/24" },
];

export default function Home() {
  const [view, setView] = useState<"juegos" | "progreso" | "notas">("juegos");
  
  const [notas, setNotas] = useState<Nota[]>([
    { id: 1, fecha: "21/04/2026", contenido: "Repasar la escala de Mi bemol mayor, me cuesta el diapasón." },
  ]);
  const [nuevaNota, setNuevaNota] = useState("");

  const agregarNota = () => {
    if (!nuevaNota.trim()) return;
    const fechaActual = new Date().toLocaleDateString('es-ES');
    const nota: Nota = { id: Date.now(), fecha: fechaActual, contenido: nuevaNota };
    setNotas([nota, ...notas]);
    setNuevaNota("");
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed font-sans overflow-hidden"
         style={{ backgroundImage: "url('/assets/background.jpeg')" }}>
      
      <div className="min-h-screen bg-slate-900/40 backdrop-blur-[2px] flex flex-col">
        
        {/* --- NAVBAR --- */}
        <div className="pt-6 px-4 z-50">
          <nav className="max-w-5xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl px-8 py-5 flex justify-between items-center shadow-2xl">
            <div className="flex items-center gap-6">
              {/* LOGO MÁS GRANDE (h-16) */}
              <img 
                src="/assets/logo21stCM_no_white_1.png" 
                className="h-16 w-auto brightness-0 invert opacity-90 transition-transform hover:scale-105" 
                alt="logo" 
              />
              <div className="flex flex-col">
                <span className="text-white italic font-black tracking-tighter leading-none text-base uppercase" style={{ fontFamily: 'Chaney, sans-serif' }}>21st Century Music</span>
                <span className="font-light tracking-[0.3em] text-[8px] uppercase text-amber-400">Music Academy</span>
              </div>
            </div>

            <div className="hidden md:flex gap-8 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">
              <button onClick={() => setView("juegos")} className={`transition-all pb-1 flex items-center gap-2 ${view === 'juegos' ? 'text-white border-b border-amber-400' : 'hover:text-white'}`}>
                <Gamepad2 size={14} /> Juegos
              </button>
              <button onClick={() => setView("progreso")} className={`transition-all pb-1 flex items-center gap-2 ${view === 'progreso' ? 'text-white border-b border-amber-400' : 'hover:text-white'}`}>
                <History size={14} /> Progreso
              </button>
              <button onClick={() => setView("notas")} className={`transition-all pb-1 flex items-center gap-2 ${view === 'notas' ? 'text-white border-b border-amber-400' : 'hover:text-white'}`}>
                <StickyNote size={14} /> Notas
              </button>
            </div>
          </nav>
        </div>

        {/* --- CONTENEDOR PRINCIPAL CON TRANSICIONES --- */}
        <main className="flex-1 relative mt-10">
          
          {/* SECCIÓN JUEGOS */}
          <div className={`absolute inset-0 transition-all duration-700 ease-in-out px-6 flex flex-col justify-center items-center ${view === 'juegos' ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'}`}>
            <header className="mb-16 text-center">
              {/* SOLUCIÓN CORTE LETRA O: px-4 y un pequeño margen derecho */}
              <h1 className="text-5xl md:text-8xl italic font-black tracking-tighter mb-6 leading-tight inline-block text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/60 drop-shadow-2xl px-4" 
                  style={{ fontFamily: 'Chaney, sans-serif' }}>
                Elige tu <span className="text-amber-400 uppercase mr-1">D</span>ESAFÍO
              </h1>
              <p className="text-slate-200 font-medium text-lg max-w-xl mx-auto drop-shadow-md">
                Selecciona una disciplina para comenzar tu entrenamiento.
              </p>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl w-full">
              {juegos.map((j) => (
                <Link key={j.id} href={j.slug} className="group p-10 rounded-[3rem] transition-all duration-500 border bg-black/40 border-white/10 hover:bg-black/60 hover:scale-105 hover:border-amber-400/50 backdrop-blur-md shadow-2xl block">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 ${j.bg}`}><j.icon size={28} className={j.accent} /></div>
                  <h2 className="text-2xl italic font-black tracking-tighter mb-3 text-white uppercase group-hover:text-amber-400 transition-colors" style={{ fontFamily: 'Chaney, sans-serif' }}>{j.titulo}</h2>
                  <p className="text-sm leading-relaxed text-slate-400 font-sans font-medium">{j.desc}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* SECCIÓN PROGRESO (TABLA) */}
          <div className={`absolute inset-0 transition-all duration-700 ease-in-out px-6 flex flex-col justify-center items-center ${view === 'progreso' ? 'translate-x-0 opacity-100' : view === 'juegos' ? 'translate-x-full opacity-0' : '-translate-x-full opacity-0'} pointer-events-none ${view === 'progreso' && 'pointer-events-auto'}`}>
            <div className="w-full max-w-5xl">
              <h2 className="text-white text-5xl italic font-black tracking-tighter uppercase text-center mb-16" style={{ fontFamily: 'Chaney, sans-serif' }}>Tu <span className="text-amber-400">P</span>rogreso</h2>
              <table className="w-full text-left border-separate border-spacing-y-4">
                <thead>
                  <tr className="italic font-black uppercase tracking-widest text-sm" style={{ fontFamily: 'Chaney, sans-serif' }}>
                    <th className="px-8 pb-4 text-white/40">Día</th>
                    <th className="px-8 pb-4 text-amber-400">Armaduras</th>
                    <th className="px-8 pb-4 text-sky-400">Diapasón</th>
                    <th className="px-8 pb-4 text-emerald-400">Acordes</th>
                  </tr>
                </thead>
                <tbody>
                  {historialTabla.map((fila, i) => (
                    <tr key={i}>
                      <td className="px-8 py-8 bg-white/5 rounded-l-[2rem] border-y border-l border-white/10 text-white font-bold">{fila.fecha}</td>
                      <td className="px-8 py-8 bg-white/5 border-y border-white/10"><span className="text-2xl italic font-black text-white" style={{ fontFamily: 'Chaney, sans-serif' }}>{fila.armaduras}</span></td>
                      <td className="px-8 py-8 bg-white/5 border-y border-white/10"><span className="text-2xl italic font-black text-white" style={{ fontFamily: 'Chaney, sans-serif' }}>{fila.diapason}</span></td>
                      <td className="px-8 py-8 bg-white/5 rounded-r-[2rem] border-y border-r border-white/10"><span className="text-2xl italic font-black text-white" style={{ fontFamily: 'Chaney, sans-serif' }}>{fila.acordes}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECCIÓN NOTAS */}
          <div className={`absolute inset-0 transition-all duration-700 ease-in-out px-6 flex flex-col justify-center items-center ${view === 'notas' ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`}>
            <div className="w-full max-w-3xl">
              <h2 className="text-white text-5xl italic font-black tracking-tighter uppercase text-center mb-10" style={{ fontFamily: 'Chaney, sans-serif' }}>Notas de <span className="text-amber-400">E</span>studio</h2>
              <div className="bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-[2.5rem] mb-8 flex gap-4 shadow-2xl">
                <textarea 
                  value={nuevaNota}
                  onChange={(e) => setNuevaNota(e.target.value)}
                  placeholder="Escribe algo sobre tu práctica de hoy..."
                  className="flex-1 bg-transparent text-white border-none focus:ring-0 placeholder:text-white/20 resize-none h-12"
                />
                <button onClick={agregarNota} className="bg-amber-500 text-black p-4 rounded-2xl hover:scale-105 transition-all active:scale-95 shadow-lg shadow-amber-500/20">
                  <Plus size={20} strokeWidth={3} />
                </button>
              </div>
              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {notas.map((n) => (
                  <div key={n.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-amber-400/60 text-[10px] font-black uppercase tracking-widest">
                      <Calendar size={12} /> {n.fecha}
                    </div>
                    <p className="text-slate-200 text-sm font-medium leading-relaxed">{n.contenido}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </main>

        <footer className="py-12 text-center text-slate-600 text-[8px] tracking-[0.8em] uppercase">© 2026 21st Century Music</footer>
      </div>
    </div>
  );
}