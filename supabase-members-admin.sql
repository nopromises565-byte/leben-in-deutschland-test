alter table public.profiles
  add column if not exists email text,
  add column if not exists blocked boolean not null default false;

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and (p.email is null or p.email = '');

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role, blocked)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name',''),
    new.email,
    'member',
    false
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of email on auth.users
for each row execute procedure public.handle_new_user();

-- Hilfsfunktion vermeidet rekursive RLS-Prüfungen auf profiles.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.profiles enable row level security;

drop policy if exists "users can read own profile" on public.profiles;
drop policy if exists "users can update own profile" on public.profiles;
drop policy if exists "admins read all profiles" on public.profiles;
drop policy if exists "admins update profiles" on public.profiles;

create policy "users can read own profile"
on public.profiles for select
to authenticated
using (auth.uid() = id);

create policy "admins read all profiles"
on public.profiles for select
to authenticated
using (public.is_admin());

create policy "users update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id and blocked = false)
with check (
  auth.uid() = id
  and role = (select p.role from public.profiles p where p.id = auth.uid())
  and blocked = (select p.blocked from public.profiles p where p.id = auth.uid())
);

create policy "admins update profiles"
on public.profiles for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
