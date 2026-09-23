import type { Metadata } from "next";
import {
  beforeDecidingPoints,
  beforeDecidingTitle,
  clientIntro,
  clientMissingTitle,
  clientPageMeta,
  exchangeRateNote,
  generatedAt,
  leadEnd,
  leadFloor,
  leadGcp,
  leadIntro,
  leadMid,
  methodologyRules,
  missingPoints,
  sources,
  tiers,
} from "@/lib/awp-paas-content";

export const metadata: Metadata = {
  title: { absolute: clientPageMeta.title },
  description: clientPageMeta.description,
  robots: { index: false, follow: false },
  openGraph: {
    title: clientPageMeta.title,
    description: clientPageMeta.description,
    type: "website",
    siteName: "AWP",
  },
  twitter: {
    card: "summary_large_image",
    title: clientPageMeta.title,
    description: clientPageMeta.description,
  },
};

function Callout({ tone, title, items }: { tone: "warning" | "info"; title: string; items: string[] }) {
  const toneClass =
    tone === "warning"
      ? "border-amber-300 bg-amber-50 text-amber-900"
      : "border-border bg-surface text-muted";
  const titleClass = tone === "warning" ? "text-amber-900" : "text-foreground";
  return (
    <div className={`rounded-2xl border p-5 text-sm leading-relaxed ${toneClass}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide ${titleClass}`}>{title}</p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current opacity-60" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AwpPaasPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-6 py-14 sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          Agricultural Wealth Project
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-[34px]">
          Alternativa: Vercel + Supabase
        </h1>
        <p className="mt-3 max-w-xl text-base text-muted">{clientIntro}</p>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <span>
            Gerado <span className="font-medium text-foreground">{generatedAt}</span>
          </span>
          <span>{exchangeRateNote}</span>
        </div>

        <p className="mt-10 max-w-xl text-lg leading-relaxed text-foreground">
          {leadIntro} <strong className="text-primary">{leadFloor}</strong>
          {leadMid} <strong className="text-primary">{leadGcp}</strong>
          {leadEnd}
        </p>

        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">Os 6 patamares</h2>
          <div className="mt-4 space-y-3">
            {tiers.map((row) => (
              <div
                key={row.users}
                className={`rounded-2xl border p-4 ${row.mvp ? "border-primary/60 bg-primary/5" : "border-border bg-surface"}`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{row.users} usuários</p>
                  {row.mvp && (
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      MVP real
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-1.5 text-sm">
                  <div className="flex items-baseline justify-between">
                    <span className="text-muted">AWS</span>
                    <span className="text-right">
                      <span className="font-medium text-foreground">{row.aws.usd}</span>
                      <span className="ml-1.5 text-xs text-muted">{row.aws.brl}</span>
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-muted">GCP</span>
                    <span className="text-right">
                      <span className="font-medium text-foreground">{row.gcp.usd}</span>
                      <span className="ml-1.5 text-xs text-muted">{row.gcp.brl}</span>
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 border-t border-dashed border-border pt-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    Piso Vercel+Supabase
                  </p>
                  <p className="mt-1">
                    <span className="text-base font-semibold text-primary">{row.floor.usd}</span>
                    <span className="ml-2 text-xs text-primary/70">{row.floor.brl}</span>
                  </p>
                </div>

                <p className="mt-2 text-xs text-muted">{row.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <Callout tone="warning" title={clientMissingTitle} items={missingPoints} />
        </section>

        <section className="mt-6">
          <div className="rounded-2xl border border-border bg-surface p-5 text-sm leading-relaxed">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
              {beforeDecidingTitle}
            </p>
            <ul className="mt-3 space-y-2">
              {beforeDecidingPoints.map((item) => (
                <li key={item} className="flex gap-2 text-muted">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <details className="mt-6 rounded-2xl border border-border bg-surface p-5 text-sm">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-primary">
            Metodologia e fontes
          </summary>
          <ul className="mt-4 space-y-2.5">
            {methodologyRules.map((rule) => (
              <li key={rule} className="flex gap-2 leading-relaxed text-muted">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-border" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-1.5 border-t border-border pt-4">
            {sources.map((source) => (
              <a
                key={source.href}
                href={source.href}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
              >
                {source.label} ↗
              </a>
            ))}
          </div>
        </details>

        <p className="mt-10 text-xs text-muted">
          Documento complementar à proposta AWP — Estimativa de Infraestrutura (MVP1).
        </p>
      </div>
    </div>
  );
}
