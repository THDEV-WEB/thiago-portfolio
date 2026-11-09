import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const BASE_PATH = "/awp/levantamento";
export const PARTICIPANT_COOKIE = "awp_lv_p";
export const ADMIN_COOKIE = "awp_lv_admin";
export const ADMIN_SESSION_SECONDS = 12 * 60 * 60;
export const PARTICIPANT_COOKIE_SECONDS = 180 * 24 * 60 * 60;

function secret(): string {
  const value = process.env.AWP_SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("AWP_SESSION_SECRET ausente ou curta (mínimo 32 caracteres).");
  }
  return value;
}

export function newParticipantToken(): string {
  return randomBytes(32).toString("base64url");
}

/** O banco guarda só o hash do token do cookie. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** Comparação em tempo constante, inclusive para tamanhos diferentes. */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a, "utf8").digest();
  const hb = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(ha, hb) && a.length === b.length;
}

export function hashIp(ip: string): string {
  return createHmac("sha256", secret()).update(`ip:${ip}`).digest("hex");
}

export function signAdminSession(now = Date.now()): string {
  const payload = Buffer.from(
    JSON.stringify({ exp: Math.floor(now / 1000) + ADMIN_SESSION_SECONDS }),
  ).toString("base64url");
  const signature = createHmac("sha256", secret()).update(`admin:${payload}`).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyAdminSession(value: string | undefined, now = Date.now()): boolean {
  if (!value) return false;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return false;
  const expected = createHmac("sha256", secret()).update(`admin:${payload}`).digest("base64url");
  if (!safeEqual(signature, expected)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp: number };
    return typeof exp === "number" && exp > Math.floor(now / 1000);
  } catch {
    return false;
  }
}

export function cookieOptions(maxAge: number, sameSite: "lax" | "strict") {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite,
    path: BASE_PATH,
    maxAge,
  } as const;
}

/** Nome sem espaços extras; usado para exibir e para sugerir o participante. */
export function normalizeName(name: string): string {
  return name.replace(/\s+/g, " ").trim();
}

export function suggestSlot(name: string): "manoel" | "cadene" | null {
  const plain = normalizeName(name)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
  if (plain.startsWith("manoel")) return "manoel";
  if (plain.startsWith("cadene")) return "cadene";
  return null;
}
