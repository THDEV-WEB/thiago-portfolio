-- Tabelas do levantamento AWP.
-- __SCHEMA__ é substituído pelos scripts: "awp" no banco real e
-- "awp_restore_test" no teste de restauração. Não use este arquivo sem os scripts.

create schema if not exists __SCHEMA__;

-- Conteúdo do questionário (cópia de _content/questionario.ts, gravada pela carga).
create table if not exists __SCHEMA__.modules (
  key        text primary key,
  position   int  not null,
  title      text not null,
  objective  text not null,
  definition jsonb not null
);

create table if not exists __SCHEMA__.questions (
  key        text primary key,
  module_key text not null references __SCHEMA__.modules(key),
  position   int  not null,
  number     text not null,
  prompt     text not null,
  kind       text not null check (kind in ('single', 'multi', 'text', 'matrix')),
  definition jsonb not null
);

create table if not exists __SCHEMA__.question_options (
  question_key text    not null references __SCHEMA__.questions(key),
  role         text    not null check (role in ('option', 'row', 'criterion')),
  key          text    not null,
  position     int     not null,
  label        text    not null,
  allows_other boolean not null default false,
  is_proposed  boolean not null default false,
  primary key (question_key, role, key)
);

-- Participantes: identificação declarada, nunca verificada.
create table if not exists __SCHEMA__.participants (
  id            uuid primary key default gen_random_uuid(),
  declared_name text not null check (length(btrim(declared_name)) between 2 and 120),
  kind          text not null check (kind in ('participant', 'admin')),
  token_hash    text not null unique,
  slot          text check (slot in ('manoel', 'cadene')),
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now()
);

-- Resposta atual: uma por pergunta e participante.
create table if not exists __SCHEMA__.answers (
  id               uuid primary key default gen_random_uuid(),
  participant_id   uuid not null references __SCHEMA__.participants(id),
  question_key     text not null references __SCHEMA__.questions(key),
  selected         text[] not null default '{}',
  other_text       text   not null default '',
  explanation      text   not null default '',
  complement       text   not null default '',
  extra            jsonb  not null default '{}',
  matrix           jsonb  not null default '{}',
  needs_discussion boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (participant_id, question_key)
);

-- Histórico: estado anterior de uma resposta, gravado ao iniciar uma nova
-- sessão de edição (mais de 5 min desde a última gravação) ou ao mudar a
-- marcação "Preciso discutir isso". Somente inserção.
-- snapshot.updated_at = quando aquele estado foi gravado;
-- recorded_at = quando ele foi substituído.
create table if not exists __SCHEMA__.answer_revisions (
  id             uuid primary key default gen_random_uuid(),
  answer_id      uuid not null references __SCHEMA__.answers(id),
  participant_id uuid not null references __SCHEMA__.participants(id),
  question_key   text not null references __SCHEMA__.questions(key),
  reason         text not null check (reason in ('edit', 'discussion_flag')),
  snapshot       jsonb not null,
  recorded_at    timestamptz not null default now()
);

create index if not exists answer_revisions_answer_idx
  on __SCHEMA__.answer_revisions (answer_id, recorded_at);

-- Validação da regra (administrador). Sem linha = situação automática.
create table if not exists __SCHEMA__.question_validation (
  question_key text primary key references __SCHEMA__.questions(key),
  status       text not null check (status in ('pendente', 'respondida', 'em_analise', 'divergencia', 'confirmada')),
  updated_at   timestamptz not null default now()
);

-- Histórico das mudanças de situação. status nulo = voltou para automática.
create table if not exists __SCHEMA__.validation_events (
  id           uuid primary key default gen_random_uuid(),
  question_key text not null references __SCHEMA__.questions(key),
  status       text check (status in ('pendente', 'respondida', 'em_analise', 'divergencia', 'confirmada')),
  created_at   timestamptz not null default now()
);

-- Observações do administrador. Somente inserção.
create table if not exists __SCHEMA__.admin_notes (
  id           uuid primary key default gen_random_uuid(),
  question_key text not null references __SCHEMA__.questions(key),
  answer_id    uuid references __SCHEMA__.answers(id),
  body         text not null check (length(btrim(body)) > 0),
  created_at   timestamptz not null default now()
);

-- Regra de negócio consolidada, versionada. Cada edição é uma nova versão.
create table if not exists __SCHEMA__.rule_consolidations (
  id           uuid primary key default gen_random_uuid(),
  question_key text not null references __SCHEMA__.questions(key),
  version      int  not null check (version > 0),
  body         text not null,
  created_at   timestamptz not null default now(),
  unique (question_key, version)
);

-- Tentativas de código de acesso e senha do painel, para bloqueio temporário.
create table if not exists __SCHEMA__.access_attempts (
  id         uuid primary key default gen_random_uuid(),
  scope      text not null check (scope in ('participant', 'admin')),
  ip_hash    text not null,
  success    boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists access_attempts_lookup_idx
  on __SCHEMA__.access_attempts (scope, ip_hash, created_at);
