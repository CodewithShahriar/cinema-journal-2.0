-- Run this in Supabase Dashboard → SQL Editor, or apply with the Supabase CLI.
-- Each authenticated (including anonymous) user can access only their own movies.

create table if not exists public.movies (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  tmdb_id integer not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists movies_user_id_updated_at_idx
  on public.movies (user_id, updated_at desc);

alter table public.movies enable row level security;

create policy "Users can view their own movies"
  on public.movies for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own movies"
  on public.movies for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own movies"
  on public.movies for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own movies"
  on public.movies for delete
  to authenticated
  using ((select auth.uid()) = user_id);
