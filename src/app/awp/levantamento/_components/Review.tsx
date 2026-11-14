"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { questionByKey, questionnaire } from "../_content/questionario";
import { AGREED_QUESTIONS, REVIEW_SECTIONS, type ReviewSlot } from "../_content/revisao";
import { describeAnswer } from "../_lib/answers";
import { SECTION_ORDER, emptyReview, itemsFor, reviewComplete, type ReviewValue } from "../_lib/review";
import type { SharedAnswers } from "../_lib/review-data";
import AnswerBody from "./AnswerBody";
import { BASE_PATH_CLIENT } from "./client-storage";
import QuestionDrawer from "./QuestionDrawer";
import { DoubtGroup, ReviewCard } from "./ReviewCard";
import SaveIndicator from "./SaveIndicator";
import { useReviewAutosave, type InitialReviews } from "./useAutosave";

type Props = {
  participant: { id: string; name: string; slot: ReviewSlot };
  shared: SharedAnswers;
  initial: InitialReviews;
  /** Revisão encerrada: tudo só leitura. */
  closed?: boolean;
  /** Prévia do administrador: só leitura e nada é salvo. */
  preview?: boolean;
};

export default function Review({ participant, shared, initial, closed = false, preview = false }: Props) {
  const router = useRouter();
  const { values, update, flush, state, pendingCount } = useReviewAutosave(participant.id, initial);
  const [tab, setTab] = useState<"revisao" | "respostas">("revisao");
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);
  const readOnly = closed || preview;
  const viewer = participant.slot;

  const mine = itemsFor(viewer);
  const required = mine.filter((i) => !i.optional);
  const done = required.filter((i) => reviewComplete(i, values[i.key])).length;
  const valueOf = (key: string): ReviewValue => values[key] ?? emptyReview();
  const change = (key: string, value: ReviewValue) => {
    if (!readOnly) update(key, value);
  };
  const commit = () => {
    if (!readOnly) void flush();
  };

  async function switchParticipant() {
    if (preview) return;
    if (!window.confirm("Sair deste participante neste aparelho? As respostas já salvas continuam guardadas.")) return;
    await flush();
    await fetch(`${BASE_PATH_CLIENT}/api/participant`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pb-32 pt-5 sm:px-6 sm:pt-8">
      {preview && (
        <p className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Prévia do administrador: esta é a revisão como o {viewer === "manoel" ? "Manoel" : "Cadene"} vê. Nada aqui é salvo.
        </p>
      )}
      {closed && !preview && (
        <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          A revisão foi encerrada. Obrigado! Suas respostas continuam aqui para consulta.
        </p>
      )}

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Revisão das respostas</p>
        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-base">
            Respondendo como <strong className="font-semibold">{participant.name}</strong>
          </p>
          {!preview && (
            <button type="button" onClick={switchParticipant} className="min-h-11 text-sm font-medium text-primary hover:underline">
              Não é você? Trocar
            </button>
          )}
        </div>
        <p className="mt-2 text-base leading-relaxed text-muted">
          Comparei as respostas de vocês dois. Nesta revisão, cada um vê também a resposta do outro. Tudo o que você
          responder aqui fica salvo sozinho, e dá para parar e continuar depois. As respostas do questionário não
          mudam: correções entram por aqui.
        </p>
        <div className="mt-3">
          <div className="flex justify-between text-sm text-muted">
            <span>Progresso</span>
            <span>
              {done} de {required.length} itens revisados
            </span>
          </div>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-background" role="progressbar" aria-valuemin={0} aria-valuemax={required.length} aria-valuenow={done}>
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(done / Math.max(required.length, 1)) * 100}%` }} />
          </div>
        </div>
      </section>

      <div className="mt-4 flex gap-2" role="tablist" aria-label="O que ver">
        {(
          [
            ["revisao", "Revisão"],
            ["respostas", "Minhas respostas do questionário"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`min-h-11 rounded-full border px-4 py-2 text-sm font-medium ${
              tab === key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "respostas" ? (
        <MyAnswers shared={shared} viewer={viewer} />
      ) : (
        <>
          <AgreedList shared={shared} onRef={setOpenQuestion} />

          {SECTION_ORDER.map((section) => {
            const items = mine.filter((i) => i.section === section);
            if (items.length === 0) return null;
            const info = REVIEW_SECTIONS[section];
            return (
              <section key={section} className="mt-8" aria-labelledby={`secao-${section}`}>
                <h2 id={`secao-${section}`} className="text-2xl font-bold tracking-tight">
                  {info.title}
                </h2>
                {info.intro && <p className="mt-2 text-base leading-relaxed text-muted">{info.intro}</p>}
                <div className="mt-4 grid grid-cols-1 gap-4">
                  {section === "duvida" ? (
                    <DoubtGroup items={items} values={values} disabled={readOnly} onChange={change} onCommit={commit} onRef={setOpenQuestion} />
                  ) : (
                    items.map((item) => (
                      <ReviewCard
                        key={item.key}
                        item={item}
                        value={valueOf(item.key)}
                        viewer={viewer}
                        shared={shared}
                        disabled={readOnly}
                        onChange={(v) => change(item.key, v)}
                        onCommit={commit}
                        onRef={setOpenQuestion}
                      />
                    ))
                  )}
                </div>
              </section>
            );
          })}

          <p className="mt-8 rounded-2xl border border-border bg-surface p-4 text-base leading-relaxed">
            {done === required.length
              ? "Pronto: você revisou todos os itens. Obrigado! Se lembrar de mais alguma coisa, pode voltar e mudar quando quiser."
              : `Faltam ${required.length - done} itens. Suas respostas ficam salvas: pode parar e continuar depois.`}
          </p>
        </>
      )}

      <QuestionDrawer questionKey={openQuestion} shared={shared} viewer={viewer} onClose={() => setOpenQuestion(null)} />
      {!readOnly && <SaveIndicator state={state} pendingCount={pendingCount} />}
    </main>
  );
}

