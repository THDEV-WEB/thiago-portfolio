import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asRole, createParticipant, startTestDb, type TestDb } from "./helpers";

let t: TestDb;
let manoel: string;

const save = (tx: { unsafe: TestDb["sql"]["unsafe"] }, token: string, key: string, payload: object) =>
  tx.unsafe(`select awp.save_answer($1::text, $2::text, $3::jsonb) as r`, [token, key, payload]);

beforeAll(async () => {
  t = await startTestDb(55611);
  manoel = await createParticipant(t.sql, "Manoel Oliveira", "hash-manoel", "manoel");
  await createParticipant(t.sql, "Cadene", "hash-cadene", "cadene");
  // Papéis da Data API do Supabase, para conferir que ficam sem acesso.
  await t.sql.unsafe("create role anon nologin; create role authenticated nologin");
  await t.sql.unsafe(`select 1`);
});

afterAll(async () => {
  await t?.stop();
});

describe("conta da aplicação (awp_app)", () => {
  it("grava resposta pelo token do participante", async () => {
    await asRole(t.sql, "awp_app", (tx) => save(tx, "hash-manoel", "m1.q1", { selected: ["talhao"] }));
    const [row] = await t.sql`select selected from awp.answers where participant_id = ${manoel}::uuid and question_key = 'm1.q1'`;
    expect(row.selected).toEqual(["talhao"]);
  });

  it("não grava sem token válido", async () => {
    await expect(
      asRole(t.sql, "awp_app", (tx) => save(tx, "token-inexistente", "m1.q1", { selected: ["safra"] })),
    ).rejects.toThrow(/participante_invalido/);
  });

  it("recusa alternativa, linha ou critério que não existem", async () => {
    await expect(
      asRole(t.sql, "awp_app", (tx) => save(tx, "hash-manoel", "m1.q1", { selected: ["inventada"] })),
    ).rejects.toThrow(/alternativa_invalida/);
    await expect(
      asRole(t.sql, "awp_app", (tx) => save(tx, "hash-manoel", "m3.q4", { matrix: { insumos: { criterion: "x" } } })),
    ).rejects.toThrow(/tabela_invalida/);
  });

  it("não consegue alterar nem apagar respostas diretamente", async () => {
    await expect(
      asRole(t.sql, "awp_app", (tx) => tx.unsafe(`update awp.answers set explanation = 'adulterado'`)),
    ).rejects.toThrow(/permission denied/);
    await expect(asRole(t.sql, "awp_app", (tx) => tx.unsafe(`delete from awp.answers`))).rejects.toThrow(
      /permission denied/,
    );
    await expect(
      asRole(t.sql, "awp_app", (tx) =>
        tx.unsafe(
          `insert into awp.answers (participant_id, question_key) values ('${manoel}', 'm1.q2')`,
        ),
      ),
    ).rejects.toThrow(/permission denied/);
    await expect(
      asRole(t.sql, "awp_app", (tx) => tx.unsafe(`delete from awp.answer_revisions`)),
    ).rejects.toThrow(/permission denied/);
  });

  it("não troca nome nem token de participante", async () => {
    await expect(
      asRole(t.sql, "awp_app", (tx) => tx.unsafe(`update awp.participants set token_hash = 'x'`)),
    ).rejects.toThrow(/permission denied/);
  });

  it("observações e regras são só inserção", async () => {
    await expect(asRole(t.sql, "awp_app", (tx) => tx.unsafe(`delete from awp.admin_notes`))).rejects.toThrow(
      /permission denied/,
    );
    await expect(
      asRole(t.sql, "awp_app", (tx) => tx.unsafe(`update awp.rule_consolidations set body = 'x'`)),
    ).rejects.toThrow(/permission denied/);
  });
});

