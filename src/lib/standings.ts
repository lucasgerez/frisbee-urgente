import type { GameWithTeams, GoalWithPlayers } from '../types/database'

export interface TeamStandingRow {
  teamId: string
  teamName: string
  gamesPlayed: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
}

export function computeTournamentStandings(
  tournamentGames: GameWithTeams[],
  goals: GoalWithPlayers[]
): TeamStandingRow[] {
  const finishedGames = tournamentGames.filter((game) => game.status === 'finished')
  const rows = new Map<string, TeamStandingRow>()

  const ensureRow = (teamId: string, teamName: string) => {
    const row = rows.get(teamId) ?? {
      teamId,
      teamName,
      gamesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
    }
    rows.set(teamId, row)
    return row
  }

  finishedGames.forEach((game) => {
    const scoreA = goals.filter(
      (goal) => goal.game_id === game.id && goal.scoring_team_id === game.team_a_id
    ).length
    const scoreB = goals.filter(
      (goal) => goal.game_id === game.id && goal.scoring_team_id === game.team_b_id
    ).length

    const rowA = ensureRow(game.team_a_id, game.team_a.name)
    const rowB = ensureRow(game.team_b_id, game.team_b.name)

    rowA.gamesPlayed += 1
    rowB.gamesPlayed += 1
    rowA.goalsFor += scoreA
    rowA.goalsAgainst += scoreB
    rowB.goalsFor += scoreB
    rowB.goalsAgainst += scoreA

    if (scoreA > scoreB) {
      rowA.wins += 1
      rowB.losses += 1
    } else if (scoreB > scoreA) {
      rowB.wins += 1
      rowA.losses += 1
    } else {
      rowA.draws += 1
      rowB.draws += 1
    }
  })

  return Array.from(rows.values())
    .map((row) => ({ ...row, goalDifference: row.goalsFor - row.goalsAgainst }))
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
      return a.teamName.localeCompare(b.teamName)
    })
}
