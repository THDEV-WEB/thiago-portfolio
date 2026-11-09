"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { describeAnswer } from "../_lib/answers";
import {
  COVERAGE_LABEL,
  DIVERGENCE_LABEL,
  INDIVIDUAL_LABEL,
  SLOTS,
  SLOT_LABEL,
  VALIDATION_LABEL,
  autoValidationStatus,
  type Coverage,
  type Slot,
  type ValidationStatus,
} from "../_lib/divergence";
import { formatDateTime } from "../_lib/format";
import { otherAnswerTitle, type Report, type ReportAnswer, type ReportQuestion } from "../_lib/report";
import { BASE_PATH_CLIENT } from "../_components/client-storage";

const API = `${BASE_PATH_CLIENT}/api/admin`;

async function action(payload: Record<string, unknown>): Promise<string | null> {
  try {
    const res = await fetch(`${API}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) return null;
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    return data.error ?? "Não foi possível salvar.";
  } catch {
    return "Sem conexão.";
  }
}

type View = "comparar" | Slot;

export default function AdminDashboard({ report }: { report: Report }) {
  const router = useRouter();
  const [moduleKey, setModuleKey] = useState("");
  const [validation, setValidation] = useState<"" | ValidationStatus>("");
  const [cov, setCov] = useState<"" | Coverage>("");
  const [onlyDivergent, setOnlyDivergent] = useState(false);
  const [onlyDiscussion, setOnlyDiscussion] = useState(false);
  const [view, setView] = useState<View>("comparar");

  const modules = useMemo(
    () => [...new Map(report.questions.map((q) => [q.module.key, q.module])).values()],
    [report.questions],
  );

  const filtered = report.questions.filter(
    (q) =>
      (!moduleKey || q.module.key === moduleKey) &&
      (!validation || q.validation === validation) &&
      (!cov || q.coverage === cov) &&
      (!onlyDivergent || q.divergence.state === "possivel") &&
      (!onlyDiscussion || q.needsDiscussion),
  );

  async function logout() {
    await fetch(`${API}/login`, { method: "DELETE" });
    router.refresh();
  }

  const t = report.totals;
  const selectClass = "min-h-11 rounded-xl border border-border bg-background px-3 py-2 text-sm";

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Painel do levantamento</h1>
        <div className="flex flex-wrap gap-2">
          <a href={`${API}/export/pdf`} className="min-h-11 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
            Baixar PDF consolidado
          </a>
          <a href={`${API}/export/json`} className="min-h-11 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold">
            Baixar JSON completo
          </a>
          <button type="button" onClick={logout} className="min-h-11 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm">
            Sair
          </button>
        </div>
      </div>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Manoel respondeu" value={`${t.answeredBy.manoel}/${t.questions}`} />
        <Stat label="Cadene respondeu" value={`${t.answeredBy.cadene}/${t.questions}`} />
        <Stat label="Possíveis divergências" value={String(t.possibleDivergences)} />
        <Stat label="Regras confirmadas" value={`${t.validation.confirmada}/${t.questions}`} />
      </section>

      <ParticipantsTable report={report} onChanged={() => router.refresh()} />

      <section className="mt-8 rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-primary">Filtros</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <select aria-label="Módulo" value={moduleKey} onChange={(e) => setModuleKey(e.target.value)} className={selectClass}>
            <option value="">Todos os módulos</option>
            {modules.map((m) => (
              <option key={m.key} value={m.key}>
                {m.number}. {m.title}
              </option>
            ))}
          </select>
          <select aria-label="Situação da regra" value={validation} onChange={(e) => setValidation(e.target.value as typeof validation)} className={selectClass}>
            <option value="">Qualquer situação</option>
            {Object.entries(VALIDATION_LABEL).map(([k, label]) => (
              <option key={k} value={k}>
                {label} ({t.validation[k as ValidationStatus]})
              </option>
            ))}
          </select>
          <select aria-label="Cobertura" value={cov} onChange={(e) => setCov(e.target.value as typeof cov)} className={selectClass}>
            <option value="">Qualquer cobertura</option>
            {Object.entries(COVERAGE_LABEL).map(([k, label]) => (
              <option key={k} value={k}>
                {label} ({t.coverage[k as Coverage]})
              </option>
            ))}
          </select>
          <select aria-label="Visualização" value={view} onChange={(e) => setView(e.target.value as View)} className={selectClass}>
            <option value="comparar">Comparar Manoel × Cadene</option>
            <option value="manoel">Só respostas do Manoel</option>
            <option value="cadene">Só respostas do Cadene</option>
          </select>
          <label className="flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-sm">
            <input type="checkbox" checked={onlyDivergent} onChange={(e) => setOnlyDivergent(e.target.checked)} />
            Possível divergência ({t.possibleDivergences})
          </label>
          <label className="flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-sm">
            <input type="checkbox" checked={onlyDiscussion} onChange={(e) => setOnlyDiscussion(e.target.checked)} />
            Preciso discutir ({t.needsDiscussion})
          </label>
        </div>
        <p className="mt-2 text-sm text-muted">
          {filtered.length} de {t.questions} perguntas
        </p>
      </section>

      <div className="mt-6 grid gap-5">
        {filtered.map((q) => (
          <QuestionAdmin key={q.question.key} q={q} view={view} onChanged={() => router.refresh()} />
        ))}
      </div>

      <ProposedOptions report={report} />
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function ParticipantsTable({ report, onChanged }: { report: Report; onChanged: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const answered = (id: string) =>
    report.questions.filter((q) =>
      [...SLOTS.map((s) => q.bySlot[s]), ...q.others].some((e) => e?.participant.id === id && e.status === "respondida"),
    ).length;

  return (
    <section className="mt-8 rounded-2xl border border-border bg-surface p-4">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-primary">Participantes</h2>
      <p className="mt-1 text-xs text-muted">
        Nomes declarados, não verificados. Se alguém entrou por mais de um aparelho, identifique os dois registros com
        a mesma pessoa: vale a resposta mais recente.
      </p>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs text-muted">
            <tr>
              <th className="py-2 pr-3 font-medium">Nome declarado</th>
              <th className="py-2 pr-3 font-medium">Identificado como</th>
              <th className="py-2 pr-3 font-medium">Respondidas</th>
              <th className="py-2 pr-3 font-medium">Primeiro acesso</th>
              <th className="py-2 font-medium">Última atividade</th>
            </tr>
          </thead>
          <tbody>
            {report.participants.length === 0 && (
              <tr>
                <td colSpan={5} className="py-3 text-muted">
                  Ninguém entrou ainda.
                </td>
              </tr>
            )}
            {report.participants.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="py-2 pr-3">{p.declaredName}</td>
                <td className="py-2 pr-3">
                  {p.kind === "admin" ? (
                    "Administrador"
                  ) : (
                    <select
                      aria-label={`Identificar ${p.declaredName}`}
                      value={p.slot ?? ""}
                      onChange={async (e) => {
                        const err = await action({ action: "slot", participantId: p.id, slot: e.target.value || null });
                        setError(err);
                        if (!err) onChanged();
                      }}
                      className="rounded-lg border border-border bg-background px-2 py-1"
                    >
                      <option value="">Sem identificação</option>
                      <option value="manoel">Manoel</option>
                      <option value="cadene">Cadene</option>
                    </select>
                  )}
                </td>
                <td className="py-2 pr-3">{answered(p.id)}</td>
                <td className="py-2 pr-3">{formatDateTime(p.createdAt)}</td>
                <td className="py-2">{formatDateTime(p.lastSeenAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "warn" | "ok" }) {
  const cls =
    tone === "warn"
      ? "border-amber-300 bg-amber-50 text-amber-900"
      : tone === "ok"
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border-border bg-background text-muted";
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${cls}`}>{children}</span>;
}

function QuestionAdmin({ q, view, onChanged }: { q: ReportQuestion; view: View; onChanged: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [noteTarget, setNoteTarget] = useState("");
  const [rule, setRule] = useState(q.rule?.body ?? "");
  const [busy, setBusy] = useState(false);

  async function run(payload: Record<string, unknown>, after?: () => void) {
    setBusy(true);
    const err = await action({ questionKey: q.question.key, ...payload });
    setBusy(false);
    setError(err);
    if (!err) {
      after?.();
      onChanged();
    }
  }

  const slots = view === "comparar" ? SLOTS : [view];
  const allEntries = [...SLOTS.map((s) => q.bySlot[s]), ...q.others].filter((e): e is ReportAnswer => Boolean(e));

  return (
    <article id={`admin-${q.question.key}`} className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
      <p className="text-xs font-medium text-muted">
        Módulo {q.module.number} · {q.module.title}
      </p>
      <h3 className="mt-1 text-lg font-semibold leading-snug">
        <span className="mr-1.5 text-primary">{q.question.number}</span>
        {q.question.prompt}
      </h3>
      <div className="mt-2 flex flex-wrap gap-2">
        <Badge tone={q.coverage === "ambos" ? "ok" : "neutral"}>{COVERAGE_LABEL[q.coverage]}</Badge>
        <Badge tone={q.divergence.state === "possivel" ? "warn" : "neutral"}>{DIVERGENCE_LABEL[q.divergence.state]}</Badge>
        {q.needsDiscussion && <Badge tone="warn">Marcada para discussão</Badge>}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label htmlFor={`val-${q.question.key}`} className="text-sm font-semibold">
          Situação da regra
        </label>
        <select
          id={`val-${q.question.key}`}
          disabled={busy}
          value={q.validationSource === "manual" ? q.validation : ""}
          onChange={(e) => run({ action: "validation", status: e.target.value || null })}
          className="min-h-11 rounded-xl border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">Automática: {VALIDATION_LABEL[autoValidationStatus(q.coverage)]}</option>
          {Object.entries(VALIDATION_LABEL).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
        {q.validationSource === "manual" && <span className="text-xs text-muted">definida por você</span>}
      </div>

      {q.divergence.state === "possivel" && (
        <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-semibold">Possível divergência (nenhuma resposta é considerada correta)</p>
          <ul className="mt-1 list-disc pl-5">
            {q.divergence.details.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      )}

      <div className={`mt-4 grid gap-3 ${slots.length > 1 ? "md:grid-cols-2" : ""}`}>
        {slots.map((slot) => (
          <AnswerView key={slot} title={SLOT_LABEL[slot]} entry={q.bySlot[slot]} q={q} />
        ))}
      </div>
      {view === "comparar" && q.others.length > 0 && (
        <div className="mt-3 grid gap-3">
          {q.others.map((e) => (
            <AnswerView key={e.answer.id} title={otherAnswerTitle(e)} entry={e} q={q} />
          ))}
        </div>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <section>
          <h4 className="text-sm font-semibold">Observações</h4>
          {q.notes.length === 0 && <p className="mt-1 text-sm text-muted">Nenhuma.</p>}
          <ul className="mt-1 space-y-2">
            {q.notes.map((n) => {
              const about = allEntries.find((e) => e.answer.id === n.answerId);
              return (
                <li key={n.id} className="rounded-lg bg-background p-2 text-sm">
                  <p className="text-xs text-muted">
                    {formatDateTime(n.createdAt)}
                    {about ? ` · sobre a resposta de ${about.participant.declaredName}` : ""}
                  </p>
                  <p className="whitespace-pre-wrap">{n.body}</p>
                </li>
              );
            })}
          </ul>
          <textarea
            aria-label="Nova observação"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nova observação (não altera as respostas)"
            className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <div className="mt-1 flex flex-wrap gap-2">
            <select
              aria-label="Observação sobre"
              value={noteTarget}
              onChange={(e) => setNoteTarget(e.target.value)}
              className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
            >
              <option value="">Sobre a pergunta</option>
              {allEntries.map((e) => (
                <option key={e.answer.id} value={e.answer.id}>
                  Sobre a resposta de {e.participant.declaredName}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={busy || !note.trim()}
              onClick={() => run({ action: "note", body: note, answerId: noteTarget || null }, () => setNote(""))}
              className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              Adicionar observação
            </button>
          </div>
        </section>

        <section>
          <h4 className="text-sm font-semibold">
            Regra consolidada {q.rule ? <span className="font-normal text-muted">· versão {q.rule.version}</span> : null}
          </h4>
          <textarea
            aria-label="Texto da regra consolidada"
            rows={4}
            value={rule}
            onChange={(e) => setRule(e.target.value)}
            placeholder="Texto da regra de negócio (cada salvamento cria uma nova versão)"
            className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={busy || !rule.trim() || rule.trim() === q.rule?.body.trim()}
            onClick={() => run({ action: "rule", body: rule })}
            className="mt-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            Salvar nova versão
          </button>
          {q.ruleHistory.length > 1 && (
            <details className="mt-2 text-sm">
              <summary className="cursor-pointer text-muted">Versões anteriores ({q.ruleHistory.length - 1})</summary>
              <ol className="mt-1 space-y-2">
                {q.ruleHistory.slice(0, -1).reverse().map((r) => (
                  <li key={r.id} className="rounded-lg bg-background p-2">
                    <p className="text-xs text-muted">
                      Versão {r.version} · {formatDateTime(r.createdAt)}
                    </p>
                    <p className="whitespace-pre-wrap">{r.body}</p>
                  </li>
                ))}
              </ol>
            </details>
          )}
        </section>
      </div>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
    </article>
  );
}

function AnswerView({ title, entry, q }: { title: string; entry: ReportAnswer | undefined; q: ReportQuestion }) {
  if (!entry) {
    return (
      <div className="rounded-xl border border-dashed border-border p-3">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-sm text-muted">Sem resposta.</p>
      </div>
    );
  }
  const v = entry.answer.value;
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <p className="text-sm font-semibold">
        {title} <span className="font-normal text-muted">· {entry.participant.declaredName}</span>
      </p>
      <p className="text-xs text-muted">
        {INDIVIDUAL_LABEL[entry.status]} · atualizada em {formatDateTime(entry.answer.updatedAt)}
      </p>
      {v.needs_discussion && (
        <p className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
          Preciso discutir isso
        </p>
      )}
      <div className="mt-2 space-y-1 text-sm">
        {describeAnswer(q.question, v).map((line) => (
          <p key={line}>{line}</p>
        ))}
        {v.explanation.trim() && (
          <p className="whitespace-pre-wrap">
            <span className="font-semibold">{q.question.explanation?.label ?? "Explicação"}: </span>
            {v.explanation}
          </p>
        )}
        {q.question.extraFields?.map((f) =>
          v.extra[f.key]?.trim() ? (
            <p key={f.key}>
              <span className="font-semibold">{f.label}: </span>
              {v.extra[f.key]}
            </p>
          ) : null,
        )}
        {v.complement.trim() && (
          <p className="whitespace-pre-wrap">
            <span className="font-semibold">Complemento: </span>
            {v.complement}
          </p>
        )}
      </div>
      {entry.revisions.length > 0 && (
        <details className="mt-2 text-sm">
          <summary className="cursor-pointer text-muted">Histórico ({entry.revisions.length} versões anteriores)</summary>
          <ol className="mt-1 space-y-2">
            {[...entry.revisions].reverse().map((r) => (
              <li key={r.id} className="rounded-lg border border-border p-2">
                <p className="text-xs text-muted">
                  Versão de {formatDateTime(r.validFrom)} · substituída em {formatDateTime(r.recordedAt)}
                  {r.reason === "discussion_flag" ? " · mudança em “Preciso discutir”" : ""}
                </p>
                {describeAnswer(q.question, r.value).map((line) => (
                  <p key={line}>{line}</p>
                ))}
                {r.value.explanation && <p className="whitespace-pre-wrap">{r.value.explanation}</p>}
                {r.value.complement && <p className="whitespace-pre-wrap text-muted">Complemento: {r.value.complement}</p>}
              </li>
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}

function ProposedOptions({ report }: { report: Report }) {
  return (
    <details className="mt-8 rounded-2xl border border-border bg-surface p-4">
      <summary className="cursor-pointer text-sm font-semibold uppercase tracking-widest text-primary">
        Alternativas propostas a validar ({report.proposed.length})
      </summary>
      <p className="mt-2 text-sm text-muted">Sugeridas pelo desenvolvimento; validar principalmente com o Manoel.</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="text-xs text-muted">
            <tr>
              <th className="py-2 pr-3 font-medium">Pergunta</th>
              <th className="py-2 pr-3 font-medium">Alternativa</th>
              <th className="py-2 pr-3 font-medium">Escolhida por</th>
              <th className="py-2 font-medium">Usaram “Outro”</th>
            </tr>
          </thead>
          <tbody>
            {report.proposed.map((p) => (
              <tr key={`${p.question.key}:${p.optionKey}`} className="border-t border-border">
                <td className="py-2 pr-3">{p.question.number}</td>
                <td className="py-2 pr-3">{p.label}</td>
                <td className="py-2 pr-3">{p.chosenBy.map((s) => SLOT_LABEL[s]).join(", ") || "—"}</td>
                <td className="py-2">{p.preferredOther.map((s) => SLOT_LABEL[s]).join(", ") || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
