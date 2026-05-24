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
  Plus
} from "lucide-react";

interface Nota {
  nota: string;
  octava: number;
}

// Representa un paso en la melodía: puede tener una o varias notas tocadas simultáneamente (acorde)
type MelodiaStep = Nota[];

interface MelodiaGuardada {
  nombre: string;
  notas: MelodiaStep[];
}

const notasBase = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Mapeo a notación en español para mejorar el contexto educativo
const noteNamesEs: Record<string, string> = {
  "C": "Do",
  "C#": "Do#",
  "D": "Re",
  "D#": "Re#",
  "E": "Mi",
  "F": "Fa",
  "F#": "Fa#",
  "G": "Sol",
  "G#": "Sol#",
  "A": "La",
  "A#": "La#",
  "B": "Si"
};

// Utilidad para asegurar la compatibilidad con esquemas viejos (flat array of Nota)
const sanitizeMelody = (notas: any): MelodiaStep[] => {
  if (!Array.isArray(notas)) return [];
  return notas.map((step: any) => {
    if (Array.isArray(step)) {
      return step.filter((n: any) => n && typeof n.nota === "string" && typeof n.octava === "number");
    } else if (step && typeof step.nota === "string" && typeof step.octava === "number") {
      // Convertir nota individual vieja en acorde de una sola nota
      return [step];
    }
    return [];
  }).filter(step => step.length > 0);
};

