"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Check, Send } from "lucide-react";
import { initialContactState, sendContactMessage, type ContactState } from "./actions";
import { CONTACT_LIMITS } from "@/lib/contact";

export default function ContactForm() {
  const [state, formAction, pending] = useActionState(sendContactMessage, initialContactState);

  // Se guarda el estado ya "leído" para poder volver al formulario. Como cada
  // envío devuelve un objeto nuevo, un éxito posterior vuelve a confirmarse.
  const [dismissed, setDismissed] = useState<ContactState | null>(null);
  const [round, setRound] = useState(0);
  const [length, setLength] = useState(0);

  if (state.status === "ok" && state !== dismissed) {
    return (
      <div className="rise-in flex flex-col items-center py-6 text-center">
        <span className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-emerald-400/15">
          <Check size={22} className="text-emerald-300" strokeWidth={2.5} />
        </span>
        <p className="text-base font-black italic tracking-tight text-white">Enviado</p>
        <p className="mt-1.5 text-xs leading-5 text-white/45">
          Te contestamos a ese correo.
        </p>
        <button
          type="button"
          onClick={() => {
            setDismissed(state);
            setRound((value) => value + 1);
            setLength(0);
          }}
          className="mt-5 text-[10px] font-black uppercase tracking-[0.2em] text-white/35 underline-offset-4 transition hover:text-white hover:underline"
        >
          Escribir otro
        </button>
      </div>
    );
  }

  const remaining = CONTACT_LIMITS.message.max - length;

  return (
    <form key={round} action={formAction} className="space-y-2.5">
      <input
        name="email"
        type="email"
        required
        maxLength={CONTACT_LIMITS.email.max}
        autoComplete="email"
        placeholder="tu@correo.com"
        defaultValue={state.values?.email}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition-colors placeholder:text-white/25 focus:border-amber-300/60 focus:bg-white/[0.08] focus:outline-none"
      />

      <div className="relative">
        <textarea
          name="message"
          required
          rows={5}
          minLength={CONTACT_LIMITS.message.min}
          maxLength={CONTACT_LIMITS.message.max}
          defaultValue={state.values?.message}
          onChange={(event) => setLength(event.target.value.length)}
          placeholder="Qué ha pasado, o qué se te ha ocurrido…"
          className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 pb-7 text-sm leading-6 text-white transition-colors placeholder:text-white/25 focus:border-amber-300/60 focus:bg-white/[0.08] focus:outline-none"
        />
        <span
          className={`pointer-events-none absolute bottom-2.5 right-3 text-[10px] tabular-nums ${
            remaining < 80 ? "text-amber-300/70" : "text-white/20"
          }`}
        >
          {remaining}
        </span>
      </div>

      {/* Trampa para bots: oculta a la vista y fuera del recorrido de tabulación. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="pointer-events-none absolute h-0 w-0 opacity-0"
      />

      {state.status === "error" && state.error && (
        <p className="flex items-start gap-2 rounded-xl border border-rose-400/25 bg-rose-400/10 px-3.5 py-2.5 text-xs leading-5 text-rose-200">
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 text-xs font-black uppercase tracking-widest text-slate-950 transition hover:bg-amber-300 disabled:cursor-wait disabled:opacity-60"
      >
        <Send size={14} className={pending ? "animate-pulse" : ""} />
        {pending ? "Enviando…" : "Enviar"}
      </button>
    </form>
  );
}
