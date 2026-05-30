-- Allow one private MVP and one private spirit score per team in each game.
-- Visibility remains creator/admin before tournament end and public after end.

alter table public.match_mvps
drop constraint if exists match_mvps_game_id_key;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'match_mvps_game_id_team_id_key'
      and conrelid = 'public.match_mvps'::regclass
  ) then
    alter table public.match_mvps
    add constraint match_mvps_game_id_team_id_key unique (game_id, team_id);
  end if;
end;
$$;

drop policy if exists "match mvps are visible to creator admins and finished tournaments" on public.match_mvps;
drop policy if exists "match mvps are visible to editors admins and finished tournaments" on public.match_mvps;
drop policy if exists "match mvps are visible to creator and admins" on public.match_mvps;

create policy "match mvps are visible to creator and admins"
on public.match_mvps
for select
to anon, authenticated
using (
  public.is_admin()
  or created_by = auth.uid()
);

drop trigger if exists trg_prevent_duplicate_spirit_score on public.spirit_scores;
drop function if exists public.prevent_duplicate_spirit_score();

alter table public.spirit_scores
drop constraint if exists spirit_scores_game_id_evaluated_team_id_created_by_key;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'spirit_scores_game_id_evaluated_team_id_key'
      and conrelid = 'public.spirit_scores'::regclass
  ) then
    alter table public.spirit_scores
    add constraint spirit_scores_game_id_evaluated_team_id_key unique (game_id, evaluated_team_id);
  end if;
end;
$$;

drop policy if exists "spirit scores are visible to creator admins and finished tournaments" on public.spirit_scores;
drop policy if exists "spirit scores are visible to creator and admins" on public.spirit_scores;

create policy "spirit scores are visible to creator and admins"
on public.spirit_scores
for select
to anon, authenticated
using (
  public.is_admin()
  or created_by = auth.uid()
);

create or replace function public.get_public_tournament_spirit_stats()
returns table (
  tournament_id uuid,
  team_id uuid,
  team_name text,
  score_count bigint,
  total_score bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    games.tournament_id,
    spirit_scores.evaluated_team_id as team_id,
    teams.name as team_name,
    count(*) as score_count,
    coalesce(sum(spirit_scores.total_score), 0)::bigint as total_score
  from public.spirit_scores
  join public.games on games.id = spirit_scores.game_id
  join public.teams on teams.id = spirit_scores.evaluated_team_id
  where public.is_admin()
    or public.is_tournament_finished(games.tournament_id)
  group by games.tournament_id, spirit_scores.evaluated_team_id, teams.name
  order by total_score desc, teams.name asc;
$$;

create or replace function public.get_public_tournament_mvp_stats()
returns table (
  tournament_id uuid,
  player_id uuid,
  player_name text,
  gender text,
  mvp_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with mvp_players as (
    select games.tournament_id, players.id, players.name, players.nickname, players.gender
    from public.match_mvps
    join public.games on games.id = match_mvps.game_id
    join public.players on players.id = match_mvps.male_player_id
    where public.is_admin()
      or public.is_tournament_finished(games.tournament_id)

    union all

    select games.tournament_id, players.id, players.name, players.nickname, players.gender
    from public.match_mvps
    join public.games on games.id = match_mvps.game_id
    join public.players on players.id = match_mvps.female_player_id
    where public.is_admin()
      or public.is_tournament_finished(games.tournament_id)
  )
  select
    mvp_players.tournament_id,
    mvp_players.id as player_id,
    coalesce(nullif(trim(mvp_players.nickname), ''), mvp_players.name) as player_name,
    mvp_players.gender::text as gender,
    count(*) as mvp_count
  from mvp_players
  group by mvp_players.tournament_id, mvp_players.id, player_name, mvp_players.gender
  order by mvp_count desc, player_name asc;
$$;

grant execute on function public.get_public_tournament_spirit_stats() to anon, authenticated;
grant execute on function public.get_public_tournament_mvp_stats() to anon, authenticated;
