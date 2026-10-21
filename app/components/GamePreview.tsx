import { GLYPH } from "@/lib/staff";

/**
 * La miniatura de cada modo en el menú: un trocito del propio ejercicio
 * dibujado en tinta sobre papel, en lugar de un icono genérico en un cuadrado
 * de color. Un pentagrama con la nota que preguntan, el mástil con su punto,
 * el teclado con sus teclas encendidas.
 *
 * Tinta negra sobre crema, como el pentagrama de los juegos (`StaffCard`), y
 * un solo color de más, el ámbar de la app, para marcar lo que se pregunta.
 *
 * Todo es SVG fijo, sin estado: se pinta en el servidor y no cuesta nada al
 * hidratar. Los glifos (clave, alteraciones) son de Bravura, que ya carga
 * `globals.css`; las cabezas de nota van a mano para no depender de ella.
 *
 * Va indexado por `name`, que es la clave estable del catálogo.
 */

const INK = "#1c1917";
/** Ámbar oscurecido: el amber-300 de la app no se lee sobre el papel. */
const ACCENT = "#d97706";
const KEY_WHITE = "#fffdf8";

const SANS = "var(--font-geist-sans), sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";

/* --- Pentagrama ---------------------------------------------------------- */

/** Espacio entre líneas. Las cinco van de y=22 (Fa5) a y=50 (Mi4). */
const SPACE = 7;
const BOTTOM_LINE = 50;

/** Grado diatónico respecto al Do central (Do4 = 0, Mi4 = 2, Fa5 = 10). */
const yOf = (degree: number) => BOTTOM_LINE - (degree - 2) * (SPACE / 2);

function Staff({ clef = true }: { clef?: boolean }) {
  return (
    <g>
      {[0, 1, 2, 3, 4].map((line) => (
        <line
          key={line}
          x1={6}
          x2={154}
          y1={22 + line * SPACE}
          y2={22 + line * SPACE}
          stroke={INK}
          strokeWidth={0.8}
        />
      ))}
      {clef && (
        <text x={10} y={yOf(4)} fontFamily="Bravura" fontSize={SPACE * 4} fill={INK}>
          {GLYPH.gClef}
        </text>
      )}
    </g>
  );
}

type NoteStyle = "black" | "whole" | "dashed";

function Note({
  x,
  degree,
  style = "black",
  stem = false,
  accent = false,
}: {
  x: number;
  degree: number;
  style?: NoteStyle;
  stem?: boolean;
  accent?: boolean;
}) {
  const y = yOf(degree);
  const color = accent || style === "dashed" ? ACCENT : INK;
  const stemUp = degree < 6;

  // Líneas adicionales: por debajo del Mi4 y por encima del Fa5, solo en los
  // grados pares (Do4, La5…), que son los que caen en línea.
  const ledgers: number[] = [];
  for (let d = 0; d >= degree; d -= 2) ledgers.push(d);
  for (let d = 12; d <= degree; d += 2) ledgers.push(d);

  return (
    <g>
      {ledgers.map((d) => (
        <line key={d} x1={x - 7} x2={x + 7} y1={yOf(d)} y2={yOf(d)} stroke={INK} strokeWidth={0.8} />
      ))}
      {style === "black" ? (
        <ellipse cx={x} cy={y} rx={4.4} ry={3.1} transform={`rotate(-20 ${x} ${y})`} fill={color} />
      ) : (
        <ellipse
          cx={x}
          cy={y}
          rx={4.8}
          ry={3.2}
          transform={`rotate(-20 ${x} ${y})`}
          fill="none"
          stroke={color}
          strokeWidth={style === "whole" ? 1.7 : 1.2}
          strokeDasharray={style === "dashed" ? "2 1.6" : undefined}
        />
      )}
      {stem &&
        (stemUp ? (
          <line x1={x + 4.1} x2={x + 4.1} y1={y - 0.8} y2={y - 24} stroke={color} strokeWidth={1} />
        ) : (
          <line x1={x - 4.1} x2={x - 4.1} y1={y + 0.8} y2={y + 24} stroke={color} strokeWidth={1} />
        ))}
    </g>
  );
}

function Glyph({ x, degree, glyph }: { x: number; degree: number; glyph: string }) {
  return (
    <text x={x} y={yOf(degree)} fontFamily="Bravura" fontSize={SPACE * 4} fill={INK} textAnchor="middle">
      {glyph}
    </text>
  );
}

