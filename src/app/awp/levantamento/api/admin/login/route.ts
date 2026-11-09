import { cookies } from "next/headers";
import { clientIp, fail, isSameOrigin, json, readJson } from "../../../_lib/http";
import { isBlocked, recordAttempt } from "../../../_lib/rate-limit";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_SECONDS,
  cookieOptions,
  hashIp,
  safeEqual,
  signAdminSession,
} from "../../../_lib/security";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return fail("Origem não permitida.", 403);

  const adminPassword = process.env.AWP_ADMIN_PASSWORD;
  if (!adminPassword) return fail("Painel ainda não configurado.", 503);

  let password = "";
  try {
    const body = (await readJson(request, 2_000)) as { password?: unknown };
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return fail("Requisição inválida.", 400);
  }

  const ipHash = hashIp(clientIp(request));
  if (await isBlocked("admin", ipHash)) {
    return fail("Muitas tentativas erradas. Aguarde 15 minutos.", 429);
  }

  const ok = password.length > 0 && safeEqual(password, adminPassword);
  await recordAttempt("admin", ipHash, ok);
  if (!ok) return fail("Senha incorreta.", 401);

  (await cookies()).set(ADMIN_COOKIE, signAdminSession(), cookieOptions(ADMIN_SESSION_SECONDS, "strict"));
  return json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return fail("Origem não permitida.", 403);
  (await cookies()).set(ADMIN_COOKIE, "", cookieOptions(0, "strict"));
  return json({ ok: true });
}
