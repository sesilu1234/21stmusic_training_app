"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Check } from "lucide-react";
import { sendContactMessage } from "./actions";
import TopicSelect from "./TopicSelect";
import LoadingBars from "@/app/components/LoadingBars";
import {
  CONTACT_LIMITS,
  CONTACT_TOPICS,
  initialContactState,
  isContactTopic,
  type ContactState,
  type ContactTopic,
} from "@/lib/contact";

/** Rótulos: pixel, diminutos y en versales. */
const PIXEL = { fontFamily: "var(--font-pixel), monospace" };
/**
 * Lo que se escribe: la monoespaciada que hace pareja con Silkscreen.
 *
 * Hay que ponérselo a cada `input`, `select` y `textarea` uno por uno. Los
 * controles de formulario NO heredan `font-family` del padre: el navegador les
 * mete la suya y se queda ahí por mucho que el `<form>` diga otra cosa. Ponerlo
 * solo en el formulario es el motivo de que antes salieran con la fuente fea
 * por defecto.
 */
const MONO = { fontFamily: "var(--font-pixel-body), ui-monospace, monospace" };

/**
 * Campos con la esquina redondeada y borde de un píxel. El acento va en el
 * foco: el borde se pone ámbar y el fondo sube un punto. Poco relleno, que es
 * lo que mantiene la página en una sola pantalla.
 */
const FIELD =
  "w-full rounded-lg border border-white/15 bg-white/[0.03] px-2.5 py-1.5 text-[13px] text-white transition-colors placeholder:text-white/25 focus:border-amber-300 focus:bg-white/[0.06] focus:outline-none";

const Label = ({ children }: { children: React.ReactNode }) => (
  <span
    className="mb-1 block text-[8px] uppercase tracking-[0.2em] text-white/40"
    style={PIXEL}
  >
    {children}
  </span>
);

export default function ContactForm() {
  const [state, formAction, pending] = useActionState(sendContactMessage, initialContactState);

  // Se guarda el estado ya "leído" para poder volver al formulario. Como cada
  // envío devuelve un objeto nuevo, un éxito posterior vuelve a confirmarse.
  const [dismissed, setDismissed] = useState<ContactState | null>(null);
  const [round, setRound] = useState(0);
  const [length, setLength] = useState(0);

  if (state.status === "ok" && state !== dismissed) {
    return (
      <div className="rise-in flex flex-col items-center py-8 text-center" style={MONO}>
        <span className="mb-3 grid h-9 w-9 place-items-center rounded-full border border-emerald-300/40 bg-emerald-400/10">
          <Check size={17} className="text-emerald-300" strokeWidth={2.5} />
        </span>
        <p className="text-xs uppercase tracking-[0.16em] text-white" style={PIXEL}>
          Enviado
        </p>
        <p className="mt-1.5 text-[11px] text-white/45">Te contestamos a ese correo.</p>
        <button
          type="button"
          onClick={() => {
            setDismissed(state);
            setRound((value) => value + 1);
            setLength(0);
          }}
          className="mt-4 text-[8px] uppercase tracking-[0.2em] text-white/35 underline-offset-4 transition hover:text-amber-300 hover:underline"
          style={PIXEL}
        >
          Escribir otro
        </button>
      </div>
    );
  }

  const remaining = CONTACT_LIMITS.message.max - length;

  return (
    <form key={round} action={formAction} className="space-y-2.5" style={MONO}>
      {/* Motivo y email en la misma fila a partir de 380px: son los dos campos
          cortos, y ponerlos uno debajo de otro gastaba una línea entera de alto
          para nada. */}
      <div className="grid gap-2.5 min-[380px]:grid-cols-2">
        <div>
          <Label>Motivo</Label>
          <TopicSelect
            defaultValue={
              isContactTopic(state.values?.topic ?? "")
                ? (state.values!.topic as ContactTopic)
                : CONTACT_TOPICS[0]
            }
          />
        </div>

        <div>
          <Label>Email</Label>
          <input
            name="email"
            type="email"
            required
            maxLength={CONTACT_LIMITS.email.max}
            autoComplete="email"
            placeholder="tu@correo.com"
            defaultValue={state.values?.email}
            style={MONO}
            className={FIELD}
          />
        </div>
      </div>

      <div>
        <Label>Mensaje</Label>
        <div className="relative">
          <textarea
            name="message"
            required
            rows={3}
            minLength={CONTACT_LIMITS.message.min}
            maxLength={CONTACT_LIMITS.message.max}
            defaultValue={state.values?.message}
            onChange={(event) => setLength(event.target.value.length)}
            placeholder="Cuéntanos"
            style={MONO}
            className={`${FIELD} resize-none pb-5 leading-5`}
          />
          <span
            className={`pointer-events-none absolute bottom-1.5 right-2 text-[9px] tabular-nums ${
              remaining < 80 ? "text-amber-300/70" : "text-white/20"
            }`}
          >
            {remaining}
          </span>
        </div>
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
        <p className="flex items-start gap-1.5 text-[11px] leading-4 text-rose-300">
          <AlertCircle size={13} className="mt-px flex-shrink-0" />
          {state.error}
        </p>
      )}

      {/* La sombra dura se recoge al pulsar y el botón baja a ocupar su sitio:
          el mismo gesto de una tecla, sin animación ninguna. */}
      <button
        type="submit"
        disabled={pending}
        style={PIXEL}
        className="w-full rounded-lg border border-amber-300 bg-amber-400 px-4 py-2.5 text-[9px] uppercase tracking-[0.2em] text-slate-950 shadow-[3px_3px_0_0_rgba(251,191,36,0.25)] transition-all hover:bg-amber-300 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:opacity-60"
      >
        {pending ? (
          <span className="inline-flex items-center justify-center gap-2">
            <LoadingBars className="h-2.5" label="Enviando" />
            Enviando
          </span>
        ) : (
          "Enviar"
        )}
      </button>
    </form>
  );
}