function Label({
  x,
  y,
  children,
  accent = false,
  size = 10,
  font = SANS,
  anchor = "middle",
}: {
  x: number;
  y: number;
  children: React.ReactNode;
  accent?: boolean;
  size?: number;
  font?: string;
  anchor?: "start" | "middle" | "end";
}) {
  return (
    <text
      x={x}
      y={y}
      fontFamily={font}
      fontSize={size}
      fontWeight={700}
      fill={accent ? ACCENT : INK}
      textAnchor={anchor}
    >
      {children}
    </text>
  );
}

/* --- Mástil -------------------------------------------------------------- */

const NUT_X = 18;
const FRET_W = 26.5;
const STRING_Y0 = 16;
const STRING_GAP = 9.6;

/** Cuerda 0 = Mi agudo (arriba, como en una tablatura). Traste 1 en adelante. */
const fretX = (fret: number) => NUT_X + (fret - 0.5) * FRET_W;
const stringY = (string: number) => STRING_Y0 + string * STRING_GAP;

function Fretboard({ children }: { children?: React.ReactNode }) {
  return (
    <g>
      {[3, 5].map((fret) => (
        <circle key={fret} cx={fretX(fret)} cy={stringY(2.5)} r={2.6} fill={INK} opacity={0.16} />
      ))}
      <line x1={NUT_X} x2={NUT_X} y1={stringY(0) - 2} y2={stringY(5) + 2} stroke={INK} strokeWidth={3.5} />
      {[1, 2, 3, 4, 5].map((fret) => (
        <line
          key={fret}
          x1={NUT_X + fret * FRET_W}
          x2={NUT_X + fret * FRET_W}
          y1={stringY(0)}
          y2={stringY(5)}
          stroke={INK}
          strokeWidth={0.9}
          opacity={0.55}
        />
      ))}
      {[0, 1, 2, 3, 4, 5].map((string) => (
        <line
          key={string}
          x1={NUT_X}
          x2={154}
          y1={stringY(string)}
          y2={stringY(string)}
          stroke={INK}
          strokeWidth={0.6 + string * 0.2}
        />
      ))}
      {children}
    </g>
  );
}

function Dot({
  string,
  fret,
  accent = false,
  mark,
}: {
  string: number;
  fret: number;
  accent?: boolean;
  mark?: string;
}) {
  const x = fretX(fret);
  const y = stringY(string);
  return (
    <g>
      <circle cx={x} cy={y} r={4.6} fill={accent ? ACCENT : INK} />
      {mark && (
        <text x={x} y={y + 2.6} fontFamily={SANS} fontSize={7.5} fontWeight={700} fill={KEY_WHITE} textAnchor="middle">
          {mark}
        </text>
      )}
    </g>
  );
}

/* --- Teclado ------------------------------------------------------------- */

/** Diez teclas blancas, de Do a Mi de la octava siguiente (semitonos 0–16). */
const WHITE = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16];
const BLACK = [1, 3, 6, 8, 10, 13, 15];

type KeyMark = "accent" | "dot" | "accentDot";

function Keyboard({
  marks = {},
  top = 12,
  bottom = 70,
}: {
  marks?: Record<number, KeyMark>;
  top?: number;
  bottom?: number;
}) {
  const left = 10;
  const width = 14;
  const height = bottom - top;
  const blackHeight = height * 0.58;

  const whiteX = (semitone: number) => left + WHITE.indexOf(semitone) * width;
  const blackX = (semitone: number) => whiteX(semitone - 1) + width - 4.5;

  const dot = (semitone: number, cx: number, cy: number) => {
    const mark = marks[semitone];
    if (mark !== "dot" && mark !== "accentDot") return null;
    return <circle cx={cx} cy={cy} r={2.6} fill={mark === "accentDot" ? ACCENT : INK} />;
  };

  return (
    <g>
      {WHITE.map((s) => (
        <g key={s}>
          <rect
            x={whiteX(s)}
            y={top}
            width={width}
            height={height}
            rx={1.5}
            fill={marks[s] === "accent" ? ACCENT : KEY_WHITE}
            stroke={INK}
            strokeWidth={0.9}
          />
          {dot(s, whiteX(s) + width / 2, bottom - 7)}
        </g>
      ))}
      {BLACK.map((s) => (
        <g key={s}>
          <rect
            x={blackX(s)}
            y={top}
            width={9}
            height={blackHeight}
            rx={1}
            fill={marks[s] === "accent" ? ACCENT : INK}
            stroke={INK}
            strokeWidth={0.9}
          />
          {marks[s] === "dot" || marks[s] === "accentDot" ? (
            <circle
              cx={blackX(s) + 4.5}
              cy={top + blackHeight - 6}
              r={2.4}
              fill={marks[s] === "accentDot" ? ACCENT : KEY_WHITE}
            />
          ) : null}
        </g>
      ))}
    </g>
  );
}

