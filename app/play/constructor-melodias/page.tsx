"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Play,
  Square,
  Activity,
  Trash2,
  Save,
  BookOpen,
  Volume1,
  RotateCcw,
  Sparkles,
  Music,
  Plus,
  Keyboard,
  ChevronUp,
  ChevronDown,
  Check,
} from "lucide-react";
import { useStoredThemeMode } from "@/lib/themeMode";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Nota {
  nota: string;
  octava: number;
  duracion?: number;
}
type RestDuracion = "corchea" | "negra" | "blanca" | "redonda";
interface RestStep {
  rest: true;
  duracion: RestDuracion;
}
type MelodiaStep = Nota[] | RestStep;
interface MelodiaGuardada {
  nombre: string;
  notas: MelodiaStep[];
}
type SonidoPreset = "warm" | "bright" | "dark" | "classic" | "sala" | "hall";

// ─── Constants ────────────────────────────────────────────────────────────────
const notasBase = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

const noteNamesEs: Record<string, string> = {
  C: "Do",
  "C#": "Do#",
  D: "Re",
  "D#": "Re#",
  E: "Mi",
  F: "Fa",
  "F#": "Fa#",
  G: "Sol",
  "G#": "Sol#",
  A: "La",
  "A#": "La#",
  B: "Si",
};

const REST_MULTIPLIERS: Record<RestDuracion, number> = {
  corchea: 0.5,
  negra: 1,
  blanca: 2,
  redonda: 4,
};
const REST_ICONS: Record<RestDuracion, string> = {
  corchea: "♪",
  negra: "♩",
  blanca: "𝅗𝅥",
  redonda: "𝅝",
};
const REST_NAMES: Record<RestDuracion, string> = {
  corchea: "Corchea",
  negra: "Negra",
  blanca: "Blanca",
  redonda: "Redonda",
};

const durationLabel = (units = 1) => {
  const parts: string[] = [];
  let remaining = Math.max(1, units);
  const values = [
    { value: 8, label: "Redonda" },
    { value: 4, label: "Blanca" },
    { value: 2, label: "Negra" },
    { value: 1, label: "Corchea" },
  ];
  for (const { value, label } of values) {
    while (remaining >= value) {
      parts.push(label);
      remaining -= value;
    }
  }
  return parts.join(" + ");
};

const splitDurationUnits = (units = 1) => {
  const parts: number[] = [];
  let remaining = Math.max(1, units);
  for (const value of [8, 4, 2, 1]) {
    while (remaining >= value) {
      parts.push(value);
      remaining -= value;
    }
  }
  return parts;
};

const durationShortLabel = (units: number) =>
  ({ 1: "1/8", 2: "1/4", 4: "1/2", 8: "1" })[units] || `${units}/8`;

// Computer keyboard → piano note mapping (QWERTY layout)
const KEY_TO_NOTE: Record<string, Nota> = {
  // Primera octava (y un par de la siguiente)
  q: { nota: "C", octava: 4 },
  "2": { nota: "C#", octava: 4 },
  w: { nota: "D", octava: 4 },
  "3": { nota: "D#", octava: 4 },
  e: { nota: "E", octava: 4 },
  r: { nota: "F", octava: 4 },
  "5": { nota: "F#", octava: 4 },
  t: { nota: "G", octava: 4 },
  "6": { nota: "G#", octava: 4 },
  y: { nota: "A", octava: 4 },
  "7": { nota: "A#", octava: 4 },
  u: { nota: "B", octava: 4 },
  "8": { nota: "C", octava: 5 },
  i: { nota: "C#", octava: 5 },

  // Segunda octava
  z: { nota: "C", octava: 5 },
  s: { nota: "C#", octava: 5 },
  x: { nota: "D", octava: 5 },
  d: { nota: "D#", octava: 5 },
  c: { nota: "E", octava: 5 },
  v: { nota: "F", octava: 5 },
  g: { nota: "F#", octava: 5 },
  b: { nota: "G", octava: 5 },
  h: { nota: "G#", octava: 5 },
  n: { nota: "A", octava: 5 },
  j: { nota: "A#", octava: 5 },
  m: { nota: "B", octava: 5 },
};

const KEY_TO_REST: Record<string, RestDuracion> = {};

// Reverse map: "C4" → "A", "C#4" → "W", etc.
const NOTE_TO_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(KEY_TO_NOTE).map(([k, v]) => [
    `${v.nota}${v.octava}`,
    k.toUpperCase(),
  ]),
);

const REST_TO_KEY: Record<RestDuracion, string> = Object.fromEntries(
  Object.entries(KEY_TO_REST).map(([k, v]) => [v, k.toUpperCase()]),
) as Record<RestDuracion, string>;

const SOUND_PRESETS: { id: SonidoPreset; label: string; icon: string }[] = [
  { id: "dark", label: "Piano", icon: "🎹" },
  { id: "bright", label: "Brillante", icon: "✨" },
  { id: "warm", label: "Cálido", icon: "🔥" },
  { id: "classic", label: "Synth", icon: "📐" },
  { id: "sala", label: "Sala", icon: "🏛️" },
  { id: "hall", label: "Hall", icon: "🌊" },
];

// ─── Type guards ──────────────────────────────────────────────────────────────
const isRestStep = (s: MelodiaStep): s is RestStep =>
  !Array.isArray(s) && "rest" in (s as any) && (s as any).rest === true;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const sanitizeMelody = (notas: any): MelodiaStep[] => {
  if (!Array.isArray(notas)) return [];
  const result: MelodiaStep[] = [];
  for (const step of notas) {
    if (step && step.rest === true) {
      const valid: RestDuracion[] = ["corchea", "negra", "blanca", "redonda"];
      result.push({
        rest: true,
        duracion: valid.includes(step.duracion) ? step.duracion : "negra",
      });
    } else if (Array.isArray(step)) {
      const f = step.filter(
        (n: any) =>
          n && typeof n.nota === "string" && typeof n.octava === "number",
      ).map((n: any) => ({
        nota: n.nota,
        octava: n.octava,
        duracion:
          typeof n.duracion === "number" && n.duracion > 0
            ? n.duracion
            : 1,
      }));
      if (f.length > 0) result.push(f as Nota[]);
    } else if (
      step &&
      typeof step.nota === "string" &&
      typeof step.octava === "number"
    ) {
      result.push([{ ...step, duracion: step.duracion || 1 }] as Nota[]);
    }
  }
  return result;
};

const formatStepLabel = (step: MelodiaStep): string => {
  if (isRestStep(step))
    return `${REST_ICONS[step.duracion]} ${REST_NAMES[step.duracion]}`;
  return (step as Nota[])
    .map(
      (n) =>
        `${noteNamesEs[n.nota] || n.nota}${n.octava} (${durationLabel(
          n.duracion,
        )})`,
    )
    .join(" + ");
};

const createReverbImpulse = (
  ctx: AudioContext,
  duration: number,
  decay: number,
): AudioBuffer => {
  const length = Math.floor(ctx.sampleRate * duration);
  const buf = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] =
        (Math.random() * 2 - 1) * Math.pow(Math.max(0, 1 - i / length), decay);
    }
  }
  return buf;
};

