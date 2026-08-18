import { Award, Lock } from "lucide-react";
import AppShell from "../components/AppShell";
import Crown from "../components/Crown";
import { gameIcons } from "../components/gameIcons";
import { SCORED_GAMES } from "@/lib/games";
import { requireStudent } from "@/lib/session";
import { getMedalBoard, listMedals } from "@/lib/students";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Medallas · 21st Century Music" };

export default async function MedallasPage() {
  const { student, image } = await requireStudent();
  const [medals, board] = await Promise.all([listMedals(student.email), getMedalBoard()]);

  const earned = new Map(medals.map((medal) => [medal.game, medal.createdAt]));

  return (
    <AppShell user={{ displayName: student.displayName, image, medals: medals.length }}>
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black italic tracking-tight md:text-4xl">Medallas</h1>
            <p className="mt-1 text-xs text-white/50">
              Una medalla por cada modo de juego terminado con todos los ejercicios correctos.
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

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SCORED_GAMES.map((game) => {
            const wonAt = earned.get(game.name);
            const Icon = gameIcons[game.icon];

            if (!wonAt) {
              return (
                <article
                  key={game.name}
                  className="flex items-center gap-4 rounded-3xl border border-white/5 bg-black/30 p-5"
                >
                  <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/5">
                    <Lock size={20} className="text-white/25" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black uppercase text-white/45">
                      {game.name}
                    </span>
                    <span className="block text-[11px] text-white/30">
                      Acierta todos los ejercicios
                    </span>
                  </span>
                </article>
              );
            }

            return (
              <article
                key={game.name}
                className="relative flex items-center gap-4 overflow-hidden rounded-3xl border border-amber-300/35 bg-gradient-to-br from-amber-400/20 to-amber-500/5 p-5 shadow-[0_10px_40px_rgba(251,191,36,0.12)]"
              >
                <Crown className="absolute -right-4 -top-3 h-16 w-16 opacity-15" />
                <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-400/20">
                  <Icon size={24} className="text-amber-300" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black uppercase text-amber-100">
                    {game.name}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-amber-200/70">
                    <Award size={12} />
                    Pleno el {formatDate(wonAt)}
                  </span>
                </span>
              </article>
            );
          })}
        </section>

        <section className="rounded-3xl border border-white/10 bg-black/45 p-6">
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
                      {row.games.join(" · ")}
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
