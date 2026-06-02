"use client";

import { ArrowLeft, BookOpen, Music2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useStoredThemeMode } from "@/lib/themeMode";

const opciones = [
  {
    title: "1. Constructor de melodías",
    description: "Crea tus propias notas, escucha, transporta y practica encadenamientos.",
    icon: Music2,
    href: "/play/constructor-melodias",
    accent: "text-teal-300",
    bg: "bg-teal-400/15",
  },
  {
    title: "2. Ej. Rockschool",
    description: "Practica ejercicios fijos de Rockschool con pentagrama, teclado y escucha.",
    icon: BookOpen,
    href: "/play/rockschool",
    accent: "text-lime-300",
    bg: "bg-lime-400/15",
  },
];

export default function MelodiasMenuPage() {
  const router = useRouter();
  const [isDarkMode] = useStoredThemeMode();

  return (
    <div
      className="relative min-h-screen bg-slate-950 bg-cover bg-center text-white px-4 py-6 md:px-8"
      style={{ backgroundImage: "url('/assets/background.jpeg')" }}
    >
      <div className={`absolute inset-0 backdrop-blur-[2px] ${isDarkMode ? "bg-slate-950/70" : "bg-slate-950/30"}`} />
      <div className="relative z-10">
        <button
          onClick={() => router.push("/")}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-300 shadow-lg hover:border-amber-300/40 hover:bg-black/60 hover:text-white"
        >
          <ArrowLeft size={14} />
          Menú Principal
        </button>

      <main className="mx-auto flex min-h-[70vh] max-w-5xl flex-col justify-center">
        <div className="mb-8">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.35em] text-amber-300">
            Ej. Canto / E. del oído
          </p>
          <h1
            className="text-3xl font-black italic tracking-tight md:text-6xl"
            style={{ fontFamily: "Chaney, sans-serif" }}
          >
            Elige una opción
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            Aquí están juntos el constructor original de Ej. Canto y todos los ejercicios de Rockschool.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {opciones.map((opcion) => (
            <button
              key={opcion.href}
              onClick={() => router.push(opcion.href)}
              className="group min-h-56 rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-left shadow-2xl transition-all hover:-translate-y-1 hover:border-amber-300/40 hover:bg-white/[0.07]"
            >
              <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${opcion.bg}`}>
                <opcion.icon className={opcion.accent} size={28} />
              </div>
              <h2 className="mb-3 text-2xl font-black italic text-white">
                {opcion.title}
              </h2>
              <p className="max-w-sm text-sm leading-6 text-slate-400 group-hover:text-slate-300">
                {opcion.description}
              </p>
            </button>
          ))}
        </div>
      </main>
      </div>
    </div>
  );
}
