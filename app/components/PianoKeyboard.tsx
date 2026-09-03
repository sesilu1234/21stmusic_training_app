"use client";

import { useEffect, useRef } from "react";

/**
 * Teclado de piano dibujado con divs. Lo comparten todos los modos de piano:
 * unos solo iluminan teclas y otros recogen pulsaciones, así que aquí no hay
 * nada de lógica de juego — solo pintar y avisar de lo que se pulsa.
 *
 * Los semitonos son absolutos y con el mismo cero que `audio.ts`: 0 = Do
 * central. Así una tecla se puede mandar a sonar tal cual, sin convertir nada.
 */

/** Nombres en el sistema latino, que es el que usa el resto de la app. */
export const NOTE_NAMES = [
  "Do",
  "Do#",
  "Re",
  "Re#",
  "Mi",
  "Fa",
  "Fa#",
  "Sol",
  "Sol#",
  "La",
  "La#",
  "Si",
] as const;

/** Nombre de un semitono absoluto, sin octava. */
export const noteName = (semitone: number) =>
  NOTE_NAMES[((semitone % 12) + 12) % 12];

/** true si el semitono cae en tecla negra. */
export const isBlackKey = (semitone: number) =>
  [1, 3, 6, 8, 10].includes(((semitone % 12) + 12) % 12);

/**
 * Cómo se pinta una tecla marcada:
 *  - `root`   ámbar   — la nota de partida del enunciado
 *  - `hint`   cian    — una tecla que el ejercicio enciende para que la mires
 *  - `correct` verde  — acertada, o la que había que pulsar
 *  - `wrong`  rojo    — la que se ha pulsado y estaba mal
 */
export type KeyMark = "root" | "hint" | "correct" | "wrong";

const WHITE_OFFSETS = [0, 2, 4, 5, 7, 9, 11];

/** Negra que va después de la blanca `afterWhite` dentro de la octava. */
const BLACK_LAYOUT = [
  { afterWhite: 0, offset: 1 },
  { afterWhite: 1, offset: 3 },
  { afterWhite: 3, offset: 6 },
  { afterWhite: 4, offset: 8 },
  { afterWhite: 5, offset: 10 },
];

const WHITE_MARK: Record<KeyMark, string> = {
  root: "bg-amber-300 text-black",
  hint: "bg-sky-300 text-black",
  correct: "bg-emerald-300 text-black",
  wrong: "bg-rose-300 text-black",
};

const BLACK_MARK: Record<KeyMark, string> = {
  root: "bg-amber-400 text-black",
  hint: "bg-sky-400 text-black",
  correct: "bg-emerald-400 text-black",
  wrong: "bg-rose-400 text-black",
};

export interface PianoKeyboardProps {
  /** Semitono más grave. Tiene que ser un Do (múltiplo de 12) para que cuadre. */
  from?: number;
  /** Cuántas octavas se dibujan. */
  octaves?: number;
  /** Teclas marcadas: semitono absoluto → cómo pintarla. */
  marks?: Record<number, KeyMark>;
  /** Texto corto encima de una tecla concreta ("Mi", "5ª"…). */
  badges?: Record<number, string>;
  /** Letra del teclado del ordenador que toca esa tecla. Va dentro, al pie. */
  hints?: Record<number, string>;
  onPress?: (semitone: number) => void;
  /**
   * Si se pasa, la tecla avisa al pulsar y al soltar en vez de al hacer clic:
   * es lo que necesita una voz que suena mientras la mantienes (el órgano del
   * piano libre). Los modos que solo quieren "esta tecla" no lo pasan y siguen
   * funcionando a base de clics.
   */
  onRelease?: (semitone: number) => void;
  disabled?: boolean;
  /** Escribe el nombre en el pie de las teclas blancas. */
  showLabels?: boolean;
  /**
   * Si una tecla marcada escribe su nombre encima. Por defecto sí: en los modos
   * que corrigen una nota concreta, saber cuál era es media respuesta.
   *
   * Los de intervalos lo apagan. Ahí la pregunta es la distancia entre las dos
   * teclas, y con los nombres puestos se acaba contando de memoria ("de Do a
   * Sol es quinta") en vez de mirando el hueco, que es lo que se quiere
   * entrenar. Sin nombres se aprende por forma y por distancia.
   */
  markLabels?: boolean;
  /** Teclado más bajo, para pantallas donde compite con otras cosas. */
  compact?: boolean;
  className?: string;
}

