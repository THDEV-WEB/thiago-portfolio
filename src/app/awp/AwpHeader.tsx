"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

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
        Desktop/notebook: avatar + nome + navegação, fixos ao rolar a tela.
        Precisa ser irmão direto do wrapper de página inteira (nao filho de
        um <header> curto) — position:sticky só consegue "grudar" enquanto a
        tela nao passa do fim do PAI do elemento, entao um container curto
        limita a distância que ele fica fixo.
      */}
      <header className="hidden border-b border-border/70 bg-background/90 backdrop-blur-md sm:sticky sm:top-0 sm:z-50 sm:block">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-4">
          {avatar}
          <p className="text-sm font-semibold tracking-tight text-foreground">AWP</p>

          <div className="no-print relative ml-2" data-awp-dropdown>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-foreground/5"
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
      </header>

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
