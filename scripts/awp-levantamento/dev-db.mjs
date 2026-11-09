// Banco local de desenvolvimento (PGlite, Postgres em WebAssembly) servido na
// porta 55432. Nada aqui toca o Supabase. Os dados ficam na pasta temporária
// do sistema; apague-a para recomeçar do zero.
//
//   node scripts/awp-levantamento/dev-db.mjs
//   AWP_ADMIN_DATABASE_URL=postgres://postgres@127.0.0.1:55432/postgres
//
// Observação: o PGlite não autentica por usuário, então o app local conecta
// como dono do banco. As permissões de awp_app são verificadas nos testes
// (tests/awp-levantamento), que trocam de papel explicitamente.
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dataDir = process.env.AWP_DEV_DB_DIR ?? join(tmpdir(), "awp-levantamento-devdb");
const port = Number(process.env.AWP_DEV_DB_PORT ?? 55432);

const db = await PGlite.create({ dataDir });
const server = new PGLiteSocketServer({ db, port, host: "127.0.0.1", maxConnections: 10 });
await server.start();
console.log(`Banco local em postgres://postgres@127.0.0.1:${port}/postgres (dados: ${dataDir})`);

const stop = async () => {
  await server.stop();
  await db.close();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
