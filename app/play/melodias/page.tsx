"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Volume2, VolumeX, Play, Square, Activity,
  Trash2, Save, BookOpen, Volume1, RotateCcw, Sparkles,
  Music, Plus, Keyboard, ChevronUp, ChevronDown,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Nota { nota: string; octava: number; }
type RestDuracion = "corchea" | "negra" | "blanca" | "redonda";
interface RestStep { rest: true; duracion: RestDuracion; }
type MelodiaStep = Nota[] | RestStep;
interface MelodiaGuardada { nombre: string; notas: MelodiaStep[]; }
type SonidoPreset = "warm" | "bright" | "dark" | "classic" | "sala" | "hall";

// ─── Constants ────────────────────────────────────────────────────────────────
const notasBase = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

const noteNamesEs: Record<string,string> = {
  "C":"Do","C#":"Do#","D":"Re","D#":"Re#","E":"Mi",
  "F":"Fa","F#":"Fa#","G":"Sol","G#":"Sol#","A":"La","A#":"La#","B":"Si"
};

const REST_MULTIPLIERS: Record<RestDuracion,number> = {
  corchea:0.5, negra:1, blanca:2, redonda:4
};
const REST_ICONS: Record<RestDuracion,string>  = {
  corchea:"♪", negra:"♩", blanca:"𝅗𝅥", redonda:"𝅝"
};
const REST_NAMES: Record<RestDuracion,string>  = {
  corchea:"Corchea", negra:"Negra", blanca:"Blanca", redonda:"Redonda"
};

// Computer keyboard → piano note mapping (QWERTY layout)
const KEY_TO_NOTE: Record<string,Nota> = {
  "a":{nota:"C", octava:4}, "w":{nota:"C#",octava:4},
  "s":{nota:"D", octava:4}, "e":{nota:"D#",octava:4},
  "d":{nota:"E", octava:4}, "f":{nota:"F", octava:4},
  "t":{nota:"F#",octava:4}, "g":{nota:"G", octava:4},
  "y":{nota:"G#",octava:4}, "h":{nota:"A", octava:4},
  "u":{nota:"A#",octava:4}, "j":{nota:"B", octava:4},
  "k":{nota:"C", octava:5}, "o":{nota:"C#",octava:5},
  "l":{nota:"D", octava:5}, "p":{nota:"D#",octava:5},
  "ñ":{nota:"E", octava:5},
};

const KEY_TO_REST: Record<string,RestDuracion> = {
  v:"corchea",
  b:"negra",
  n:"blanca",
  m:"redonda",
};

// Reverse map: "C4" → "A", "C#4" → "W", etc.
const NOTE_TO_KEY: Record<string,string> = Object.fromEntries(
  Object.entries(KEY_TO_NOTE).map(([k,v]) => [`${v.nota}${v.octava}`, k.toUpperCase()])
);

const REST_TO_KEY: Record<RestDuracion,string> = Object.fromEntries(
  Object.entries(KEY_TO_REST).map(([k,v]) => [v, k.toUpperCase()])
) as Record<RestDuracion,string>;

const SOUND_PRESETS: { id:SonidoPreset; label:string; icon:string }[] = [
  { id:"warm",    label:"Cálido",    icon:"🎹" },
  { id:"bright",  label:"Brillante", icon:"✨" },
  { id:"dark",    label:"Oscuro",    icon:"🌑" },
  { id:"classic", label:"Synth",     icon:"📐" },
  { id:"sala",    label:"Sala",      icon:"🏛️" },
  { id:"hall",    label:"Hall",      icon:"🌊" },
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
      const valid: RestDuracion[] = ["corchea","negra","blanca","redonda"];
      result.push({ rest:true, duracion: valid.includes(step.duracion) ? step.duracion : "negra" });
    } else if (Array.isArray(step)) {
      const f = step.filter((n:any) => n && typeof n.nota==="string" && typeof n.octava==="number");
      if (f.length > 0) result.push(f as Nota[]);
    } else if (step && typeof step.nota==="string" && typeof step.octava==="number") {
      result.push([step] as Nota[]);
    }
  }
  return result;
};

const formatStepLabel = (step: MelodiaStep): string => {
  if (isRestStep(step)) return `${REST_ICONS[step.duracion]} ${REST_NAMES[step.duracion]}`;
  return (step as Nota[]).map(n => `${noteNamesEs[n.nota]||n.nota}${n.octava}`).join(" + ");
};

const createReverbImpulse = (ctx: AudioContext, duration: number, decay: number): AudioBuffer => {
  const length = Math.floor(ctx.sampleRate * duration);
  const buf = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random()*2-1) * Math.pow(Math.max(0, 1-i/length), decay);
    }
  }
  return buf;
};

