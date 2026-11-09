import { loadAdminData } from "../../../../_lib/data";
import { fileStamp } from "../../../../_lib/format";
import { download, fail } from "../../../../_lib/http";
import { renderReportPdf } from "../../../../_lib/pdf";
import { buildReport } from "../../../../_lib/report";
import { isAdmin } from "../../../../_lib/session";

export const maxDuration = 60;

export async function GET() {
  if (!(await isAdmin())) return fail("Sessão do painel expirada. Entre de novo.", 401);

  const now = new Date();
  const pdf = await renderReportPdf(buildReport(await loadAdminData()), now);
  return download(pdf, `awp-levantamento-${fileStamp(now)}.pdf`, "application/pdf");
}
