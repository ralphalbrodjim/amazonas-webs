-- The Cambridge House · schema, RLS and grading.
-- Run this in the Supabase SQL editor (postgres) BEFORE the seed file.
-- It does not read or write warren_*, app_state or content.
--
-- After both files succeed:
-- Authentication → URL configuration
--   Site URL  https://ralphalbrodjim.github.io/amazonas-webs/ingles/
--   Redirect  https://ralphalbrodjim.github.io/amazonas-webs/ingles/
-- Email provider stays as it already is for this project.
-- The same account used for Warren can sign in here. Do not create a second signup wall.

create table if not exists public.ch_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  target_level text,
  estimated_level text,
  placement_points integer,
  placement_max integer,
  placement_at timestamptz,
  locale text not null default 'es',
  savings_mode boolean not null default true,
  homework jsonb not null default '[]'::jsonb,
  next_plan text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ch_study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.ch_profiles (user_id) on delete cascade,
  skill text not null,
  teacher text,
  week_start date not null,
  week_day smallint not null check (week_day between 0 and 6),
  duration_target integer,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null check (status in ('planned', 'in_progress', 'paused', 'submitted', 'completed', 'abandoned')),
  elapsed_seconds integer not null default 0 check (elapsed_seconds >= 0),
  measured boolean not null default false,
  note text
);

create table if not exists public.ch_exercise_bank (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  skill text not null,
  part integer,
  type text not null check (type in ('choice', 'text')),
  prompt text not null,
  options jsonb,
  grammar text,
  level text,
  audio_url text,
  accent text,
  duration_label text,
  license_status text not null default 'link_only',
  sort integer not null default 0
);

create table if not exists public.ch_exercise_answers (
  exercise_id uuid primary key references public.ch_exercise_bank (id) on delete cascade,
  answers jsonb not null,
  partial jsonb not null default '[]'::jsonb,
  keyword text,
  explanation text not null,
  max_points integer
);

create table if not exists public.ch_exercise_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.ch_profiles (user_id) on delete cascade,
  exercise_id uuid not null references public.ch_exercise_bank (id),
  answer text not null,
  status text not null,
  points integer,
  max_points integer not null,
  review boolean not null default false,
  counts boolean not null default true,
  origin text not null,
  submitted_at timestamptz not null default now()
);

create table if not exists public.ch_error_book (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.ch_profiles (user_id) on delete cascade,
  pattern text not null,
  error_text text not null,
  correction text not null,
  part text,
  grammar text,
  origin text not null,
  status text not null default 'pendiente' check (status in ('pendiente', 'dominado', 'reaparecido', 'revision')),
  review_count integer not null default 0,
  seen_sessions integer not null default 1,
  due_at timestamptz,
  last_seen timestamptz not null default now(),
  unique (user_id, pattern)
);

create table if not exists public.ch_vocabulary_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.ch_profiles (user_id) on delete cascade,
  lemma text not null,
  example text,
  source text,
  next_review_at timestamptz,
  familiarity integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, lemma)
);

create table if not exists public.ch_writing_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.ch_profiles (user_id) on delete cascade,
  prompt_code text,
  kind text not null,
  body text not null,
  word_count integer not null default 0,
  parent_id uuid references public.ch_writing_submissions (id),
  status text not null default 'teacher_review',
  rubric jsonb,
  submitted_at timestamptz not null default now()
);

create table if not exists public.ch_speaking_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.ch_profiles (user_id) on delete cascade,
  part smallint not null check (part between 1 and 4),
  duration_target integer not null,
  turn_cap integer not null,
  turns jsonb not null default '[]'::jsonb,
  status text not null default 'in_progress',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  elapsed_seconds integer not null default 0,
  feedback jsonb
);

create table if not exists public.ch_resource_catalog (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  provider text not null,
  url text not null,
  skill text not null,
  accent text not null,
  level text not null,
  duration_label text not null,
  license_status text not null default 'link_only',
  can_host_media boolean not null default false
);

