import { Award, Lock } from "lucide-react";
import AppShell from "../components/AppShell";
import Crown from "../components/Crown";
import { gameIcons } from "../components/gameIcons";
import { categoryOf, gameLabel, SCORED_GAMES } from "@/lib/games";
import { MEDAL_MIN_LENGTH, nextTier, tierFor, TIERS } from "@/lib/medals";
import { requireStudent } from "@/lib/session";
import { getMedalBoard, getProgressByGame, listMedals } from "@/lib/students";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Medallas · 21st Century Music" };

export default async function MedallasPage() {
  const { student, image } = await requireStudent();
  const [medals, progress, board] = await Promise.all([
    listMedals(student.email),
    getProgressByGame(student.email),
    getMedalBoard(),
  ]);

  return (
    <AppShell user={{ displayName: student.displayName, image, medals: medals.length }}>
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black italic tracking-tight md:text-4xl">Medallas</h1>
            <p className="mt-2 max-w-xl text-xs leading-5 text-white/50">
              Termina un modo con todos los ejercicios correctos y te llevas la medalla. Repetir el
              pleno la sube de escalón: {TIERS.map((tier) => `${tier.label} a los ${tier.plenos}`).join(", ")}.
              Solo cuentan las partidas de {MEDAL_MIN_LENGTH} preguntas o más.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-300/25 bg-amber-400/10 px-5 py-3 text-center">
            <div className="text-2xl font-black text-amber-300">
              {medals.length}
              <span className="text-sm text-amber-200/50"> / {SCORED_GAMES.length}</span>
            </div>
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-200/60">
              conseguidas
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {SCORED_GAMES.map((game) => {
            const stat = progress.byGame.get(game.name);
            const plenos = stat?.plenos ?? 0;
            const tier = tierFor(plenos);
            const upcoming = nextTier(plenos);
            const category = categoryOf(game.category);
            const Icon = gameIcons[game.icon];

            if (!tier) {
              return (
                <article
                  key={game.name}
                  className="flex items-center gap-4 rounded-2xl border border-white/5 bg-slate-950/45 p-5 backdrop-blur-sm"
                >
                  <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl bg-white/5">
                    <Lock size={18} className="text-white/25" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black uppercase text-white/45">
                      {game.label}
                    </span>
                    <span className="block text-[11px] text-white/30">
                      Acierta los {MEDAL_MIN_LENGTH} ejercicios
                    </span>
                  </span>
                </article>
              );
            }

            return (
              <article
                key={game.name}
                className={`relative overflow-hidden rounded-2xl border bg-slate-950/60 p-5 backdrop-blur-sm ${tier.border} ${tier.glow}`}
              >
                <Crown className="absolute -right-5 -top-4 h-20 w-20 opacity-[0.07]" />

                <div className="flex items-center gap-4">
                  <span
                    className={`grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl ${category.iconBg}`}
                  >
                    <Icon size={20} className={category.accent} strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black uppercase text-white">
                      {game.label}
                    </span>
                    <span className="mt-1 flex items-center gap-1.5 text-[11px] text-white/45">
                      <Award size={12} />
                      {plenos} {plenos === 1 ? "pleno" : "plenos"}
                      {stat?.medalAt && ` · desde el ${formatDate(stat.medalAt)}`}
                    </span>
                  </span>
                  <span
                    className={`flex-shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${tier.border} ${tier.bg} ${tier.text}`}
                  >
                    {tier.label}
                  </span>
                </div>

                {upcoming && (
                  <div className="mt-4">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-white/35"
                        style={{ width: `${Math.round((plenos / upcoming.tier.plenos) * 100)}%` }}
                      />
                    </div>
                    <p className="mt-2 text-[10px] text-white/35">
                      {upcoming.missing} {upcoming.missing === 1 ? "pleno" : "plenos"} para{" "}
                      {upcoming.tier.label}
                    </p>
                  </div>
                )}
              </article>
            );
          })}
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-6 backdrop-blur-sm">
          <h2 className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-amber-200">
            Cuadro de honor
          </h2>

          {board.length ? (
            <ul className="space-y-2">
              {board.map((row, index) => (
                <li
                  key={row.email}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
                    row.email === student.email
                      ? "border-amber-300/30 bg-amber-400/10"
                      : "border-white/5 bg-white/5"
                  }`}
                >
                  <span className="w-6 flex-shrink-0 text-sm font-black text-white/35">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-white/85">{row.displayName}</span>
                    <span className="block truncate text-[10px] text-white/35">
                      {row.games.map(gameLabel).join(" · ")}
                    </span>
                  </span>
                  <span className="flex flex-shrink-0 items-center gap-1.5 text-sm font-black text-amber-300">
                    <Award size={14} />
                    {row.games.length}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-white/45">
              Nadie ha conseguido todavía un pleno. Puedes ser el primero.
            </p>
          )}
        </section>
      </div>
    </AppShell>
  );
}
