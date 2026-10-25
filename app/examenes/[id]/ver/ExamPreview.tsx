"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Eye, RotateCcw, X } from "lucide-react";
import { unlockAudio } from "@/app/components/notePlayer";
import { describeGiven, formatGrade, gradeOf, isCorrect } from "@/lib/exams/check";
import type { ExamQuestion, GivenAnswer } from "@/lib/exams/types";
import ExamPrompt from "@/app/e/[code]/ExamPrompt";
import ExamInputView from "@/app/e/[code]/ExamInputs";

/**
 * El examen visto por su creador: las mismas preguntas y pantallas que verán
 * los alumnos, pero sin reloj, sin guardar nada y tantas veces como quiera.
 * Aquí se corrige en el navegador, porque quien mira ya tiene las respuestas.
 */
export default function ExamPreview({
  examId,
  title,
  questions,
}: {
  examId: string;
  title: string;
  questions: ExamQuestion[];
}) {
  const [phase, setPhase] = useState<"intro" | "playing" | "done">("intro");
  const [round, setRound] = useState(0);
  const [index, setIndex] = useState(0);
  const [givens, setGivens] = useState<GivenAnswer[]>([]);

  const start = () => {
    // Dentro del clic, para que suenen los de oído en iOS.
    unlockAudio();
    setGivens([]);
    setIndex(0);
    setRound(round + 1);
    setPhase("playing");
  };

  const submit = (given: GivenAnswer) => {
    const next = [...givens, given];
    setGivens(next);
    if (index + 1 >= questions.length) setPhase("done");
    else setIndex(index + 1);
  };

  const back = (
    <Link
      href={`/examenes/${examId}`}
      className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-white/55 transition hover:text-white"
    >
      <ArrowLeft size={14} />
      Resultados
    </Link>
  );

  if (phase === "intro") {
    return (
      <div className="mx-auto w-full max-w-lg">
        {back}
        <section className="rounded-[2rem] border border-white/10 bg-slate-950/75 p-7 text-center shadow-2xl md:p-9">
          <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-amber-300/25 bg-amber-400/10">
            <Eye size={24} strokeWidth={1.75} className="text-amber-300" />
          </span>
          <h1 className="text-balance text-2xl font-black italic tracking-tight text-white md:text-3xl">{title}</h1>
          <p className="mt-2 text-sm font-bold text-white/80">
            {questions.length} {questions.length === 1 ? "pregunta" : "preguntas"}
          </p>
          <p className="mx-auto mt-4 max-w-xs text-xs leading-5 text-white/55">
            Tal y como lo verán, pero sin tiempo y sin guardar nada. Puedes hacerlo las veces que quieras.
          </p>
          <button
            type="button"
            onClick={start}
            className="mt-7 w-full rounded-2xl bg-amber-400 py-3.5 text-xs font-black uppercase tracking-[0.2em] text-slate-950 transition hover:bg-amber-300"
          >
            Empezar
          </button>
        </section>
      </div>
    );
  }

  if (phase === "done") {
    const results = questions.map((question, i) => ({ question, given: givens[i] ?? null }));
    const correct = results.filter(({ question, given }) => isCorrect(question, given)).length;
    return (
      <div className="mx-auto w-full max-w-2xl">
        {back}
        <section className="rounded-[2rem] border border-white/10 bg-slate-950/75 p-7 text-center shadow-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">{title}</p>
          <p className="mt-3 text-5xl font-black tabular-nums text-amber-300">
            {formatGrade(gradeOf(correct, questions.length))}
          </p>
          <p className="mt-1 text-sm text-white/60">
            {correct} de {questions.length} bien
          </p>
          <button
            type="button"
            onClick={start}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-950 transition hover:bg-amber-300"
          >
            <RotateCcw size={14} />
            Otra vez
          </button>
        </section>

        <ol className="mt-4 space-y-1.5">
          {results.map(({ question, given }, i) => {
            const right = isCorrect(question, given);
            return (
              <li
                key={i}
                className={`flex gap-2.5 rounded-xl border px-3 py-2 text-xs ${
                  right ? "border-emerald-400/30 bg-emerald-500/10" : "border-rose-400/30 bg-rose-500/10"
                }`}
              >
                <span className={`mt-0.5 flex-shrink-0 ${right ? "text-emerald-300" : "text-rose-300"}`}>
                  {right ? <Check size={14} /> : <X size={14} />}
                </span>
                <span className="min-w-0">
                  <span className="block text-white/80">
                    {i + 1}. {question.summary}
                  </span>
                  <span className="mt-0.5 block text-white/60">
                    Contestaste: <span className="font-bold text-white">{describeGiven(question, given)}</span>
                    {!right && (
                      <>
                        {" · "}Era: <span className="font-bold text-emerald-200">{question.solution}</span>
                      </>
                    )}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  const question = questions[index];
  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-5 flex items-center gap-3">
        <span className="text-sm font-black tabular-nums text-white">
          {index + 1}/{questions.length}
        </span>
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <span
            className="block h-full rounded-full bg-amber-300/60"
            style={{ width: `${((index + 1) / questions.length) * 100}%` }}
          />
        </span>
        <span className="text-xs font-bold text-white/50">Sin tiempo</span>
        <button
          type="button"
          onClick={() => submit(null)}
          className="text-xs font-bold text-white/50 underline-offset-2 transition hover:text-white hover:underline"
        >
          Saltar
        </button>
      </div>

      <h1
        className="mb-6 text-balance text-center text-2xl font-black italic uppercase leading-tight tracking-tighter text-white md:text-3xl"
        style={{ fontFamily: "Chaney, sans-serif" }}
      >
        <span className="normal-case">{question.title}</span>
      </h1>

      {/* La clave cambia en cada pregunta y en cada vuelta: así todo lo de
          dentro (teclas pulsadas, la partitura del ritmo) empieza de cero. */}
      <div key={`${round}-${index}`}>
        <div className="mb-7">
          <ExamPrompt parts={question.prompt} imageSrc="" />
        </div>
        <ExamInputView input={question.input} onSubmit={submit} disabled={false} />
      </div>
    </div>
  );
}
