"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Check } from "lucide-react";
import { initialContactState, sendContactMessage, type ContactState } from "./actions";
import { CONTACT_LIMITS, CONTACT_TOPICS } from "@/lib/contact";

/** Campos sin caja: solo una línea debajo. Menos ruido y más de papel. */
const FIELD =
  "w-full border-0 border-b border-white/15 bg-transparent px-0 py-3 text-lg text-white transition-colors placeholder:text-white/25 focus:border-amber-300 focus:outline-none";

export default function ContactForm() {
  const [state, formAction, pending] = useActionState(sendContactMessage, initialContactState);

  // Se guarda el estado ya "leído" para poder volver al formulario. Como cada
  // envío devuelve un objeto nuevo, un éxito posterior vuelve a confirmarse.
  const [dismissed, setDismissed] = useState<ContactState | null>(null);
  const [round, setRound] = useState(0);
  const [length, setLength] = useState(0);

  if (state.status === "ok" && state !== dismissed) {
    return (
      <div className="rise-in py-10">
        <span className="mb-6 grid h-11 w-11 place-items-center rounded-full bg-emerald-400/15">
          <Check size={20} className="text-emerald-300" strokeWidth={2.5} />
        </span>
        <p
          className="text-3xl italic text-white"
          style={{ fontFamily: "var(--font-info-display), Georgia, serif" }}
        >
          Enviado
        </p>
        <p className="mt-2 text-lg text-white/50">Te contestamos a ese correo.</p>
        <button
          type="button"
          onClick={() => {
            setDismissed(state);
            setRound((value) => value + 1);
            setLength(0);
          }}
          className="mt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-white/35 underline-offset-4 transition hover:text-amber-300 hover:underline"
        >
          Escribir otro
        </button>
      </div>
    );
  }

  const remaining = CONTACT_LIMITS.message.max - length;

  return (
    <form key={round} action={formAction} className="space-y-9">
      {/* --- Motivo ---------------------------------------------------- */}
      {/*
        Radios de verdad, no un `select` ni estado de React: así el motivo viaja
        en el FormData solo, funciona sin JavaScript y el teclado lo recorre como
        un grupo. Lo que se ve es el `span`; el `input` está oculto pero sigue
        ahí, y `peer-checked` lo pinta. Sin una sola línea de lógica.
      */}
      <fieldset>
        <legend className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-white/35">
          Motivo
        </legend>
        <div className="flex flex-wrap gap-2">
          {CONTACT_TOPICS.map((topic) => (
            <label key={topic} className="cursor-pointer">
              <input
                type="radio"
                name="topic"
                value={topic}
                defaultChecked={(state.values?.topic ?? CONTACT_TOPICS[0]) === topic}
                className="peer sr-only"
              />
              <span className="block rounded-full border border-white/15 px-4 py-2 text-sm text-white/55 transition-colors hover:border-white/30 hover:text-white/80 peer-checked:border-amber-300 peer-checked:bg-amber-300 peer-checked:text-slate-950 peer-focus-visible:ring-2 peer-focus-visible:ring-amber-300/60">
                {topic}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <input
        name="email"
        type="email"
        required
        maxLength={CONTACT_LIMITS.email.max}
        autoComplete="email"
        placeholder="Tu correo"
        defaultValue={state.values?.email}
        className={FIELD}
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
          placeholder="Cuéntanos"
          className={`${FIELD} resize-none leading-8`}
        />
        <span
          className={`pointer-events-none absolute -bottom-6 right-0 text-[11px] tabular-nums ${
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
        <p className="flex items-start gap-2 text-sm leading-6 text-rose-300">
          <AlertCircle size={15} className="mt-1 flex-shrink-0" />
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300 underline-offset-8 transition hover:underline disabled:cursor-wait disabled:opacity-50"
      >
        {pending ? "Enviando…" : "Enviar →"}
      </button>
    </form>
  );
}
