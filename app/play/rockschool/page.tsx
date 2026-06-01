"use client";

import React, { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Music,
  Play,
  RotateCcw,
  Square,
  Volume2,
} from "lucide-react";

interface Nota {
  nota: string;
  octava: number;
  duracion?: number;
}

interface Exercise {
  id: string;
  title: string;
  group: string;
  image: string;
  notes: Nota[];
}

type SonidoPreset = "piano" | "bright" | "warm";

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
  Db: "Reb",
  D: "Re",
  "D#": "Re#",
  Eb: "Mib",
  E: "Mi",
  F: "Fa",
  "F#": "Fa#",
  Gb: "Solb",
  G: "Sol",
  "G#": "Sol#",
  Ab: "Lab",
  A: "La",
  "A#": "La#",
  Bb: "Sib",
  B: "Si",
  Bbb: "Sibb",
};

const noteSemitones: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
  Bbb: 9,
};

const getNoteSemitone = (nota: string) => noteSemitones[nota] ?? 0;

const getAbsolutePitch = (nota: Nota) =>
  getNoteSemitone(nota.nota) + (nota.octava - 4) * 12;

const getKeyboardNote = (nota: Nota) => {
  const absolute = getAbsolutePitch(nota);
  const mod = ((absolute % 12) + 12) % 12;
  return {
    nota: notasBase[mod],
    octava: 4 + Math.floor(absolute / 12),
  };
};

const sounds: { id: SonidoPreset; label: string }[] = [
  { id: "piano", label: "Piano" },
  { id: "bright", label: "Brillante" },
  { id: "warm", label: "Calido" },
];

const N = (nota: string, octava: number, duracion = 1): Nota => ({
  nota,
  octava,
  duracion,
});

const seq = (items: Array<[string, number]>, duracion = 1) =>
  items.map(([nota, octava]) => N(nota, octava, duracion));

const intervalSeq = (items: Array<[string, number]>) => seq(items, 4);

const staffTop = 56;
const staffGap = 16;
const staffBottom = staffTop + staffGap * 4;
const noteStep = staffGap / 2;
const noteHeadHalf = 10;
const staffLineTops = Array.from({ length: 5 }, (_, i) => staffTop + i * staffGap);
const diatonicNotes = ["C", "D", "E", "F", "G", "A", "B"];

const debutMajorScaleA = seq([
  ["A", 3],
  ["B", 3],
  ["C#", 4],
  ["D", 4],
  ["E", 4],
  ["D", 4],
  ["C#", 4],
  ["B", 3],
  ["A", 3],
]);

const debutMajorArpeggioA = seq([
  ["A", 3],
  ["C#", 4],
  ["E", 4],
  ["C#", 4],
  ["A", 3],
]);

const majorScaleAFull = seq([
  ["A", 3],
  ["B", 3],
  ["C#", 4],
  ["D", 4],
  ["E", 4],
  ["F#", 4],
  ["G#", 4],
  ["A", 4],
  ["G#", 4],
  ["F#", 4],
  ["E", 4],
  ["D", 4],
  ["C#", 4],
  ["B", 3],
  ["A", 3],
]);
const minorScaleA = seq([
  ["A", 3],
  ["B", 3],
  ["C", 4],
  ["D", 4],
  ["E", 4],
  ["F", 4],
  ["G", 4],
  ["A", 4],
  ["G", 4],
  ["F", 4],
  ["E", 4],
  ["D", 4],
  ["C", 4],
  ["B", 3],
  ["A", 3],
]);
const majorPentatonicA = seq([
  ["A", 3],
  ["B", 3],
  ["C#", 4],
  ["E", 4],
  ["F#", 4],
  ["A", 4],
  ["F#", 4],
  ["E", 4],
  ["C#", 4],
  ["B", 3],
  ["A", 3],
]);
const minorPentatonicA = seq([
  ["A", 3],
  ["C", 4],
  ["D", 4],
  ["E", 4],
  ["G", 4],
  ["A", 4],
  ["G", 4],
  ["E", 4],
  ["D", 4],
  ["C", 4],
  ["A", 3],
]);
const bluesA = seq([
  ["A", 3],
  ["C", 4],
  ["D", 4],
  ["D#", 4],
  ["E", 4],
  ["G", 4],
  ["A", 4],
  ["G", 4],
  ["E", 4],
  ["D#", 4],
  ["D", 4],
  ["C", 4],
  ["A", 3],
]);
const harmonicMinorA = seq([
  ["A", 3],
  ["B", 3],
  ["C", 4],
  ["D", 4],
  ["E", 4],
  ["F", 4],
  ["G#", 4],
  ["A", 4],
  ["G#", 4],
  ["F", 4],
  ["E", 4],
  ["D", 4],
  ["C", 4],
  ["B", 3],
  ["A", 3],
]);

