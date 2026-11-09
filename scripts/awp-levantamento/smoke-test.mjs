// Teste de ponta a ponta da camada HTTP contra um servidor em execução
// (local ou Preview). Cria participantes de teste: NÃO rode contra o banco
// de produção com respostas reais.
//
//   AWP_SMOKE_URL=http://localhost:3100 AWP_ACCESS_CODE=... AWP_ADMIN_PASSWORD=... \
//     node scripts/awp-levantamento/smoke-test.mjs
import { verifyExportFile } from "./lib.mjs";

const base = (process.env.AWP_SMOKE_URL ?? "http://localhost:3100").replace(/\/$/, "");
const code = process.env.AWP_ACCESS_CODE;
const password = process.env.AWP_ADMIN_PASSWORD;
if (!code || !password) {
  console.error("Defina AWP_ACCESS_CODE e AWP_ADMIN_PASSWORD.");
  process.exit(1);
}

const origin = new URL(base).origin;
const path = "/awp/levantamento";
const marker = `SEGREDO-MANOEL-${Date.now()}`;
let failures = 0;

function check(ok, label) {
  console.log(`${ok ? "ok  " : "FALHOU"}  ${label}`);
  if (!ok) failures++;
}

function cookieFrom(res, name) {
  const all = res.headers.getSetCookie?.() ?? [];
  const raw = all.find((c) => c.startsWith(`${name}=`));
  return raw ? { value: raw.split(";")[0], raw } : null;
}

