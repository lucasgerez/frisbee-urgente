import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useGame } from '../hooks/useGames'
import { useGameGoals, useCreateGoal } from '../hooks/useGoals'
import { useGameDefenses, useCreateDefense } from '../hooks/useDefenses'
import { usePlayers } from '../hooks/usePlayers'
import { useUpdateGameStatus } from '../hooks/useGames'
import { useGameTimer } from '../hooks/useGameTimer'
import { GoalModal } from '../components/games/GoalModal'
import { DefenseModal } from '../components/games/DefenseModal'
import { Button } from '../components/ui/Button'
import { LoadingScreen } from '../components/ui/Spinner'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { GameStatusBadge } from '../components/ui/Badge'

export function JogoAnotar() {
  const { id } = useParams<{ id: string }>()
  const [goalOpen, setGoalOpen] = useState(false)
  const [defenseOpen, setDefenseOpen] = useState(false)

  const { data: game, isLoading: gameLoading, error: gameError } = useGame(id)
  const { data: goals = [] } = useGameGoals(id)
  const { data: defenses = [] } = useGameDefenses(id)
  const { data: playersA = [] } = usePlayers(game?.team_a_id)
  const { data: playersB = [] } = usePlayers(game?.team_b_id)

  const createGoal = useCreateGoal()
  const createDefense = useCreateDefense()
  const updateStatus = useUpdateGameStatus()
  const { display: timerDisplay } = useGameTimer(game)

  if (gameLoading) return <LoadingScreen />
  if (gameError || !game) return <ErrorMessage message="Jogo não encontrado" className="m-4" />

  const scoreA = goals.filter((g) => g.scoring_team_id === game.team_a_id).length
  const scoreB = goals.filter((g) => g.scoring_team_id === game.team_b_id).length

  const handleStart = () => {
    updateStatus.mutate({
      id: game.id,
      status: 'in_progress',
      started_at: new Date().toISOString(),
    })
  }

  const handlePause = () => {
    updateStatus.mutate({ id: game.id, status: 'paused' })
  }

  const handleResume = () => {
    updateStatus.mutate({ id: game.id, status: 'in_progress' })
  }

  const handleEnd = () => {
    updateStatus.mutate({
      id: game.id,
      status: 'finished',
      ended_at: new Date().toISOString(),
    })
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Compact Scoreboard */}
      <div className="bg-gray-900 text-white px-4 py-4">
        <div className="flex items-center justify-between mb-2">
          <Link to={`/jogos/${game.id}`} className="text-gray-400 hover:text-white text-sm">
            ← Ver estatísticas
          </Link>
          <GameStatusBadge status={game.status} />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center">
            <div className="text-gold-400 font-black text-4xl">{scoreA}</div>
            <div className="text-white text-xs font-bold mt-1 truncate">{game.team_a.name}</div>
          </div>
          <div className="flex flex-col items-center px-3">
            <div className="bg-gray-700 rounded-lg px-3 py-1 text-xs text-gray-300 font-mono">
              {timerDisplay}
            </div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-gold-400 font-black text-4xl">{scoreB}</div>
            <div className="text-white text-xs font-bold mt-1 truncate">{game.team_b.name}</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* Game Controls */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <h2 className="font-bold text-gray-800">Controle do jogo</h2>
          <div className="flex gap-2 flex-wrap">
            {game.status === 'pending' && (
              <Button onClick={handleStart} loading={updateStatus.isPending} size="lg" className="flex-1">
                ▶ Iniciar jogo
              </Button>
            )}
            {game.status === 'in_progress' && (
              <>
                <Button onClick={handlePause} loading={updateStatus.isPending} variant="secondary" className="flex-1">
                  ⏸ Pausar
                </Button>
                <Button onClick={handleEnd} loading={updateStatus.isPending} variant="danger" className="flex-1">
                  ⏹ Encerrar
                </Button>
              </>
            )}
            {game.status === 'paused' && (
              <>
                <Button onClick={handleResume} loading={updateStatus.isPending} className="flex-1">
                  ▶ Retomar
                </Button>
                <Button onClick={handleEnd} loading={updateStatus.isPending} variant="danger" className="flex-1">
                  ⏹ Encerrar
                </Button>
              </>
            )}
            {game.status === 'finished' && (
              <div className="text-sm text-gray-500 py-2 text-center w-full">
                Jogo encerrado. Consulte as estatísticas finais.
              </div>
            )}
          </div>
        </div>

        {/* Annotation Buttons */}
        {game.status !== 'finished' && (
          <div className="space-y-3">
            <h2 className="font-bold text-gray-800">Anotar eventos</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setGoalOpen(true)}
                disabled={game.status === 'pending'}
                className="bg-gold-400 hover:bg-gold-500 disabled:opacity-40 disabled:cursor-not-allowed text-gray-900 font-black rounded-2xl p-5 text-center transition-colors active:scale-[0.97] shadow-sm"
              >
                <div className="text-3xl mb-1">⚽</div>
                <div className="text-base">Gol</div>
              </button>
              <button
                onClick={() => setDefenseOpen(true)}
                disabled={game.status === 'pending'}
                className="bg-cobalt-600 hover:bg-cobalt-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-2xl p-5 text-center transition-colors active:scale-[0.97] shadow-sm"
              >
                <div className="text-3xl mb-1">🛡️</div>
                <div className="text-base">Defesa</div>
              </button>
            </div>
            {game.status === 'pending' && (
              <p className="text-xs text-gray-400 text-center">
                Inicie o jogo para anotar eventos
              </p>
            )}
          </div>
        )}

        {/* Recent events */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-800">Últimos eventos</h2>
            <span className="text-xs text-gray-400">
              {goals.length} gol{goals.length !== 1 ? 's' : ''} · {defenses.length} defesa{defenses.length !== 1 ? 's' : ''}
            </span>
          </div>

          {goals.length === 0 && defenses.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center text-sm text-gray-400 border border-gray-100">
              Nenhum evento registrado ainda.
            </div>
          ) : (
            <div className="bg-white rounded-2xl divide-y divide-gray-100 border border-gray-100 overflow-hidden">
              {[
                ...goals.map(g => ({ type: 'goal' as const, goal: g, defense: null, time: g.created_at, id: g.id })),
                ...defenses.map(d => ({ type: 'defense' as const, goal: null, defense: d, time: d.created_at, id: d.id })),
              ]
                .sort((a, b) => b.time.localeCompare(a.time))
                .slice(0, 20)
                .map((event) => (
                  <div key={event.id} className="px-4 py-3 flex items-center gap-3">
                    <span className="text-xl shrink-0">{event.type === 'goal' ? '⚽' : '🛡️'}</span>
                    <div className="flex-1 min-w-0">
                      {event.type === 'goal' && event.goal ? (
                        <>
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {event.goal.scorer.name}
                            <span className={`ml-1 text-xs ${event.goal.scorer.gender === 'Masculino' ? 'text-blue-500' : 'text-pink-500'}`}>
                              ({event.goal.scorer.gender === 'Masculino' ? 'M' : 'F'})
                            </span>
                          </div>
                          {event.goal.assistant && (
                            <div className="text-xs text-gray-400 truncate">
                              Assist: {event.goal.assistant.name}
                            </div>
                          )}
                          <div className="text-xs text-gray-400">{event.goal.scoring_team.name}</div>
                        </>
                      ) : event.defense ? (
                        <>
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {event.defense.player.name}
                            <span className={`ml-1 text-xs ${event.defense.player.gender === 'Masculino' ? 'text-blue-500' : 'text-pink-500'}`}>
                              ({event.defense.player.gender === 'Masculino' ? 'M' : 'F'})
                            </span>
                          </div>
                          <div className="text-xs text-gray-400">Defesa</div>
                        </>
                      ) : null}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <GoalModal
        open={goalOpen}
        onClose={() => setGoalOpen(false)}
        teamA={game.team_a}
        teamB={game.team_b}
        playersA={playersA}
        playersB={playersB}
        onConfirm={async (data) => {
          await createGoal.mutateAsync({ game_id: game.id, ...data })
        }}
      />
      <DefenseModal
        open={defenseOpen}
        onClose={() => setDefenseOpen(false)}
        teamA={game.team_a}
        teamB={game.team_b}
        playersA={playersA}
        playersB={playersB}
        onConfirm={async (data) => {
          await createDefense.mutateAsync({ game_id: game.id, ...data })
        }}
      />
    </div>
  )
}