const exercises: Exercise[] = [
  {
    id: "debut-scale",
    title: "Debut - Major scale",
    group: "Debut",
    image: "p01_01_Im1.png",
    notes: debutMajorScaleA,
  },
  {
    id: "debut-arpeggio",
    title: "Debut - Major arpeggio",
    group: "Debut",
    image: "p01_02_Im2.png",
    notes: debutMajorArpeggioA,
  },
  {
    id: "grade1-scale",
    title: "Grade 1 - Major scale",
    group: "Grade 1",
    image: "p01_03_Im3.png",
    notes: majorScaleAFull,
  },
  {
    id: "grade1-arpeggio-p1",
    title: "Grade 1 - A major arpeggio (Pattern 1)",
    group: "Grade 1",
    image: "p01_04_Im4_pattern1.png",
    notes: seq([
      ["A", 3],
      ["C#", 4],
      ["E", 4],
      ["C#", 4],
      ["A", 3],
      ["C#", 4],
      ["E", 4],
      ["C#", 4],
      ["A", 3],
    ]),
  },
  {
    id: "grade1-arpeggio-p2",
    title: "Grade 1 - A major arpeggio (Pattern 2)",
    group: "Grade 1",
    image: "p01_04_Im4_pattern2.png",
    notes: seq([
      ["A", 3],
      ["C#", 4],
      ["E", 4],
      ["A", 4],
      ["E", 4],
      ["C#", 4],
      ["A", 3],
      ["C#", 4],
      ["E", 4],
      ["A", 4],
      ["E", 4],
      ["C#", 4],
      ["A", 3],
    ]),
  },
  {
    id: "grade1-major-2nd",
    title: "Grade 1 - Major 2nd interval",
    group: "Grade 1",
    image: "p01_05_Im5_major2.png",
    notes: intervalSeq([
      ["F", 4],
      ["G", 4],
    ]),
  },
  {
    id: "grade1-major-3rd",
    title: "Grade 1 - Major 3rd interval",
    group: "Grade 1",
    image: "p01_05_Im5_major3.png",
    notes: intervalSeq([
      ["F", 4],
      ["A", 4],
    ]),
  },
  {
    id: "grade2-natural-minor",
    title: "Grade 2 - A natural minor scale",
    group: "Grade 2",
    image: "p02_01_Im6.png",
    notes: minorScaleA,
  },
  {
    id: "grade2-arpeggio-p1",
    title: "Grade 2 - A minor arpeggio (Pattern 1)",
    group: "Grade 2",
    image: "p02_02_Im7_pattern1.png",
    notes: seq([
      ["A", 3],
      ["C", 4],
      ["E", 4],
      ["C", 4],
      ["A", 3],
      ["C", 4],
      ["E", 4],
      ["C", 4],
      ["A", 3],
    ]),
  },
  {
    id: "grade2-arpeggio-p2",
    title: "Grade 2 - A minor arpeggio (Pattern 2)",
    group: "Grade 2",
    image: "p02_02_Im7_pattern2.png",
    notes: seq([
      ["A", 3],
      ["C", 4],
      ["E", 4],
      ["A", 4],
      ["E", 4],
      ["C", 4],
      ["A", 3],
      ["C", 4],
      ["E", 4],
      ["A", 4],
      ["E", 4],
      ["C", 4],
      ["A", 3],
    ]),
  },
  {
    id: "grade2-major-3rd",
    title: "Grade 2 - Major 3rd interval",
    group: "Grade 2",
    image: "p02_03_Im8_major3.png",
    notes: intervalSeq([
      ["F", 4],
      ["A", 4],
    ]),
  },
  {
    id: "grade2-minor-3rd",
    title: "Grade 2 - Minor 3rd interval",
    group: "Grade 2",
    image: "p02_03_Im8_minor3.png",
    notes: intervalSeq([
      ["F", 4],
      ["Ab", 4],
    ]),
  },
  {
    id: "grade3-major-scale",
    title: "Grade 3 - A Major scale",
    group: "Grade 3",
    image: "p02_04_Im9_major_scale.png",
    notes: majorScaleAFull,
  },
  {
    id: "grade3-minor-scale",
    title: "Grade 3 - A Natural minor scale",
    group: "Grade 3",
    image: "p02_04_Im9_natural_minor.png",
    notes: minorScaleA,
  },
  {
    id: "grade3-major-arpeggio",
    title: "Grade 3 - A Major arpeggio",
    group: "Grade 3",
    image: "p03_01_Im10_major_arpeggio.png",
    notes: seq([
      ["A", 3],
      ["C#", 4],
      ["E", 4],
      ["A", 4],
      ["E", 4],
      ["C#", 4],
      ["A", 3],
      ["C#", 4],
      ["E", 4],
      ["A", 4],
      ["E", 4],
      ["C#", 4],
      ["A", 3],
    ]),
  },
  {
    id: "grade3-minor-arpeggio",
    title: "Grade 3 - A Minor arpeggio",
    group: "Grade 3",
    image: "p03_01_Im10_minor_arpeggio.png",
    notes: seq([
      ["A", 3],
      ["C", 4],
      ["E", 4],
      ["A", 4],
      ["E", 4],
      ["C", 4],
      ["A", 3],
      ["C", 4],
      ["E", 4],
      ["A", 4],
      ["E", 4],
      ["C", 4],
      ["A", 3],
    ]),
  },
  {
    id: "grade3-perfect-4th",
    title: "Grade 3 - Perfect 4th interval",
    group: "Grade 3",
    image: "p03_02_Im11_perfect4.png",
    notes: intervalSeq([
      ["F", 4],
      ["Bb", 4],
    ]),
  },
  {
    id: "grade3-perfect-5th",
    title: "Grade 3 - Perfect 5th interval",
    group: "Grade 3",
    image: "p03_02_Im11_perfect5.png",
    notes: intervalSeq([
      ["F", 4],
      ["C", 5],
    ]),
  },
  {
    id: "grade4-pentatonic",
    title: "Grade 4 - Major pentatonic scale",
    group: "Grade 4",
    image: "p03_03_Im12.png",
    notes: majorPentatonicA,
  },
  {
    id: "grade4-pent-arpeggio-p1",
    title: "Grade 4 - A major arpeggio (Pattern 1)",
    group: "Grade 4",
    image: "p03_04_Im13_pattern1.png",
    notes: seq([
      ["A", 3],
      ["C#", 4],
      ["E", 4],
      ["A", 4],
      ["C#", 5],
      ["A", 4],
      ["E", 4],
      ["C#", 4],
      ["A", 3],
      ["C#", 4],
      ["E", 4],
      ["A", 4],
      ["C#", 5],
      ["A", 4],
      ["E", 4],
      ["C#", 4],
      ["A", 3],
    ]),
  },
  {
    id: "grade4-pent-arpeggio-p2",
    title: "Grade 4 - A major and E7 arpeggios",
    group: "Grade 4",
    image: "p03_04_Im13_pattern2.png",
    notes: seq([
      ["A", 3],
      ["C#", 4],
      ["E", 4],
      ["A", 4],
      ["D", 5],
      ["B", 4],
      ["G#", 4],
      ["E", 4],
      ["A", 3],
      ["C#", 4],
      ["E", 4],
      ["A", 4],
      ["D", 5],
      ["B", 4],
      ["G#", 4],
      ["E", 4],
      ["A", 3],
    ]),
  },
  {
    id: "grade4-major-6th",
    title: "Grade 4 - Major 6th interval",
    group: "Grade 4",
    image: "p04_01_Im14_major6.png",
    notes: intervalSeq([
      ["F", 4],
      ["D", 5],
    ]),
  },
  {
    id: "grade4-major-7th",
    title: "Grade 4 - Major 7th interval",
    group: "Grade 4",
    image: "p04_01_Im14_major7.png",
    notes: intervalSeq([
      ["F", 4],
      ["E", 5],
    ]),
  },
  {
    id: "grade5-minor-pent",
    title: "Grade 5 - Minor pentatonic scale",
    group: "Grade 5",
    image: "p04_02_Im15.png",
    notes: minorPentatonicA,
  },
  {
    id: "grade5-major-dominant-arpeggio",
    title: "Grade 5 - Major I and dominant V7 arpeggios",
    group: "Grade 5",
    image: "p04_03_Im16.png",
    notes: seq([
      ["A", 3],
      ["C#", 4],
      ["E", 4],
      ["A", 4],
      ["C#", 5],
      ["E", 5],
      ["D", 5],
      ["B", 4],
      ["G#", 4],
      ["E", 4],
      ["D", 4],
      ["B", 3],
      ["A", 3],
      ["C#", 4],
      ["E", 4],
      ["A", 4],
      ["C#", 5],
      ["E", 5],
      ["D", 5],
      ["B", 4],
      ["G#", 4],
      ["E", 4],
      ["D", 4],
      ["B", 3],
      ["A", 3],
    ]),
  },
  {
    id: "grade5-minor-6th",
    title: "Grade 5 - Minor 6th interval",
    group: "Grade 5",
    image: "p04_04_Im17_minor6.png",
    notes: intervalSeq([
      ["F", 4],
      ["Db", 5],
    ]),
  },
  {
    id: "grade5-minor-7th",
    title: "Grade 5 - Minor 7th interval",
    group: "Grade 5",
    image: "p04_04_Im17_minor7.png",
    notes: intervalSeq([
      ["F", 4],
      ["Eb", 5],
    ]),
  },
  {
    id: "grade6-blues",
    title: "Grade 6 - Blues scale",
    group: "Grade 6",
    image: "p05_01_Im18.png",
    notes: bluesA,
  },
  {
    id: "grade6-c-major-diminished-arpeggio",
    title: "Grade 6 - C major and C diminished arpeggios",
    group: "Grade 6",
    image: "p05_02_Im19.png",
    notes: seq([
      ["C", 4],
      ["E", 4],
      ["G", 4],
      ["C", 5],
      ["C", 4],
      ["Eb", 4],
      ["Gb", 4],
      ["Bbb", 4],
      ["C", 4],
      ["E", 4],
      ["G", 4],
      ["C", 5],
      ["C", 4],
    ]),
  },
  {
    id: "grade6-major-7th-6th",
    title: "Grade 6 - Major 7th and major 6th intervals",
    group: "Grade 6",
    image: "p05_03_Im20_major7_major6.png",
    notes: intervalSeq([
      ["F", 4],
      ["E", 5],
      ["F", 4],
      ["D", 5],
      ["F", 4],
    ]),
  },
  {
    id: "grade6-minor-7th-6th",
    title: "Grade 6 - Minor 7th and minor 6th intervals",
    group: "Grade 6",
    image: "p05_03_Im20_major7_minor7_octave.png",
    notes: intervalSeq([
      ["F", 4],
      ["Eb", 5],
      ["F", 4],
      ["Db", 5],
      ["F", 4],
    ]),
  },
  {
    id: "grade7-harmonic-minor",
    title: "Grade 7 - Harmonic minor scale",
    group: "Grade 7",
    image: "p05_04_Im21.png",
    notes: harmonicMinorA,
  },
  {
    id: "grade7-caug",
    title: "Grade 7 - C augmented arpeggio",
    group: "Grade 7",
    image: "p05_05_Im22.png",
    notes: seq([
      ["C", 4],
      ["E", 4],
      ["G#", 4],
      ["C", 5],
      ["E", 5],
      ["C", 5],
      ["C", 4],
      ["E", 4],
      ["G#", 4],
      ["C", 5],
      ["E", 5],
      ["C", 5],
      ["C", 4],
    ]),
  },
  {
    id: "grade7-major-3rd-2nd",
    title: "Grade 7 - Major 3rd and major 2nd intervals",
    group: "Grade 7",
    image: "p06_01_Im23_major3_minor3.png",
    notes: intervalSeq([
      ["F", 4],
      ["A", 4],
      ["F", 4],
      ["G", 4],
      ["F", 4],
    ]),
  },
  {
    id: "grade7-minor-3rd-2nd",
    title: "Grade 7 - Minor 3rd and minor 2nd intervals",
    group: "Grade 7",
    image: "p06_01_Im23_aminor_arpeggio_p1.png",
    notes: intervalSeq([
      ["F", 4],
      ["Ab", 4],
      ["F", 4],
      ["Gb", 4],
      ["F", 4],
    ]),
  },
  {
    id: "grade8-chromatic",
    title: "Grade 8 - Chromatic scale",
    group: "Grade 8",
    image: "p06_02_Im24.png",
    notes: seq(notasBase.map((nota) => [nota, 4] as [string, number])),
  },
  {
    id: "grade8-diminished",
    title: "Grade 8 - Diminished 7th arpeggio",
    group: "Grade 8",
    image: "p06_03_Im25.png",
    notes: seq([
      ["C", 4],
      ["Eb", 4],
      ["Gb", 4],
      ["Bbb", 4],
      ["C", 5],
      ["Bbb", 4],
      ["Gb", 4],
      ["Eb", 4],
      ["C", 4],
      ["Eb", 4],
      ["Gb", 4],
      ["Bbb", 4],
      ["C", 5],
      ["Bbb", 4],
      ["Gb", 4],
      ["Eb", 4],
      ["C", 4],
    ]),
  },
  {
    id: "grade8-major-minor-7th-octave",
    title: "Grade 8 - Major 7th, minor 7th and octave intervals",
    group: "Grade 8",
    image: "p06_04_Im26_major7_minor7_octave.png",
    notes: intervalSeq([
      ["F", 4],
      ["E", 5],
      ["F", 4],
      ["Eb", 5],
      ["F", 4],
      ["F", 5],
      ["F", 4],
    ]),
  },
  {
    id: "grade8-major-minor-3rd",
    title: "Grade 8 - Major 3rd and minor 3rd intervals",
    group: "Grade 8",
    image: "p06_04_Im26_major3_minor3.png",
    notes: intervalSeq([
      ["F", 4],
      ["A", 4],
      ["F", 4],
      ["Ab", 4],
      ["F", 4],
    ]),
  },
];

