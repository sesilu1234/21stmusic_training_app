"use client";

/**
 * Diestro | Zurdo para los modos de guitarra.
 *
 * Es un selector de dos opciones con la activa resaltada, y no un botón con una
 * palabra: un botón que pone "Zurdo" se puede leer como "estás en zurdo" o como
 * "pulsa para pasar a zurdo". Así se ve qué hay ahora y qué otra cosa hay.
 * Solo pinta y avisa: quién guarda la preferencia es `useLeftHanded`
 * (lib/handedness.ts).
 */
export default function HandToggle({
  leftHanded,
  onChange,
}: {
  leftHanded: boolean;
  onChange: (leftHanded: boolean) => void;
}) {
  const options = [
    { label: "Diestro", value: false },
    { label: "Zurdo", value: true },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Orientación del mástil"
      className="inline-flex rounded-full border border-white/15 bg-black/40 p-0.5 backdrop-blur-sm"
    >
      {options.map((option) => {
        const active = option.value === leftHanded;
        return (
          <button
            key={option.label}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] transition ${
              active ? "bg-amber-400 text-black" : "text-white/50 hover:text-white"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