export default function PianoKeyboard({
  from = 0,
  octaves = 2,
  marks = {},
  badges = {},
  hints = {},
  onPress,
  onRelease,
  disabled = false,
  showLabels = false,
  markLabels = true,
  compact = false,
  className = "",
}: PianoKeyboardProps) {
  const totalWhite = octaves * 7;
  const whiteWidth = 100 / totalWhite;
  const blackWidth = whiteWidth * 0.62;

  const whites = Array.from({ length: totalWhite }, (_, index) => {
    const octave = Math.floor(index / 7);
    return {
      semitone: from + octave * 12 + WHITE_OFFSETS[index % 7],
      index,
    };
  });

  const blacks = Array.from({ length: octaves }).flatMap((_, octave) =>
    BLACK_LAYOUT.map(({ afterWhite, offset }) => ({
      semitone: from + octave * 12 + offset,
      // El centro de la negra cae justo en la junta entre las dos blancas.
      left: (octave * 7 + afterWhite + 1) * whiteWidth - blackWidth / 2,
    })),
  );

  const press = (semitone: number) => {
    if (disabled || !onPress) return;
    onPress(semitone);
  };

  /**
   * Qué dedo está tocando qué tecla: id del puntero -> semitono.
   *
   * Antes cada tecla se quedaba con la captura de su puntero y esperaba a que
   * el "soltar" volviera a ella. Eso funciona con un ratón, que solo hay uno,
   * pero con varios dedos a la vez depende de cómo cada navegador reparte las
   * capturas, y en el móvil se perdían pulsaciones: no se podía hacer un
   * acorde. Con el mapa, cada dedo va por su cuenta y da igual cuántos haya.
   */
  const touching = useRef(new Map<number, number>());

  // Se escucha en la ventana, no en la tecla: así soltar cuenta aunque el dedo
  // (o el ratón) se haya ido fuera del teclado. Si no, la nota se quedaría
  // sonando para siempre.
  useEffect(() => {
    if (!onRelease) return;

    const end = (event: PointerEvent) => {
      const semitone = touching.current.get(event.pointerId);
      if (semitone === undefined) return;
      touching.current.delete(event.pointerId);
      onRelease(semitone);
    };

    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, [onRelease]);

  /**
   * Cómo escucha una tecla. Sin `onRelease` es un botón de toda la vida.
   *
   * Con `onRelease` hacen falta eventos de puntero: `click` llega cuando ya has
   * soltado, y para mantener una nota hay que enterarse en el momento de
   * apretar.
   */
  const keyHandlers = (semitone: number) => {
    if (disabled || !onPress) return {};
    if (!onRelease) return { onClick: () => press(semitone) };

    return {
      onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => {
        event.preventDefault();
        touching.current.set(event.pointerId, semitone);
        press(semitone);
      },
      // Un menú contextual por dejar el dedo apretado cancela la pulsación.
      onContextMenu: (event: React.MouseEvent) => event.preventDefault(),
    };
  };

  const badge = (semitone: number) =>
    badges[semitone] ? (
      <span className="pointer-events-none absolute -top-7 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-950 px-2 py-1 text-[9px] font-black tracking-[0.12em] text-white shadow-lg ring-1 ring-white/20">
        {badges[semitone]}
      </span>
    ) : null;

  return (
    <div
      className={`relative mx-auto w-full select-none ${className}`}
      role="group"
      aria-label="Teclado de piano"
      style={
        onRelease
          ? {
              // Sin esto el navegador puede leer dos dedos como un pellizco
              // para hacer zoom y cancelar las dos pulsaciones a la vez.
              touchAction: "none",
              WebkitUserSelect: "none",
              WebkitTapHighlightColor: "transparent",
            }
          : undefined
      }
    >
      {/* Marco oscuro: da el borde de piano y evita que las teclas floten. */}
      <div
        className={`relative w-full rounded-b-2xl rounded-t-lg bg-slate-950 p-1.5 pt-2 shadow-[0_14px_40px_rgba(0,0,0,0.5)] ring-1 ring-white/10 ${
          compact
            ? "h-[112px] sm:h-[134px] md:h-[152px]"
            : "h-[150px] sm:h-[185px] md:h-[215px]"
        }`}
      >
        <div className="relative flex h-full w-full">
          {whites.map(({ semitone, index }) => {
            const mark = marks[semitone];
            return (
              <button
                key={semitone}
                type="button"
                disabled={disabled || !onPress}
                {...keyHandlers(semitone)}
                aria-label={noteName(semitone)}
                style={{ width: `${whiteWidth}%`, touchAction: onRelease ? "none" : undefined }}
                className={`relative flex items-end justify-center rounded-b-[6px] border-r border-slate-400/60 pb-2 text-[10px] font-black transition-colors duration-100 last:border-r-0 md:text-xs ${
                  index === 0 ? "rounded-bl-xl" : ""
                } ${
                  mark
                    ? WHITE_MARK[mark]
                    : "bg-gradient-to-b from-white to-slate-200 text-slate-500"
                } ${
                  disabled || !onPress
                    ? "cursor-default"
                    : "cursor-pointer hover:from-amber-50 hover:to-amber-200 active:from-amber-200 active:to-amber-300"
                }`}
              >
                {badge(semitone)}
                <span className="flex flex-col items-center gap-1">
                  <span>
                    {showLabels || (mark && markLabels) ? noteName(semitone) : ""}
                  </span>
                  {hints[semitone] && (
                    <span className="rounded border border-black/20 bg-black/10 px-1 py-px text-[9px] uppercase leading-none text-black/45">
                      {hints[semitone]}
                    </span>
                  )}
                </span>
              </button>
            );
          })}

          {/* Las negras van encima, colocadas a mano sobre las juntas. */}
          {blacks.map(({ semitone, left }) => {
            const mark = marks[semitone];
            // `root` y `hint` son pistas de una pregunta que sigue en juego, y
            // esas teclas se tienen que poder pulsar como siempre. Solo cuando
            // la tecla ya esta corregida manda el color de la correccion.
            const corrected = mark === "correct" || mark === "wrong";
            return (
              <button
                key={semitone}
                type="button"
                disabled={disabled || !onPress}
                {...keyHandlers(semitone)}
                aria-label={noteName(semitone)}
                style={{
                  left: `${left}%`,
                  width: `${blackWidth}%`,
                  touchAction: onRelease ? "none" : undefined,
                }}
                className={`absolute top-0 z-20 flex h-[62%] items-end justify-center rounded-b-[5px] pb-1.5 text-[8px] font-black shadow-[0_3px_6px_rgba(0,0,0,0.6)] transition-colors duration-100 md:text-[10px] ${
                  mark
                    ? BLACK_MARK[mark]
                    : "bg-gradient-to-b from-slate-800 to-slate-950 text-slate-600"
                } ${
                  disabled || !onPress || corrected
                    ? "cursor-default"
                    : // El ambar de apretar era `amber-600`→`amber-800`, y
                      // amber-800 (#92400e) sobre una tecla negra se lee marron
                      // rojizo: al acertar una negra daba un fogonazo rojo justo
                      // antes de ponerse verde, que es la senal contraria a la
                      // que toca. Subido al tramo claro del ambar, que es
                      // inconfundible. Y en cuanto la tecla esta corregida deja
                      // de reaccionar a `:active`: el color lo manda la
                      // correccion, no el dedo.
                      "cursor-pointer hover:from-slate-700 hover:to-slate-900 active:from-amber-400 active:to-amber-600"
                }`}
              >
                {badge(semitone)}
                <span className="flex flex-col items-center gap-1">
                  <span>{mark && markLabels ? noteName(semitone) : ""}</span>
                  {hints[semitone] && (
                    <span className="rounded border border-white/15 bg-white/10 px-1 py-px text-[9px] uppercase leading-none text-white/55">
                      {hints[semitone]}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
