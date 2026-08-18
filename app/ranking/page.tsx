import { Trophy } from "lucide-react";
import AppShell from "../components/AppShell";
import { requireStudent } from "@/lib/session";
import { getRanking, listMedals, type RankingRow } from "@/lib/students";
import { SCORED_GAMES } from "@/lib/games";

export const metadata = { title: "Ranking · 21st Century Music" };

const Row = ({
  row,
  position,
  isMe,
}: {
  row: RankingRow;
  position: number;
  isMe: boolean;
}) => (
  <li
    className={`flex items-center gap-3 rounded-2xl border px-4 py-2.5 ${
      isMe ? "border-amber-300/30 bg-amber-400/10" : "border-white/5 bg-white/5"
    }`}
  >
    <span className="w-5 flex-shrink-0 text-xs font-black text-white/35">{position}</span>
    <span className="min-w-0 flex-1 truncate text-sm text-white/85">{row.displayName}</span>
    <span className="flex-shrink-0 text-right">
      <span className="block text-sm font-black text-amber-300">{row.points}</span>
      <span className="block text-[9px] uppercase tracking-widest text-white/35">
        {row.games} {row.games === 1 ? "partida" : "partidas"}
      </span>
    </span>
  </li>
);

export default async function RankingPage() {
  const { student, image } = await requireStudent();
  const [medals, ranking] = await Promise.all([listMedals(student.email), getRanking()]);

  return (
    <AppShell user={{ displayName: student.displayName, image, medals: medals.length }}>
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <h1 className="text-2xl font-black italic tracking-tight md:text-4xl">Ranking</h1>
          <p className="mt-1 text-xs text-white/50">
            Puntos = aciertos acumulados en las partidas terminadas.
          </p>
        </header>

        <section className="rounded-3xl border border-amber-300/20 bg-black/45 p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-amber-200">
            <Trophy size={15} />
            General
          </h2>

          {ranking.global.length ? (
            <ol className="space-y-2">
              {ranking.global.slice(0, 10).map((row, index) => (
                <Row
                  key={row.email}
                  row={row}
                  position={index + 1}
                  isMe={row.email === student.email}
                />
              ))}
            </ol>
          ) : (
            <p className="text-sm text-white/45">Aún no hay partidas registradas.</p>
          )}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {SCORED_GAMES.map((game) => {
            const rows = ranking.perGame[game.name] || [];
            return (
              <div
                key={game.name}
                className="rounded-3xl border border-white/10 bg-black/45 p-5"
              >
                <h3 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-white/70">
                  {game.name}
                </h3>
                {rows.length ? (
                  <ol className="space-y-1.5">
                    {rows.slice(0, 5).map((row, index) => (
                      <Row
                        key={row.email}
                        row={row}
                        position={index + 1}
                        isMe={row.email === student.email}
                      />
                    ))}
                  </ol>
                ) : (
                  <p className="text-xs text-white/30">Sin partidas todavía.</p>
                )}
              </div>
            );
          })}
        </section>
      </div>
    </AppShell>
  );
}
