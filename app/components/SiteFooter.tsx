import { Fragment } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { FOOTER_LINKS, SITE } from "@/lib/site";

/** Pie común: enlaces legales + enlace a la web de la academia. */
export default function SiteFooter({ className = "" }: { className?: string }) {
  return (
    <footer className={`px-4 py-6 ${className}`}>
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2.5 text-center">
        <nav className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
          {FOOTER_LINKS.map((link, index) => (
            <Fragment key={link.href}>
              {index > 0 && <span aria-hidden className="text-white/15">·</span>}
              <Link href={link.href} className="transition-colors hover:text-amber-300">
                {link.label}
              </Link>
            </Fragment>
          ))}

          <span aria-hidden className="text-white/15">·</span>

          <a
            href={SITE.academyUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-amber-300/75 transition-colors hover:text-amber-300"
          >
            {SITE.academyName}
            <ExternalLink size={10} />
          </a>
        </nav>

        <p className="text-[8px] uppercase tracking-[0.4em] text-white/25">
          © 2026 {SITE.name}
        </p>
      </div>
    </footer>
  );
}
