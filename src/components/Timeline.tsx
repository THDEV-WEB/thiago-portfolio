import type { TimelineEntry } from "@/lib/content";

export default function Timeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <ol className="relative border-l border-border pl-12 sm:pl-16">
      {entries.map((entry, index) => (
        <li key={entry.id} className="reveal relative mb-12 last:mb-0">
          <span className="absolute -left-12 top-0 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border-2 border-primary bg-background text-[11px] font-semibold text-primary sm:-left-16 sm:h-9 sm:w-9 sm:text-xs">
            {String(index + 1).padStart(2, "0")}
          </span>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {entry.period}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-foreground">{entry.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">{entry.summary}</p>

          {entry.detail && (
            <details className="timeline-detail mt-3">
              <summary className="inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-primary">
                Ver a história completa
                <span aria-hidden>▾</span>
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-muted">{entry.detail}</p>
            </details>
          )}

          {entry.pending && (
            <p className="mt-3 text-xs italic text-muted/70">
              {entry.pending}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
