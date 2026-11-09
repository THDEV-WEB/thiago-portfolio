// Regras das respostas: formato, normalização e situação individual.
// Funções puras, usadas pela tela, pela API e pelo painel.
import type { QuestionDef } from "../_content/questionario";

export type MatrixCell = {
  /** Critério escolhido para a linha. */
  criterion?: string;
  /** Texto do critério "Outro". */
  other?: string;
  /** Nome do tipo, na linha "Outro tipo de despesa". */
  label?: string;
};

export type AnswerValue = {
  selected: string[];
  other_text: string;
  explanation: string;
  complement: string;
  extra: { responsible?: string; reference_doc?: string };
  matrix: Record<string, MatrixCell>;
  needs_discussion: boolean;
};

export type IndividualStatus = "nao_iniciada" | "em_andamento" | "respondida";

export const TEXT_LIMIT = 10_000;
const SHORT_LIMIT = 300;

export function emptyAnswer(): AnswerValue {
  return {
    selected: [],
    other_text: "",
    explanation: "",
    complement: "",
    extra: {},
    matrix: {},
    needs_discussion: false,
  };
}

function text(value: unknown, limit = TEXT_LIMIT): string {
  return typeof value === "string" ? value.slice(0, limit) : "";
}

/**
 * Converte o que veio da rede em uma resposta válida para a pergunta,
 * descartando o que não pertence a ela. O banco valida de novo as chaves.
 */
export function normalizeAnswer(question: QuestionDef, raw: unknown): AnswerValue {
  const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const answer = emptyAnswer();

  const optionKeys = new Set((question.options ?? []).map((o) => o.key));
  if (Array.isArray(input.selected)) {
    const picked = [...new Set(input.selected.filter((k): k is string => typeof k === "string"))]
      .filter((k) => optionKeys.has(k));
    answer.selected = question.kind === "single" ? picked.slice(0, 1) : picked;
  }

  const otherOption = (question.options ?? []).find((o) => o.other);
  answer.other_text =
    otherOption && answer.selected.includes(otherOption.key) ? text(input.other_text, SHORT_LIMIT) : "";
  answer.explanation = text(input.explanation);
  answer.complement = text(input.complement);

  const extraInput = (input.extra && typeof input.extra === "object" ? input.extra : {}) as Record<
    string,
    unknown
  >;
  for (const field of question.extraFields ?? []) {
    const value = text(extraInput[field.key], SHORT_LIMIT);
    if (value) answer.extra[field.key] = value;
  }

  if (question.kind === "matrix") {
    const rows = new Map((question.rows ?? []).map((r) => [r.key, r]));
    const criteria = new Map((question.criteria ?? []).map((c) => [c.key, c]));
    const matrixInput = (input.matrix && typeof input.matrix === "object" ? input.matrix : {}) as Record<
      string,
      unknown
    >;
    for (const [rowKey, cellRaw] of Object.entries(matrixInput)) {
      const row = rows.get(rowKey);
      if (!row || !cellRaw || typeof cellRaw !== "object") continue;
      const cellInput = cellRaw as Record<string, unknown>;
      const cell: MatrixCell = {};
      const criterion = typeof cellInput.criterion === "string" ? criteria.get(cellInput.criterion) : undefined;
      if (criterion) cell.criterion = criterion.key;
      if (criterion?.other) {
        const other = text(cellInput.other, SHORT_LIMIT);
        if (other) cell.other = other;
      }
      if (row.other) {
        const label = text(cellInput.label, SHORT_LIMIT);
        if (label) cell.label = label;
      }
      if (Object.keys(cell).length > 0) answer.matrix[rowKey] = cell;
    }
  }

  answer.needs_discussion = input.needs_discussion === true;
  return answer;
}

