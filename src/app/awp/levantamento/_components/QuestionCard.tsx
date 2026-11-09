"use client";

import { useState } from "react";
import type { OptionDef, QuestionDef } from "../_content/questionario";
import {
  explanationRequired,
  explanationVisible,
  individualStatus,
  missingParts,
  type AnswerValue,
  type MatrixCell,
} from "../_lib/answers";
import VoiceField from "./VoiceField";

type Props = {
  question: QuestionDef;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  /** Gravar já (ao sair de um campo). */
  onCommit: () => void;
};

const inputClass =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

export default function QuestionCard({ question, value, onChange, onCommit }: Props) {
  const status = individualStatus(question, value);
  const missing = status === "em_andamento" ? missingParts(question, value) : [];
  const [showComplement, setShowComplement] = useState(value.complement.trim() !== "");
  const set = (patch: Partial<AnswerValue>) => onChange({ ...value, ...patch });
  const fieldId = (suffix: string) => `${question.key.replace(".", "-")}-${suffix}`;
  const otherOption = question.options?.find((o) => o.other);

  function toggle(option: OptionDef) {
    if (question.kind === "single") {
      set({ selected: [option.key] });
    } else {
      const has = value.selected.includes(option.key);
      set({ selected: has ? value.selected.filter((k) => k !== option.key) : [...value.selected, option.key] });
    }
    onCommit();
  }

  function setCell(rowKey: string, patch: Partial<MatrixCell>) {
    const cell = { ...(value.matrix[rowKey] ?? {}), ...patch };
    const matrix = { ...value.matrix, [rowKey]: cell };
    if (!cell.criterion && !cell.other && !cell.label) delete matrix[rowKey];
    set({ matrix });
  }

  return (
    <article
      id={question.key}
      className="scroll-mt-24 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-6"
      aria-labelledby={fieldId("titulo")}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 id={fieldId("titulo")} className="text-lg font-semibold leading-snug text-foreground">
          <span className="mr-1.5 text-primary">{question.number}</span>
          {question.prompt}
        </h3>
        <StatusChip status={status} />
      </div>
      {question.kind === "multi" && <p className="mt-1 text-sm text-muted">Pode marcar mais de uma.</p>}

      {question.options && (
        <fieldset className="mt-4">
          <legend className="sr-only">{question.prompt}</legend>
          <div className="grid gap-2">
            {question.options.map((option) => {
              const checked = value.selected.includes(option.key);
              return (
                <label
                  key={option.key}
                  className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-base transition-colors ${
                    checked ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  <input
                    type={question.kind === "single" ? "radio" : "checkbox"}
                    name={question.key}
                    checked={checked}
                    onChange={() => toggle(option)}
                    className="h-5 w-5 shrink-0 accent-[var(--primary)]"
                  />
                  <span className="flex-1">{option.label}</span>
                  {option.proposed && <SuggestionTag />}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {otherOption && value.selected.includes(otherOption.key) && (
        <div className="mt-3">
          <label htmlFor={fieldId("outro")} className="block text-sm font-semibold">
            Qual?
          </label>
          <input
            id={fieldId("outro")}
            value={value.other_text}
            onChange={(e) => set({ other_text: e.target.value })}
            onBlur={onCommit}
            className={`mt-2 ${inputClass}`}
          />
        </div>
      )}

      {question.kind === "matrix" && <MatrixRows question={question} value={value} setCell={setCell} onCommit={onCommit} fieldId={fieldId} />}

      {explanationVisible(question, value) && (
        <div className="mt-4">
          <VoiceField
            id={fieldId("explicacao")}
            label={question.explanation?.label ?? "Explicação"}
            help={question.explanation?.help}
            required={explanationRequired(question, value)}
            placeholder={
              question.hints
                ? `Exemplos${question.hints.proposed ? " (sugestão)" : ""}: ${question.hints.text}`
                : undefined
            }
            rows={question.kind === "text" ? 5 : 3}
            value={value.explanation}
            onChange={(explanation) => set({ explanation })}
            onBlur={onCommit}
          />
        </div>
      )}

      {question.extraFields?.map((field) => (
        <div key={field.key} className="mt-4">
          <label htmlFor={fieldId(field.key)} className="block text-sm font-semibold">
            {field.label}
          </label>
          {field.help && <p className="mt-1 text-sm text-muted">{field.help}</p>}
          <input
            id={fieldId(field.key)}
            value={value.extra[field.key] ?? ""}
            onChange={(e) => set({ extra: { ...value.extra, [field.key]: e.target.value } })}
            onBlur={onCommit}
            className={`mt-2 ${inputClass}`}
          />
        </div>
      ))}

      <div className="mt-4">
        {showComplement ? (
          <VoiceField
            id={fieldId("complemento")}
            label="Complemento ou exemplo (opcional)"
            rows={3}
            value={value.complement}
            onChange={(complement) => set({ complement })}
            onBlur={onCommit}
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowComplement(true)}
            className="min-h-11 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            + Adicionar complemento ou exemplo
          </button>
        )}
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 px-4 py-3">
        <input
          type="checkbox"
          checked={value.needs_discussion}
          onChange={(e) => {
            set({ needs_discussion: e.target.checked });
            onCommit();
          }}
          className="mt-0.5 h-5 w-5 shrink-0 accent-amber-600"
        />
        <span>
          <span className="block text-base font-semibold text-amber-900">Preciso discutir isso</span>
          <span className="block text-sm text-amber-900/80">
            Marque se ainda não tem certeza ou quer conversar sobre este ponto. A resposta pode ficar incompleta.
          </span>
        </span>
      </label>

      {missing.length > 0 && (
        <ul className="mt-3 space-y-0.5 text-sm text-muted">
          {missing.map((m) => (
            <li key={m}>• {m}</li>
          ))}
        </ul>
      )}
    </article>
  );
}

function MatrixRows({
  question,
  value,
  setCell,
  onCommit,
  fieldId,
}: {
  question: QuestionDef;
  value: AnswerValue;
  setCell: (rowKey: string, patch: Partial<MatrixCell>) => void;
  onCommit: () => void;
  fieldId: (suffix: string) => string;
}) {
  return (
    <div className="mt-4 grid gap-3">
      <p className="text-sm text-muted">Escolha o critério de distribuição para cada tipo de despesa.</p>
      {question.rows?.map((row) => {
        const cell = value.matrix[row.key] ?? {};
        const criterion = question.criteria?.find((c) => c.key === cell.criterion);
        return (
          <div key={row.key} className="rounded-xl border border-border bg-background p-3 sm:p-4">
            {row.other ? (
              <>
                <label htmlFor={fieldId(`${row.key}-nome`)} className="block text-base font-semibold">
                  {row.label} <span className="font-normal text-muted">(opcional)</span>
                </label>
                <input
                  id={fieldId(`${row.key}-nome`)}
                  placeholder="Qual tipo?"
                  value={cell.label ?? ""}
                  onChange={(e) => setCell(row.key, { label: e.target.value })}
                  onBlur={onCommit}
                  className={`mt-2 ${inputClass}`}
                />
              </>
            ) : (
              <p className="text-base font-semibold">{row.label}</p>
            )}
            <select
              aria-label={`Critério para ${row.label}`}
              value={cell.criterion ?? ""}
              onChange={(e) => {
                setCell(row.key, { criterion: e.target.value || undefined });
                onCommit();
              }}
              className={`mt-2 ${inputClass}`}
            >
              <option value="">Escolha o critério…</option>
              {question.criteria?.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
            {criterion?.other && (
              <input
                aria-label={`Outro critério para ${row.label}`}
                placeholder="Qual critério?"
                value={cell.other ?? ""}
                onChange={(e) => setCell(row.key, { other: e.target.value })}
                onBlur={onCommit}
                className={`mt-2 ${inputClass}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SuggestionTag() {
  return (
    <span
      title="Alternativa sugerida, ainda em validação. Se nenhuma servir, use Outro."
      className="shrink-0 rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted"
    >
      sugestão
    </span>
  );
}

function StatusChip({ status }: { status: ReturnType<typeof individualStatus> }) {
  const map = {
    respondida: ["Respondida", "border-emerald-200 bg-emerald-50 text-emerald-800"],
    em_andamento: ["Em andamento", "border-amber-200 bg-amber-50 text-amber-800"],
    nao_iniciada: ["Não respondida", "border-border bg-background text-muted"],
  } as const;
  const [label, cls] = map[status];
  return <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>{label}</span>;
}
