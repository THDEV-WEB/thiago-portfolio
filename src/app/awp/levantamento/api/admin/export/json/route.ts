import { db } from "../../../../_lib/db";
import { buildExportFile, collectExportData } from "../../../../_lib/export-spec";
import { fileStamp } from "../../../../_lib/format";
import { download, fail } from "../../../../_lib/http";
import { isAdmin } from "../../../../_lib/session";

// JSON completo do levantamento, com contagens e SHA-256 para conferência
// (scripts/awp-levantamento/verify-export.mjs e restore-test.mjs).
export async function GET() {
  if (!(await isAdmin())) return fail("Sessão do painel expirada. Entre de novo.", 401);

  const data = await db().begin(async (tx) => {
    await tx.unsafe("set local timezone = 'UTC'");
    return collectExportData(tx, "awp");
  });
  const now = new Date();
  const file = buildExportFile(data, now);

  return download(
    JSON.stringify(file, null, 2),
    `awp-levantamento-${fileStamp(now)}.json`,
    "application/json; charset=utf-8",
  );
}
