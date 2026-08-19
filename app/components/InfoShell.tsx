import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Backdrop from "./Backdrop";
import SiteFooter from "./SiteFooter";
import { SITE } from "@/lib/site";

/**
 * Marco de las páginas de información (contacto, sobre, privacidad).
 * A diferencia de AppShell no necesita sesión: son páginas públicas.
 */
export default function InfoShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans text-white">
      <Backdrop />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="px-3 pt-3 md:px-4 md:pt-4">
          <nav className="mx-auto flex max-w-4xl items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 shadow-2xl backdrop-blur-xl md:px-4 md:py-3">
            <Link href="/" className="flex min-w-0 items-center gap-2 md:gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/logo21stCM_no_white_1.png"
                className="h-9 w-auto flex-shrink-0 md:h-11"
                alt={SITE.name}
              />
              <span
                className="truncate text-sm font-black italic tracking-tighter text-white md:text-lg"
                style={{ fontFamily: "Chaney, sans-serif" }}
              >
                {SITE.name}
              </span>
            </Link>

            <Link
              href="/"
              className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/60 transition hover:border-amber-300/40 hover:text-white"
            >
              <ArrowLeft size={13} />
              <span className="hidden sm:inline">Volver</span>
            </Link>
          </nav>
        </header>

        <main className="flex-1 px-3 py-8 md:px-6 md:py-12">
          <article className="mx-auto max-w-3xl">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.35em] text-amber-300">
              {eyebrow}
            </p>
            <h1 className="text-3xl font-black italic tracking-tight md:text-5xl">{title}</h1>
            {intro && <p className="mt-3 text-sm leading-6 text-white/55">{intro}</p>}

            <div className="mt-8 space-y-4">{children}</div>
          </article>
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}

/** Bloque de contenido dentro de una página de información. */
export function InfoSection({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-black/45 p-5 md:p-7">
      {title && (
        <h2 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-amber-200">
          {title}
        </h2>
      )}
      <div className="space-y-3 text-sm leading-6 text-white/70">{children}</div>
    </section>
  );
}
