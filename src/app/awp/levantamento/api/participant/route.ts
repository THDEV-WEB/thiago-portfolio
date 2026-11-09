import { cookies } from "next/headers";
import { clientIp, fail, isSameOrigin, json, readJson } from "../../_lib/http";
import { createParticipant } from "../../_lib/data";
import { isBlocked, recordAttempt } from "../../_lib/rate-limit";
import {
  PARTICIPANT_COOKIE,
  PARTICIPANT_COOKIE_SECONDS,
  cookieOptions,
  hashIp,
  hashToken,
  newParticipantToken,
  normalizeName,
  safeEqual,
  suggestSlot,
} from "../../_lib/security";
import { isAdmin } from "../../_lib/session";

// Entrada no questionário: nome declarado + código de acesso.
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return fail("Origem não permitida.", 403);

  const accessCode = process.env.AWP_ACCESS_CODE;
  if (!accessCode) return fail("Ferramenta ainda não configurada.", 503);

  let body: { name?: unknown; code?: unknown };
  try {
    body = (await readJson(request, 2_000)) as typeof body;
  } catch {
    return fail("Requisição inválida.", 400);
  }

  const name = typeof body.name === "string" ? normalizeName(body.name) : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (name.length < 2 || name.length > 120) return fail("Informe seu nome completo.", 400);
  if (!code) return fail("Informe o código de acesso.", 400);

  const ipHash = hashIp(clientIp(request));
  if (await isBlocked("participant", ipHash)) {
    return fail("Muitas tentativas com código errado. Aguarde 15 minutos e tente de novo.", 429);
  }

  const ok = safeEqual(code, accessCode);
  await recordAttempt("participant", ipHash, ok);
  if (!ok) return fail("Código de acesso incorreto.", 401);

  const admin = await isAdmin();
  const token = newParticipantToken();
  await createParticipant({
    declaredName: name,
    kind: admin ? "admin" : "participant",
    tokenHash: hashToken(token),
    slot: admin ? null : suggestSlot(name),
  });

  (await cookies()).set(PARTICIPANT_COOKIE, token, cookieOptions(PARTICIPANT_COOKIE_SECONDS, "lax"));
  return json({ ok: true, name });
}

// "Trocar participante": só remove o cookie deste navegador. As respostas
// gravadas continuam no banco.
export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return fail("Origem não permitida.", 403);
  (await cookies()).set(PARTICIPANT_COOKIE, "", cookieOptions(0, "lax"));
  return json({ ok: true });
}
