-- Add one MVP selection per game. Editors/admins can create; admins can correct.

create table if not exists public.match_mvps (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  male_player_id uuid not null references public.players(id),
  female_player_id uuid not null references public.players(id),
  created_by uuid not null references auth.users(id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (game_id),
  check (male_player_id <> female_player_id)
);

create index if not exists match_mvps_game_id_idx on public.match_mvps(game_id);
create index if not exists match_mvps_team_id_idx on public.match_mvps(team_id);
create index if not exists match_mvps_male_player_id_idx on public.match_mvps(male_player_id);
create index if not exists match_mvps_female_player_id_idx on public.match_mvps(female_player_id);

create or replace function public.validate_match_mvp()
returns trigger
language plpgsql
as $$
declare
  selected_game public.games%rowtype;
  male_player public.players%rowtype;
  female_player public.players%rowtype;
begin
  select * into selected_game from public.games where id = new.game_id;
  if not found then
    raise exception 'Jogo nao encontrado.';
  end if;

  if new.team_id not in (selected_game.team_a_id, selected_game.team_b_id) then
    raise exception 'O time selecionado nao pertence a este jogo.';
  end if;

  select * into male_player from public.players where id = new.male_player_id;
  if not found then
    raise exception 'MVP masculino nao encontrado.';
  end if;

  select * into female_player from public.players where id = new.female_player_id;
  if not found then
    raise exception 'MVP feminino nao encontrado.';
  end if;

  if male_player.team_id <> new.team_id then
    raise exception 'MVP masculino deve pertencer ao time selecionado.';
  end if;

  if female_player.team_id <> new.team_id then
    raise exception 'MVP feminino deve pertencer ao time selecionado.';
  end if;

  if male_player.gender <> 'Masculino' then
    raise exception 'MVP masculino deve ser um jogador masculino.';
  end if;

  if female_player.gender <> 'Feminino' then
    raise exception 'MVP feminino deve ser uma jogadora feminina.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_match_mvp on public.match_mvps;
create trigger trg_validate_match_mvp
before insert or update on public.match_mvps
for each row execute function public.validate_match_mvp();

create or replace function public.set_match_mvps_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_match_mvps_updated_at on public.match_mvps;
create trigger trg_match_mvps_updated_at
before update on public.match_mvps
for each row execute function public.set_match_mvps_updated_at();

alter table public.match_mvps enable row level security;

drop policy if exists "match mvps are readable by everyone" on public.match_mvps;
drop policy if exists "match mvps are insertable by editors and admins" on public.match_mvps;
drop policy if exists "match mvps are updateable by admins" on public.match_mvps;
drop policy if exists "match mvps are deletable by admins" on public.match_mvps;

create policy "match mvps are readable by everyone"
on public.match_mvps
for select
using (true);

create policy "match mvps are insertable by editors and admins"
on public.match_mvps
for insert
to authenticated
with check (public.is_editor() and created_by = auth.uid());

create policy "match mvps are updateable by admins"
on public.match_mvps
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "match mvps are deletable by admins"
on public.match_mvps
for delete
to authenticated
using (public.is_admin());
