"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ModuleDef } from "../_content/questionario";
import { emptyAnswer, individualStatus } from "../_lib/answers";
import { formatTime } from "../_lib/format";
import { BASE_PATH_CLIENT, readStored, writeStored } from "./client-storage";
import QuestionCard from "./QuestionCard";
import { useAutosave, type InitialAnswers, type SaveState } from "./useAutosave";

type Props = {
  modules: ModuleDef[];
  participant: { id: string; name: string; isAdmin: boolean };
  initialAnswers: InitialAnswers;
};

export default function Questionnaire({ modules, participant, initialAnswers }: Props) {
  const router = useRouter();
  const { answers, update, flush, state, pendingCount } = useAutosave(participant.id, initialAnswers);
  const moduleKey = `awp-lv-modulo:${participant.id}`;
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const saved = Number(readStored(moduleKey));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- volta ao último módulo aberto neste aparelho
    if (Number.isInteger(saved) && saved > 0 && saved < modules.length) setCurrent(saved);
  }, [moduleKey, modules.length]);

  function goTo(index: number) {
    void flush();
    setCurrent(index);
    writeStored(moduleKey, String(index));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const answeredIn = (m: ModuleDef) =>
    m.questions.filter((q) => individualStatus(q, answers[q.key]) === "respondida").length;
  const total = modules.reduce((n, m) => n + m.questions.length, 0);
  const answered = modules.reduce((n, m) => n + answeredIn(m), 0);
  const mod = modules[current];

  async function switchParticipant() {
    if (!window.confirm("Sair deste participante neste aparelho? As respostas já salvas continuam guardadas.")) return;
    await flush();
    await fetch(`${BASE_PATH_CLIENT}/api/participant`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pb-32 pt-5 sm:px-6 sm:pt-8">
      <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-base">
            Respondendo como <strong className="font-semibold">{participant.name}</strong>
            <span className="ml-1 text-xs text-muted">(identificação declarada)</span>
          </p>
          <button type="button" onClick={switchParticipant} className="min-h-11 text-sm font-medium text-primary hover:underline">
            Não é você? Trocar
          </button>
        </div>
        {participant.isAdmin && (
          <p className="mt-2 rounded-lg bg-primary/5 px-3 py-2 text-sm text-primary">
            Respostas registradas como administrador (complementos do Thiago).
          </p>
        )}
        <div className="mt-3">
          <div className="flex justify-between text-sm text-muted">
            <span>Progresso</span>
            <span>
              {answered} de {total} respondidas
            </span>
          </div>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-background" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={answered}>
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(answered / total) * 100}%` }} />
          </div>
        </div>
      </section>

      <nav aria-label="Módulos" className="-mx-4 mt-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ol className="flex gap-2 pb-1 sm:flex-wrap">
          {modules.map((m, i) => {
            const done = answeredIn(m);
            const active = i === current;
            return (
              <li key={m.key} className="shrink-0">
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-current={active ? "step" : undefined}
                  className={`min-h-11 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : done === m.questions.length
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-border bg-surface text-foreground"
                  }`}
                >
                  {m.number}. {m.title.split(" ")[0].replace(/[,;]$/, "")} · {done}/{m.questions.length}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <section className="mt-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          Módulo {mod.number} de {modules.length}
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">{mod.title}</h2>
        <p className="mt-2 text-base leading-relaxed text-muted">{mod.objective}</p>
        {mod.guidance && (
          <p className="mt-3 rounded-xl border-l-4 border-primary bg-surface px-4 py-3 text-sm leading-relaxed">{mod.guidance}</p>
        )}

        <div className="mt-5 grid gap-4">
          {mod.questions.map((q) => (
            <QuestionCard
              key={q.key}
              question={q}
              value={answers[q.key] ?? emptyAnswer()}
              onChange={(v) => update(q.key, v)}
              onCommit={() => void flush()}
            />
          ))}
        </div>

        <div className="mt-6 flex flex-wrap justify-between gap-3">
          {current > 0 ? (
            <button type="button" onClick={() => goTo(current - 1)} className="min-h-12 rounded-xl border border-border bg-surface px-5 py-3 text-base font-medium">
              ← Módulo anterior
            </button>
          ) : (
            <span />
          )}
          {current < modules.length - 1 ? (
            <button type="button" onClick={() => goTo(current + 1)} className="min-h-12 rounded-xl bg-primary px-5 py-3 text-base font-semibold text-primary-foreground">
              Próximo módulo →
            </button>
          ) : (
            <p className="max-w-sm text-sm leading-relaxed text-muted">
              Este é o último módulo. Suas respostas ficam salvas automaticamente; você pode voltar a qualquer momento
              para revisar ou completar.
            </p>
          )}
        </div>
      </section>

      <SaveIndicator state={state} pendingCount={pendingCount} />
    </main>
  );
}

function SaveIndicator({ state, pendingCount }: { state: SaveState; pendingCount: number }) {
  let text = "Respostas salvas automaticamente";
  let tone = "border-border bg-surface text-muted";
  if (state.kind === "saving") text = "Salvando…";
  if (state.kind === "saved") {
    text = `Salvo às ${formatTime(state.at)}`;
    tone = "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (state.kind === "offline") {
    text = "Sem internet: as respostas estão guardadas neste aparelho e serão enviadas quando a conexão voltar";
    tone = "border-amber-300 bg-amber-50 text-amber-900";
  }
  if (state.kind === "error") {
    text = state.message;
    tone = "border-red-200 bg-red-50 text-red-800";
  }
  if (state.kind !== "saving" && state.kind !== "offline" && state.kind !== "error" && pendingCount > 0) {
    text = "Alterações aguardando envio…";
    tone = "border-border bg-surface text-muted";
  }
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4">
      <p role="status" aria-live="polite" className={`pointer-events-auto max-w-md rounded-full border px-4 py-2 text-center text-sm font-medium shadow-lg ${tone}`}>
        {text}
      </p>
    </div>
  );
}
