import type { GameWithTeams, GoalWithPlayers } from '../../types/database'
import { GameStatusBadge } from '../ui/Badge'

interface ScoreboardProps {
  game: GameWithTeams
  goals: GoalWithPlayers[]
  timerDisplay?: string
}

export function Scoreboard({ game, goals, timerDisplay }: ScoreboardProps) {
  const scoreA = goals.filter((g) => g.scoring_team_id === game.team_a_id).length
  const scoreB = goals.filter((g) => g.scoring_team_id === game.team_b_id).length

  return (
    <div className="bg-gray-900 text-white px-4 py-5">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        {/* Team A */}
        <div className="flex-1 text-center">
          <div className="text-gold-400 font-black text-3xl">{scoreA}</div>
          <div className="text-white font-bold text-sm mt-1 truncate">{game.team_a.name}</div>
        </div>

        {/* Center */}
        <div className="flex flex-col items-center px-4 gap-1">
          <div className="bg-gray-700 rounded-lg px-3 py-1 text-xs text-gray-300 font-mono">
            {timerDisplay ?? '00:00'}
          </div>
          <GameStatusBadge status={game.status} />
          <div className="text-gray-500 text-xs mt-1">{game.tournament.name}</div>
        </div>

        {/* Team B */}
        <div className="flex-1 text-center">
          <div className="text-gold-400 font-black text-3xl">{scoreB}</div>
          <div className="text-white font-bold text-sm mt-1 truncate">{game.team_b.name}</div>
        </div>
      </div>
    </div>
  )
}
