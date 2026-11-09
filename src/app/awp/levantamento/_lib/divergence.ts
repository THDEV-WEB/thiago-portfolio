// Situações calculadas de cada pergunta: cobertura (quem respondeu),
// divergência entre Manoel e Cadene e a situação automática da regra.
// Nenhuma delas escolhe qual resposta está correta.
import type { QuestionDef } from "../_content/questionario";
import { individualStatus, type AnswerValue, type IndividualStatus } from "./answers";

export type Slot = "manoel" | "cadene";
export const SLOTS: Slot[] = ["manoel", "cadene"];
export const SLOT_LABEL: Record<Slot, string> = { manoel: "Manoel", cadene: "Cadene" };

export type Coverage = "ninguem" | "so_manoel" | "so_cadene" | "ambos";

export type Divergence =
  | { state: "aguardando" }
  | { state: "sem_divergencia" }
  | { state: "possivel"; details: string[] }
  | { state: "texto" };

export type ValidationStatus = "pendente" | "respondida" | "em_analise" | "divergencia" | "confirmada";

export const VALIDATION_LABEL: Record<ValidationStatus, string> = {
  pendente: "Pendente",
  respondida: "Respondida",
  em_analise: "Em análise",
  divergencia: "Divergência para validação",
  confirmada: "Regra confirmada",
};

export const COVERAGE_LABEL: Record<Coverage, string> = {
  ninguem: "Ninguém respondeu",
  so_manoel: "Só Manoel",
  so_cadene: "Só Cadene",
  ambos: "Ambos",
};

export const DIVERGENCE_LABEL: Record<Divergence["state"], string> = {
  aguardando: "Aguardando as duas respostas",
  sem_divergencia: "Sem divergência nas alternativas",
  possivel: "Possível divergência",
  texto: "Resposta em texto: comparar manualmente",
};

export const INDIVIDUAL_LABEL: Record<IndividualStatus, string> = {
  nao_iniciada: "Não iniciada",
  em_andamento: "Em andamento",
  respondida: "Respondida",
};

export function coverage(statuses: Record<Slot, IndividualStatus>): Coverage {
  const m = statuses.manoel === "respondida";
  const c = statuses.cadene === "respondida";
  if (m && c) return "ambos";
  if (m) return "so_manoel";
  if (c) return "so_cadene";
  return "ninguem";
}

const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim().toLowerCase();

/**
 * Compara as respostas de Manoel e Cadene. Só alternativas e critérios da
 * tabela são comparados automaticamente; textos ficam para o administrador.
 */
export function divergence(
  question: QuestionDef,
  manoel: AnswerValue | undefined,
  cadene: AnswerValue | undefined,
): Divergence {
  if (
    individualStatus(question, manoel) !== "respondida" ||
    individualStatus(question, cadene) !== "respondida" ||
    !manoel ||
    !cadene
  ) {
    return { state: "aguardando" };
  }
  if (question.kind === "text") return { state: "texto" };

  const details: string[] = [];
  const label = (k: string) => question.options?.find((o) => o.key === k)?.label ?? k;

  if (question.kind === "single" || question.kind === "multi") {
    const a = new Set(manoel.selected);
    const b = new Set(cadene.selected);
    const onlyA = [...a].filter((k) => !b.has(k));
    const onlyB = [...b].filter((k) => !a.has(k));
    if (onlyA.length) details.push(`Só Manoel marcou: ${onlyA.map(label).join(", ")}`);
    if (onlyB.length) details.push(`Só Cadene marcou: ${onlyB.map(label).join(", ")}`);
    const other = question.options?.find((o) => o.other);
    if (
      other &&
      a.has(other.key) &&
      b.has(other.key) &&
      norm(manoel.other_text) !== norm(cadene.other_text)
    ) {
      details.push(`"Outro" descrito de forma diferente`);
    }
  }

  if (question.kind === "matrix") {
    const criterionLabel = (k?: string) =>
      (k && question.criteria?.find((c) => c.key === k)?.label) || "(sem critério)";
    for (const row of question.rows ?? []) {
      const ca = manoel.matrix[row.key];
      const cb = cadene.matrix[row.key];
      if (!ca && !cb) continue;
      const rowName = row.other ? `${row.label} (${ca?.label || "—"} / ${cb?.label || "—"})` : row.label;
      if (ca?.criterion !== cb?.criterion) {
        details.push(`${rowName}: Manoel ${criterionLabel(ca?.criterion)}, Cadene ${criterionLabel(cb?.criterion)}`);
      } else if (
        (ca?.other || cb?.other) &&
        norm(ca?.other ?? "") !== norm(cb?.other ?? "")
      ) {
        details.push(`${rowName}: outro critério descrito de forma diferente`);
      } else if (row.other && norm(ca?.label ?? "") !== norm(cb?.label ?? "")) {
        details.push(`${row.label}: tipos de despesa diferentes`);
      }
    }
  }

  return details.length > 0 ? { state: "possivel", details } : { state: "sem_divergencia" };
}

/** Situação automática, usada enquanto o administrador não define outra. */
export function autoValidationStatus(cov: Coverage): ValidationStatus {
  return cov === "ambos" ? "respondida" : "pendente";
}
