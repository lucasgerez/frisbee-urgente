-- Preserve tournament rosters and historical app data.

alter table public.teams add column if not exists archived_at timestamptz;
alter table public.players add column if not exists archived_at timestamptz;
alter table public.tournaments add column if not exists archived_at timestamptz;
alter table public.tournament_teams add column if not exists archived_at timestamptz;
alter table public.games add column if not exists archived_at timestamptz;
alter table public.goals add column if not exists archived_at timestamptz;
alter table public.defenses add column if not exists archived_at timestamptz;
alter table public.spirit_scores add column if not exists archived_at timestamptz;
alter table public.match_mvps add column if not exists archived_at timestamptz;

create table if not exists public.tournament_roster_players (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id),
  team_id uuid not null references public.teams(id),
  player_id uuid not null references public.players(id),
  name text not null,
  nickname text,
  number text,
  gender public.gender_enum not null,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists tournament_roster_players_tournament_team_idx
on public.tournament_roster_players(tournament_id, team_id);

create index if not exists tournament_roster_players_player_idx
on public.tournament_roster_players(player_id);

create unique index if not exists tournament_roster_players_active_key
on public.tournament_roster_players(tournament_id, team_id, player_id)
where archived_at is null;

insert into public.tournament_roster_players (
  tournament_id,
  team_id,
  player_id,
  name,
  nickname,
  number,
  gender
)
select
  tournament_teams.tournament_id,
  tournament_teams.team_id,
  players.id,
  players.name,
  players.nickname,
  players.number,
  players.gender
from public.tournament_teams
join public.players on players.team_id = tournament_teams.team_id
where tournament_teams.archived_at is null
  and players.archived_at is null
on conflict do nothing;

alter table public.goals
add column if not exists scorer_roster_player_id uuid references public.tournament_roster_players(id),
add column if not exists assistant_roster_player_id uuid references public.tournament_roster_players(id);

alter table public.defenses
add column if not exists roster_player_id uuid references public.tournament_roster_players(id);

alter table public.match_mvps
add column if not exists male_roster_player_id uuid references public.tournament_roster_players(id),
add column if not exists female_roster_player_id uuid references public.tournament_roster_players(id);

update public.goals
set scorer_roster_player_id = roster.id
from public.games, public.tournament_roster_players roster
where goals.game_id = games.id
  and roster.tournament_id = games.tournament_id
  and roster.team_id = goals.scoring_team_id
  and roster.player_id = goals.scorer_id
  and goals.scorer_roster_player_id is null;

update public.goals
set assistant_roster_player_id = roster.id
from public.games, public.tournament_roster_players roster
where goals.game_id = games.id
  and roster.tournament_id = games.tournament_id
  and roster.team_id = goals.scoring_team_id
  and roster.player_id = goals.assistant_id
  and goals.assistant_id is not null
  and goals.assistant_roster_player_id is null;

update public.defenses
set roster_player_id = roster.id
from public.games, public.tournament_roster_players roster
where defenses.game_id = games.id
  and roster.tournament_id = games.tournament_id
  and roster.team_id = defenses.team_id
  and roster.player_id = defenses.player_id
  and defenses.roster_player_id is null;

update public.match_mvps
set male_roster_player_id = roster.id
from public.games, public.tournament_roster_players roster
where match_mvps.game_id = games.id
  and roster.tournament_id = games.tournament_id
  and roster.team_id = match_mvps.team_id
  and roster.player_id = match_mvps.male_player_id
  and match_mvps.male_roster_player_id is null;

update public.match_mvps
set female_roster_player_id = roster.id
from public.games, public.tournament_roster_players roster
where match_mvps.game_id = games.id
  and roster.tournament_id = games.tournament_id
  and roster.team_id = match_mvps.team_id
  and roster.player_id = match_mvps.female_player_id
  and match_mvps.female_roster_player_id is null;

create or replace function public.snapshot_tournament_team_roster()
returns trigger
language plpgsql
as $$
begin
  insert into public.tournament_roster_players (
    tournament_id,
    team_id,
    player_id,
    name,
    nickname,
    number,
    gender
  )
  select
    new.tournament_id,
    new.team_id,
    players.id,
    players.name,
    players.nickname,
    players.number,
    players.gender
  from public.players
  where players.team_id = new.team_id
    and players.archived_at is null
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists trg_snapshot_tournament_team_roster on public.tournament_teams;
create trigger trg_snapshot_tournament_team_roster
after insert on public.tournament_teams
for each row execute function public.snapshot_tournament_team_roster();

create or replace function public.validate_goal_roster()
returns trigger
language plpgsql
as $$
declare
  selected_game public.games%rowtype;
  scorer_roster public.tournament_roster_players%rowtype;
  assistant_roster public.tournament_roster_players%rowtype;