/* --- Oído ---------------------------------------------------------------- */

/** Un golpe de sonido: barritas que crecen y se apagan. Determinista. */
function Burst({ cx, cy, accent = false }: { cx: number; cy: number; accent?: boolean }) {
  const bars = 11;
  return (
    <g fill={accent ? ACCENT : INK}>
      {Array.from({ length: bars }, (_, i) => {
        const envelope = Math.sin((Math.PI * (i + 0.5)) / bars);
        const wobble = 0.6 + 0.4 * Math.abs(Math.sin(i * 1.7));
        const h = 4 + 26 * envelope * wobble;
        const x = cx - (bars * 4.6) / 2 + i * 4.6;
        return <rect key={i} x={x} y={cy - h / 2} width={2.4} height={h} rx={1.2} />;
      })}
    </g>
  );
}

const wave = (amplitude: number, period: number, cy: number, phase = 0) => {
  const points: string[] = [];
  for (let x = 12; x <= 148; x += 2) {
    const y = cy + amplitude * Math.sin(((x - 12) / period) * Math.PI * 2 + phase);
    points.push(`${x},${y.toFixed(2)}`);
  }
  return `M${points.join(" L")}`;
};

/* --- Las miniaturas ------------------------------------------------------ */

const PREVIEWS: Record<string, () => React.ReactNode> = {
  "Lectura de notas": () => (
    <>
      <Staff />
      <Note x={62} degree={4} stem />
      <Note x={94} degree={8} stem accent />
      <Note x={126} degree={5} stem />
    </>
  ),

  "Acordes en el pentagrama": () => (
    <>
      <Staff />
      <Label x={70} y={13}>Dm</Label>
      {[1, 3, 5].map((d) => (
        <Note key={d} x={70} degree={d} style="whole" />
      ))}
      <Label x={116} y={13} accent>?</Label>
      {[4, 6, 8].map((d) => (
        <Note key={d} x={116} degree={d} style="whole" accent />
      ))}
    </>
  ),

  Armaduras: () => (
    <>
      <Staff />
      {[10, 7, 11, 8].map((d, i) => (
        <Glyph key={d} x={40 + i * 9} degree={d} glyph={GLYPH.sharp} />
      ))}
      <Label x={120} y={42} size={22} font={SERIF} accent>?</Label>
    </>
  ),

  Intervalos: () => (
    <>
      <Staff />
      <Note x={72} degree={2} style="whole" />
      <Note x={114} degree={7} style="whole" />
      <path d="M72 17 V12 H114 V17" fill="none" stroke={ACCENT} strokeWidth={1.1} />
      <Label x={93} y={10} accent size={9}>?</Label>
    </>
  ),

  "Construye el intervalo": () => (
    <>
      <Staff />
      <Label x={93} y={12} size={9}>+3ª m</Label>
      <Glyph x={62} degree={6} glyph={GLYPH.flat} />
      <Note x={74} degree={6} />
      <Note x={112} degree={8} style="dashed" />
    </>
  ),

  "Construye la escala": () => (
    <>
      <Staff />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((d, i) => (
        <Note key={d} x={42 + i * 15} degree={d} style={i < 5 ? "black" : "dashed"} />
      ))}
    </>
  ),

  "Construye el acorde": () => (
    <>
      <Staff />
      <Label x={62} y={14} anchor="start" size={11}>Am7</Label>
      <Note x={112} degree={5} style="whole" />
      <Note x={112} degree={7} style="whole" />
      <Note x={112} degree={9} style="dashed" />
      <Note x={112} degree={11} style="dashed" />
    </>
  ),

  "Modos griegos": () => (
    <>
      <Staff />
      {[1, 2, 3, 4, 5, 6, 7, 8].map((d, i) => (
        <Note key={d} x={42 + i * 15} degree={d} accent={d === 6} />
      ))}
    </>
  ),

  "Lectura rítmica": () => {
    const notes = [36, 62, 88, 106, 132];
    const y = 44;
    return (
      <>
        <line x1={8} x2={152} y1={y} y2={y} stroke={INK} strokeWidth={0.9} />
        <rect x={12} y={y - 8} width={2.2} height={16} fill={INK} />
        <rect x={16.5} y={y - 8} width={2.2} height={16} fill={INK} />
        {notes.map((x) => (
          <g key={x}>
            <ellipse cx={x} cy={y} rx={4.4} ry={3.1} transform={`rotate(-20 ${x} ${y})`} fill={INK} />
            <line x1={x + 4.1} x2={x + 4.1} y1={y - 0.8} y2={y - 24} stroke={INK} strokeWidth={1} />
          </g>
        ))}
        <rect x={92.1 - 0.5} y={y - 24} width={18.5} height={3.6} fill={INK} />
        {/* Los toques: una marca por golpe, la de ahora en ámbar. */}
        {notes.map((x, i) => (
          <rect key={x} x={x - 1.2} y={60} width={2.4} height={9} rx={1.2} fill={i === 2 ? ACCENT : INK} opacity={i === 2 ? 1 : 0.3} />
        ))}
      </>
    );
  },

  "Intervalos al oído": () => (
    <>
      <Burst cx={50} cy={50} />
      <Burst cx={110} cy={36} accent />
      <path d="M66 32 Q80 14 94 22" fill="none" stroke={INK} strokeWidth={1} strokeDasharray="2.5 2" />
      <Label x={80} y={16} accent size={11}>?</Label>
    </>
  ),

  "Acordes al oído": () => (
    <>
      <path d={wave(14, 60, 40)} fill="none" stroke={INK} strokeWidth={1.4} />
      <path d={wave(10, 48, 40, 1)} fill="none" stroke={INK} strokeWidth={1.4} opacity={0.55} />
      <path d={wave(8, 40, 40, 2)} fill="none" stroke={ACCENT} strokeWidth={1.6} />
    </>
  ),

  "Progresiones al oído": () => (
    <>
      {["I", "vi", "?", "V"].map((numeral, i) => {
        const x = 14 + i * 35;
        const unknown = numeral === "?";
        return (
          <g key={i}>
            <rect
              x={x}
              y={24}
              width={28}
              height={32}
              rx={3}
              fill="none"
              stroke={unknown ? ACCENT : INK}
              strokeWidth={1.1}
              strokeDasharray={unknown ? "3 2" : undefined}
            />
            <Label x={x + 14} y={46} size={15} font={SERIF} accent={unknown}>
              {numeral}
            </Label>
          </g>
        );
      })}
    </>
  ),

  "Modos al oído": () => {
    const steps = [0, 1, 2, 3, 4, 5, 6, 7];
    const point = (i: number) => ({ x: 22 + i * 16.5, y: 54 - i * 5 });
    return (
      <>
        <rect x={12} y={63} width={136} height={4} rx={2} fill={INK} />
        <path
          d={`M${steps.map((i) => `${point(i).x},${point(i).y}`).join(" L")}`}
          fill="none"
          stroke={INK}
          strokeWidth={0.9}
          opacity={0.4}
        />
        {steps.map((i) => (
          <circle key={i} cx={point(i).x} cy={point(i).y} r={3.4} fill={i === 5 ? ACCENT : INK} />
        ))}
      </>
    );
  },

  "Dictado melódico": () => {
    const melody = [
      [24, 30],
      [44, 20],
      [64, 26],
      [84, 14],
      [104, 22],
      [124, 30],
    ];
    return (
      <>
        <path
          d={`M${melody.map(([x, y]) => `${x},${y}`).join(" L")}`}
          fill="none"
          stroke={INK}
          strokeWidth={1}
          opacity={0.45}
        />
        {melody.map(([x, y], i) =>
          i < 4 ? (
            <circle key={x} cx={x} cy={y} r={3.4} fill={INK} />
          ) : (
            <circle key={x} cx={x} cy={y} r={3.4} fill="none" stroke={ACCENT} strokeWidth={1.2} strokeDasharray="2 1.5" />
          ),
        )}
        <Keyboard top={44} bottom={72} />
      </>
    );
  },

  "Notas en el mástil": () => (
    <Fretboard>
      <Dot string={2} fret={3} accent mark="?" />
    </Fretboard>
  ),

  "Intervalos en el mástil": () => (
    <Fretboard>
      <line
        x1={fretX(1)}
        y1={stringY(4)}
        x2={fretX(4)}
        y2={stringY(2)}
        stroke={ACCENT}
        strokeWidth={1.2}
        strokeDasharray="3 2"
      />
      <Dot string={4} fret={1} />
      <Dot string={2} fret={4} accent />
    </Fretboard>
  ),

  "Acordes en el mástil": () => (
    <Fretboard>
      <rect x={fretX(1) - 4} y={stringY(0) - 4.5} width={8} height={stringY(5) - stringY(0) + 9} rx={4} fill={INK} />
      <Dot string={2} fret={2} accent />
      <Dot string={3} fret={3} accent />
      <Dot string={4} fret={3} accent />
    </Fretboard>
  ),

  "Notas en el teclado": () => <Keyboard marks={{ 4: "accent" }} />,

  "Toca el intervalo": () => <Keyboard marks={{ 4: "dot", 11: "accent" }} />,

  "Reconoce el intervalo": () => <Keyboard marks={{ 2: "accent", 9: "accent" }} />,

  "Construye acordes": () => <Keyboard marks={{ 0: "accent", 4: "accent", 7: "accent" }} />,

  "Construye escalas": () => (
    <Keyboard
      marks={{ 2: "accentDot", 4: "accentDot", 6: "accentDot", 7: "accentDot", 9: "accentDot", 11: "accentDot", 13: "accentDot", 14: "accentDot" }}
    />
  ),

  Trivial: () => (
    <>
      {["A", "B", "C", "D"].map((letter, i) => {
        const x = 14 + (i % 2) * 70;
        const y = 14 + Math.floor(i / 2) * 28;
        const right = i === 2;
        return (
          <g key={letter}>
            <rect
              x={x}
              y={y}
              width={62}
              height={22}
              rx={4}
              fill={right ? ACCENT : "none"}
              stroke={right ? ACCENT : INK}
              strokeWidth={1.1}
            />
            <text x={x + 9} y={y + 15} fontFamily={SANS} fontSize={10} fontWeight={700} fill={right ? KEY_WHITE : INK}>
              {letter}
            </text>
            <rect x={x + 20} y={y + 9.5} width={right ? 30 : 34 - i * 3} height={3} rx={1.5} fill={right ? KEY_WHITE : INK} opacity={right ? 0.8 : 0.25} />
          </g>
        );
      })}
    </>
  ),

  "Piano libre": () => <Keyboard />,

  Vocalizaciones: () => {
    // Do-Mi-Sol-Do-Sol-Mi-Do, y la misma un poco más arriba: así se calienta.
    const shape = [0, 2, 4, 7, 4, 2, 0];
    const run = (offset: number, lift: number, color: string, opacity: number) => (
      <g opacity={opacity}>
        <path
          d={`M${shape.map((step, i) => `${offset + i * 10},${60 - lift - step * 4.5}`).join(" L")}`}
          fill="none"
          stroke={color}
          strokeWidth={1}
        />
        {shape.map((step, i) => (
          <circle key={i} cx={offset + i * 10} cy={60 - lift - step * 4.5} r={2.8} fill={color} />
        ))}
      </g>
    );
    return (
      <>
        {run(14, 0, INK, 0.35)}
        {run(84, 10, ACCENT, 1)}
      </>
    );
  },

  Rockschool: () => (
    <>
      <Staff />
      <Note x={50} degree={4} stem />
      <Note x={72} degree={6} stem />
      <Note x={94} degree={5} stem />
      <Note x={116} degree={8} stem accent />
      <Note x={138} degree={7} stem />
    </>
  ),
};

export const hasPreview = (name: string) => name in PREVIEWS;

export default function GamePreview({ name, className = "" }: { name: string; className?: string }) {
  const draw = PREVIEWS[name];
  if (!draw) return null;

  return (
    <svg viewBox="0 0 160 80" className={className} aria-hidden preserveAspectRatio="xMidYMid meet">
      {draw()}
    </svg>
  );
}
