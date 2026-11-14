// Formato da exportação JSON e a coleta dos dados, compartilhados pelo app
// (download no painel) e pelos scripts de verificação e restauração.
// Importado direto pelo Node (type stripping): não pode importar outros
// arquivos do projeto.
import { createHash } from "node:crypto";

/** Serialização canônica: chaves ordenadas, sem espaços. Base do SHA-256. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return `{${Object.keys(obj)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value ?? null);
}

export function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

export const EXPORT_FORMAT = "awp-levantamento-export";
/** Versão 2: inclui a fase da ferramenta e a revisão (segunda rodada). */
export const EXPORT_FORMAT_VERSION = 2;
export const SUPPORTED_FORMAT_VERSIONS = [1, 2];

/**
 * Tabelas exportadas, na ordem em que podem ser restauradas (chaves
 * estrangeiras). `since` = primeira versão do formato que traz a tabela.
 */
export const EXPORT_TABLES = [
  { name: "modules", orderBy: "key", since: 1 },
  { name: "questions", orderBy: "key", since: 1 },
  { name: "question_options", orderBy: "question_key, role, key", since: 1 },
  { name: "participants", orderBy: "id", since: 1 },
  { name: "answers", orderBy: "id", since: 1 },
  { name: "answer_revisions", orderBy: "id", since: 1 },
  { name: "question_validation", orderBy: "question_key", since: 1 },
  { name: "validation_events", orderBy: "id", since: 1 },
  { name: "admin_notes", orderBy: "id", since: 1 },
  { name: "rule_consolidations", orderBy: "id", since: 1 },
  { name: "app_settings", orderBy: "key", since: 2 },
  { name: "review_responses", orderBy: "id", since: 2 },
  { name: "review_revisions", orderBy: "id", since: 2 },
] as const;

export type ExportTableName = (typeof EXPORT_TABLES)[number]["name"];
export type ExportTable = (typeof EXPORT_TABLES)[number];
export type ExportData = Record<ExportTableName, Record<string, unknown>[]>;

/** Tabelas presentes num arquivo da versão indicada do formato. */
export function tablesForVersion(version: number): ExportTable[] {
  return EXPORT_TABLES.filter((t) => t.since <= version);
}

export type ExportFile = {
  format: typeof EXPORT_FORMAT;
  format_version: number;
  generated_at: string;
  project: string;
  notice: string;
  counts: Record<ExportTableName, number>;
  sha256: string;
  data: ExportData;
};

/** Cliente mínimo: postgres.js (`sql` ou transação) satisfaz. */
export type UnsafeQuery = {
  unsafe: (query: string) => PromiseLike<readonly Record<string, unknown>[]>;
};

/**
 * Lê todas as tabelas exportáveis de `schema`. Deve rodar dentro de uma
 * transação com `set local timezone = 'UTC'` para que as datas saiam sempre
 * no mesmo formato (e o SHA-256 seja reproduzível).
 */
export async function collectExportData(
  sql: UnsafeQuery,
  schema: string,
  tables: readonly ExportTable[] = EXPORT_TABLES,
): Promise<ExportData> {
  if (!/^[a-z_]+$/.test(schema)) throw new Error(`Schema inválido: ${schema}`);
  const data = {} as ExportData;
  for (const table of tables) {
    const rows = await sql.unsafe(
      `select coalesce(jsonb_agg(to_jsonb(t) order by ${table.orderBy}), '[]'::jsonb) as rows
       from ${schema}.${table.name} t`,
    );
    const value = rows[0]?.rows;
    data[table.name] = (typeof value === "string" ? JSON.parse(value) : value) as Record<
      string,
      unknown
    >[];
  }
  return data;
}

export function buildExportFile(data: ExportData, generatedAt: Date): ExportFile {
  const counts = {} as Record<ExportTableName, number>;
  for (const table of EXPORT_TABLES) counts[table.name] = data[table.name].length;
  return {
    format: EXPORT_FORMAT,
    format_version: EXPORT_FORMAT_VERSION,
    generated_at: generatedAt.toISOString(),
    project: "AWP — Agricultural Wealth Project · Levantamento de regras de negócio",
    notice:
      "A identificação dos participantes é declarada por eles mesmos (nome informado), não verificada.",
    counts,
    sha256: sha256(canonicalJson(data)),
    data,
  };
}

export type VerifyResult = { ok: boolean; problems: string[] };

/** Confere formato, contagens e SHA-256 de um arquivo exportado. */
export function verifyExportFile(file: unknown): VerifyResult {
  const problems: string[] = [];
  const f = file as Partial<ExportFile> | null;
  if (!f || f.format !== EXPORT_FORMAT) problems.push("Formato desconhecido.");
  const version = Number(f?.format_version);
  if (!SUPPORTED_FORMAT_VERSIONS.includes(version)) {
    problems.push(`Versão de formato inesperada: ${String(f?.format_version)}.`);
    return { ok: false, problems };
  }
  if (!f?.data || typeof f.data !== "object") {
    problems.push("Arquivo sem dados.");
    return { ok: false, problems };
  }
  for (const table of tablesForVersion(version)) {
    const rows = f.data[table.name];
    if (!Array.isArray(rows)) {
      problems.push(`Tabela ausente: ${table.name}.`);
      continue;
    }
    if (f.counts?.[table.name] !== rows.length) {
      problems.push(
        `Contagem divergente em ${table.name}: cabeçalho ${String(f.counts?.[table.name])}, dados ${rows.length}.`,
      );
    }
  }
  const actual = sha256(canonicalJson(f.data));
  if (actual !== f.sha256) problems.push(`SHA-256 não confere (esperado ${f.sha256}, calculado ${actual}).`);
  return { ok: problems.length === 0, problems };
}
