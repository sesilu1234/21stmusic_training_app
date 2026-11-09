/**
 * El icono del reto diario: una hoja de calendario con el número del reto de
 * hoy. Cambia cada día, que es justo lo que tiene el reto, y no es un icono
 * genérico de librería.
 */
export default function DailyIcon({ number, className = "" }: { number: number; className?: string }) {
  const digits = String(number).length;
  return (
    <span
      aria-hidden
      className={`relative flex flex-shrink-0 flex-col overflow-hidden rounded-[0.7rem] bg-[#fdf6e3] shadow-[0_2px_0_rgba(0,0,0,0.35)] ${className}`}
    >
      {/* La tira de arriba, con las dos anillas. */}
      <span className="relative h-[28%] bg-amber-400">
        <span className="absolute left-[26%] top-1/2 h-[45%] w-[9%] -translate-y-1/2 rounded-full bg-amber-800/60" />
        <span className="absolute right-[26%] top-1/2 h-[45%] w-[9%] -translate-y-1/2 rounded-full bg-amber-800/60" />
      </span>
      <span
        className="grid flex-1 place-items-center font-black leading-none tabular-nums text-slate-900"
        style={{
          fontFamily: "Chaney, sans-serif",
          fontSize: digits >= 3 ? "0.7em" : digits === 2 ? "0.85em" : "1em",
        }}
      >
        {number}
      </span>
    </span>
  );
}