export function isEmptyAnswer(answer: AnswerValue | undefined): boolean {
  if (!answer) return true;
  return (
    answer.selected.length === 0 &&
    !answer.other_text.trim() &&
    !answer.explanation.trim() &&
    !answer.complement.trim() &&
    Object.values(answer.extra).every((v) => !v?.trim()) &&
    Object.keys(answer.matrix).length === 0
  );
}

/** Explicação obrigatória: pergunta de texto ou alternativa que exige explicação. */
export function explanationRequired(question: QuestionDef, answer: AnswerValue): boolean {
  if (question.kind === "text") return true;
  return (question.options ?? []).some((o) => o.requiresExplanation && answer.selected.includes(o.key));
}

/** O campo de explicação aparece? */
export function explanationVisible(question: QuestionDef, answer: AnswerValue): boolean {
  return Boolean(question.explanation) || explanationRequired(question, answer);
}

/** Lista o que falta para a resposta ficar completa (vazia = respondida). */
export function missingParts(question: QuestionDef, answer: AnswerValue): string[] {
  const missing: string[] = [];
  const options = question.options ?? [];

  if (question.kind === "single" && answer.selected.length !== 1) missing.push("Escolha uma alternativa.");
  if (question.kind === "multi" && answer.selected.length === 0) missing.push("Marque ao menos uma alternativa.");

  const otherOption = options.find((o) => o.other);
  if (otherOption && answer.selected.includes(otherOption.key) && !answer.other_text.trim()) {
    missing.push('Descreva o "Outro".');
  }

  if (explanationRequired(question, answer) && !answer.explanation.trim()) {
    missing.push(question.kind === "text" ? "Escreva a resposta." : "Escreva a explicação.");
  }

  if (question.kind === "matrix") {
    const criteria = new Map((question.criteria ?? []).map((c) => [c.key, c]));
    for (const row of question.rows ?? []) {
      const cell = answer.matrix[row.key] ?? {};
      const criterion = cell.criterion ? criteria.get(cell.criterion) : undefined;
      if (row.other) {
        if (cell.label?.trim() && !criterion) missing.push(`Escolha o critério de "${cell.label}".`);
        if (criterion && !cell.label?.trim()) missing.push('Informe qual é o "Outro tipo de despesa".');
      } else if (!criterion) {
        missing.push(`Escolha o critério de "${row.label}".`);
      }
      if (criterion?.other && !cell.other?.trim()) {
        missing.push(`Descreva o outro critério de "${row.other ? cell.label || row.label : row.label}".`);
      }
    }
  }

  return missing;
}

export function individualStatus(question: QuestionDef, answer: AnswerValue | undefined): IndividualStatus {
  if (!answer || isEmptyAnswer(answer)) return "nao_iniciada";
  return missingParts(question, answer).length === 0 ? "respondida" : "em_andamento";
}

/** Texto legível de uma resposta (painel e PDF). */
export function describeAnswer(question: QuestionDef, answer: AnswerValue): string[] {
  const lines: string[] = [];
  const options = new Map((question.options ?? []).map((o) => [o.key, o]));
  if (answer.selected.length > 0) {
    const labels = answer.selected.map((k) => {
      const o = options.get(k);
      if (!o) return k;
      return o.other && answer.other_text.trim() ? `${o.label}: ${answer.other_text.trim()}` : o.label;
    });
    lines.push(labels.join("; "));
  }
  if (question.kind === "matrix") {
    const criteria = new Map((question.criteria ?? []).map((c) => [c.key, c]));
    for (const row of question.rows ?? []) {
      const cell = answer.matrix[row.key];
      if (!cell) continue;
      const rowLabel = row.other && cell.label ? `${row.label}: ${cell.label}` : row.label;
      const c = cell.criterion ? criteria.get(cell.criterion) : undefined;
      const criterionLabel = c ? (c.other && cell.other ? `${c.label}: ${cell.other}` : c.label) : "(sem critério)";
      lines.push(`${rowLabel}: ${criterionLabel}`);
    }
  }
  return lines;
}