const transposeNote = (nota: Nota, trans: number): Nota => {
  const absolute = getAbsolutePitch(nota) + trans;
  const mod = ((absolute % 12) + 12) % 12;
  if (trans === 0) return { ...nota };
  return {
    ...nota,
    nota: notasBase[mod],
    octava: 4 + Math.floor(absolute / 12),
  };
};

const noteStaffTop = (note: Nota) => {
  const letter = note.nota[0];
  const stepsFromE4 =
    diatonicNotes.indexOf(letter) - diatonicNotes.indexOf("E") + (note.octava - 4) * 7;
  return staffBottom - stepsFromE4 * noteStep - noteHeadHalf;
};

const isWhiteNote = (note: Nota) => (note.duracion || 1) >= 4;

export default function RockschoolPage() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(exercises[0].id);
  const [volume, setVolume] = useState(0.75);
  const [bpm, setBpm] = useState(90);
  const [transposition, setTransposition] = useState(0);
  const [sound, setSound] = useState<SonidoPreset>("piano");
  const [listenReps, setListenReps] = useState(1);
  const [chainSemitones, setChainSemitones] = useState(0);
  const [chainReturn, setChainReturn] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const runIdRef = useRef(0);
  const activeKeyRunRef = useRef(0);

  const exercise = exercises.find((e) => e.id === selectedId) || exercises[0];

  const [expandedGroup, setExpandedGroup] = useState<string>("Debut");

  React.useEffect(() => {
    if (exercise) {
      setExpandedGroup(exercise.group);
    }
  }, [selectedId, exercise]);

  const keys = useMemo(() => {
    if (!exercise || exercise.notes.length === 0) return [];
    const transposedNotes = exercise.notes.map((n) => transposeNote(n, transposition));
    const pitches = transposedNotes.map(getAbsolutePitch);
    const minPitch = Math.min(...pitches);
    const isWhite = (pitch: number) => {
      const mod = ((pitch % 12) + 12) % 12;
      return [0, 2, 4, 5, 7, 9, 11].includes(mod);
    };
    let startPitch = minPitch;
    while (!isWhite(startPitch)) {
      startPitch--;
    }
    const list: { nota: string; octava: number }[] = [];
    for (let p = startPitch; p < startPitch + 24; p++) {
      const mod = ((p % 12) + 12) % 12;
      const oct = 4 + Math.floor(p / 12);
      list.push({ nota: notasBase[mod], octava: oct });
    }
    return list;
  }, [exercise, transposition]);

  const initAudio = () => {
    const AudioCtor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!audioRef.current) audioRef.current = new AudioCtor!();
    if (audioRef.current.state === "suspended") audioRef.current.resume();
  };

  const playNote = (note: Nota, trans: number, durationMs = 800) => {
    initAudio();
    const ctx = audioRef.current!;
    const n = transposeNote(note, trans);
    const absolute = getAbsolutePitch(n);
    const freq = 440 * Math.pow(2, (absolute - 9) / 12);
    const duration = Math.max(0.45, Math.min(2.8, durationMs / 1000));
    const master = ctx.createGain();
    const oscA = ctx.createOscillator();
    const oscB = ctx.createOscillator();
    oscA.frequency.value = freq;
    oscB.frequency.value = sound === "piano" ? freq * 2 : freq;
    oscA.type = sound === "bright" ? "sawtooth" : "sine";
    oscB.type = "triangle";
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = sound === "bright" ? 3200 : sound === "warm" ? 900 : 2400;
    const gA = ctx.createGain();
    const gB = ctx.createGain();
    gA.gain.value = sound === "bright" ? 0.35 : 0.75;
    gB.gain.value = sound === "bright" ? 0.55 : 0.25;
    oscA.connect(gA);
    oscB.connect(gB);
    gA.connect(filter);
    gB.connect(filter);
    filter.connect(master);
    master.connect(ctx.destination);
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(volume * 0.5, ctx.currentTime + 0.01);
    master.gain.exponentialRampToValueAtTime(
      volume * 0.18,
      ctx.currentTime + Math.min(0.35, duration * 0.45),
    );
    master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    oscA.start();
    oscB.start();
    oscA.stop(ctx.currentTime + duration + 0.05);
    oscB.stop(ctx.currentTime + duration + 0.05);
    const keyRun = activeKeyRunRef.current + 1;
    activeKeyRunRef.current = keyRun;
    const keyboardNote = getKeyboardNote(n);
    setActiveKey(`${keyboardNote.nota}${keyboardNote.octava}`);
    setTimeout(() => {
      if (activeKeyRunRef.current === keyRun) setActiveKey(null);
    }, Math.min(900, Math.max(350, durationMs * 0.7)));
  };

  const stopPlayback = () => {
    runIdRef.current += 1;
    setIsPlaying(false);
    setActiveIndex(null);
    setActiveKey(null);
    activeKeyRunRef.current += 1;
  };

  const playSequence = async (
    notes: Nota[],
    trans: number,
    runId: number,
    reverse = false,
  ) => {
    const sequence = notes.map((note, index) => ({ note, index }));
    if (reverse) sequence.reverse();
    for (const { note, index } of sequence) {
      if (runIdRef.current !== runId) return;
      setActiveIndex(index);
      const beat = 60000 / bpm;
      const durationMs = beat * ((note.duracion || 1) / 2);
      playNote(note, trans, durationMs);
      await new Promise((r) => setTimeout(r, durationMs));
    }
  };

  const startPlayback = async () => {
    if (isPlaying) {
      stopPlayback();
      return;
    }
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    setIsPlaying(true);
    const chainSpan = chainReturn && chainSemitones === 0 ? 1 : chainSemitones;
    const up = Array.from({ length: Math.max(1, chainSpan + 1) }, (_, i) => i);
    const down = chainReturn
      ? Array.from({ length: chainSpan }, (_, i) => chainSpan - 1 - i)
      : [];
    const offsets = chainSpan > 0 ? [...up, ...down] : [0];
    try {
      for (let rep = 0; rep < listenReps; rep++) {
        for (const offset of offsets) {
          if (runIdRef.current !== runId) return;
          setTransposition(transposition + offset);
          await playSequence(exercise.notes, transposition + offset, runId);
          await new Promise((r) => setTimeout(r, 250));
        }
      }
    } finally {
      if (runIdRef.current === runId) {
        setIsPlaying(false);
        setActiveIndex(null);
        setActiveKey(null);
      }
    }
  };

  return (
    <div
      className="relative min-h-screen flex flex-col font-sans overflow-x-hidden text-white bg-slate-900 bg-cover bg-center"
      style={{ backgroundImage: "url('/assets/background.jpeg')" }}
    >
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] z-0" />

      <header className="relative w-full px-4 pt-6 md:px-12 flex justify-between items-center z-20">
        <button
          onClick={() => router.push("/")}
          className="text-white/70 hover:text-white text-[10px] font-bold uppercase tracking-widest bg-black/40 px-4 py-2 rounded-full border border-white/10 transition-all hover:bg-black/60 flex items-center gap-2 cursor-pointer shadow-lg"
        >
          <ArrowLeft size={12} />
          <span>Menu Principal</span>
        </button>
        <h1 className="text-xl md:text-3xl font-black italic tracking-tight">
          Ej. Rockschool
        </h1>
      </header>

      <main className="relative z-10 w-full max-w-[96rem] mx-auto p-4 md:p-8 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="bg-slate-900/55 border border-white/10 rounded-3xl p-4 backdrop-blur-xl shadow-2xl">
          <h2 className="text-sm font-black uppercase tracking-widest text-teal-300 mb-3">
            Ejercicios
          </h2>
          <div className="grid gap-2 max-h-[70vh] overflow-y-auto pr-1">
            {["Debut", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8"].map((groupName) => {
              const groupExercises = exercises.filter((ex) => ex.group === groupName);
              const isExpanded = expandedGroup === groupName;
              return (
                <div key={groupName} className="border border-white/5 rounded-xl overflow-hidden bg-black/10">
                  <button
                    onClick={() => setExpandedGroup(isExpanded ? "" : groupName)}
                    className={`w-full text-left p-3 font-black text-xs uppercase tracking-widest transition-all flex justify-between items-center ${
                      isExpanded
                        ? "bg-teal-400/10 text-teal-300 border-b border-white/5"
                        : "bg-white/5 hover:bg-white/10 text-slate-300"
                    }`}
                  >
                    <span>{groupName}</span>
                    <span className="text-[10px] opacity-70">
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="p-2 grid gap-1.5 bg-slate-950/30">
                      {groupExercises.map((ex) => (
                        <button
                          key={ex.id}
                          onClick={() => {
                            stopPlayback();
                            setSelectedId(ex.id);
                          }}
                          className={`text-left rounded-lg p-2.5 transition-all text-xs font-bold ${
                            ex.id === selectedId
                              ? "bg-teal-400 text-slate-950"
                              : "hover:bg-white/5 text-slate-300"
                          }`}
                        >
                          {ex.title.replace(`${groupName} - `, "")}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        <section className="bg-slate-900/60 border border-white/10 rounded-3xl p-4 md:p-6 backdrop-blur-xl shadow-2xl">
          <div className="mb-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-teal-300">
                {exercise.group}
              </p>
              <h2 className="text-2xl md:text-4xl font-black italic tracking-tight">
                {exercise.title}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Ejercicio fijo: el alumno escucha, transpone y encadena, pero no
                puede anadir notas nuevas.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            <div className="bg-black/30 p-3 rounded-2xl border border-white/5">
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="flex items-center gap-1">
                  <Volume2 size={13} /> Volumen
                </span>
                <span className="text-teal-300">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(+e.target.value)}
                className="w-full accent-teal-400"
              />
            </div>
            <div className="bg-black/30 p-3 rounded-2xl border border-white/5">
              <div className="flex justify-between text-xs font-bold mb-2">
                <span>BPM</span>
                <span className="text-teal-300">{bpm}</span>
              </div>
              <input
                type="range"
                min="50"
                max="160"
                value={bpm}
                onChange={(e) => setBpm(+e.target.value)}
                className="w-full accent-teal-400"
              />
            </div>
            <div className="bg-black/30 p-3 rounded-2xl border border-white/5">
              <div className="flex justify-between text-xs font-bold mb-2">
                <span>Transposicion</span>
                <span className="text-teal-300">
                  {transposition > 0 ? `+${transposition}` : transposition}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setTransposition((p) => Math.max(-12, p - 1))}
                  className="w-8 rounded-lg bg-white/5 border border-white/10"
                >
                  -1
                </button>
                <button
                  onClick={() => setTransposition(0)}
                  className="flex-1 rounded-lg bg-white/5 border border-white/10 text-xs font-bold"
                >
                  Reset
                </button>
                <button
                  onClick={() => setTransposition((p) => Math.min(12, p + 1))}
                  className="w-8 rounded-lg bg-white/5 border border-white/10"
                >
                  +1
                </button>
              </div>
            </div>
            <div className="bg-black/30 p-3 rounded-2xl border border-white/5">
              <div className="flex justify-between text-xs font-bold mb-2">
                <span>Sonido</span>
                <span className="text-teal-300">
                  {sounds.find((s) => s.id === sound)?.label}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {sounds.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSound(s.id)}
                    className={`rounded-lg px-2 py-1 text-[9px] font-black uppercase ${
                      sound === s.id
                        ? "bg-teal-400 text-slate-950"
                        : "bg-white/5 text-slate-300"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            <ControlStepper
              label="Repeticiones"
              value={listenReps}
              setValue={setListenReps}
              min={1}
              max={12}
            />
            <ControlStepper
              label="Encadenamiento"
              value={chainSemitones}
              setValue={setChainSemitones}
              min={0}
              max={12}
              prefix="+"
            />
            <button
              onClick={() => {
                setChainReturn((p) => !p);
                setChainSemitones((p) => (p === 0 ? 1 : p));
              }}
              className={`rounded-2xl border p-3 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 ${
                chainReturn
                  ? "bg-amber-400 text-slate-950 border-amber-200"
                  : "bg-black/30 text-amber-300 border-white/10"
              }`}
            >
              <RotateCcw size={14} />
              Subir/Bajar
            </button>
          </div>

          <div className="sticky top-3 z-30 mb-5 flex justify-end">
            <button
              onClick={startPlayback}
              className={`h-12 px-5 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all shadow-2xl border ${
                isPlaying
                  ? "bg-rose-600 text-white border-rose-300"
                  : "bg-teal-400 hover:bg-teal-300 text-slate-950 border-teal-200"
              }`}
            >
              {isPlaying ? <Square size={14} /> : <Play size={14} />}
              {isPlaying ? "Parar" : "Escucha"}
            </button>
          </div>

          <div className="bg-white rounded-2xl p-3 mb-5 border border-slate-200">
            <div className="text-[10px] uppercase font-black tracking-widest text-slate-600 mb-2 flex items-center gap-2">
              <Music size={12} />
              Pentagrama original
            </div>
            <img
              src={`/assets/rockschool/${exercise.image}`}
              alt={exercise.title}
              className="w-full rounded-xl border border-slate-200 bg-white"
            />
            <div className="mt-3 text-[10px] uppercase font-black tracking-widest text-slate-600 mb-2 flex items-center gap-2">
              <Music size={12} />
              Pentagrama dinamico
            </div>
            <div className="relative h-52 overflow-x-auto rounded-xl bg-white border border-slate-200">
              {/* Treble Clef (Clave de Sol) */}
              <div
                className="absolute left-4 text-slate-800 font-serif pointer-events-none select-none z-10"
                style={{
                  top: staffTop - 18,
                  fontSize: "4.8rem",
                  lineHeight: 1,
                }}
              >
                𝄞
              </div>

              {staffLineTops.map((top) => (
                <div
                  key={top}
                  className="absolute left-0 right-0 h-px bg-slate-700"
                  style={{ top }}
                />
              ))}
              <div
                className="relative h-full"
                style={{
                  minWidth: `${Math.max(480, 72 + exercise.notes.length * 48)}px`,
                }}
              >
                {exercise.notes.map((note, index) => {
                  const transposed = transposeNote(note, transposition);
                  const active = index === activeIndex;
                  const whiteNote = isWhiteNote(transposed);
                  const letter = transposed.nota[0];
                  const stepsFromE4 =
                    diatonicNotes.indexOf(letter) - diatonicNotes.indexOf("E") + (transposed.octava - 4) * 7;
                  
                  // Calculate ledger lines needed for notes outside the 5 staff lines
                  const ledgerLines: number[] = [];
                  if (stepsFromE4 <= -2) {
                    for (let l = -2; l >= stepsFromE4; l -= 2) {
                      ledgerLines.push(l);
                    }
                  } else if (stepsFromE4 >= 10) {
                    for (let l = 10; l <= stepsFromE4; l += 2) {
                      ledgerLines.push(l);
                    }
                  }

                  const accidental = transposed.nota.includes("##")
                    ? "𝄪"
                    : transposed.nota.includes("bb")
                      ? "𝄫"
                      : transposed.nota.includes("#")
                        ? "♯"
                        : transposed.nota.includes("b")
                          ? "♭"
                          : null;

                  return (
                    <div
                      key={`${note.nota}${note.octava}-${index}`}
                      className={`absolute flex flex-col items-center transition-all ${
                        active ? "scale-125 z-20" : "z-10"
                      }`}
                      style={{
                        left: 72 + index * 48,
                        top: noteStaffTop(transposed),
                      }}
                    >
                      {/* Render ledger lines (rayitas de expansión) behind the note head */}
                      {ledgerLines.map((l) => {
                        const ledgerY = 10 + (stepsFromE4 - l) * noteStep;
                        return (
                          <div
                            key={l}
                            className="absolute h-[1.5px] bg-slate-700 w-9 left-1/2 -translate-x-1/2 pointer-events-none z-0"
                            style={{ top: ledgerY }}
                          />
                        );
                      })}

                      {accidental && (
                        <span className="absolute text-xs font-black text-slate-800 -left-3 top-[3px] pointer-events-none select-none z-20">
                          {accidental}
                        </span>
                      )}

                      {whiteNote && (
                        <div
                          className={`absolute left-[18px] bottom-[12px] h-9 w-[2px] ${
                            active ? "bg-amber-600" : "bg-slate-950"
                          }`}
                        />
                      )}

                      <div
                        className={`w-7 h-5 rounded-[50%] border-2 -rotate-12 relative z-10 ${
                          active
                            ? whiteNote
                              ? "bg-amber-50 border-amber-600 shadow-[0_0_10px_rgba(245,158,11,0.75)]"
                              : "bg-amber-400 border-amber-600 shadow-[0_0_10px_rgba(245,158,11,0.75)]"
                            : whiteNote
                              ? "bg-white border-slate-950"
                              : "bg-slate-900 border-slate-950"
                        }`}
                      />
                      <span
                        className={`mt-2 text-[8px] font-black whitespace-nowrap ${
                          active ? "text-amber-700" : "text-slate-700"
                        }`}
                      >
                        {noteNamesEs[transposed.nota]}
                        {transposed.octava}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-black/40 border border-white/5 rounded-2xl p-3 mb-5">
            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2">
              Secuencia fija ({exercise.notes.length} notas)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {exercise.notes.map((n, i) => (
                <span
                  key={`${n.nota}${n.octava}-${i}`}
                  className={`rounded-full px-2.5 py-1 text-xs font-black ${
                    i === activeIndex
                      ? "bg-amber-400 text-slate-950"
                      : "bg-teal-500/10 text-teal-300 border border-teal-500/20"
                  }`}
                >
                  {noteNamesEs[n.nota]}
                  {n.octava}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 overflow-hidden select-none">
            <div className="overflow-x-auto flex justify-center">
              <div className="flex relative py-4 px-2 justify-center mx-auto">
                {keys.map(({ nota, octava }) => {
                  const isBlack = nota.includes("#");
                  const id = `${nota}${octava}`;
                  const isActive = activeKey === id;
                  return (
                    <div
                      key={id}
                      className={`relative flex flex-col items-center justify-end cursor-default transition-all ${
                        isBlack
                          ? `w-7 h-36 -mx-3.5 rounded-b-md z-20 pb-1.5 text-[7px] ${
                              isActive
                                ? "bg-amber-400 text-slate-950 scale-[1.03]"
                                : "bg-slate-900 text-white"
                            }`
                          : `w-11 h-52 rounded-b-lg z-10 pb-2 text-[9px] ${
                              isActive
                                ? "bg-amber-400 text-slate-950 scale-[1.02]"
                                : "bg-white text-slate-800"
                            }`
                      } border ${isBlack ? "border-slate-800" : "border-slate-300"}`}
                    >
                      <span className="font-bold">
                        {noteNamesEs[nota]}
                        {octava}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function ControlStepper({
  label,
  value,
  setValue,
  min,
  max,
  prefix = "",
}: {
  label: string;
  value: number;
  setValue: React.Dispatch<React.SetStateAction<number>>;
  min: number;
  max: number;
  prefix?: string;
}) {
  return (
    <div className="bg-black/30 p-3 rounded-2xl border border-white/5">
      <div className="text-xs font-bold mb-2 text-slate-300">{label}</div>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setValue((p) => Math.max(min, p - 1))}
          className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center"
        >
          <ChevronDown size={14} />
        </button>
        <span className="w-12 text-center text-sm font-black text-teal-300">
          {prefix && value > 0 ? prefix : ""}
          {value}
        </span>
        <button
          onClick={() => setValue((p) => Math.min(max, p + 1))}
          className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center"
        >
          <ChevronUp size={14} />
        </button>
      </div>
    </div>
  );
}
