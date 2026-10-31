create table if not exists public.user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  learned_ids text[] not null default '{}',
  wrong_ids text[] not null default '{}',
  favorite_ids text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.exam_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  score integer not null check (score between 0 and 33),
  passed boolean not null,
  state_slug text,
  created_at timestamptz not null default now()
);

alter table public.user_progress enable row level security;
alter table public.exam_results enable row level security;

drop policy if exists "users read own progress" on public.user_progress;
create policy "users read own progress" on public.user_progress for select to authenticated
using (auth.uid() = user_id or exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));

drop policy if exists "users insert own progress" on public.user_progress;
create policy "users insert own progress" on public.user_progress for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users update own progress" on public.user_progress;
create policy "users update own progress" on public.user_progress for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users read own exams" on public.exam_results;
create policy "users read own exams" on public.exam_results for select to authenticated
using (auth.uid() = user_id or exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));

drop policy if exists "users insert own exams" on public.exam_results;
create policy "users insert own exams" on public.exam_results for insert to authenticated
with check (auth.uid() = user_id);

create index if not exists exam_results_user_id_idx on public.exam_results(user_id);
create index if not exists exam_results_created_at_idx on public.exam_results(created_at desc);
