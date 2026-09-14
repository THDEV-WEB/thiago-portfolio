"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Section = { id: string; label: string };

export default function AwpHeader({
  sections,
  avatarSrc,
}: {
  sections: Section[];
  avatarSrc?: string | null;
}) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const [open, setOpen] = useState(false);
  const [pastTopHeader, setPastTopHeader] = useState(false);
  const topHeaderRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const elements = sections
      .map((section) => document.getElementById(section.id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;
        const topMost = visible.reduce((a, b) =>
          a.boundingClientRect.top < b.boundingClientRect.top ? a : b,
        );
        setActiveId(topMost.target.id);
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: [0, 1] },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  // Desktop: o header normal (com as categorias na horizontal) vive no fluxo
  // normal da página, no topo. A pill fixa no canto só aparece quando esse
  // header sai de vista ao rolar a tela.
  useEffect(() => {
    const el = topHeaderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const past = !entry.isIntersecting;
        setPastTopHeader(past);
        if (!past) setOpen(false);
      },
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      if (!event.target.closest("[data-awp-dropdown]")) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open]);

  const avatar = avatarSrc && (
    <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-border/70 sm:h-8 sm:w-8">
      <Image src={avatarSrc} alt="" fill sizes="32px" className="object-cover" />
    </span>
  );

  return (
    <>
      {/*
        Desktop/notebook, estado no topo: header normal (não fixo), com
        avatar + nome + categorias na horizontal, dentro do fluxo da página.
      */}
      <header ref={topHeaderRef} className="hidden border-b border-border/70 bg-background sm:block">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4">
          <div className="flex items-center gap-3">
            {avatar}
            <p className="text-sm font-semibold tracking-tight text-foreground">AWP</p>
          </div>

          <nav className="no-print flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={`font-medium transition-colors ${
                  activeId === section.id ? "text-primary" : "text-muted hover:text-foreground"
                }`}
              >
                {section.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      {/*
        Desktop/notebook, estado ao rolar: quando o header acima sai de vista,
        essa pill compacta assume no canto superior esquerdo e fica fixa.
        Precisa ser irmã direta do wrapper de página inteira (não filha de um
        <header> curto) — position:fixed não depende disso, mas mantemos o
        padrão para não repetir o bug de containment do sticky.
      */}
      <div
        className={`no-print fixed left-6 top-4 z-50 hidden transition-all duration-200 sm:block ${
          pastTopHeader
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
        <div className="flex items-center gap-3 rounded-full border border-border bg-surface/95 px-4 py-2 shadow-lg backdrop-blur-md">
          {avatar}
          <p className="text-sm font-semibold tracking-tight text-foreground">AWP</p>

          <div className="relative" data-awp-dropdown>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-foreground/5"
            >
              Seções
              <span className={`text-[10px] transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
            </button>

            {open && (
              <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-2xl border border-border bg-surface p-2 shadow-lg">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    onClick={() => setOpen(false)}
                    className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      activeId === section.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted hover:bg-foreground/5 hover:text-foreground"
                    }`}
                  >
                    {section.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: nome + avatar, rola normalmente (não fixo) */}
      <header className="border-b border-border/70 px-6 py-5 sm:hidden">
        <div className="mx-auto flex max-w-5xl items-center gap-2">
          {avatar}
          <p className="text-sm font-semibold tracking-tight text-foreground">AWP</p>
        </div>
      </header>

      {/* Mobile: barra de seções em abas, fixa ao rolar */}
      <nav className="no-print sticky top-0 z-40 border-b border-border/40 bg-surface/95 backdrop-blur-sm sm:hidden">
        <div className="flex gap-1 overflow-x-auto px-4 py-2 text-sm">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={`shrink-0 whitespace-nowrap border-b-2 px-2.5 py-2 font-medium transition-colors ${
                activeId === section.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {section.label}
            </a>
          ))}
        </div>
      </nav>
    </>
  );
}