begin
  if new.archived_at is not null then
    return new;
  end if;

  select * into selected_game from public.games where id = new.game_id;
  if not found then
    raise exception 'Jogo nao encontrado.';
  end if;

  if new.scoring_team_id not in (selected_game.team_a_id, selected_game.team_b_id) then
    raise exception 'O time do gol nao pertence a este jogo.';
  end if;

  select * into scorer_roster
  from public.tournament_roster_players
  where id = new.scorer_roster_player_id;

  if not found
    or scorer_roster.tournament_id <> selected_game.tournament_id
    or scorer_roster.team_id <> new.scoring_team_id
    or scorer_roster.player_id <> new.scorer_id
    or scorer_roster.archived_at is not null then
    raise exception 'Pontuador deve estar inscrito no elenco deste torneio.';
  end if;

  if new.assistant_id is null then
    new.assistant_roster_player_id = null;
  else
    select * into assistant_roster
    from public.tournament_roster_players
    where id = new.assistant_roster_player_id;

    if not found
      or assistant_roster.tournament_id <> selected_game.tournament_id
      or assistant_roster.team_id <> new.scoring_team_id
      or assistant_roster.player_id <> new.assistant_id
      or assistant_roster.archived_at is not null then
      raise exception 'Assistente deve estar inscrito no elenco deste torneio.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_goal_roster on public.goals;
create trigger trg_validate_goal_roster
before insert or update on public.goals
for each row execute function public.validate_goal_roster();

create or replace function public.validate_defense_roster()
returns trigger
language plpgsql
as $$
declare
  selected_game public.games%rowtype;
  selected_roster public.tournament_roster_players%rowtype;
begin
  if new.archived_at is not null then
    return new;
  end if;

  select * into selected_game from public.games where id = new.game_id;
  if not found then
    raise exception 'Jogo nao encontrado.';
  end if;

  if new.team_id not in (selected_game.team_a_id, selected_game.team_b_id) then
    raise exception 'O time da defesa nao pertence a este jogo.';
  end if;

  select * into selected_roster
  from public.tournament_roster_players
  where id = new.roster_player_id;

  if not found
    or selected_roster.tournament_id <> selected_game.tournament_id
    or selected_roster.team_id <> new.team_id
    or selected_roster.player_id <> new.player_id
    or selected_roster.archived_at is not null then
    raise exception 'Jogador deve estar inscrito no elenco deste torneio.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_defense_roster on public.defenses;
create trigger trg_validate_defense_roster
before insert or update on public.defenses
for each row execute function public.validate_defense_roster();

create or replace function public.validate_match_mvp()
returns trigger
language plpgsql
as $$
declare
  selected_game public.games%rowtype;
  male_roster public.tournament_roster_players%rowtype;
  female_roster public.tournament_roster_players%rowtype;
begin
  if new.archived_at is not null then
    return new;
  end if;

  select * into selected_game from public.games where id = new.game_id;
  if not found then
    raise exception 'Jogo nao encontrado.';
  end if;

  if new.team_id not in (selected_game.team_a_id, selected_game.team_b_id) then
    raise exception 'O time selecionado nao pertence a este jogo.';
  end if;

  select * into male_roster
  from public.tournament_roster_players
  where id = new.male_roster_player_id;

  if not found
    or male_roster.tournament_id <> selected_game.tournament_id
    or male_roster.team_id <> new.team_id
    or male_roster.player_id <> new.male_player_id
    or male_roster.archived_at is not null then
    raise exception 'Destaque masculino deve estar inscrito no elenco deste torneio.';
  end if;

  select * into female_roster
  from public.tournament_roster_players
  where id = new.female_roster_player_id;

  if not found
    or female_roster.tournament_id <> selected_game.tournament_id
    or female_roster.team_id <> new.team_id
    or female_roster.player_id <> new.female_player_id
    or female_roster.archived_at is not null then
    raise exception 'Destaque feminino deve estar inscrito no elenco deste torneio.';
  end if;

  if male_roster.gender <> 'Masculino' then
    raise exception 'Destaque masculino deve ser um jogador masculino.';
  end if;

  if female_roster.gender <> 'Feminino' then
    raise exception 'Destaque feminino deve ser uma jogadora feminina.';
  end if;

  return new;
end;
$$;

