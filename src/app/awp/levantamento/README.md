# AWP — Levantamento de regras de negócio

Ferramenta temporária para Manoel e Cadene responderem o questionário de regras de
negócio do AWP (custeio da produção de mandioca), com painel do administrador e
exportação em PDF e JSON.

- Questionário: `https://thiago.valionsistemas.com.br/awp/levantamento`
- Painel: `/awp/levantamento/admin`
- Teste do microfone (não grava nada): `/awp/levantamento/teste-microfone`

Tudo fica isolado nesta pasta, em `scripts/awp-levantamento/` e em
`tests/awp-levantamento/`. Nenhuma página existente do portfólio ou do AWP
(`/awp`, `/awp/paas`) depende deste código.

## Estrutura

| Caminho | Conteúdo |
|---|---|
| `_content/questionario.ts` | Fonte única das 36 perguntas (7 módulos). `proposed: true` = alternativa sugerida, a validar com o Manoel |
| `_db/01-tables.sql` | Tabelas (`__SCHEMA__` vira `awp` ou `awp_restore_test`) |
| `_db/02-security.sql` | Papéis `awp_app` e `awp_restore`, permissões, RLS e a função `awp.save_answer` |
| `_lib/` | Servidor: conexão, sessão, regras das respostas, divergência, relatório, PDF, formato da exportação |
| `_components/` | Tela do participante: entrada, módulos, perguntas, microfone, salvamento automático |
| `admin/` | Painel do administrador |
| `api/` | Rotas: participante, respostas, login do painel, ações do painel, exportações |

## Segurança

- **Sem login individual.** O participante informa nome completo e o código de
  acesso na tela inicial. O nome é uma **identificação declarada, não verificada**,
  e aparece assim no painel, no PDF e no JSON.
- O servidor gera um token aleatório guardado num cookie `HttpOnly`,
  `SameSite=Lax`, restrito a `/awp/levantamento`. O banco guarda só o hash
  SHA-256 do token. Cada participante só recebe as próprias respostas: não existe
  consulta por nome.
- **Painel:** senha única em `AWP_ADMIN_PASSWORD`, comparada no servidor. Sessão em
  cookie assinado (HMAC) `SameSite=Strict`, válida por 12 h.
- **Bloqueio:** 5 erros de código ou senha em 15 min por IP bloqueiam novas
  tentativas.
- **CSRF:** todo `POST` exige `Origin` do próprio site (ou `Sec-Fetch-Site:
  same-origin`, enviado pelo `sendBeacon`).
- **O navegador não recebe nenhuma chave do banco.** O servidor conecta direto ao
  Postgres.
- **No banco:**
  - schema `awp`, que não é exposto pela Data API;
  - RLS ligado, com política só para `awp_app`;
  - `anon`, `authenticated` e `service_role` sem nenhuma permissão;
  - `awp_app` não altera nem apaga respostas: só grava pela função
    `awp.save_answer`, que exige o hash do token do participante;
  - observações e regras consolidadas aceitam somente inserção (regras são
    versionadas).

## Variáveis de ambiente (projeto Vercel `thiago-portfolio`)

Nenhuma delas é `NEXT_PUBLIC_`.

| Variável | Uso |
|---|---|
| `AWP_DATABASE_URL` | Conexão como `awp_app` pelo *Transaction pooler* do Supabase (porta 6543): `postgresql://awp_app.<ref>:<senha>@<host>:6543/postgres` |
| `AWP_ADMIN_PASSWORD` | Senha do painel |
| `AWP_SESSION_SECRET` | Segredo do HMAC (mínimo 32 caracteres aleatórios) |
| `AWP_ACCESS_CODE` | Código de acesso digitado pelos participantes |

Só para os scripts locais, nunca na Vercel:

| Variável | Uso |
|---|---|
| `AWP_ADMIN_DATABASE_URL` | Conexão do dono do banco (`postgres`), só para `awp:db-setup` |
| `AWP_APP_DB_PASSWORD`, `AWP_RESTORE_DB_PASSWORD` | Senhas definidas para `awp_app` e `awp_restore` |
| `AWP_RESTORE_DATABASE_URL` | Conexão como `awp_restore`, para o teste de restauração |

## Configurar o banco (Supabase Free, região São Paulo)

```bash
AWP_ADMIN_DATABASE_URL=... AWP_APP_DB_PASSWORD=... AWP_RESTORE_DB_PASSWORD=... npm run awp:db-setup
```

O script pode ser executado de novo sem perder dados (por exemplo, depois de
ajustar o texto de uma pergunta). Respostas ficam ligadas à chave da pergunta
(`m3.q4`), não ao texto.

## Salvamento automático

- A resposta é gravada 1,5 s após a última alteração e imediatamente ao sair do
  campo ou marcar uma alternativa.
- Ao esconder ou fechar a página, o que estiver pendente é enviado por
  `navigator.sendBeacon`.
- O que o servidor ainda não confirmou fica numa cópia local
  (`localStorage`) e é reenviado na próxima abertura. Essa cópia nunca substitui o
  banco.
