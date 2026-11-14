// Regras da revisão (segunda rodada): formato das respostas, o que conta como
// revisado, rótulos e a visão consolidada do painel. Funções puras, usadas
// pela tela, pela API, pelo painel e pelo PDF.
import { allQuestions, questionByKey, type QuestionDef } from "../_content/questionario";
import {
  reviewItems,
  type ReviewChoice,
  type ReviewItemDef,
  type ReviewSection,
  type ReviewSlot,
} from "../_content/revisao";
import { TEXT_LIMIT, individualStatus, normalizeAnswer, type AnswerValue } from "./answers";
import type { AdminData, ParticipantRow, ReviewRow } from "./data";

export type Phase = "questionario" | "revisao" | "encerrado";
export const PHASES: Phase[] = ["questionario", "revisao", "encerrado"];
export const PHASE_LABEL: Record<Phase, string> = {
  questionario: "Questionário aberto",
  revisao: "Revisão aberta (questionário só leitura)",
  encerrado: "Encerrado (tudo só leitura)",
};

export type ReviewValue = {
  choice: string;
  comment: string;
  /** Nova resposta no formato do questionário ("Responder de novo"). */
  answer: AnswerValue | null;
};

export function emptyReview(): ReviewValue {
  return { choice: "", comment: "", answer: null };
}

export function reviewTitle(item: ReviewItemDef): string {
  return item.title ?? questionByKey.get(item.questionKey ?? "")?.prompt ?? item.key;
}

export function reviewQuestion(item: ReviewItemDef): QuestionDef | undefined {
  return item.questionKey ? questionByKey.get(item.questionKey) : undefined;
}

export function choiceOf(item: ReviewItemDef, key: string): ReviewChoice | undefined {
  return item.choices.find((c) => c.key === key);
}

/** Rótulo da opção para quem está respondendo ("Fico com a minha resposta"). */
export function choiceLabel(item: ReviewItemDef, choice: ReviewChoice, viewer?: ReviewSlot): string {
  if (item.section === "alinhar" && viewer && choice.key === viewer) return "Fico com a minha resposta";
  return choice.label;
}

/** Converte o que veio da rede numa resposta válida para o item. */
export function normalizeReview(item: ReviewItemDef, raw: unknown): ReviewValue {
  const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const choice = typeof input.choice === "string" ? choiceOf(item, input.choice) : undefined;
  const comment = typeof input.comment === "string" ? input.comment.slice(0, TEXT_LIMIT) : "";
  const question = reviewQuestion(item);
  const answer =
    choice?.reanswer && question ? { ...normalizeAnswer(question, input.answer), needs_discussion: false } : null;
  return { choice: choice?.key ?? "", comment, answer };
}

/** O que falta para o item contar como revisado (vazio = revisado). */
export function reviewMissing(item: ReviewItemDef, value: ReviewValue | undefined): string[] {
  if (item.choices.length === 0) return value?.comment.trim() ? [] : ["Escreva a resposta."];
  const choice = value ? choiceOf(item, value.choice) : undefined;
  if (!value || !choice) return ["Escolha uma opção."];
  const missing: string[] = [];
  if (choice.commentRequired && !value.comment.trim()) missing.push(`Escreva: ${choice.commentLabel ?? "comentário"}`);
  const question = reviewQuestion(item);
  if (choice.reanswer && question && individualStatus(question, value.answer ?? undefined) !== "respondida") {
    missing.push("Complete a nova resposta.");
  }
  return missing;
}

export function reviewComplete(item: ReviewItemDef, value: ReviewValue | undefined): boolean {
  return reviewMissing(item, value).length === 0;
}

export function itemsFor(slot: ReviewSlot): ReviewItemDef[] {
  return reviewItems.filter((i) => i.audience.includes(slot));
}

export function requiredItemsFor(slot: ReviewSlot): ReviewItemDef[] {
  return itemsFor(slot).filter((i) => !i.optional);
}

export const SECTION_ORDER: ReviewSection[] = ["entendimento", "alinhar", "nova", "completar", "duvida", "final"];

// Marcadores {3.6} nos textos.
const REF = /\{(\d+\.\d+)\}/g;
const questionByNumber = new Map(allQuestions.map((q) => [q.number, q]));

export type TextPart = { kind: "text"; value: string } | { kind: "ref"; number: string; questionKey: string };

