"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { findStudents, type Match } from "./actions";

/**
 * El buscador de alumnos: se escribe y el desplegable aparece solo.
 *
 * Antes era un formulario con su botón de Buscar, y para un panel que se usa
 * de pasada eran dos gestos de más. Aquí no hay que enviar nada.
 *
 * Al elegir a alguien se navega a `?alumno=…` en vez de traerse el progreso
 * por la acción de servidor. Así la ficha la sigue pintando el servidor de una
 * pieza, y la dirección que queda en la barra se puede recargar y guardar —
 * que es lo que hará el profesor que consulta siempre a los mismos.
 */
export default function StudentSearch({
  staffKey,
  selectedEmail,
}: {
  staffKey: string;
  selectedEmail?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  /**
   * Al elegir a alguien se le escribe el nombre entero en el campo, y eso
   * cuenta como escribir: la búsqueda se relanzaba sola y el desplegable
   * volvía a abrirse encima de la ficha que se acababa de pedir. Esta bandera
   * hace que ese cambio concreto no busque nada.
   */
  const skipSearchRef = useRef(false);

  /**
   * Cada tecla dispararía una consulta, así que se espera a que se pare de
   * escribir. 220ms es lo que se tarda entre letra y letra escribiendo del
   * tirón: suficiente para no consultar por cada una, y poco para que el
   * desplegable no se sienta lento.
   */
  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }

    const clean = query.trim();
    if (clean.length < 2) {
      setMatches([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    // `cancelled` es lo que evita que una respuesta lenta de una búsqueda vieja
    // pise a otra más nueva: sin esto, escribir rápido puede acabar enseñando
    // los resultados de un texto que ya no está en el campo.
    let cancelled = false;

    const timer = setTimeout(async () => {
      const found = await findStudents(staffKey, clean);
      if (cancelled) return;
      setMatches(found);
      setActiveIndex(0);
      setIsOpen(true);
      setIsSearching(false);
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, staffKey]);

  // Cerrar al tocar fuera.
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isOpen]);

  const choose = (match: Match) => {
    skipSearchRef.current = true;
    setIsOpen(false);
    setQuery(match.displayName);
    router.push(
      `/alumno?key=${encodeURIComponent(staffKey)}&alumno=${encodeURIComponent(match.email)}`,
    );
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") return setIsOpen(false);
    if (!matches.length) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((i) => (i + step + matches.length) % matches.length);
      setIsOpen(true);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      choose(matches[activeIndex]);
    }
  };

  const showEmpty =
    isOpen && !isSearching && query.trim().length >= 2 && matches.length === 0;

  return (
    <div ref={rootRef} className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
        {isSearching ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Search size={15} />
        )}
      </span>

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => matches.length && setIsOpen(true)}
        onKeyDown={onKeyDown}
        autoFocus
        autoComplete="off"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listId}
        placeholder="Escribe el nombre del alumno"
        className="w-full rounded-2xl border border-white/12 bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-white shadow-inner outline-none transition placeholder:text-white/25 focus:border-amber-300/70 focus:bg-white/[0.07]"
      />

      {(isOpen && matches.length > 0) || showEmpty ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-white/12 bg-slate-950/95 p-1 shadow-[0_24px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl"
        >
          {showEmpty && (
            <li className="px-3 py-2.5 text-xs text-white/35">
              Ningún alumno con «{query.trim()}»
            </li>
          )}

          {matches.map((match, index) => (
            <li key={match.email}>
              <button
                type="button"
                role="option"
                aria-selected={match.email === selectedEmail}
                onClick={() => choose(match)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex w-full items-baseline gap-2.5 rounded-xl px-3 py-2.5 text-left transition ${
                  index === activeIndex ? "bg-white/10" : "hover:bg-white/5"
                }`}
              >
                <span className="text-sm font-bold text-white/90">
                  {match.displayName}
                </span>
                <span className="min-w-0 flex-1 truncate text-[11px] text-white/30">
                  {match.hint}
                </span>
                {!match.isActive && (
                  <span className="flex-shrink-0 text-[9px] uppercase tracking-[0.14em] text-rose-300/70">
                    Baja
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
