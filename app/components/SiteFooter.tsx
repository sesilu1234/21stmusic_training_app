import { Fragment } from "react";
import Link from "next/link";
import { FOOTER_LINKS, SITE } from "@/lib/site";

/** Pie común: enlaces legales + enlace a la web de la academia. */
export default function SiteFooter({ className = "" }: { className?: string }) {
  return (
    <footer className={`px-4 pb-6 pt-8 md:pt-7 ${className}`}>
      {/* Rayita corta centrada: sin ella el pie se pegaba al contenido y no
          se leía como una sección aparte. */}
      <div
        aria-hidden
        className="mx-auto mb-6 h-px w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent md:mb-5"
      />

      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 text-center md:gap-2.5">
        <nav className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45 md:gap-y-1">
          {FOOTER_LINKS.map((link, index) => (
            <Fragment key={link.href}>
              {index > 0 && <span aria-hidden className="text-white/15">·</span>}
              <Link href={link.href} className="transition-colors hover:text-amber-300">
                {link.label}
              </Link>
            </Fragment>
          ))}

          <span aria-hidden className="hidden text-white/15 md:inline">·</span>

          {/* En móvil salta a su propia línea: apretado entre los legales se leía mal. */}
          <a
            href={SITE.academyUrl}
            target="_blank"
            rel="noreferrer"
            className="basis-full py-1 text-amber-300/75 transition-colors hover:text-amber-300 md:basis-auto md:py-0"
          >
            {SITE.academyName}
          </a>
        </nav>

        <p className="text-[8px] uppercase tracking-[0.4em] text-white/25">
          © 2026 {SITE.name}
        </p>
      </div>
    </footer>
  );
}
