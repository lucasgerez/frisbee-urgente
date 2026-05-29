import { Link } from 'react-router-dom'
import type { GameWithTeams } from '../../types/database'
import { GameStatusBadge } from '../ui/Badge'
import { formatDateTime, scoreColorClass } from '../../lib/utils'

interface GameCardProps {
  game: GameWithTeams
  goalCounts?: { teamA: number; teamB: number }
  onSpiritScore?: (game: GameWithTeams) => void
  onMatchMvp?: (game: GameWithTeams) => void
  onEdit?: (game: GameWithTeams) => void
  onDelete?: (game: GameWithTeams) => void
}

export function GameCard({ game, goalCounts, onSpiritScore, onMatchMvp, onEdit, onDelete }: GameCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <Link
        to={`/jogos/${game.id}`}
        className="block p-4 hover:bg-gray-50 transition-colors active:scale-[0.99]"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-400">{game.tournament.name}</span>
          <GameStatusBadge status={game.status} />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1 text-center">
            <div className="font-bold text-gray-900 text-sm truncate">{game.team_a.name}</div>
            {goalCounts !== undefined && (
              <div className={`text-2xl font-black mt-1 ${scoreColorClass(goalCounts.teamA, goalCounts.teamB)}`}>
                {goalCounts.teamA}
              </div>
            )}
          </div>

          <div className="px-4 text-gray-300 font-bold text-lg">×</div>

          <div className="flex-1 text-center">
            <div className="font-bold text-gray-900 text-sm truncate">{game.team_b.name}</div>
            {goalCounts !== undefined && (
              <div className={`text-2xl font-black mt-1 ${scoreColorClass(goalCounts.teamB, goalCounts.teamA)}`}>
                {goalCounts.teamB}
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 text-xs text-gray-400 text-center">
          {formatDateTime(game.created_at)}
        </div>
      </Link>

      {(onSpiritScore || onMatchMvp || onEdit || onDelete) && (
        <div className="flex border-t border-gray-100">
          {onSpiritScore && (
            <button
              type="button"
              onClick={() => onSpiritScore(game)}
              className="flex-1 px-3 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              Espírito
            </button>
          )}
          {onMatchMvp && (
            <button
              type="button"
              onClick={() => onMatchMvp(game)}
              className="flex-1 px-3 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-50 transition-colors border-l border-gray-100"
            >
              MVP
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(game)}
              className="flex-1 px-3 py-2.5 text-sm font-medium text-cobalt-700 hover:bg-cobalt-50 transition-colors border-l border-gray-100"
            >
              Editar
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(game)}
              className="flex-1 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors border-l border-gray-100"
            >
              Excluir
            </button>
          )}
        </div>
      )}
    </div>
  )
}
