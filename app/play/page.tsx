import React from "react";
import { Music, Hash, Target, Headphones, GraduationCap } from "lucide-react";
import Link from "next/link";

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
  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed font-sans selection:bg-amber-500/30"
      style={{ backgroundImage: "url('/assets/background.jpeg')" }}
    >
      {/* Dark Overlay for contrast */}
      <div className="min-h-screen bg-slate-900/30 backdrop-blur-[1px] pb-10">
        {/* Floating Navbar */}
        <div className="pt-6 px-4">
          <nav className="max-w-5xl mx-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-4 flex justify-between items-center shadow-2xl">
            <div className="flex items-center gap-3 ">
              <img
                src="/assets/logo21stCM_no_white_1.png"
                className="h-16 w-auto  rounded-lg" // Makes logo white if it was dark
                alt="logo"
              />
              <div className="hidden sm:flex flex-col">
                <span className="font-bold tracking-tight text-white leading-none">
                  21st Century Music
                </span>
                <span className="font-light tracking-[0.2em] text-[8px] uppercase text-slate-300">
                  ACADEMIA DE MÚSICA
                </span>
              </div>
            </div>

            <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-200">
              <a href="#" className="hover:text-amber-400 transition-colors">
                Progreso
              </a>
              <a href="#" className="hover:text-amber-400 transition-colors">
                Lecciones
              </a>
              <a href="#" className="hover:text-amber-400 transition-colors">
                Perfil
              </a>
            </div>
          </nav>
        </div>

        <main className="max-w-6xl mx-auto px-6 py-20">
          <header className="mb-20 text-center">
            <h1 className="text-5xl md:text-8xl font-thin tracking-tighter text-white mb-6">
              Entrena tu{" "}
              <span className="font-serif italic text-amber-400">oído</span>
            </h1>
            <p className="text-slate-200 font-light text-lg max-w-xl mx-auto leading-relaxed">
              Módulos interactivos de alto rendimiento para músicos del siglo
              XXI.
            </p>
          </header>

          {/* Grid de Juegos con Contenedores Glass */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {juegos.map((j) => (
              <Link
                key={j.id}
                href={`/play/${j.slug}`}
                className="group relative bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 p-8 rounded-3xl transition-all duration-500 hover:-translate-y-2 hover:border-white/30"
              >
                {/* Icon Circle */}
                <div
                  className={`w-14 h-14 ${j.bg} rounded-2xl mb-6 flex items-center justify-center transition-transform duration-500 group-hover:scale-110`}
                >
                  <div className={j.accent}>
                    <j.icon size={28} strokeWidth={1.5} />
                  </div>
                </div>

                {/* Textos */}
                <div className="space-y-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-[0.2em] ${j.accent} block`}
                  >
                    {j.sub}
                  </span>
                  <h2 className="text-2xl font-medium text-white tracking-tight">
                    {j.titulo}
                  </h2>
                  <p className="text-slate-400 text-sm leading-snug font-light italic opacity-80">
                    {j.desc}
                  </p>
                </div>

                {/* Decorative hover light */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </main>

        <footer className="py-10 text-center text-slate-500 text-[9px] tracking-[0.5em] uppercase">
          <div className="flex justify-center items-center gap-4 mb-4 opacity-30">
            <div className="h-[1px] w-8 bg-slate-500"></div>
            <GraduationCap size={14} strokeWidth={1} />
            <div className="h-[1px] w-8 bg-slate-500"></div>
          </div>
          © 2026 — 21st Century Music
        </footer>
      </div>
    </div>
  );
}
