"use client";

import { useState } from "react";
import { REVIEW_SECTIONS, type ReviewSlot } from "../_content/revisao";
import { describeAnswer } from "../_lib/answers";
import { VALIDATION_LABEL } from "../_lib/divergence";
import { formatDateTime } from "../_lib/format";
import type { Report } from "../_lib/report";
import {
  PHASES,
  PHASE_LABEL,
  REVIEW_STATUS_LABEL,
  SECTION_ORDER,
  choiceOf,
  plainText,
  reviewQuestion,
  reviewTitle,
  ruleTextFor,
  type Phase,
  type ReviewItemReport,
  type ReviewReport,
} from "../_lib/review";
import { BASE_PATH_CLIENT } from "../_components/client-storage";
import { adminAction } from "./admin-action";

const LABEL: Record<ReviewSlot, string> = { manoel: "Manoel", cadene: "Cadene" };

const PHASE_CONFIRM: Record<Phase, string> = {
  questionario: "Reabrir o questionário? Os participantes voltam a poder editar as respostas originais, e a revisão some da tela deles.",
  revisao: "Abrir a revisão? O questionário fica só para leitura e, ao abrir o link, o Manoel e o Cadene passam a ver a revisão, com as respostas dos dois.",
  encerrado: "Encerrar? Tudo fica só para leitura, inclusive a revisão.",
};

export default function ReviewAdmin({ review, report, onChanged }: { review: ReviewReport; report: Report; onChanged: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function changePhase(phase: Phase) {
    if (phase === review.phase || !window.confirm(PHASE_CONFIRM[phase])) return;
    setBusy(true);
    const err = await adminAction({ action: "phase", phase });
    setBusy(false);
    setError(err);
    if (!err) onChanged();
  }

  const counts = review.items.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section className="mt-8 rounded-2xl border border-border bg-surface p-4">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-primary">Revisão (segunda rodada)</h2>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label htmlFor="fase" className="text-sm font-semibold">
          Fase da ferramenta
        </label>
        <select
          id="fase"
          disabled={busy}
          value={review.phase}
          onChange={(e) => changePhase(e.target.value as Phase)}
          className="min-h-11 rounded-xl border border-border bg-background px-3 py-2 text-sm"
        >
          {PHASES.map((p) => (
            <option key={p} value={p}>
              {PHASE_LABEL[p]}
            </option>
          ))}
        </select>
        <a href={`${BASE_PATH_CLIENT}/admin/revisao?como=manoel`} className="min-h-11 rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium">
          Ver como o Manoel
        </a>
        <a href={`${BASE_PATH_CLIENT}/admin/revisao?como=cadene`} className="min-h-11 rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium">
          Ver como o Cadene
        </a>
      </div>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Manoel revisou" value={`${review.progress.manoel.done}/${review.progress.manoel.total}`} />
        <Stat label="Cadene revisou" value={`${review.progress.cadene.done}/${review.progress.cadene.total}`} />
        <Stat label="Os dois concordaram" value={String(counts.concordam ?? 0)} />
        <Stat label="Ainda divergem ou pediram ajuste" value={String((counts.divergem ?? 0) + (counts.ajustar ?? 0) + (counts.comparar ?? 0))} />
      </div>

      {SECTION_ORDER.map((section) => {
        const rows = review.items.filter((r) => r.item.section === section);
        if (rows.length === 0) return null;
        return (
          <div key={section} className="mt-6">
            <h3 className="text-base font-semibold">{REVIEW_SECTIONS[section].title}</h3>
            <div className="mt-2 grid gap-3">
              {rows.map((r) => (
                <ReviewItemAdmin key={r.item.key} r={r} report={report} onChanged={onChanged} />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function statusTone(status: ReviewItemReport["status"]) {
  if (status === "concordam" || status === "respondido") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "divergem" || status === "ajustar" || status === "comparar") return "border-amber-300 bg-amber-50 text-amber-900";
  return "border-border bg-background text-muted";
}

function ReviewItemAdmin({ r, report, onChanged }: { r: ReviewItemReport; report: Report; onChanged: () => void }) {
  const question = reviewQuestion(r.item);
  const rq = question ? report.questions.find((q) => q.question.key === question.key) : undefined;
  const canConfirm = Boolean(question) && (r.item.section === "entendimento" || r.item.section === "alinhar");
  const [rule, setRule] = useState(() => ruleTextFor(r.item));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (!question || !window.confirm(`Salvar este texto como regra da ${question.number} e marcar como confirmada?`)) return;
    setBusy(true);
    const err = await adminAction({ action: "confirm_rule", questionKey: question.key, body: rule });
    setBusy(false);
    setError(err);
    if (!err) onChanged();
  }

  return (
    <article className="rounded-xl border border-border bg-background p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-semibold leading-snug">
          {question && <span className="mr-1.5 text-primary">{question.number}</span>}
          {reviewTitle(r.item)}
        </p>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusTone(r.status)}`}>
          {REVIEW_STATUS_LABEL[r.status]}
          {r.status === "aguardando" && r.waitingFor.length < r.item.audience.length
            ? `: falta ${r.waitingFor.map((s) => LABEL[s]).join(" e ")}`
            : ""}
        </span>
      </div>
      {r.item.text && <p className="mt-1 text-sm text-muted">{plainText(r.item.text)}</p>}

      <div className={`mt-3 grid gap-2 ${r.item.audience.length > 1 ? "md:grid-cols-2" : ""}`}>
        {r.item.audience.map((slot) => {
          const entry = r.bySlot[slot];
          const v = entry?.response.value;
          const choice = v ? choiceOf(r.item, v.choice) : undefined;
          return (
            <div key={slot} className="rounded-lg border border-border bg-surface p-3 text-sm">
              <p className="font-semibold">{LABEL[slot]}</p>
              {!entry ? (
                <p className="text-muted">Ainda não respondeu.</p>
              ) : (
                <>
                  <p className="text-xs text-muted">
                    {entry.complete ? "Revisado" : "Incompleto"} · {formatDateTime(entry.response.updatedAt)}
                  </p>
                  {choice && <p className="mt-1 font-medium">{choice.label}</p>}
                  {v?.comment.trim() && <p className="mt-1 whitespace-pre-wrap">{v.comment}</p>}
                  {v?.answer && question && (
                    <div className="mt-2 rounded-lg bg-background p-2">
                      <p className="text-xs font-semibold text-muted">Nova resposta</p>
                      {describeAnswer(question, v.answer).map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                      {v.answer.explanation && <p className="whitespace-pre-wrap">{v.answer.explanation}</p>}
                      {v.answer.complement && <p className="whitespace-pre-wrap text-muted">Complemento: {v.answer.complement}</p>}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {canConfirm && question && (
        <div className="mt-3">
          <p className="text-xs text-muted">
            Situação atual da {question.number}: {rq ? VALIDATION_LABEL[rq.validation] : "—"}
            {rq?.rule ? ` · regra versão ${rq.rule.version}` : ""}
          </p>
          <textarea
            aria-label={`Texto da regra da ${question.number}`}
            rows={4}
            value={rule}
            onChange={(e) => setRule(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={busy || !rule.trim()}
            onClick={confirm}
            className="mt-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            Salvar como regra e confirmar
          </button>
          {r.status !== "concordam" && (
            <span className="ml-2 text-xs text-muted">Os dois ainda não concordaram: ajuste o texto antes, se for o caso.</span>
          )}
          {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
        </div>
      )}
    </article>
  );
}