describe("histórico de revisões", () => {
  it("edições na mesma sessão não geram revisão; nova sessão guarda o estado anterior", async () => {
    await asRole(t.sql, "awp_app", (tx) => save(tx, "hash-manoel", "m5.q1", { explanation: "primeira" }));
    await asRole(t.sql, "awp_app", (tx) => save(tx, "hash-manoel", "m5.q1", { explanation: "primeira versão" }));
    const count = async () =>
      (await t.sql`select count(*)::int as n from awp.answer_revisions where question_key = 'm5.q1'`)[0].n as number;
    expect(await count()).toBe(0);

    // Simula 10 minutos sem editar.
    await t.sql`update awp.answers set updated_at = now() - interval '10 minutes' where question_key = 'm5.q1'`;
    await asRole(t.sql, "awp_app", (tx) => save(tx, "hash-manoel", "m5.q1", { explanation: "revisada depois" }));
    expect(await count()).toBe(1);
    const [rev] = await t.sql`select reason, snapshot from awp.answer_revisions where question_key = 'm5.q1'`;
    expect(rev.reason).toBe("edit");
    expect(rev.snapshot.explanation).toBe("primeira versão");
  });

  it("mudar 'Preciso discutir isso' sempre gera revisão; salvar igual não muda nada", async () => {
    await asRole(t.sql, "awp_app", (tx) => save(tx, "hash-manoel", "m4.q1", { selected: ["sim"] }));
    await asRole(t.sql, "awp_app", (tx) =>
      save(tx, "hash-manoel", "m4.q1", { selected: ["sim"], needs_discussion: true }),
    );
    const [before] = await t.sql`select updated_at from awp.answers where question_key = 'm4.q1'`;
    await asRole(t.sql, "awp_app", (tx) =>
      save(tx, "hash-manoel", "m4.q1", { selected: ["sim"], needs_discussion: true }),
    );
    const [after] = await t.sql`select updated_at from awp.answers where question_key = 'm4.q1'`;
    const revs = await t.sql`select reason from awp.answer_revisions where question_key = 'm4.q1'`;
    expect(revs.map((r) => r.reason)).toEqual(["discussion_flag"]);
    expect(after.updated_at).toEqual(before.updated_at);
  });
});

describe("isolamento de outros papéis", () => {
  it.each(["anon", "authenticated", "awp_restore"])("%s não lê o schema awp", async (role) => {
    await expect(asRole(t.sql, role, (tx) => tx.unsafe(`select * from awp.answers`))).rejects.toThrow(
      /permission denied/,
    );
    await expect(
      asRole(t.sql, role, (tx) => tx.unsafe(`select awp.save_answer('hash-manoel', 'm1.q1', '{}'::jsonb)`)),
    ).rejects.toThrow(/permission denied/);
  });

  it.each(["anon", "authenticated", "awp_restore"])("%s não lê a revisão nem grava nela", async (role) => {
    await expect(asRole(t.sql, role, (tx) => tx.unsafe(`select * from awp.review_responses`))).rejects.toThrow(
      /permission denied/,
    );
    await expect(
      asRole(t.sql, role, (tx) => tx.unsafe(`select awp.save_review('hash-manoel', 'final.mais', '{}'::jsonb)`)),
    ).rejects.toThrow(/permission denied/);
  });

  it("awp_restore não consegue apagar o schema awp", async () => {
    await expect(asRole(t.sql, "awp_restore", (tx) => tx.unsafe(`drop schema awp cascade`))).rejects.toThrow(
      /must be owner|permission denied/,
    );
    const [row] = await t.sql`select count(*)::int as n from awp.questions`;
    expect(row.n).toBe(36);
  });
});

