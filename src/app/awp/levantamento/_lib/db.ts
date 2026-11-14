import postgres from "postgres";

// Conexão do servidor com o banco do levantamento. Usada só em Server
// Components e Route Handlers: a URL nunca chega ao navegador.
//
// Supabase (Supavisor, porta 6543, modo transação): sem prepared statements,
// sem pipelining (Supavisor < 2.10 trava) e com timeout para não pendurar a
// função se o pooler parar de responder.

const globalForDb = globalThis as unknown as { awpLevantamentoSql?: postgres.Sql };

export function db(): postgres.Sql {
  if (!globalForDb.awpLevantamentoSql) {
    const url = process.env.AWP_DATABASE_URL;
    if (!url) throw new Error("AWP_DATABASE_URL não configurada.");
    globalForDb.awpLevantamentoSql = postgres(url, {
      prepare: false,
      // Banco local (PGlite) tem uma sessão só para todas as conexões: lá use
      // AWP_DB_POOL_MAX=1 para as consultas paralelas não se misturarem.
      max: Number(process.env.AWP_DB_POOL_MAX) || 3,
      max_pipeline: 1,
      idle_timeout: 20,
      connect_timeout: 10,
      query_timeout: 15,
      onnotice: () => {},
    });
  }
  return globalForDb.awpLevantamentoSql;
}
