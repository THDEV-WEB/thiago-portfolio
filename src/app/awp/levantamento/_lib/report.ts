// Visão consolidada do levantamento, usada pelo painel e pelo PDF.
// Respostas originais, observações e regras ficam lado a lado, sem que uma
// sobrescreva a outra.
import { questionnaire, type ModuleDef, type QuestionDef } from "../_content/questionario";
import { individualStatus, type IndividualStatus } from "./answers";
import type { AdminData, NoteRow, ParticipantRow, RevisionRow, RuleRow, StoredAnswer } from "./data";
import {
  SLOTS,
  SLOT_LABEL,
  autoValidationStatus,
  coverage,
  divergence,
  type Coverage,
  type Divergence,
  type Slot,
  type ValidationStatus,
} from "./divergence";

export type ReportAnswer = {
  answer: StoredAnswer;
  participant: ParticipantRow;
  status: IndividualStatus;
  revisions: RevisionRow[];
};

export type ReportQuestion = {
  module: Omit<ModuleDef, "questions">;
  question: QuestionDef;
  bySlot: Record<Slot, ReportAnswer | undefined>;
  /** Respostas do administrador e de participantes ainda sem identificação. */
  others: ReportAnswer[];
  statuses: Record<Slot, IndividualStatus>;
  needsDiscussion: boolean;
  coverage: Coverage;
  divergence: Divergence;
  validation: ValidationStatus;
  validationSource: "auto" | "manual";
  notes: NoteRow[];
  rule: RuleRow | undefined;
  ruleHistory: RuleRow[];
};

export type ProposedOptionUsage = {
  question: QuestionDef;
  optionKey: string;
  label: string;
  chosenBy: Slot[];
  /** Participantes que responderam a pergunta escolhendo "Outro". */
  preferredOther: Slot[];
};

export type Report = {
  participants: ParticipantRow[];
  questions: ReportQuestion[];
  proposed: ProposedOptionUsage[];
  totals: {
    questions: number;
    answeredBy: Record<Slot, number>;
    coverage: Record<Coverage, number>;
    validation: Record<ValidationStatus, number>;
    possibleDivergences: number;
    needsDiscussion: number;
  };
};

/** Rótulo de uma resposta fora das colunas Manoel/Cadene. */
export function otherAnswerTitle(entry: ReportAnswer): string {
  if (entry.participant.kind === "admin") return "Administrador";
  if (entry.participant.slot) {
    return `${SLOT_LABEL[entry.participant.slot]} (outro registro/aparelho, resposta mais antiga)`;
  }
  return "Participante sem identificação";
}

export function buildReport(data: AdminData): Report {
  const participantsById = new Map(data.participants.map((p) => [p.id, p]));
  const revisionsByAnswer = new Map<string, RevisionRow[]>();
  for (const r of data.revisions) {
    revisionsByAnswer.set(r.answerId, [...(revisionsByAnswer.get(r.answerId) ?? []), r]);
  }

  const answersByQuestion = new Map<string, StoredAnswer[]>();
  for (const a of data.answers) {
    answersByQuestion.set(a.questionKey, [...(answersByQuestion.get(a.questionKey) ?? []), a]);
  }

  const questions: ReportQuestion[] = [];
  for (const m of questionnaire) {
    const { questions: _qs, ...moduleInfo } = m;
    void _qs;
    for (const q of m.questions) {
      const entries: ReportAnswer[] = (answersByQuestion.get(q.key) ?? [])
        .map((answer) => {
          const participant = participantsById.get(answer.participantId);
          return participant
            ? {
                answer,
                participant,
                status: individualStatus(q, answer.value),
                revisions: revisionsByAnswer.get(answer.id) ?? [],
              }
            : undefined;
        })
        // Respostas vazias só aparecem se marcadas com "Preciso discutir isso".
        .filter(
          (e): e is ReportAnswer =>
            Boolean(e) && (e!.status !== "nao_iniciada" || e!.answer.value.needs_discussion),
        );

      // Mesmo slot em mais de um aparelho: vale a resposta mais recente.
      const bySlot = {} as Record<Slot, ReportAnswer | undefined>;
      for (const slot of SLOTS) {
        bySlot[slot] = entries
          .filter((e) => e.participant.kind === "participant" && e.participant.slot === slot)
          .sort((a, b) => b.answer.updatedAt.localeCompare(a.answer.updatedAt))[0];
      }
      const shown = new Set(SLOTS.map((s) => bySlot[s]?.answer.id));
      const others = entries.filter((e) => !shown.has(e.answer.id));

      const statuses = {
        manoel: bySlot.manoel?.status ?? "nao_iniciada",
        cadene: bySlot.cadene?.status ?? "nao_iniciada",
      } satisfies Record<Slot, IndividualStatus>;
      const cov = coverage(statuses);
      const manual = data.validation[q.key];
      const ruleHistory = data.rules.filter((r) => r.questionKey === q.key);

      questions.push({
        module: moduleInfo,
        question: q,
        bySlot,
        others,
        statuses,
        needsDiscussion: entries.some((e) => e.answer.value.needs_discussion),
        coverage: cov,
        divergence: divergence(q, bySlot.manoel?.answer.value, bySlot.cadene?.answer.value),
        validation: manual ?? autoValidationStatus(cov),
        validationSource: manual ? "manual" : "auto",
        notes: data.notes.filter((n) => n.questionKey === q.key),
        rule: ruleHistory[ruleHistory.length - 1],
        ruleHistory,
      });
    }
  }

  const proposed: ProposedOptionUsage[] = [];
  for (const rq of questions) {
    const otherKey = rq.question.options?.find((o) => o.other)?.key;
    for (const o of rq.question.options ?? []) {
      if (!o.proposed) continue;
      proposed.push({
        question: rq.question,
        optionKey: o.key,
        label: o.label,
        chosenBy: SLOTS.filter((s) => rq.bySlot[s]?.answer.value.selected.includes(o.key)),
        preferredOther: otherKey
          ? SLOTS.filter((s) => rq.bySlot[s]?.answer.value.selected.includes(otherKey))
          : [],
      });
    }
  }

  const count = <K extends string>(keys: K[], pick: (q: ReportQuestion) => K) =>
    Object.fromEntries(keys.map((k) => [k, questions.filter((q) => pick(q) === k).length])) as Record<K, number>;

  return {
    participants: data.participants,
    questions,
    proposed,
    totals: {
      questions: questions.length,
      answeredBy: {
        manoel: questions.filter((q) => q.statuses.manoel === "respondida").length,
        cadene: questions.filter((q) => q.statuses.cadene === "respondida").length,
      },
      coverage: count(["ninguem", "so_manoel", "so_cadene", "ambos"], (q) => q.coverage),
      validation: count(["pendente", "respondida", "em_analise", "divergencia", "confirmada"], (q) => q.validation),
      possibleDivergences: questions.filter((q) => q.divergence.state === "possivel").length,
      needsDiscussion: questions.filter((q) => q.needsDiscussion).length,
    },
  };
}
