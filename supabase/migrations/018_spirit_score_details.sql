-- Per-game / per-item spirit score details for public consumption.
-- Same visibility rule as get_public_tournament_spirit_stats: admin OR finished tournament.

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
    games.id as game_id,
    case when spirit_scores.evaluated_team_id = games.team_a_id
         then games.team_b_id else games.team_a_id end as opponent_team_id,
    opp.name as opponent_team_name,
    coalesce(games.started_at, games.ended_at, games.created_at) as game_date,
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
  where public.is_admin()
    or public.is_tournament_finished(games.tournament_id)
  order by spirit_scores.evaluated_team_id, game_date asc;
$$;

grant execute on function public.get_public_tournament_spirit_score_details() to anon, authenticated;
