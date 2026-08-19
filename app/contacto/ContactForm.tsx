"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Check, MessageSquare, Send, User } from "lucide-react";
import { initialContactState, sendContactMessage, type ContactState } from "./actions";
import { CONTACT_LIMITS } from "@/lib/contact";

const fieldClass =
  "flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 transition-colors focus-within:border-amber-300/60 focus-within:bg-white/[0.07]";

const inputClass =
  "w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none";

export default function ContactForm() {
  const [state, formAction, pending] = useActionState(sendContactMessage, initialContactState);

  // Se guarda el objeto de estado ya "leído" para poder volver al formulario.
  // Como cada envío devuelve un objeto nuevo, un éxito posterior vuelve a
  // mostrar la confirmación sin tocar nada más.
  const [dismissed, setDismissed] = useState<ContactState | null>(null);
  const [round, setRound] = useState(0);
  const [length, setLength] = useState(0);

  if (state.status === "ok" && state !== dismissed) {
    return (
      <div className="rise-in rounded-3xl border border-emerald-400/30 bg-emerald-400/[0.07] p-8 text-center">
        <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-emerald-400/15">
          <Check size={26} className="text-emerald-300" strokeWidth={2.5} />
        </span>
        <h2 className="text-xl font-black italic tracking-tight text-white">Mensaje enviado</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/50">
          Lo leemos y te contestamos al correo que nos has dejado. Gracias.
        </p>
        <button
          type="button"
          onClick={() => {
            setDismissed(state);
            setRound((value) => value + 1);
            setLength(0);
          }}
          className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 underline-offset-4 transition hover:text-white hover:underline"
        >
          Escribir otro
        </button>
      </div>
    );
  }

  const values = state.values;

  return (
    <form
      key={round}
      action={formAction}
      className="rounded-3xl border border-white/10 bg-slate-950/55 p-5 backdrop-blur-sm md:p-7"
    >
      <div className="space-y-3">
        <label className={fieldClass}>
          <User size={16} className="flex-shrink-0 text-amber-300/70" />
          <input
            name="name"
            type="text"
            required
            maxLength={CONTACT_LIMITS.name.max}
            autoComplete="name"
            placeholder="Tu nombre"
            defaultValue={values?.name}
            className={inputClass}
          />
        </label>

        <label className={fieldClass}>
          <span className="flex-shrink-0 text-sm text-amber-300/70">@</span>
          <input
            name="email"
            type="email"
            required
            maxLength={CONTACT_LIMITS.email.max}
            autoComplete="email"
            placeholder="Tu correo, para poder contestarte"
            defaultValue={values?.email}
            className={inputClass}
          />
        </label>

        <div className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 transition-colors focus-within:border-amber-300/60 focus-within:bg-white/[0.07]">
          <div className="mb-2 flex items-center gap-3">
            <MessageSquare size={16} className="flex-shrink-0 text-amber-300/70" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
              Tu mensaje
            </span>
          </div>
          <textarea
            name="message"
            required
            rows={6}
            minLength={CONTACT_LIMITS.message.min}
            maxLength={CONTACT_LIMITS.message.max}
            defaultValue={values?.message}
            onChange={(event) => setLength(event.target.value.length)}
            placeholder="Cuéntanos qué necesitas: una duda de un ejercicio, un fallo que has visto, una idea para un modo nuevo…"
            className={`${inputClass} resize-y leading-6`}
          />
          <p className="mt-1 text-right text-[10px] tabular-nums text-white/25">
            {length} / {CONTACT_LIMITS.message.max}
          </p>
        </div>

        {/* Trampa para bots: oculta a la vista y fuera del recorrido de tabulación. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute h-0 w-0 overflow-hidden opacity-0"
        />
      </div>

      {state.status === "error" && state.error && (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-400/10 px-3.5 py-3 text-xs leading-5 text-rose-200">
          <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 py-3.5 text-xs font-black uppercase tracking-widest text-slate-950 transition hover:bg-amber-300 disabled:cursor-wait disabled:opacity-60"
      >
        <Send size={15} className={pending ? "animate-pulse" : ""} />
        {pending ? "Enviando…" : "Enviar mensaje"}
      </button>
    </form>
  );
}
