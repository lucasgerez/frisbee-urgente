import type { GoalWithPlayers, DefenseWithPlayer, Team } from '../../types/database'

interface TeamStats {
  goals: { total: number; M: number; F: number }
  assists: { total: number; M: number; F: number }
  defenses: { total: number; M: number; F: number }
  callahans: { total: number; M: number; F: number }
}

function computeTeamStats(
  goals: GoalWithPlayers[],
  defenses: DefenseWithPlayer[],
  teamId: string
): TeamStats {
  const teamGoals = goals.filter((g) => g.scoring_team_id === teamId)
  const teamAssists = goals.filter(
    (g) => g.scoring_team_id === teamId && g.assistant_id !== null
  )
  const teamDefenses = defenses.filter((d) => d.team_id === teamId)
  const teamCallahans = goals.filter((g) => g.scoring_team_id === teamId && g.is_callahan)

  return {
    goals: {
      total: teamGoals.length,
      M: teamGoals.filter((g) => (g.scorer_roster ?? g.scorer).gender === 'Masculino').length,
      F: teamGoals.filter((g) => (g.scorer_roster ?? g.scorer).gender === 'Feminino').length,
    },
    assists: {
      total: teamAssists.length,
      M: teamAssists.filter((g) => (g.assistant_roster ?? g.assistant)?.gender === 'Masculino').length,
      F: teamAssists.filter((g) => (g.assistant_roster ?? g.assistant)?.gender === 'Feminino').length,
    },
    defenses: {
      total: teamDefenses.length,
      M: teamDefenses.filter((d) => (d.roster_player ?? d.player).gender === 'Masculino').length,
      F: teamDefenses.filter((d) => (d.roster_player ?? d.player).gender === 'Feminino').length,
    },
    callahans: {
      total: teamCallahans.length,
      M: teamCallahans.filter((g) => (g.scorer_roster ?? g.scorer).gender === 'Masculino').length,
      F: teamCallahans.filter((g) => (g.scorer_roster ?? g.scorer).gender === 'Feminino').length,
    },
  }
}

interface StatCellProps {
  stats: { total: number; M: number; F: number }
  align: 'left' | 'right'
  highlight?: boolean
}

function StatCell({ stats, align, highlight }: StatCellProps) {
  return (
    <div
      className={`flex flex-col items-${align === 'left' ? 'start' : 'end'} px-3 py-2`}
    >
      <div className={`text-xl font-black ${highlight ? 'text-gold-600' : 'text-gray-900'}`}>
        {stats.total}
      </div>
      <div className="flex gap-2 text-xs mt-0.5">
        <span className="text-blue-600 font-medium">M {stats.M}</span>
        <span className="text-pink-500 font-medium">F {stats.F}</span>
      </div>
    </div>
  )
}

interface StatsTableProps {
  teamA: Team
  teamB: Team
  goals: GoalWithPlayers[]
  defenses: DefenseWithPlayer[]
}

const statRows = [
  { key: 'goals' as const, label: 'GOLS' },
  { key: 'assists' as const, label: 'ASSISTÊNCIAS' },
  { key: 'defenses' as const, label: 'DEFESAS' },
]

export function StatsTable({ teamA, teamB, goals, defenses }: StatsTableProps) {
  const statsA = computeTeamStats(goals, defenses, teamA.id)
  const statsB = computeTeamStats(goals, defenses, teamB.id)
  const hasCallahan = statsA.callahans.total + statsB.callahans.total > 0
  const rows = hasCallahan
    ? [...statRows, { key: 'callahans' as const, label: '🥏 CALLAHAN' }]
    : statRows

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 mx-4 my-4">
      {/* Header */}
      <div className="grid grid-cols-3 bg-gray-900 text-white text-sm font-bold text-center">
        <div className="py-2.5 px-3 truncate">{teamA.name}</div>
        <div className="py-2.5 px-3 bg-cobalt-600 text-center text-xs font-black tracking-wide">
          ESTATÍSTICAS
        </div>
        <div className="py-2.5 px-3 truncate text-right">{teamB.name}</div>
      </div>

      {/* Rows */}
      {rows.map((row, i) => {
        const isCallahanRow = row.key === 'callahans'
        return (
          <div
            key={row.key}
            className={`grid grid-cols-3 items-center ${
              isCallahanRow ? 'bg-gold-50' : i % 2 === 0 ? 'bg-white' : 'bg-cobalt-50'
            }`}
          >
            <StatCell stats={statsA[row.key]} align="left" highlight={isCallahanRow} />
            <div
              className={`text-center py-3 px-2 ${
                isCallahanRow ? 'bg-gold-500 text-gray-900' : 'bg-cobalt-600 text-white'
              }`}
            >
              <span className="text-xs font-black tracking-wide">{row.label}</span>
            </div>
            <StatCell stats={statsB[row.key]} align="right" highlight={isCallahanRow} />
          </div>
        )
      })}
    </div>
  )
}
