"use client";

import React from "react";
import Link from "next/link"; // Importamos Link para navegación optimizada
import {
  Music,
  Hash,
  Target,
  Headphones,
  LucideIcon,
} from "lucide-react";

interface Juego {
  id: number;
  titulo: string;
  sub: string;
  desc: string;
  icon: LucideIcon;
  bg: string;
  accent: string;
  slug: string;
}

const juegos: Juego[] = [
  {
    id: 1,
    titulo: "Armaduras",
    sub: "Teoría Visual",
    desc: "Identifica tonalidades y alteraciones en el pentagrama.",
    icon: Hash,
    bg: "bg-amber-500/20",
    accent: "text-amber-400",
    slug: "/play/armaduras", 
  },
  {
    id: 2,
    titulo: "Diapasón",
    sub: "Geometría",
    desc: "Ubica notas en el mástil de la guitarra rápidamente.",
    icon: Target,
    bg: "bg-sky-500/20",
    accent: "text-sky-400",
    slug: "/play/diapason",
  },
  {
    id: 3,
    titulo: "Acordes",
    sub: "Entrenamiento Auditivo",
    desc: "Reconoce la distancia exacta entre dos notas.",
    icon: Headphones,
    bg: "bg-emerald-500/20",
    accent: "text-emerald-400",
    slug: "/play/diapason_acordes", // Ruta corregida
  },
];

export default function Home() {
  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed font-sans selection:bg-amber-500/30"
      style={{ backgroundImage: "url('/assets/background.jpeg')" }}
    >
      <div className="min-h-screen bg-slate-900/40 backdrop-blur-[2px]">
        {/* Navbar */}
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
              <button className="hover:text-white transition-colors">Progreso</button>
              <button className="hover:text-white transition-colors">Lecciones</button>
              <button className="hover:text-white transition-colors border-b border-amber-400 pb-1">Juegos</button>
            </div>
          </nav>
        </div>

        {/* --- GRID DE SELECCIÓN --- */}
        <main className="max-w-6xl mx-auto px-6 py-24 min-h-[80vh] flex flex-col justify-center">
          <header className="mb-20 text-center">
            <h1 className="text-6xl md:text-8xl font-thin tracking-tighter text-white mb-6">
              Elige tu{" "}
              <span className="font-serif italic text-amber-400">desafío</span>
            </h1>
            <p className="text-slate-300 font-light text-lg max-w-xl mx-auto">
              Haz clic en una disciplina para comenzar tu entrenamiento de inmediato.
            </p>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {juegos.map((j) => (
              <Link
                key={j.id}
                href={j.slug}
                className="group relative p-8 rounded-[2rem] transition-all duration-500 text-left border bg-white/5 border-white/10 hover:bg-white/10 hover:scale-105 hover:border-amber-400/50 backdrop-blur-md shadow-xl block"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-colors ${j.bg}`}>
                  <j.icon size={24} className={j.accent} />
                </div>

                <h2 className="text-2xl font-bold tracking-tight mb-2 text-white group-hover:text-amber-400 transition-colors">
                  {j.titulo}
                </h2>
                <p className="text-sm leading-relaxed text-slate-400">
                  {j.desc}
                </p>
                
                <div className="mt-6 flex items-center text-[10px] font-black uppercase tracking-widest text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Entrenar ahora →
                </div>
              </Link>
            ))}
          </div>
        </main>

        <footer className="py-20 text-center text-slate-600 text-[8px] tracking-[0.8em] uppercase">
          © 2026 21st Century Music — Crafted for excellence
        </footer>
      </div>
    </div>
  );
}