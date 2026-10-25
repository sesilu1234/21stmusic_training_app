"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import Staff from "@/app/components/Staff";
import StaffCard from "@/app/components/StaffCard";
import PianoKeyboard, { type KeyMark } from "@/app/components/PianoKeyboard";
import { fretboardFlipClass, useLeftHanded } from "@/lib/handedness";
import { audioContext, playExamAudio } from "@/app/components/notePlayer";
import type { ExamAudio, PromptPart } from "@/lib/exams/types";

/** Botón de escuchar. Suena solo una vez al llegar a la pregunta, y luego cuando se pida. */
const AudioPart = ({ audio }: { audio: ExamAudio }) => {
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<number | null>(null);

  const play = () => {
    const ends = playExamAudio(audio);
    setPlaying(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    // Solo para apagar el botón: el sonido ya va programado en el reloj del audio.
    timerRef.current = window.setTimeout(
      () => setPlaying(false),
      Math.max(0, (ends - audioContext().currentTime) * 1000),
    );
  };

  useEffect(() => {
    // Si el audio está desbloqueado (se pulsó "Empezar"), suena ya. Si se
    // recargó la página, el navegador no deja sonar sin un toque y queda el botón.
    // El setState de `play` solo enciende el botón mientras suena.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (audioContext().state === "running") play();
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <button
      type="button"
      onClick={play}
      className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-xs font-black uppercase tracking-[0.18em] transition ${
        playing
          ? "border-violet-300/70 bg-violet-400/25 text-white"
          : "border-violet-300/30 bg-violet-400/10 text-violet-100 hover:border-violet-300/60 hover:bg-violet-400/20"
      }`}
    >
      <Volume2 size={16} />
      {playing ? "Sonando…" : "Escuchar"}
    </button>
  );
};

const ImagePart = ({ src, fretboard, alt }: { src: string; fretboard?: boolean; alt: string }) => {
  const [leftHanded] = useLeftHanded();
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="flex h-40 w-full max-w-md items-center justify-center overflow-hidden rounded-[2rem] border-4 border-white bg-white shadow-2xl md:h-48">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={`max-h-full max-w-full object-contain transition-opacity ${
          loaded ? "opacity-100" : "opacity-0"
        } ${fretboard ? fretboardFlipClass(leftHanded) : ""}`}
      />
    </div>
  );
};

export default function ExamPrompt({
  parts,
  imageSrc,
}: {
  parts: PromptPart[];
  /** Dónde pedir la imagen de esta pregunta (nunca su ruta real). */
  imageSrc: string;
}) {
  if (!parts.length) return null;

  return (
    <div className="flex flex-col items-center gap-4">
      {parts.map((part, index) => {
        if (part.type === "text") {
          return (
            <p key={index} className="text-balance text-center text-lg leading-snug text-white/80 md:text-xl">
              {part.lead && <span>{part.lead} </span>}
              {part.strong && <span className="font-black text-amber-300">{part.strong}</span>}
              {part.tail && <span>{part.tail}</span>}
            </p>
          );
        }
        if (part.type === "staff") {
          return (
            <StaffCard key={index}>
              <Staff clef={part.clef} columns={part.columns} head={part.head} label="Pentagrama de la pregunta" />
            </StaffCard>
          );
        }
        if (part.type === "image") {
          // Con `src` solo llega al creador, que ya sabe las respuestas (ver examen).
          return <ImagePart key={index} src={part.src ?? imageSrc} fretboard={part.fretboard} alt={part.alt} />;
        }
        if (part.type === "audio") {
          return <AudioPart key={index} audio={part.audio} />;
        }
        return (
          <div key={index} className="w-full max-w-2xl">
            <PianoKeyboard
              from={part.from}
              octaves={part.octaves}
              marks={part.marks as Record<number, KeyMark>}
              markLabels={false}
              disabled
            />
          </div>
        );
      })}
    </div>
  );
}
