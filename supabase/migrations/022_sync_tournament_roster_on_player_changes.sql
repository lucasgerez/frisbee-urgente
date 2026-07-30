-- Keep tournament_roster_players in sync with players added/edited after a team
-- already joined an active tournament, so they show up in goal/assist/defense pickers.

create or replace function public.sync_tournament_roster_players_from_player()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.archived_at is not null then
      return new;
    end if;

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
      new.team_id,
      new.id,
      new.name,
      new.nickname,
      new.number,
      new.gender
    from public.tournament_teams
    where tournament_teams.team_id = new.team_id
      and tournament_teams.archived_at is null
      and not public.is_tournament_finished(tournament_teams.tournament_id)
    on conflict do nothing;

    return new;
  end if;

  update public.tournament_roster_players trp
  set
    name = new.name,
    nickname = new.nickname,
    number = new.number,
    gender = new.gender
  from public.tournament_teams tt
  where trp.player_id = new.id
    and trp.tournament_id = tt.tournament_id
    and trp.team_id = tt.team_id
    and trp.archived_at is null
    and not public.is_tournament_finished(trp.tournament_id);

  return new;
end;
$$;

drop trigger if exists trg_sync_roster_on_player_insert on public.players;
create trigger trg_sync_roster_on_player_insert
after insert on public.players
for each row execute function public.sync_tournament_roster_players_from_player();

drop trigger if exists trg_sync_roster_on_player_update on public.players;
create trigger trg_sync_roster_on_player_update
after update of name, nickname, number, gender on public.players
for each row execute function public.sync_tournament_roster_players_from_player();
