"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { RotateCw, Smartphone } from "lucide-react";

/**
 * Aviso de girar el móvil.
 *
 * El teclado de piano necesita ancho: en vertical, dos octavas son catorce
 * teclas blancas repartidas en 360 píxeles, y cada una queda más estrecha que
 * un dedo. De ahí que no se puedan pulsar dos notas a la vez sin fallar.
 *
 * No se puede girar la pantalla por las malas: `screen.orientation.lock()` solo
 * funciona a pantalla completa y en iOS no existe. Así que se pide por favor,
 * se ofrece el botón de pantalla completa donde sí se puede, y se deja salida
 * por si alguien tiene el giro bloqueado.
 */

const PHONE_PORTRAIT = "(max-width: 900px) and (orientation: portrait)";

const usePhonePortrait = () => {
  const subscribe = useCallback((notify: () => void) => {
    const query = window.matchMedia(PHONE_PORTRAIT);
    query.addEventListener("change", notify);
    return () => query.removeEventListener("change", notify);
  }, []);

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(PHONE_PORTRAIT).matches,
    // En el servidor no hay pantalla: se asume que no hace falta avisar, y ya
    // aparecerá el aviso al hidratar si toca.
    () => false,
  );
};

export default function RotateToLandscape({ children }: { children?: React.ReactNode }) {
  const isPhonePortrait = usePhonePortrait();
  const [dismissed, setDismissed] = useState(false);

  if (!isPhonePortrait || dismissed) return null;

  const goFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      // Solo existe en Android/Chrome, y solo a pantalla completa.
      const orientation = screen.orientation as ScreenOrientation & {
        lock?: (orientation: string) => Promise<void>;
      };
      await orientation.lock?.("landscape");
    } catch {
      // En iOS no se puede ni una cosa ni la otra. Se queda el aviso y ya lo
      // gira el usuario a mano.
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6 bg-slate-950/95 px-8 text-center backdrop-blur-sm">
      <div className="relative">
        <Smartphone size={54} className="text-white/25" strokeWidth={1.5} />
        <RotateCw
          size={24}
          className="absolute -right-3 -top-2 animate-pulse text-amber-300"
          strokeWidth={2.5}
        />
      </div>

      <div>
        <p
          className="text-xl font-black italic uppercase tracking-tight text-white"
          style={{ fontFamily: "Chaney, sans-serif" }}
        >
          Gira el móvil
        </p>
        <p className="mt-2 max-w-xs text-xs leading-relaxed text-white/45">
          {children ??
            "El teclado necesita ancho. En horizontal las teclas son el doble de grandes y puedes tocar acordes con varios dedos."}
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={goFullscreen}
          className="rounded-full bg-amber-400 px-6 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-black transition hover:bg-amber-300"
        >
          Pantalla completa
        </button>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30 transition hover:text-white/60"
        >
          Seguir en vertical
        </button>
      </div>
    </div>
  );
}
