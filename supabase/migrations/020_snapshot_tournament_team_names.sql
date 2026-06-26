-- Snapshot team names per tournament for full historical accuracy.

alter table public.tournament_teams
add column if not exists team_name text;

update public.tournament_teams
set team_name = teams.name
from public.teams
where tournament_teams.team_id = teams.id
  and tournament_teams.team_name is null;

alter table public.tournament_teams
alter column team_name set not null;

create or replace function public.set_tournament_team_snapshot()
returns trigger
language plpgsql
as $$
begin
  if new.team_name is null then
    select teams.name into new.team_name
    from public.teams
    where teams.id = new.team_id;
  end if;

  if new.team_name is null then
    raise exception 'Time nao encontrado para criar snapshot do torneio.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_set_tournament_team_snapshot on public.tournament_teams;
create trigger trg_set_tournament_team_snapshot
before insert on public.tournament_teams
for each row execute function public.set_tournament_team_snapshot();

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
    coalesce(tournament_teams.team_name, teams.name) as team_name,
    count(*) as score_count,
    coalesce(sum(spirit_scores.total_score), 0)::bigint as total_score
  from public.spirit_scores
  join public.games on games.id = spirit_scores.game_id
  join public.teams on teams.id = spirit_scores.evaluated_team_id
  left join public.tournament_teams
    on tournament_teams.tournament_id = games.tournament_id
   and tournament_teams.team_id = spirit_scores.evaluated_team_id
  where spirit_scores.archived_at is null
    and games.archived_at is null
    and (public.is_admin() or public.is_tournament_finished(games.tournament_id))
  group by games.tournament_id, spirit_scores.evaluated_team_id, coalesce(tournament_teams.team_name, teams.name)
  order by total_score desc, team_name asc;
$$;

create or replace function public.get_public_tournament_spirit_score_details()
returns table (
  tournament_id uuid,
  evaluated_team_id uuid,
  game_id uuid,
  opponent_team_id uuid,
  opponent_team_name text,
  game_date timestamptz,
  rules_knowledge smallint,
  fouls_contact smallint,
  fairness smallint,
  positive_attitude smallint,
  communication smallint,
  total_score smallint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    games.tournament_id,
    spirit_scores.evaluated_team_id,
    spirit_scores.game_id,
    case when spirit_scores.evaluated_team_id = games.team_a_id
         then games.team_b_id else games.team_a_id end as opponent_team_id,
    coalesce(opp_tt.team_name, opp.name) as opponent_team_name,
    games.started_at as game_date,
    spirit_scores.rules_knowledge,
    spirit_scores.fouls_contact,
    spirit_scores.fairness,
    spirit_scores.positive_attitude,
    spirit_scores.communication,
    spirit_scores.total_score
  from public.spirit_scores
  join public.games on games.id = spirit_scores.game_id
  join public.teams opp
    on opp.id = case when spirit_scores.evaluated_team_id = games.team_a_id
                     then games.team_b_id else games.team_a_id end
  left join public.tournament_teams opp_tt
    on opp_tt.tournament_id = games.tournament_id
   and opp_tt.team_id = opp.id
  where spirit_scores.archived_at is null
    and games.archived_at is null
    and (public.is_admin() or public.is_tournament_finished(games.tournament_id))
  order by spirit_scores.evaluated_team_id, game_date asc;
$$;

grant execute on function public.get_public_tournament_spirit_stats() to anon, authenticated;
grant execute on function public.get_public_tournament_spirit_score_details() to anon, authenticated;
