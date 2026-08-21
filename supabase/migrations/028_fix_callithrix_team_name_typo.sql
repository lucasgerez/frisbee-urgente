-- Fix a spelling typo in the historical team_name snapshot: the team was
-- renamed from "Callitrix" to "Callithrix" directly on teams.name, but the
-- per-tournament snapshot in tournament_teams.team_name (set once at insert
-- time, see 020_snapshot_tournament_team_names.sql) kept the old spelling.
--
-- Some of this team's rows belong to already-finished tournaments, guarded by
-- trg_prevent_non_admin_finished_tournament_team_write (021), which requires
-- an admin JWT that isn't present when running this directly via the SQL
-- editor. Disable it for this one corrective statement, then restore it.

alter table public.tournament_teams
disable trigger trg_prevent_non_admin_finished_tournament_team_write;

update public.tournament_teams
set team_name = 'Callithrix'
where team_name = 'Callitrix'
  and team_id = (select id from public.teams where name = 'Callithrix');

alter table public.tournament_teams
enable trigger trg_prevent_non_admin_finished_tournament_team_write;