/** "Vocês responderam igual em 17 das 36", para consulta. */
function AgreedList({ shared, onRef }: { shared: SharedAnswers; onRef: (questionKey: string) => void }) {
  return (
    <details className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
      <summary className="cursor-pointer text-lg font-semibold text-emerald-900">
        Vocês responderam igual em {AGREED_QUESTIONS.length} das {questionByKey.size} perguntas
      </summary>
      <p className="mt-2 text-sm text-emerald-900/80">Nada para fazer aqui. Toque em uma pergunta para ver as respostas dos dois.</p>
      <ul className="mt-3 grid gap-2">
        {AGREED_QUESTIONS.map((key) => {
          const q = questionByKey.get(key)!;
          const answer = shared[key]?.manoel ?? shared[key]?.cadene;
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => onRef(key)}
                className="w-full rounded-xl border border-emerald-200 bg-surface px-4 py-3 text-left text-sm hover:border-emerald-400"
              >
                <span className="font-semibold">
                  <span className="mr-1.5 text-primary">{q.number}</span>
                  {q.prompt}
                </span>
                {answer && <span className="mt-0.5 block text-muted">Os dois: {describeAnswer(q, answer).join(" · ")}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </details>
  );
}

/** Questionário original, só para leitura. */
function MyAnswers({ shared, viewer }: { shared: SharedAnswers; viewer: ReviewSlot }) {
  return (
    <div className="mt-6">
      <p className="rounded-xl border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-muted">
        Durante a revisão, o questionário fica só para leitura. Para corrigir alguma resposta, use a revisão: no fim
        dela há o campo “Quer mudar mais alguma resposta?”.
      </p>
      {questionnaire.map((m) => (
        <section key={m.key} className="mt-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Módulo {m.number}</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight">{m.title}</h2>
          <div className="mt-3 grid gap-3">
            {m.questions.map((q) => (
              <article key={q.key} className="rounded-2xl border border-border bg-surface p-4">
                <h3 className="text-base font-semibold leading-snug">
                  <span className="mr-1.5 text-primary">{q.number}</span>
                  {q.prompt}
                </h3>
                <div className="mt-2">
                  <AnswerBody question={q} value={shared[q.key]?.[viewer]} />
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
