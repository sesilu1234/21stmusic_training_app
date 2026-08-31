import type { Metadata } from "next";
import { ANIMALS } from "../components/animals";
import { AnimalTile } from "../components/AnimalAvatar";
import { gameIcons } from "../components/gameIcons";

/**
 * Muestrario de avatares e iconos. No está enlazado desde ningún menú: es una
 * página de trabajo, para ver de un vistazo cómo ha quedado cada dibujo sin
 * tener que ir cambiando de cuenta hasta que salga el animal que buscas.
 *
 * Se pinta entera en el servidor y no toca sesión ni base de datos, así que no
 * enseña nada de nadie. Si algún día molesta, se borra la carpeta y ya.
 */
export const metadata: Metadata = {
  title: "Muestrario · 21st Century Music",
  robots: { index: false, follow: false },
};

export default function MuestrarioPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 font-sans text-white">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-10">
          <h1 className="text-2xl font-black uppercase italic tracking-tight">
            Muestrario
          </h1>
          <p className="mt-2 text-sm text-white/45">
            {ANIMALS.length} avatares y {Object.keys(gameIcons).length} iconos de
            juego. Página de trabajo, sin enlazar desde el menú.
          </p>
        </header>

        {/* --- Avatares ------------------------------------------------- */}
        <section className="mb-14">
          <h2 className="mb-4 text-[11px] font-black uppercase tracking-[0.24em] text-white/70">
            Avatares
          </h2>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {ANIMALS.map((animal, index) => (
              <div
                key={animal.id}
                className="rounded-2xl border border-white/10 bg-slate-900/60 p-4"
              >
                <AnimalTile animal={animal} className="w-full rounded-xl" />

                <div className="mt-3 flex items-baseline justify-between gap-2">
                  <span className="text-sm font-black tracking-tight">
                    {animal.label}
                  </span>
                  {/* La posición importa: el avatar se elige con ella. */}
                  <span className="text-[10px] font-black tracking-wider text-white/30">
                    #{index} · {animal.id}
                  </span>
                </div>

                {/* A los tamaños a los que se ve de verdad en la app, y con el
                    recorte redondo del menú de cuenta — que es justo donde se
                    notaba que los dibujos quedaban apretados. Los dos últimos
                    son los 40px reales del botón de la cabecera. */}
                <div className="mt-3 flex items-end gap-2 border-t border-white/10 pt-3">
                  <AnimalTile animal={animal} className="h-6 w-6 rounded" />
                  <AnimalTile animal={animal} className="h-8 w-8 rounded-md" />
                  <span className="grid h-10 w-10 overflow-hidden rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.55)]">
                    <AnimalTile animal={animal} className="h-full w-full" />
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {[animal.bg, ...Object.keys(animal.palette).sort().map((key) => animal.palette[key])].map(
                    (color) => (
                      <span
                        key={color}
                        title={color}
                        className="h-4 w-4 rounded-sm ring-1 ring-inset ring-white/15"
                        style={{ backgroundColor: color }}
                      />
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* --- Iconos de juego ------------------------------------------ */}
        <section>
          <h2 className="mb-4 text-[11px] font-black uppercase tracking-[0.24em] text-white/70">
            Iconos de juego
          </h2>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {Object.entries(gameIcons).map(([name, Icon]) => (
              <div
                key={name}
                className="flex flex-col items-center gap-2.5 rounded-2xl border border-white/10 bg-slate-900/60 p-4"
              >
                <Icon size={26} className="text-amber-300" />
                <span className="text-center text-[10px] font-bold tracking-wide text-white/40">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
