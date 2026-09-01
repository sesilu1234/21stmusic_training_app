import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { INTERNAL_METADATA, isStaffKey } from "@/lib/internalKey";
import { ANIMALS } from "../components/animals";
import { AnimalTile } from "../components/AnimalAvatar";
import { gameIcons } from "../components/gameIcons";
import BarsAvatar from "../components/BarsAvatar";

/**
 * Muestrario de avatares e iconos. No está enlazado desde ningún menú: es una
 * página de trabajo, para ver de un vistazo cómo ha quedado cada dibujo sin
 * tener que ir cambiando de cuenta hasta que salga el animal que buscas.
 *
 * Estaba en /animales y abierta a cualquiera. Ahora es /muestrario y pide la
 * misma clave que la página del profesorado: no enseña datos de nadie, pero
 * tampoco tiene por qué estar a la vista de quien pase por ahí.
 *
 * Los animales ya no se usan en la app — el avatar de la cuenta son ahora las
 * barras de [BarsAvatar] —, pero siguen aquí a la vista para poder recuperarlos
 * sin tener que ir a buscarlos al historial.
 */
export const metadata: Metadata = {
  title: "Muestrario · 21st Century Music",
  ...INTERNAL_METADATA,
};

/** Nombres inventados, solo para ver el reparto. No son alumnos. */
const SAMPLE_NAMES = [
  "Ulises Pla",
  "Jaume Pla Soler",
  "María González",
  "Marc Ribas",
  "Laura Sanz",
  "Pau Vidal",
  "Anna Puig",
  "Sergi Martí",
  "Alumno",
  "Profe",
  "Carla Bosch",
  "Nil Estruch",
];

export default async function MuestrarioPage({
  searchParams,
}: {
  searchParams?: Promise<{ key?: string }>;
}) {
  const params = (await searchParams) ?? {};
  if (!isStaffKey(params.key)) notFound();

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 font-sans text-white">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-10">
          <h1 className="text-2xl font-black uppercase italic tracking-tight">
            Muestrario
          </h1>
          <p className="mt-2 text-sm text-white/45">
            El avatar en uso, los {ANIMALS.length} animales que ya no se usan y{" "}
            {Object.keys(gameIcons).length} iconos de juego. Página de trabajo,
            sin enlazar desde el menú y con clave.
          </p>
        </header>

        {/* --- El avatar en uso ----------------------------------------- */}
        {/* Nombres de mentira, solo para ver cómo reparte el hash: lo que se
            juzga aquí es la columna de 40px, que es el tamaño al que se usa de
            verdad en el menú de la cuenta. */}
        <section className="mb-14">
          <h2 className="mb-1 text-[11px] font-black uppercase tracking-[0.24em] text-white/70">
            Avatar de la cuenta · barras
          </h2>
          <p className="mb-4 text-xs text-white/40">
            El que está en uso. A la izquierda grande, a la derecha a 40px dentro
            del círculo, como sale en el menú.
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {SAMPLE_NAMES.map((sample) => (
              <div
                key={sample}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-3"
              >
                <BarsAvatar name={sample} className="h-14 w-14 rounded-xl" />
                <span className="grid h-10 w-10 flex-shrink-0 place-items-center overflow-hidden rounded-full">
                  <BarsAvatar name={sample} className="h-full w-full" />
                </span>
                <span className="min-w-0 truncate text-xs text-white/55">{sample}</span>
              </div>
            ))}
          </div>
        </section>

        {/* --- Avatares ------------------------------------------------- */}
        <section className="mb-14">
          <h2 className="mb-4 text-[11px] font-black uppercase tracking-[0.24em] text-white/70">
            Animales · fuera de uso
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

        {/* --- En contexto ---------------------------------------------- */}
        {/*
          El avatar suelto sobre una tarjeta engaña: en la app vive metido en la
          barra de la cabecera, a 40px, recortado en redondo y sobre la foto de
          fondo. Aquí está la cabecera copiada tal cual — mismos colores, mismo
          desenfoque, mismo tamaño — para poder juzgar de verdad si un dibujo se
          lee o se convierte en una mancha.

          Es una copia y no la cabecera de verdad porque `AppShell` arrastra
          sesión, navegación y menú de cuenta; aquí solo interesa el hueco del
          avatar. Si algún día se retoca la cabecera, esto se queda desfasado:
          es una página de trabajo, no pasa nada.
        */}
        <section className="mb-14">
          <h2 className="mb-4 text-[11px] font-black uppercase tracking-[0.24em] text-white/70">
            En contexto
          </h2>

          <div
            className="space-y-3 rounded-3xl bg-cover bg-center p-4 sm:p-6"
            style={{ backgroundImage: "url('/assets/background.jpeg')" }}
          >
            {ANIMALS.map((animal) => (
              <div
                key={animal.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2.5 shadow-2xl backdrop-blur-xl"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/logo21stCM_no_white_1-192.png"
                    className="h-9 w-auto flex-shrink-0"
                    alt=""
                  />
                  <span className="flex min-w-0 flex-col">
                    <span
                      className="truncate text-sm font-black italic leading-tight tracking-tighter text-white"
                      style={{ fontFamily: "Chaney, sans-serif" }}
                    >
                      21st Century Music
                    </span>
                    <span className="truncate text-[7px] font-bold uppercase tracking-[0.28em] text-amber-400">
                      {animal.label}
                    </span>
                  </span>
                </span>

                {/* El botón de cuenta, clavado a como está en `UserMenu`. */}
                <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full">
                  <span className="grid h-full w-full place-items-center overflow-hidden rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.55)]">
                    <AnimalTile animal={animal} className="h-full w-full" />
                  </span>
                </span>
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
