import Link from "next/link";
import AppShell from "./components/AppShell";
import { gameIcons } from "./components/gameIcons";
import { categoryOf, gamesByCategory, type GameMode } from "@/lib/games";

const GameCard = ({ game }: { game: GameMode }) => {
  const category = categoryOf(game.category);
  const Icon = gameIcons[game.icon];

  return (
    <Link
      href={game.slug}
      className={`group block rounded-2xl border border-white/10 bg-slate-950/70 p-4 shadow-lg backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:bg-slate-950/85 md:p-5 ${category.hoverBorder}`}
    >
      <div className="flex items-start gap-3.5">
        <span
          className={`grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${category.iconBg}`}
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
    </Link>
  );
};

export default function HomePage() {
  return (
    <AppShell>
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
                  <GameCard key={game.name} game={game} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
