/**
 * La tarjeta blanca donde va un pentagrama: negro sobre blanco, como una ficha
 * de papel. Antes cada modo lo metía en una caja oscura con el pentagrama en
 * blanco, y se leía peor. Una sola tarjeta para todos, para que no se separen.
 */
export default function StaffCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-[360px] rounded-[2.5rem] border-4 border-white bg-white px-6 py-2 shadow-2xl">
      {children}
    </div>
  );
}