async function call(method, url, { body, cookie, headers = {} } = {}) {
  return fetch(`${base}${url}`, {
    method,
    redirect: "manual",
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

const withOrigin = { Origin: origin };
const ip = (n) => ({ ...withOrigin, "X-Forwarded-For": `198.51.100.${n}` });

// Entrada
const home = await call("GET", path);
const homeHtml = await home.text();
check(home.status === 200 && homeHtml.includes("Seu nome completo"), "tela inicial pede nome e código");
check(/<meta name="robots" content="noindex, nofollow"/.test(homeHtml), "página fora dos buscadores (noindex)");

check(
  (await call("POST", `${path}/api/participant`, { body: { name: "Manoel Oliveira", code } })).status === 403,
  "sem cabeçalho Origin: recusado (proteção CSRF)",
);
check(
  (await call("POST", `${path}/api/participant`, { body: { name: "Manoel Oliveira", code }, headers: { Origin: "https://site-malicioso.example" } })).status === 403,
  "origem de outro site: recusada",
);
check(
  (await call("POST", `${path}/api/participant`, { body: { name: "Manoel Oliveira", code: "errado" }, headers: ip(10) })).status === 401,
  "código errado: recusado",
);

const enterManoel = await call("POST", `${path}/api/participant`, { body: { name: "  Manoel   Oliveira ", code }, headers: ip(11) });
const manoel = cookieFrom(enterManoel, "awp_lv_p");
check(enterManoel.status === 200 && Boolean(manoel), "código certo: Manoel entra e recebe cookie");
check(
  Boolean(manoel && /HttpOnly/i.test(manoel.raw) && /Path=\/awp\/levantamento/i.test(manoel.raw) && /SameSite=lax/i.test(manoel.raw)),
  "cookie do participante é HttpOnly, SameSite=Lax e restrito a /awp/levantamento",
);
check(!manoel?.raw.includes(code), "código de acesso não vai no cookie");

const enterCadene = await call("POST", `${path}/api/participant`, { body: { name: "Cadene", code }, headers: ip(12) });
const cadene = cookieFrom(enterCadene, "awp_lv_p");
check(enterCadene.status === 200 && Boolean(cadene), "Cadene entra com o próprio cookie");

// Respostas
const save = (cookie, items, headers = withOrigin) => call("POST", `${path}/api/answers`, { body: { items }, cookie, headers });
const saved = await save(manoel?.value, [
  { questionKey: "m1.q1", answer: { selected: ["talhao", "safra", "inventada"], explanation: marker } },
  { questionKey: "m2.q3", answer: { selected: ["ambas"], needs_discussion: true } },
]);
check(saved.status === 200, "Manoel salva respostas");
check((await save(cadene?.value, [{ questionKey: "m1.q1", answer: { selected: ["talhao"] } }])).status === 200, "Cadene salva respostas");
check((await save(undefined, [{ questionKey: "m1.q1", answer: {} }])).status === 401, "sem cookie: não salva");
check((await save(manoel?.value, [{ questionKey: "m99.q1", answer: {} }])).status === 400, "pergunta desconhecida: recusada");
check(
  (await save(manoel?.value, [{ questionKey: "m4.q1", answer: { selected: ["sim"] } }], { "Sec-Fetch-Site": "same-origin" })).status === 200,
  "envio por sendBeacon (sem Origin, Sec-Fetch-Site same-origin) aceito",
);

// Isolamento entre participantes
const manoelPage = await (await call("GET", path, { cookie: manoel?.value })).text();
const cadenePage = await (await call("GET", path, { cookie: cadene?.value })).text();
check(manoelPage.includes(marker), "Manoel vê a própria resposta ao voltar (retomada)");
check(!manoelPage.includes("inventada"), "alternativa inexistente foi descartada");
check(!cadenePage.includes(marker), "Cadene NÃO vê a resposta do Manoel");

// Painel
check((await call("GET", `${path}/api/admin/export/json`)).status === 401, "exportação JSON sem senha: recusada");
check((await call("GET", `${path}/api/admin/export/pdf`, { cookie: manoel?.value })).status === 401, "participante não acessa exportação");
const adminLoginPage = await (await call("GET", `${path}/admin`)).text();
check(adminLoginPage.includes("Senha do administrador") && !adminLoginPage.includes(marker), "painel sem sessão mostra só a senha");
check(
  (await call("POST", `${path}/api/admin/action`, { body: { action: "note", questionKey: "m1.q1", body: "x" }, cookie: manoel?.value, headers: withOrigin })).status === 401,
  "participante não executa ações do painel",
);
check(
  (await call("POST", `${path}/api/admin/login`, { body: { password: "errada" }, headers: ip(20) })).status === 401,
  "senha errada: recusada",
);
const login = await call("POST", `${path}/api/admin/login`, { body: { password }, headers: ip(21) });
const admin = cookieFrom(login, "awp_lv_admin");
check(login.status === 200 && Boolean(admin) && /SameSite=strict/i.test(admin?.raw ?? ""), "senha certa: sessão do painel (SameSite=Strict)");

const dashboard = await (await call("GET", `${path}/admin`, { cookie: admin?.value })).text();
check(dashboard.includes(marker) && dashboard.includes("Possível divergência"), "painel mostra respostas e divergência");

const act = (body) => call("POST", `${path}/api/admin/action`, { body, cookie: admin?.value, headers: withOrigin });
check((await act({ action: "note", questionKey: "m1.q1", body: "Observação de teste" })).status === 200, "observação registrada");
check((await act({ action: "rule", questionKey: "m1.q1", body: "Regra de teste" })).status === 200, "regra consolidada registrada");
check((await act({ action: "validation", questionKey: "m1.q1", status: "em_analise" })).status === 200, "situação da regra alterada");
check((await act({ action: "validation", questionKey: "m1.q1", status: "inventada" })).status === 400, "situação inválida recusada");

const jsonRes = await call("GET", `${path}/api/admin/export/json`, { cookie: admin?.value });
const exported = await jsonRes.json();
const verified = verifyExportFile(exported);
check(jsonRes.status === 200 && verified.ok, `JSON exportado íntegro (SHA-256 ${exported.sha256?.slice(0, 12)}…)`);
check(/attachment; filename="awp-levantamento-.*\.json"/.test(jsonRes.headers.get("content-disposition") ?? ""), "JSON baixado como arquivo");
const manoelAnswer = exported.data.answers.find((a) => a.explanation === marker);
check(Boolean(manoelAnswer) && manoelAnswer.selected.join() === "talhao,safra", "resposta original intacta após observação e regra");
check(exported.data.participants.every((p) => !("code" in p)), "exportação não contém o código de acesso");

const pdfRes = await call("GET", `${path}/api/admin/export/pdf`, { cookie: admin?.value });
const pdf = Buffer.from(await pdfRes.arrayBuffer());
check(pdfRes.status === 200 && pdf.subarray(0, 5).toString() === "%PDF-", `PDF consolidado gerado (${Math.round(pdf.length / 1024)} KB)`);

// Bloqueio por tentativas
let last = 0;
for (let i = 0; i < 6; i++) {
  last = (await call("POST", `${path}/api/participant`, { body: { name: "Teste", code: "errado" }, headers: ip(99) })).status;
}
check(last === 429, "6ª tentativa de código errado bloqueada por 15 min");

console.log(failures === 0 ? "\nTODOS OS TESTES PASSARAM" : `\n${failures} FALHA(S)`);
process.exit(failures === 0 ? 0 : 1);
