import LevelGate from "@/app/components/LevelGate";

/**
 * Igual que `dos-acordes`: carpeta propia porque su juego no es el del motor de
 * `[nivel]`, así que la puerta va aquí y no en el layout de arriba.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <LevelGate gameSlug="/play/oido/acordes" levelSlug="dos-acordes-variable">
      {children}
    </LevelGate>
  );
}
