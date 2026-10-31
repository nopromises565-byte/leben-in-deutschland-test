create table if not exists public.questions (
  id text primary key,
  state_slug text,
  category text,
  question_de text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_index integer not null check (correct_index between 0 and 3),
  explanation_de text,
  mnemonic_de text,
  image text,
  updated_at timestamptz not null default now()
);

alter table public.questions enable row level security;

create policy "authenticated can read questions"
on public.questions for select
to authenticated
using (true);

create policy "admins can insert questions"
on public.questions for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "admins can update questions"
on public.questions for update
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "admins can delete questions"
on public.questions for delete
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create index if not exists questions_state_slug_idx on public.questions(state_slug);
create index if not exists questions_category_idx on public.questions(category);
