import LevelGate from "@/app/components/LevelGate";

/**
 * Este nivel tiene carpeta propia (no cae en `[nivel]`) porque su juego es
 * otro, así que su puerta también va aquí.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <LevelGate gameSlug="/play/oido/acordes" levelSlug="dos-acordes">
      {children}
    </LevelGate>
  );
}
