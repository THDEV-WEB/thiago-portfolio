// Cria/atualiza o schema awp, as permissões e o conteúdo do questionário.
// Idempotente: pode ser executado de novo após mudanças no questionário.
//
//   AWP_ADMIN_DATABASE_URL   conexão do dono do banco (postgres). Só local.
//   AWP_APP_DB_PASSWORD      (opcional) habilita login de awp_app com essa senha
//   AWP_RESTORE_DB_PASSWORD  (opcional) habilita login de awp_restore com essa senha
//
//   node scripts/awp-levantamento/db-setup.mjs
import postgres from "postgres";
import { MAIN_SCHEMA, requireEnv, securitySql, seedContent, tablesSql } from "./lib.mjs";

const sql = postgres(requireEnv("AWP_ADMIN_DATABASE_URL"), {
  prepare: false,
  max: 1,
  max_pipeline: 1,
  onnotice: () => {},
});

try {
  await sql.unsafe(tablesSql(MAIN_SCHEMA));
  await sql.unsafe(securitySql());

  for (const [role, envName] of [
    ["awp_app", "AWP_APP_DB_PASSWORD"],
    ["awp_restore", "AWP_RESTORE_DB_PASSWORD"],
  ]) {
    const password = process.env[envName];
    if (!password) continue;
    const [{ stmt }] = await sql`select format('alter role %I login password %L', ${role}::text, ${password}::text) as stmt`;
    await sql.unsafe(stmt);
    console.log(`Login habilitado para ${role}.`);
  }

  const counts = await seedContent(sql, MAIN_SCHEMA);
  console.log(
    `Schema ${MAIN_SCHEMA} pronto: ${counts.modules} módulos, ${counts.questions} perguntas, ${counts.options} alternativas/linhas/critérios.`,
  );
} finally {
  await sql.end();
}