export default function ConstructorMelodias() {
  const router = useRouter();

  // State handles
  const [isMounted, setIsMounted] = useState(false);
  const [melodia, setMelodia] = useState<MelodiaStep[]>([]);
  const [bpm, setBpm] = useState(120);
  const [volume, setVolume] = useState(0.8);
  const [transposicion, setTransposicion] = useState(0);
  const [sonidoPreset, setSonidoPreset] = useState<"warm" | "classic" | "bright" | "dark">("warm");
  const [melodiasGuardadas, setMelodiasGuardadas] = useState<(MelodiaGuardada | null)[]>(
    Array(24).fill(null)
  );
  
  // Chord mode specific states
  const [modoAcorde, setModoAcorde] = useState(false);
  const [currentChord, setCurrentChord] = useState<Nota[]>([]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [melodiaActivaIndex, setMelodiaActivaIndex] = useState<number>(-1);
  const [activeNotes, setActiveNotes] = useState<Record<string, boolean>>({});

  // Refs to avoid stale closures in playback loop
  const isPlayingRef = useRef(false);
  const bpmRef = useRef(120);
  const volumeRef = useRef(0.8);
  const transposicionRef = useRef(0);
  const sonidoPresetRef = useRef<"warm" | "classic" | "bright" | "dark">("warm");
  const melodiaRef = useRef<MelodiaStep[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Sync state with refs
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { transposicionRef.current = transposicion; }, [transposicion]);
  useEffect(() => { sonidoPresetRef.current = sonidoPreset; }, [sonidoPreset]);
  useEffect(() => { melodiaRef.current = melodia; }, [melodia]);

  // Load from local storage and handle SSR hydration
  useEffect(() => {
    setIsMounted(true);
    const data = localStorage.getItem("melodiasGuardadas");
    if (data) {
      try {
        const parsed = JSON.parse(data);
        const slots = Array(24).fill(null);
        parsed.forEach((item: any, i: number) => {
          if (i < 24 && item) {
            slots[i] = {
              nombre: item.nombre,
              notas: sanitizeMelody(item.notas)
            };
          }
        });
        setMelodiasGuardadas(slots);
      } catch (e) {
        console.error("Error parsing localstorage", e);
      }
    } else {
      // Prepopulate with default examples (Major scale, Minor scale, and Vocal Warm-ups)
      const defaultMelodies: (MelodiaGuardada | null)[] = Array(24).fill(null);
      
      // 1. Escala Mayor (Do)
      defaultMelodies[0] = {
        nombre: "Escala Mayor (Do)",
        notas: [
          [{ nota: "C", octava: 4 }],
          [{ nota: "D", octava: 4 }],
          [{ nota: "E", octava: 4 }],
          [{ nota: "F", octava: 4 }],
          [{ nota: "G", octava: 4 }],
          [{ nota: "A", octava: 4 }],
          [{ nota: "B", octava: 4 }],
          [{ nota: "C", octava: 5 }],
          [{ nota: "B", octava: 4 }],
          [{ nota: "A", octava: 4 }],
          [{ nota: "G", octava: 4 }],
          [{ nota: "F", octava: 4 }],
          [{ nota: "E", octava: 4 }],
          [{ nota: "D", octava: 4 }],
          [{ nota: "C", octava: 4 }]
        ]
      };

      // 2. Escala Menor (La)
      defaultMelodies[1] = {
        nombre: "Escala Menor (La)",
        notas: [
          [{ nota: "A", octava: 4 }],
          [{ nota: "B", octava: 4 }],
          [{ nota: "C", octava: 5 }],
          [{ nota: "D", octava: 5 }],
          [{ nota: "E", octava: 5 }],
          [{ nota: "F", octava: 5 }],
          [{ nota: "G", octava: 5 }],
          [{ nota: "A", octava: 5 }],
          [{ nota: "G", octava: 5 }],
          [{ nota: "F", octava: 5 }],
          [{ nota: "E", octava: 5 }],
          [{ nota: "D", octava: 5 }],
          [{ nota: "C", octava: 5 }],
          [{ nota: "B", octava: 4 }],
          [{ nota: "A", octava: 4 }]
        ]
      };

      // 3. Calentamiento: Arpegio Mayor
      defaultMelodies[2] = {
        nombre: "Calentamiento: Arpegio",
        notas: [
          [{ nota: "C", octava: 4 }],
          [{ nota: "E", octava: 4 }],
          [{ nota: "G", octava: 4 }],
          [{ nota: "C", octava: 5 }],
          [{ nota: "G", octava: 4 }],
          [{ nota: "E", octava: 4 }],
          [{ nota: "C", octava: 4 }]
        ]
      };

      // 4. Calentamiento: Escala 5 Notas (Pentacordio)
      defaultMelodies[3] = {
        nombre: "Calentamiento: 5 Notas",
        notas: [
          [{ nota: "C", octava: 4 }],
          [{ nota: "D", octava: 4 }],
          [{ nota: "E", octava: 4 }],
          [{ nota: "F", octava: 4 }],
          [{ nota: "G", octava: 4 }],
          [{ nota: "F", octava: 4 }],
          [{ nota: "E", octava: 4 }],
          [{ nota: "D", octava: 4 }],
          [{ nota: "C", octava: 4 }]
        ]
      };

      setMelodiasGuardadas(defaultMelodies);
      localStorage.setItem("melodiasGuardadas", JSON.stringify(defaultMelodies.filter(Boolean)));
    }
  }, []);

  // Web Audio initialization
  const initAudio = () => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
  };

  const playNote = (nota: string, octava: number, trans = 0) => {
    try {
      initAudio();
      const ctx = audioContextRef.current;
      if (!ctx) return;

      const index = notasBase.indexOf(nota) + (octava - 4) * 12 + trans;
      const freq = 440 * Math.pow(2, (index - 9) / 12);

      const currentVol = volumeRef.current;
      const preset = sonidoPresetRef.current;

      const gain = ctx.createGain();

      if (preset === "warm") {
        // 🎹 Cálido (Rhodes Piano): sine fundamental + triangle warm harmonics + 900Hz lowpass filter
        const oscSine = ctx.createOscillator();
        const oscTri = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();

        oscSine.type = "sine";
        oscSine.frequency.setValueAtTime(freq, ctx.currentTime);

        oscTri.type = "triangle";
        oscTri.frequency.setValueAtTime(freq, ctx.currentTime);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(900, ctx.currentTime);
        filter.Q.setValueAtTime(1, ctx.currentTime);

        const sineGain = ctx.createGain();
        const triGain = ctx.createGain();

        sineGain.gain.setValueAtTime(0.7, ctx.currentTime);
        triGain.gain.setValueAtTime(0.3, ctx.currentTime);

        oscSine.connect(sineGain);
        oscTri.connect(triGain);

        sineGain.connect(filter);
        triGain.connect(filter);

        filter.connect(gain);
        gain.connect(ctx.destination);

        // Soft attack, resonance decay
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(currentVol * 0.45, ctx.currentTime + 0.04);

        oscSine.start(ctx.currentTime);
        oscTri.start(ctx.currentTime);

        const dur = 0.55;
        gain.gain.setValueAtTime(currentVol * 0.45, ctx.currentTime + dur - 0.15);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);

        oscSine.stop(ctx.currentTime + dur);
        oscTri.stop(ctx.currentTime + dur);

      } else if (preset === "bright") {
        // ✨ Brillante (FM/Clavicordio): Sawtooth mixed with Sine + 3200Hz low-pass + resonant Q
        const oscSaw = ctx.createOscillator();
        const oscSine = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();

        oscSaw.type = "sawtooth";
        oscSaw.frequency.setValueAtTime(freq, ctx.currentTime);

        oscSine.type = "sine";
        oscSine.frequency.setValueAtTime(freq, ctx.currentTime);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(3200, ctx.currentTime); // high cutoff for bright harmonics
        filter.Q.setValueAtTime(1.2, ctx.currentTime); // slight resonant bump

        const sawGain = ctx.createGain();
        const sineGain = ctx.createGain();

        sawGain.gain.setValueAtTime(0.4, ctx.currentTime); // sawtooth adds crisp buzz
        sineGain.gain.setValueAtTime(0.6, ctx.currentTime); // sine acts as base fundamental

        oscSaw.connect(sawGain);
        oscSine.connect(sineGain);

        sawGain.connect(filter);
        sineGain.connect(filter);

        filter.connect(gain);
        gain.connect(ctx.destination);

        // Sharp direct attack, energetic decay
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(currentVol * 0.35, ctx.currentTime + 0.015);

        oscSaw.start(ctx.currentTime);
        oscSine.start(ctx.currentTime);

        const dur = 0.4;
        gain.gain.setValueAtTime(currentVol * 0.35, ctx.currentTime + dur - 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);

        oscSaw.stop(ctx.currentTime + dur);
        oscSine.stop(ctx.currentTime + dur);

      } else if (preset === "dark") {
        // 🌑 Oscuro (Sub/Softer Piano): Sine mixed with Triangle + heavy 450Hz low-pass filter
        const oscSine = ctx.createOscillator();
        const oscTri = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();

        oscSine.type = "sine";
        oscSine.frequency.setValueAtTime(freq, ctx.currentTime);

        oscTri.type = "triangle";
        oscTri.frequency.setValueAtTime(freq, ctx.currentTime);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(450, ctx.currentTime); // cuts out mids and highs entirely
        filter.Q.setValueAtTime(0.8, ctx.currentTime);

        const sineGain = ctx.createGain();
        const triGain = ctx.createGain();

        sineGain.gain.setValueAtTime(0.85, ctx.currentTime); // sine dominated for round dark body
        triGain.gain.setValueAtTime(0.15, ctx.currentTime);

        oscSine.connect(sineGain);
        oscTri.connect(triGain);

        sineGain.connect(filter);
        triGain.connect(filter);

        filter.connect(gain);
        gain.connect(ctx.destination);

        // Very slow warm attack, round decay
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(currentVol * 0.5, ctx.currentTime + 0.065);

        oscSine.start(ctx.currentTime);
        oscTri.start(ctx.currentTime);

        const dur = 0.6;
        gain.gain.setValueAtTime(currentVol * 0.5, ctx.currentTime + dur - 0.2);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);

        oscSine.stop(ctx.currentTime + dur);
        oscTri.stop(ctx.currentTime + dur);

      } else {
        // 📐 Sintetizador (Classic raw triangle voice)
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        osc.connect(gain);
        gain.connect(ctx.destination);

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(currentVol * 0.4, ctx.currentTime + 0.02);

        osc.start(ctx.currentTime);

        const dur = 0.35;
        gain.gain.setValueAtTime(currentVol * 0.4, ctx.currentTime + dur - 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);

        osc.stop(ctx.currentTime + dur);
      }
    } catch (e) {
      console.error("Audio Synthesis Error:", e);
    }
  };

  const getNotaTranspuesta = (nota: string, octava: number, trans: number) => {
    const index = notasBase.indexOf(nota) + (octava - 4) * 12 + trans;
    const MathMod = (n: number, m: number) => ((n % m) + m) % m;
    const nuevaOctava = 4 + Math.floor(index / 12);
    const nuevaNota = notasBase[MathMod(index, 12)];
    return { nota: nuevaNota, octava: nuevaOctava };
  };

  const highlightKey = (nota: string, octava: number, trans: number, duration: number) => {
    const nt = getNotaTranspuesta(nota, octava, trans);
    const key = `${nt.nota}${nt.octava}`;
    setActiveNotes(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setActiveNotes(prev => ({ ...prev, [key]: false }));
    }, duration);
  };

  // Safe playback state manager
  const runWithPlayingState = async (fn: () => Promise<void>) => {
    stopPlayback();
    // Allow browser threads to reset
    await new Promise(r => setTimeout(r, 60));

    isPlayingRef.current = true;
    setIsPlaying(true);

    try {
      await fn();
    } catch (err) {
      console.error("Playback error:", err);
    } finally {
      setIsPlaying(false);
      isPlayingRef.current = false;
      setActiveNotes({});
    }
  };

  const playMelodyLoop = async (repetir: number, trans: number) => {
    for (let i = 0; i < repetir; i++) {
      for (let step of melodiaRef.current) {
        if (!isPlayingRef.current) return;

        // Tocar polifónicamente todas las notas en este paso
        step.forEach((nota) => {
          playNote(nota.nota, nota.octava, trans);
        });

        const beatDuration = 60000 / bpmRef.current;
        
        // Resaltar todas las teclas de este acorde
        step.forEach((nota) => {
          highlightKey(nota.nota, nota.octava, trans, Math.min(beatDuration * 0.85, 450));
        });

        await new Promise(r => setTimeout(r, beatDuration));
      }
      if (!isPlayingRef.current) return;
      if (i < repetir - 1) {
        await new Promise(r => setTimeout(r, 600));
      }
    }
  };

  const playMelody = (reps = 4) => {
    if (melodia.length === 0) return;
    runWithPlayingState(async () => {
      await playMelodyLoop(reps, transposicionRef.current);
    });
  };

  const startChaining = () => {
    if (melodia.length === 0) return;
    const originalTrans = transposicionRef.current;
    runWithPlayingState(async () => {
      // Chain up: +0 to +5
      for (let trans = 0; trans <= 5; trans++) {
        if (!isPlayingRef.current) return;
        setTransposicion(trans);
        transposicionRef.current = trans;
        await playMelodyLoop(1, trans);
      }
      // Chain down: +4 to +0
      for (let trans = 4; trans >= 0; trans--) {
        if (!isPlayingRef.current) return;
        setTransposicion(trans);
        transposicionRef.current = trans;
        await playMelodyLoop(1, trans);
      }
      // Restore
      setTransposicion(originalTrans);
      transposicionRef.current = originalTrans;
    });
  };

  const stopPlayback = () => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    setActiveNotes({});
  };

  const clearMelody = () => {
    setMelodia([]);
    setMelodiaActivaIndex(-1);
    setCurrentChord([]);
  };

  const deleteNoteAt = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = [...melodia];
    updated.splice(index, 1);
    setMelodia(updated);
  };

  const saveMelody = () => {
    if (melodia.length === 0) {
      alert("No hay melodía para guardar. ¡Haz clic en las teclas del piano para crear una!");
      return;
    }

    // Find first empty slot
    let targetIndex = -1;
    for (let i = 0; i < 24; i++) {
      if (!melodiasGuardadas[i]) {
        targetIndex = i;
        break;
      }
    }

    let defaultName = `Melodía ${targetIndex !== -1 ? targetIndex + 1 : 1}`;
    const name = prompt("Nombre para esta melodía:", defaultName);
    if (!name) return;

    const newMelody: MelodiaGuardada = {
      nombre: name.trim(),
      notas: [...melodia]
    };

    const updated = [...melodiasGuardadas];
    if (targetIndex !== -1) {
      updated[targetIndex] = newMelody;
      setMelodiaActivaIndex(targetIndex);
    } else {
      if (confirm("Todos los slots están llenos. ¿Deseas sobreescribir el Slot 1?")) {
        updated[0] = newMelody;
        setMelodiaActivaIndex(0);
      } else {
        return;
      }
    }

    setMelodiasGuardadas(updated);
    localStorage.setItem("melodiasGuardadas", JSON.stringify(updated.filter(Boolean)));
    alert("✅ Melodía guardada");
  };

  const loadMelody = (index: number) => {
    const melItem = melodiasGuardadas[index];
    if (!melItem) {
      // QoL feature: click empty slot to save current melody
      if (melodia.length > 0) {
        if (confirm(`El Slot ${index + 1} está vacío. ¿Deseas guardar la melodía actual aquí?`)) {
          const name = prompt("Nombre para esta melodía:", `Melodía ${index + 1}`);
          if (!name) return;
          const updated = [...melodiasGuardadas];
          updated[index] = { nombre: name.trim(), notas: [...melodia] };
          setMelodiasGuardadas(updated);
          localStorage.setItem("melodiasGuardadas", JSON.stringify(updated.filter(Boolean)));
          setMelodiaActivaIndex(index);
        }
      }
      return;
    }

    setMelodiaActivaIndex(index);
    setMelodia(melItem.notas);
    melodiaRef.current = melItem.notas;

    // Play it once
    runWithPlayingState(async () => {
      await playMelodyLoop(1, transposicionRef.current);
    });
  };

  const renameMelody = (index: number) => {
    const melItem = melodiasGuardadas[index];
    if (!melItem) return;

    const newName = prompt("Nuevo nombre para la melodía:", melItem.nombre);
    if (newName && newName.trim() !== "") {
      const updated = [...melodiasGuardadas];
      updated[index] = {
        ...melItem,
        nombre: newName.trim()
      };
      setMelodiasGuardadas(updated);
      localStorage.setItem("melodiasGuardadas", JSON.stringify(updated.filter(Boolean)));
    }
  };

  const clearSlot = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`¿Seguro que deseas vaciar el Slot ${index + 1}?`)) {
      const updated = [...melodiasGuardadas];
      updated[index] = null;
      setMelodiasGuardadas(updated);
      localStorage.setItem("melodiasGuardadas", JSON.stringify(updated.filter(Boolean)));
      if (melodiaActivaIndex === index) {
        setMelodiaActivaIndex(-1);
      }
    }
  };

  // Keyboard render mapping
  const keys = useMemo(() => {
    const keyList: { nota: string; octava: number }[] = [];
    for (let oct = 4; oct <= 5; oct++) {
      notasBase.forEach((nota) => {
        keyList.push({ nota, octava: oct });
      });
    }
    return keyList;
  }, []);

  const handlePianoKeyClick = (nota: string, octava: number) => {
    // Tocar sonido de inmediato
    playNote(nota, octava, 0);

    if (modoAcorde) {
      // Toggle de nota en el acorde actual
      const alreadyInChord = currentChord.some((n) => n.nota === nota && n.octava === octava);
      if (alreadyInChord) {
        setCurrentChord(prev => prev.filter((n) => !(n.nota === nota && n.octava === octava)));
      } else {
        setCurrentChord(prev => [...prev, { nota, octava }]);
      }
    } else {
      // Visual feedback instantáneo
      highlightKey(nota, octava, 0, 300);
      // Agregar como paso de nota individual
      setMelodia(prev => [...prev, [{ nota, octava }]]);
      setMelodiaActivaIndex(-1);
    }
  };

  const handleAddChord = () => {
    if (currentChord.length === 0) return;
    setMelodia(prev => [...prev, [...currentChord]]);
    setCurrentChord([]);
    setMelodiaActivaIndex(-1);
  };

  const handleClearCurrentChord = () => {
    setCurrentChord([]);
  };

  const formatStepName = (step: Nota[]) => {
    return step.map(n => `${noteNamesEs[n.nota] || n.nota}${n.octava}`).join(" + ");
  };

  if (!isMounted) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white/50 text-sm">Cargando constructor...</div>;
  }

  return (
    <div
      className="relative min-h-screen flex flex-col bg-slate-900 bg-cover bg-center font-sans overflow-x-hidden text-white"
      style={{ backgroundImage: "url('/assets/background.jpeg')" }}
    >
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] z-0" />

      {/* Navigation & Header */}
      <header className="relative w-full px-4 pt-6 md:px-12 flex justify-between items-center z-20">
        <button
          onClick={() => router.push("/")}
          className="text-white/70 hover:text-white text-[10px] font-bold uppercase tracking-widest bg-black/40 px-4 py-2 rounded-full border border-white/10 transition-all hover:bg-black/60 flex items-center gap-2 cursor-pointer shadow-lg"
        >
          <ArrowLeft size={12} />
          <span>Menú Principal</span>
        </button>
        <div className="flex gap-4 opacity-80 md:opacity-100">
          <img
            src="/assets/logo21stCM_no_white_1.png"
            className="h-12 md:h-16 w-auto object-contain"
            alt="logo"
          />
        </div>
      </header>

      {/* Main Workspace */}
      <main className="relative flex-1 flex flex-col xl:flex-row items-stretch justify-center gap-6 p-4 md:p-8 z-10 w-full max-w-7xl mx-auto">
        
        {/* Play workspace column */}
        <section className="flex-1 flex flex-col justify-start bg-slate-900/60 border border-white/10 rounded-3xl p-4 md:p-6 backdrop-blur-xl shadow-2xl">
          
          <div className="mb-4">
            <h1
              className="text-white text-2xl md:text-4xl font-black italic tracking-tighter leading-tight flex items-center gap-3 drop-shadow-[0_2px_8px_rgba(20,184,166,0.3)]"
              style={{ fontFamily: "Chaney, sans-serif" }}
            >
              🎹 Constructor de Melodías
            </h1>
            <p className="text-xs text-slate-400 font-light mt-1">
              Diseña tus melodías, transpórtalas en tiempo real y entrena tu oído vocal o auditivo.
            </p>
          </div>

          {/* Controls Panel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            
            {/* Volume */}
            <div className="bg-black/30 p-3 rounded-2xl border border-white/5 flex flex-col justify-between">
              <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  {volume === 0 ? <VolumeX size={14} className="text-teal-400" /> : volume < 0.4 ? <Volume1 size={14} className="text-teal-400" /> : <Volume2 size={14} className="text-teal-400" />}
                  Volumen
                </span>
                <span className="text-[10px] text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded-full">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={volume * 100}
                onChange={(e) => setVolume(parseFloat(e.target.value) / 100)}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-teal-400 mt-3"
              />
            </div>

            {/* Tempo BPM */}
            <div className="bg-black/30 p-3 rounded-2xl border border-white/5 flex flex-col justify-between">
              <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Activity size={14} className="text-teal-400" />
                  BPM (Tempo)
                </span>
                <span className="text-[10px] text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded-full">{bpm} BPM</span>
              </div>
              <input
                type="range"
                min="40"
                max="200"
                value={bpm}
                onChange={(e) => setBpm(parseInt(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-teal-400 mt-3"
              />
            </div>

            {/* Sound Preset Picker */}
            <div className="bg-black/30 p-3 rounded-2xl border border-white/5 flex flex-col justify-between">
              <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Music size={14} className="text-teal-400" />
                  Sonido
                </span>
                <span className="text-[9px] text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded-full uppercase tracking-wider font-black">
                  {sonidoPreset === "warm" ? "🎹 Cálido" : sonidoPreset === "bright" ? "✨ Brillante" : sonidoPreset === "dark" ? "🌑 Oscuro" : "📐 Synth"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 bg-white/5 p-1 rounded-xl border border-white/5 mt-3">
                <button
                  onClick={() => setSonidoPreset("warm")}
                  className={`py-1 px-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    sonidoPreset === "warm" ? "bg-teal-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
                  }`}
                  title="Warm Rhodes Piano"
                >
                  Cálido
                </button>
                <button
                  onClick={() => setSonidoPreset("bright")}
                  className={`py-1 px-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    sonidoPreset === "bright" ? "bg-teal-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
                  }`}
                  title="Bright Crisp Key"
                >
                  Brillante
                </button>
                <button
                  onClick={() => setSonidoPreset("dark")}
                  className={`py-1 px-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    sonidoPreset === "dark" ? "bg-teal-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
                  }`}
                  title="Dark Soft Piano"
                >
                  Oscuro
                </button>
                <button
                  onClick={() => setSonidoPreset("classic")}
                  className={`py-1 px-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    sonidoPreset === "classic" ? "bg-teal-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
                  }`}
                  title="Classic Retro Synth"
                >
                  Synth
                </button>
              </div>
            </div>

            {/* Transpose */}
            <div className="bg-black/30 p-3 rounded-2xl border border-white/5 flex flex-col justify-between">
              <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <RotateCcw size={14} className="text-teal-400" />
                  Transposición
                </span>
                <span className="text-[10px] text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded-full">
                  {transposicion > 0 ? `+${transposicion}` : transposicion} semitonos
                </span>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => setTransposicion(prev => Math.max(-12, prev - 1))}
                  className="bg-white/5 hover:bg-white/10 text-white rounded-lg px-2.5 py-1 text-xs border border-white/10 cursor-pointer font-bold select-none active:scale-95 transition-all"
                >
                  -1
                </button>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  value={transposicion}
                  onChange={(e) => setTransposicion(parseInt(e.target.value))}
                  className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-teal-400"
                />
                <button
                  onClick={() => setTransposicion(prev => Math.min(12, prev + 1))}
                  className="bg-white/5 hover:bg-white/10 text-white rounded-lg px-2.5 py-1 text-xs border border-white/10 cursor-pointer font-bold select-none active:scale-95 transition-all"
                >
                  +1
                </button>
                <button
                  onClick={() => setTransposicion(0)}
                  className="text-[9px] uppercase tracking-wider text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg px-2 py-1.5 border border-white/5 select-none active:scale-95 transition-all"
                >
                  Reset
                </button>
              </div>
            </div>

          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => playMelody(4)}
              disabled={melodia.length === 0}
              className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer select-none active:scale-95 shadow-md ${
                isPlaying
                  ? "bg-slate-800 text-slate-400 border border-white/5 cursor-not-allowed"
                  : "bg-teal-500 hover:bg-teal-400 text-slate-950 hover:shadow-teal-500/20"
              }`}
            >
              <Play size={13} className="fill-current" />
              <span>🎯 Escucha (4x)</span>
            </button>

            <button
              onClick={startChaining}
              disabled={melodia.length === 0}
              className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer select-none active:scale-95 shadow-md ${
                isPlaying
                  ? "bg-slate-800 text-slate-400 border border-white/5 cursor-not-allowed"
                  : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white hover:shadow-orange-500/25"
              }`}
            >
              <Sparkles size={13} />
              <span>🔗 Encadenar</span>
            </button>

            <button
              onClick={() => {
                if (modoAcorde) {
                  setCurrentChord([]);
                }
                setModoAcorde(!modoAcorde);
              }}
              className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer select-none active:scale-95 border ${
                modoAcorde
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                  : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10"
              }`}
            >
              <span>🎹 Modo Acorde: {modoAcorde ? "ON" : "OFF"}</span>
            </button>

            <button
              onClick={stopPlayback}
              className="py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-widest bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer select-none active:scale-95"
            >
              <Square size={13} className="fill-current" />
              <span>Parar</span>
            </button>

            <button
              onClick={clearMelody}
              disabled={melodia.length === 0}
              className="py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-widest bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-slate-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer select-none active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
            >
              <Trash2 size={13} />
              <span>Borrar</span>
            </button>

            <button
              onClick={saveMelody}
              disabled={melodia.length === 0}
              className="py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-widest bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer select-none active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
            >
              <Save size={13} />
              <span>Guardar</span>
            </button>
          </div>

          {/* Chord Builder Banner (Rendered in Chord Mode) */}
          {modoAcorde && (
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-4 mb-5 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <Music size={18} />
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-black text-amber-400 tracking-wide uppercase italic">Constructor de Acordes</h4>
                  <p className="text-[10px] text-slate-400 font-light mt-0.5">
                    Selecciona varias notas en el piano y agrégalas juntas como un único acorde en la melodía.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
                <div className="bg-black/40 px-4 py-2 rounded-xl border border-white/5 min-w-[150px] text-center">
                  <span className="text-[8px] text-slate-500 block uppercase font-bold tracking-widest">Acorde Actual</span>
                  <span className="text-xs font-black text-amber-400 uppercase tracking-tighter">
                    {currentChord.length === 0 ? (
                      <em className="text-slate-600 font-normal italic">vacío</em>
                    ) : (
                      currentChord.map(n => `${noteNamesEs[n.nota] || n.nota}${n.octava}`).join(" • ")
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleAddChord}
                    disabled={currentChord.length === 0}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-40 disabled:pointer-events-none shadow-md shadow-amber-500/10"
                  >
                    <Plus size={14} />
                    <span>Añadir Acorde</span>
                  </button>
                  <button
                    onClick={handleClearCurrentChord}
                    disabled={currentChord.length === 0}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-xs px-3 py-2.5 rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sequence Visualizer */}
          <div className="bg-black/40 border border-white/5 rounded-2xl p-4 mb-6 flex-1 flex flex-col justify-between min-h-[140px]">
            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2 flex justify-between items-center">
              <span>Secuencia de Notas ({melodia.length})</span>
              {melodia.length > 0 && <span className="text-[8px] text-teal-400 uppercase">Haz clic en (×) para remover un elemento</span>}
            </div>
            
            <div className="flex-1 overflow-x-auto py-2 flex items-center gap-2 scrollbar-thin scrollbar-thumb-teal-400/20 scrollbar-track-transparent">
              {melodia.length === 0 ? (
                <div className="text-slate-500 text-xs italic flex items-center gap-2 select-none mx-auto py-4">
                  <Music size={14} />
                  <span>Haz clic en las teclas del piano para registrar notas o acordes...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {melodia.map((step, i) => {
                    const isChord = step.length > 1;
                    return (
                      <div
                        key={i}
                        className={`group flex items-center gap-2 select-none border transition-all animate-fadeIn ${
                          isChord
                            ? "bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30 rounded-xl pl-3 pr-1.5 py-1.5 hover:border-amber-400 hover:shadow-[0_0_10px_rgba(245,158,11,0.15)]"
                            : "bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border-teal-500/30 rounded-full pl-3 pr-1 py-1 hover:border-teal-400"
                        }`}
                      >
                        <span className={`text-xs font-black uppercase tracking-tighter ${
                          isChord ? "text-amber-400" : "text-teal-300"
                        }`}>
                          {formatStepName(step)}
                        </span>
                        <button
                          onClick={(e) => deleteNoteAt(i, e)}
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

          {/* Piano Keyboard Container */}
          <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 overflow-x-auto select-none">
            <div className="min-w-[840px] flex relative py-4 px-2 justify-center">
              {keys.map(({ nota, octava }, index) => {
                const isBlack = nota.includes("#");
                const keyId = `${nota}${octava}`;
                
                // Resaltar tecla si está sonando en playback, o si está pre-seleccionada en Modo Acorde
                const isKeySelected = currentChord.some((n) => n.nota === nota && n.octava === octava);
                const isActive = !!activeNotes[keyId] || (modoAcorde && isKeySelected);

                if (isBlack) {
                  return (
                    <button
                      key={keyId}
                      onMouseDown={() => handlePianoKeyClick(nota, octava)}
                      className={`w-7 h-36 bg-slate-900 border border-slate-800 rounded-b-md text-white flex items-end justify-center pb-2 text-[8px] font-medium cursor-pointer transition-all duration-75 select-none active:scale-[0.97] z-25 -mx-3.5 hover:bg-slate-850 hover:shadow-lg ${
                        isActive
                          ? "bg-amber-400 text-black border-amber-300 scale-[1.03] shadow-[0_0_15px_rgba(251,191,36,0.8)] z-30"
                          : "hover:border-slate-600"
                      }`}
                    >
                      <span>{noteNamesEs[nota] || nota}{octava}</span>
                    </button>
                  );
                } else {
                  return (
                    <button
                      key={keyId}
                      onMouseDown={() => handlePianoKeyClick(nota, octava)}
                      className={`w-11 h-52 bg-white border border-slate-300 rounded-b-lg text-slate-800 flex items-end justify-center pb-3 text-[9px] font-bold cursor-pointer transition-all duration-75 select-none active:scale-[0.97] z-10 hover:bg-slate-100 hover:shadow-inner ${
                        isActive
                          ? "bg-amber-400 text-black border-amber-300 scale-[1.02] shadow-[0_0_12px_rgba(251,191,36,0.7)] z-30"
                          : ""
                      }`}
                    >
                      <span>{noteNamesEs[nota] || nota}{octava}</span>
                    </button>
                  );
                }
              })}
            </div>
          </div>

        </section>

        {/* Saved slots column */}
        <aside className="w-full xl:w-[320px] flex flex-col justify-start bg-slate-900/40 border border-white/10 rounded-3xl p-4 md:p-6 backdrop-blur-md shadow-2xl">
          
          <div className="mb-4">
            <h2 className="text-white text-md font-black italic tracking-tighter uppercase flex items-center gap-2">
              <BookOpen size={16} className="text-teal-400" />
              <span>📌 Mis 24 Slots</span>
            </h2>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Haz clic para cargar, doble-clic para renombrar.
            </p>
          </div>

          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-1 gap-2.5 overflow-y-auto max-h-[480px] xl:max-h-[580px] pr-1 scrollbar-thin scrollbar-thumb-teal-400/20 scrollbar-track-transparent">
            {melodiasGuardadas.map((slot, i) => {
              const isActive = i === melodiaActivaIndex;

              if (slot) {
                return (
                  <div
                    key={i}
                    onClick={() => loadMelody(i)}
                    onDoubleClick={() => renameMelody(i)}
                    className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer select-none transition-all border ${
                      isActive
                        ? "bg-teal-500 border-teal-400 text-slate-950 shadow-[0_0_15px_rgba(20,184,166,0.3)] scale-[1.01]"
                        : "bg-white/5 border-white/5 hover:bg-white/10 text-white"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <span className={`text-[8px] font-bold uppercase tracking-wider block ${isActive ? "text-slate-950/70" : "text-teal-400"}`}>
                        Slot {i + 1}
                      </span>
                      <h3 className="text-xs font-black truncate max-w-[150px] leading-tight select-none mt-0.5">
                        {slot.nombre}
                      </h3>
                      <span className={`text-[9px] block ${isActive ? "text-slate-950/60" : "text-slate-400"}`}>
                        {slot.notas.length} pasos
                      </span>
                    </div>

                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => clearSlot(i, e)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer select-none transition-all ${
                          isActive
                            ? "bg-slate-950/20 text-slate-950 hover:bg-rose-600 hover:text-white"
                            : "bg-black/30 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                        }`}
                        title="Vaciar slot"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div
                    key={i}
                    onClick={() => loadMelody(i)}
                    className={`group flex items-center justify-between p-3 rounded-xl border border-dashed border-white/10 hover:border-teal-500/30 transition-all select-none ${
                      melodia.length > 0
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
                      <span className="text-[8px] text-teal-400/0 group-hover:text-teal-400 font-bold transition-all uppercase tracking-wider flex items-center gap-1 select-none">
                        <Plus size={8} /> Guardar
                      </span>
                    )}
                  </div>
                );
              }
            })}
          </div>

        </aside>

      </main>

      <footer className="mt-auto py-6 text-center text-slate-600 text-[8px] tracking-[0.6em] uppercase relative z-10 select-none">
        © 2026 21st Century Music
      </footer>

      {/* Entry animation styling */}
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
          animation: fadeIn 0.25s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
