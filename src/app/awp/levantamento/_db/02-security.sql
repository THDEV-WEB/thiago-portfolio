-- Papéis, permissões e função de gravação de respostas do schema awp.
-- Aplicado por scripts/awp-levantamento/db-setup.mjs com a conexão do dono do
-- banco (postgres). Senhas dos papéis são definidas pelo script, nunca aqui.
--
-- awp_app      conta usada pela aplicação na Vercel.
-- awp_restore  conta do teste de restauração: só enxerga o próprio schema
--              (awp_restore_test) e não tem NENHUMA permissão em awp.

do $$
begin
  if not exists (select from pg_roles where rolname = 'awp_app') then
    create role awp_app nologin;
  end if;
  if not exists (select from pg_roles where rolname = 'awp_restore') then
    create role awp_restore nologin;
  end if;
end
$$;

-- Ninguém além do dono e de awp_app acessa o schema.
revoke all on schema awp from public;
revoke all on all tables in schema awp from public;
revoke all on schema awp from awp_restore;
revoke all on all tables in schema awp from awp_restore;

do $$
declare
  r text;
begin
  -- Papéis da API automática do Supabase (Data API). Não existem fora dele.
  foreach r in array array['anon', 'authenticated', 'service_role'] loop
    if exists (select from pg_roles where rolname = r) then
      execute format('revoke all on schema awp from %I', r);
      execute format('revoke all on all tables in schema awp from %I', r);
      execute format('revoke all on all functions in schema awp from %I', r);
    end if;
  end loop;
end
$$;

grant usage on schema awp to awp_app;

grant select on awp.modules, awp.questions, awp.question_options to awp_app;
grant select, insert on awp.participants to awp_app;
grant update (slot, last_seen_at) on awp.participants to awp_app;
-- Respostas: só leitura direta. Gravação apenas por awp.save_answer().
grant select on awp.answers, awp.answer_revisions to awp_app;
grant select, insert, update, delete on awp.question_validation to awp_app;
grant select, insert on awp.validation_events, awp.admin_notes, awp.rule_consolidations to awp_app;
grant select, insert, delete on awp.access_attempts to awp_app;
grant select, insert, update on awp.app_settings to awp_app;
-- Revisão: só leitura direta. Gravação apenas por awp.save_review().
grant select on awp.review_responses, awp.review_revisions to awp_app;

-- RLS ligado em todas as tabelas. Só awp_app tem política; qualquer outro
-- papel sem ser o dono não enxerga linha nenhuma.
do $$
declare
  t text;
begin
  foreach t in array array[
    'modules', 'questions', 'question_options', 'participants', 'answers',
    'answer_revisions', 'question_validation', 'validation_events',
    'admin_notes', 'rule_consolidations', 'access_attempts', 'app_settings',
    'review_responses', 'review_revisions'
  ] loop
    execute format('alter table awp.%I enable row level security', t);
    execute format('drop policy if exists awp_app_all on awp.%I', t);
    execute format(
      'create policy awp_app_all on awp.%I for all to awp_app using (true) with check (true)', t
    );
  end loop;
end
$$;

