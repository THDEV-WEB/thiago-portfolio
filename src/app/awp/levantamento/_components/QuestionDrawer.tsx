"use client";

import { useEffect, useRef } from "react";
import { moduleOfQuestion, questionByKey } from "../_content/questionario";
import type { ReviewSlot } from "../_content/revisao";
import type { SharedAnswers } from "../_lib/review-data";
import AnswerBody from "./AnswerBody";

const LABEL: Record<ReviewSlot, string> = { manoel: "Manoel", cadene: "Cadene" };

/** Janela com uma pergunta do questionário e as respostas dos dois. */
export default function QuestionDrawer({
  questionKey,
  shared,
  viewer,
  onClose,
}: {
  questionKey: string | null;
  shared: SharedAnswers;
  viewer?: ReviewSlot;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const question = questionKey ? questionByKey.get(questionKey) : undefined;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (question && !dialog.open) dialog.showModal();
    if (!question && dialog.open) dialog.close();
  }, [question]);

  const mod = questionKey ? moduleOfQuestion.get(questionKey) : undefined;

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-labelledby="pergunta-citada"
      className="m-auto max-h-[88vh] w-[calc(100%-1.5rem)] max-w-2xl overflow-y-auto rounded-2xl border border-border bg-surface p-0 text-foreground shadow-2xl backdrop:bg-black/40"
    >
      {question && (
        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              {mod && (
                <p className="text-xs font-medium text-muted">
                  Módulo {mod.number} · {mod.title}
                </p>
              )}
              <h2 id="pergunta-citada" className="mt-1 text-lg font-semibold leading-snug">
                <span className="mr-1.5 text-primary">{question.number}</span>
                {question.prompt}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 shrink-0 rounded-full border border-border bg-background px-4 text-sm font-medium"
            >
              Fechar
            </button>
          </div>
          <div className="mt-4 grid gap-3">
            {(["manoel", "cadene"] as const).map((slot) => (
              <section key={slot} className="rounded-xl border border-border bg-background p-3 sm:p-4">
                <h3 className="text-sm font-semibold">
                  {LABEL[slot]} respondeu{slot === viewer ? " (você)" : ""}
                </h3>
                <div className="mt-2">
                  <AnswerBody question={question} value={shared[question.key]?.[slot]} />
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </dialog>
  );
}
