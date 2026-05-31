import { useEffect, useState } from 'react'
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom'
import { useGame } from '../hooks/useGames'
import { useGameGoals, useCreateGoal, useDeleteGoal } from '../hooks/useGoals'
import { useGameDefenses, useCreateDefense, useDeleteDefense } from '../hooks/useDefenses'
import { usePlayers } from '../hooks/usePlayers'
import { useUpdateGameStatus } from '../hooks/useGames'
import { useGameTimer } from '../hooks/useGameTimer'
import { useGameRealtime } from '../hooks/useGameRealtime'
import { useAuth } from '../hooks/useAuth'
import { GoalModal } from '../components/games/GoalModal'
import { DefenseModal } from '../components/games/DefenseModal'
import { Button } from '../components/ui/Button'
import { LoadingScreen } from '../components/ui/Spinner'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { GameStatusBadge } from '../components/ui/Badge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { scoreColorClass } from '../lib/utils'
import { getPlayerDisplayName } from '../lib/players'

export function JogoAnotar() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const [goalOpen, setGoalOpen] = useState(false)
  const [defenseOpen, setDefenseOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<
    | { type: 'goal'; id: string; label: string }
    | { type: 'defense'; id: string; label: string }
    | null
  >(null)

  const { data: game, isLoading: gameLoading, error: gameError } = useGame(id)
  const { data: goals = [] } = useGameGoals(id)
  const { data: defenses = [] } = useGameDefenses(id)
  const { data: playersA = [] } = usePlayers(game?.team_a_id)
  const { data: playersB = [] } = usePlayers(game?.team_b_id)
  useGameRealtime(id)

  const createGoal = useCreateGoal()
  const createDefense = useCreateDefense()
  const deleteGoal = useDeleteGoal()
  const deleteDefense = useDeleteDefense()
  const updateStatus = useUpdateGameStatus()
  const { display: timerDisplay } = useGameTimer(game)
  const { isLoading: authLoading, session, canManage } = useAuth()

  useEffect(() => {
    if (!authLoading && !session) {
      navigate(`/login?redirectTo=${encodeURIComponent(location.pathname)}`, { replace: true })
    }
  }, [authLoading, location.pathname, navigate, session])

  if (authLoading || gameLoading) return <LoadingScreen />
  if (!session) return null
  if (gameError || !game) return <ErrorMessage message="Jogo não encontrado" className="m-4" />
  if (!canManage) {
    return (
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        <ErrorMessage message="Sua conta nao tem permissao para anotar ou editar este jogo." />
        <Link to={`/jogos/${id}`} className="block text-center text-sm font-medium text-cobalt-700">
          Voltar para estatisticas
        </Link>
      </div>
    )
  }

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

  const handleReopen = () => {
    updateStatus.mutate({
      id: game.id,
      status: 'in_progress',
      ended_at: null,
    })
  }

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return
    if (eventToDelete.type === 'goal') {
      await deleteGoal.mutateAsync({ id: eventToDelete.id, game_id: game.id })
    } else {
      await deleteDefense.mutateAsync({ id: eventToDelete.id, game_id: game.id })
    }
    setEventToDelete(null)
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
            <div className={`font-black text-4xl ${scoreColorClass(scoreA, scoreB)}`}>{scoreA}</div>
            <div className="text-white text-xs font-bold mt-1 truncate">{game.team_a.name}</div>
          </div>
          <div className="flex flex-col items-center px-3">
            <div className="bg-gray-700 rounded-lg px-3 py-1 text-xs text-gray-300 font-mono">
              {timerDisplay}
            </div>
          </div>
          <div className="flex-1 text-center">
            <div className={`font-black text-4xl ${scoreColorClass(scoreB, scoreA)}`}>{scoreB}</div>
            <div className="text-white text-xs font-bold mt-1 truncate">{game.team_b.name}</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* Game Controls */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <h2 className="font-bold text-gray-800">Controle do jogo</h2>
          {updateStatus.error && (
            <ErrorMessage message={updateStatus.error.message || 'Nao foi possivel atualizar o status do jogo.'} />
          )}
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
              <>
                <Button onClick={handleReopen} loading={updateStatus.isPending} className="flex-1">
                  ▶ Retomar jogo
                </Button>
                <p className="text-xs text-gray-400 w-full text-center mt-1">
                  Jogo encerrado. Retome para corrigir eventos.
                </p>
              </>
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
                            {getPlayerDisplayName(event.goal.scorer)}
                            <span className={`ml-1 text-xs ${event.goal.scorer.gender === 'Masculino' ? 'text-blue-500' : 'text-pink-500'}`}>
                              ({event.goal.scorer.gender === 'Masculino' ? 'M' : 'F'})
                            </span>
                          </div>
                          {event.goal.assistant && (
                            <div className="text-xs text-gray-400 truncate">
                              Assist: {getPlayerDisplayName(event.goal.assistant)}
                            </div>
                          )}
                          <div className="text-xs text-gray-400">{event.goal.scoring_team.name}</div>
                        </>
                      ) : event.defense ? (
                        <>
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {getPlayerDisplayName(event.defense.player)}
                            <span className={`ml-1 text-xs ${event.defense.player.gender === 'Masculino' ? 'text-blue-500' : 'text-pink-500'}`}>
                              ({event.defense.player.gender === 'Masculino' ? 'M' : 'F'})
                            </span>
                          </div>
                          <div className="text-xs text-gray-400">Defesa</div>
                        </>
                      ) : null}
                    </div>
                    {game.status !== 'finished' && (
                      <button
                        onClick={() => {
                          if (event.type === 'goal' && event.goal) {
                            setEventToDelete({
                              type: 'goal',
                              id: event.goal.id,
                              label: `o gol de ${event.goal.scorer.name}`,
                            })
                          } else if (event.defense) {
                            setEventToDelete({
                              type: 'defense',
                              id: event.defense.id,
                              label: `a defesa de ${event.defense.player.name}`,
                            })
                          }
                        }}
                        aria-label="Excluir evento"
                        className="shrink-0 text-gray-300 hover:text-red-500 transition-colors p-1 -m-1 text-lg"
                      >
                        🗑
                      </button>
                    )}
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
      <ConfirmDialog
        open={!!eventToDelete}
        onClose={() => setEventToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={eventToDelete?.type === 'goal' ? 'Excluir gol' : 'Excluir defesa'}
        message={eventToDelete ? `Tem certeza que deseja excluir ${eventToDelete.label}?` : ''}
        loading={deleteGoal.isPending || deleteDefense.isPending}
      />
    </div>
  )
}
