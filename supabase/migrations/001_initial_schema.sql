-- Frisbee Urgente em Dados — Initial Schema
-- Run this in the Supabase SQL editor before starting the app.

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─── ENUMS ───────────────────────────────────────────────────────────────────

create type gender_enum as enum ('Masculino', 'Feminino');
create type game_status  as enum ('pending', 'in_progress', 'paused', 'finished');

-- ─── TEAMS ───────────────────────────────────────────────────────────────────

create table teams (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz not null default now()
);

-- ─── PLAYERS ─────────────────────────────────────────────────────────────────

create table players (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  team_id    uuid not null references teams(id) on delete cascade,
  gender     gender_enum not null,
  created_at timestamptz not null default now()
);

create index players_team_id_idx on players(team_id);

-- ─── TOURNAMENTS ─────────────────────────────────────────────────────────────

create table tournaments (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

-- ─── TOURNAMENT TEAMS (junction) ─────────────────────────────────────────────

create table tournament_teams (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  team_id       uuid not null references teams(id) on delete cascade,
  unique(tournament_id, team_id)
);

create index tt_tournament_id_idx on tournament_teams(tournament_id);

-- ─── GAMES ───────────────────────────────────────────────────────────────────

create table games (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  team_a_id     uuid not null references teams(id),
  team_b_id     uuid not null references teams(id),
  status        game_status not null default 'pending',
  started_at    timestamptz,
  ended_at      timestamptz,
  created_at    timestamptz not null default now(),
  check (team_a_id <> team_b_id)
);

create index games_tournament_id_idx on games(tournament_id);
create index games_status_idx        on games(status);

-- ─── GOALS ───────────────────────────────────────────────────────────────────

create table goals (
  id              uuid primary key default gen_random_uuid(),
  game_id         uuid not null references games(id) on delete cascade,
  scorer_id       uuid not null references players(id),
  assistant_id    uuid references players(id),         -- nullable
  scoring_team_id uuid not null references teams(id),
  created_at      timestamptz not null default now()
);

create index goals_game_id_idx   on goals(game_id);
create index goals_scorer_id_idx on goals(scorer_id);

-- ─── DEFENSES ────────────────────────────────────────────────────────────────

create table defenses (
  id         uuid primary key default gen_random_uuid(),
  game_id    uuid not null references games(id) on delete cascade,
  player_id  uuid not null references players(id),
  team_id    uuid not null references teams(id),
  created_at timestamptz not null default now()
);

create index defenses_game_id_idx   on defenses(game_id);
create index defenses_player_id_idx on defenses(player_id);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────
-- Public app — no authentication required.
-- All tables accessible via anon key. Add policies later if auth is needed.