create table if not exists public.ch_ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.ch_profiles (user_id) on delete cascade,
  feature text not null,
  provider text,
  model text,
  input_tokens integer,
  output_tokens integer,
  voice_seconds integer,
  estimated_cost numeric,
  pending boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.ch_mock_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.ch_profiles (user_id) on delete cascade,
  kind text not null check (kind in ('mini', 'skill', 'full', 'muestra', 'placement')),
  started_at timestamptz not null,
  finished_at timestamptz not null default now(),
  duration_seconds integer not null check (duration_seconds >= 0),
  early_stop boolean not null default false,
  conditions jsonb not null default '{}'::jsonb,
  points_by_part jsonb not null default '{}'::jsonb,
  total_points integer not null default 0,
  total_max integer not null default 0,
  status text not null
);

create index if not exists ch_sessions_user_week_idx on public.ch_study_sessions (user_id, week_start, week_day);
create index if not exists ch_attempts_user_idx on public.ch_exercise_attempts (user_id, submitted_at desc);
create index if not exists ch_errors_due_idx on public.ch_error_book (user_id, due_at);
create index if not exists ch_mocks_user_idx on public.ch_mock_attempts (user_id, finished_at desc);
create index if not exists ch_bank_skill_idx on public.ch_exercise_bank (skill, sort);

create or replace function public.ch_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists ch_profiles_touch on public.ch_profiles;
create trigger ch_profiles_touch before update on public.ch_profiles
for each row execute function public.ch_set_updated_at();

create or replace function public.ch_profile_guard()
returns trigger
language plpgsql
as $$
begin
  if current_setting('ch.bypass', true) = 'on' then
    return new;
  end if;
  if tg_op = 'UPDATE' then
    new.estimated_level = old.estimated_level;
    new.placement_points = old.placement_points;
    new.placement_max = old.placement_max;
    new.placement_at = old.placement_at;
  else
    new.estimated_level = null;
    new.placement_points = null;
    new.placement_max = null;
    new.placement_at = null;
  end if;
  return new;
end;
$$;

drop trigger if exists ch_profiles_guard on public.ch_profiles;
create trigger ch_profiles_guard before insert or update on public.ch_profiles
for each row execute function public.ch_profile_guard();

create or replace function public.ch_session_guard()
returns trigger
language plpgsql
as $$
begin
  if current_setting('ch.bypass', true) = 'on' then
    return new;
  end if;
  new.elapsed_seconds = 0;
  new.measured = false;
  return new;
end;
$$;

drop trigger if exists ch_sessions_guard on public.ch_study_sessions;
create trigger ch_sessions_guard before insert or update on public.ch_study_sessions
for each row execute function public.ch_session_guard();

create or replace function public.ch_writing_guard()
returns trigger
language plpgsql
as $$
begin
  if current_setting('ch.bypass', true) = 'on' then
    return new;
  end if;
  if tg_op = 'UPDATE' then
    new.rubric = old.rubric;
  else
    new.rubric = null;
  end if;
  return new;
end;
$$;

drop trigger if exists ch_writing_guard on public.ch_writing_submissions;
create trigger ch_writing_guard before insert or update on public.ch_writing_submissions
for each row execute function public.ch_writing_guard();

create or replace function public.ch_speaking_guard()
returns trigger
language plpgsql
as $$
begin
  if current_setting('ch.bypass', true) = 'on' then
    return new;
  end if;
  if tg_op = 'UPDATE' then
    new.feedback = old.feedback;
  else
    new.feedback = null;
  end if;
  return new;
end;
$$;

drop trigger if exists ch_speaking_guard on public.ch_speaking_sessions;
create trigger ch_speaking_guard before insert or update on public.ch_speaking_sessions
for each row execute function public.ch_speaking_guard();

create or replace function public.ch_create_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('ch.bypass', 'on', true);
  insert into public.ch_profiles (user_id, email)
  values (new.id, new.email)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists ch_create_profile on auth.users;
create trigger ch_create_profile
  after insert on auth.users
  for each row execute function public.ch_create_profile();

do $$
declare
  n integer;
begin
  select count(*) into n from auth.users;
  if n = 1 then
    perform set_config('ch.bypass', 'on', true);
    insert into public.ch_profiles (user_id, email)
    select id, email from auth.users
    on conflict (user_id) do nothing;
  end if;
