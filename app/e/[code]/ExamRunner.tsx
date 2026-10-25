"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Clock, FileCheck2, Play } from "lucide-react";
import { unlockAudio } from "@/app/components/notePlayer";
import { formatGrade, gradeOf } from "@/lib/exams/check";
import type { PublicQuestion } from "@/lib/exams/types";
// Solo el tipo: el runner es de servidor.
import type { ExamView } from "@/lib/exams/runner";
import ExamPrompt from "./ExamPrompt";
import ExamInputView from "./ExamInputs";
import { answerExam, startExam } from "./actions";

export interface ExamCover {
  title: string;
  creatorName: string;
  questionCount: number;
  /** Cerrado y sin empezar: ya no se puede hacer. */
  closed: boolean;
}

const seconds = (ms: number) => Math.max(0, Math.ceil(ms / 1000));

/**
 * Una pregunta. Va con `key` por pregunta, así que todo lo de aquí dentro
 * (el reloj, lo que lleva contestado) empieza de cero en cada una.
 */
const QuestionScreen = ({
  code,
  question,
  busy,
  onAnswer,
}: {
  code: string;
  question: PublicQuestion;
  busy: boolean;
  onAnswer: (position: number, given: string | string[] | number[] | null) => void;
}) => {
  // El reloj de pantalla es solo para mirar: quien decide si llega a tiempo es
  // el servidor. Se cuenta desde lo que el servidor dice que queda.
  const deadline = useRef<number | null>(null);
  const [left, setLeft] = useState(question.remainingMs);
  const sent = useRef(false);
  const [answered, setAnswered] = useState(false);

  const submit = useCallback(
    (given: string | string[] | number[] | null) => {
      if (sent.current) return;
      sent.current = true;
      setAnswered(true);
      onAnswer(question.index, given);
    },
    [onAnswer, question.index],
  );

  useEffect(() => {
    deadline.current = performance.now() + question.remainingMs;
    const timer = window.setInterval(() => {
      const remaining = (deadline.current ?? 0) - performance.now();
      setLeft(remaining);
      if (remaining <= 0) {
        window.clearInterval(timer);
        submit(null);
      }
    }, 200);
    return () => window.clearInterval(timer);
  }, [question.remainingMs, submit]);

  const fraction = Math.max(0, Math.min(1, left / question.limitMs));
  const urgent = left < 5000;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-5 flex items-center gap-3">
        <span className="text-sm font-black tabular-nums text-white">
          {question.index + 1}/{question.total}
        </span>
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <span
            className={`block h-full rounded-full transition-[width] duration-200 ${urgent ? "bg-rose-400" : "bg-amber-300"}`}
            style={{ width: `${fraction * 100}%` }}
          />
        </span>
        <span
          className={`flex items-center gap-1 text-sm font-black tabular-nums ${urgent ? "text-rose-300" : "text-white/70"}`}
        >
          <Clock size={14} />
          {seconds(left)} s
        </span>
      </div>

      <h1
        className="mb-6 text-balance text-center text-2xl font-black italic uppercase leading-tight tracking-tighter text-white md:text-3xl"
        style={{ fontFamily: "Chaney, sans-serif" }}
      >
        <span className="normal-case">{question.title}</span>
      </h1>

      <div className="mb-7">
        <ExamPrompt parts={question.prompt} imageSrc={`/e/${code}/imagen?p=${question.index}`} />
      </div>

      <ExamInputView input={question.input} onSubmit={submit} disabled={busy || answered} />
    </div>
  );
};

export default function ExamRunner({
  code,
  cover,
  initialView,
}: {
  code: string;
  cover: ExamCover;
  /** null = todavía no lo ha empezado: se enseña la portada. */
  initialView: ExamView | null;
}) {
  const [view, setView] = useState<ExamView | null>(initialView);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const start = () => {
    // Lo primero, dentro del clic: si no, iOS no deja sonar los de oído.
    unlockAudio();
    setError(null);
    startTransition(async () => {
      const result = await startExam(code);
      if (result.ok) setView(result.view);
      else setError(result.error);
    });
  };

  const onAnswer = useCallback(
    (position: number, given: string | string[] | number[] | null) => {
      setError(null);
      startTransition(async () => {
        const result = await answerExam(code, position, given);
        if (result.ok) setView(result.view);
        else setError(result.error);
      });
    },
    [code],
  );

  if (!view) {
    return (
      <div className="mx-auto w-full max-w-lg">
        <section className="rounded-[2rem] border border-white/10 bg-slate-950/75 p-7 text-center shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl md:p-9">
          <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-amber-300/25 bg-amber-400/10">
            <FileCheck2 size={24} strokeWidth={1.75} className="text-amber-300" />
          </span>
          <h1 className="text-balance text-2xl font-black italic tracking-tight text-white md:text-3xl">{cover.title}</h1>
          <p className="mt-2 text-sm text-white/60">Creado por {cover.creatorName}</p>
          <p className="mt-1 text-sm font-bold text-white/80">
            {cover.questionCount} {cover.questionCount === 1 ? "pregunta" : "preguntas"}
          </p>

          <ul className="mx-auto mt-6 max-w-xs space-y-1.5 text-left text-xs leading-5 text-white/55">
            <li>· Una pregunta cada vez, con su tiempo. Si se acaba, cuenta como fallo.</li>
            <li>· No se corrige hasta el final, y no se puede volver atrás.</li>
            <li>· Un solo intento. Si se te cierra, sigues donde ibas.</li>
          </ul>

          {cover.closed ? (
            <p className="mt-7 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white/70">
              Este examen ya está cerrado.
            </p>
          ) : (
            <button
              type="button"
              onClick={start}
              disabled={pending}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 py-3.5 text-xs font-black uppercase tracking-[0.2em] text-slate-950 transition hover:bg-amber-300 disabled:opacity-60"
            >
              <Play size={15} />
              {pending ? "Preparando…" : "Empezar"}
            </button>
          )}
          {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
        </section>
      </div>
    );
  }

  if (view.phase === "done") {
    const grade = gradeOf(view.correct, view.total);
    return (
      <div className="mx-auto w-full max-w-lg">
        <section className="rounded-[2rem] border border-white/10 bg-slate-950/75 p-8 text-center shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">{cover.title}</p>
          <p className="mt-4 text-6xl font-black tabular-nums text-amber-300">{formatGrade(grade)}</p>
          <p className="mt-1 text-sm text-white/60">sobre 10</p>
          <p className="mt-4 text-sm text-white/75">
            {view.correct} de {view.total} bien
          </p>
          <Link
            href="/examenes"
            className="mt-7 flex w-full items-center justify-center rounded-2xl border border-white/10 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/60 transition hover:border-white/25 hover:text-white"
          >
            Mis exámenes
          </Link>
        </section>
      </div>
    );
  }

  return (
    <>
      <QuestionScreen key={view.question.index} code={code} question={view.question} busy={pending} onAnswer={onAnswer} />
      {error && (
        <div className="mx-auto mt-5 max-w-md rounded-2xl border border-rose-300/30 bg-rose-500/10 p-3 text-center text-sm text-rose-200">
          {error}{" "}
          <button type="button" onClick={() => window.location.reload()} className="font-bold underline">
            Recargar
          </button>
        </div>
      )}
    </>
  );
}
