// Utilitários das rotas da API do levantamento.

const BASE_HEADERS = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: BASE_HEADERS });
}

export function fail(message: string, status: number): Response {
  return json({ error: message }, status);
}

export function download(body: Uint8Array | string, filename: string, contentType: string): Response {
  return new Response(body as BodyInit, {
    headers: {
      ...BASE_HEADERS,
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

/**
 * Bloqueia requisições de outros sites (CSRF): aceita só quando a origem é o
 * próprio host. Sem cabeçalho Origin, aceita apenas se o navegador declarar
 * Sec-Fetch-Site: same-origin.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }
  return request.headers.get("sec-fetch-site") === "same-origin";
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "desconhecido";
}

export async function readJson(request: Request, maxBytes = 200_000): Promise<unknown> {
  const text = await request.text();
  if (text.length > maxBytes) throw new Error("payload_grande");
  return JSON.parse(text);
}
