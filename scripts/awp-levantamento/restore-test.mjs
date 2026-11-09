// Teste de restauração: recria todos os registros de um JSON exportado no
// schema isolado awp_restore_test, lê de volta e compara contagens e SHA-256
// com o arquivo original. Ao final apaga o schema de teste (use --keep para
// mantê-lo e consultar os dados recuperados).
//
// Isolamento do schema principal awp:
//   1. Conecta com a conta awp_restore, que não tem nenhuma permissão em awp
//      (o próprio Postgres recusaria qualquer leitura ou alteração).
//   2. Antes de qualquer escrita, aborta se a conexão enxergar o schema awp.
//   3. O schema de destino é fixo no código e nunca pode ser "awp".
//   4. Os dados vêm só do arquivo JSON; o banco principal não é lido.
//
//   AWP_RESTORE_DATABASE_URL  conexão como awp_restore
//   AWP_RESTORE_SET_ROLE=1    só para o banco local (PGlite não autentica por
//                             usuário): faz SET ROLE awp_restore na transação
//
//   node scripts/awp-levantamento/restore-test.mjs arquivo.json [--keep]
import { readFileSync } from "node:fs";
import postgres from "postgres";
import {
  canonicalJson,
  collectExportData,
  EXPORT_TABLES,
  MAIN_SCHEMA,
  requireEnv,
  RESTORE_SCHEMA,
  sha256,
  tablesSql,
  verifyExportFile,
} from "./lib.mjs";

if (RESTORE_SCHEMA === MAIN_SCHEMA) throw new Error("Schema de restauração não pode ser o principal.");

const path = process.argv[2];
const keep = process.argv.includes("--keep");
if (!path) {
  console.error("Uso: node scripts/awp-levantamento/restore-test.mjs <arquivo.json> [--keep]");
  process.exit(1);
}

const file = JSON.parse(readFileSync(path, "utf8"));
const check = verifyExportFile(file);
if (!check.ok) {
  console.error("Arquivo não passou na verificação de integridade:");
  for (const p of check.problems) console.error(`  - ${p}`);
  process.exit(2);
}

const sql = postgres(requireEnv("AWP_RESTORE_DATABASE_URL"), {
  prepare: false,
  max: 1,
  max_pipeline: 1,
  onnotice: () => {},
});

try {
  const report = await sql.begin(async (tx) => {
    if (process.env.AWP_RESTORE_SET_ROLE === "1") await tx.unsafe("set local role awp_restore");
    await tx.unsafe("set local timezone = 'UTC'");

    const [guard] = await tx.unsafe(
      `select current_user as who,
              exists (select from pg_namespace where nspname = '${MAIN_SCHEMA}')
                and has_schema_privilege('${MAIN_SCHEMA}', 'usage') as sees_main`,
    );
    if (guard.sees_main) {
      throw new Error(
        `A conexão (${guard.who}) tem acesso ao schema ${MAIN_SCHEMA}. Use a conta awp_restore. Nada foi alterado.`,
      );
    }

    await tx.unsafe(`drop schema if exists ${RESTORE_SCHEMA} cascade`);
    await tx.unsafe(tablesSql(RESTORE_SCHEMA));

    for (const table of EXPORT_TABLES) {
      const rows = file.data[table.name];
      if (rows.length === 0) continue;
      await tx.unsafe(
        `insert into ${RESTORE_SCHEMA}.${table.name}
         select * from jsonb_populate_recordset(null::${RESTORE_SCHEMA}.${table.name}, $1::jsonb)`,
        [rows],
      );
    }

    const restored = await collectExportData(tx, RESTORE_SCHEMA);
    const restoredHash = sha256(canonicalJson(restored));
    const counts = EXPORT_TABLES.map((t) => ({
      table: t.name,
      original: file.counts[t.name],
      restored: restored[t.name].length,
    }));

    if (!keep) await tx.unsafe(`drop schema ${RESTORE_SCHEMA} cascade`);
    return { who: guard.who, restoredHash, counts };
  });

  const countsOk = report.counts.every((c) => c.original === c.restored);
  const hashOk = report.restoredHash === file.sha256;

  console.log(`Conta usada: ${report.who}`);
  for (const c of report.counts) {
    console.log(`  ${c.table}: original ${c.original}, restaurado ${c.restored}${c.original === c.restored ? "" : "  <-- DIFERENTE"}`);
  }
  console.log(`SHA-256 original:   ${file.sha256}`);
  console.log(`SHA-256 restaurado: ${report.restoredHash}`);
  console.log(keep ? `Schema ${RESTORE_SCHEMA} mantido para consulta.` : `Schema ${RESTORE_SCHEMA} apagado.`);

  if (countsOk && hashOk) {
    console.log("RESTAURAÇÃO OK: todos os registros foram recuperados sem diferença.");
  } else {
    console.error("RESTAURAÇÃO COM DIFERENÇAS.");
    process.exitCode = 3;
  }
} finally {
  await sql.end();
}
