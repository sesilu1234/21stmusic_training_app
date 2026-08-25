import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Piezas de maquetación de la guía. Están aquí sueltas para que el archivo del
 * libro sea solo texto y se pueda escribir sin pelearse con clases de Tailwind.
 */

export const P = ({ children }: { children: ReactNode }) => (
  <p className="guide-body text-[1rem] leading-[1.72] text-[var(--guide-text)]">
    {children}
  </p>
);

export const H2 = ({ children }: { children: ReactNode }) => (
  <h2 className="guide-display !mt-12 !mb-1 flex items-center gap-3 text-[1.2rem] font-bold tracking-tight text-[var(--guide-heading)]">
    <span aria-hidden className="h-5 w-[3px] flex-shrink-0 rounded-full bg-[var(--guide-accent)]" />
    {children}
  </h2>
);

export const UL = ({ children }: { children: ReactNode }) => (
  <ul className="guide-body space-y-2.5 text-[1rem] leading-[1.72] text-[var(--guide-text)]">
    {children}
  </ul>
);

export const LI = ({ children }: { children: ReactNode }) => (
  <li className="flex gap-3">
    <span
      aria-hidden
      className="mt-[0.7em] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--guide-cyan)]"
    />
    <span>{children}</span>
  </li>
);

/**
 * La frase que remata una idea. Naranja y sin negrita: se ve al vuelo cuando
 * repasas sin leerlo todo, que es como se relee una guía.
 */
export const Hi = ({ children }: { children: ReactNode }) => (
  <span className="text-[var(--guide-orange)]">{children}</span>
);

/** Palabra técnica la primera vez que aparece. */
export const T = ({ children }: { children: ReactNode }) => (
  <strong className="font-semibold text-[var(--guide-pink)]">{children}</strong>
);

/** Notas, cifrados y demás: en monoespaciada para que no se lean como texto. */
export const N = ({ children }: { children: ReactNode }) => (
  <code className="rounded-[4px] border border-[var(--guide-rule)] bg-[var(--guide-inline)] px-1.5 py-0.5 font-mono text-[0.85em] text-[var(--guide-pink)]">
    {children}
  </code>
);

export const Callout = ({ title, children }: { title: string; children: ReactNode }) => (
  <aside className="!mt-9 rounded-r-md border-l-[3px] border-[var(--guide-accent)] bg-[rgba(189,147,249,0.07)] px-5 py-4">
    <p className="guide-display mb-1.5 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[var(--guide-accent)]">
      {title}
    </p>
    <div className="guide-body space-y-3 text-[0.95rem] leading-[1.68] text-[var(--guide-muted)]">
      {children}
    </div>
  </aside>
);

/** Enlace al modo de juego con el que se practica lo del capítulo. */
export const Practica = ({ href, children }: { href: string; children: ReactNode }) => (
  <Link
    href={href}
    className="group !mt-9 flex items-center justify-between gap-4 rounded-md border border-[var(--guide-rule)] bg-[rgba(80,250,123,0.05)] px-5 py-4 transition-colors hover:border-[var(--guide-green)]"
  >
    <span>
      <span className="guide-display block text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[var(--guide-green)]">
        Practícalo
      </span>
      <span className="guide-display mt-1 block text-[0.95rem] font-medium text-[var(--guide-heading)]">
        {children}
      </span>
    </span>
    <span
      aria-hidden
      className="text-[var(--guide-green)] transition-transform group-hover:translate-x-1"
    >
      →
    </span>
  </Link>
);

/** Tablita de dos columnas. */
export const Tabla = ({ rows }: { rows: [string, string][] }) => (
  <div className="!mt-7 overflow-x-auto rounded-md border border-[var(--guide-rule)]">
    <table className="w-full min-w-[20rem] border-collapse text-left">
      <tbody>
        {rows.map(([left, right], index) => (
          <tr
            key={left}
            className={index > 0 ? "border-t border-[var(--guide-rule)]" : ""}
          >
            <th
              scope="row"
              className="w-2/5 whitespace-nowrap px-4 py-2.5 font-mono text-[0.85rem] font-medium text-[var(--guide-cyan)]"
            >
              {left}
            </th>
            <td className="guide-body px-4 py-2.5 text-[0.95rem] text-[var(--guide-muted)]">
              {right}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