export function splitRefs(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let last = 0;
  for (const m of text.matchAll(REF)) {
    const q = questionByNumber.get(m[1]);
    if ((m.index ?? 0) > last) parts.push({ kind: "text", value: text.slice(last, m.index) });
    parts.push(q ? { kind: "ref", number: m[1], questionKey: q.key } : { kind: "text", value: m[0] });
    last = (m.index ?? 0) + m[0].length;
  }
  if (last < text.length) parts.push({ kind: "text", value: text.slice(last) });
  return parts;
}

/** Números de pergunta citados no texto (para conferir o conteúdo). */
export function referencedNumbers(text: string): string[] {
  return [...text.matchAll(REF)].map((m) => m[1]);
}

/** Texto sem marcadores, para regra consolidada e PDF: "{3.6}" vira "(ver 3.6)". */
export function plainText(text: string): string {
  return text.replace(REF, "(ver $1)");
}

/** Texto sugerido para a regra consolidada a partir do item. */
export function ruleTextFor(item: ReviewItemDef): string {
  let body = item.text ?? "";
  if (item.section === "entendimento") {
    body = body.replace(/^Entendi que\s+/, "");
    body = body.charAt(0).toUpperCase() + body.slice(1);
  }
  const bullets = (item.bullets ?? []).map((b) => `- ${b}`).join("\n");
  return plainText([body, bullets].filter(Boolean).join("\n"));
}

// Visão consolidada do painel.

export type ReviewEntry = { response: ReviewRow; participant: ParticipantRow; complete: boolean };

export type ReviewItemStatus = "aguardando" | "concordam" | "divergem" | "ajustar" | "comparar" | "respondido" | "informativo";

export const REVIEW_STATUS_LABEL: Record<ReviewItemStatus, string> = {
  aguardando: "Aguardando resposta",
  concordam: "Os dois concordaram",
  divergem: "Ainda divergem",
  ajustar: "Pediram ajuste",
  comparar: "Responderam de novo: comparar",
  respondido: "Respondido",
  informativo: "Texto livre",
};

export type ReviewItemReport = {
  item: ReviewItemDef;
  bySlot: Record<ReviewSlot, ReviewEntry | undefined>;
  status: ReviewItemStatus;
  /** Quem ainda falta, quando aguardando. */
  waitingFor: ReviewSlot[];
};

export type ReviewReport = {
  phase: Phase;
  items: ReviewItemReport[];
  progress: Record<ReviewSlot, { done: number; total: number }>;
};

const SLOTS: ReviewSlot[] = ["manoel", "cadene"];

function statusOf(item: ReviewItemDef, bySlot: Record<ReviewSlot, ReviewEntry | undefined>): ReviewItemStatus {
  if (item.choices.length === 0) return "informativo";
  const done = item.audience.filter((s) => bySlot[s]?.complete);
  if (done.length < item.audience.length) return "aguardando";
  if (item.audience.length === 1) return "respondido";
  const [a, b] = item.audience.map((s) => bySlot[s]!.response.value.choice);
  if (item.section === "entendimento") return a === "certo" && b === "certo" ? "concordam" : "ajustar";
  if (item.section === "alinhar" && (a === "responder" || b === "responder")) return "comparar";
  return a === b ? "concordam" : "divergem";
}

export function buildReviewReport(data: AdminData): ReviewReport {
  const participantsById = new Map(data.participants.map((p) => [p.id, p]));
  const items: ReviewItemReport[] = reviewItems.map((item) => {
    const bySlot = {} as Record<ReviewSlot, ReviewEntry | undefined>;
    for (const slot of SLOTS) {
      // Mesmo slot em mais de um aparelho: vale a resposta mais recente.
      const latest = data.reviews
        .filter((r) => r.itemKey === item.key)
        .map((r) => ({ response: r, participant: participantsById.get(r.participantId) }))
        .filter((e): e is { response: ReviewRow; participant: ParticipantRow } =>
          Boolean(e.participant && e.participant.kind === "participant" && e.participant.slot === slot),
        )
        .sort((x, y) => y.response.updatedAt.localeCompare(x.response.updatedAt))[0];
      bySlot[slot] = latest ? { ...latest, complete: reviewComplete(item, latest.response.value) } : undefined;
    }
    return {
      item,
      bySlot,
      status: statusOf(item, bySlot),
      waitingFor: item.audience.filter((s) => !bySlot[s]?.complete),
    };
  });

  const progress = {} as ReviewReport["progress"];
  for (const slot of SLOTS) {
    const required = items.filter((r) => r.item.audience.includes(slot) && !r.item.optional);
    progress[slot] = { done: required.filter((r) => r.bySlot[slot]?.complete).length, total: required.length };
  }
  return { phase: data.phase, items, progress };
}
