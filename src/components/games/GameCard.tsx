import { Link } from 'react-router-dom'
import type { GameWithTeams } from '../../types/database'
import { GameStatusBadge } from '../ui/Badge'
import { formatDateTime } from '../../lib/utils'

interface GameCardProps {
  game: GameWithTeams
  goalCounts?: { teamA: number; teamB: number }
}

export function GameCard({ game, goalCounts }: GameCardProps) {
  return (
    <Link
      to={`/jogos/${game.id}`}
      className="block bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-cobalt-200 transition-colors active:scale-[0.99]"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-400">{game.tournament.name}</span>
        <GameStatusBadge status={game.status} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex-1 text-center">
          <div className="font-bold text-gray-900 text-sm truncate">{game.team_a.name}</div>
          {goalCounts !== undefined && (
            <div className="text-2xl font-black text-cobalt-600 mt-1">{goalCounts.teamA}</div>
          )}
        </div>

        <div className="px-4 text-gray-300 font-bold text-lg">×</div>

        <div className="flex-1 text-center">
          <div className="font-bold text-gray-900 text-sm truncate">{game.team_b.name}</div>
          {goalCounts !== undefined && (
            <div className="text-2xl font-black text-cobalt-600 mt-1">{goalCounts.teamB}</div>
          )}
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-400 text-center">
        {formatDateTime(game.created_at)}
      </div>
    </Link>
  )
}
