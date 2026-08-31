"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Type,
  X,
} from "lucide-react";
import { GUIDE_TYPEFACES, type GuideTypefaceId } from "@/app/fonts";
import { BOOK } from "./book";
import { DEFAULT_THEME, GUIDE_THEMES, isTheme } from "./themes";

const TYPE_KEY = "21st_guide_type";
const THEME_KEY = "21st_guide_theme";
const SIDEBAR_KEY = "21st_guide_sidebar";

/**
 * Marco de la guía, al estilo del libro de Rust: índice fijo a la izquierda,
 * una sola columna de texto a la derecha y fondo plano.
 *
 * Aquí NO va el <Backdrop /> del resto de la app: la montaña y las estrellas
 * están bien para un menú de juegos, pero debajo de dos mil palabras cansan.
 */
export default function GuideShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [typeface, setTypeface] = useState<GuideTypefaceId>("a");
  const [theme, setTheme] = useState(DEFAULT_THEME);
  /** Qué desplegable de la barra está abierto. */
  const [openMenu, setOpenMenu] = useState<"theme" | "type" | null>(null);

  const barRef = useRef<HTMLDivElement>(null);

  // Lo elegido se recuerda en este navegador. Se lee en un efecto porque
  // localStorage no existe en el render del servidor.
  //
  // Un ?tema=navy o ?tipo=b en la URL manda sobre lo guardado, para poder
  // abrir varias versiones en varias pestañas y compararlas.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const typeFromUrl = params.get("tipo");
    const typeStored = window.localStorage.getItem(TYPE_KEY);
    const type = [typeFromUrl, typeStored].find(
      (value) => value && GUIDE_TYPEFACES.some((option) => option.id === value),
    );

    const themeFromUrl = params.get("tema");
    const themeStored = window.localStorage.getItem(THEME_KEY);
    const chosenTheme = [themeFromUrl, themeStored].find(isTheme);

    const sidebarStored = window.localStorage.getItem(SIDEBAR_KEY);

    /* eslint-disable react-hooks/set-state-in-effect */
    if (type) setTypeface(type as GuideTypefaceId);
    if (chosenTheme) setTheme(chosenTheme);
    if (sidebarStored === "closed") setIsSidebarOpen(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Al navegar se cierra lo que hubiera abierto. Se ajusta durante el render
  // en vez de con un efecto: así no hay un frame con el menú abierto ya en la
  // página nueva.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setIsDrawerOpen(false);
    setOpenMenu(null);
  }

  useEffect(() => {
    if (!openMenu) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!barRef.current?.contains(event.target as Node)) setOpenMenu(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenu(null);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openMenu]);

  const chooseTypeface = (id: GuideTypefaceId) => {
    setTypeface(id);
    window.localStorage.setItem(TYPE_KEY, id);
    setOpenMenu(null);
  };

  const chooseTheme = (id: string) => {
    setTheme(id);
    window.localStorage.setItem(THEME_KEY, id);
    setOpenMenu(null);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((open) => {
      window.localStorage.setItem(SIDEBAR_KEY, open ? "closed" : "open");
      return !open;
    });
  };

  const currentIndex = BOOK.findIndex((page) => pathname === `/guia/${page.slug}`);
  const previous = currentIndex > 0 ? BOOK[currentIndex - 1] : null;
  const next =
    currentIndex >= 0 && currentIndex < BOOK.length - 1 ? BOOK[currentIndex + 1] : null;

  const indexList = (
    <nav className="guide-display space-y-px pb-6 text-[0.875rem]">
      <Link
        href="/guia"
        onClick={() => setIsDrawerOpen(false)}
        className={`block rounded px-3 py-1.5 transition-colors ${
          pathname === "/guia"
            ? "bg-[var(--guide-active)] text-[var(--guide-heading)]"
            : "text-[var(--guide-muted)] hover:bg-[var(--guide-inline)] hover:text-[var(--guide-heading)]"
        }`}
      >
        Portada
      </Link>

      {BOOK.map((page, index) => {
        const isCurrent = pathname === `/guia/${page.slug}`;
        // Un poco de aire antes de cada sección numerada nueva.
        const startsSection = page.level === 0 && page.number !== null;
        const previousPage = BOOK[index - 1];
        const needsGap = startsSection && previousPage && previousPage.level === 1;

        return (
          <Link
            key={page.slug}
            href={`/guia/${page.slug}`}
            onClick={() => setIsDrawerOpen(false)}
            className={`relative flex gap-2 rounded px-3 py-1.5 leading-snug transition-colors ${
              needsGap ? "mt-3" : ""
            } ${page.level === 1 ? "pl-7" : ""} ${
              isCurrent
                ? "bg-[var(--guide-active)] font-medium text-[var(--guide-heading)]"
                : page.level === 0
                  ? "text-[var(--guide-text)] hover:bg-[var(--guide-inline)] hover:text-[var(--guide-heading)]"
                  : "text-[var(--guide-muted)] hover:bg-[var(--guide-inline)] hover:text-[var(--guide-heading)]"
            }`}
          >
            {isCurrent && (
              <span
                aria-hidden
                className="absolute inset-y-1 left-0 w-[3px] rounded-full bg-[var(--guide-accent)]"
              />
            )}
            {page.number && (
              <span
                className={`flex-shrink-0 font-mono text-[0.75rem] tabular-nums ${
                  isCurrent ? "text-[var(--guide-accent)]" : "text-[var(--guide-dim)]"
                }`}
              >
                {page.number}.
              </span>
            )}
            <span className="min-w-0">{page.title}</span>
          </Link>
        );
      })}
    </nav>
  );

  const sidebarHeader = (
    <Link
      href="/"
      className="mb-6 flex items-center gap-3.5 border-b border-[var(--guide-rule)] px-2 pb-5"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/logo21stCM_no_white_1-192.png"
        alt="21st Century Music"
        className="h-12 w-auto flex-shrink-0"
      />
      <span className="guide-display flex min-w-0 flex-col">
        <span className="truncate text-[0.85rem] font-semibold leading-tight text-[var(--guide-heading)]">
          21st Century Music
        </span>
        <span className="mt-1.5 truncate text-[0.62rem] uppercase tracking-[0.28em] text-[var(--guide-pink)]">
          La guía
        </span>
      </span>
    </Link>
  );

  const barButton =
    "grid h-8 w-8 place-items-center rounded-md text-[var(--guide-muted)] transition-colors hover:bg-[var(--guide-inline)] hover:text-[var(--guide-heading)]";

  const menuPanel =
    "absolute right-0 top-[calc(100%+0.4rem)] z-50 w-52 overflow-hidden rounded-lg border border-[var(--guide-rule)] bg-[var(--guide-sidebar)] p-1 shadow-[0_16px_40px_rgba(0,0,0,0.45)]";

  const menuRow = (selected: boolean) =>
    `guide-display flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-left text-[0.8rem] transition-colors ${
      selected
        ? "bg-[var(--guide-active)] text-[var(--guide-heading)]"
        : "text-[var(--guide-muted)] hover:bg-[var(--guide-inline)] hover:text-[var(--guide-heading)]"
    }`;

  return (
    <div
      data-theme={theme}
      data-type={typeface}
      className="guide-root min-h-screen text-[var(--guide-text)]"
    >
      {/* Índice de escritorio: fijo, con su propio scroll y plegable. */}
      {isSidebarOpen && (
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[19rem] flex-col border-r border-[var(--guide-rule)] bg-[var(--guide-sidebar)] shadow-[6px_0_24px_rgba(0,0,0,0.28)] lg:flex">
          <div className="flex-shrink-0 px-4 pt-6">{sidebarHeader}</div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4">{indexList}</div>
        </aside>
      )}

      {/* Cajón de móvil. */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar índice"
            onClick={() => setIsDrawerOpen(false)}
            className="absolute inset-0 bg-black/70"
          />
          <div className="absolute inset-y-0 left-0 flex w-[19rem] max-w-[86vw] flex-col border-r border-[var(--guide-rule)] bg-[var(--guide-sidebar)]">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              aria-label="Cerrar índice"
              className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded text-[var(--guide-muted)] transition-colors hover:text-[var(--guide-heading)]"
            >
              <X size={16} />
            </button>
            <div className="flex-shrink-0 px-4 pt-6">{sidebarHeader}</div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4">{indexList}</div>
          </div>
        </div>
      )}

      <div className={isSidebarOpen ? "lg:pl-[19rem]" : ""}>
        {/* Barra de herramientas: plegar a la izquierda, tema y letra a la derecha. */}
        <div
          ref={barRef}
          className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-[var(--guide-rule)] bg-[var(--guide-bg)]/90 px-3 py-2 backdrop-blur-md md:px-5"
        >
          <button
            type="button"
            onClick={() => {
              // En móvil no hay barra lateral que plegar: se abre el cajón.
              if (window.matchMedia("(min-width: 1024px)").matches) toggleSidebar();
              else setIsDrawerOpen(true);
            }}
            aria-label={isSidebarOpen ? "Ocultar el índice" : "Enseñar el índice"}
            title={isSidebarOpen ? "Ocultar el índice" : "Enseñar el índice"}
            className={barButton}
          >
            {isSidebarOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
          </button>

          <div className="flex items-center gap-1">
            {/* --- Tema --- */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenMenu(openMenu === "theme" ? null : "theme")}
                aria-haspopup="menu"
                aria-expanded={openMenu === "theme"}
                aria-label="Cambiar el tema"
                title="Tema"
                className={barButton}
              >
                <Palette size={16} />
              </button>

              {openMenu === "theme" && (
                <div role="menu" className={menuPanel}>
                  {GUIDE_THEMES.map((option) => {
                    const selected = theme === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => chooseTheme(option.id)}
                        className={menuRow(selected)}
                      >
                        {/* Muestra: el fondo del tema con un aro de su acento. */}
                        <span
                          aria-hidden
                          className="h-4 w-4 flex-shrink-0 rounded-full border-2"
                          style={{
                            backgroundColor: option.bg,
                            borderColor: option.accent,
                            boxShadow: selected ? `0 0 7px ${option.accent}` : undefined,
                          }}
                        />
                        <span className="flex-1">{option.label}</span>
                        {selected && (
                          <Check
                            size={13}
                            className="flex-shrink-0 text-[var(--guide-accent)]"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* --- Tipografía --- */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenMenu(openMenu === "type" ? null : "type")}
                aria-haspopup="menu"
                aria-expanded={openMenu === "type"}
                aria-label="Cambiar la tipografía"
                title="Tipografía"
                className={barButton}
              >
                <Type size={16} />
              </button>

              {openMenu === "type" && (
                <div role="menu" className={`${menuPanel} w-60`}>
                  {GUIDE_TYPEFACES.map((option) => {
                    const selected = typeface === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => chooseTypeface(option.id)}
                        className={menuRow(selected)}
                      >
                        <span
                          aria-hidden
                          className={`h-2 w-2 flex-shrink-0 rounded-full ${
                            selected
                              ? "bg-[var(--guide-accent)] shadow-[0_0_7px_var(--guide-accent)]"
                              : "bg-[var(--guide-rule)]"
                          }`}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium">{option.label}</span>
                          <span className="block truncate text-[0.68rem] text-[var(--guide-dim)]">
                            {option.pair}
                          </span>
                        </span>
                        {selected && (
                          <Check
                            size={13}
                            className="flex-shrink-0 text-[var(--guide-accent)]"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[52rem] px-5 py-10 pt-5 md:pb-9 md:pt-5">
          {children}

          {currentIndex >= 0 && (
            <div className="mt-16 flex gap-3 border-t border-[var(--guide-rule)] pt-6">
              {previous ? (
                <Link
                  href={`/guia/${previous.slug}`}
                  className="group guide-display flex min-w-0 flex-1 items-center gap-3 rounded-md border border-[var(--guide-rule)] px-4 py-3 transition-colors hover:border-[var(--guide-cyan)]"
                >
                  <ArrowLeft
                    size={15}
                    className="flex-shrink-0 text-[var(--guide-dim)] transition-colors group-hover:text-[var(--guide-cyan)]"
                  />
                  <span className="min-w-0">
                    <span className="block text-[0.65rem] uppercase tracking-[0.16em] text-[var(--guide-dim)]">
                      Anterior
                    </span>
                    <span className="block truncate text-[0.85rem] text-[var(--guide-text)]">
                      {previous.title}
                    </span>
                  </span>
                </Link>
              ) : (
                <span className="flex-1" />
              )}

              {next ? (
                <Link
                  href={`/guia/${next.slug}`}
                  className="group guide-display flex min-w-0 flex-1 items-center justify-end gap-3 rounded-md border border-[var(--guide-rule)] px-4 py-3 text-right transition-colors hover:border-[var(--guide-cyan)]"
                >
                  <span className="min-w-0">
                    <span className="block text-[0.65rem] uppercase tracking-[0.16em] text-[var(--guide-dim)]">
                      Siguiente
                    </span>
                    <span className="block truncate text-[0.85rem] text-[var(--guide-text)]">
                      {next.title}
                    </span>
                  </span>
                  <ArrowRight
                    size={15}
                    className="flex-shrink-0 text-[var(--guide-dim)] transition-colors group-hover:text-[var(--guide-cyan)]"
                  />
                </Link>
              ) : (
                <span className="flex-1" />
              )}
            </div>
          )}

          <p className="guide-display mt-10 text-center text-[0.7rem] text-[var(--guide-dim)]">
            <Link href="/" className="transition-colors hover:text-[var(--guide-cyan)]">
              ← Volver a los juegos
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
