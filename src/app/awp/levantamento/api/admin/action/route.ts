import { questionByKey } from "../../../_content/questionario";
import { addNote, addRuleVersion, setParticipantSlot, setValidation } from "../../../_lib/data";
import { VALIDATION_LABEL, type Slot, type ValidationStatus } from "../../../_lib/divergence";
import { fail, isSameOrigin, json, readJson } from "../../../_lib/http";
import { isAdmin } from "../../../_lib/session";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Ações do painel. Nenhuma delas altera respostas de participantes.
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return fail("Origem não permitida.", 403);
  if (!(await isAdmin())) return fail("Sessão do painel expirada. Entre de novo.", 401);

  let body: Record<string, unknown>;
  try {
    body = (await readJson(request, 50_000)) as Record<string, unknown>;
  } catch {
    return fail("Requisição inválida.", 400);
  }

  const questionKey = typeof body.questionKey === "string" ? body.questionKey : "";
  const text = typeof body.body === "string" ? body.body.trim().slice(0, 20_000) : "";

  switch (body.action) {
    case "validation": {
      if (!questionByKey.has(questionKey)) return fail("Pergunta desconhecida.", 400);
      const status = body.status;
      if (status !== null && !(typeof status === "string" && status in VALIDATION_LABEL)) {
        return fail("Situação inválida.", 400);
      }
      await setValidation(questionKey, status as ValidationStatus | null);
      return json({ ok: true });
    }
    case "note": {
      if (!questionByKey.has(questionKey)) return fail("Pergunta desconhecida.", 400);
      if (!text) return fail("Escreva a observação.", 400);
      const answerId = typeof body.answerId === "string" && UUID.test(body.answerId) ? body.answerId : null;
      await addNote(questionKey, answerId, text);
      return json({ ok: true });
    }
    case "rule": {
      if (!questionByKey.has(questionKey)) return fail("Pergunta desconhecida.", 400);
      if (!text) return fail("Escreva o texto da regra.", 400);
      await addRuleVersion(questionKey, text);
      return json({ ok: true });
    }
    case "slot": {
      const participantId = typeof body.participantId === "string" ? body.participantId : "";
      if (!UUID.test(participantId)) return fail("Participante inválido.", 400);
      const slot = body.slot;
      if (slot !== null && slot !== "manoel" && slot !== "cadene") return fail("Identificação inválida.", 400);
      await setParticipantSlot(participantId, slot as Slot | null);
      return json({ ok: true });
    }
    default:
      return fail("Ação desconhecida.", 400);
  }
}
