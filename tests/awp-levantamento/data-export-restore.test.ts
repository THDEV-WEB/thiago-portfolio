// Camada de dados do app + exportação JSON/PDF + restauração isolada,
// executando o script real de restauração contra o banco de teste.
import { execFile } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { emptyAnswer, type AnswerValue } from "../../src/app/awp/levantamento/_lib/answers";
import {
  addNote,
  addRuleVersion,
  answersOfParticipant,
  loadAdminData,
  saveAnswer,
  setValidation,
} from "../../src/app/awp/levantamento/_lib/data";
import {
  buildExportFile,
  canonicalJson,
  collectExportData,
  sha256,
  verifyExportFile,
  type ExportFile,
} from "../../src/app/awp/levantamento/_lib/export-spec";
import { renderReportPdf } from "../../src/app/awp/levantamento/_lib/pdf";
import { buildReport } from "../../src/app/awp/levantamento/_lib/report";
import { asOwner, createParticipant, setSessionRole, startTestDb, type TestDb } from "./helpers";

const run = promisify(execFile);
let t: TestDb;
let manoel: string;
let cadene: string;
const answer = (patch: Partial<AnswerValue>): AnswerValue => ({ ...emptyAnswer(), ...patch });

async function exportNow(): Promise<ExportFile> {
  const data = await t.sql.begin(async (tx) => {
    await tx.unsafe("set local timezone = 'UTC'");
    return collectExportData(tx, "awp");
  });
  return buildExportFile(data, new Date());
}

beforeAll(async () => {
  t = await startTestDb(55612);
  process.env.AWP_DATABASE_URL = t.url;
  // Daqui em diante o app (e este cliente) operam como awp_app.
  await setSessionRole(t.sql, "awp_app");
  manoel = await createParticipant(t.sql, "Manoel Oliveira", "hash-m", "manoel");
  cadene = await createParticipant(t.sql, "Cadene", "hash-c", "cadene");

  await saveAnswer("hash-m", "m1.q1", answer({ selected: ["talhao", "safra"], explanation: "Lança por talhão; consolida por safra." }));
  await saveAnswer("hash-c", "m1.q1", answer({ selected: ["talhao"], complement: "Exemplo: talhão 3" }));
  await saveAnswer("hash-m", "m5.q1", answer({ explanation: "Amostragem de 10 plantas — método de campo" }));
  await saveAnswer("hash-c", "m2.q3", answer({ selected: ["ambas"], needs_discussion: true }));
  await saveAnswer(
    "hash-m",
    "m3.q4",
    answer({ matrix: { insumos: { criterion: "quantidade" }, outro_tipo: { label: "Energia", criterion: "outro", other: "kWh medido" } } }),
  );
  await asOwner(t.sql, () => t.sql`update awp.answers set updated_at = now() - interval '10 minutes' where question_key = 'm5.q1'`);
  await saveAnswer("hash-m", "m5.q1", answer({ explanation: "Amostragem de 10 plantas, revisada" }));
  await addNote("m1.q1", null, "Confirmar com os dois na reunião.");
  await addRuleVersion("m1.q1", "O custeio é lançado por talhão.");
  await addRuleVersion("m1.q1", "O custeio é lançado por talhão e consolidado por safra.");
  await setValidation("m1.q1", "confirmada");
});

afterAll(async () => {
  await t?.stop();
});

describe("camada de dados", () => {
  it("o app está operando como awp_app (permissões reais)", async () => {
    const { db } = await import("../../src/app/awp/levantamento/_lib/db");
    const [row] = await db()`select current_user as who`;
    expect(row.who).toBe("awp_app");
  });

  it("cada participante recebe só as próprias respostas", async () => {
    const m = await answersOfParticipant(manoel);
    const c = await answersOfParticipant(cadene);
    expect(m.every((a) => a.participantId === manoel)).toBe(true);
    expect(c.every((a) => a.participantId === cadene)).toBe(true);
    expect(m.map((a) => a.questionKey).sort()).toEqual(["m1.q1", "m3.q4", "m5.q1"]);
    expect(c.map((a) => a.questionKey).sort()).toEqual(["m1.q1", "m2.q3"]);
    expect(JSON.stringify(c)).not.toContain("consolida por safra");
  });

  it("regra consolidada é versionada e não altera respostas", async () => {
    const data = await loadAdminData();
    expect(data.rules.filter((r) => r.questionKey === "m1.q1").map((r) => r.version)).toEqual([1, 2]);
    const original = data.answers.find((a) => a.participantId === manoel && a.questionKey === "m1.q1")!;
    expect(original.value.selected).toEqual(["talhao", "safra"]);
  });

  it("relatório separa situação individual, cobertura, divergência e validação", async () => {
    const report = buildReport(await loadAdminData());
    const q11 = report.questions.find((q) => q.question.key === "m1.q1")!;
    expect(q11.statuses).toEqual({ manoel: "respondida", cadene: "respondida" });
    expect(q11.coverage).toBe("ambos");
    expect(q11.divergence).toEqual({ state: "possivel", details: ["Só Manoel marcou: Safra"] });
    expect(q11.validation).toBe("confirmada");
    expect(q11.validationSource).toBe("manual");
    expect(q11.rule?.version).toBe(2);

    const q23 = report.questions.find((q) => q.question.key === "m2.q3")!;
    expect(q23.coverage).toBe("so_cadene");
    expect(q23.needsDiscussion).toBe(true);
    expect(q23.validation).toBe("pendente");

    const q51 = report.questions.find((q) => q.question.key === "m5.q1")!;
    expect(q51.bySlot.manoel?.revisions).toHaveLength(1);
    // A tabela 3.4 do Manoel está parcial (2 de 12 linhas): fica "em andamento".
    const q34 = report.questions.find((q) => q.question.key === "m3.q4")!;
    expect(q34.statuses.manoel).toBe("em_andamento");
    expect(report.totals.answeredBy).toEqual({ manoel: 2, cadene: 2 });
  });
});

