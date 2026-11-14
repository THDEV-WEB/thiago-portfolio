import { reviewItemByKey } from "../../_content/revisao";
import { getPhase, saveReview } from "../../_lib/data";
import { fail, isSameOrigin, json, readJson } from "../../_lib/http";
import { normalizeReview } from "../../_lib/review";
import { currentParticipant } from "../../_lib/session";

// Salvamento automático da revisão. Recebe um ou mais itens do participante
// do cookie; também é o destino do navigator.sendBeacon ao fechar a página.
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return fail("Origem não permitida.", 403);

  const participant = await currentParticipant();
  if (!participant) return fail("Sessão do participante não encontrada. Informe seu nome de novo.", 401);
  if ((await getPhase()) !== "revisao") return fail("A revisão não está aberta.", 409);
  const slot = participant.kind === "participant" ? participant.slot : null;
  if (!slot) return fail("A revisão é só para quem respondeu o questionário.", 403);

  let body: { items?: unknown };
  try {
    body = (await readJson(request)) as typeof body;
  } catch {
    return fail("Requisição inválida.", 400);
  }
  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 60) {
    return fail("Nenhuma resposta enviada.", 400);
  }

  const saved: Record<string, string> = {};
  for (const entry of body.items as { itemKey?: unknown; value?: unknown }[]) {
    const item = typeof entry?.itemKey === "string" ? reviewItemByKey.get(entry.itemKey) : undefined;
    if (!item || !item.audience.includes(slot)) return fail("Item da revisão desconhecido.", 400);
    try {
      const result = await saveReview(participant.tokenHash, item.key, normalizeReview(item, entry.value));
      saved[item.key] = result.updatedAt;
    } catch (e) {
      if (/revisao_indisponivel/.test(String(e))) return fail("A revisão é só para quem respondeu o questionário.", 403);
      if (/revisao_fechada/.test(String(e))) return fail("A revisão não está aberta.", 409);
      throw e;
    }
  }

  return json({ ok: true, saved });
}