describe("revisão (segunda rodada)", () => {
  const review = (tx: { unsafe: TestDb["sql"]["unsafe"] }, token: string, key: string, payload: object) =>
    tx.unsafe(`select awp.save_review($1::text, $2::text, $3::jsonb) as r`, [token, key, payload]);
  const setPhase = (phase: string) =>
    asRole(t.sql, "awp_app", (tx) =>
      tx.unsafe(
        `insert into awp.app_settings (key, value) values ('phase', $1)
         on conflict (key) do update set value = excluded.value, updated_at = now()`,
        [phase],
      ),
    );

  it("fora da fase de revisão, o banco recusa gravar a revisão", async () => {
    await expect(
      asRole(t.sql, "awp_app", (tx) => review(tx, "hash-manoel", "entendimento.1.2", { choice: "certo" })),
    ).rejects.toThrow(/revisao_fechada/);
  });

  it("na revisão, o questionário fica só leitura e a revisão grava pelo token", async () => {
    await setPhase("revisao");
    await expect(
      asRole(t.sql, "awp_app", (tx) => save(tx, "hash-manoel", "m1.q1", { selected: ["safra"] })),
    ).rejects.toThrow(/questionario_fechado/);
    await asRole(t.sql, "awp_app", (tx) =>
      review(tx, "hash-manoel", "entendimento.1.2", { choice: "certo", comment: "Isso mesmo" }),
    );
    const [row] = await t.sql`select choice, comment from awp.review_responses where participant_id = ${manoel}::uuid`;
    expect(row).toEqual({ choice: "certo", comment: "Isso mesmo" });
  });

  it("só quem respondeu o questionário pode revisar, e nunca sem token válido", async () => {
    // O Cadene deste banco não respondeu nada.
    await expect(
      asRole(t.sql, "awp_app", (tx) => review(tx, "hash-cadene", "entendimento.1.2", { choice: "certo" })),
    ).rejects.toThrow(/revisao_indisponivel/);
    await expect(
      asRole(t.sql, "awp_app", (tx) => review(tx, "token-inexistente", "entendimento.1.2", { choice: "certo" })),
    ).rejects.toThrow(/participante_invalido/);
  });

  it("recusa chave de item fora do formato e resposta nova que não seja objeto", async () => {
    await expect(
      asRole(t.sql, "awp_app", (tx) => review(tx, "hash-manoel", "X; drop", { choice: "certo" })),
    ).rejects.toThrow(/review_responses_item_key_check|violates check/);
    await expect(
      asRole(t.sql, "awp_app", (tx) => review(tx, "hash-manoel", "alinhar.2.4", { choice: "responder", answer: [1] })),
    ).rejects.toThrow(/formato_invalido/);
  });

  it("nova sessão de edição guarda o estado anterior da revisão", async () => {
    await t.sql`update awp.review_responses set updated_at = now() - interval '10 minutes' where item_key = 'entendimento.1.2'`;
    await asRole(t.sql, "awp_app", (tx) =>
      review(tx, "hash-manoel", "entendimento.1.2", { choice: "nao", comment: "Pensando melhor, depende" }),
    );
    const revs = await t.sql`select snapshot from awp.review_revisions where item_key = 'entendimento.1.2'`;
    expect(revs).toHaveLength(1);
    expect(revs[0].snapshot.choice).toBe("certo");
  });

  it("awp_app não grava, altera nem apaga a revisão diretamente", async () => {
    await expect(
      asRole(t.sql, "awp_app", (tx) =>
        tx.unsafe(`insert into awp.review_responses (participant_id, item_key) values ('${manoel}', 'final.mais')`),
      ),
    ).rejects.toThrow(/permission denied/);
    await expect(
      asRole(t.sql, "awp_app", (tx) => tx.unsafe(`update awp.review_responses set comment = 'adulterado'`)),
    ).rejects.toThrow(/permission denied/);
    await expect(asRole(t.sql, "awp_app", (tx) => tx.unsafe(`delete from awp.review_revisions`))).rejects.toThrow(
      /permission denied/,
    );
  });

  it("fase desconhecida é recusada pelo banco", async () => {
    await expect(setPhase("qualquer")).rejects.toThrow(/app_settings_check|violates check/);
    await setPhase("questionario");
  });
});
