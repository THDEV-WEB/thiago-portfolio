import { questionByKey } from "../../_content/questionario";
import { normalizeAnswer } from "../../_lib/answers";
import { getPhase, saveAnswer } from "../../_lib/data";
import { fail, isSameOrigin, json, readJson } from "../../_lib/http";
import { currentParticipant } from "../../_lib/session";

// Salvamento automático. Recebe uma ou mais respostas do participante do
// cookie; também é o destino do navigator.sendBeacon ao fechar a página.
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return fail("Origem não permitida.", 403);

  const participant = await currentParticipant();
  if (!participant) return fail("Sessão do participante não encontrada. Informe seu nome de novo.", 401);
  if ((await getPhase()) !== "questionario") {
    return fail("O questionário está só para leitura durante a revisão. Recarregue a página.", 409);
  }

  let body: { items?: unknown };
  try {
    body = (await readJson(request)) as typeof body;
  } catch {
    return fail("Requisição inválida.", 400);
  }
  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 50) {
    return fail("Nenhuma resposta enviada.", 400);
  }

  const saved: Record<string, string> = {};
  for (const item of body.items as { questionKey?: unknown; answer?: unknown }[]) {
    const question = typeof item?.questionKey === "string" ? questionByKey.get(item.questionKey) : undefined;
    if (!question) return fail("Pergunta desconhecida.", 400);
    const value = normalizeAnswer(question, item.answer);
    try {
      const result = await saveAnswer(participant.tokenHash, question.key, value);
      saved[question.key] = result.updatedAt;
    } catch (e) {
      if (/questionario_fechado/.test(String(e))) {
        return fail("O questionário está só para leitura durante a revisão. Recarregue a página.", 409);
      }
      throw e;
    }
  }

  return json({ ok: true, saved });
}
