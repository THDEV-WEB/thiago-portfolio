// Consultas e gravações do levantamento. Somente servidor.
import type postgres from "postgres";
import { db } from "./db";
import type { AnswerValue } from "./answers";
import type { Slot, ValidationStatus } from "./divergence";
import type { Phase, ReviewValue } from "./review";

export type StoredAnswer = {
  id: string;
  participantId: string;
  questionKey: string;
  value: AnswerValue;
  createdAt: string;
  updatedAt: string;
};

export type ParticipantRow = {
  id: string;
  declaredName: string;
  kind: "participant" | "admin";
  slot: Slot | null;
  createdAt: string;
  lastSeenAt: string;
};

export type RevisionRow = {
  id: string;
  answerId: string;
  reason: "edit" | "discussion_flag";
  value: AnswerValue;
  validFrom: string;
  recordedAt: string;
};

export type NoteRow = { id: string; questionKey: string; answerId: string | null; body: string; createdAt: string };
export type RuleRow = { id: string; questionKey: string; version: number; body: string; createdAt: string };
export type ValidationEventRow = { id: string; questionKey: string; status: ValidationStatus | null; createdAt: string };

export type ReviewRow = {
  id: string;
  participantId: string;
  itemKey: string;
  value: ReviewValue;
  createdAt: string;
  updatedAt: string;
};

export type ReviewRevisionRow = { id: string; reviewResponseId: string; value: ReviewValue; validFrom: string; recordedAt: string };

const iso = (d: unknown) => (d instanceof Date ? d.toISOString() : String(d));

const PHASE_VALUES: Phase[] = ["questionario", "revisao", "encerrado"];

function toReviewValue(row: Record<string, unknown>): ReviewValue {
  const answer = row.answer as AnswerValue | Record<string, never> | null | undefined;
  return {
    choice: (row.choice as string) ?? "",
    comment: (row.comment as string) ?? "",
    answer: answer && Object.keys(answer).length > 0 ? (answer as AnswerValue) : null,
  };
}

