import type { Team, TournamentTeam } from '../types/database'

export interface TeamSnapshotLink extends TournamentTeam {
  team?: Team
}

export function applyTeamSnapshotName(team: Team, link?: Pick<TournamentTeam, 'team_name'> | null): Team {
  return link?.team_name ? { ...team, name: link.team_name } : team
}

export function buildTournamentTeamSnapshotMap(links: Pick<TournamentTeam, 'tournament_id' | 'team_id' | 'team_name'>[]) {
  return new Map(links.map((link) => [`${link.tournament_id}:${link.team_id}`, link.team_name]))
}

export function getTournamentTeamSnapshotName(
  snapshots: Map<string, string>,
  tournamentId: string,
  teamId: string,
  fallback: string
) {
  return snapshots.get(`${tournamentId}:${teamId}`) ?? fallback
}
