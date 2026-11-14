// Funções compartilhadas pelos scripts do levantamento AWP (Node 24+, que
// executa o questionario.ts direto com type stripping).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { questionnaire } from "../../src/app/awp/levantamento/_content/questionario.ts";

export {
  buildExportFile,
  canonicalJson,
  collectExportData,
  EXPORT_TABLES,
  sha256,
  tablesForVersion,
  verifyExportFile,
} from "../../src/app/awp/levantamento/_lib/export-spec.ts";

const here = dirname(fileURLToPath(import.meta.url));
const dbDir = join(here, "../../src/app/awp/levantamento/_db");

export const MAIN_SCHEMA = "awp";
export const RESTORE_SCHEMA = "awp_restore_test";

export function tablesSql(schema) {
  if (!/^[a-z_]+$/.test(schema)) throw new Error(`Schema inválido: ${schema}`);
  return readFileSync(join(dbDir, "01-tables.sql"), "utf8").replaceAll("__SCHEMA__", schema);
}

export function securitySql() {
  return readFileSync(join(dbDir, "02-security.sql"), "utf8");
}

// Linhas das tabelas de conteúdo derivadas de questionario.ts.
export function contentRows() {
  const modules = [];
  const questions = [];
  const options = [];
  questionnaire.forEach((m, mi) => {
    const { questions: qs, ...moduleDef } = m;
    modules.push({
      key: m.key,
      position: mi + 1,
      title: m.title,
      objective: m.objective,
      definition: moduleDef,
    });
    qs.forEach((q, qi) => {
      questions.push({
        key: q.key,
        module_key: m.key,
        position: qi + 1,
        number: q.number,
        prompt: q.prompt,
        kind: q.kind,
        definition: q,
      });
      for (const [role, list] of [
        ["option", q.options],
        ["row", q.rows],
        ["criterion", q.criteria],
      ]) {
        (list ?? []).forEach((o, oi) => {
          options.push({
            question_key: q.key,
            role,
            key: o.key,
            position: oi + 1,
            label: o.label,
            allows_other: Boolean(o.other),
            is_proposed: Boolean(o.proposed),
          });
        });
      }
    });
  });
  return { modules, questions, options };
}

// Upsert idempotente do conteúdo. Alternativas removidas do arquivo saem do
// banco; módulos e perguntas nunca são apagados (podem ter respostas).
export async function seedContent(sql, schema) {
  const { modules, questions, options } = contentRows();
  await sql.begin(async (tx) => {
    for (const m of modules) {
      await tx.unsafe(
        `insert into ${schema}.modules (key, position, title, objective, definition)
         values ($1, $2, $3, $4, $5::jsonb)
         on conflict (key) do update set position = excluded.position, title = excluded.title,
           objective = excluded.objective, definition = excluded.definition`,
        [m.key, m.position, m.title, m.objective, m.definition],
      );
    }
    for (const q of questions) {
      await tx.unsafe(
        `insert into ${schema}.questions (key, module_key, position, number, prompt, kind, definition)
         values ($1, $2, $3, $4, $5, $6, $7::jsonb)
         on conflict (key) do update set module_key = excluded.module_key, position = excluded.position,
           number = excluded.number, prompt = excluded.prompt, kind = excluded.kind,
           definition = excluded.definition`,
        [q.key, q.module_key, q.position, q.number, q.prompt, q.kind, q.definition],
      );
    }
    await tx.unsafe(`delete from ${schema}.question_options`);
    for (const o of options) {
      await tx.unsafe(
        `insert into ${schema}.question_options
           (question_key, role, key, position, label, allows_other, is_proposed)
         values ($1, $2, $3, $4, $5, $6, $7)`,
        [o.question_key, o.role, o.key, o.position, o.label, o.allows_other, o.is_proposed],
      );
    }
  });
  return { modules: modules.length, questions: questions.length, options: options.length };
}

export function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Defina a variável ${name}.`);
    process.exit(1);
  }
  return value;
}
