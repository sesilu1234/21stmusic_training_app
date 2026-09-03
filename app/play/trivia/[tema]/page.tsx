import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Backdrop from "@/app/components/Backdrop";
import TriviaGame from "../TriviaGame";
import { findTriviaTopic } from "@/lib/trivia";
import { getTriviaRound } from "@/lib/triviaQuestions";

/**
 * Una partida del trivial sobre un tema.
 *
 * Es de servidor a propósito: aquí se eligen las 24 preguntas y se mandan ya
 * hechas al navegador. Así el alumno no se descarga el cuestionario entero — y
 * de paso, tampoco todas las respuestas de las que no le han tocado.
 */

// Cada partida trae preguntas distintas, así que esta página no se puede
// guardar en caché: si se guardara, todo el mundo jugaría la misma.
export const dynamic = "force-dynamic";

export default async function TriviaTemaPage({
  params,
}: {
  params: Promise<{ tema: string }>;
}) {
  const { tema } = await params;
  const topic = findTriviaTopic(tema);
  if (!topic) notFound();

  const questions = await getTriviaRound(topic.slug);

  // Un tema sin preguntas todavía, o Supabase caído. Se dice lo que pasa en vez
  // de enseñar una pantalla en blanco o reventar.
  if (questions.length === 0) {
    return (
      <div className="relative min-h-screen overflow-x-hidden text-white">
        <Backdrop />
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
          <h1 className="text-2xl font-black italic tracking-tight">{topic.title}</h1>
          <p className="max-w-sm text-sm leading-6 text-white/50">
            Este tema todavía no tiene preguntas. Vuelve dentro de un rato.
          </p>
          <Link
            href="/play/trivia"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/60 transition hover:border-amber-300/40 hover:text-white"
          >
            <ArrowLeft size={14} />
            Otros temas
          </Link>
        </div>
      </div>
    );
  }

  return <TriviaGame questions={questions} titulo={topic.title} />;
}
