// Banco de teste: PGlite (Postgres real em WebAssembly) servido por socket,
// com as mesmas tabelas, permissões e conteúdo aplicados ao Supabase.
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import postgres from "postgres";
import { MAIN_SCHEMA, securitySql, seedContent, tablesSql } from "../../scripts/awp-levantamento/lib.mjs";

export type TestDb = {
  url: string;
  sql: postgres.Sql;
  stop: () => Promise<void>;
};

export async function startTestDb(port: number): Promise<TestDb> {
  const pg = await PGlite.create();
  const server = new PGLiteSocketServer({ db: pg, port, host: "127.0.0.1", maxConnections: 8 });
  await server.start();
  const url = `postgres://postgres@127.0.0.1:${port}/postgres`;
  const sql = postgres(url, { prepare: false, max: 1, max_pipeline: 1, onnotice: () => {} });
  await sql.unsafe(tablesSql(MAIN_SCHEMA));
  await sql.unsafe(securitySql());
  await seedContent(sql, MAIN_SCHEMA);
  return {
    url,
    sql,
    stop: async () => {
      await sql.end();
      await server.stop();
      await pg.close();
    },
  };
}

/** Executa como outro papel do banco, numa transação (SET LOCAL ROLE). */
export function asRole<T>(sql: postgres.Sql, role: string, fn: (tx: postgres.TransactionSql) => Promise<T>) {
  return sql.begin(async (tx) => {
    await tx.unsafe(`set local role ${role}`);
    return fn(tx);
  }) as Promise<T>;
}

/**
 * O PGlite tem uma única sessão compartilhada por todas as conexões do
 * socket: SET ROLE aqui vale também para as consultas do app (db()).
 * Usado para que a camada de dados rode como awp_app, com as permissões reais.
 */
export async function setSessionRole(sql: postgres.Sql, role: string | null) {
  await sql.unsafe(role ? `set role ${role}` : "reset role");
}

export async function asOwner<T>(sql: postgres.Sql, fn: () => Promise<T>): Promise<T> {
  await setSessionRole(sql, null);
  try {
    return await fn();
  } finally {
    await setSessionRole(sql, "awp_app");
  }
}

export async function createParticipant(sql: postgres.Sql, name: string, tokenHash: string, slot: string | null) {
  const [row] = await sql`
    insert into awp.participants (declared_name, kind, token_hash, slot)
    values (${name}, 'participant', ${tokenHash}, ${slot}) returning id
  `;
  return row.id as string;
}
