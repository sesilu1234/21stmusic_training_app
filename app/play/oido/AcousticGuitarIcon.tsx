/**
 * Guitarra acústica, en color como los emojis de al lado. El emoji 🎸 es una
 * eléctrica, y aquí suenan acústicas.
 *
 * - `nylon`: española, caja de madera y boca oscura.
 * - `steel`: estilo dobro, caja metálica gris y la placa redonda del
 *   resonador en lugar de la boca.
 */
const LOOKS = {
  nylon: { body: "#e8a042", edge: "#7a3d0f", neck: "#6b3410", head: "#3b1d0a" },
  steel: { body: "#b9c0c8", edge: "#4b5563", neck: "#3f3f46", head: "#27272a" },
} as const;

export function AcousticGuitarIcon({
  size = 16,
  variant = "nylon",
}: {
  size?: number;
  variant?: keyof typeof LOOKS;
}) {
  const look = LOOKS[variant];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="inline-block align-[-3px]"
    >
      {/* Mástil */}
      <path d="M12.6 11.4 20.2 3.8" stroke={look.neck} strokeWidth={2.4} strokeLinecap="round" />
      {/* Clavijero */}
      <path d="M19 2.2 21.8 5l-1.9 1.9-2.8-2.8z" fill={look.head} />
      {/* Caja: dos óvalos unidos por la cintura */}
      <path
        d="M11.2 7.3c-1.6-.9-3.6-.7-4.8.5-.9.9-1.1 2-1 3-1.3.1-2.4.5-3.2 1.3-1.9 1.9-1.5 5.3.9 7.7s5.8 2.8 7.7.9c.8-.8 1.2-1.9 1.3-3.2 1 .1 2.1-.1 3-1 1.2-1.2 1.4-3.2.5-4.8z"
        fill={look.body}
        stroke={look.edge}
        strokeWidth={1}
        strokeLinejoin="round"
      />
      {variant === "steel" ? (
        // Resonador: placa cromada con su aro y el centro.
        <>
          <circle cx="8.6" cy="15.4" r="3" fill="#e5e7eb" stroke="#4b5563" strokeWidth={0.8} />
          <circle cx="8.6" cy="15.4" r="1" fill="#6b7280" />
        </>
      ) : (
        <circle cx="10.2" cy="13.8" r="1.7" fill="#2a1406" />
      )}
      {/* Cuerdas */}
      <path d="M8.6 15.4 14.2 9.8" stroke={variant === "steel" ? "#f8fafc" : "#f5e6c8"} strokeWidth={0.5} />
      {/* Puente */}
      <path d="m5.2 16.2 2.6 2.6" stroke={look.head} strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}
