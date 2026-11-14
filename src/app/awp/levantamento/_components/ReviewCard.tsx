"use client";

import { questionByKey, type QuestionDef } from "../_content/questionario";
import type { ReviewItemDef, ReviewSlot } from "../_content/revisao";
import { emptyAnswer, type AnswerValue } from "../_lib/answers";
import {
  choiceLabel,
  choiceOf,
  reviewMissing,
  reviewQuestion,
  reviewTitle,
  type ReviewValue,
} from "../_lib/review";
import type { SharedAnswers } from "../_lib/review-data";
import QuestionCard from "./QuestionCard";
import RichText from "./RichText";
import VoiceField from "./VoiceField";

const LABEL: Record<ReviewSlot, string> = { manoel: "Manoel", cadene: "Cadene" };
const SLOTS: ReviewSlot[] = ["manoel", "cadene"];

type CardProps = {
  item: ReviewItemDef;
  value: ReviewValue;
  viewer: ReviewSlot;
  shared: SharedAnswers;
  disabled: boolean;
  onChange: (value: ReviewValue) => void;
  onCommit: () => void;
  onRef: (questionKey: string) => void;
};

/** Primeira resposta, sem "Preciso discutir isso", para começar o "Responder de novo". */
function startingAnswer(shared: SharedAnswers, questionKey: string | undefined, viewer: ReviewSlot): AnswerValue {
  const original = questionKey ? shared[questionKey]?.[viewer] : undefined;
  return original ? { ...structuredClone(original), needs_discussion: false } : emptyAnswer();
}

