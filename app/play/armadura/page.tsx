"use client";

import Link from "next/link";
import GameChrome from "@/app/components/GameChrome";
import Backdrop from "@/app/components/Backdrop";
import { CLAVE_LEVELS } from "./notes_images";

/**
 * El menú del modo: con qué clave se juega.
 *
 * Aquí NO va el titular de la pregunta. Estaba puesto y decía "¿Qué tonalidad
 * MAYOR es?" encima de "Elige con qué clave quieres jugar", y además alternaba
 * entre mayor y menor según lo que hubiera tocado en la ronda anterior. El
 * titular vive ahora en la pantalla de juego, que es donde hay una pregunta
 * que responder.
 *
 * Y son enlaces, no botones: cada clave tiene su ruta, y de ahí sale que las
 * partidas se guarden por separado.
 */
export default function ArmadurasMenuPage() {
  return (
    <div className="relative min-h-screen flex flex-col font-sans overflow-x-hidden text-white">
      <Backdrop />

      <div className="relative z-10 min-h-screen flex flex-col">
        <GameChrome />

        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-4 pt-4 md:px-6 md:pb-6 md:pt-6 z-10 w-full max-w-5xl mx-auto">
          <div className="mb-10 text-center">
            <h2
              className="text-white text-2xl md:text-4xl font-black italic tracking-tighter leading-tight"
              style={{ fontFamily: "Chaney, sans-serif" }}
            >
              Armaduras
            </h2>
            <p className="text-white/60 text-xs md:text-sm font-bold uppercase tracking-[0.25em] mt-3">
              Elige con qué clave quieres jugar
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 w-full">
            {CLAVE_LEVELS.map((op) => (
              <Link
                key={op.slug}
                href={`/play/armadura/${op.slug}`}
                className="group flex flex-col items-center gap-4 bg-black/40 hover:bg-amber-500 p-6 md:p-8 rounded-[2rem] border border-white/10 hover:border-amber-400 backdrop-blur-md transition-all active:scale-95 shadow-xl"
              >
                <div className="bg-white rounded-2xl w-full h-28 md:h-32 flex items-center justify-center gap-2 p-3 overflow-hidden">
                  {op.imgs.map((src) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={src}
                      src={encodeURI(src)}
                      alt=""
                      className="max-h-full max-w-full object-contain"
                    />
                  ))}
                </div>
                <div className="text-center">
                  <div className="text-white group-hover:text-black text-base md:text-lg font-black italic uppercase tracking-tight transition-colors">
                    {op.titulo}
                  </div>
                  <div className="text-white/50 group-hover:text-black/70 text-[10px] font-bold uppercase tracking-widest mt-1 transition-colors">
                    {op.sub}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <footer className="py-8 text-center text-slate-600 text-[8px] tracking-[0.6em] uppercase z-10">
          © 2026 21st Century Music
        </footer>
      </div>
    </div>
  );
}