function toReviewRow(row: postgres.Row): ReviewRow {
  return {
    id: row.id,
    participantId: row.participant_id,
    itemKey: row.item_key,
    value: toReviewValue(row),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

/** Fase atual da ferramenta. Sem registro = questionário aberto. */
export async function getPhase(): Promise<Phase> {
  const [row] = await db()`select value from awp.app_settings where key = 'phase'`;
  const value = row?.value as Phase | undefined;
  return value && PHASE_VALUES.includes(value) ? value : "questionario";
}

export async function setPhase(phase: Phase) {
  await db()`
    insert into awp.app_settings (key, value) values ('phase', ${phase})
    on conflict (key) do update set value = excluded.value, updated_at = now()
  `;
}

/** Somente as respostas da revisão do participante indicado. */
export async function reviewResponsesOf(participantId: string): Promise<ReviewRow[]> {
  const rows = await db()`select * from awp.review_responses where participant_id = ${participantId}::uuid`;
  return rows.map(toReviewRow);
}

export async function saveReview(tokenHash: string, itemKey: string, value: ReviewValue) {
  const sql = db();
  const payload = { choice: value.choice, comment: value.comment, answer: value.answer ?? {} };
  const [row] = await sql`
    select awp.save_review(
      ${tokenHash}::text, ${itemKey}::text, ${sql.json(payload as unknown as postgres.JSONValue)}::jsonb
    ) as result
  `;
  const result = (typeof row.result === "string" ? JSON.parse(row.result) : row.result) as {
    id: string;
    updated_at: string;
    revision: boolean;
  };
  return { id: result.id, updatedAt: iso(result.updated_at), revision: result.revision };
}

function toAnswerValue(row: Record<string, unknown>): AnswerValue {
  return {
    selected: (row.selected as string[]) ?? [],
    other_text: (row.other_text as string) ?? "",
    explanation: (row.explanation as string) ?? "",
    complement: (row.complement as string) ?? "",
    extra: (row.extra as AnswerValue["extra"]) ?? {},
    matrix: (row.matrix as AnswerValue["matrix"]) ?? {},
    needs_discussion: Boolean(row.needs_discussion),
  };
}

function toStoredAnswer(row: postgres.Row): StoredAnswer {
  return {
    id: row.id,
    participantId: row.participant_id,
    questionKey: row.question_key,
    value: toAnswerValue(row),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

/** Somente as respostas do participante indicado. */
export async function answersOfParticipant(participantId: string): Promise<StoredAnswer[]> {
  const rows = await db()`select * from awp.answers where participant_id = ${participantId}::uuid`;
  return rows.map(toStoredAnswer);
}

export async function saveAnswer(tokenHash: string, questionKey: string, value: AnswerValue) {
  // O driver serializa parâmetros jsonb: passar o objeto, não JSON.stringify.
  const sql = db();
  const [row] = await sql`
    select awp.save_answer(
      ${tokenHash}::text, ${questionKey}::text, ${sql.json(value as unknown as postgres.JSONValue)}::jsonb
    ) as result
  `;
  const result = (typeof row.result === "string" ? JSON.parse(row.result) : row.result) as {
    answer_id: string;
    updated_at: string;
    revision: boolean;
  };
  return { answerId: result.answer_id, updatedAt: iso(result.updated_at), revision: result.revision };
}

export async function createParticipant(input: {
  declaredName: string;
  kind: "participant" | "admin";
  tokenHash: string;
  slot: Slot | null;
}) {
  const [row] = await db()`
    insert into awp.participants (declared_name, kind, token_hash, slot)
    values (${input.declaredName}, ${input.kind}, ${input.tokenHash}, ${input.slot})
    returning id
  `;
  return row.id as string;
}

export type AdminData = {
  participants: ParticipantRow[];
  answers: StoredAnswer[];
  revisions: RevisionRow[];
  validation: Record<string, ValidationStatus>;
  validationEvents: ValidationEventRow[];
  notes: NoteRow[];
  rules: RuleRow[];
  phase: Phase;
  reviews: ReviewRow[];
  reviewRevisions: ReviewRevisionRow[];
};

export async function loadAdminData(): Promise<AdminData> {
  const sql = db();
  const [participants, answers, revisions, validation, events, notes, rules, reviews, reviewRevisions, phase] =
    await Promise.all([
      sql`select * from awp.participants order by created_at`,
      sql`select * from awp.answers order by updated_at`,
      sql`select * from awp.answer_revisions order by recorded_at`,
      sql`select * from awp.question_validation`,
      sql`select * from awp.validation_events order by created_at`,
      sql`select * from awp.admin_notes order by created_at`,
      sql`select * from awp.rule_consolidations order by question_key, version`,
      sql`select * from awp.review_responses order by updated_at`,
      sql`select * from awp.review_revisions order by recorded_at`,
      getPhase(),
    ]);
  return {
    phase,
    reviews: reviews.map(toReviewRow),
    reviewRevisions: reviewRevisions.map((r) => {
      const snapshot = (typeof r.snapshot === "string" ? JSON.parse(r.snapshot) : r.snapshot) as Record<string, unknown>;
      return {
        id: r.id,
        reviewResponseId: r.review_response_id,
        value: toReviewValue(snapshot),
        validFrom: String(snapshot.updated_at ?? ""),
        recordedAt: iso(r.recorded_at),
      };
    }),
    participants: participants.map((p) => ({
      id: p.id,
      declaredName: p.declared_name,
      kind: p.kind,
      slot: p.slot ?? null,
      createdAt: iso(p.created_at),
      lastSeenAt: iso(p.last_seen_at),
    })),
    answers: answers.map(toStoredAnswer),
    revisions: revisions.map((r) => {
      const snapshot = (typeof r.snapshot === "string" ? JSON.parse(r.snapshot) : r.snapshot) as Record<
        string,
        unknown
      >;
      return {
        id: r.id,
        answerId: r.answer_id,
        reason: r.reason,
        value: toAnswerValue(snapshot),
        validFrom: String(snapshot.updated_at ?? ""),
        recordedAt: iso(r.recorded_at),
      };
    }),
    validation: Object.fromEntries(validation.map((v) => [v.question_key, v.status])),
    validationEvents: events.map((e) => ({
      id: e.id,
      questionKey: e.question_key,
      status: e.status ?? null,
      createdAt: iso(e.created_at),
    })),
    notes: notes.map((n) => ({
      id: n.id,
      questionKey: n.question_key,
      answerId: n.answer_id ?? null,
      body: n.body,
      createdAt: iso(n.created_at),
    })),
    rules: rules.map((r) => ({
      id: r.id,
      questionKey: r.question_key,
      version: r.version,
      body: r.body,
      createdAt: iso(r.created_at),
    })),
  };
}

/** null volta para a situação automática. Toda mudança fica no histórico. */
export async function setValidation(questionKey: string, status: ValidationStatus | null) {
  await db().begin(async (tx) => {
    if (status) {
      await tx`
        insert into awp.question_validation (question_key, status) values (${questionKey}, ${status})
        on conflict (question_key) do update set status = excluded.status, updated_at = now()
      `;
    } else {
      await tx`delete from awp.question_validation where question_key = ${questionKey}`;
    }
    await tx`insert into awp.validation_events (question_key, status) values (${questionKey}, ${status})`;
  });
}

export async function addNote(questionKey: string, answerId: string | null, body: string) {
  await db()`
    insert into awp.admin_notes (question_key, answer_id, body)
    values (${questionKey}, ${answerId}::uuid, ${body})
  `;
}

/** Nova versão da regra consolidada; as anteriores continuam guardadas. */
export async function addRuleVersion(questionKey: string, body: string) {
  await db().begin(async (tx) => {
    const [row] = await tx`
      select coalesce(max(version), 0)::int + 1 as next from awp.rule_consolidations
      where question_key = ${questionKey}
    `;
    await tx`
      insert into awp.rule_consolidations (question_key, version, body)
      values (${questionKey}, ${row.next as number}::int, ${body})
    `;
  });
}

export async function setParticipantSlot(participantId: string, slot: Slot | null) {
  await db()`update awp.participants set slot = ${slot} where id = ${participantId}::uuid`;
}