// ─── Default melodies ─────────────────────────────────────────────────────────
const buildDefaultMelodies = (): (MelodiaGuardada | null)[] => {
  const arr: (MelodiaGuardada | null)[] = Array(24).fill(null);
  const N = (nota: string, oct: number): Nota => ({ nota, octava: oct });
  const S = (...ns: Nota[]): Nota[] => ns;

  arr[0] = {
    nombre: "Escala Mayor (Do)",
    notas: [
      S(N("C", 4)),
      S(N("D", 4)),
      S(N("E", 4)),
      S(N("F", 4)),
      S(N("G", 4)),
      S(N("A", 4)),
      S(N("B", 4)),
      S(N("C", 5)),
      S(N("B", 4)),
      S(N("A", 4)),
      S(N("G", 4)),
      S(N("F", 4)),
      S(N("E", 4)),
      S(N("D", 4)),
      S(N("C", 4)),
    ],
  };
  arr[1] = {
    nombre: "Escala Menor (La)",
    notas: [
      S(N("A", 4)),
      S(N("B", 4)),
      S(N("C", 5)),
      S(N("D", 5)),
      S(N("E", 5)),
      S(N("F", 5)),
      S(N("G", 5)),
      S(N("A", 5)),
      S(N("G", 5)),
      S(N("F", 5)),
      S(N("E", 5)),
      S(N("D", 5)),
      S(N("C", 5)),
      S(N("B", 4)),
      S(N("A", 4)),
    ],
  };
  arr[2] = {
    nombre: "Calentamiento: Arpegio",
    notas: [
      S(N("C", 4)),
      S(N("E", 4)),
      S(N("G", 4)),
      S(N("C", 5)),
      S(N("G", 4)),
      S(N("E", 4)),
      S(N("C", 4)),
    ],
  };
  arr[3] = {
    nombre: "Calentamiento: 5 Notas",
    notas: [
      S(N("C", 4)),
      S(N("D", 4)),
      S(N("E", 4)),
      S(N("F", 4)),
      S(N("G", 4)),
      S(N("F", 4)),
      S(N("E", 4)),
      S(N("D", 4)),
      S(N("C", 4)),
    ],
  };
  arr[4] = {
    nombre: "Legato 1-3-5-3-1",
    notas: [
      S(N("C", 4)),
      S(N("E", 4)),
      S(N("G", 4)),
      S(N("E", 4)),
      S(N("C", 4)),
    ],
  };
  arr[5] = {
    nombre: "Salto de Octava",
    notas: [S(N("C", 4)), S(N("C", 5)), S(N("C", 4))],
  };
  arr[6] = {
    nombre: "Trino: Do-Re-Do",
    notas: [
      S(N("C", 4)),
      S(N("D", 4)),
      S(N("E", 4)),
      S(N("D", 4)),
      S(N("E", 4)),
      S(N("F", 4)),
      S(N("E", 4)),
      S(N("F", 4)),
      S(N("G", 4)),
      S(N("F", 4)),
      S(N("G", 4)),
      S(N("A", 4)),
      S(N("G", 4)),
      S(N("A", 4)),
      S(N("B", 4)),
      S(N("A", 4)),
      S(N("B", 4)),
      S(N("C", 5)),
      S(N("C", 5)),
      S(N("B", 4)),
      S(N("A", 4)),
      S(N("B", 4)),
      S(N("A", 4)),
      S(N("G", 4)),
      S(N("A", 4)),
      S(N("G", 4)),
      S(N("F", 4)),
      S(N("G", 4)),
      S(N("F", 4)),
      S(N("E", 4)),
      S(N("F", 4)),
      S(N("E", 4)),
      S(N("D", 4)),
      S(N("E", 4)),
      S(N("D", 4)),
      S(N("C", 4)),
    ],
  };
  arr[7] = {
    nombre: "Escala Cromática ↑",
    notas: [
      S(N("C", 4)),
      S(N("C#", 4)),
      S(N("D", 4)),
      S(N("D#", 4)),
      S(N("E", 4)),
      S(N("F", 4)),
      S(N("F#", 4)),
      S(N("G", 4)),
      S(N("G#", 4)),
      S(N("A", 4)),
      S(N("A#", 4)),
      S(N("B", 4)),
      S(N("C", 5)),
    ],
  };
  return arr;
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function ConstructorMelodias() {
  const router = useRouter();
  const [isDarkMode] = useStoredThemeMode();

  // Core state
  const [isMounted, setIsMounted] = useState(false);
  const [melodia, setMelodia] = useState<MelodiaStep[]>([]);
  const [bpm, setBpm] = useState(120);
  const [volume, setVolume] = useState(0.8);
  const [transposicion, setTransposicion] = useState(0);
  const [sonidoPreset, setSonidoPreset] = useState<SonidoPreset>("dark");
  const [melodiasGuardadas, setMelodiasGuardadas] = useState<
    (MelodiaGuardada | null)[]
  >(Array(24).fill(null));
  const [isPlaying, setIsPlaying] = useState(false);
  const [melodiaActivaIndex, setMelodiaActivaIndex] = useState<number>(-1);
  const [activeNotes, setActiveNotes] = useState<Record<string, boolean>>({});

  // New feature states
  const [modoAcorde, setModoAcorde] = useState(false);
  const [currentChord, setCurrentChord] = useState<Nota[]>([]);
  const [modoLibre, setModoLibre] = useState(false);
  const [modoTeclado, setModoTeclado] = useState(false);
  const [listenReps, setListenReps] = useState(1);
  const [listenSettingsOpen, setListenSettingsOpen] = useState(false);
  const [chainSettingsOpen, setChainSettingsOpen] = useState(false);
  const [chainSemitones, setChainSemitones] = useState(1);
  const [chainReverseMelody, setChainReverseMelody] = useState(false);
  const [chainReturnToRoot, setChainReturnToRoot] = useState(false);
  const [chainRepeatReverseTurnaround, setChainRepeatReverseTurnaround] =
    useState(false);
  const [chainRepeatReturnTurnaround, setChainRepeatReturnTurnaround] =
    useState(false);
  const [chainPauseReverseTurnaround, setChainPauseReverseTurnaround] =
    useState(true);
  const [chainPauseReturnTurnaround, setChainPauseReturnTurnaround] =
    useState(true);
  const [currentPlayingStep, setCurrentPlayingStep] = useState<number | null>(
    null,
  );
  const [predefinedOpen, setPredefinedOpen] = useState(true);
  const [userSlotsOpen, setUserSlotsOpen] = useState(true);
  const [nextNoteArmed, setNextNoteArmed] = useState(false);

  // Playback refs (avoid stale closures)
  const isPlayingRef = useRef(false);
  const playbackRunIdRef = useRef(0);
  const bpmRef = useRef(120);
  const volumeRef = useRef(0.8);
  const transposicionRef = useRef(0);
  const sonidoPresetRef = useRef<SonidoPreset>("dark");
  const melodiaRef = useRef<MelodiaStep[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const reverbRoomRef = useRef<AudioBuffer | null>(null);
  const reverbHallRef = useRef<AudioBuffer | null>(null);

  // Mutable refs for keyboard handler (prevent stale closure in useEffect)
  const modoTecladoRef = useRef(false);
  const modoAcordeRef = useRef(false);
  const modoLibreRef = useRef(false);
  const hoveredStepRef = useRef<number | null>(null);
  const forceNextNoteRef = useRef(false);
  const handleKeyRef = useRef<(nota: string, octava: number) => void>(() => { });
  const handlePianoKeyUpRef = useRef<(nota: string, octava: number) => void>(
    () => { },
  );
  const noteFnsRef = useRef<Map<string, () => void>>(new Map());

  // Sync state → refs
  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);
  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);
  useEffect(() => {
    transposicionRef.current = transposicion;
  }, [transposicion]);
  useEffect(() => {
    sonidoPresetRef.current = sonidoPreset;
  }, [sonidoPreset]);
  useEffect(() => {
    melodiaRef.current = melodia;
  }, [melodia]);
  useEffect(() => {
    modoTecladoRef.current = modoTeclado;
  }, [modoTeclado]);
  useEffect(() => {
    modoAcordeRef.current = modoAcorde;
  }, [modoAcorde]);
  useEffect(() => {
    modoLibreRef.current = modoLibre;
  }, [modoLibre]);

  // ── Local storage & hydration ──────────────────────────────────────────────
  useEffect(() => {
    setIsMounted(true);
    const data = localStorage.getItem("melodiasGuardadas_v2");
    if (data) {
      try {
        const parsed = JSON.parse(data);
        const slots: (MelodiaGuardada | null)[] = Array(24).fill(null);
        parsed.forEach((item: any, i: number) => {
          if (i < 24 && item)
            slots[i] = {
              nombre: item.nombre,
              notas: sanitizeMelody(item.notas),
            };
        });
        const defaultTrino = buildDefaultMelodies()[6];
        if (defaultTrino && slots[6]?.nombre === "Trino: Do-Re-Do") {
          slots[6] = defaultTrino;
          localStorage.setItem(
            "melodiasGuardadas_v2",
            JSON.stringify(slots.filter(Boolean)),
          );
        }
        setMelodiasGuardadas(slots);
      } catch (e) {
        console.error(e);
      }
    } else {
      const defaults = buildDefaultMelodies();
      setMelodiasGuardadas(defaults);
      localStorage.setItem(
        "melodiasGuardadas_v2",
        JSON.stringify(defaults.filter(Boolean)),
      );
    }
  }, []);

  const persistSlots = (slots: (MelodiaGuardada | null)[]) => {
    localStorage.setItem(
      "melodiasGuardadas_v2",
      JSON.stringify(slots.filter(Boolean)),
    );
  };

  // ── Audio engine ──────────────────────────────────────────────────────────
  const initAudio = () => {
    if (!audioContextRef.current) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AC();
    }
    if (audioContextRef.current.state === "suspended")
      audioContextRef.current.resume();
  };

  const playNote = (nota: string, octava: number, trans = 0) => {
    try {
      initAudio();
      const ctx = audioContextRef.current!;
      const index = notasBase.indexOf(nota) + (octava - 4) * 12 + trans;
      const freq = 440 * Math.pow(2, (index - 9) / 12);
      const vol = volumeRef.current;
      const preset = sonidoPresetRef.current;
      const masterGain = ctx.createGain();

      const connectDest = (
        node: AudioNode,
        wetRatio = 0,
        reverbBuf?: AudioBuffer | null,
      ) => {
        if (wetRatio > 0 && reverbBuf) {
          const dryG = ctx.createGain();
          dryG.gain.value = 1 - wetRatio;
          const wetG = ctx.createGain();
          wetG.gain.value = wetRatio;
          const conv = ctx.createConvolver();
          conv.buffer = reverbBuf;
          node.connect(dryG);
          dryG.connect(ctx.destination);
          node.connect(conv);
          conv.connect(wetG);
          wetG.connect(ctx.destination);
        } else {
          node.connect(ctx.destination);
        }
      };

      if (preset === "warm" || preset === "sala" || preset === "hall") {
        const oscS = ctx.createOscillator();
        oscS.type = "sine";
        oscS.frequency.value = freq;
        const oscT = ctx.createOscillator();
        oscT.type = "triangle";
        oscT.frequency.value = freq;
        const filt = ctx.createBiquadFilter();
        filt.type = "lowpass";
        filt.frequency.value = 900;
        filt.Q.value = 1;
        const gS = ctx.createGain();
        gS.gain.value = 0.7;
        const gT = ctx.createGain();
        gT.gain.value = 0.3;
        oscS.connect(gS);
        oscT.connect(gT);
        gS.connect(filt);
        gT.connect(filt);
        filt.connect(masterGain);
        masterGain.gain.setValueAtTime(0, ctx.currentTime);
        masterGain.gain.linearRampToValueAtTime(
          vol * 0.45,
          ctx.currentTime + 0.04,
        );
        oscS.start();
        oscT.start();
        const dur = 0.55;
        masterGain.gain.setValueAtTime(
          vol * 0.45,
          ctx.currentTime + dur - 0.15,
        );
        masterGain.gain.exponentialRampToValueAtTime(
          0.0001,
          ctx.currentTime + dur,
        );
        oscS.stop(ctx.currentTime + dur);
        oscT.stop(ctx.currentTime + dur);

        const wet = preset === "sala" ? 0.3 : preset === "hall" ? 0.5 : 0;
        if (wet > 0) {
          if (preset === "sala" && !reverbRoomRef.current)
            reverbRoomRef.current = createReverbImpulse(ctx, 0.8, 3);
          if (preset === "hall" && !reverbHallRef.current)
            reverbHallRef.current = createReverbImpulse(ctx, 2.2, 2);
          connectDest(
            masterGain,
            wet,
            preset === "sala" ? reverbRoomRef.current : reverbHallRef.current,
          );
        } else {
          masterGain.connect(ctx.destination);
        }
      } else if (preset === "bright") {
        const oscSaw = ctx.createOscillator();
        oscSaw.type = "sawtooth";
        oscSaw.frequency.value = freq;
        const oscSine = ctx.createOscillator();
        oscSine.type = "sine";
        oscSine.frequency.value = freq;
        const filt = ctx.createBiquadFilter();
        filt.type = "lowpass";
        filt.frequency.value = 3200;
        filt.Q.value = 1.2;
        const gSaw = ctx.createGain();
        gSaw.gain.value = 0.4;
        const gSin = ctx.createGain();
        gSin.gain.value = 0.6;
        oscSaw.connect(gSaw);
        oscSine.connect(gSin);
        gSaw.connect(filt);
        gSin.connect(filt);
        filt.connect(masterGain);
        masterGain.gain.setValueAtTime(0, ctx.currentTime);
        masterGain.gain.linearRampToValueAtTime(
          vol * 0.35,
          ctx.currentTime + 0.015,
        );
        oscSaw.start();
        oscSine.start();
        const dur = 0.4;
        masterGain.gain.setValueAtTime(
          vol * 0.35,
          ctx.currentTime + dur - 0.08,
        );
        masterGain.gain.exponentialRampToValueAtTime(
          0.0001,
          ctx.currentTime + dur,
        );
        oscSaw.stop(ctx.currentTime + dur);
        oscSine.stop(ctx.currentTime + dur);
        masterGain.connect(ctx.destination);
      } else if (preset === "dark") {
        const oscS = ctx.createOscillator();
        oscS.type = "sine";
        oscS.frequency.value = freq;
        const oscT = ctx.createOscillator();
        oscT.type = "triangle";
        oscT.frequency.value = freq * 2;
        const filt = ctx.createBiquadFilter();
        filt.type = "lowpass";
        filt.frequency.value = 2400;
        filt.Q.value = 0.7;
        const gS = ctx.createGain();
        gS.gain.value = 0.75;
        const gT = ctx.createGain();
        gT.gain.value = 0.25;
        oscS.connect(gS);
        oscT.connect(gT);
        gS.connect(filt);
        gT.connect(filt);
        filt.connect(masterGain);
        masterGain.gain.setValueAtTime(0, ctx.currentTime);
        masterGain.gain.linearRampToValueAtTime(
          vol * 0.48,
          ctx.currentTime + 0.008,
        );
        oscS.start();
        oscT.start();
        const dur = 0.75;
        masterGain.gain.exponentialRampToValueAtTime(
          vol * 0.18,
          ctx.currentTime + 0.22,
        );
        masterGain.gain.setValueAtTime(vol * 0.18, ctx.currentTime + dur - 0.12);
        masterGain.gain.exponentialRampToValueAtTime(
          0.0001,
          ctx.currentTime + dur,
        );
        oscS.stop(ctx.currentTime + dur);
        oscT.stop(ctx.currentTime + dur);
        masterGain.connect(ctx.destination);
      } else {
        // classic synth
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.value = freq;
        osc.connect(masterGain);
        masterGain.connect(ctx.destination);
        masterGain.gain.setValueAtTime(0, ctx.currentTime);
        masterGain.gain.linearRampToValueAtTime(
          vol * 0.4,
          ctx.currentTime + 0.02,
        );
        osc.start();
        const dur = 0.35;
        masterGain.gain.setValueAtTime(vol * 0.4, ctx.currentTime + dur - 0.05);
        masterGain.gain.exponentialRampToValueAtTime(
          0.0001,
          ctx.currentTime + dur,
        );
        osc.stop(ctx.currentTime + dur);
      }
    } catch (e) {
      console.error("Audio error:", e);
    }
  };

  // Returns a stop function; call it on key/pointer release for sustain.
  const startNote = (nota: string, octava: number, trans = 0): (() => void) => {
    try {
      initAudio();
      const ctx = audioContextRef.current!;
      const index = notasBase.indexOf(nota) + (octava - 4) * 12 + trans;
      const freq = 440 * Math.pow(2, (index - 9) / 12);
      const vol = volumeRef.current;
      const preset = sonidoPresetRef.current;
      const masterGain = ctx.createGain();
      const oscs: OscillatorNode[] = [];

      const connectDest = (
        node: AudioNode,
        wetRatio = 0,
        reverbBuf?: AudioBuffer | null,
      ) => {
        if (wetRatio > 0 && reverbBuf) {
          const dryG = ctx.createGain();
          dryG.gain.value = 1 - wetRatio;
          const wetG = ctx.createGain();
          wetG.gain.value = wetRatio;
          const conv = ctx.createConvolver();
          conv.buffer = reverbBuf;
          node.connect(dryG);
          dryG.connect(ctx.destination);
          node.connect(conv);
          conv.connect(wetG);
          wetG.connect(ctx.destination);
        } else {
          node.connect(ctx.destination);
        }
      };

      if (preset === "warm" || preset === "sala" || preset === "hall") {
        const oscS = ctx.createOscillator();
        oscS.type = "sine";
        oscS.frequency.value = freq;
        const oscT = ctx.createOscillator();
        oscT.type = "triangle";
        oscT.frequency.value = freq;
        const filt = ctx.createBiquadFilter();
        filt.type = "lowpass";
        filt.frequency.value = 900;
        filt.Q.value = 1;
        const gS = ctx.createGain();
        gS.gain.value = 0.7;
        const gT = ctx.createGain();
        gT.gain.value = 0.3;
        oscS.connect(gS);
        oscT.connect(gT);
        gS.connect(filt);
        gT.connect(filt);
        filt.connect(masterGain);
        masterGain.gain.setValueAtTime(0, ctx.currentTime);
        masterGain.gain.linearRampToValueAtTime(
          vol * 0.45,
          ctx.currentTime + 0.04,
        );
        oscS.start();
        oscT.start();
        oscs.push(oscS, oscT);
        const wet = preset === "sala" ? 0.3 : preset === "hall" ? 0.5 : 0;
        if (wet > 0) {
          if (preset === "sala" && !reverbRoomRef.current)
            reverbRoomRef.current = createReverbImpulse(ctx, 0.8, 3);
          if (preset === "hall" && !reverbHallRef.current)
            reverbHallRef.current = createReverbImpulse(ctx, 2.2, 2);
          connectDest(
            masterGain,
            wet,
            preset === "sala" ? reverbRoomRef.current : reverbHallRef.current,
          );
        } else {
          masterGain.connect(ctx.destination);
        }
      } else if (preset === "bright") {
        const oscSaw = ctx.createOscillator();
        oscSaw.type = "sawtooth";
        oscSaw.frequency.value = freq;
        const oscSine = ctx.createOscillator();
        oscSine.type = "sine";
        oscSine.frequency.value = freq;
        const filt = ctx.createBiquadFilter();
        filt.type = "lowpass";
        filt.frequency.value = 3200;
        filt.Q.value = 1.2;
        const gSaw = ctx.createGain();
        gSaw.gain.value = 0.4;
        const gSin = ctx.createGain();
        gSin.gain.value = 0.6;
        oscSaw.connect(gSaw);
        oscSine.connect(gSin);
        gSaw.connect(filt);
        gSin.connect(filt);
        filt.connect(masterGain);
        masterGain.gain.setValueAtTime(0, ctx.currentTime);
        masterGain.gain.linearRampToValueAtTime(
          vol * 0.35,
          ctx.currentTime + 0.015,
        );
        oscSaw.start();
        oscSine.start();
        oscs.push(oscSaw, oscSine);
        masterGain.connect(ctx.destination);
      } else if (preset === "dark") {
        const oscS = ctx.createOscillator();
        oscS.type = "sine";
        oscS.frequency.value = freq;
        const oscT = ctx.createOscillator();
        oscT.type = "triangle";
        oscT.frequency.value = freq * 2;
        const filt = ctx.createBiquadFilter();
        filt.type = "lowpass";
        filt.frequency.value = 2400;
        filt.Q.value = 0.7;
        const gS = ctx.createGain();
        gS.gain.value = 0.75;
        const gT = ctx.createGain();
        gT.gain.value = 0.25;
        oscS.connect(gS);
        oscT.connect(gT);
        gS.connect(filt);
        gT.connect(filt);
        filt.connect(masterGain);
        masterGain.gain.setValueAtTime(0, ctx.currentTime);
        masterGain.gain.linearRampToValueAtTime(
          vol * 0.48,
          ctx.currentTime + 0.008,
        );
        masterGain.gain.exponentialRampToValueAtTime(
          vol * 0.2,
          ctx.currentTime + 0.24,
        );
        oscS.start();
        oscT.start();
        oscs.push(oscS, oscT);
        masterGain.connect(ctx.destination);
      } else {
        // classic synth
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.value = freq;
        osc.connect(masterGain);
        masterGain.connect(ctx.destination);
        masterGain.gain.setValueAtTime(0, ctx.currentTime);
        masterGain.gain.linearRampToValueAtTime(
          vol * 0.4,
          ctx.currentTime + 0.02,
        );
        osc.start();
        oscs.push(osc);
      }

      return () => {
        try {
          const t = ctx.currentTime;
          masterGain.gain.cancelScheduledValues(t);
          masterGain.gain.setValueAtTime(masterGain.gain.value, t);
          masterGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
          oscs.forEach((o) => {
            try {
              o.stop(t + 0.2);
            } catch { }
          });
        } catch { }
      };
    } catch (e) {
      console.error("Audio error:", e);
      return () => { };
    }
  };

  // ── Key highlight helpers ──────────────────────────────────────────────────
  const getTransposed = (nota: string, octava: number, trans: number) => {
    const idx = notasBase.indexOf(nota) + (octava - 4) * 12 + trans;
    const mod = (n: number, m: number) => ((n % m) + m) % m;
    return { nota: notasBase[mod(idx, 12)], octava: 4 + Math.floor(idx / 12) };
  };

  const highlightKey = (
    nota: string,
    octava: number,
    trans: number,
    dur: number,
  ) => {
    const { nota: nt, octava: oc } = getTransposed(nota, octava, trans);
    const key = `${nt}${oc}`;
    setActiveNotes((p) => ({ ...p, [key]: true }));
    setTimeout(() => setActiveNotes((p) => ({ ...p, [key]: false })), dur);
  };

  // ── Playback ──────────────────────────────────────────────────────────────
  const stopPlayback = () => {
    playbackRunIdRef.current += 1;
    isPlayingRef.current = false;
    setIsPlaying(false);
    setActiveNotes({});
    setCurrentPlayingStep(null);
  };

  const runWithPlayingState = async (fn: (runId: number) => Promise<void>) => {
    stopPlayback();
    const runId = playbackRunIdRef.current + 1;
    playbackRunIdRef.current = runId;
    await new Promise((r) => setTimeout(r, 60));
    if (playbackRunIdRef.current !== runId) return;
    isPlayingRef.current = true;
    setIsPlaying(true);
    try {
      await fn(runId);
    } catch (e) {
      console.error(e);
    } finally {
      if (playbackRunIdRef.current === runId) {
        setIsPlaying(false);
        isPlayingRef.current = false;
        setActiveNotes({});
        setCurrentPlayingStep(null);
      }
    }
  };

  const isCurrentPlaybackRun = (runId: number) =>
    isPlayingRef.current && playbackRunIdRef.current === runId;

  const playMelodyOnce = async (
    trans: number,
    runId: number,
    reverse = false,
    repeatTurnaround = false,
  ) => {
    const sequence = melodiaRef.current.map((step, index) => ({ step, index }));
    if (reverse) {
      sequence.reverse();
      if (!repeatTurnaround) sequence.shift();
    }

    for (const { step, index } of sequence) {
      if (!isCurrentPlaybackRun(runId)) return;
      setCurrentPlayingStep(index);

      if (isRestStep(step)) {
        const beat = 60000 / bpmRef.current;
        await new Promise((r) =>
          setTimeout(r, beat * REST_MULTIPLIERS[step.duracion]),
        );
      } else {
        const notes = step as Nota[];
        notes.forEach((n) => playNote(n.nota, n.octava, trans));
        const beat = 60000 / bpmRef.current;
        const duration = beat * ((notes[0]?.duracion || 1) / 2);
        notes.forEach((n) =>
          highlightKey(n.nota, n.octava, trans, Math.min(duration * 0.85, 450)),
        );
        await new Promise((r) => setTimeout(r, duration));
      }
    }
  };

  const playMelodyLoop = async (
    repetir: number,
    trans: number,
    runId: number,
  ) => {
    for (let rep = 0; rep < repetir; rep++) {
      await playMelodyOnce(trans, runId);
      if (!isCurrentPlaybackRun(runId)) return;
      if (rep < repetir - 1) {
        setCurrentPlayingStep(null);
        await new Promise((r) => setTimeout(r, 500));
      }
    }
  };

  const playMelody = (reps = 4) => {
    if (melodia.length === 0) return;
    runWithPlayingState(async (runId) => {
      await playMelodyLoop(reps, transposicionRef.current, runId);
    });
  };

  const playChainedMelody = () => {
    if (melodia.length === 0) return;
    const orig = transposicionRef.current;
    const upOffsets = Array.from(
      { length: Math.max(1, chainSemitones) },
      (_, i) => i,
    );
    const downStart = chainRepeatReturnTurnaround
      ? chainSemitones - 1
      : chainSemitones - 2;
    const downOffsets = chainReturnToRoot && downStart >= 0
      ? Array.from({ length: downStart + 1 }, (_, i) => downStart - i)
      : [];

    const playChainStep = async (offset: number, runId: number) => {
      if (!isCurrentPlaybackRun(runId)) return;
      const nextTransposition = orig + offset;
      setTransposicion(nextTransposition);
      transposicionRef.current = nextTransposition;
      await playMelodyOnce(nextTransposition, runId);
      if (chainReverseMelody) {
        setCurrentPlayingStep(null);
        if (chainPauseReverseTurnaround) {
          await new Promise((r) => setTimeout(r, 250));
        }
        await playMelodyOnce(
          nextTransposition,
          runId,
          true,
          chainRepeatReverseTurnaround,
        );
      }
    };

    runWithPlayingState(async (runId) => {
      for (let i = 0; i < upOffsets.length; i++) {
        await playChainStep(upOffsets[i], runId);
        if (!isCurrentPlaybackRun(runId)) return;
        const isLastUp = i === upOffsets.length - 1;
        if (!isLastUp || (downOffsets.length > 0 && chainPauseReturnTurnaround)) {
          await new Promise((r) => setTimeout(r, 250));
        }
      }
      for (let i = 0; i < downOffsets.length; i++) {
        await playChainStep(downOffsets[i], runId);
        if (!isCurrentPlaybackRun(runId)) return;
        if (i < downOffsets.length - 1) {
          await new Promise((r) => setTimeout(r, 250));
        }
      }
      setTransposicion(orig);
      transposicionRef.current = orig;
    });
  };

  // ── Piano interaction ─────────────────────────────────────────────────────
  const handlePianoKeyDown = (nota: string, octava: number) => {
    const id = `${nota}${octava}`;
    noteFnsRef.current.get(id)?.();
    noteFnsRef.current.set(id, startNote(nota, octava, 0));
    setActiveNotes((p) => ({ ...p, [id]: true }));
    if (modoLibreRef.current) return;
    if (modoAcordeRef.current) {
      setCurrentChord((prev) => {
        const already = prev.some(
          (n) => n.nota === nota && n.octava === octava,
        );
        return already
          ? prev.filter((n) => !(n.nota === nota && n.octava === octava))
          : [...prev, { nota, octava }];
      });
    } else {
      setMelodia((prev) => {
        const last = prev[prev.length - 1];
        if (
          !forceNextNoteRef.current &&
          Array.isArray(last) &&
          last.length === 1 &&
          last[0].nota === nota &&
          last[0].octava === octava
        ) {
          const next = [...prev];
          next[next.length - 1] = [
            { ...last[0], duracion: (last[0].duracion || 1) + 1 },
          ];
          return next;
        }
        forceNextNoteRef.current = false;
        setNextNoteArmed(false);
        return [...prev, [{ nota, octava, duracion: 1 }]];
      });
      setMelodiaActivaIndex(-1);
    }
  };

  const markNextNote = () => {
    forceNextNoteRef.current = true;
    setNextNoteArmed(true);
  };

  const handlePianoKeyUp = (nota: string, octava: number) => {
    const id = `${nota}${octava}`;
    noteFnsRef.current.get(id)?.();
    noteFnsRef.current.delete(id);
    setActiveNotes((p) => ({ ...p, [id]: false }));
  };

  // Keep refs in sync for use inside event listeners
  useEffect(() => {
    handleKeyRef.current = handlePianoKeyDown;
    handlePianoKeyUpRef.current = handlePianoKeyUp;
  });

  // ── PC Keyboard event listeners ───────────────────────────────────────────
  useEffect(() => {
    const pressed = new Set<string>();
    const onDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const key = e.key.toLowerCase();
      if (key === "x" && hoveredStepRef.current !== null) {
        const indexToDelete = hoveredStepRef.current;
        hoveredStepRef.current = null;
        setMelodia((prev) => prev.filter((_, i) => i !== indexToDelete));
        e.preventDefault();
        return;
      }
      if (key === " ") {
        if (pressed.has(key)) return;
        pressed.add(key);
        forceNextNoteRef.current = true;
        setNextNoteArmed(true);
        e.preventDefault();
        return;
      }
      if (!modoTecladoRef.current) return;
      if (key === "enter") {
        if (pressed.has(key)) return;
        pressed.add(key);
        setMelodia((prev) => {
          const arr: MelodiaStep[] = [...prev, { rest: true as const, duracion: "corchea" as RestDuracion }];
          const DUR_TO_VAL: Record<RestDuracion, number> = { corchea: 1, negra: 2, blanca: 4, redonda: 8 };
          const VAL_TO_DUR: Record<number, RestDuracion> = { 1: "corchea", 2: "negra", 4: "blanca", 8: "redonda" };
          
          while (arr.length >= 2) {
             const last1 = arr[arr.length - 1];
             const last2 = arr[arr.length - 2];
             if (last1 && 'rest' in last1 && last1.rest && last2 && 'rest' in last2 && last2.rest) {
                if (last1.duracion === last2.duracion && last1.duracion !== "redonda") {
                   const val = DUR_TO_VAL[last1.duracion] * 2;
                   arr.pop();
                   arr.pop();
                   arr.push({ rest: true as const, duracion: VAL_TO_DUR[val] });
                   continue;
                }
             }
             break;
          }
          return arr;
        });
        setMelodiaActivaIndex(-1);
        e.preventDefault();
        return;
      }
      if (!KEY_TO_NOTE[key]) return;
      if (pressed.has(key)) return;
      pressed.add(key);
      const { nota, octava } = KEY_TO_NOTE[key];
      handleKeyRef.current(nota, octava);
    };
    const onUp = (e: KeyboardEvent) => {
      const key = e.key === ";" ? ";" : e.key.toLowerCase();
      pressed.delete(key);
      if (KEY_TO_NOTE[key]) {
        const { nota, octava } = KEY_TO_NOTE[key];
        handlePianoKeyUpRef.current(nota, octava);
      }
    };
    document.addEventListener("keydown", onDown);
    document.addEventListener("keyup", onUp);
    return () => {
      document.removeEventListener("keydown", onDown);
      document.removeEventListener("keyup", onUp);
    };
  }, []);

  // ── Chord mode ────────────────────────────────────────────────────────────
  const handleAddChord = () => {
    if (currentChord.length === 0) return;
    setMelodia((prev) => [...prev, [...currentChord]]);
    setCurrentChord([]);
    setMelodiaActivaIndex(-1);
  };

  // ── Rest insertion ────────────────────────────────────────────────────────
  const addRest = (duracion: RestDuracion) => {
    setMelodia((prev) => [...prev, { rest: true, duracion }]);
    setMelodiaActivaIndex(-1);
  };

  // ── Melody management ─────────────────────────────────────────────────────
  const clearMelody = () => {
    setMelodia([]);
    setMelodiaActivaIndex(-1);
    setCurrentChord([]);
  };

  const deleteStepAt = (i: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (hoveredStepRef.current === i) hoveredStepRef.current = null;
    setMelodia((prev) => {
      const u = [...prev];
      u.splice(i, 1);
      return u;
    });
  };

  const saveMelody = () => {
    if (melodia.length === 0) {
      alert("No hay melodía para guardar.");
      return;
    }
    let tgt = melodiasGuardadas.findIndex((s) => !s);
    if (
      tgt === -1 &&
      !confirm("Todos los slots están llenos. ¿Sobreescribir Slot 1?")
    )
      return;
    if (tgt === -1) tgt = 0;
    const name = prompt("Nombre para esta melodía:", `Melodía ${tgt + 1}`);
    if (!name) return;
    const upd = [...melodiasGuardadas];
    upd[tgt] = { nombre: name.trim(), notas: [...melodia] };
    setMelodiasGuardadas(upd);
    setMelodiaActivaIndex(tgt);
    persistSlots(upd);
    alert("✅ Melodía guardada");
  };

  const loadMelody = (i: number) => {
    const mel = melodiasGuardadas[i];
    if (!mel) {
      if (
        melodia.length > 0 &&
        confirm(`Slot ${i + 1} vacío. ¿Guardar aquí?`)
      ) {
        const name = prompt("Nombre:", `Melodía ${i + 1}`);
        if (!name) return;
        const upd = [...melodiasGuardadas];
        upd[i] = { nombre: name.trim(), notas: [...melodia] };
        setMelodiasGuardadas(upd);
        persistSlots(upd);
        setMelodiaActivaIndex(i);
      }
      return;
    }
    setMelodiaActivaIndex(i);
    setMelodia(mel.notas);
    melodiaRef.current = mel.notas;
    runWithPlayingState(async (runId) => {
      await playMelodyLoop(1, transposicionRef.current, runId);
    });
  };

  const renameMelody = (i: number) => {
    const mel = melodiasGuardadas[i];
    if (!mel) return;
    const name = prompt("Nuevo nombre:", mel.nombre);
    if (name?.trim()) {
      const upd = [...melodiasGuardadas];
      upd[i] = { ...mel, nombre: name.trim() };
      setMelodiasGuardadas(upd);
      persistSlots(upd);
    }
  };

  const clearSlot = (i: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`¿Vaciar Slot ${i + 1}?`)) return;
    const upd = [...melodiasGuardadas];
    upd[i] = null;
    setMelodiasGuardadas(upd);
    persistSlots(upd);
    if (melodiaActivaIndex === i) setMelodiaActivaIndex(-1);
  };

  // ── Piano key layout ──────────────────────────────────────────────────────
  const keys = useMemo(() => {
    const list: { nota: string; octava: number }[] = [];
    for (let oct = 4; oct <= 5; oct++)
      notasBase.forEach((nota) => list.push({ nota, octava: oct }));
    return list;
  }, []);

  // ── "Now Playing" label ───────────────────────────────────────────────────
  const nowPlayingLabel = useMemo(() => {
    if (currentPlayingStep === null) return null;
    const step = melodia[currentPlayingStep];
    if (!step) return null;
    return formatStepLabel(step);
  }, [currentPlayingStep, melodia]);

  if (!isMounted)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white/50 text-sm">
        Cargando...
      </div>
    );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className="relative min-h-screen flex flex-col font-sans overflow-x-hidden text-white bg-slate-900 bg-cover bg-center"
      style={{ backgroundImage: "url('/assets/background.jpeg')" }}
    >
      <div className={`absolute inset-0 backdrop-blur-[2px] z-0 ${isDarkMode ? "bg-slate-950/70" : "bg-slate-950/30"}`} />

      {/* Header */}
      <header className="relative w-full px-4 pt-6 md:px-12 flex justify-between items-center z-20">
        <button
          onClick={() => router.push("/")}
          className="text-white/70 hover:text-white text-[10px] font-bold uppercase tracking-widest bg-black/40 px-4 py-2 rounded-full border border-white/10 transition-all hover:bg-black/60 flex items-center gap-2 cursor-pointer shadow-lg"
        >
          <ArrowLeft size={12} />
          <span>Menú Principal</span>
        </button>
        <img
          src="/assets/logo21stCM_no_white_1.png"
          className="h-12 md:h-16 w-auto object-contain opacity-80"
          alt="logo"
        />
      </header>

      {/* Main */}
      <main className="relative flex-1 flex flex-col 2xl:flex-row items-stretch justify-center gap-6 p-4 md:p-8 z-10 w-full max-w-[96rem] mx-auto">
        <div className="w-full 2xl:w-[280px] shrink-0 flex flex-col gap-4">
          <aside className="bg-slate-900/55 border border-white/10 rounded-3xl p-4 backdrop-blur-xl shadow-2xl">
            <h2 className="text-white text-sm font-black italic uppercase tracking-tight mb-3">
              Funciones
            </h2>
            <div className="space-y-4 text-[10px] leading-snug text-slate-300">
              <div>
                <h3 className="text-teal-300 font-black uppercase tracking-widest mb-1">
                  Escucha
                </h3>
                <p>
                  Es el único botón que reproduce. Si no hay encadenamiento,
                  repite la melodía las veces elegidas en su cuadro.
                </p>
              </div>
              <div>
                <h3 className="text-amber-300 font-black uppercase tracking-widest mb-1">
                  Encadenamiento
                </h3>
                <p>
                  No reproduce al pulsarlo: solo abre los parámetros. El número
                  indica cuántas pasadas sonarán en total, subiendo un semitono en
                  cada pasada.
                </p>
              </div>
              <div>
                <h3 className="text-amber-300 font-black uppercase tracking-widest mb-1">
                  Ida/Vuelta
                </h3>
                <p>
                  En cada tono toca las notas guardadas hacia delante y luego
                  hacia atrás. Su casilla de repetición decide si se repite la
                  última nota antes de volver.
                </p>
              </div>
              <div>
                <h3 className="text-amber-300 font-black uppercase tracking-widest mb-1">
                  Subir/Bajar
                </h3>
                <p>
                  Después de subir por semitonos, baja hasta el tono original. Su
                  casilla de repetición decide si se repite la última subida antes
                  de empezar a bajar.
                </p>
              </div>
              <div>
                <h3 className="text-sky-300 font-black uppercase tracking-widest mb-1">
                  Parón
                </h3>
                <p>
                  Cada modo tiene su parón propio. ON deja una pausa en el giro;
                  OFF encadena sin pausa.
                </p>
              </div>
              <div>
                <h3 className="text-violet-300 font-black uppercase tracking-widest mb-1">
                  Modos
                </h3>
                <p>
                  Acorde agrupa notas simultáneas, Libre toca sin grabar, y PC
                  permite introducir notas con el teclado del ordenador.
                </p>
              </div>
              <div>
                <h3 className="text-emerald-300 font-black uppercase tracking-widest mb-1">
                  Duración
                </h3>
                <p>
                  Una nota nueva entra como corchea. Si pulsas la misma nota otra
                  vez seguida, suma duración: dos pulsaciones hacen negra, tres
                  negra + corchea, cuatro blanca. Para repetir la misma nota como
                  nota separada, pulsa Siguiente nota o la barra espaciadora antes
                  de tocarla de nuevo.
                </p>
              </div>
            </div>
          </aside>
          <aside className="bg-slate-900/55 border border-white/10 rounded-3xl p-4 backdrop-blur-xl shadow-2xl">
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center justify-between">
              <span>Silencios</span>
              {modoTeclado && <span className="text-violet-300">PC</span>}
            </div>
            <div className="grid grid-cols-2 2xl:grid-cols-1 overflow-hidden rounded-xl border border-white/5">
              {(["corchea", "negra", "blanca", "redonda"] as RestDuracion[]).map(
                (d, i) => (
                  <button
                    key={d}
                    onClick={() => addRest(d)}
                    className={`min-h-12 bg-slate-800/60 hover:bg-slate-700/80 text-[9px] font-black uppercase tracking-wider text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95 flex items-center justify-between gap-2 px-3 ${i < 3
                      ? "border-r 2xl:border-r-0 2xl:border-b border-white/5"
                      : ""
                      } ${i === 1 ? "border-r-0" : ""}`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="text-lg leading-none text-slate-200">
                        {REST_ICONS[d]}
                      </span>
                      <span className="truncate text-[8px]">
                        {REST_NAMES[d]}
                      </span>
                    </span>
                    {modoTeclado && (
                      <span className="rounded-md bg-violet-500/20 border border-violet-400/30 px-1.5 py-0.5 text-[8px] text-violet-200">
                        {REST_TO_KEY[d]}
                      </span>
                    )}
                  </button>
                ),
              )}
            </div>
          </aside>
        </div>

        {/* ── Center: workspace ── */}
        <section className="flex-1 flex flex-col bg-slate-900/60 border border-white/10 rounded-3xl p-4 md:p-6 backdrop-blur-xl shadow-2xl">
          {/* Title */}
          <div className="mb-4">
            <h1
              className="text-white text-2xl md:text-4xl font-black italic tracking-tighter leading-tight drop-shadow-[0_2px_8px_rgba(20,184,166,0.3)]"
              style={{ fontFamily: "Chaney, sans-serif" }}
            >
              🎹 Constructor de Melodías
            </h1>
            <p className="text-xs text-slate-400 font-light mt-1">
              Diseña melodías, transpórtalas y entrena tu oído vocal.
            </p>
          </div>

          {/* Controls grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {/* Volume */}
            <div className="bg-black/30 p-3 rounded-2xl border border-white/5 flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  {volume === 0 ? (
                    <VolumeX size={14} className="text-teal-400" />
                  ) : volume < 0.4 ? (
                    <Volume1 size={14} className="text-teal-400" />
                  ) : (
                    <Volume2 size={14} className="text-teal-400" />
                  )}
                  Volumen
                </span>
                <span className="text-[10px] text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded-full">
                  {Math.round(volume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={volume * 100}
                onChange={(e) => setVolume(+e.target.value / 100)}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-teal-400"
              />
            </div>

            {/* BPM */}
            <div className="bg-black/30 p-3 rounded-2xl border border-white/5 flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Activity size={14} className="text-teal-400" />
                  BPM
                </span>
                <span className="text-[10px] text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded-full">
                  {bpm}
                </span>
              </div>
              <input
                type="range"
                min="40"
                max="200"
                value={bpm}
                onChange={(e) => setBpm(+e.target.value)}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-teal-400"
              />
            </div>

            {/* Sound preset — 3×2 grid */}
            <div className="bg-black/30 p-3 rounded-2xl border border-white/5 flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Music size={14} className="text-teal-400" />
                  Sonido
                </span>
                <span className="text-[9px] text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded-full uppercase font-black tracking-wide">
                  {SOUND_PRESETS.find((p) => p.id === sonidoPreset)?.icon}{" "}
                  {SOUND_PRESETS.find((p) => p.id === sonidoPreset)?.label}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                {SOUND_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSonidoPreset(p.id)}
                    className={`py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer leading-tight ${sonidoPreset === p.id
                      ? "bg-teal-500 text-slate-950 shadow-md"
                      : "text-slate-400 hover:text-white"
                      }`}
                    title={p.label}
                  >
                    {p.icon}
                    <br />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Transpose */}
            <div className="bg-black/30 p-3 rounded-2xl border border-white/5 flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <RotateCcw size={14} className="text-teal-400" />
                  Transposición
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded-full">
                    {transposicion > 0 ? `+${transposicion}` : transposicion} st
                  </span>
                  <button
                    onClick={() => setTransposicion(0)}
                    className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 hover:text-white flex items-center justify-center select-none active:scale-95 transition-all"
                    title="Resetear transposición"
                  >
                    <RotateCcw size={11} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-[32px_minmax(0,1fr)_32px] items-center gap-1.5">
                <button
                  onClick={() => setTransposicion((p) => Math.max(-12, p - 1))}
                  className="w-8 bg-white/5 hover:bg-white/10 text-white rounded-lg py-1 text-xs border border-white/10 cursor-pointer font-bold select-none active:scale-95 transition-all"
                >
                  -1
                </button>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  value={transposicion}
                  onChange={(e) => setTransposicion(+e.target.value)}
                  className="min-w-0 w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-teal-400"
                />
                <button
                  onClick={() => setTransposicion((p) => Math.min(12, p + 1))}
                  className="w-8 bg-white/5 hover:bg-white/10 text-white rounded-lg py-1 text-xs border border-white/10 cursor-pointer font-bold select-none active:scale-95 transition-all"
                >
                  +1
                </button>
              </div>
            </div>
          </div>

          {/* Action toolbar — fila 1: reproducción */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div
              className="relative group"
              onMouseEnter={() => {
                if (!isPlaying) setListenSettingsOpen(true);
              }}
              onMouseLeave={() => setListenSettingsOpen(false)}
            >
              <button
                onClick={() => {
                  if (isPlaying) {
                    stopPlayback();
                    return;
                  }
                  setListenSettingsOpen(false);
                  if (
                    chainSemitones > 0 ||
                    chainReverseMelody ||
                    chainReturnToRoot
                  ) {
                    playChainedMelody();
                  } else {
                    playMelody(listenReps);
                  }
                }}
                disabled={!isPlaying && melodia.length === 0}
                className={`w-full h-12 px-3 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none active:scale-95 shadow-md ${isPlaying
                  ? "bg-rose-600/80 hover:bg-rose-600 text-white border border-rose-300/30"
                  : "bg-teal-500 hover:bg-teal-400 text-slate-950"
                  }`}
              >
                {isPlaying ? (
                  <Square size={12} className="fill-current" />
                ) : (
                  <Play size={12} className="fill-current" />
                )}
                <span>{isPlaying ? "Parar" : "Escucha"}</span>
              </button>
              <div
                className="absolute top-full left-0 right-0 h-[6px]"
                aria-hidden="true"
              />
              <div
                className={`absolute left-1/2 top-full z-40 ${!isPlaying && listenSettingsOpen ? "flex" : !isPlaying ? "hidden group-hover:flex" : "hidden"} -translate-x-1/2 mt-1.5 min-w-[190px] flex-col gap-2 rounded-xl bg-slate-950/95 border border-white/10 p-3 shadow-2xl backdrop-blur-md animate-fadeIn`}
              >
                <button
                  onClick={() => setListenSettingsOpen(false)}
                  className="absolute right-2 top-2 w-5 h-5 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-[10px] flex items-center justify-center"
                  title="Cerrar ajustes de escucha"
                >
                  ×
                </button>
                <span className="text-[9px] font-black uppercase tracking-widest text-teal-300 text-center">
                  ¿Cuántas veces quieres escuchar?
                </span>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setListenReps((p) => Math.max(1, p - 1))}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white cursor-pointer select-none transition-colors flex items-center justify-center active:scale-95"
                  >
                    <ChevronDown size={14} />
                  </button>
                  <span className="text-sm font-black text-teal-300 w-8 text-center">
                    {listenReps}
                  </span>
                  <button
                    onClick={() => setListenReps((p) => Math.min(12, p + 1))}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white cursor-pointer select-none transition-colors flex items-center justify-center active:scale-95"
                  >
                    <ChevronUp size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Encadenar + hover semitone control */}
            <div
              className="relative group"
              onMouseEnter={() => {
                if (!isPlaying) setChainSettingsOpen(true);
              }}
              onMouseLeave={() => setChainSettingsOpen(false)}
            >
              <button
                onClick={() => {
                  setListenSettingsOpen(false);
                  if (!isPlaying) setChainSettingsOpen(true);
                }}
                disabled={isPlaying}
                className={`w-full h-12 px-3 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none active:scale-95 shadow-md ${isPlaying
                  ? "bg-slate-800 text-slate-400 border border-white/5 cursor-not-allowed"
                  : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white"
                  }`}
              >
                <Sparkles size={12} />
                <span>Encadenamiento</span>
              </button>
              {/* bridge invisible que cubre el hueco entre botón y panel para que el hover no se pierda */}
              <div
                className="absolute top-full left-0 right-0 h-[6px]"
                aria-hidden="true"
              />
              <div
                className={`absolute left-1/2 top-full z-40 ${!isPlaying && chainSettingsOpen ? "flex" : "hidden"} -translate-x-1/2 mt-1.5 min-w-[300px] flex-col gap-3 rounded-xl bg-slate-950/95 border border-white/10 p-3 shadow-2xl backdrop-blur-md animate-fadeIn`}
              >
                <button
                  onClick={() => setChainSettingsOpen(false)}
                  className="absolute right-2 top-2 w-5 h-5 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-[10px] flex items-center justify-center"
                  title="Cerrar ajustes de encadenamiento"
                >
                  ×
                </button>
                <div className="space-y-1.5">
                  <span className="block text-[9px] font-black uppercase tracking-widest text-amber-300 text-center">
                    ¿Cuántos semitonos quieres encadenar?
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() =>
                        setChainSemitones((p) => Math.max(0, p - 1))
                      }
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white cursor-pointer select-none transition-colors flex items-center justify-center active:scale-95"
                    >
                      <ChevronDown size={14} />
                    </button>
                    <span className="text-sm font-black text-teal-300 w-10 text-center">
                      {chainSemitones > 0
                        ? `+${chainSemitones}`
                        : chainSemitones}
                    </span>
                    <button
                      onClick={() =>
                        setChainSemitones((p) => Math.min(12, p + 1))
                      }
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white cursor-pointer select-none transition-colors flex items-center justify-center active:scale-95"
                    >
                      <ChevronUp size={14} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <button
                      onClick={() => setChainReverseMelody((p) => !p)}
                      className={`h-8 w-full rounded-lg border text-[9px] font-black uppercase tracking-widest transition-colors ${chainReverseMelody
                        ? "bg-amber-400 text-slate-950 border-amber-200"
                        : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10"
                        }`}
                    >
                      Ida/Vuelta
                    </button>
                    <span className="block text-[9px] font-black uppercase tracking-widest text-emerald-300 text-center">
                      Repetición:
                    </span>
                    <label className="h-8 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer select-none transition-colors flex items-center justify-center text-[9px] font-black uppercase tracking-widest">
                      <input
                        type="checkbox"
                        checked={chainRepeatReverseTurnaround}
                        onChange={(e) =>
                          setChainRepeatReverseTurnaround(e.target.checked)
                        }
                        className="peer sr-only"
                      />
                      <span className="w-4 h-4 rounded border border-white/20 bg-slate-950/60 text-emerald-300 flex items-center justify-center">
                        {chainRepeatReverseTurnaround && <Check size={12} />}
                      </span>
                    </label>
                    <button
                      onClick={() => setChainPauseReverseTurnaround((p) => !p)}
                      className={`h-8 w-full rounded-lg border text-[9px] font-black uppercase tracking-widest transition-colors ${chainPauseReverseTurnaround
                        ? "bg-sky-400 text-slate-950 border-sky-200"
                        : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10"
                        }`}
                    >
                      Parón {chainPauseReverseTurnaround ? "ON" : "OFF"}
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => setChainReturnToRoot((p) => !p)}
                      className={`h-8 w-full rounded-lg border text-[9px] font-black uppercase tracking-widest transition-colors ${chainReturnToRoot
                        ? "bg-amber-400 text-slate-950 border-amber-200"
                        : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10"
                        }`}
                    >
                      Subir/Bajar
                    </button>
                    <span className="block text-[9px] font-black uppercase tracking-widest text-emerald-300 text-center">
                      Repetición:
                    </span>
                    <label className="h-8 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer select-none transition-colors flex items-center justify-center text-[9px] font-black uppercase tracking-widest">
                      <input
                        type="checkbox"
                        checked={chainRepeatReturnTurnaround}
                        onChange={(e) =>
                          setChainRepeatReturnTurnaround(e.target.checked)
                        }
                        className="peer sr-only"
                      />
                      <span className="w-4 h-4 rounded border border-white/20 bg-slate-950/60 text-emerald-300 flex items-center justify-center">
                        {chainRepeatReturnTurnaround && <Check size={12} />}
                      </span>
                    </label>
                    <button
                      onClick={() => setChainPauseReturnTurnaround((p) => !p)}
                      className={`h-8 w-full rounded-lg border text-[9px] font-black uppercase tracking-widest transition-colors ${chainPauseReturnTurnaround
                        ? "bg-sky-400 text-slate-950 border-sky-200"
                        : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10"
                        }`}
                    >
                      Parón {chainPauseReturnTurnaround ? "ON" : "OFF"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modo Acorde toggle */}
            <div className="relative group">
              <button
                onClick={() => {
                  if (modoAcorde) setCurrentChord([]);
                  setModoAcorde((p) => !p);
                }}
                className={`w-full h-12 px-3 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none active:scale-95 border ${modoAcorde
                  ? "bg-amber-500/25 text-amber-200 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                  : "bg-amber-500/10 hover:bg-amber-500/15 text-amber-300 border-amber-500/25"
                  }`}
              >
                <span>🎹 Acorde {modoAcorde ? "ON" : "OFF"}</span>
              </button>
              <div className="absolute left-1/2 top-full z-40 hidden group-hover:block -translate-x-1/2 mt-1.5 whitespace-nowrap rounded-lg bg-slate-950/95 border border-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-amber-300 shadow-2xl backdrop-blur-md animate-fadeIn">
                Suena más de una nota a la vez
              </div>
            </div>
          </div>

          {/* Action toolbar — fila 2: modos · fila 3: acciones */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="relative group">
              <button
                onClick={() => {
                  setModoLibre((p) => !p);
                  setCurrentChord([]);
                }}
                className={`w-full h-12 px-3 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none active:scale-95 border ${modoLibre
                  ? "bg-sky-500/25 text-sky-200 border-sky-500/60 shadow-[0_0_12px_rgba(14,165,233,0.2)]"
                  : "bg-sky-500/10 hover:bg-sky-500/15 text-sky-300 border-sky-500/25"
                  }`}
              >
                <span>🖐 Libre {modoLibre ? "ON" : "OFF"}</span>
              </button>
              <div className="absolute left-1/2 top-full z-40 hidden group-hover:block -translate-x-1/2 mt-1.5 whitespace-nowrap rounded-lg bg-slate-950/95 border border-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-sky-300 shadow-2xl backdrop-blur-md animate-fadeIn">
                Toca sin registrar las notas
              </div>
            </div>

            {/* Teclado PC toggle */}
            <div className="relative group">
              <button
                onClick={() => setModoTeclado((p) => !p)}
                className={`w-full h-12 px-3 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none active:scale-95 border ${modoTeclado
                  ? "bg-violet-500/25 text-violet-200 border-violet-500/60 shadow-[0_0_12px_rgba(139,92,246,0.2)]"
                  : "bg-violet-500/10 hover:bg-violet-500/15 text-violet-300 border-violet-500/25"
                  }`}
              >
                <Keyboard size={12} />
                <span>PC {modoTeclado ? "ON" : "OFF"}</span>
              </button>
              <div className="absolute left-1/2 top-full z-40 hidden group-hover:block -translate-x-1/2 mt-1.5 whitespace-nowrap rounded-lg bg-slate-950/95 border border-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-violet-300 shadow-2xl backdrop-blur-md animate-fadeIn">
                Escribe las notas con el teclado del ordenador
              </div>
            </div>

            <button
              onClick={clearMelody}
              disabled={melodia.length === 0}
              className="w-full h-10 px-3 rounded-xl font-bold text-[10px] uppercase tracking-widest bg-slate-500/15 hover:bg-slate-500/25 text-slate-300 border border-slate-400/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
            >
              <Trash2 size={12} />
              <span>Borrar</span>
            </button>
            <button
              onClick={markNextNote}
              disabled={modoLibre}
              className={`w-full h-10 px-3 rounded-xl font-bold text-[10px] uppercase tracking-widest border flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none active:scale-95 disabled:opacity-30 disabled:pointer-events-none ${nextNoteArmed
                ? "bg-teal-400 text-slate-950 border-teal-200 shadow-[0_0_14px_rgba(45,212,191,0.35)]"
                : "bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border-teal-500/30"
                }`}
            >
              <Plus size={12} />
              <span>{nextNoteArmed ? "Separador activo" : "Siguiente nota"}</span>
            </button>
            <button
              onClick={saveMelody}
              disabled={melodia.length === 0}
              className="w-full h-10 px-3 rounded-xl font-bold text-[10px] uppercase tracking-widest bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
            >
              <Save size={12} />
              <span>Guardar</span>
            </button>
          </div>

          {/* Chord builder banner */}
          {modoAcorde && (
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-3 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <Music size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-400 tracking-wide uppercase italic">
                    Constructor de Acordes
                  </h4>
                  <p className="text-[10px] text-slate-400 font-light mt-0.5">
                    Selecciona notas y agrégalas como un único acorde.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <div className="bg-black/40 px-3 py-1.5 rounded-xl border border-white/5 min-w-[140px] text-center">
                  <span className="text-[8px] text-slate-500 block uppercase font-bold tracking-widest">
                    Acorde Actual
                  </span>
                  <span className="text-xs font-black text-amber-400 uppercase tracking-tighter">
                    {currentChord.length === 0 ? (
                      <em className="text-slate-600 font-normal italic">
                        vacío
                      </em>
                    ) : (
                      currentChord
                        .map(
                          (n) => `${noteNamesEs[n.nota] || n.nota}${n.octava}`,
                        )
                        .join(" • ")
                    )}
                  </span>
                </div>
                <button
                  onClick={handleAddChord}
                  disabled={currentChord.length === 0}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Plus size={12} />
                  <span>Añadir</span>
                </button>
                <button
                  onClick={() => setCurrentChord([])}
                  disabled={currentChord.length === 0}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-xs px-3 py-2 rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                >
                  Limpiar
                </button>
              </div>
            </div>
          )}

          {/* Sequence visualizer */}
          <div className="bg-black/40 border border-white/5 rounded-2xl p-3 mb-4 flex flex-col min-h-[100px]">
            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2 flex justify-between items-center shrink-0">
              <span>Secuencia ({melodia.length} pasos)</span>
              {melodia.length > 0 && (
                <span className="text-[8px] text-teal-400">
                  × o tecla X para eliminar
                </span>
              )}
            </div>
            <div className="flex-1 overflow-x-hidden overflow-y-auto py-1">
              {melodia.length === 0 ? (
                <div className="text-slate-500 text-xs italic flex items-center gap-2 select-none mx-auto py-2">
                  <Music size={13} />
                  <span>
                    {modoLibre
                      ? "Modo libre activo: toca sin registrar notas..."
                      : "Haz clic en el piano para registrar notas..."}
                  </span>
                </div>
              ) : (
                <div className="flex items-center content-start gap-1.5 flex-wrap">
                  {melodia.map((step, i) => {
                    const rest = isRestStep(step);
                    const chord = !rest && (step as Nota[]).length > 1;
                    const active = i === currentPlayingStep;
                    return (
                      <div
                        key={i}
                        onMouseEnter={() => {
                          hoveredStepRef.current = i;
                        }}
                        onMouseLeave={() => {
                          if (hoveredStepRef.current === i)
                            hoveredStepRef.current = null;
                        }}
                        className={`group flex items-center gap-1.5 select-none border transition-all animate-fadeIn shrink-0 ${active
                          ? "ring-2 ring-amber-400 scale-105 shadow-[0_0_14px_rgba(251,191,36,0.5)]"
                          : ""
                          } ${rest
                            ? "bg-slate-700/40 border-slate-500/40 rounded-xl pl-2.5 pr-1 py-1 hover:border-slate-400"
                            : chord
                              ? "bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30 rounded-xl pl-2.5 pr-1 py-1 hover:border-amber-400"
                              : "bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border-teal-500/30 rounded-full pl-2.5 pr-1 py-0.5 hover:border-teal-400"
                          }`}
                      >
                        <span
                          className={`text-xs font-black uppercase tracking-tighter whitespace-nowrap ${rest
                            ? "text-slate-400"
                            : chord
                              ? "text-amber-400"
                              : "text-teal-300"
                            }`}
                        >
                          {formatStepLabel(step)}
                        </span>
                        <button
                          onClick={(e) => deleteStepAt(i, e)}
                          className="w-4 h-4 rounded-full bg-black/40 hover:bg-rose-500 hover:text-white flex items-center justify-center text-[9px] text-slate-400 cursor-pointer select-none transition-colors border border-white/5"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-3 mb-4 shadow-sm">
            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-600 mb-3 flex items-center gap-2">
              <Music size={12} />
              <span>Pentagrama</span>
            </div>
            <div className="relative h-28 overflow-x-auto rounded-xl bg-white border border-slate-200">
              <div className="absolute left-0 right-0 top-6 h-px bg-slate-700" />
              <div className="absolute left-0 right-0 top-10 h-px bg-slate-700" />
              <div className="absolute left-0 right-0 top-14 h-px bg-slate-700" />
              <div className="absolute left-0 right-0 top-18 h-px bg-slate-700" />
              <div className="absolute left-0 right-0 top-22 h-px bg-slate-700" />
              <div
                className="relative h-full flex items-center gap-4 px-5"
                style={{ minWidth: `${Math.max(360, melodia.length * 54)}px` }}
              >
                {melodia.length === 0 ? (
                  <span className="text-xs text-slate-500 italic">
                    Las notas aparecerán aquí al construir la melodía.
                  </span>
                ) : (
                  melodia.map((step, index) => {
                    const active = index === currentPlayingStep;
                    if (isRestStep(step)) {
                      return (
                        <div
                          key={index}
                          className={`absolute text-slate-700 text-lg font-black ${active ? "text-amber-500 scale-125" : ""}`}
                          style={{ left: 20 + index * 54, top: 40 }}
                        >
                          {REST_ICONS[step.duracion]}
                        </div>
                      );
                    }
                    const note = (step as Nota[])[0];
                    const pitchIndex =
                      notasBase.indexOf(note.nota) + (note.octava - 4) * 12;
                    const top = Math.max(12, Math.min(82, 82 - pitchIndex * 2.3));
                    const durationParts = splitDurationUnits(note.duracion);
                    return (
                      <div
                        key={index}
                        className={`absolute flex items-start gap-1 ${active ? "scale-110" : ""}`}
                        style={{ left: 20 + index * 54, top }}
                      >
                        {durationParts.map((part, partIndex) => {
                          const isFilled = part <= 2;
                          const hasStem = part <= 4;
                          const hasFlag = part === 1;
                          return (
                            <div
                              key={`${index}-${partIndex}`}
                              className="relative flex flex-col items-center"
                            >
                              <div
                                className={`relative w-7 h-5 rounded-[50%] border-2 -rotate-12 ${active
                                  ? "border-amber-600"
                                  : "border-slate-950"
                                  } ${isFilled
                                    ? active
                                      ? "bg-amber-400"
                                      : "bg-slate-900"
                                    : "bg-white"
                                  }`}
                              >
                                {hasStem && (
                                  <span
                                    className={`absolute -right-1 bottom-2 w-0.5 h-8 ${active ? "bg-amber-600" : "bg-slate-950"}`}
                                  />
                                )}
                                {hasFlag && (
                                  <span
                                    className={`absolute right-[-9px] -top-7 w-3 h-5 border-r-2 border-t-2 rounded-tr-full ${active ? "border-amber-600" : "border-slate-950"}`}
                                  />
                                )}
                              </div>
                              <span className="mt-8 text-[8px] font-black text-slate-700 whitespace-nowrap">
                                {partIndex === 0
                                  ? noteNamesEs[note.nota]
                                  : durationShortLabel(part)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* PC keyboard hint */}
          {modoTeclado && (
            <div className="mb-3 bg-violet-500/10 border border-violet-500/30 rounded-xl px-3 py-2 flex items-center gap-2 animate-fadeIn">
              <Keyboard size={13} className="text-violet-400 shrink-0" />
              <span className="text-[9px] text-violet-300 font-bold uppercase tracking-wide">
                Teclado activo:
              </span>
              <span className="text-[9px] text-slate-400 font-mono">
                Q2W3ER5T6Y7U8I=Octava 1 · ZSXDCVGBHNJM=Octava 2 · ENTER=Añadir/Sumar Silencio
              </span>
            </div>
          )}

          {/* Now Playing indicator */}
          <div
            className={`mb-3 transition-all duration-300 ${nowPlayingLabel ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"}`}
          >
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest shrink-0">
                Sonando
              </span>
              <span className="text-sm font-black text-white uppercase tracking-tight">
                {nowPlayingLabel}
              </span>
            </div>
          </div>

          {/* Piano keyboard */}
          <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 overflow-hidden select-none">
            <div className="overflow-x-auto flex justify-center">
              <div className="min-w-[840px] flex relative py-4 px-2 justify-center mx-auto">
                  {keys.map(({ nota, octava }) => {
                    const isBlack = nota.includes("#");
                    const keyId = `${nota}${octava}`;
                    const pcKey = NOTE_TO_KEY[keyId];
                    const isChordSelected = currentChord.some(
                      (n) => n.nota === nota && n.octava === octava,
                    );
                    const isSounding = !!activeNotes[keyId];
                    const isChordActive = modoAcorde && isChordSelected;

                    if (isBlack)
                      return (
                        <button
                          key={keyId}
                          onPointerDown={(e) => {
                            e.currentTarget.setPointerCapture(e.pointerId);
                            handlePianoKeyDown(nota, octava);
                          }}
                          onPointerUp={() => handlePianoKeyUp(nota, octava)}
                          onPointerCancel={() => handlePianoKeyUp(nota, octava)}
                          className={`relative w-7 h-36 bg-slate-900 border border-slate-800 rounded-b-md text-white flex flex-col items-center justify-end pb-1.5 text-[7px] font-medium cursor-pointer transition-all duration-75 select-none active:scale-[0.97] z-25 -mx-3.5 hover:shadow-lg ${isSounding
                            ? "bg-sky-400 text-slate-950 border-sky-200 scale-[1.03] shadow-[0_0_18px_rgba(56,189,248,0.85)] z-30"
                            : isChordActive
                              ? "bg-amber-400 text-black border-amber-300 scale-[1.03] shadow-[0_0_15px_rgba(251,191,36,0.8)] z-30"
                              : "hover:border-slate-600"
                            }`}
                        >
                          {modoTeclado && pcKey && (
                            <span
                              className={`text-[7px] font-black rounded px-0.5 mb-0.5 leading-none ${isSounding ? "text-slate-950 bg-white/70" : "text-violet-300 bg-violet-900/60"}`}
                            >
                              {pcKey}
                            </span>
                          )}
                          <span>
                            {noteNamesEs[nota]}
                            {octava}
                          </span>
                        </button>
                      );

                    return (
                      <button
                        key={keyId}
                        onPointerDown={(e) => {
                          e.currentTarget.setPointerCapture(e.pointerId);
                          handlePianoKeyDown(nota, octava);
                        }}
                        onPointerUp={() => handlePianoKeyUp(nota, octava)}
                        onPointerCancel={() => handlePianoKeyUp(nota, octava)}
                        className={`relative w-11 h-52 bg-white border border-slate-300 rounded-b-lg text-slate-800 flex flex-col items-center justify-end pb-2 text-[9px] font-bold cursor-pointer transition-all duration-75 select-none active:scale-[0.97] z-10 hover:bg-slate-100 hover:shadow-inner ${isSounding
                          ? "bg-sky-400 text-slate-950 border-sky-200 scale-[1.02] shadow-[0_0_16px_rgba(56,189,248,0.8)] z-30"
                          : isChordActive
                            ? "bg-amber-400 text-black border-amber-300 scale-[1.02] shadow-[0_0_12px_rgba(251,191,36,0.7)] z-30"
                            : ""
                          }`}
                      >
                        {modoTeclado && pcKey && (
                          <span
                            className={`text-[8px] font-black rounded px-1 mb-1 leading-none ${isSounding ? "text-slate-950 bg-white/70" : "text-violet-500 bg-violet-100"}`}
                          >
                            {pcKey}
                          </span>
                        )}
                        <span>
                          {noteNamesEs[nota]}
                          {octava}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        </section>

        {/* ── Right: slots ── */}
        <aside className="w-full xl:w-[420px] flex flex-col bg-slate-900/40 border border-white/10 rounded-3xl p-4 md:p-6 backdrop-blur-md shadow-2xl">
          <div className="mb-4">
            <h2 className="text-white text-md font-black italic tracking-tighter uppercase flex items-center gap-2">
              <BookOpen size={15} className="text-teal-400" />
              <span>📌 Mis Slots</span>
            </h2>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Clic para cargar · Doble-clic para renombrar
            </p>
          </div>

          <div className="flex-1 flex flex-col gap-3 overflow-y-auto slots-scroll pr-1 max-h-[500px] xl:max-h-[700px]">
            {/* Grupo 1: Predefinidos */}
            <div>
              <button
                onClick={() => setPredefinedOpen((p) => !p)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 hover:bg-teal-500/18 transition-all mb-2 cursor-pointer select-none"
              >
                <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <BookOpen size={11} /> Ejercicios para Cantantes
                </span>
                {predefinedOpen ? (
                  <ChevronUp size={13} />
                ) : (
                  <ChevronDown size={13} />
                )}
              </button>
              {predefinedOpen && (
                <div className="flex flex-col gap-1.5 pl-1">
                  {melodiasGuardadas.slice(0, 8).map((slot, rawI) => {
                    const i = rawI;
                    const active = i === melodiaActivaIndex;
                    if (slot)
                      return (
                        <div
                          key={i}
                          onClick={() => loadMelody(i)}
                          onDoubleClick={() => renameMelody(i)}
                          className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer select-none transition-all border ${active
                            ? "bg-teal-500 border-teal-400 text-slate-950 shadow-[0_0_14px_rgba(20,184,166,0.3)] scale-[1.01]"
                            : "bg-white/5 border-white/5 hover:bg-white/10 text-white"
                            }`}
                        >
                          <div className="min-w-0 flex-1">
                            <span
                              className={`text-[8px] font-bold uppercase tracking-wider block ${active ? "text-slate-950/70" : "text-teal-400"}`}
                            >
                              Slot {i + 1}
                            </span>
                            <h3 className="text-xs font-black truncate leading-tight mt-0.5">
                              {slot.nombre}
                            </h3>
                            <span
                              className={`text-[9px] block ${active ? "text-slate-950/60" : "text-slate-400"}`}
                            >
                              {slot.notas.length} pasos
                            </span>
                          </div>
                          <button
                            onClick={(e) => clearSlot(i, e)}
                            className={`w-5 h-5 rounded-lg flex items-center justify-center cursor-pointer select-none transition-all shrink-0 ${active
                              ? "bg-slate-950/20 text-slate-950 hover:bg-rose-600 hover:text-white"
                              : "bg-black/30 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                              }`}
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      );
                    return (
                      <div
                        key={i}
                        onClick={() => loadMelody(i)}
                        className={`group flex items-center justify-between p-2.5 rounded-xl border border-dashed border-white/10 hover:border-teal-500/30 transition-all select-none ${melodia.length > 0
                          ? "cursor-pointer bg-teal-500/5 hover:bg-teal-500/10"
                          : "bg-white/[0.01] hover:bg-white/[0.03]"
                          }`}
                      >
                        <div>
                          <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest block">
                            Slot {i + 1}
                          </span>
                          <span className="text-xs text-slate-500 italic font-light select-none block mt-0.5">
                            vacío
                          </span>
                        </div>
                        {melodia.length > 0 && (
                          <span className="text-[8px] text-teal-400/0 group-hover:text-teal-400 font-bold transition-all uppercase tracking-wider flex items-center gap-0.5 select-none">
                            <Plus size={8} />
                            Guardar
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Grupo 2: Mis Grabaciones */}
            <div>
              <button
                onClick={() => setUserSlotsOpen((p) => !p)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 hover:bg-violet-500/18 transition-all mb-2 cursor-pointer select-none"
              >
                <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Save size={11} /> Mis Grabaciones
                </span>
                {userSlotsOpen ? (
                  <ChevronUp size={13} />
                ) : (
                  <ChevronDown size={13} />
                )}
              </button>
              {userSlotsOpen && (
                <div className="flex flex-col gap-1.5 pl-1">
                  {melodiasGuardadas.slice(8).map((slot, rawI) => {
                    const i = rawI + 8;
                    const active = i === melodiaActivaIndex;
                    if (slot)
                      return (
                        <div
                          key={i}
                          onClick={() => loadMelody(i)}
                          onDoubleClick={() => renameMelody(i)}
                          className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer select-none transition-all border ${active
                            ? "bg-teal-500 border-teal-400 text-slate-950 shadow-[0_0_14px_rgba(20,184,166,0.3)] scale-[1.01]"
                            : "bg-white/5 border-white/5 hover:bg-white/10 text-white"
                            }`}
                        >
                          <div className="min-w-0 flex-1">
                            <span
                              className={`text-[8px] font-bold uppercase tracking-wider block ${active ? "text-slate-950/70" : "text-violet-400"}`}
                            >
                              Slot {i + 1}
                            </span>
                            <h3 className="text-xs font-black truncate leading-tight mt-0.5">
                              {slot.nombre}
                            </h3>
                            <span
                              className={`text-[9px] block ${active ? "text-slate-950/60" : "text-slate-400"}`}
                            >
                              {slot.notas.length} pasos
                            </span>
                          </div>
                          <button
                            onClick={(e) => clearSlot(i, e)}
                            className={`w-5 h-5 rounded-lg flex items-center justify-center cursor-pointer select-none transition-all shrink-0 ${active
                              ? "bg-slate-950/20 text-slate-950 hover:bg-rose-600 hover:text-white"
                              : "bg-black/30 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                              }`}
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      );
                    return (
                      <div
                        key={i}
                        onClick={() => loadMelody(i)}
                        className={`group flex items-center justify-between p-2.5 rounded-xl border border-dashed border-white/10 hover:border-violet-500/30 transition-all select-none ${melodia.length > 0
                          ? "cursor-pointer bg-violet-500/5 hover:bg-violet-500/10"
                          : "bg-white/[0.01] hover:bg-white/[0.03]"
                          }`}
                      >
                        <div>
                          <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest block">
                            Slot {i + 1}
                          </span>
                          <span className="text-xs text-slate-500 italic font-light select-none block mt-0.5">
                            vacío
                          </span>
                        </div>
                        {melodia.length > 0 && (
                          <span className="text-[8px] text-violet-400/0 group-hover:text-violet-400 font-bold transition-all uppercase tracking-wider flex items-center gap-0.5 select-none">
                            <Plus size={8} />
                            Guardar
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </aside>
      </main>

      <footer className="mt-auto py-5 text-center text-slate-600 text-[8px] tracking-[0.6em] uppercase relative z-10 select-none">
        © 2026 21st Century Music
      </footer>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(5px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        .slots-scroll::-webkit-scrollbar {
          width: 3px;
        }
        .slots-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .slots-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.12);
          border-radius: 99px;
        }
        .slots-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(20, 184, 166, 0.4);
        }
      `}</style>
    </div >
  );
}