// ─── Default melodies ─────────────────────────────────────────────────────────
const buildDefaultMelodies = (): (MelodiaGuardada | null)[] => {
  const arr: (MelodiaGuardada | null)[] = Array(24).fill(null);
  const N = (nota:string, oct:number): Nota => ({ nota, octava:oct });
  const S = (...ns: Nota[]): Nota[] => ns;

  arr[0] = { nombre:"Escala Mayor (Do)", notas:[
    S(N("C",4)),S(N("D",4)),S(N("E",4)),S(N("F",4)),S(N("G",4)),
    S(N("A",4)),S(N("B",4)),S(N("C",5)),S(N("B",4)),S(N("A",4)),
    S(N("G",4)),S(N("F",4)),S(N("E",4)),S(N("D",4)),S(N("C",4)),
  ]};
  arr[1] = { nombre:"Escala Menor (La)", notas:[
    S(N("A",4)),S(N("B",4)),S(N("C",5)),S(N("D",5)),S(N("E",5)),
    S(N("F",5)),S(N("G",5)),S(N("A",5)),S(N("G",5)),S(N("F",5)),
    S(N("E",5)),S(N("D",5)),S(N("C",5)),S(N("B",4)),S(N("A",4)),
  ]};
  arr[2] = { nombre:"Calentamiento: Arpegio", notas:[
    S(N("C",4)),S(N("E",4)),S(N("G",4)),S(N("C",5)),
    S(N("G",4)),S(N("E",4)),S(N("C",4)),
  ]};
  arr[3] = { nombre:"Calentamiento: 5 Notas", notas:[
    S(N("C",4)),S(N("D",4)),S(N("E",4)),S(N("F",4)),S(N("G",4)),
    S(N("F",4)),S(N("E",4)),S(N("D",4)),S(N("C",4)),
  ]};
  arr[4] = { nombre:"Legato 1-3-5-3-1", notas:[
    S(N("C",4)),S(N("E",4)),S(N("G",4)),S(N("E",4)),S(N("C",4)),
  ]};
  arr[5] = { nombre:"Salto de Octava", notas:[
    S(N("C",4)),S(N("C",5)),S(N("C",4)),
  ]};
  arr[6] = { nombre:"Trino: Do-Re-Do", notas:[
    S(N("C",4)),S(N("D",4)),S(N("E",4)),S(N("D",4)),S(N("E",4)),
    S(N("F",4)),S(N("E",4)),S(N("F",4)),
    S(N("G",4)),S(N("F",4)),S(N("G",4)),S(N("A",4)),S(N("G",4)),
    S(N("A",4)),S(N("B",4)),S(N("A",4)),S(N("B",4)),S(N("C",5)),
    S(N("C",5)),S(N("B",4)),S(N("A",4)),S(N("B",4)),S(N("A",4)),S(N("G",4)),
    S(N("A",4)),S(N("G",4)),S(N("F",4)),S(N("G",4)),S(N("F",4)),
    S(N("E",4)),S(N("F",4)),S(N("E",4)),S(N("D",4)),S(N("E",4)),
    S(N("D",4)),S(N("C",4)),
  ]};
  arr[7] = { nombre:"Escala Cromática ↑", notas:[
    S(N("C",4)),S(N("C#",4)),S(N("D",4)),S(N("D#",4)),S(N("E",4)),
    S(N("F",4)),S(N("F#",4)),S(N("G",4)),S(N("G#",4)),S(N("A",4)),
    S(N("A#",4)),S(N("B",4)),S(N("C",5)),
  ]};
  return arr;
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function ConstructorMelodias() {
  const router = useRouter();

  // Core state
  const [isMounted,        setIsMounted]        = useState(false);
  const [melodia,          setMelodia]          = useState<MelodiaStep[]>([]);
  const [bpm,              setBpm]              = useState(120);
  const [volume,           setVolume]           = useState(0.8);
  const [transposicion,    setTransposicion]    = useState(0);
  const [sonidoPreset,     setSonidoPreset]     = useState<SonidoPreset>("warm");
  const [melodiasGuardadas,setMelodiasGuardadas]= useState<(MelodiaGuardada|null)[]>(Array(24).fill(null));
  const [isPlaying,        setIsPlaying]        = useState(false);
  const [melodiaActivaIndex,setMelodiaActivaIndex]=useState<number>(-1);
  const [activeNotes,      setActiveNotes]      = useState<Record<string,boolean>>({});

  // New feature states
  const [modoAcorde,       setModoAcorde]       = useState(false);
  const [currentChord,     setCurrentChord]     = useState<Nota[]>([]);
  const [modoLibre,        setModoLibre]        = useState(false);
  const [modoTeclado,      setModoTeclado]      = useState(false);
  const [listenReps,       setListenReps]       = useState(4);
  const [chainSettingsOpen,setChainSettingsOpen]= useState(false);
  const [chainStartSemitones,setChainStartSemitones]=useState(0);
  const [chainSemitones,   setChainSemitones]   = useState(5);
  const [currentPlayingStep,setCurrentPlayingStep]=useState<number|null>(null);
  const [predefinedOpen,    setPredefinedOpen]    = useState(true);
  const [userSlotsOpen,     setUserSlotsOpen]     = useState(true);

  // Playback refs (avoid stale closures)
  const isPlayingRef      = useRef(false);
  const bpmRef            = useRef(120);
  const volumeRef         = useRef(0.8);
  const transposicionRef  = useRef(0);
  const sonidoPresetRef   = useRef<SonidoPreset>("warm");
  const melodiaRef        = useRef<MelodiaStep[]>([]);
  const audioContextRef   = useRef<AudioContext|null>(null);
  const reverbRoomRef     = useRef<AudioBuffer|null>(null);
  const reverbHallRef     = useRef<AudioBuffer|null>(null);

  // Mutable refs for keyboard handler (prevent stale closure in useEffect)
  const modoTecladoRef    = useRef(false);
  const modoAcordeRef     = useRef(false);
  const modoLibreRef      = useRef(false);
  const hoveredStepRef    = useRef<number|null>(null);
  const handleKeyRef      = useRef<(nota:string, octava:number)=>void>(()=>{});

  // Sync state → refs
  useEffect(() => { bpmRef.current           = bpm;          }, [bpm]);
  useEffect(() => { volumeRef.current        = volume;       }, [volume]);
  useEffect(() => { transposicionRef.current = transposicion;}, [transposicion]);
  useEffect(() => { sonidoPresetRef.current  = sonidoPreset; }, [sonidoPreset]);
  useEffect(() => { melodiaRef.current       = melodia;      }, [melodia]);
  useEffect(() => { modoTecladoRef.current   = modoTeclado;  }, [modoTeclado]);
  useEffect(() => { modoAcordeRef.current    = modoAcorde;   }, [modoAcorde]);
  useEffect(() => { modoLibreRef.current     = modoLibre;    }, [modoLibre]);

  // ── Local storage & hydration ──────────────────────────────────────────────
  useEffect(() => {
    setIsMounted(true);
    const data = localStorage.getItem("melodiasGuardadas_v2");
    if (data) {
      try {
        const parsed = JSON.parse(data);
        const slots: (MelodiaGuardada|null)[] = Array(24).fill(null);
        parsed.forEach((item:any, i:number) => {
          if (i < 24 && item) slots[i] = { nombre:item.nombre, notas:sanitizeMelody(item.notas) };
        });
        const defaultTrino = buildDefaultMelodies()[6];
        if (defaultTrino && slots[6]?.nombre === "Trino: Do-Re-Do") {
          slots[6] = defaultTrino;
          localStorage.setItem("melodiasGuardadas_v2", JSON.stringify(slots.filter(Boolean)));
        }
        setMelodiasGuardadas(slots);
      } catch (e) { console.error(e); }
    } else {
      const defaults = buildDefaultMelodies();
      setMelodiasGuardadas(defaults);
      localStorage.setItem("melodiasGuardadas_v2", JSON.stringify(defaults.filter(Boolean)));
    }
  }, []);

  const persistSlots = (slots: (MelodiaGuardada|null)[]) => {
    localStorage.setItem("melodiasGuardadas_v2", JSON.stringify(slots.filter(Boolean)));
  };

  // ── Audio engine ──────────────────────────────────────────────────────────
  const initAudio = () => {
    if (!audioContextRef.current) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AC();
    }
    if (audioContextRef.current.state === "suspended") audioContextRef.current.resume();
  };

  const playNote = (nota:string, octava:number, trans=0) => {
    try {
      initAudio();
      const ctx = audioContextRef.current!;
      const index = notasBase.indexOf(nota) + (octava-4)*12 + trans;
      const freq  = 440 * Math.pow(2, (index-9)/12);
      const vol   = volumeRef.current;
      const preset= sonidoPresetRef.current;
      const masterGain = ctx.createGain();

      const connectDest = (node: AudioNode, wetRatio=0, reverbBuf?: AudioBuffer|null) => {
        if (wetRatio > 0 && reverbBuf) {
          const dryG = ctx.createGain(); dryG.gain.value = 1-wetRatio;
          const wetG = ctx.createGain(); wetG.gain.value = wetRatio;
          const conv = ctx.createConvolver(); conv.buffer = reverbBuf;
          node.connect(dryG); dryG.connect(ctx.destination);
          node.connect(conv); conv.connect(wetG); wetG.connect(ctx.destination);
        } else {
          node.connect(ctx.destination);
        }
      };

      if (preset === "warm" || preset === "sala" || preset === "hall") {
        const oscS = ctx.createOscillator(); oscS.type = "sine";     oscS.frequency.value = freq;
        const oscT = ctx.createOscillator(); oscT.type = "triangle"; oscT.frequency.value = freq;
        const filt = ctx.createBiquadFilter(); filt.type = "lowpass"; filt.frequency.value = 900; filt.Q.value = 1;
        const gS = ctx.createGain(); gS.gain.value = 0.7;
        const gT = ctx.createGain(); gT.gain.value = 0.3;
        oscS.connect(gS); oscT.connect(gT); gS.connect(filt); gT.connect(filt); filt.connect(masterGain);
        masterGain.gain.setValueAtTime(0, ctx.currentTime);
        masterGain.gain.linearRampToValueAtTime(vol*0.45, ctx.currentTime+0.04);
        oscS.start(); oscT.start();
        const dur = 0.55;
        masterGain.gain.setValueAtTime(vol*0.45, ctx.currentTime+dur-0.15);
        masterGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+dur);
        oscS.stop(ctx.currentTime+dur); oscT.stop(ctx.currentTime+dur);

        const wet   = preset==="sala" ? 0.3 : preset==="hall" ? 0.5 : 0;
        if (wet > 0) {
          if (preset==="sala" && !reverbRoomRef.current) reverbRoomRef.current = createReverbImpulse(ctx,0.8,3);
          if (preset==="hall" && !reverbHallRef.current) reverbHallRef.current = createReverbImpulse(ctx,2.2,2);
          connectDest(masterGain, wet, preset==="sala" ? reverbRoomRef.current : reverbHallRef.current);
        } else {
          masterGain.connect(ctx.destination);
        }

      } else if (preset === "bright") {
        const oscSaw  = ctx.createOscillator(); oscSaw.type  = "sawtooth"; oscSaw.frequency.value = freq;
        const oscSine = ctx.createOscillator(); oscSine.type = "sine";     oscSine.frequency.value = freq;
        const filt = ctx.createBiquadFilter(); filt.type = "lowpass"; filt.frequency.value = 3200; filt.Q.value = 1.2;
        const gSaw = ctx.createGain(); gSaw.gain.value = 0.4;
        const gSin = ctx.createGain(); gSin.gain.value = 0.6;
        oscSaw.connect(gSaw); oscSine.connect(gSin); gSaw.connect(filt); gSin.connect(filt); filt.connect(masterGain);
        masterGain.gain.setValueAtTime(0, ctx.currentTime);
        masterGain.gain.linearRampToValueAtTime(vol*0.35, ctx.currentTime+0.015);
        oscSaw.start(); oscSine.start();
        const dur = 0.4;
        masterGain.gain.setValueAtTime(vol*0.35, ctx.currentTime+dur-0.08);
        masterGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+dur);
        oscSaw.stop(ctx.currentTime+dur); oscSine.stop(ctx.currentTime+dur);
        masterGain.connect(ctx.destination);

      } else if (preset === "dark") {
        const oscS = ctx.createOscillator(); oscS.type = "sine";     oscS.frequency.value = freq;
        const oscT = ctx.createOscillator(); oscT.type = "triangle"; oscT.frequency.value = freq;
        const filt = ctx.createBiquadFilter(); filt.type = "lowpass"; filt.frequency.value = 450; filt.Q.value = 0.8;
        const gS = ctx.createGain(); gS.gain.value = 0.85;
        const gT = ctx.createGain(); gT.gain.value = 0.15;
        oscS.connect(gS); oscT.connect(gT); gS.connect(filt); gT.connect(filt); filt.connect(masterGain);
        masterGain.gain.setValueAtTime(0, ctx.currentTime);
        masterGain.gain.linearRampToValueAtTime(vol*0.5, ctx.currentTime+0.065);
        oscS.start(); oscT.start();
        const dur = 0.6;
        masterGain.gain.setValueAtTime(vol*0.5, ctx.currentTime+dur-0.2);
        masterGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+dur);
        oscS.stop(ctx.currentTime+dur); oscT.stop(ctx.currentTime+dur);
        masterGain.connect(ctx.destination);

      } else {
        // classic synth
        const osc = ctx.createOscillator(); osc.type = "triangle"; osc.frequency.value = freq;
        osc.connect(masterGain); masterGain.connect(ctx.destination);
        masterGain.gain.setValueAtTime(0, ctx.currentTime);
        masterGain.gain.linearRampToValueAtTime(vol*0.4, ctx.currentTime+0.02);
        osc.start();
        const dur = 0.35;
        masterGain.gain.setValueAtTime(vol*0.4, ctx.currentTime+dur-0.05);
        masterGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+dur);
        osc.stop(ctx.currentTime+dur);
      }
    } catch(e) { console.error("Audio error:", e); }
  };

  // ── Key highlight helpers ──────────────────────────────────────────────────
  const getTransposed = (nota:string, octava:number, trans:number) => {
    const idx = notasBase.indexOf(nota) + (octava-4)*12 + trans;
    const mod = (n:number,m:number) => ((n%m)+m)%m;
    return { nota: notasBase[mod(idx,12)], octava: 4+Math.floor(idx/12) };
  };

  const highlightKey = (nota:string, octava:number, trans:number, dur:number) => {
    const {nota:nt, octava:oc} = getTransposed(nota,octava,trans);
    const key = `${nt}${oc}`;
    setActiveNotes(p => ({...p,[key]:true}));
    setTimeout(() => setActiveNotes(p => ({...p,[key]:false})), dur);
  };

  // ── Playback ──────────────────────────────────────────────────────────────
  const stopPlayback = () => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    setActiveNotes({});
    setCurrentPlayingStep(null);
  };

  const runWithPlayingState = async (fn: ()=>Promise<void>) => {
    stopPlayback();
    await new Promise(r => setTimeout(r, 60));
    isPlayingRef.current = true;
    setIsPlaying(true);
    try { await fn(); }
    catch(e) { console.error(e); }
    finally {
      setIsPlaying(false);
      isPlayingRef.current = false;
      setActiveNotes({});
      setCurrentPlayingStep(null);
    }
  };

  const playMelodyLoop = async (repetir:number, trans:number) => {
    for (let rep=0; rep<repetir; rep++) {
      for (let si=0; si<melodiaRef.current.length; si++) {
        if (!isPlayingRef.current) return;
        const step = melodiaRef.current[si];
        setCurrentPlayingStep(si);

        if (isRestStep(step)) {
          const beat = 60000 / bpmRef.current;
          await new Promise(r => setTimeout(r, beat * REST_MULTIPLIERS[step.duracion]));
        } else {
          const notes = step as Nota[];
          notes.forEach(n => playNote(n.nota, n.octava, trans));
          const beat = 60000 / bpmRef.current;
          notes.forEach(n => highlightKey(n.nota, n.octava, trans, Math.min(beat*0.85, 450)));
          await new Promise(r => setTimeout(r, beat));
        }
      }
      if (!isPlayingRef.current) return;
      if (rep < repetir-1) {
        setCurrentPlayingStep(null);
        await new Promise(r => setTimeout(r, 500));
      }
    }
  };

  const playMelody = (reps=4) => {
    if (melodia.length===0) return;
    runWithPlayingState(async()=>{ await playMelodyLoop(reps, transposicionRef.current); });
  };

  const startChaining = () => {
    if (melodia.length===0) return;
    const orig = transposicionRef.current;
    const startT = chainStartSemitones;
    const maxT = chainSemitones;
    runWithPlayingState(async()=>{
      for (let t=startT; t<=maxT; t++) {
        if (!isPlayingRef.current) return;
        setTransposicion(t); transposicionRef.current = t;
        await playMelodyLoop(1, t);
        if (!isPlayingRef.current) return;
        await new Promise(r => setTimeout(r, 250));
      }
      for (let t=maxT-1; t>=startT; t--) {
        if (!isPlayingRef.current) return;
        setTransposicion(t); transposicionRef.current = t;
        await playMelodyLoop(1, t);
        if (!isPlayingRef.current) return;
        await new Promise(r => setTimeout(r, 250));
      }
      setTransposicion(orig); transposicionRef.current = orig;
    });
  };

  // ── Piano interaction ─────────────────────────────────────────────────────
  const handlePianoKeyClick = (nota:string, octava:number) => {
    playNote(nota, octava, 0);
    highlightKey(nota, octava, 0, 300);
    if (modoLibreRef.current) return;
    if (modoAcordeRef.current) {
      setCurrentChord(prev => {
        const already = prev.some(n => n.nota===nota && n.octava===octava);
        return already ? prev.filter(n => !(n.nota===nota && n.octava===octava)) : [...prev, {nota,octava}];
      });
    } else {
      setMelodia(prev => [...prev, [{nota,octava}]]);
      setMelodiaActivaIndex(-1);
    }
  };

  // Keep ref in sync for use inside event listener
  useEffect(() => {
    handleKeyRef.current = handlePianoKeyClick;
  });

  // ── PC Keyboard event listeners ───────────────────────────────────────────
  useEffect(() => {
    const pressed = new Set<string>();
    const onDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag==="INPUT"||tag==="TEXTAREA") return;
      const key = e.key.toLowerCase();
      if (key === "x" && hoveredStepRef.current !== null) {
        const indexToDelete = hoveredStepRef.current;
        hoveredStepRef.current = null;
        setMelodia(prev => prev.filter((_, i) => i !== indexToDelete));
        e.preventDefault();
        return;
      }
      if (!modoTecladoRef.current) return;
      if (KEY_TO_REST[key]) {
        if (pressed.has(key)) return;
        pressed.add(key);
        setMelodia(prev => [...prev, { rest:true, duracion:KEY_TO_REST[key] }]);
        setMelodiaActivaIndex(-1);
        e.preventDefault();
        return;
      }
      if (!KEY_TO_NOTE[key]) return;
      if (pressed.has(key)) return;
      pressed.add(key);
      const {nota,octava} = KEY_TO_NOTE[key];
      handleKeyRef.current(nota, octava);
    };
    const onUp = (e: KeyboardEvent) => {
      const key = e.key === ";" ? ";" : e.key.toLowerCase();
      pressed.delete(key);
    };
    document.addEventListener("keydown", onDown);
    document.addEventListener("keyup",   onUp);
    return () => { document.removeEventListener("keydown",onDown); document.removeEventListener("keyup",onUp); };
  }, []);

  // ── Chord mode ────────────────────────────────────────────────────────────
  const handleAddChord = () => {
    if (currentChord.length===0) return;
    setMelodia(prev => [...prev, [...currentChord]]);
    setCurrentChord([]);
    setMelodiaActivaIndex(-1);
  };

  // ── Rest insertion ────────────────────────────────────────────────────────
  const addRest = (duracion: RestDuracion) => {
    setMelodia(prev => [...prev, { rest:true, duracion }]);
    setMelodiaActivaIndex(-1);
  };

  // ── Melody management ─────────────────────────────────────────────────────
  const clearMelody = () => { setMelodia([]); setMelodiaActivaIndex(-1); setCurrentChord([]); };

  const deleteStepAt = (i:number, e:React.MouseEvent) => {
    e.stopPropagation();
    if (hoveredStepRef.current===i) hoveredStepRef.current = null;
    setMelodia(prev => { const u=[...prev]; u.splice(i,1); return u; });
  };

  const saveMelody = () => {
    if (melodia.length===0) { alert("No hay melodía para guardar."); return; }
    let tgt = melodiasGuardadas.findIndex(s => !s);
    if (tgt===-1 && !confirm("Todos los slots están llenos. ¿Sobreescribir Slot 1?")) return;
    if (tgt===-1) tgt=0;
    const name = prompt("Nombre para esta melodía:", `Melodía ${tgt+1}`);
    if (!name) return;
    const upd = [...melodiasGuardadas];
    upd[tgt] = { nombre:name.trim(), notas:[...melodia] };
    setMelodiasGuardadas(upd); setMelodiaActivaIndex(tgt); persistSlots(upd);
    alert("✅ Melodía guardada");
  };

  const loadMelody = (i:number) => {
    const mel = melodiasGuardadas[i];
    if (!mel) {
      if (melodia.length>0 && confirm(`Slot ${i+1} vacío. ¿Guardar aquí?`)) {
        const name = prompt("Nombre:", `Melodía ${i+1}`); if (!name) return;
        const upd=[...melodiasGuardadas]; upd[i]={nombre:name.trim(),notas:[...melodia]};
        setMelodiasGuardadas(upd); persistSlots(upd); setMelodiaActivaIndex(i);
      }
      return;
    }
    setMelodiaActivaIndex(i); setMelodia(mel.notas); melodiaRef.current=mel.notas;
    runWithPlayingState(async()=>{ await playMelodyLoop(1, transposicionRef.current); });
  };

  const renameMelody = (i:number) => {
    const mel = melodiasGuardadas[i]; if (!mel) return;
    const name = prompt("Nuevo nombre:", mel.nombre);
    if (name?.trim()) {
      const upd=[...melodiasGuardadas]; upd[i]={...mel,nombre:name.trim()};
      setMelodiasGuardadas(upd); persistSlots(upd);
    }
  };

  const clearSlot = (i:number, e:React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`¿Vaciar Slot ${i+1}?`)) return;
    const upd=[...melodiasGuardadas]; upd[i]=null;
    setMelodiasGuardadas(upd); persistSlots(upd);
    if (melodiaActivaIndex===i) setMelodiaActivaIndex(-1);
  };

  // ── Piano key layout ──────────────────────────────────────────────────────
  const keys = useMemo(() => {
    const list: {nota:string;octava:number}[] = [];
    for (let oct=4; oct<=5; oct++) notasBase.forEach(nota => list.push({nota,octava:oct}));
    return list;
  }, []);

  // ── "Now Playing" label ───────────────────────────────────────────────────
  const nowPlayingLabel = useMemo(()=>{
    if (currentPlayingStep===null) return null;
    const step = melodia[currentPlayingStep];
    if (!step) return null;
    return formatStepLabel(step);
  }, [currentPlayingStep, melodia]);

  if (!isMounted) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white/50 text-sm">Cargando...</div>;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className="relative min-h-screen flex flex-col font-sans overflow-x-hidden text-white bg-slate-900 bg-cover bg-center"
      style={{ backgroundImage:"url('/assets/background.jpeg')" }}
    >
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] z-0" />

      {/* Header */}
      <header className="relative w-full px-4 pt-6 md:px-12 flex justify-between items-center z-20">
        <button onClick={()=>router.push("/")}
          className="text-white/70 hover:text-white text-[10px] font-bold uppercase tracking-widest bg-black/40 px-4 py-2 rounded-full border border-white/10 transition-all hover:bg-black/60 flex items-center gap-2 cursor-pointer shadow-lg">
          <ArrowLeft size={12}/><span>Menú Principal</span>
        </button>
        <img src="/assets/logo21stCM_no_white_1.png" className="h-12 md:h-16 w-auto object-contain opacity-80" alt="logo"/>
      </header>

      {/* Main */}
      <main className="relative flex-1 flex flex-col xl:flex-row items-stretch justify-center gap-6 p-4 md:p-8 z-10 w-full max-w-7xl mx-auto">

        {/* ── Left: workspace ── */}
        <section className="flex-1 flex flex-col bg-slate-900/60 border border-white/10 rounded-3xl p-4 md:p-6 backdrop-blur-xl shadow-2xl">

          {/* Title */}
          <div className="mb-4">
            <h1 className="text-white text-2xl md:text-4xl font-black italic tracking-tighter leading-tight drop-shadow-[0_2px_8px_rgba(20,184,166,0.3)]"
              style={{fontFamily:"Chaney, sans-serif"}}>
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
                  {volume===0?<VolumeX size={14} className="text-teal-400"/>:volume<0.4?<Volume1 size={14} className="text-teal-400"/>:<Volume2 size={14} className="text-teal-400"/>}
                  Volumen
                </span>
                <span className="text-[10px] text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded-full">{Math.round(volume*100)}%</span>
              </div>
              <input type="range" min="0" max="100" value={volume*100} onChange={e=>setVolume(+e.target.value/100)}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-teal-400"/>
            </div>

            {/* BPM */}
            <div className="bg-black/30 p-3 rounded-2xl border border-white/5 flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5"><Activity size={14} className="text-teal-400"/>BPM</span>
                <span className="text-[10px] text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded-full">{bpm}</span>
              </div>
              <input type="range" min="40" max="200" value={bpm} onChange={e=>setBpm(+e.target.value)}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-teal-400"/>
            </div>

            {/* Sound preset — 3×2 grid */}
            <div className="bg-black/30 p-3 rounded-2xl border border-white/5 flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5"><Music size={14} className="text-teal-400"/>Sonido</span>
                <span className="text-[9px] text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded-full uppercase font-black tracking-wide">
                  {SOUND_PRESETS.find(p=>p.id===sonidoPreset)?.icon} {SOUND_PRESETS.find(p=>p.id===sonidoPreset)?.label}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                {SOUND_PRESETS.map(p=>(
                  <button key={p.id} onClick={()=>setSonidoPreset(p.id)}
                    className={`py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer leading-tight ${
                      sonidoPreset===p.id?"bg-teal-500 text-slate-950 shadow-md":"text-slate-400 hover:text-white"
                    }`}
                    title={p.label}>
                    {p.icon}<br/>{p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Transpose */}
            <div className="bg-black/30 p-3 rounded-2xl border border-white/5 flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5"><RotateCcw size={14} className="text-teal-400"/>Transposición</span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded-full">
                    {transposicion>0?`+${transposicion}`:transposicion} st
                  </span>
                  <button onClick={()=>setTransposicion(0)}
                    className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 hover:text-white flex items-center justify-center select-none active:scale-95 transition-all"
                    title="Resetear transposición">
                    <RotateCcw size={11}/>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-[32px_minmax(0,1fr)_32px] items-center gap-1.5">
                <button onClick={()=>setTransposicion(p=>Math.max(-12,p-1))}
                  className="w-8 bg-white/5 hover:bg-white/10 text-white rounded-lg py-1 text-xs border border-white/10 cursor-pointer font-bold select-none active:scale-95 transition-all">-1</button>
                <input type="range" min="-12" max="12" value={transposicion} onChange={e=>setTransposicion(+e.target.value)}
                  className="min-w-0 w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-teal-400"/>
                <button onClick={()=>setTransposicion(p=>Math.min(12,p+1))}
                  className="w-8 bg-white/5 hover:bg-white/10 text-white rounded-lg py-1 text-xs border border-white/10 cursor-pointer font-bold select-none active:scale-95 transition-all">+1</button>
              </div>
            </div>
          </div>

          {/* Action toolbar — fila 1: reproducción */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="relative group">
              <button onClick={()=>isPlaying ? stopPlayback() : playMelody(listenReps)} disabled={!isPlaying && melodia.length===0}
                className={`w-full h-12 px-3 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none active:scale-95 shadow-md ${
                  isPlaying?"bg-rose-600/80 hover:bg-rose-600 text-white border border-rose-300/30":"bg-teal-500 hover:bg-teal-400 text-slate-950"}`}>
                {isPlaying ? <Square size={12} className="fill-current"/> : <Play size={12} className="fill-current"/>}
                <span>{isPlaying ? "Parar" : `Escucha (${listenReps}x)`}</span>
              </button>
              <div className={`absolute left-1/2 top-full z-40 ${isPlaying ? "hidden" : "hidden group-hover:flex"} -translate-x-1/2 mt-1.5 min-w-[190px] flex-col gap-2 rounded-xl bg-slate-950/95 border border-white/10 p-3 shadow-2xl backdrop-blur-md animate-fadeIn`}>
                <span className="text-[9px] font-black uppercase tracking-widest text-teal-300 text-center">¿Cuántas veces quieres escuchar?</span>
                <div className="flex items-center justify-center gap-2">
                  <button onClick={()=>setListenReps(p=>Math.max(1,p-1))}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white cursor-pointer select-none transition-colors flex items-center justify-center active:scale-95"><ChevronDown size={14}/></button>
                  <span className="text-sm font-black text-teal-300 w-8 text-center">{listenReps}</span>
                  <button onClick={()=>setListenReps(p=>Math.min(12,p+1))}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white cursor-pointer select-none transition-colors flex items-center justify-center active:scale-95"><ChevronUp size={14}/></button>
                </div>
              </div>
            </div>

            {/* Encadenar + hover semitone control */}
            <div className="relative group">
              <button onClick={()=>{ setChainSettingsOpen(true); startChaining(); }} disabled={melodia.length===0 || isPlaying}
                className={`w-full h-12 px-3 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none active:scale-95 shadow-md ${
                  isPlaying?"bg-slate-800 text-slate-400 border border-white/5 cursor-not-allowed":"bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white"}`}>
                <Sparkles size={12}/><span>Encadenamiento</span>
              </button>
              {/* bridge invisible que cubre el hueco entre botón y panel para que el hover no se pierda */}
              <div className="absolute top-full left-0 right-0 h-[6px]" aria-hidden="true" />
              <div className={`absolute left-1/2 top-full z-40 ${chainSettingsOpen ? "flex" : "hidden group-hover:flex"} -translate-x-1/2 mt-1.5 min-w-[240px] flex-col gap-3 rounded-xl bg-slate-950/95 border border-white/10 p-3 shadow-2xl backdrop-blur-md animate-fadeIn`}>
                <button onClick={()=>setChainSettingsOpen(false)}
                  className="absolute right-2 top-2 w-5 h-5 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-[10px] flex items-center justify-center"
                  title="Cerrar ajustes de encadenamiento">×</button>
                <div className="space-y-1.5">
                  <span className="block text-[9px] font-black uppercase tracking-widest text-amber-300 text-center">¿Desde qué semitono empieza?</span>
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={()=>setChainStartSemitones(p=>Math.max(-12,p-1))}
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white cursor-pointer select-none transition-colors flex items-center justify-center active:scale-95"><ChevronDown size={14}/></button>
                    <span className="text-sm font-black text-sky-300 w-10 text-center">{chainStartSemitones>0?`+${chainStartSemitones}`:chainStartSemitones}</span>
                    <button onClick={()=>setChainStartSemitones(p=>Math.min(chainSemitones,p+1))}
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white cursor-pointer select-none transition-colors flex items-center justify-center active:scale-95"><ChevronUp size={14}/></button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <span className="block text-[9px] font-black uppercase tracking-widest text-amber-300 text-center">¿Cuántos semitonos quieres encadenar?</span>
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={()=>setChainSemitones(p=>Math.max(chainStartSemitones,p-1))}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white cursor-pointer select-none transition-colors flex items-center justify-center active:scale-95"><ChevronDown size={14}/></button>
                    <span className="text-sm font-black text-teal-300 w-10 text-center">{chainSemitones>0?`+${chainSemitones}`:chainSemitones}</span>
                    <button onClick={()=>setChainSemitones(p=>Math.min(12,p+1))}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white cursor-pointer select-none transition-colors flex items-center justify-center active:scale-95"><ChevronUp size={14}/></button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modo Acorde toggle */}
            <div className="relative group">
              <button onClick={()=>{ if(modoAcorde) setCurrentChord([]); setModoAcorde(p=>!p); }}
                className={`w-full h-12 px-3 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none active:scale-95 border ${
                  modoAcorde?"bg-amber-500/25 text-amber-200 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.2)]":"bg-amber-500/10 hover:bg-amber-500/15 text-amber-300 border-amber-500/25"}`}>
                <span>🎹 Acorde {modoAcorde?"ON":"OFF"}</span>
              </button>
              <div className="absolute left-1/2 top-full z-40 hidden group-hover:block -translate-x-1/2 mt-1.5 whitespace-nowrap rounded-lg bg-slate-950/95 border border-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-amber-300 shadow-2xl backdrop-blur-md animate-fadeIn">
                Suena más de una nota a la vez
              </div>
            </div>
          </div>

          {/* Action toolbar — fila 2: modos · fila 3: acciones */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="relative group">
              <button onClick={()=>{ setModoLibre(p=>!p); setCurrentChord([]); }}
                className={`w-full h-12 px-3 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none active:scale-95 border ${
                  modoLibre?"bg-sky-500/25 text-sky-200 border-sky-500/60 shadow-[0_0_12px_rgba(14,165,233,0.2)]":"bg-sky-500/10 hover:bg-sky-500/15 text-sky-300 border-sky-500/25"}`}>
                <span>🖐 Libre {modoLibre?"ON":"OFF"}</span>
              </button>
              <div className="absolute left-1/2 top-full z-40 hidden group-hover:block -translate-x-1/2 mt-1.5 whitespace-nowrap rounded-lg bg-slate-950/95 border border-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-sky-300 shadow-2xl backdrop-blur-md animate-fadeIn">
                Toca sin registrar las notas
              </div>
            </div>

            {/* Teclado PC toggle */}
            <div className="relative group">
              <button onClick={()=>setModoTeclado(p=>!p)}
                className={`w-full h-12 px-3 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none active:scale-95 border ${
                  modoTeclado?"bg-violet-500/25 text-violet-200 border-violet-500/60 shadow-[0_0_12px_rgba(139,92,246,0.2)]":"bg-violet-500/10 hover:bg-violet-500/15 text-violet-300 border-violet-500/25"}`}>
                <Keyboard size={12}/><span>PC {modoTeclado?"ON":"OFF"}</span>
              </button>
              <div className="absolute left-1/2 top-full z-40 hidden group-hover:block -translate-x-1/2 mt-1.5 whitespace-nowrap rounded-lg bg-slate-950/95 border border-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-violet-300 shadow-2xl backdrop-blur-md animate-fadeIn">
                Escribe las notas con el teclado del ordenador
              </div>
            </div>

            <button onClick={clearMelody} disabled={melodia.length===0}
              className="w-full h-10 px-3 rounded-xl font-bold text-[10px] uppercase tracking-widest bg-slate-500/15 hover:bg-slate-500/25 text-slate-300 border border-slate-400/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none active:scale-95 disabled:opacity-30 disabled:pointer-events-none">
              <Trash2 size={12}/><span>Borrar</span>
            </button>
            <button onClick={saveMelody} disabled={melodia.length===0}
              className="w-full h-10 px-3 rounded-xl font-bold text-[10px] uppercase tracking-widest bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none active:scale-95 disabled:opacity-30 disabled:pointer-events-none">
              <Save size={12}/><span>Guardar</span>
            </button>
          </div>

          {/* Chord builder banner */}
          {modoAcorde && (
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-3 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <Music size={16}/>
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-400 tracking-wide uppercase italic">Constructor de Acordes</h4>
                  <p className="text-[10px] text-slate-400 font-light mt-0.5">Selecciona notas y agrégalas como un único acorde.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <div className="bg-black/40 px-3 py-1.5 rounded-xl border border-white/5 min-w-[140px] text-center">
                  <span className="text-[8px] text-slate-500 block uppercase font-bold tracking-widest">Acorde Actual</span>
                  <span className="text-xs font-black text-amber-400 uppercase tracking-tighter">
                    {currentChord.length===0 ? <em className="text-slate-600 font-normal italic">vacío</em>
                      : currentChord.map(n=>`${noteNamesEs[n.nota]||n.nota}${n.octava}`).join(" • ")}
                  </span>
                </div>
                <button onClick={handleAddChord} disabled={currentChord.length===0}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 active:scale-95 disabled:opacity-40 disabled:pointer-events-none">
                  <Plus size={12}/><span>Añadir</span>
                </button>
                <button onClick={()=>setCurrentChord([])} disabled={currentChord.length===0}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-xs px-3 py-2 rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-30 disabled:pointer-events-none">
                  Limpiar
                </button>
              </div>
            </div>
          )}

          {/* Sequence visualizer */}
          <div className="bg-black/40 border border-white/5 rounded-2xl p-3 mb-4 flex flex-col min-h-[100px]">
            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2 flex justify-between items-center shrink-0">
              <span>Secuencia ({melodia.length} pasos)</span>
              {melodia.length>0 && <span className="text-[8px] text-teal-400">× o tecla X para eliminar</span>}
            </div>
            <div className="flex-1 overflow-x-hidden overflow-y-auto py-1">
              {melodia.length===0 ? (
                <div className="text-slate-500 text-xs italic flex items-center gap-2 select-none mx-auto py-2">
                  <Music size={13}/><span>{modoLibre ? "Modo libre activo: toca sin registrar notas..." : "Haz clic en el piano para registrar notas..."}</span>
                </div>
              ) : (
                <div className="flex items-center content-start gap-1.5 flex-wrap">
                  {melodia.map((step,i)=>{
                    const rest  = isRestStep(step);
                    const chord = !rest && (step as Nota[]).length>1;
                    const active= i===currentPlayingStep;
                    return (
                      <div key={i}
                        onMouseEnter={()=>{ hoveredStepRef.current = i; }}
                        onMouseLeave={()=>{ if (hoveredStepRef.current===i) hoveredStepRef.current = null; }}
                        className={`group flex items-center gap-1.5 select-none border transition-all animate-fadeIn shrink-0 ${
                          active ? "ring-2 ring-amber-400 scale-105 shadow-[0_0_14px_rgba(251,191,36,0.5)]" : ""
                        } ${
                          rest  ? "bg-slate-700/40 border-slate-500/40 rounded-xl pl-2.5 pr-1 py-1 hover:border-slate-400"
                          :chord? "bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30 rounded-xl pl-2.5 pr-1 py-1 hover:border-amber-400"
                          :       "bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border-teal-500/30 rounded-full pl-2.5 pr-1 py-0.5 hover:border-teal-400"
                        }`}>
                        <span className={`text-xs font-black uppercase tracking-tighter whitespace-nowrap ${
                          rest?"text-slate-400":chord?"text-amber-400":"text-teal-300"}`}>
                          {formatStepLabel(step)}
                        </span>
                        <button onClick={e=>deleteStepAt(i,e)}
                          className="w-4 h-4 rounded-full bg-black/40 hover:bg-rose-500 hover:text-white flex items-center justify-center text-[9px] text-slate-400 cursor-pointer select-none transition-colors border border-white/5">×</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* PC keyboard hint */}
          {modoTeclado && (
            <div className="mb-3 bg-violet-500/10 border border-violet-500/30 rounded-xl px-3 py-2 flex items-center gap-2 animate-fadeIn">
              <Keyboard size={13} className="text-violet-400 shrink-0"/>
              <span className="text-[9px] text-violet-300 font-bold uppercase tracking-wide">Teclado activo:</span>
              <span className="text-[9px] text-slate-400 font-mono">A=Do · W=Do# · S=Re · E=Re# · D=Mi · F=Fa · T=Fa# · G=Sol · Y=Sol# · H=La · U=La# · J=Si · K=Do' · L=Re' · O=Do#' · P=Re#' · Ñ=Mi' · V/B/N/M=Silencios</span>
            </div>
          )}

          {/* Now Playing indicator */}
          <div className={`mb-3 transition-all duration-300 ${nowPlayingLabel ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"}`}>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0"/>
              <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest shrink-0">Sonando</span>
              <span className="text-sm font-black text-white uppercase tracking-tight">{nowPlayingLabel}</span>
            </div>
          </div>

          {/* Piano keyboard */}
          <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 overflow-hidden select-none">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 overflow-x-auto">
                <div className="min-w-[840px] flex relative py-4 px-2 justify-center">
                  {keys.map(({nota,octava})=>{
                const isBlack = nota.includes("#");
                const keyId  = `${nota}${octava}`;
                const pcKey  = NOTE_TO_KEY[keyId];
                const isChordSelected = currentChord.some(n=>n.nota===nota&&n.octava===octava);
                const isSounding = !!activeNotes[keyId];
                const isChordActive = modoAcorde && isChordSelected;

                if (isBlack) return (
                  <button key={keyId} onMouseDown={()=>handlePianoKeyClick(nota,octava)}
                    className={`relative w-7 h-36 bg-slate-900 border border-slate-800 rounded-b-md text-white flex flex-col items-center justify-end pb-1.5 text-[7px] font-medium cursor-pointer transition-all duration-75 select-none active:scale-[0.97] z-25 -mx-3.5 hover:shadow-lg ${
                      isSounding
                        ? "bg-sky-400 text-slate-950 border-sky-200 scale-[1.03] shadow-[0_0_18px_rgba(56,189,248,0.85)] z-30"
                        : isChordActive
                          ? "bg-amber-400 text-black border-amber-300 scale-[1.03] shadow-[0_0_15px_rgba(251,191,36,0.8)] z-30"
                          : "hover:border-slate-600"
                    }`}>
                    {modoTeclado && pcKey && <span className={`text-[7px] font-black rounded px-0.5 mb-0.5 leading-none ${isSounding ? "text-slate-950 bg-white/70" : "text-violet-300 bg-violet-900/60"}`}>{pcKey}</span>}
                    <span>{noteNamesEs[nota]}{octava}</span>
                  </button>
                );

                return (
                  <button key={keyId} onMouseDown={()=>handlePianoKeyClick(nota,octava)}
                    className={`relative w-11 h-52 bg-white border border-slate-300 rounded-b-lg text-slate-800 flex flex-col items-center justify-end pb-2 text-[9px] font-bold cursor-pointer transition-all duration-75 select-none active:scale-[0.97] z-10 hover:bg-slate-100 hover:shadow-inner ${
                      isSounding
                        ? "bg-sky-400 text-slate-950 border-sky-200 scale-[1.02] shadow-[0_0_16px_rgba(56,189,248,0.8)] z-30"
                        : isChordActive
                          ? "bg-amber-400 text-black border-amber-300 scale-[1.02] shadow-[0_0_12px_rgba(251,191,36,0.7)] z-30"
                          : ""
                    }`}>
                    {modoTeclado && pcKey && <span className={`text-[8px] font-black rounded px-1 mb-1 leading-none ${isSounding ? "text-slate-950 bg-white/70" : "text-violet-500 bg-violet-100"}`}>{pcKey}</span>}
                    <span>{noteNamesEs[nota]}{octava}</span>
                  </button>
                );
                  })}
                </div>
              </div>

              <div className="w-full lg:w-40 shrink-0 bg-black/25 border border-white/10 rounded-2xl p-3">
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center justify-between">
                  <span>Silencios</span>
                  {modoTeclado && <span className="text-violet-300">PC</span>}
                </div>
                <div className="grid grid-cols-4 lg:grid-cols-1 overflow-hidden rounded-xl border border-white/5">
                  {(["corchea","negra","blanca","redonda"] as RestDuracion[]).map((d,i)=>(
                    <button key={d} onClick={()=>addRest(d)}
                      className={`min-h-12 bg-slate-800/60 hover:bg-slate-700/80 text-[9px] font-black uppercase tracking-wider text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95 flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-1 lg:gap-2 px-2 lg:px-3 ${
                        i<3 ? "border-r lg:border-r-0 lg:border-b border-white/5" : ""
                      }`}>
                      <span className="flex flex-col lg:flex-row items-center gap-1 lg:gap-2 min-w-0">
                        <span className="text-lg leading-none text-slate-200">{REST_ICONS[d]}</span>
                        <span className="truncate text-[8px] lg:text-[9px]">{REST_NAMES[d]}</span>
                      </span>
                      {modoTeclado && <span className="rounded-md bg-violet-500/20 border border-violet-400/30 px-1.5 py-0.5 text-[8px] text-violet-200">{REST_TO_KEY[d]}</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </section>

        {/* ── Right: slots ── */}
        <aside className="w-full xl:w-[420px] flex flex-col bg-slate-900/40 border border-white/10 rounded-3xl p-4 md:p-6 backdrop-blur-md shadow-2xl">
          <div className="mb-4">
            <h2 className="text-white text-md font-black italic tracking-tighter uppercase flex items-center gap-2">
              <BookOpen size={15} className="text-teal-400"/>
              <span>📌 Mis Slots</span>
            </h2>
            <p className="text-[10px] text-slate-500 mt-0.5">Clic para cargar · Doble-clic para renombrar</p>
          </div>

          <div className="flex-1 flex flex-col gap-3 overflow-y-auto slots-scroll pr-1 max-h-[500px] xl:max-h-[700px]">

            {/* Grupo 1: Predefinidos */}
            <div>
              <button onClick={()=>setPredefinedOpen(p=>!p)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 hover:bg-teal-500/18 transition-all mb-2 cursor-pointer select-none">
                <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <BookOpen size={11}/> Ejercicios para Cantantes
                </span>
                {predefinedOpen ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
              </button>
              {predefinedOpen && (
                <div className="flex flex-col gap-1.5 pl-1">
                  {melodiasGuardadas.slice(0,8).map((slot,rawI)=>{
                    const i = rawI;
                    const active = i===melodiaActivaIndex;
                    if (slot) return (
                      <div key={i} onClick={()=>loadMelody(i)} onDoubleClick={()=>renameMelody(i)}
                        className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer select-none transition-all border ${
                          active?"bg-teal-500 border-teal-400 text-slate-950 shadow-[0_0_14px_rgba(20,184,166,0.3)] scale-[1.01]":"bg-white/5 border-white/5 hover:bg-white/10 text-white"}`}>
                        <div className="min-w-0 flex-1">
                          <span className={`text-[8px] font-bold uppercase tracking-wider block ${active?"text-slate-950/70":"text-teal-400"}`}>Slot {i+1}</span>
                          <h3 className="text-xs font-black truncate leading-tight mt-0.5">{slot.nombre}</h3>
                          <span className={`text-[9px] block ${active?"text-slate-950/60":"text-slate-400"}`}>{slot.notas.length} pasos</span>
                        </div>
                        <button onClick={e=>clearSlot(i,e)}
                          className={`w-5 h-5 rounded-lg flex items-center justify-center cursor-pointer select-none transition-all shrink-0 ${
                            active?"bg-slate-950/20 text-slate-950 hover:bg-rose-600 hover:text-white":"bg-black/30 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"}`}>
                          <Trash2 size={10}/>
                        </button>
                      </div>
                    );
                    return (
                      <div key={i} onClick={()=>loadMelody(i)}
                        className={`group flex items-center justify-between p-2.5 rounded-xl border border-dashed border-white/10 hover:border-teal-500/30 transition-all select-none ${
                          melodia.length>0?"cursor-pointer bg-teal-500/5 hover:bg-teal-500/10":"bg-white/[0.01] hover:bg-white/[0.03]"}`}>
                        <div>
                          <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest block">Slot {i+1}</span>
                          <span className="text-xs text-slate-500 italic font-light select-none block mt-0.5">vacío</span>
                        </div>
                        {melodia.length>0 && (
                          <span className="text-[8px] text-teal-400/0 group-hover:text-teal-400 font-bold transition-all uppercase tracking-wider flex items-center gap-0.5 select-none">
                            <Plus size={8}/>Guardar
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
              <button onClick={()=>setUserSlotsOpen(p=>!p)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 hover:bg-violet-500/18 transition-all mb-2 cursor-pointer select-none">
                <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Save size={11}/> Mis Grabaciones
                </span>
                {userSlotsOpen ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
              </button>
              {userSlotsOpen && (
                <div className="flex flex-col gap-1.5 pl-1">
                  {melodiasGuardadas.slice(8).map((slot,rawI)=>{
                    const i = rawI+8;
                    const active = i===melodiaActivaIndex;
                    if (slot) return (
                      <div key={i} onClick={()=>loadMelody(i)} onDoubleClick={()=>renameMelody(i)}
                        className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer select-none transition-all border ${
                          active?"bg-teal-500 border-teal-400 text-slate-950 shadow-[0_0_14px_rgba(20,184,166,0.3)] scale-[1.01]":"bg-white/5 border-white/5 hover:bg-white/10 text-white"}`}>
                        <div className="min-w-0 flex-1">
                          <span className={`text-[8px] font-bold uppercase tracking-wider block ${active?"text-slate-950/70":"text-violet-400"}`}>Slot {i+1}</span>
                          <h3 className="text-xs font-black truncate leading-tight mt-0.5">{slot.nombre}</h3>
                          <span className={`text-[9px] block ${active?"text-slate-950/60":"text-slate-400"}`}>{slot.notas.length} pasos</span>
                        </div>
                        <button onClick={e=>clearSlot(i,e)}
                          className={`w-5 h-5 rounded-lg flex items-center justify-center cursor-pointer select-none transition-all shrink-0 ${
                            active?"bg-slate-950/20 text-slate-950 hover:bg-rose-600 hover:text-white":"bg-black/30 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"}`}>
                          <Trash2 size={10}/>
                        </button>
                      </div>
                    );
                    return (
                      <div key={i} onClick={()=>loadMelody(i)}
                        className={`group flex items-center justify-between p-2.5 rounded-xl border border-dashed border-white/10 hover:border-violet-500/30 transition-all select-none ${
                          melodia.length>0?"cursor-pointer bg-violet-500/5 hover:bg-violet-500/10":"bg-white/[0.01] hover:bg-white/[0.03]"}`}>
                        <div>
                          <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest block">Slot {i+1}</span>
                          <span className="text-xs text-slate-500 italic font-light select-none block mt-0.5">vacío</span>
                        </div>
                        {melodia.length>0 && (
                          <span className="text-[8px] text-violet-400/0 group-hover:text-violet-400 font-bold transition-all uppercase tracking-wider flex items-center gap-0.5 select-none">
                            <Plus size={8}/>Guardar
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
          from { opacity:0; transform:translateY(5px) scale(0.95); }
          to   { opacity:1; transform:translateY(0)   scale(1);    }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
        .slots-scroll::-webkit-scrollbar { width: 3px; }
        .slots-scroll::-webkit-scrollbar-track { background: transparent; }
        .slots-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 99px; }
        .slots-scroll::-webkit-scrollbar-thumb:hover { background: rgba(20,184,166,0.4); }
      `}</style>
    </div>
  );
}