-- Grava a resposta do participante dono do token. Quem não conhece o token
-- (hash do cookie) não consegue gravar em nome de ninguém.
create or replace function awp.save_answer(
  p_token_hash   text,
  p_question_key text,
  p_payload      jsonb
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_participant uuid;
  v_old         awp.answers%rowtype;
  v_id          uuid;
  v_updated     timestamptz;
  v_reason      text;
  v_selected    text[] := coalesce(
    array(select jsonb_array_elements_text(coalesce(p_payload -> 'selected', '[]'::jsonb))),
    '{}'
  );
  v_other       text  := coalesce(p_payload ->> 'other_text', '');
  v_explanation text  := coalesce(p_payload ->> 'explanation', '');
  v_complement  text  := coalesce(p_payload ->> 'complement', '');
  v_extra       jsonb := coalesce(p_payload -> 'extra', '{}'::jsonb);
  v_matrix      jsonb := coalesce(p_payload -> 'matrix', '{}'::jsonb);
  v_discussion  boolean := coalesce((p_payload ->> 'needs_discussion')::boolean, false);
begin
  select id into v_participant from awp.participants where token_hash = p_token_hash;
  if v_participant is null then
    raise exception 'participante_invalido';
  end if;

  -- Fora da fase de questionário (revisão ou encerrado), as respostas originais
  -- ficam só para leitura.
  if coalesce((select value from awp.app_settings where key = 'phase'), 'questionario') <> 'questionario' then
    raise exception 'questionario_fechado';
  end if;

  if not exists (select 1 from awp.questions where key = p_question_key) then
    raise exception 'pergunta_invalida';
  end if;

  if exists (
    select unnest(v_selected)
    except
    select key from awp.question_options where question_key = p_question_key and role = 'option'
  ) then
    raise exception 'alternativa_invalida';
  end if;

  if jsonb_typeof(v_matrix) <> 'object' or jsonb_typeof(v_extra) <> 'object' then
    raise exception 'formato_invalido';
  end if;

  if exists (
    select jsonb_object_keys(v_matrix)
    except
    select key from awp.question_options where question_key = p_question_key and role = 'row'
  ) or exists (
    select value ->> 'criterion' from jsonb_each(v_matrix)
    where coalesce(value ->> 'criterion', '') <> ''
    except
    select key from awp.question_options where question_key = p_question_key and role = 'criterion'
  ) then
    raise exception 'tabela_invalida';
  end if;

  update awp.participants set last_seen_at = now() where id = v_participant;

  insert into awp.answers as a (
    participant_id, question_key, selected, other_text, explanation,
    complement, extra, matrix, needs_discussion
  ) values (
    v_participant, p_question_key, v_selected, v_other, v_explanation,
    v_complement, v_extra, v_matrix, v_discussion
  )
  on conflict (participant_id, question_key) do nothing
  returning a.id, a.updated_at into v_id, v_updated;

  if v_id is not null then
    return jsonb_build_object('answer_id', v_id, 'updated_at', v_updated, 'revision', false);
  end if;

  select * into v_old from awp.answers
  where participant_id = v_participant and question_key = p_question_key
  for update;

  if (v_old.selected, v_old.other_text, v_old.explanation, v_old.complement,
      v_old.extra, v_old.matrix, v_old.needs_discussion)
     is not distinct from
     (v_selected, v_other, v_explanation, v_complement, v_extra, v_matrix, v_discussion) then
    return jsonb_build_object('answer_id', v_old.id, 'updated_at', v_old.updated_at, 'revision', false);
  end if;

  if v_old.needs_discussion is distinct from v_discussion then
    v_reason := 'discussion_flag';
  elsif now() - v_old.updated_at > interval '5 minutes' then
    v_reason := 'edit';
  end if;

  if v_reason is not null then
    insert into awp.answer_revisions (answer_id, participant_id, question_key, reason, snapshot)
    values (v_old.id, v_participant, p_question_key, v_reason, to_jsonb(v_old));
  end if;

  update awp.answers set
    selected = v_selected,
    other_text = v_other,
    explanation = v_explanation,
    complement = v_complement,
    extra = v_extra,
    matrix = v_matrix,
    needs_discussion = v_discussion,
    updated_at = now()
  where id = v_old.id
  returning updated_at into v_updated;

  return jsonb_build_object('answer_id', v_old.id, 'updated_at', v_updated, 'revision', v_reason is not null);
end
$$;

revoke all on function awp.save_answer(text, text, jsonb) from public;
grant execute on function awp.save_answer(text, text, jsonb) to awp_app;

-- Grava a resposta da revisão do participante dono do token. Só com a revisão
-- aberta e só para quem respondeu o questionário identificado como Manoel ou
-- Cadene. Itens e alternativas válidos são conferidos pela aplicação
-- (_content/revisao.ts); aqui ficam formato, dono e fase.
create or replace function awp.save_review(
  p_token_hash text,
  p_item_key   text,
  p_payload    jsonb
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_participant uuid;
  v_old         awp.review_responses%rowtype;
  v_id          uuid;
  v_updated     timestamptz;
  v_revision    boolean := false;
  v_choice      text  := coalesce(p_payload ->> 'choice', '');
  v_comment     text  := coalesce(p_payload ->> 'comment', '');
  v_answer      jsonb := coalesce(p_payload -> 'answer', '{}'::jsonb);
begin
  select p.id into v_participant
  from awp.participants p
  where p.token_hash = p_token_hash;
  if v_participant is null then
    raise exception 'participante_invalido';
  end if;

  if coalesce((select value from awp.app_settings where key = 'phase'), 'questionario') <> 'revisao' then
    raise exception 'revisao_fechada';
  end if;

  if not exists (
    select 1 from awp.participants p
    where p.id = v_participant and p.kind = 'participant' and p.slot is not null
      and exists (select 1 from awp.answers a where a.participant_id = p.id)
  ) then
    raise exception 'revisao_indisponivel';
  end if;

  if jsonb_typeof(v_answer) <> 'object' or length(v_comment) > 10000 then
    raise exception 'formato_invalido';
  end if;

  update awp.participants set last_seen_at = now() where id = v_participant;

  insert into awp.review_responses as r (participant_id, item_key, choice, comment, answer)
  values (v_participant, p_item_key, v_choice, v_comment, v_answer)
  on conflict (participant_id, item_key) do nothing
  returning r.id, r.updated_at into v_id, v_updated;

  if v_id is not null then
    return jsonb_build_object('id', v_id, 'updated_at', v_updated, 'revision', false);
  end if;

  select * into v_old from awp.review_responses
  where participant_id = v_participant and item_key = p_item_key
  for update;

  if (v_old.choice, v_old.comment, v_old.answer) is not distinct from (v_choice, v_comment, v_answer) then
    return jsonb_build_object('id', v_old.id, 'updated_at', v_old.updated_at, 'revision', false);
  end if;

  if now() - v_old.updated_at > interval '5 minutes' then
    insert into awp.review_revisions (review_response_id, participant_id, item_key, snapshot)
    values (v_old.id, v_participant, p_item_key, to_jsonb(v_old));
    v_revision := true;
  end if;

  update awp.review_responses set
    choice = v_choice,
    comment = v_comment,
    answer = v_answer,
    updated_at = now()
  where id = v_old.id
  returning updated_at into v_updated;

  return jsonb_build_object('id', v_old.id, 'updated_at', v_updated, 'revision', v_revision);
end
$$;

revoke all on function awp.save_review(text, text, jsonb) from public;
grant execute on function awp.save_review(text, text, jsonb) to awp_app;

-- Restauração: awp_restore cria e apaga apenas o próprio schema de teste.
do $$
begin
  execute format('grant create on database %I to awp_restore', current_database());
end
$$;
