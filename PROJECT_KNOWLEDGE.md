# Project Knowledge: Frisbee Urgente

Last reviewed: 2026-05-07

## Purpose

Frisbee Urgente is a mobile-first React app for managing ultimate/frisbee tournaments and tracking game statistics in real time. The app is in Portuguese and centers on teams, players, tournaments, games, goals, assists, defenses, and per-game statistics split by gender.

## Stack

- Frontend: Vite, React 18, TypeScript.
- Routing: `react-router-dom` with browser routes in `src/App.tsx`.
- Data fetching and cache: TanStack React Query.
- Backend: Supabase via `@supabase/supabase-js`.
- Styling: Tailwind CSS with custom `gold` and `cobalt` colors in `tailwind.config.ts`.
- Build scripts:
  - `npm run dev`
  - `npm run build`
  - `npm run preview`

## Environment

Supabase config is read in `src/lib/supabase.ts` from:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

If either value is missing, the app throws a startup error. The local `.env` exists but should not be documented with secrets.

## App Structure

- `src/main.tsx`: mounts React, wraps the app in `QueryClientProvider`.
- `src/App.tsx`: route definitions.
- `src/components/layout`: app shell, header, bottom navigation.
- `src/pages`: main screens.
- `src/hooks`: Supabase-backed React Query hooks.
- `src/types/database.ts`: TypeScript data shapes for DB rows and joined UI records.
- `src/components/ui`: local reusable controls like buttons, modals, selects, badges, loading and error states.
- `src/components/games`: game cards and event modals.
- `src/components/stats`: scoreboard and stats table.
- `supabase/migrations/001_initial_schema.sql`: initial database schema.

## Routes

- `/`: home dashboard with quick actions, active game shortcut, and recent games.
- `/times`: create/select teams and manage their players.
- `/torneios`: create/delete tournaments and link participating teams.
- `/jogos`: create games inside a selected tournament and list games.
- `/jogos/:id`: read-only game statistics view.
- `/jogos/:id/anotar`: live annotation view for starting/pausing/ending games and recording events.

## Data Model

The Supabase schema defines:

- `teams`: unique team names.
- `players`: player name, team, and gender (`Masculino` or `Feminino`).
- `tournaments`: tournament names.
- `tournament_teams`: many-to-many relationship between tournaments and teams.
- `games`: tournament, team A, team B, status, start/end timestamps.
- `goals`: game, scorer, optional assistant, and scoring team.
- `defenses`: game, defending player, and team.

Enums:

- `gender_enum`: `Masculino`, `Feminino`.
- `game_status`: `pending`, `in_progress`, `paused`, `finished`.

Important constraint: `games` has `check (team_a_id <> team_b_id)`.

## Data Access Pattern

The app uses one hook file per domain:

- `useTeams.ts`: list/create/delete teams.
- `usePlayers.ts`: list players by team, create/update/delete players.
- `useTournaments.ts`: list/create/delete tournaments and fetch tournament teams.
- `useGames.ts`: list games, fetch one joined game, create games, update status, delete games.
- `useGoals.ts`: list/create/delete goals for a game.
- `useDefenses.ts`: list/create/delete defenses for a game.

Most hooks use React Query keys that mirror the domain:

- `['teams']`
- `['players', teamId]`
- `['tournaments']`
- `['tournaments', tournamentId, 'teams']`
- `['games']`
- `['games', gameId]`
- `['games', gameId, 'goals']`
- `['games', gameId, 'defenses']`

Mutations invalidate the smallest related query key in most cases. If a change affects displayed scores or game lists, check that the corresponding game, goals, defenses, or list query is invalidated.

## Supabase Typing Note

`src/types/database.ts` defines a `Database` type, but `src/lib/supabase.ts` intentionally creates the Supabase client without the generic `Database` type. A comment explains that the simplified `Database` interface caused `supabase-js` to infer `never` for inserts/updates. Hooks cast returned data to the local TypeScript types instead.

## Main User Flows

### Teams and Players

Users create teams in `/times`, select a team, then add/manage players for that team. Players require a name and gender. Player queries are enabled only when a team id exists.

### Tournaments

Users create tournaments in `/torneios` and can optionally link teams at creation time. Tournament deletion cascades to linked games through the database relationships.

### Games

Users create a game in `/jogos` by selecting a tournament and two different teams from that tournament. The UI filters the team selectors so the same team cannot be chosen as both team A and team B.

### Live Annotation

`/jogos/:id/anotar` is the active scoring screen:

- Pending games can be started.
- In-progress games can be paused or ended.
- Paused games can be resumed or ended.
- Finished games show a closed state.
- Goals and defenses cannot be added while the game is pending.
- Goals use `GoalModal`; defenses use `DefenseModal`.
- Recent events merge goals and defenses, sort by `created_at` descending, and show the latest 20.

### Statistics View

`/jogos/:id` is the stats/read-only view:

- Shows a scoreboard.
- Allows manual refresh by invalidating the game, goals, and defenses queries.
- Shows totals for goals, assists, and defenses by team.
- Each stat row is split into total, masculine count, and feminine count.

## Timer Behavior

`useGameTimer(game)` computes elapsed time from `started_at`.

- `in_progress`: updates every second.
- `paused` or `finished`: freezes based on `ended_at` if present, otherwise current time.
- `pending`: resets to zero.

Current limitation: pause/resume does not preserve accumulated paused time. Resuming a game keeps using the original `started_at`, so the timer includes paused duration.

## Styling and UX Conventions

- The UI is mobile-first, usually constrained with `max-w-lg mx-auto`.
- Layout uses Tailwind utility classes directly.
- Common surfaces use white backgrounds, rounded corners, subtle borders, and shadows.
- The app uses a dark gray/gold/cobalt brand feel.
- Text and routes are in Portuguese.
- Some buttons and cards currently use emoji icons.
- Bottom navigation suggests the app is intended primarily for phone usage.

## Known Things To Watch

- `package-lock.json` was already modified when this file was created.
- `public/frisbee.svg` exists, while `Home.tsx` references `/mascot.png`; if that asset is absent in `public`, the image hides itself via `onError`.
- The migration comments mention public/no-auth access, but policies are not defined in the schema. Supabase RLS behavior should be checked before relying on anon access in a fresh project.
- `StatsTable` currently counts assists by the scorer gender, not the assistant gender. If the intended stat is assistant demographics, this should be revisited.
- Game status updates do not record pause timestamps or accumulated elapsed time.

## Useful Commands

```bash
npm run dev
npm run build
npm run preview
```

## Working Guidance For Future Changes

- Prefer extending the existing hook-per-domain pattern for Supabase access.
- Keep query keys consistent with the existing hierarchy.
- Keep user-facing copy in Portuguese.
- Preserve the mobile-first layout unless a task explicitly asks for desktop expansion.
- For schema changes, update both `supabase/migrations` and `src/types/database.ts`.
- After changes that touch data loading or TypeScript types, run `npm run build`.
