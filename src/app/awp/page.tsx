import type { Metadata } from "next";
import AwpHeader from "./AwpHeader";
import {
  awpAvatarSrc,
  awsArchitecture,
  awsDetailCards,
  awsDivergenceNote,
  awsNatNote,
  backupBullets,
  backupDistinctionNote,
  backupRetentionNote,
  closingNote,
  costMethodologyIntro,
  costMethodologyRules,
  costTableNote,
  costTableNoteB,
  costTableNoteC,
  costTableRows,
  costTableRowsB,
  costTableRowsC,
  disclaimerScopeNote,
  environmentsFlow,
  environmentsNote,
  executiveSummary,
  exchangeRateNote,
  financialDisclaimer,
  gcpArchitecture,
  gcpDetailCards,
  growthSteps,
  growthText,
  heroBadges,
  navSections,
  preparedBy,
  preparedDate,
  premises,
  premisesNote,
  preliminaryCostWarning,
  pricingSources,
  pricingSourcesNote,
  providerCostNote,
  providerIntro,
  recommendationFinding,
  recommendationStatusNote,
  recommendationText,
  scenarios,
  scenariosNote,
  securityBullets,
  sizingAssumptions,
  type DetailCard,
  type ProviderArchitecture,
  type ProviderCostCell,
} from "@/lib/awp-content";

const awpTitle = "AWP — Estimativa de Infraestrutura (MVP1)";
const awpDescription =
  "Proposta técnica preliminar de infraestrutura e custos para o MVP1 do AWP — Agricultural Wealth Project, sistema de custeio de produção de mandioca.";

export const metadata: Metadata = {
  title: { absolute: awpTitle },
  description: awpDescription,
  robots: { index: false, follow: false },
  openGraph: {
    title: awpTitle,
    description: awpDescription,
    type: "website",
    siteName: "AWP",
  },
  twitter: {
    card: "summary_large_image",
    title: awpTitle,
    description: awpDescription,
  },
};

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-border/70 py-14 first:border-t-0 first:pt-0">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-primary">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Callout({ tone, children }: { tone: "warning" | "info"; children: React.ReactNode }) {
  const toneClass =
    tone === "warning"
      ? "border-amber-300 bg-amber-50 text-amber-900"
      : "border-border bg-surface text-muted";
  return (
    <div className={`rounded-2xl border p-5 text-sm leading-relaxed ${toneClass}`}>{children}</div>
  );
}

function FlowSteps({ steps }: { steps: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
      {steps.map((step, i) => (
        <span key={step} className="flex items-center gap-2">
          <span className="rounded-full border border-border bg-background px-3 py-1.5">{step}</span>
          {i < steps.length - 1 && <span className="text-muted">→</span>}
        </span>
      ))}
    </div>
  );
}

function ProviderCard({ provider, note }: { provider: ProviderArchitecture; note?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <h3 className="text-base font-semibold text-foreground">{provider.name}</h3>
      <p className="text-sm text-muted">{provider.region}</p>

      <div className="mt-5">
        <FlowSteps steps={provider.flow} />
      </div>

      <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted">
        Serviços auxiliares
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {provider.services.map((service) => (
          <span
            key={service}
            className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
          >
            {service}
          </span>
        ))}
      </div>

      <ul className="mt-5 space-y-2">
        {provider.notes.map((n) => (
          <li key={n} className="text-sm leading-relaxed text-muted">
            {n}
          </li>
        ))}
      </ul>

      {note && <div className="mt-5">{note}</div>}
    </div>
  );
}

function CostCell({ cell }: { cell: ProviderCostCell }) {
  return (
    <div className="leading-snug">
      <p className="font-semibold text-foreground">
        {cell.monthlyUsd} <span className="font-normal text-muted">/mês</span>
      </p>
      <p className="text-xs text-muted">≈ {cell.monthlyBrl} /mês</p>
      <p className="mt-1.5 text-foreground">
        {cell.annualUsd} <span className="text-muted">/ano</span>
      </p>
      <p className="text-xs text-muted">≈ {cell.annualBrl} /ano</p>
    </div>
  );
}

