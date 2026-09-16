-- Support recording a Callahan (defensive interception in the end zone that scores directly, no assist).

alter table public.goals
add column if not exists is_callahan boolean not null default false;

alter table public.goals
drop constraint if exists goals_callahan_no_assist;

alter table public.goals
add constraint goals_callahan_no_assist check (not is_callahan or assistant_id is null);

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

  if new.is_callahan then
    new.assistant_id = null;
    new.assistant_roster_player_id = null;
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