end $$;

create or replace function public.ch_norm(raw text)
returns text
language sql
immutable
as $$
  select lower(trim(regexp_replace(regexp_replace(coalesce(raw, ''), '\s+', ' ', 'g'), '[.,!?;:]', '', 'g')));
$$;

create or replace function public.ch_max_points(part integer, override integer)
returns integer
language sql
immutable
as $$
  select coalesce(override, case when part in (4, 5, 6, 7) then 2 else 1 end);
$$;

create or replace function public.ch_score(part integer, kind text, raw text, keys jsonb, partials jsonb, keyword text, max_override integer)
returns jsonb
language plpgsql
immutable
as $$
declare
  max_pts integer := public.ch_max_points(part, max_override);
  answer text := public.ch_norm(raw);
  full_keys text[];
  partial text[];
begin
  if answer = '' then
    return jsonb_build_object('status', 'empty', 'points', 0, 'max', max_pts, 'review', false);
  end if;
  select coalesce(array_agg(public.ch_norm(value)), '{}') into full_keys from jsonb_array_elements_text(coalesce(keys, '[]'::jsonb)) as value;
  select coalesce(array_agg(public.ch_norm(value)), '{}') into partial from jsonb_array_elements_text(coalesce(partials, '[]'::jsonb)) as value;
  if part = 4 and kind = 'text' then
    if answer = any(full_keys) then
      return jsonb_build_object('status', 'correct', 'points', 2, 'max', max_pts, 'review', false);
    elsif answer = any(partial) then
      return jsonb_build_object('status', 'partial', 'points', 1, 'max', max_pts, 'review', false);
    elsif keyword is not null and answer like '%' || public.ch_norm(keyword) || '%' then
      return jsonb_build_object('status', 'review', 'points', null, 'max', max_pts, 'review', true);
    else
      return jsonb_build_object('status', 'incorrect', 'points', 0, 'max', max_pts, 'review', false);
    end if;
  end if;
  if answer = any(full_keys) then
    return jsonb_build_object('status', 'correct', 'points', max_pts, 'max', max_pts, 'review', false);
  end if;
  return jsonb_build_object('status', 'incorrect', 'points', 0, 'max', max_pts, 'review', false);
end;
$$;

create or replace function public.ch_record_error(uid uuid, code text, raw text, explanation text, part_label text, grammar text, origin text, review boolean)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  row_id uuid;
begin
  insert into public.ch_error_book (user_id, pattern, error_text, correction, part, grammar, origin, status, review_count, due_at)
  values (
    uid, code, left(coalesce(raw, ''), 500), explanation, part_label, grammar, origin,
    case when review then 'revision' else 'pendiente' end,
    1, now() + interval '1 day'
  )
  on conflict (user_id, pattern) do update
  set seen_sessions = public.ch_error_book.seen_sessions + 1,
      review_count = public.ch_error_book.review_count + 1,
      status = case
        when public.ch_error_book.status = 'dominado' then 'reaparecido'
        when review then 'revision'
        else 'pendiente'
      end,
      due_at = now() + interval '1 day',
      last_seen = now(),
      error_text = excluded.error_text,
      correction = excluded.correction
  returning id into row_id;
  return row_id;
end;
$$;

