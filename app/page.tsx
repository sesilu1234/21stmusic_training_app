import Link from "next/link";
import { Hammer, Lock } from "lucide-react";
import AppShell from "./components/AppShell";
import { gameIcons } from "./components/gameIcons";
import { categoryOf, gamesByCategory, type GameMode } from "@/lib/games";
import { currentStudent } from "@/lib/session";

/**
 * Tarjeta de modo. Si el modo es de alumnos y no hay sesión, sigue siendo un
 * enlace (para que se pueda ver de qué va y ofrecer entrar), pero se enseña
 * apagada y con candado: se ve que existe, se ve que está cerrada.
 */
const GameCard = ({ game, locked }: { game: GameMode; locked: boolean }) => {
  const category = categoryOf(game.category);
  const Icon = gameIcons[game.icon];

  // Sin construir todavía: se enseña, pero no lleva a ningún sitio.
  if (game.comingSoon) {
    return (
      <div
        aria-disabled
        className="relative block cursor-default rounded-2xl border border-dashed border-white/[0.09] bg-slate-950/30 p-4 shadow-lg backdrop-blur-sm md:p-5"
      >
        <span
          title="Todavía sin construir"
          className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full border border-white/10 bg-slate-900/80 text-white/30"
        >
          <Hammer size={12} strokeWidth={2.25} />
        </span>

        <div className="flex items-start gap-3.5 opacity-35 grayscale">
          <span
            className={`grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl ${category.iconBg}`}
          >
            <Icon size={22} className={category.accent} strokeWidth={1.75} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-black uppercase italic leading-tight tracking-tight text-white">
              {game.label}
            </span>
            <span className="mt-1.5 block text-xs leading-snug text-white/45">
              {game.desc}
            </span>
          </span>
        </div>

        <span className="mt-3 block text-[9px] font-black uppercase tracking-[0.18em] text-white/25">
          Próximamente
        </span>
      </div>
    );
  }

  return (
    <Link
      href={locked ? "/login" : game.slug}
      aria-label={locked ? `${game.label} — solo para alumnos` : game.label}
      className={`group relative block rounded-2xl border p-4 shadow-lg backdrop-blur-sm transition duration-200 md:p-5 ${
        locked
          ? "border-white/[0.06] bg-slate-950/40 hover:border-amber-300/30 hover:bg-slate-950/60"
          : `border-white/10 bg-slate-950/70 hover:-translate-y-0.5 hover:bg-slate-950/85 ${category.hoverBorder}`
      }`}
    >
      {locked && (
        <span
          title="Solo para alumnos de la escuela"
          className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full border border-white/10 bg-slate-900/80 text-white/40 transition-colors group-hover:border-amber-300/40 group-hover:text-amber-300"
        >
          <Lock size={12} strokeWidth={2.25} />
        </span>
      )}

      <div className={`flex items-start gap-3.5 ${locked ? "opacity-45 grayscale" : ""}`}>
        <span
          className={`grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl transition-transform duration-200 ${
            locked ? "" : "group-hover:scale-105"
          } ${category.iconBg}`}
        >
          <Icon size={22} className={category.accent} strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-black uppercase italic leading-tight tracking-tight text-white">
            {game.label}
          </span>
          <span className="mt-1.5 block text-xs leading-snug text-white/45">
            {game.desc}
          </span>
        </span>
      </div>

      {locked && (
        <span className="mt-3 block text-[9px] font-black uppercase tracking-[0.18em] text-amber-300/50 transition-colors group-hover:text-amber-300/90">
          Solo alumnos · entra para abrirlo
        </span>
      )}
    </Link>
  );
};

export default async function HomePage() {
  const student = await currentStudent();

  return (
    <AppShell displayName={student?.displayName}>
      <div className="mx-auto w-full max-w-5xl">
        <div className="space-y-8 md:space-y-9">
          {gamesByCategory().map(({ category, games }) => (
            <section key={category.id}>
              <div className="mb-4 flex items-baseline gap-3">
                <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${category.dot}`} />
                <h2 className="text-[11px] font-black uppercase tracking-[0.24em] text-white/75">
                  {category.label}
                </h2>
                <span className="hidden truncate text-[10px] text-white/25 sm:inline">
                  {category.hint}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 md:gap-3.5">
                {games.map((game) => (
                  <GameCard
                    key={game.name}
                    game={game}
                    locked={Boolean(game.studentsOnly) && !student}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
