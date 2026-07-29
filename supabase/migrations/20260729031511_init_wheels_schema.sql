-- Omnipotent Wheelspin — initial schema
-- Tables: profiles, wheels
-- Security: Row Level Security so owners manage their own wheels and
-- anyone can read a wheel that has been made public (for share links).

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user, created automatically on signup.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  username   text,
  avatar_url text,
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'Public profile for each authenticated user.';

-- ---------------------------------------------------------------------------
-- wheels: a saved wheelspin. Options are stored as a JSONB array of objects:
--   [{ "id": "uuid", "label": "Pizza", "color": "#ff6b6b" }, ...]
-- ---------------------------------------------------------------------------
create table if not exists public.wheels (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null,
  description text,
  options     jsonb not null default '[]'::jsonb,
  is_public   boolean not null default false,
  share_id    text not null unique default replace(gen_random_uuid()::text, '-', ''),
  spin_count  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.wheels is 'A saved wheelspin with its list of options.';
comment on column public.wheels.options is 'JSONB array of { id, label, color } objects.';
comment on column public.wheels.share_id is 'Opaque token used for public share links (only resolvable when is_public = true).';

create index if not exists wheels_user_id_created_at_idx
  on public.wheels (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Keep updated_at fresh on every UPDATE to a wheel.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists wheels_set_updated_at on public.wheels;
create trigger wheels_set_updated_at
  before update on public.wheels
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Automatically create a profile row when a new auth user signs up.
-- SECURITY DEFINER so it can insert into public.profiles regardless of RLS.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.wheels   enable row level security;

-- profiles: publicly readable (usernames appear on shared wheels),
-- but only the owner may create/update their own row.
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- wheels: an owner sees their own wheels; anyone can read a public wheel.
drop policy if exists "Owners and the public can read wheels" on public.wheels;
create policy "Owners and the public can read wheels"
  on public.wheels for select
  using (auth.uid() = user_id or is_public = true);

drop policy if exists "Users can create their own wheels" on public.wheels;
create policy "Users can create their own wheels"
  on public.wheels for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own wheels" on public.wheels;
create policy "Users can update their own wheels"
  on public.wheels for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own wheels" on public.wheels;
create policy "Users can delete their own wheels"
  on public.wheels for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Role grants (RLS still governs row visibility on top of these).
-- ---------------------------------------------------------------------------
grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;

grant select on public.wheels to anon, authenticated;
grant insert, update, delete on public.wheels to authenticated;
