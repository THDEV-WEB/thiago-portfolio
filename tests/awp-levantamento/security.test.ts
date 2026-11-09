import { beforeAll, describe, expect, it } from "vitest";
import {
  hashToken,
  newParticipantToken,
  safeEqual,
  signAdminSession,
  suggestSlot,
  verifyAdminSession,
} from "../../src/app/awp/levantamento/_lib/security";

beforeAll(() => {
  process.env.AWP_SESSION_SECRET = "segredo-de-teste-com-mais-de-32-caracteres";
});

describe("sessão do painel", () => {
  it("aceita a sessão assinada e válida", () => {
    expect(verifyAdminSession(signAdminSession())).toBe(true);
  });

  it("recusa sessão expirada, adulterada ou vazia", () => {
    const old = signAdminSession(Date.now() - 13 * 60 * 60 * 1000);
    expect(verifyAdminSession(old)).toBe(false);
    const [payload, sig] = signAdminSession().split(".");
    const forged = Buffer.from(JSON.stringify({ exp: 9_999_999_999 })).toString("base64url");
    expect(verifyAdminSession(`${forged}.${sig}`)).toBe(false);
    expect(verifyAdminSession(`${payload}.x${sig.slice(1)}`)).toBe(false);
    expect(verifyAdminSession(undefined)).toBe(false);
    expect(verifyAdminSession("lixo")).toBe(false);
  });

  it("recusa sessão assinada com outro segredo", () => {
    const value = signAdminSession();
    process.env.AWP_SESSION_SECRET = "outro-segredo-com-mais-de-32-caracteres!!";
    expect(verifyAdminSession(value)).toBe(false);
    process.env.AWP_SESSION_SECRET = "segredo-de-teste-com-mais-de-32-caracteres";
  });
});

describe("tokens e comparação", () => {
  it("token do participante é aleatório e o banco guarda só o hash", () => {
    const a = newParticipantToken();
    const b = newParticipantToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(43);
    expect(hashToken(a)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(a)).not.toContain(a);
  });

  it("comparação segura", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
  });

  it("sugere a identificação pelo nome declarado", () => {
    expect(suggestSlot("  Manoel   Oliveira ")).toBe("manoel");
    expect(suggestSlot("cadene")).toBe("cadene");
    expect(suggestSlot("Thiago")).toBeNull();
  });
});
