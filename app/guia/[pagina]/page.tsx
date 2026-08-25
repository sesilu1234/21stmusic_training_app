import Link from "next/link";
import { notFound } from "next/navigation";
import { BOOK, childrenOf, findPage } from "../book";

export const generateStaticParams = () =>
  BOOK.map((page) => ({ pagina: page.slug }));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pagina: string }>;
}) {
  const page = findPage((await params).pagina);
  if (!page) return { title: "Guía · 21st Century Music" };
  return {
    title: `${page.title} · Guía · 21st Century Music`,
    description: page.summary,
  };
}

export default async function GuiaPage({
  params,
}: {
  params: Promise<{ pagina: string }>;
}) {
  const page = findPage((await params).pagina);
  if (!page) notFound();

  const children = childrenOf(page);

  return (
    <article>
     <header className={`mb-9 ${!page.number ? 'pt-0 md:pt-4' : ''}`}>
        {page.number && (
          <p className="guide-display mb-3 inline-block rounded-full border border-[rgba(189,147,249,0.35)] bg-[rgba(189,147,249,0.12)] px-2.5 py-1 font-mono text-[0.75rem] tabular-nums text-[var(--guide-accent)]">
            {page.number}
          </p>
        )}
        <h1 className="guide-display text-balance text-[2rem] font-bold leading-[1.15] tracking-tight text-[var(--guide-heading)] md:text-[2.4rem]">
          {page.title}
        </h1>
      </header>

      <div className="space-y-5">{page.body}</div>

      {/* Portadilla de sección: enlaza sus subsecciones. */}
      {children.length > 0 && (
        <nav className="mt-12 border-t border-[var(--guide-rule)] pt-7">
          <h2 className="guide-display mb-4 text-[0.7rem] uppercase tracking-[0.22em] text-[var(--guide-dim)]">
            En este capítulo
          </h2>
          <ol className="space-y-1">
            {children.map((child) => (
              <li key={child.slug}>
                <Link
                  href={`/guia/${child.slug}`}
                  className="group flex gap-3 rounded px-2 py-2 transition-colors hover:bg-[var(--guide-inline)]"
                >
                  <span className="guide-display w-8 flex-shrink-0 font-mono text-[0.8rem] tabular-nums text-[var(--guide-accent)]">
                    {child.number}
                  </span>
                  <span className="min-w-0">
                    <span className="guide-display block text-[0.95rem] text-[var(--guide-heading)]">
                      {child.title}
                    </span>
                    <span className="guide-body mt-0.5 block text-[0.9rem] leading-snug text-[var(--guide-dim)]">
                      {child.summary}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      )}
    </article>
  );
}
