"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { CONTACT_TOPICS, type ContactTopic } from "@/lib/contact";

/**
 * Desplegable propio, no un `<select>`.
 *
 * La lista que abre un `select` nativo la dibuja el sistema operativo, no la
 * página: `border-radius`, márgenes y colores no le llegan. Se puede maquillar
 * el campo cerrado y nada más. Como aquí hacía falta que la lista saliera
 * redondeada y separada del campo, no hay más remedio que pintarla a mano.
 *
 * Lo que se pierde: el `select` nativo funcionaba sin JavaScript y en el móvil
 * abría la ruedecilla del sistema. Aquí no. A cambio, el valor sigue viajando en
 * el FormData por el `input` oculto, así que la acción de servidor no se entera
 * del cambio y la validación del motivo sigue siendo la misma.
 */
/**
 * `button` es un control de formulario, y esos no heredan `font-family` del
 * padre: si no se les dice, el navegador les pone la suya. Por eso va explícito
 * aquí y no en el formulario de fuera.
 */
const MONO = { fontFamily: "var(--font-pixel-body), ui-monospace, monospace" };

export default function TopicSelect({ defaultValue }: { defaultValue: ContactTopic }) {
  const [value, setValue] = useState<ContactTopic>(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  // Cuál está resaltado con el teclado. No es lo mismo que el elegido: se puede
  // recorrer la lista con las flechas sin llegar a confirmar nada.
  const [activeIndex, setActiveIndex] = useState(() => CONTACT_TOPICS.indexOf(defaultValue));
  const rootRef = useRef<HTMLDivElement>(null);
  // El lector de pantalla necesita saber qué lista abre este botón, y el id
  // tiene que coincidir entre servidor y cliente: de eso se encarga `useId`.
  const listId = useId();

  // Cerrar al tocar fuera. `pointerdown` y no `click` para que se cierre al
  // empezar el gesto, que es cuando el usuario ya ha decidido irse.
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isOpen]);

  const choose = (topic: ContactTopic) => {
    setValue(topic);
    setActiveIndex(CONTACT_TOPICS.indexOf(topic));
    setIsOpen(false);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") return setIsOpen(false);

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) return setIsOpen(true);
      const step = event.key === "ArrowDown" ? 1 : -1;
      // Da la vuelta por los dos extremos: sumar la longitud evita el -1.
      setActiveIndex((i) => (i + step + CONTACT_TOPICS.length) % CONTACT_TOPICS.length);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (isOpen) choose(CONTACT_TOPICS[activeIndex]);
      else setIsOpen(true);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      {/* Lo que de verdad se envía. El botón de arriba es solo la fachada. */}
      <input type="hidden" name="topic" value={value} />

      <button
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-haspopup="listbox"
        aria-label={`Motivo: ${value}`}
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={onKeyDown}
        style={MONO}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border bg-white/[0.03] px-2.5 py-1.5 text-left text-[13px] text-white transition-colors focus:outline-none ${
          isOpen ? "border-amber-300 bg-white/[0.06]" : "border-white/15 hover:border-white/30"
        }`}
      >
        {value}
        <ChevronDown
          size={13}
          aria-hidden
          className={`flex-shrink-0 text-white/40 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        // `mt-1.5` es la separación del campo que faltaba, y `z-20` para que no
        // se meta debajo del campo de email que tiene al lado.
        <ul
          id={listId}
          role="listbox"
          aria-label="Motivo"
          className="absolute left-0 right-0 top-full z-20 mt-1.5 overflow-hidden rounded-xl border border-white/15 bg-slate-950/95 p-1 shadow-[0_18px_40px_rgba(0,0,0,0.55)]"
        >
          {CONTACT_TOPICS.map((topic, index) => {
            const isChosen = topic === value;
            return (
              <li key={topic}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isChosen}
                  onClick={() => choose(topic)}
                  onMouseEnter={() => setActiveIndex(index)}
                  style={MONO}
                  className={`block w-full rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors ${
                    isChosen
                      ? "bg-amber-400 text-slate-950"
                      : index === activeIndex
                        ? "bg-white/10 text-white"
                        : "text-white/65"
                  }`}
                >
                  {topic}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