describe("exportação JSON", () => {
  it("é íntegra e acusa adulteração", async () => {
    const file = await exportNow();
    expect(verifyExportFile(file)).toEqual({ ok: true, problems: [] });
    expect(file.counts.questions).toBe(36);
    expect(file.counts.answers).toBe(5);
    expect(file.counts.answer_revisions).toBe(1);
    expect(file.counts.rule_consolidations).toBe(2);

    const tampered = structuredClone(file);
    (tampered.data.answers[0] as { explanation: string }).explanation = "alterado";
    expect(verifyExportFile(tampered).ok).toBe(false);

    const dropped = structuredClone(file);
    dropped.data.answers.pop();
    expect(verifyExportFile(dropped).problems.join(" ")).toMatch(/Contagem divergente em answers/);
  });

  it("é reproduzível (mesmo SHA-256 sem mudanças no banco)", async () => {
    const a = await exportNow();
    const b = await exportNow();
    expect(a.sha256).toBe(b.sha256);
  });
});

describe("restauração isolada (script real)", () => {
  const dir = mkdtempSync(join(tmpdir(), "awp-restore-"));
  const script = join(process.cwd(), "scripts/awp-levantamento/restore-test.mjs");
  const env = () => ({ ...process.env, AWP_RESTORE_DATABASE_URL: t.url, NODE_NO_WARNINGS: "1" });

  it("recupera todos os registros e não toca no schema awp", async () => {
    const file = await exportNow();
    const path = join(dir, "export.json");
    writeFileSync(path, JSON.stringify(file, null, 2));
    const before = sha256(canonicalJson((await exportNow()).data));

    // O script troca para awp_restore; só o dono do banco pode fazer essa troca.
    const { stdout } = await asOwner(t.sql, () =>
      run(process.execPath, [script, path], { env: { ...env(), AWP_RESTORE_SET_ROLE: "1" } }),
    );
    expect(stdout).toContain("Conta usada: awp_restore");
    expect(stdout).toContain("RESTAURAÇÃO OK");
    expect(stdout).toContain(`SHA-256 restaurado: ${file.sha256}`);

    const after = sha256(canonicalJson((await exportNow()).data));
    expect(after).toBe(before);
    const [schema] = await t.sql`select count(*)::int as n from pg_namespace where nspname = 'awp_restore_test'`;
    expect(schema.n).toBe(0);
  });

  it("recusa rodar com uma conta que enxerga o schema awp", async () => {
    const path = join(dir, "export.json");
    // Sem trocar de papel: a conexão é a do dono do banco, que enxerga awp.
    const result = await asOwner(t.sql, () =>
      run(process.execPath, [script, path], { env: env() }).catch((e) => e),
    );
    expect(result.code).not.toBe(0);
    expect(String(result.stderr)).toMatch(/\(postgres\) tem acesso ao schema awp/);
    const [schema] = await t.sql`select count(*)::int as n from pg_namespace where nspname = 'awp_restore_test'`;
    expect(schema.n).toBe(0);
  });

  it("recusa arquivo adulterado antes de conectar", async () => {
    const file = await exportNow();
    file.data.answers.pop();
    const path = join(dir, "adulterado.json");
    writeFileSync(path, JSON.stringify(file));
    const result = await run(process.execPath, [script, path], { env: env() }).catch((e) => e);
    expect(result.code).toBe(2);
    expect(String(result.stderr)).toMatch(/não passou na verificação/);
  });
});

describe("PDF consolidado", () => {
  it("gera um PDF válido com o conteúdo do levantamento", async () => {
    const pdf = await renderReportPdf(buildReport(await loadAdminData()), new Date());
    expect(Buffer.from(pdf.subarray(0, 5)).toString()).toBe("%PDF-");
    expect(pdf.byteLength).toBeGreaterThan(5_000);
  });
});
