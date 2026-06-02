"use client";

import { Activity, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useStoredThemeMode } from "@/lib/themeMode";

const opciones = [
  {
    title: "Módulo 1",
    description: "Lectura rítmica inicial con ejercicios de pulso y precisión.",
    href: "/play/ritmo/modulo1",
  },
  {
    title: "Módulo 2",
    description: "Lectura rítmica avanzada con patrones más completos.",
    href: "/play/ritmo/modulo2",
  },
];

export default function RitmoMenuPage() {
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
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.35em] text-amber-300">
          Lectura Rítmica
        </p>
        <h1 className="mb-8 text-3xl font-black italic tracking-tight md:text-6xl">
          Elige el módulo
        </h1>
        <div className="grid gap-4 md:grid-cols-2">
          {opciones.map((opcion) => (
            <button
              key={opcion.href}
              onClick={() => router.push(opcion.href)}
              className="group min-h-52 rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-left shadow-2xl transition-all hover:-translate-y-1 hover:border-amber-300/40 hover:bg-white/[0.07]"
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-400/15">
                <Activity className="text-orange-300" size={28} />
              </div>
              <h2 className="mb-3 text-2xl font-black italic text-white">{opcion.title}</h2>
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
