import Link from "next/link";
import { Award } from "lucide-react";
import AppShell from "./components/AppShell";
import { gameIcons } from "./components/gameIcons";
import { GAMES } from "@/lib/games";
import { requireStudent } from "@/lib/session";
import { listMedals } from "@/lib/students";

export default async function HomePage() {
  const { student, image } = await requireStudent();
  const medals = await listMedals(student.email);

  return (
    <AppShell user={{ displayName: student.displayName, image, medals: medals.length }}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black italic tracking-tight md:text-4xl">
              Hola, {student.displayName}
            </h1>
            <p className="mt-1 text-xs text-white/50">
              Elige un modo de juego y a por ello.
            </p>
          </div>

          <Link
            href="/medallas"
            className="flex items-center gap-2 rounded-2xl border border-amber-300/25 bg-amber-400/10 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-amber-200 transition hover:bg-amber-400/20"
          >
            <Award size={15} />
            {medals.length} {medals.length === 1 ? "medalla" : "medallas"}
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
          {GAMES.map((game) => {
            const Icon = gameIcons[game.icon];
            return (
              <Link
                key={game.name}
                href={game.slug}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/40 p-5 text-left shadow-xl transition hover:border-amber-300/30 hover:bg-black/60 md:p-8"
              >
                <span
                  className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl md:h-14 md:w-14 ${game.bg}`}
                >
                  <Icon size={26} className={game.accent} />
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-black uppercase italic text-white md:text-2xl">
                    {game.name}
                  </span>
                  <span className="block text-[11px] text-white/45 md:text-sm">{game.desc}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
