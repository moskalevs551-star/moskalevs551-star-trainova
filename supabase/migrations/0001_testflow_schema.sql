create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  provider text,
  daily_goal integer not null default 20,
  streak integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category text,
  language text not null default 'ru',
  source_format text not null default 'qst',
  source_file_name text,
  source_encoding text,
  visibility text not null default 'private' check (visibility in ('private', 'link', 'public', 'password')),
  share_token uuid not null default gen_random_uuid(),
  question_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id) on delete cascade,
  number integer not null,
  text text not null,
  status text not null default 'valid' check (status in ('valid', 'needs_review', 'invalid')),
  flagged boolean not null default false,
  favorite boolean not null default false,
  difficult boolean not null default false,
  explanation text,
  source_line integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (test_id, number)
);

create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  test_id uuid not null references public.tests(id) on delete cascade,
  text text not null,
  correct boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.test_settings (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null unique references public.tests(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  test_id uuid not null references public.tests(id) on delete cascade,
  score_percent numeric not null default 0,
  correct_count integer not null default 0,
  wrong_count integer not null default 0,
  skipped_count integer not null default 0,
  time_spent_seconds integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  answer_id uuid references public.answers(id) on delete set null,
  is_correct boolean not null default false,
  skipped boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  test_id uuid not null references public.tests(id) on delete cascade,
  last_question_id uuid references public.questions(id) on delete set null,
  progress_percent numeric not null default 0,
  best_score_percent numeric not null default 0,
  wrong_question_ids jsonb not null default '[]'::jsonb,
  favorite_question_ids jsonb not null default '[]'::jsonb,
  difficult_question_ids jsonb not null default '[]'::jsonb,
  time_spent_seconds integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, test_id)
);

create table if not exists public.wrong_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  test_id uuid not null references public.tests(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  wrong_count integer not null default 1,
  last_wrong_at timestamptz not null default now(),
  unique (test_id, user_id, question_id)
);

create table if not exists public.favorite_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  test_id uuid not null references public.tests(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (test_id, user_id, question_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists tests_set_updated_at on public.tests;
create trigger tests_set_updated_at before update on public.tests
  for each row execute procedure public.set_updated_at();

drop trigger if exists questions_set_updated_at on public.questions;
create trigger questions_set_updated_at before update on public.questions
  for each row execute procedure public.set_updated_at();

drop trigger if exists test_settings_set_updated_at on public.test_settings;
create trigger test_settings_set_updated_at before update on public.test_settings
  for each row execute procedure public.set_updated_at();

create schema if not exists private;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, provider)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_app_meta_data->>'provider'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url,
    provider = excluded.provider,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update on auth.users
  for each row execute procedure private.handle_new_user();

alter table public.profiles enable row level security;
alter table public.tests enable row level security;
alter table public.questions enable row level security;
alter table public.answers enable row level security;
alter table public.test_settings enable row level security;
alter table public.attempts enable row level security;
alter table public.attempt_answers enable row level security;
alter table public.user_progress enable row level security;
alter table public.wrong_questions enable row level security;
alter table public.favorite_questions enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "tests_select_visible" on public.tests
  for select to anon, authenticated
  using (
    visibility in ('public', 'link')
    or ((select auth.uid()) is not null and user_id = (select auth.uid()))
  );

create policy "tests_insert_own" on public.tests
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "tests_update_own" on public.tests
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "tests_delete_own" on public.tests
  for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "questions_select_visible_tests" on public.questions
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.tests
      where tests.id = questions.test_id
      and (
        tests.visibility in ('public', 'link')
        or ((select auth.uid()) is not null and tests.user_id = (select auth.uid()))
      )
    )
  );

create policy "questions_insert_own" on public.questions
  for insert to authenticated
  with check (
    exists (
      select 1 from public.tests
      where tests.id = questions.test_id
      and tests.user_id = (select auth.uid())
    )
  );

create policy "questions_update_own" on public.questions
  for update to authenticated
  using (
    exists (
      select 1 from public.tests
      where tests.id = questions.test_id
      and tests.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.tests
      where tests.id = questions.test_id
      and tests.user_id = (select auth.uid())
    )
  );

create policy "questions_delete_own" on public.questions
  for delete to authenticated
  using (
    exists (
      select 1 from public.tests
      where tests.id = questions.test_id
      and tests.user_id = (select auth.uid())
    )
  );

create policy "answers_select_visible_tests" on public.answers
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.tests
      where tests.id = answers.test_id
      and (
        tests.visibility in ('public', 'link')
        or ((select auth.uid()) is not null and tests.user_id = (select auth.uid()))
      )
    )
  );

create policy "answers_insert_own" on public.answers
  for insert to authenticated
  with check (
    exists (
      select 1 from public.tests
      where tests.id = answers.test_id
      and tests.user_id = (select auth.uid())
    )
  );

create policy "answers_update_own" on public.answers
  for update to authenticated
  using (
    exists (
      select 1 from public.tests
      where tests.id = answers.test_id
      and tests.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.tests
      where tests.id = answers.test_id
      and tests.user_id = (select auth.uid())
    )
  );

create policy "answers_delete_own" on public.answers
  for delete to authenticated
  using (
    exists (
      select 1 from public.tests
      where tests.id = answers.test_id
      and tests.user_id = (select auth.uid())
    )
  );

create policy "settings_select_visible_tests" on public.test_settings
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.tests
      where tests.id = test_settings.test_id
      and (
        tests.visibility in ('public', 'link')
        or ((select auth.uid()) is not null and tests.user_id = (select auth.uid()))
      )
    )
  );

create policy "settings_write_own" on public.test_settings
  for all to authenticated
  using (
    exists (
      select 1 from public.tests
      where tests.id = test_settings.test_id
      and tests.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.tests
      where tests.id = test_settings.test_id
      and tests.user_id = (select auth.uid())
    )
  );

create policy "attempts_select_own" on public.attempts
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "attempts_write_own" on public.attempts
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "attempt_answers_select_own" on public.attempt_answers
  for select to authenticated
  using (
    exists (
      select 1 from public.attempts
      where attempts.id = attempt_answers.attempt_id
      and attempts.user_id = (select auth.uid())
    )
  );

create policy "attempt_answers_write_own" on public.attempt_answers
  for all to authenticated
  using (
    exists (
      select 1 from public.attempts
      where attempts.id = attempt_answers.attempt_id
      and attempts.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.attempts
      where attempts.id = attempt_answers.attempt_id
      and attempts.user_id = (select auth.uid())
    )
  );

create policy "progress_select_own" on public.user_progress
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "progress_write_own" on public.user_progress
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "wrong_questions_select_own" on public.wrong_questions
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "wrong_questions_write_own" on public.wrong_questions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "favorite_questions_select_own" on public.favorite_questions
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "favorite_questions_write_own" on public.favorite_questions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create index if not exists tests_user_id_idx on public.tests(user_id);
create index if not exists tests_share_token_idx on public.tests(share_token);
create index if not exists questions_test_id_idx on public.questions(test_id);
create index if not exists answers_question_id_idx on public.answers(question_id);
create index if not exists answers_test_id_idx on public.answers(test_id);
create index if not exists attempts_user_test_idx on public.attempts(user_id, test_id);
create index if not exists user_progress_user_test_idx on public.user_progress(user_id, test_id);
create index if not exists wrong_questions_user_test_idx on public.wrong_questions(user_id, test_id);
create index if not exists favorite_questions_user_test_idx on public.favorite_questions(user_id, test_id);
