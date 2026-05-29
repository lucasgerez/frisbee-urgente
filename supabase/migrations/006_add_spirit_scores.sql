-- Add Spirit of the Game scores. Editors/admins can write; creators and admins can read.

create or replace function public.is_editor()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('editor', 'admin');
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin';
$$;

create table if not exists public.spirit_scores (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  evaluated_team_id uuid not null references public.teams(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade default auth.uid(),
  rules_knowledge smallint not null check (rules_knowledge between 0 and 4),
  fouls_contact smallint not null check (fouls_contact between 0 and 4),
  fairness smallint not null check (fairness between 0 and 4),
  positive_attitude smallint not null check (positive_attitude between 0 and 4),
  communication smallint not null check (communication between 0 and 4),
  total_score smallint generated always as (
    rules_knowledge + fouls_contact + fairness + positive_attitude + communication
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (game_id, evaluated_team_id, created_by)
);

create index if not exists spirit_scores_game_id_idx on public.spirit_scores(game_id);
create index if not exists spirit_scores_created_by_idx on public.spirit_scores(created_by);

alter table public.spirit_scores enable row level security;

drop policy if exists "spirit scores are visible to creator and admins" on public.spirit_scores;
drop policy if exists "spirit scores are insertable by editors and admins" on public.spirit_scores;
drop policy if exists "spirit scores are updateable by creator and admins" on public.spirit_scores;
drop policy if exists "spirit scores are deletable by creator and admins" on public.spirit_scores;

create policy "spirit scores are visible to creator and admins"
on public.spirit_scores
for select
to authenticated
using (created_by = auth.uid() or public.is_admin());

create policy "spirit scores are insertable by editors and admins"
on public.spirit_scores
for insert
to authenticated
with check (public.is_editor() and created_by = auth.uid());

create policy "spirit scores are updateable by creator and admins"
on public.spirit_scores
for update
to authenticated
using ((created_by = auth.uid() and public.is_editor()) or public.is_admin())
with check ((created_by = auth.uid() and public.is_editor()) or public.is_admin());

create policy "spirit scores are deletable by creator and admins"
on public.spirit_scores
for delete
to authenticated
using ((created_by = auth.uid() and public.is_editor()) or public.is_admin());

create or replace function public.set_spirit_scores_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_spirit_scores_updated_at on public.spirit_scores;
create trigger trg_spirit_scores_updated_at
before update on public.spirit_scores
for each row execute function public.set_spirit_scores_updated_at();