export function ReviewCard({ item, value, viewer, shared, disabled, onChange, onCommit, onRef }: CardProps) {
  const question = reviewQuestion(item);
  const chosen = choiceOf(item, value.choice);
  const missing = reviewMissing(item, value);
  const done = missing.length === 0;
  const touched = value.choice !== "" || value.comment.trim() !== "";
  const id = item.key.replace(/\./g, "-");

  function choose(key: string) {
    const choice = choiceOf(item, key);
    onChange({
      ...value,
      choice: key,
      answer: choice?.reanswer ? (value.answer ?? startingAnswer(shared, item.questionKey, viewer)) : null,
    });
    onCommit();
  }

  return (
    <article id={`revisao-${id}`} className="min-w-0 scroll-mt-24 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold leading-snug">
          {question && <span className="mr-1.5 text-primary">{question.number}</span>}
          {reviewTitle(item)}
        </h3>
        {!item.optional && <DoneChip done={done} touched={touched} />}
      </div>

      {item.summary && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {SLOTS.filter((s) => item.summary?.[s]).map((slot) => (
            <div key={slot} className="rounded-xl border border-border bg-background p-3 text-sm leading-relaxed">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {LABEL[slot]} respondeu{slot === viewer ? " (você)" : ""}
              </p>
              <p className="mt-1">
                <RichText text={item.summary![slot]!} onRef={onRef} />
              </p>
            </div>
          ))}
        </div>
      )}

      {item.matrixComparison && question && <MatrixComparison question={question} shared={shared} viewer={viewer} />}

      {question && (item.summary || item.matrixComparison) && (
        <button
          type="button"
          onClick={() => onRef(question.key)}
          className="mt-2 min-h-11 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Ver as respostas completas da {question.number}
        </button>
      )}

      {item.why && (
        <p className="mt-3 text-base leading-relaxed">
          <span className="font-semibold">Pergunto porque: </span>
          <RichText text={item.why} onRef={onRef} />
        </p>
      )}

      {(item.text || item.bullets) && (
        <div className="mt-3 rounded-xl border-l-4 border-primary bg-primary/5 px-4 py-3 text-base leading-relaxed">
          {item.section === "alinhar" && <p className="text-xs font-semibold uppercase tracking-widest text-primary">Proposta</p>}
          {item.text && (
            <p className={item.section === "alinhar" ? "mt-1" : ""}>
              <RichText text={item.text} onRef={onRef} />
            </p>
          )}
          {item.bullets && (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {item.bullets.map((b) => (
                <li key={b}>
                  <RichText text={b} onRef={onRef} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {item.choices.length > 0 && (
        <fieldset className="mt-4" disabled={disabled}>
          <legend className="sr-only">{reviewTitle(item)}</legend>
          <div className="grid gap-2">
            {item.choices.map((c) => {
              const checked = value.choice === c.key;
              return (
                <label
                  key={c.key}
                  className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-base transition-colors ${
                    checked ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  <input
                    type="radio"
                    name={`revisao-${id}`}
                    checked={checked}
                    onChange={() => choose(c.key)}
                    className="h-5 w-5 shrink-0 accent-[var(--primary)]"
                  />
                  <span className="flex-1">{choiceLabel(item, c, viewer)}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {chosen?.reanswer && question && (
        <div className="mt-4">
          <p className="mb-2 text-sm text-muted">Sua nova resposta, no mesmo formato do questionário:</p>
          <fieldset disabled={disabled}>
            <QuestionCard
              question={question}
              value={value.answer ?? startingAnswer(shared, question.key, viewer)}
              onChange={(answer) => onChange({ ...value, answer })}
              onCommit={onCommit}
              hideDiscussion
            />
          </fieldset>
        </div>
      )}

      {(item.choices.length === 0 || chosen) && (
        <fieldset className="mt-4" disabled={disabled}>
          <VoiceField
            id={`${id}-comentario`}
            label={
              item.choices.length === 0
                ? "Sua resposta (opcional)"
                : chosen?.commentRequired
                  ? (chosen.commentLabel ?? "Comentário")
                  : "Comentário (opcional)"
            }
            required={Boolean(chosen?.commentRequired)}
            rows={3}
            value={value.comment}
            onChange={(comment) => onChange({ ...value, comment })}
            onBlur={onCommit}
          />
        </fieldset>
      )}

      {!item.optional && touched && missing.length > 0 && (
        <ul className="mt-3 space-y-0.5 text-sm text-muted">
          {missing.map((m) => (
            <li key={m}>• {m}</li>
          ))}
        </ul>
      )}
    </article>
  );
}

function DoneChip({ done, touched }: { done: boolean; touched: boolean }) {
  const [label, cls] = done
    ? ["Revisado", "border-emerald-200 bg-emerald-50 text-emerald-800"]
    : touched
      ? ["Falta completar", "border-amber-200 bg-amber-50 text-amber-800"]
      : ["Falta revisar", "border-border bg-background text-muted"];
  return <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>{label}</span>;
}

/** Tabela 3.4 linha a linha: onde os dois concordaram e onde divergiram. */
function MatrixComparison({ question, shared, viewer }: { question: QuestionDef; shared: SharedAnswers; viewer: ReviewSlot }) {
  const answers = shared[question.key] ?? {};
  const criterion = (slot: ReviewSlot, rowKey: string) => {
    const cell = answers[slot]?.matrix[rowKey];
    const c = question.criteria?.find((x) => x.key === cell?.criterion);
    if (!c) return "";
    return c.other && cell?.other ? `${c.label}: ${cell.other}` : c.label;
  };
  const rows = (question.rows ?? []).map((row) => {
    const m = criterion("manoel", row.key);
    const c = criterion("cadene", row.key);
    return { row, m, c, same: m === c };
  });
  const same = rows.filter((r) => r.same);
  const different = rows.filter((r) => !r.same);
  const head = (slot: ReviewSlot) => `${LABEL[slot]} respondeu${slot === viewer ? " (você)" : ""}`;

  return (
    <div className="mt-3 grid min-w-0 grid-cols-1 gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold">Os dois responderam igual em {same.length} tipos:</p>
        <div className="mt-2 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-background text-xs text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Tipo de despesa</th>
                <th className="px-3 py-2 font-medium">Manoel e Cadene</th>
              </tr>
            </thead>
            <tbody>
              {same.map(({ row, m }) => (
                <tr key={row.key} className="border-t border-border">
                  <td className="px-3 py-2">{row.label}</td>
                  <td className="px-3 py-2">{m || "(ninguém preencheu)"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold">Responderam diferente em {different.length}:</p>
        {/* No celular, três colunas não cabem: um bloco por tipo de despesa. */}
        <ul className="mt-2 grid gap-2 sm:hidden">
          {different.map(({ row, m, c }) => (
            <li key={row.key} className="rounded-xl border border-border bg-background p-3 text-sm leading-relaxed">
              <p className="font-semibold">{row.label}</p>
              <p className="mt-1">
                <span className="text-muted">{head("manoel")}: </span>
                {m || "(sem resposta)"}
              </p>
              <p>
                <span className="text-muted">{head("cadene")}: </span>
                {c || "(sem resposta)"}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-2 hidden overflow-x-auto rounded-xl border border-border sm:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-background text-xs text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Tipo de despesa</th>
                <th className="px-3 py-2 font-medium">{head("manoel")}</th>
                <th className="px-3 py-2 font-medium">{head("cadene")}</th>
              </tr>
            </thead>
            <tbody>
              {different.map(({ row, m, c }) => (
                <tr key={row.key} className="border-t border-border">
                  <td className="px-3 py-2">{row.label}</td>
                  <td className="px-3 py-2">{m || "(sem resposta)"}</td>
                  <td className="px-3 py-2">{c || "(sem resposta)"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

type DoubtProps = {
  items: ReviewItemDef[];
  values: Record<string, ReviewValue>;
  disabled: boolean;
  onChange: (key: string, value: ReviewValue) => void;
  onCommit: () => void;
  onRef: (questionKey: string) => void;
};

/** As marcações "Preciso discutir isso" do Cadene, uma por linha. */
export function DoubtGroup({ items, values, disabled, onChange, onCommit, onRef }: DoubtProps) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {items.map((item) => {
        const question = questionByKey.get(item.questionKey ?? "");
        const value = values[item.key] ?? { choice: "", comment: "", answer: null };
        const chosen = choiceOf(item, value.choice);
        const done = reviewMissing(item, value).length === 0;
        const id = item.key.replace(/\./g, "-");
        return (
          <article key={item.key} id={`revisao-${id}`} className="min-w-0 scroll-mt-24 rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <p className="text-base font-semibold leading-snug">
                <span className="mr-1.5 text-primary">{question?.number}</span>
                {question?.prompt}{" "}
                {question && (
                  <button
                    type="button"
                    onClick={() => onRef(question.key)}
                    className="mx-0.5 inline-flex items-center rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 align-baseline text-[0.85em] font-semibold text-primary hover:bg-primary/10"
                  >
                    ver {question.number}
                  </button>
                )}
              </p>
              <DoneChip done={done} touched={value.choice !== ""} />
            </div>
            <fieldset className="mt-3 grid gap-2 sm:grid-cols-2" disabled={disabled}>
              <legend className="sr-only">A dúvida da {question?.number} continua?</legend>
              {item.choices.map((c) => (
                <label
                  key={c.key}
                  className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-base ${
                    value.choice === c.key ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  <input
                    type="radio"
                    name={`revisao-${id}`}
                    checked={value.choice === c.key}
                    onChange={() => {
                      onChange(item.key, { ...value, choice: c.key, answer: null });
                      onCommit();
                    }}
                    className="h-5 w-5 shrink-0 accent-[var(--primary)]"
                  />
                  <span>{c.label}</span>
                </label>
              ))}
            </fieldset>
            {chosen?.commentRequired && (
              <fieldset className="mt-3" disabled={disabled}>
                <VoiceField
                  id={`${id}-comentario`}
                  label={chosen.commentLabel ?? "Comentário"}
                  required
                  rows={3}
                  value={value.comment}
                  onChange={(comment) => onChange(item.key, { ...value, comment })}
                  onBlur={onCommit}
                />
              </fieldset>
            )}
          </article>
        );
      })}
    </div>
  );
}