function DetailCardGrid({ cards }: { cards: DetailCard[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <div key={card.name} className="rounded-2xl border border-border bg-surface p-5">
          <p className="font-semibold text-foreground">{card.name}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{card.role}</p>
          {card.referenceCost && (
            <p className="mt-3 text-xs leading-relaxed text-muted">
              <span className="font-semibold text-foreground">Preço unitário: </span>
              {card.referenceCost}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export default function AwpPage() {
  return (
    <div className="awp-page bg-background text-foreground">
      {/* Cabeçalho próprio do AWP — sem a navegação do portfólio */}
      <AwpHeader sections={navSections} avatarSrc={awpAvatarSrc} />

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-14 pt-14 sm:pt-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          Agricultural Wealth Project
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">AWP</h1>
        <p className="mt-2 text-xl font-medium text-muted sm:text-2xl">
          Estimativa de Infraestrutura — MVP1
        </p>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
          Proposta preliminar de infraestrutura para o sistema de custeio de produção de mandioca.
        </p>
        <p className="mt-3 text-sm font-medium text-muted">
          Preparado por {preparedBy} · {preparedDate}
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          {heroBadges.map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground"
            >
              {badge}
            </span>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 pb-24">
        <Section id="resumo" title="Resumo da proposta">
          <p className="max-w-3xl text-base leading-relaxed text-foreground">
            {executiveSummary.intro}
          </p>
          <blockquote className="mt-6 max-w-3xl border-l-4 border-primary pl-5 text-lg font-medium leading-relaxed text-foreground">
            {executiveSummary.quote}
          </blockquote>
          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted">
            {executiveSummary.freeTierNote}
          </p>
        </Section>

        <Section id="premissas" title="Premissas">
          <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {premises.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-foreground">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted">{premisesNote}</p>
        </Section>

        <Section id="cenarios" title="Cenários">
          <div className="grid gap-6 sm:grid-cols-3">
            {scenarios.map((scenario) => (
              <a
                key={scenario.id}
                href={`#custos-cenario-${scenario.id.toLowerCase()}`}
                className="block rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-primary/60 hover:bg-primary/5"
              >
                <h3 className="text-sm font-semibold text-foreground">
                  {scenario.title} <span className="font-normal text-primary">→ ver custos</span>
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{scenario.description}</p>
                <ul className="mt-4 space-y-2">
                  {scenario.infraDiffs.map((diff) => (
                    <li key={diff} className="flex gap-2 text-xs leading-relaxed text-muted">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                      {diff}
                    </li>
                  ))}
                </ul>
              </a>
            ))}
          </div>
          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted">{scenariosNote}</p>
        </Section>

        <Section id="arquitetura" title="Arquitetura">
          <p className="max-w-3xl text-sm leading-relaxed text-muted">{providerIntro}</p>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <ProviderCard
              provider={awsArchitecture}
              note={
                <div className="space-y-3">
                  <Callout tone="warning">{awsDivergenceNote}</Callout>
                  <Callout tone="info">{awsNatNote}</Callout>
                </div>
              }
            />
            <ProviderCard provider={gcpArchitecture} />
          </div>

          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted">{providerCostNote}</p>

          <div className="mt-10 rounded-2xl border border-border bg-surface p-6">
            <h3 className="text-sm font-semibold text-foreground">Ambientes</h3>
            <div className="mt-4">
              <FlowSteps steps={environmentsFlow} />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted">{environmentsNote}</p>
          </div>
        </Section>

        <Section id="custos" title="Detalhamento de custos">
          <h3 id="custos-cenario-a" className="scroll-mt-24 text-sm font-semibold text-foreground">
            Cenário A — Econômico / MVP
          </h3>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="bg-surface text-left">
                  <th className="px-4 py-3 font-semibold text-foreground">Usuários</th>
                  <th className="px-4 py-3 font-semibold text-foreground">AWS</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Google Cloud</th>
                </tr>
              </thead>
              <tbody>
                {costTableRows.map((row) => (
                  <tr
                    key={row.users}
                    className={`border-t border-border align-top ${row.highlight ? "bg-primary/5" : ""}`}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{row.users}</td>
                    <td className="px-4 py-3 text-sm">
                      <CostCell cell={row.aws} />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <CostCell cell={row.gcp} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted">{costTableNote}</p>

          <h3 id="custos-cenario-b" className="mt-12 scroll-mt-24 text-sm font-semibold text-foreground">
            Cenário B — Recomendado
          </h3>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="bg-surface text-left">
                  <th className="px-4 py-3 font-semibold text-foreground">Usuários</th>
                  <th className="px-4 py-3 font-semibold text-foreground">AWS</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Google Cloud</th>
                </tr>
              </thead>
              <tbody>
                {costTableRowsB.map((row) => (
                  <tr
                    key={row.users}
                    className={`border-t border-border align-top ${row.highlight ? "bg-primary/5" : ""}`}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{row.users}</td>
                    <td className="px-4 py-3 text-sm">
                      <CostCell cell={row.aws} />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <CostCell cell={row.gcp} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted">{costTableNoteB}</p>

          <h3 id="custos-cenario-c" className="mt-12 scroll-mt-24 text-sm font-semibold text-foreground">
            Cenário C — Crescimento / Maior disponibilidade
          </h3>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="bg-surface text-left">
                  <th className="px-4 py-3 font-semibold text-foreground">Usuários</th>
                  <th className="px-4 py-3 font-semibold text-foreground">AWS</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Google Cloud</th>
                </tr>
              </thead>
              <tbody>
                {costTableRowsC.map((row) => (
                  <tr
                    key={row.users}
                    className={`border-t border-border align-top ${row.highlight ? "bg-primary/5" : ""}`}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{row.users}</td>
                    <td className="px-4 py-3 text-sm">
                      <CostCell cell={row.aws} />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <CostCell cell={row.gcp} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted">{costTableNoteC}</p>

          <p className="mt-8 max-w-3xl text-xs leading-relaxed text-muted">{exchangeRateNote}</p>

          <div className="mt-10">
            <Callout tone="warning">{preliminaryCostWarning}</Callout>
          </div>

          <h3 className="mt-12 text-sm font-semibold text-foreground">
            Como esses valores foram calculados
          </h3>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">{costMethodologyIntro}</p>
          <ul className="mt-4 space-y-3">
            {costMethodologyRules.map((rule) => (
              <li key={rule} className="flex gap-3 text-sm leading-relaxed text-muted">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {rule}
              </li>
            ))}
          </ul>

          <p className="mt-8 text-xs font-semibold uppercase tracking-wide text-muted">
            Dimensionamento e premissas usadas em cada patamar
          </p>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="bg-surface text-left">
                  <th className="px-4 py-3 font-semibold text-foreground">Usuários</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Aplicação</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Banco</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Storage banco</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Arquivos (assunção)</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Tráfego (assunção)</th>
                </tr>
              </thead>
              <tbody>
                {sizingAssumptions.map((row) => (
                  <tr key={row.users} className="border-t border-border">
                    <td className="px-4 py-3 font-medium text-foreground">{row.users}</td>
                    <td className="px-4 py-3 text-muted">{row.appSpec}</td>
                    <td className="px-4 py-3 text-muted">{row.dbSpec}</td>
                    <td className="px-4 py-3 text-muted">{row.dbStorageGb}</td>
                    <td className="px-4 py-3 italic text-muted">{row.filesGb}</td>
                    <td className="px-4 py-3 italic text-muted">{row.trafficGb}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="mt-12 text-xs font-semibold uppercase tracking-widest text-muted">
            Detalhamento AWS
          </h3>
          <div className="mt-4">
            <DetailCardGrid cards={awsDetailCards} />
          </div>

          <h3 className="mt-10 text-xs font-semibold uppercase tracking-widest text-muted">
            Detalhamento Google Cloud
          </h3>
          <div className="mt-4">
            <DetailCardGrid cards={gcpDetailCards} />
          </div>
        </Section>

        <Section id="seguranca" title="Segurança">
          <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {securityBullets.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-foreground">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        </Section>

        <Section id="backup" title="Backup e retenção">
          <p className="max-w-3xl text-sm leading-relaxed text-foreground">
            Produção exige backup. A política inicial deve considerar:
          </p>
          <ul className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {backupBullets.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-foreground">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-6 space-y-3">
            <Callout tone="info">{backupRetentionNote}</Callout>
            <Callout tone="info">{backupDistinctionNote}</Callout>
          </div>
        </Section>

        <Section id="crescimento" title="Crescimento">
          <FlowSteps steps={growthSteps.map((n) => `${n} usuários`)} />
          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted">{growthText}</p>
        </Section>

        <Section id="recomendacao" title="Recomendação técnica">
          <p className="max-w-3xl text-base leading-relaxed text-foreground">{recommendationText}</p>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-foreground">{recommendationFinding}</p>
          <div className="mt-6">
            <Callout tone="info">{recommendationStatusNote}</Callout>
          </div>
        </Section>

        <Section id="fontes" title="Fontes de preços">
          <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {pricingSources.map((source) => (
              <li key={source.label} className="text-sm leading-relaxed">
                <a
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
                >
                  {source.label} ↗
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted">{pricingSourcesNote}</p>
        </Section>

        <Section id="disclaimer" title="Aviso financeiro">
          <p className="max-w-3xl text-sm leading-relaxed text-muted">{financialDisclaimer}</p>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted">{disclaimerScopeNote}</p>
        </Section>

        <div className="mt-16 border-t border-border/70 pt-8 text-center">
          <p className="text-sm font-medium text-foreground">
            AWP — Estimativa de Infraestrutura (MVP1) · Preparado por {preparedBy} · {preparedDate}
          </p>
          <p className="mt-2 text-xs text-muted">{closingNote}</p>
        </div>
      </div>
    </div>
  );
}