create or replace function public.update_match_mvp_as_admin(
  mvp_id uuid,
  selected_team_id uuid,
  selected_male_player_id uuid,
  selected_female_player_id uuid,
  selected_male_roster_player_id uuid default null,
  selected_female_roster_player_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Apenas admins podem corrigir MVPs.';
  end if;

  update public.match_mvps
  set
    team_id = selected_team_id,
    male_player_id = selected_male_player_id,
    female_player_id = selected_female_player_id,
    male_roster_player_id = selected_male_roster_player_id,
    female_roster_player_id = selected_female_roster_player_id
  where id = mvp_id;

  if not found then
    raise exception 'MVP nao encontrado.';
  end if;
end;
$$;

revoke all on function public.update_match_mvp_as_admin(uuid, uuid, uuid, uuid, uuid, uuid) from public;
grant execute on function public.update_match_mvp_as_admin(uuid, uuid, uuid, uuid, uuid, uuid) to authenticated;

drop policy if exists "tournament roster players are readable by everyone" on public.tournament_roster_players;
drop policy if exists "tournament roster players are writable by editors" on public.tournament_roster_players;

alter table public.tournament_roster_players enable row level security;

create policy "tournament roster players are readable by everyone"
on public.tournament_roster_players
for select
to anon, authenticated
using (true);

create policy "tournament roster players are writable by editors"
on public.tournament_roster_players
for all
to authenticated
using (public.is_editor())
with check (public.is_editor());

alter table public.players drop constraint if exists players_team_id_fkey;
alter table public.players
add constraint players_team_id_fkey foreign key (team_id) references public.teams(id);

alter table public.tournament_teams drop constraint if exists tournament_teams_tournament_id_fkey;
alter table public.tournament_teams
add constraint tournament_teams_tournament_id_fkey foreign key (tournament_id) references public.tournaments(id);

alter table public.tournament_teams drop constraint if exists tournament_teams_team_id_fkey;
alter table public.tournament_teams
add constraint tournament_teams_team_id_fkey foreign key (team_id) references public.teams(id);

alter table public.games drop constraint if exists games_tournament_id_fkey;
alter table public.games
add constraint games_tournament_id_fkey foreign key (tournament_id) references public.tournaments(id);

alter table public.goals drop constraint if exists goals_game_id_fkey;
alter table public.goals
add constraint goals_game_id_fkey foreign key (game_id) references public.games(id);

alter table public.defenses drop constraint if exists defenses_game_id_fkey;
alter table public.defenses
add constraint defenses_game_id_fkey foreign key (game_id) references public.games(id);

alter table public.spirit_scores drop constraint if exists spirit_scores_game_id_fkey;
alter table public.spirit_scores
add constraint spirit_scores_game_id_fkey foreign key (game_id) references public.games(id);

alter table public.spirit_scores drop constraint if exists spirit_scores_evaluated_team_id_fkey;
alter table public.spirit_scores
add constraint spirit_scores_evaluated_team_id_fkey foreign key (evaluated_team_id) references public.teams(id);

alter table public.match_mvps drop constraint if exists match_mvps_game_id_fkey;
alter table public.match_mvps
add constraint match_mvps_game_id_fkey foreign key (game_id) references public.games(id);

alter table public.match_mvps drop constraint if exists match_mvps_team_id_fkey;
alter table public.match_mvps
add constraint match_mvps_team_id_fkey foreign key (team_id) references public.teams(id);

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
  where spirit_scores.archived_at is null
    and games.archived_at is null
    and (public.is_admin() or public.is_tournament_finished(games.tournament_id))
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
    select
      games.tournament_id,
      players.id,
      coalesce(male_roster.name, players.name) as name,
      coalesce(male_roster.nickname, players.nickname) as nickname,
      coalesce(male_roster.gender, players.gender) as gender
    from public.match_mvps
    join public.games on games.id = match_mvps.game_id
    join public.players on players.id = match_mvps.male_player_id
    left join public.tournament_roster_players male_roster
      on male_roster.id = match_mvps.male_roster_player_id
    where match_mvps.archived_at is null
      and games.archived_at is null
      and (public.is_admin() or public.is_tournament_finished(games.tournament_id))

    union all

    select
      games.tournament_id,
      players.id,
      coalesce(female_roster.name, players.name) as name,
      coalesce(female_roster.nickname, players.nickname) as nickname,
      coalesce(female_roster.gender, players.gender) as gender
    from public.match_mvps
    join public.games on games.id = match_mvps.game_id
    join public.players on players.id = match_mvps.female_player_id
    left join public.tournament_roster_players female_roster
      on female_roster.id = match_mvps.female_roster_player_id
    where match_mvps.archived_at is null
      and games.archived_at is null
      and (public.is_admin() or public.is_tournament_finished(games.tournament_id))
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
    opp.name as opponent_team_name,
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
  where spirit_scores.archived_at is null
    and games.archived_at is null
    and (public.is_admin() or public.is_tournament_finished(games.tournament_id))
  order by spirit_scores.evaluated_team_id, game_date asc;
$$;
