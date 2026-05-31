import { useParams, Link } from 'react-router-dom'
import { useGame } from '../hooks/useGames'
import { useGameGoals } from '../hooks/useGoals'
import { useGameDefenses } from '../hooks/useDefenses'
import { useGameTimer } from '../hooks/useGameTimer'
import { useGameRealtime } from '../hooks/useGameRealtime'
import { Scoreboard } from '../components/stats/Scoreboard'
import { StatsTable } from '../components/stats/StatsTable'
import { Button } from '../components/ui/Button'
import { LoadingScreen } from '../components/ui/Spinner'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { useQueryClient } from '@tanstack/react-query'
import { getPlayerDisplayName } from '../lib/players'

export function JogoView() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()

  const { data: game, isLoading: gameLoading, error: gameError } = useGame(id)
  const { data: goals = [], isLoading: goalsLoading } = useGameGoals(id)
  const { data: defenses = [], isLoading: defensesLoading } = useGameDefenses(id)
  const { display: timerDisplay } = useGameTimer(game)
  useGameRealtime(id)

  const isLoading = gameLoading || goalsLoading || defensesLoading

  const handleRefresh = () => {
    qc.invalidateQueries({ queryKey: ['games', id] })
    qc.invalidateQueries({ queryKey: ['games', id, 'goals'] })
    qc.invalidateQueries({ queryKey: ['games', id, 'defenses'] })
  }

  if (isLoading) return <LoadingScreen />
  if (gameError || !game) return <ErrorMessage message="Jogo não encontrado" className="m-4" />

  return (
    <div className="max-w-lg mx-auto pb-6">
      <Scoreboard game={game} goals={goals} timerDisplay={timerDisplay} />

      {/* Actions */}
      <div className="flex gap-3 px-4 py-3">
        <Button
          variant="secondary"
          onClick={handleRefresh}
          className="flex-1"
          size="sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Atualizar
        </Button>
        {game.status !== 'finished' && (
          <Link to={`/jogos/${game.id}/anotar`} className="flex-1">
            <Button className="w-full" size="sm">
              ✏️ Anotar
            </Button>
          </Link>
        )}
      </div>

      {/* Stats Table */}
      <div className="px-0">
        <h2 className="text-center font-black text-gray-800 text-lg mb-2 px-4">
          ESTATÍSTICAS DA PARTIDA
        </h2>
        <StatsTable
          teamA={game.team_a}
          teamB={game.team_b}
          goals={goals}
          defenses={defenses}
        />
      </div>

      {/* Goal log */}
      {goals.length > 0 && (
        <div className="px-4 mt-2">
          <h3 className="font-bold text-gray-700 mb-2 text-sm">Gols marcados</h3>
          <div className="bg-white rounded-2xl divide-y divide-gray-100 border border-gray-100 overflow-hidden">
            {goals.map((goal, i) => (
              <div key={goal.id} className="px-4 py-2.5 flex items-center gap-3">
                <span className="text-gray-400 text-xs w-5 text-right shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-900">{getPlayerDisplayName(goal.scorer)}</span>
                  <span className={`ml-1 text-xs ${goal.scorer.gender === 'Masculino' ? 'text-blue-500' : 'text-pink-500'}`}>
                    ({goal.scorer.gender === 'Masculino' ? 'M' : 'F'})
                  </span>
                  {goal.assistant && (
                    <span className="text-xs text-gray-400 ml-1">
                      · assist: {getPlayerDisplayName(goal.assistant)}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400 shrink-0">{goal.scoring_team.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
