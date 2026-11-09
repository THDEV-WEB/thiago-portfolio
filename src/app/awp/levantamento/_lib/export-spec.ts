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
export const EXPORT_FORMAT_VERSION = 1;

/** Tabelas exportadas, na ordem em que podem ser restauradas (chaves estrangeiras). */
export const EXPORT_TABLES = [
  { name: "modules", orderBy: "key" },
  { name: "questions", orderBy: "key" },
  { name: "question_options", orderBy: "question_key, role, key" },
  { name: "participants", orderBy: "id" },
  { name: "answers", orderBy: "id" },
  { name: "answer_revisions", orderBy: "id" },
  { name: "question_validation", orderBy: "question_key" },
  { name: "validation_events", orderBy: "id" },
  { name: "admin_notes", orderBy: "id" },
  { name: "rule_consolidations", orderBy: "id" },
] as const;

export type ExportTableName = (typeof EXPORT_TABLES)[number]["name"];
export type ExportData = Record<ExportTableName, Record<string, unknown>[]>;

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
export async function collectExportData(sql: UnsafeQuery, schema: string): Promise<ExportData> {
  if (!/^[a-z_]+$/.test(schema)) throw new Error(`Schema inválido: ${schema}`);
  const data = {} as ExportData;
  for (const table of EXPORT_TABLES) {
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
  if (f?.format_version !== EXPORT_FORMAT_VERSION) {
    problems.push(`Versão de formato inesperada: ${String(f?.format_version)}.`);
  }
  if (!f?.data || typeof f.data !== "object") {
    problems.push("Arquivo sem dados.");
    return { ok: false, problems };
  }
  for (const table of EXPORT_TABLES) {
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
