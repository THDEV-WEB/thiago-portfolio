// Dados da tela de revisão. Somente servidor.
import type { ReviewSlot } from "../_content/revisao";
import type { AnswerValue } from "./answers";
import { loadAdminData } from "./data";
import { buildReport } from "./report";

/** Respostas da primeira rodada de Manoel e Cadene, por pergunta. */
export type SharedAnswers = Record<string, Partial<Record<ReviewSlot, AnswerValue>>>;

/**
 * Na revisão, cada um passa a ver as respostas do outro. Só as respostas
 * saem do servidor: nada de observações, regras, histórico ou da revisão
 * do outro participante.
 */
export async function loadSharedAnswers(): Promise<SharedAnswers> {
  const report = buildReport(await loadAdminData());
  const shared: SharedAnswers = {};
  for (const q of report.questions) {
    const entry: Partial<Record<ReviewSlot, AnswerValue>> = {};
    for (const slot of ["manoel", "cadene"] as const) {
      const value = q.bySlot[slot]?.answer.value;
      if (value) entry[slot] = value;
    }
    shared[q.question.key] = entry;
  }
  return shared;
}
