import Link from "next/link";
import type { HonorBoard } from "@/lib/honor";

/**
 * El cuadro de honor en la portada: una línea y ya. "🏆 Vas 14º · ver cuadro".
 *
 * Antes era una franja con tres podios; ahora el cuadro entero está en
 * /honor y aquí solo se dice dónde vas, que es lo que le importa a cada uno.
 */
export default function HonorStrip({ board }: { board: HonorBoard }) {
  const me = board.me;
  const text =
    me?.listed && me.rank > 0
      ? `Vas ${me.rank}º`
      : me?.listed
        ? "Aún sin medallas"
        : "Cuadro de honor";

  return (
    <Link
      href="/honor"
      className="group mb-7 flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm shadow-lg transition hover:border-amber-300/40"
    >
      <span aria-hidden>🏆</span>
      <span className="font-black text-white">{text}</span>
      <span className="text-white/40">·</span>
      <span className="font-bold text-amber-300 transition-colors group-hover:text-amber-200">
        {me?.listed ? "ver cuadro" : "ver"}
      </span>
    </Link>
  );
}