create or replace function public.ch_note_success(uid uuid, code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  select review_count into n from public.ch_error_book where user_id = uid and pattern = code;
  if n is null then
    return;
  end if;
  update public.ch_error_book
  set review_count = review_count + 1,
      due_at = now() + make_interval(days => case when review_count + 1 <= 1 then 3 when review_count + 1 = 2 then 7 when review_count + 1 = 3 then 14 else 30 end),
      last_seen = now()
  where user_id = uid and pattern = code and status <> 'dominado';
end;
$$;

create or replace function public.ch_grade_one(uid uuid, code text, raw text, origin text, audio_opened boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  bank public.ch_exercise_bank%rowtype;
  keys public.ch_exercise_answers%rowtype;
  scored jsonb;
  counts boolean := true;
  correct_text text;
  err_id uuid;
begin
  if uid is null then
    raise exception 'Hace falta una sesión';
  end if;
  select * into bank from public.ch_exercise_bank where ch_exercise_bank.code = ch_grade_one.code;
  if not found then
    raise exception 'Ejercicio desconocido';
  end if;
  select * into keys from public.ch_exercise_answers where exercise_id = bank.id;
  if not found then
    raise exception 'Ejercicio sin clave';
  end if;
  scored := public.ch_score(bank.part, bank.type, raw, keys.answers, keys.partial, keys.keyword, keys.max_points);
  if scored->>'status' = 'empty' then
    return scored || jsonb_build_object('code', code, 'skill', bank.skill, 'part', bank.part);
  end if;
  if bank.skill = 'listening' and audio_opened is distinct from true then
    counts := false;
  end if;
  insert into public.ch_exercise_attempts (user_id, exercise_id, answer, status, points, max_points, review, counts, origin)
  values (
    uid, bank.id, left(raw, 2000), scored->>'status',
    nullif(scored->>'points', '')::integer,
    (scored->>'max')::integer,
    (scored->>'review')::boolean,
    counts,
    origin
  );
  select value into correct_text from jsonb_array_elements_text(keys.answers) as value limit 1;
  if (scored->>'status') in ('incorrect', 'review') then
    err_id := public.ch_record_error(uid, code, raw, keys.explanation, 'Part ' || coalesce(bank.part::text, ''), bank.grammar, origin, (scored->>'review')::boolean);
  elsif (scored->>'status') in ('correct', 'partial') then
    perform public.ch_note_success(uid, code);
  end if;
  return scored || jsonb_build_object(
    'code', code,
    'skill', bank.skill,
    'part', bank.part,
    'grammar', bank.grammar,
    'counts', counts,
    'explanation', keys.explanation,
    'correct_text', correct_text,
    'error_id', err_id
  );
end;
$$;

create or replace function public.ch_grade_exercise(p_code text, p_answer text, p_origin text default 'clase', p_audio_opened boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.ch_grade_one(auth.uid(), p_code, coalesce(p_answer, ''), coalesce(p_origin, 'clase'), p_audio_opened);
end;
$$;

create or replace function public.ch_finish_mock(p_kind text, p_started_at timestamptz, p_answers jsonb, p_audio_opened boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  item jsonb;
  graded jsonb;
  parts jsonb := '{}'::jsonb;
  total integer := 0;
  max_total integer := 0;
  unanswered integer := 0;
  n integer := 0;
  started timestamptz := coalesce(p_started_at, now());
  elapsed integer;
  early boolean;
  mock_id uuid;
  week date;
begin
  if uid is null then
    raise exception 'Hace falta una sesión';
  end if;
  if p_kind not in ('mini', 'skill', 'full', 'muestra') then
    raise exception 'Tipo de simulacro desconocido';
  end if;
  if started > now() then
    started := now();
  end if;
  for item in select * from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb))
  loop
    n := n + 1;
    if length(trim(coalesce(item->>'answer', ''))) = 0 then
      unanswered := unanswered + 1;
      continue;
    end if;
    graded := public.ch_grade_one(uid, item->>'code', item->>'answer', 'simulacro', p_audio_opened);
    if graded->>'status' = 'empty' then
      unanswered := unanswered + 1;
      continue;
    end if;
    if coalesce((graded->>'counts')::boolean, true) and graded->>'points' is not null then
      total := total + (graded->>'points')::integer;
    end if;
    max_total := max_total + coalesce((graded->>'max')::integer, 0);
    parts := parts || jsonb_build_object(
      coalesce(graded->>'part', item->>'code'),
      jsonb_build_object('points', graded->'points', 'max', graded->'max', 'status', graded->>'status', 'counts', graded->'counts')
    );
  end loop;
  elapsed := greatest(0, floor(extract(epoch from (now() - started)))::integer);
  early := unanswered > 0;
  perform set_config('ch.bypass', 'on', true);
  insert into public.ch_mock_attempts (user_id, kind, started_at, duration_seconds, early_stop, conditions, points_by_part, total_points, total_max, status)
  values (
    uid, p_kind, started, elapsed, early,
    jsonb_build_object('audio', case when p_audio_opened then 'real' else 'sin audio real' end, 'items', n, 'unanswered', unanswered),
    parts, total, max_total,
    case when early then 'incomplete' else 'completed' end
  )
  returning id into mock_id;
  if not early then
    week := date_trunc('week', now())::date;
    insert into public.ch_study_sessions (user_id, skill, teacher, week_start, week_day, duration_target, completed_at, status, elapsed_seconds, measured)
    values (uid, 'exam', 'Richard', week, extract(isodow from now())::integer - 1, case p_kind when 'mini' then 45 when 'full' then 60 else 45 end, now(), 'completed', elapsed, true);
  end if;
  return jsonb_build_object(
    'id', mock_id,
    'kind', p_kind,
    'total_points', total,
    'total_max', max_total,
    'early_stop', early,
    'duration_seconds', elapsed,
    'points_by_part', parts,
    'status', case when early then 'incomplete' else 'completed' end
  );
end;
$$;

create or replace function public.ch_submit_placement(p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  item jsonb;
  graded jsonb;
  total integer := 0;
  max_total integer := 0;
  ratio numeric;
  band text;
begin
  if uid is null then
    raise exception 'Hace falta una sesión';
  end if;
  for item in select * from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb))
  loop
    if length(trim(coalesce(item->>'answer', ''))) = 0 then
      continue;
    end if;
    graded := public.ch_grade_one(uid, item->>'code', item->>'answer', 'placement', true);
    if graded->>'points' is not null then
      total := total + (graded->>'points')::integer;
    end if;
    max_total := max_total + coalesce((graded->>'max')::integer, 0);
  end loop;
  if max_total = 0 then
    raise exception 'La prueba no tiene respuestas';
  end if;
  ratio := total::numeric / max_total;
  band := case
    when ratio < 0.4 then 'Refuerzo previo · formativa'
    when ratio < 0.7 then 'B2 estimado · formativa'
    else 'Transición hacia C1 · formativa'
  end;
  perform set_config('ch.bypass', 'on', true);
  update public.ch_profiles
  set estimated_level = band,
      placement_points = total,
      placement_max = max_total,
      placement_at = now()
  where user_id = uid;
  return jsonb_build_object('level', band, 'points', total, 'max', max_total, 'at', now());
end;
$$;

create or replace function public.ch_report_class(p_week_day integer, p_done boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  week date := date_trunc('week', now())::date;
  labels text[] := array['speaking', 'grammar', 'listening', 'writing', 'speaking', 'exam', 'progress'];
  teachers text[] := array['James', 'Oliver', 'Sarah', 'Emma', 'James', 'Richard', 'Sir Edward'];
begin
  if uid is null or p_week_day < 0 or p_week_day > 6 then
    raise exception 'Día no válido';
  end if;
  if p_done then
    if not exists (
      select 1 from public.ch_study_sessions
      where user_id = uid and week_start = week and week_day = p_week_day and status = 'completed' and measured = false
    ) then
      insert into public.ch_study_sessions (user_id, skill, teacher, week_start, week_day, status, completed_at, elapsed_seconds, measured)
      values (uid, labels[p_week_day + 1], teachers[p_week_day + 1], week, p_week_day, 'completed', now(), 0, false);
    end if;
  else
    delete from public.ch_study_sessions
    where user_id = uid and week_start = week and week_day = p_week_day and status = 'completed' and measured = false;
  end if;
end;
$$;

create or replace function public.ch_set_writing_feedback(p_id uuid, p_rubric jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Hace falta una sesión';
  end if;
  perform set_config('ch.bypass', 'on', true);
  update public.ch_writing_submissions
  set rubric = p_rubric, status = 'reviewed'
  where id = p_id and user_id = auth.uid();
end;
$$;

create or replace function public.ch_set_speaking_feedback(p_id uuid, p_feedback jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Hace falta una sesión';
  end if;
  perform set_config('ch.bypass', 'on', true);
  update public.ch_speaking_sessions
  set feedback = p_feedback, status = 'completed', completed_at = now()
  where id = p_id and user_id = auth.uid();
end;
$$;

create or replace function public.ch_log_ai(p_feature text, p_provider text, p_model text, p_input integer, p_output integer, p_pending boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Hace falta una sesión';
  end if;
  insert into public.ch_ai_usage (user_id, feature, provider, model, input_tokens, output_tokens, pending)
  values (auth.uid(), p_feature, p_provider, p_model, p_input, p_output, coalesce(p_pending, true));
end;
$$;

revoke all on function public.ch_norm(text) from public, anon, authenticated;
revoke all on function public.ch_max_points(integer, integer) from public, anon, authenticated;
revoke all on function public.ch_score(integer, text, text, jsonb, jsonb, text, integer) from public, anon, authenticated;
revoke all on function public.ch_record_error(uuid, text, text, text, text, text, text, boolean) from public, anon, authenticated;
revoke all on function public.ch_note_success(uuid, text) from public, anon, authenticated;
revoke all on function public.ch_grade_one(uuid, text, text, text, boolean) from public, anon, authenticated;
revoke all on function public.ch_grade_exercise(text, text, text, boolean) from public, anon;
revoke all on function public.ch_finish_mock(text, timestamptz, jsonb, boolean) from public, anon;
revoke all on function public.ch_submit_placement(jsonb) from public, anon;
revoke all on function public.ch_report_class(integer, boolean) from public, anon;
grant execute on function public.ch_grade_exercise(text, text, text, boolean) to authenticated;
grant execute on function public.ch_finish_mock(text, timestamptz, jsonb, boolean) to authenticated;
grant execute on function public.ch_submit_placement(jsonb) to authenticated;
grant execute on function public.ch_report_class(integer, boolean) to authenticated;
grant execute on function public.ch_set_writing_feedback(uuid, jsonb) to authenticated;
grant execute on function public.ch_set_speaking_feedback(uuid, jsonb) to authenticated;
grant execute on function public.ch_log_ai(text, text, text, integer, integer, boolean) to authenticated;
revoke all on function public.ch_set_writing_feedback(uuid, jsonb) from public, anon;
revoke all on function public.ch_set_speaking_feedback(uuid, jsonb) from public, anon;
revoke all on function public.ch_log_ai(text, text, text, integer, integer, boolean) from public, anon;

alter table public.ch_profiles enable row level security;
alter table public.ch_study_sessions enable row level security;
alter table public.ch_exercise_bank enable row level security;
alter table public.ch_exercise_answers enable row level security;
alter table public.ch_exercise_attempts enable row level security;
alter table public.ch_error_book enable row level security;
alter table public.ch_vocabulary_items enable row level security;
alter table public.ch_writing_submissions enable row level security;
alter table public.ch_speaking_sessions enable row level security;
alter table public.ch_resource_catalog enable row level security;
alter table public.ch_ai_usage enable row level security;
alter table public.ch_mock_attempts enable row level security;

alter table public.ch_profiles force row level security;
alter table public.ch_study_sessions force row level security;
alter table public.ch_exercise_bank force row level security;
alter table public.ch_exercise_answers force row level security;
alter table public.ch_exercise_attempts force row level security;
alter table public.ch_error_book force row level security;
alter table public.ch_vocabulary_items force row level security;
alter table public.ch_writing_submissions force row level security;
alter table public.ch_speaking_sessions force row level security;
alter table public.ch_resource_catalog force row level security;
alter table public.ch_ai_usage force row level security;
alter table public.ch_mock_attempts force row level security;

revoke all on table
  public.ch_profiles, public.ch_study_sessions, public.ch_exercise_bank, public.ch_exercise_answers,
  public.ch_exercise_attempts, public.ch_error_book, public.ch_vocabulary_items, public.ch_writing_submissions,
  public.ch_speaking_sessions, public.ch_resource_catalog, public.ch_ai_usage, public.ch_mock_attempts
from public, anon;

grant select on table public.ch_exercise_bank, public.ch_resource_catalog to anon, authenticated;
grant select, update on table public.ch_profiles to authenticated;
grant select, insert, delete on table public.ch_study_sessions to authenticated;
grant select on table public.ch_exercise_attempts, public.ch_mock_attempts to authenticated;
grant select, update, delete on table public.ch_error_book to authenticated;
grant select, insert, update, delete on table public.ch_vocabulary_items to authenticated;
grant select, insert on table public.ch_writing_submissions to authenticated;
grant select, insert, update on table public.ch_speaking_sessions to authenticated;
grant select, insert on table public.ch_ai_usage to authenticated;

drop policy if exists ch_profiles_select on public.ch_profiles;
create policy ch_profiles_select on public.ch_profiles for select to authenticated using (user_id = auth.uid());
drop policy if exists ch_profiles_update on public.ch_profiles;
create policy ch_profiles_update on public.ch_profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists ch_sessions_select on public.ch_study_sessions;
create policy ch_sessions_select on public.ch_study_sessions for select to authenticated using (user_id = auth.uid());
drop policy if exists ch_sessions_insert on public.ch_study_sessions;
create policy ch_sessions_insert on public.ch_study_sessions for insert to authenticated with check (user_id = auth.uid());
drop policy if exists ch_sessions_delete on public.ch_study_sessions;
create policy ch_sessions_delete on public.ch_study_sessions for delete to authenticated using (user_id = auth.uid() and measured = false);

drop policy if exists ch_bank_read on public.ch_exercise_bank;
create policy ch_bank_read on public.ch_exercise_bank for select to anon, authenticated using (true);
drop policy if exists ch_catalog_read on public.ch_resource_catalog;
create policy ch_catalog_read on public.ch_resource_catalog for select to anon, authenticated using (true);

drop policy if exists ch_attempts_select on public.ch_exercise_attempts;
create policy ch_attempts_select on public.ch_exercise_attempts for select to authenticated using (user_id = auth.uid());
drop policy if exists ch_mocks_select on public.ch_mock_attempts;
create policy ch_mocks_select on public.ch_mock_attempts for select to authenticated using (user_id = auth.uid());

drop policy if exists ch_errors_select on public.ch_error_book;
create policy ch_errors_select on public.ch_error_book for select to authenticated using (user_id = auth.uid());
drop policy if exists ch_errors_update on public.ch_error_book;
create policy ch_errors_update on public.ch_error_book for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists ch_errors_delete on public.ch_error_book;
create policy ch_errors_delete on public.ch_error_book for delete to authenticated using (user_id = auth.uid());

drop policy if exists ch_vocab_all on public.ch_vocabulary_items;
create policy ch_vocab_all on public.ch_vocabulary_items for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists ch_writing_select on public.ch_writing_submissions;
create policy ch_writing_select on public.ch_writing_submissions for select to authenticated using (user_id = auth.uid());
drop policy if exists ch_writing_insert on public.ch_writing_submissions;
create policy ch_writing_insert on public.ch_writing_submissions for insert to authenticated with check (user_id = auth.uid());

drop policy if exists ch_speaking_select on public.ch_speaking_sessions;
create policy ch_speaking_select on public.ch_speaking_sessions for select to authenticated using (user_id = auth.uid());
drop policy if exists ch_speaking_insert on public.ch_speaking_sessions;
create policy ch_speaking_insert on public.ch_speaking_sessions for insert to authenticated with check (user_id = auth.uid());
drop policy if exists ch_speaking_update on public.ch_speaking_sessions;
create policy ch_speaking_update on public.ch_speaking_sessions for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists ch_ai_select on public.ch_ai_usage;
create policy ch_ai_select on public.ch_ai_usage for select to authenticated using (user_id = auth.uid());
drop policy if exists ch_ai_insert on public.ch_ai_usage;
create policy ch_ai_insert on public.ch_ai_usage for insert to authenticated with check (user_id = auth.uid() and pending = true and input_tokens is null and estimated_cost is null);

comment on table public.ch_exercise_answers is 'Answer keys. No client role can select this table. Grading goes through ch_grade_exercise.';
comment on table public.ch_ai_usage is 'Token counts only when a provider returns them. estimated_cost stays null until a real tariff is known.';
