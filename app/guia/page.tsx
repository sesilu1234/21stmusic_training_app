import Link from "next/link";
import { BOOK } from "./book";

export default function GuiaIndexPage() {
  return (
    <div className="pt-0 md:pt-5">
      <p className="guide-display mb-3 text-[0.7rem] uppercase tracking-[0.22em] text-[var(--guide-pink)]">
        21st Century Music
      </p>
      <h1 className="guide-display text-balance text-[2.5rem] font-bold leading-[1.1] tracking-tight text-[var(--guide-heading)] md:text-[3rem]">
        Teoría musical
      </h1>
      <p className="guide-body mt-5 text-[1.125rem] leading-[1.7] text-[var(--guide-muted)]">
        Una guía para los alumnos de la escuela: de cómo se llaman las notas a por
        qué cuatro acordes seguidos suenan a canción. Sin dar nada por sabido.
      </p>

      <div className="mt-12 border-t border-[var(--guide-rule)] pt-8">
        <h2 className="guide-display mb-5 text-[0.7rem] uppercase tracking-[0.22em] text-[var(--guide-dim)]">
          Índice
        </h2>

        <ol className="space-y-1">
          {BOOK.map((page) => (
            <li key={page.slug}>
              <Link
                href={`/guia/${page.slug}`}
                className={`group flex gap-3 rounded px-2 py-2 transition-colors hover:bg-[var(--guide-inline)] ${
                  page.level === 1 ? "pl-8" : ""
                }`}
              >
                <span
                  className={`guide-display w-8 flex-shrink-0 font-mono text-[0.8rem] tabular-nums ${
                    page.level === 0 ? "text-[var(--guide-accent)]" : "text-[var(--guide-dim)]"
                  }`}
                >
                  {page.number ?? ""}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`guide-display block text-[0.95rem] text-[var(--guide-heading)] ${
                      page.level === 0 ? "font-medium" : ""
                    }`}
                  >
                    {page.title}
                  </span>
                  <span className="guide-body mt-0.5 block text-[0.9rem] leading-snug text-[var(--guide-dim)]">
                    {page.summary}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