- **Histórico:** ao voltar a editar uma resposta depois de mais de 5 min, ou ao
  mudar "Preciso discutir isso", o estado anterior vai para `answer_revisions`
  (somente inserção).

## Voz

O microfone usa a Web Speech API do navegador (gratuita). O texto reconhecido vai
para uma caixa de revisão editável e só entra na resposta ao tocar em "Inserir na
resposta". O áudio não é guardado.

- **Funciona:** Chrome no Android e no computador, e Edge. Precisa de internet:
  o Chrome envia o áudio ao Google e o Edge à Microsoft. O Safari funciona
  parcialmente.
- **Não funciona:** Firefox e navegadores internos de apps (Instagram, Facebook,
  WebView). Nesses casos a tela orienta a abrir no Chrome ou a usar o microfone do
  teclado.
- **Android:** cada toque grava uma fala, porque o modo contínuo repete trechos
  nesse sistema.
- **Ainda não testado:** a compatibilidade real nos celulares de Manoel e Cadene.
  Use `/awp/levantamento/teste-microfone` antes de liberar o questionário.

## Exportação, conferência e restauração

No painel: **Baixar PDF consolidado** (leitura e documentação) e **Baixar JSON
completo** (preservação e recuperação dos registros).

1. **Conferir a integridade** (formato, contagens e SHA-256, sem acessar banco):

   ```bash
   npm run awp:verify-export -- awp-levantamento-AAAAMMDD-HHMM.json
   ```

2. **Testar a restauração.** Recria tudo no schema isolado `awp_restore_test`,
   compara contagens e SHA-256 com o arquivo e apaga o schema de teste (`--keep`
   mantém para consulta):

   ```bash
   AWP_RESTORE_DATABASE_URL=postgresql://awp_restore.<ref>:<senha>@<host>:6543/postgres \
     npm run awp:restore-test -- awp-levantamento-AAAAMMDD-HHMM.json
   ```

   Isolamento do schema `awp`:
   - o script usa a conta `awp_restore`, sem nenhuma permissão em `awp`;
   - ele aborta antes de escrever se a conexão enxergar `awp`;
   - o schema de destino é fixo no código;
   - os dados vêm só do arquivo.

**Retenção.** O plano Free do Supabase não tem backup automático e pausa após 7
dias sem uso (os dados são preservados; reative pelo painel do Supabase).

- Durante a coleta, baixe o JSON ao fim de cada dia de respostas.
- Ao final: gere o PDF e o JSON, confira e teste a restauração, e guarde os
  arquivos em dois lugares.
- Não há exclusão automática de respostas.

## Revisão (segunda rodada)

Depois que os dois responderam, a revisão mostra a cada um as respostas do
outro e pede confirmação ou alinhamento, item por item. O conteúdo fica em
`_content/revisao.ts`, e cada `{3.6}` nos textos vira o link "ver 3.6". As
respostas da revisão ficam em `awp.review_responses` e nunca alteram as
respostas originais.

**Fase da ferramenta** (painel → Revisão → Fase), gravada em `awp.app_settings`:

| Fase | Questionário | Revisão |
|---|---|---|
| `questionario` (padrão) | aberto | não aparece |
| `revisao` | só leitura | aberta |
| `encerrado` | só leitura | só leitura |

- O banco também recusa gravações fora da fase: `save_answer` dá
  `questionario_fechado` e `save_review` dá `revisao_fechada`.
- Só revisa quem respondeu identificado como Manoel ou Cadene. Quem entra sem
  respostas (outro aparelho, aba anônima) vê um aviso para falar com o Thiago.
- **Prévia:** painel → "Ver como o Manoel/Cadene" mostra a tela deles, só
  leitura, em qualquer fase. Use antes de abrir a revisão.
- **Regras:** em cada item, "Salvar como regra e confirmar" grava o texto
  (editável) como nova versão da regra e marca a pergunta como confirmada.
- **JSON:** formato versão 2, com `app_settings`, `review_responses` e
  `review_revisions`. Arquivos da versão 1 (primeira rodada) continuam
  verificáveis e restauráveis.

**Ordem para publicar mudanças de banco:** primeiro `awp:db-setup` no Supabase
(só acrescenta tabelas e funções e é idempotente), depois o deploy do código. O
código novo consulta tabelas que precisam existir.

## Desenvolvimento e testes

```bash
npm run awp:dev-db            # banco local (PGlite) na porta 55432, nada no Supabase
AWP_ADMIN_DATABASE_URL=postgres://postgres@127.0.0.1:55432/postgres npm run awp:db-setup
npm run test:awp              # 80 testes: regras, revisão, permissões reais do banco, exportação, restauração, PDF
AWP_SMOKE_URL=http://localhost:3100 AWP_ACCESS_CODE=... AWP_ADMIN_PASSWORD=... npm run awp:smoke-test
```

No app local, defina `AWP_DB_POOL_MAX=1`: o PGlite atende todas as conexões
numa sessão só, e consultas paralelas se misturam.

`awp:smoke-test` cria participantes de teste. Rode só em ambiente local ou na
Preview, nunca no banco com respostas reais.
