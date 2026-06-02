import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useTeams } from '../hooks/useTeams'
import { useGames } from '../hooks/useGames'
import { useGoals } from '../hooks/useGoals'
import { useDefenses } from '../hooks/useDefenses'
import { useTournamentSpiritStats } from '../hooks/useSpiritScores'
import { useTournamentMvpStats } from '../hooks/useMatchMvps'
import {
  useTournaments,
  useTournamentTeams,
  useCreateTournament,
  useUpdateTournament,
  useDeleteTournament,
} from '../hooks/useTournaments'
import { MultiSearchableSelect } from '../components/ui/MultiSearchableSelect'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { LoadingScreen } from '../components/ui/Spinner'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { GameStatusBadge } from '../components/ui/Badge'
import { formatDate, formatDateOnly, formatDateTime, isPastDate, scoreColorClass } from '../lib/utils'
import { getPlayerDisplayName } from '../lib/players'
import { useAuth } from '../hooks/useAuth'
import type { DefenseWithPlayer, Gender, GoalWithPlayers, Team, Tournament } from '../types/database'

interface PlayerTournamentStats {
  playerId: string
  playerName: string
  gender: Gender
  goals: number
  assists: number
  defenses: number
}

type StatsSortKey = 'name' | 'goals' | 'assists' | 'defenses'
type SortDirection = 'asc' | 'desc'

interface SpiritTournamentTeamStats {
  tournamentId: string
  teamId: string
  teamName: string
  scoreCount: number
  totalScore: number
}

interface MvpTournamentPlayerStats {
  tournamentId: string
  playerId: string
  playerName: string
  gender: Gender
  count: number
}

function computePlayerTournamentStats(
  gameIds: Set<string>,
  goals: GoalWithPlayers[],
  defenses: DefenseWithPlayer[]
): PlayerTournamentStats[] {
  const tournamentGoals = goals.filter((goal) => gameIds.has(goal.game_id))
  const tournamentDefenses = defenses.filter((defense) => gameIds.has(defense.game_id))
  const stats = new Map<string, PlayerTournamentStats>()

  const ensurePlayerStats = (
    playerId: string,
    playerName: string,
    gender: Gender
  ) => {
    const playerStats = stats.get(playerId) ?? {
      playerId,
      playerName,
      gender,
      goals: 0,
      assists: 0,
      defenses: 0,
    }
    stats.set(playerId, playerStats)
    return playerStats
  }

  tournamentGoals.forEach((goal) => {
    ensurePlayerStats(goal.scorer_id, getPlayerDisplayName(goal.scorer), goal.scorer.gender).goals += 1

    if (goal.assistant) {
      ensurePlayerStats(
        goal.assistant_id!,
        getPlayerDisplayName(goal.assistant),
        goal.assistant.gender
      ).assists += 1
    }
  })

  tournamentDefenses.forEach((defense) => {
    ensurePlayerStats(
      defense.player_id,
      getPlayerDisplayName(defense.player),
      defense.player.gender
    ).defenses += 1
  })

  return Array.from(stats.values())
}

function sortPlayerStats(
  stats: PlayerTournamentStats[],
  sortKey: StatsSortKey,
  sortDirection: SortDirection
) {
  return [...stats].sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1

    if (sortKey === 'name') {
      return a.playerName.localeCompare(b.playerName) * direction
    }

    const valueDiff = a[sortKey] - b[sortKey]
    if (valueDiff !== 0) return valueDiff * direction
    return a.playerName.localeCompare(b.playerName)
  })
}

function SortHeader({
  label,
  sortKey,
  activeSortKey,
  sortDirection,
  onSort,
}: {
  label: string
  sortKey: StatsSortKey
  activeSortKey: StatsSortKey
  sortDirection: SortDirection
  onSort: (sortKey: StatsSortKey) => void
}) {
  const active = activeSortKey === sortKey

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={`font-black uppercase ${sortKey === 'name' ? 'text-left' : 'text-center'} ${
        active ? 'text-cobalt-700' : 'text-gray-400'
      }`}
    >
      {label}
      {active && (
        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
      )}
    </button>
  )
}

function PlayerStatsSection({
  gender,
  stats,
  sortKey,
  sortDirection,
  onSort,
}: {
  gender: Gender
  stats: PlayerTournamentStats[]
  sortKey: StatsSortKey
  sortDirection: SortDirection
  onSort: (sortKey: StatsSortKey) => void
}) {
  const rows = sortPlayerStats(
    stats.filter((playerStats) => playerStats.gender === gender),
    sortKey,
    sortDirection
  )

  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden">
      <div className="bg-gray-50 px-3 py-2 text-xs font-black text-gray-700">
        {gender}
      </div>
      {rows.length === 0 ? (
        <div className="px-3 py-3 text-sm text-gray-400">
          Nenhum jogador.
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          <div className="grid grid-cols-[1fr_42px_42px_42px] gap-2 px-3 py-2 text-[11px] font-black text-gray-400 uppercase">
            <SortHeader
              label="Jogador"
              sortKey="name"
              activeSortKey={sortKey}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            <SortHeader
              label="G"
              sortKey="goals"
              activeSortKey={sortKey}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            <SortHeader
              label="A"
              sortKey="assists"
              activeSortKey={sortKey}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            <SortHeader
              label="D"
              sortKey="defenses"
              activeSortKey={sortKey}
              sortDirection={sortDirection}
              onSort={onSort}
            />
          </div>
          {rows.map((playerStats) => (
            <div
              key={playerStats.playerId}
              className="grid grid-cols-[1fr_42px_42px_42px] gap-2 px-3 py-2 text-sm items-center"
            >
              <span className="font-medium text-gray-900 truncate">
                {playerStats.playerName}
              </span>
              <span className="text-center font-bold text-gray-700">{playerStats.goals}</span>
              <span className="text-center font-bold text-gray-700">{playerStats.assists}</span>
              <span className="text-center font-bold text-gray-700">{playerStats.defenses}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function computeSpiritTournamentStats(
  tournamentId: string,
  spiritStats: SpiritTournamentTeamStats[]
): SpiritTournamentTeamStats[] {
  return spiritStats
    .filter((stats) => stats.tournamentId === tournamentId)
    .sort((a, b) => b.totalScore - a.totalScore)
}

function SpiritStatsSection({
  stats,
  gamesCount,
}: {
  stats: SpiritTournamentTeamStats[]
  gamesCount: number
}) {
  if (stats.length === 0) {
    return (
      <div className="text-sm text-gray-400 text-center py-3">
        Nenhuma pontuação de espírito registrada neste torneio.
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100">
      {stats.map((teamStats) => (
        <div
          key={teamStats.teamId}
          className="grid grid-cols-[1fr_58px_72px] gap-2 px-3 py-2 text-sm items-center"
        >
          <span className="font-medium text-gray-900 truncate">{teamStats.teamName}</span>
          <span className="text-center font-black text-cobalt-700">{teamStats.totalScore}</span>
          <span className="text-center text-xs font-bold text-gray-500">
            {teamStats.scoreCount}/{gamesCount}
          </span>
        </div>
      ))}
    </div>
  )
}

function computeMvpTournamentStats(
  tournamentId: string,
  mvpStats: MvpTournamentPlayerStats[]
): MvpTournamentPlayerStats[] {
  return mvpStats.filter((stats) => stats.tournamentId === tournamentId).sort((a, b) => {
    const countDiff = b.count - a.count
    if (countDiff !== 0) return countDiff
    return a.playerName.localeCompare(b.playerName)
  })
}

function MvpStatsSection({
  gender,
  stats,
}: {
  gender: Gender
  stats: MvpTournamentPlayerStats[]
}) {
  const rows = stats.filter((playerStats) => playerStats.gender === gender)

  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden">
      <div className="bg-gray-50 px-3 py-2 text-xs font-black text-gray-700">
        {gender}
      </div>
      {rows.length === 0 ? (
        <div className="px-3 py-3 text-sm text-gray-400">
          Nenhum destaque registrado.
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          <div className="grid grid-cols-[1fr_64px] gap-2 px-3 py-2 text-[11px] font-black text-gray-400 uppercase">
            <span>Jogador</span>
            <span className="text-center">Destaques</span>
          </div>
          {rows.map((playerStats) => (
            <div
              key={playerStats.playerId}
              className="grid grid-cols-[1fr_64px] gap-2 px-3 py-2 text-sm items-center"
            >
              <span className="font-medium text-gray-900 truncate">
                {playerStats.playerName}
              </span>
              <span className="text-center font-black text-amber-700">{playerStats.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function Torneios() {
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null)
  const [name, setName] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedTeams, setSelectedTeams] = useState<Team[]>([])
  const [deleteTournament, setDeleteTournament] = useState<Tournament | null>(null)
  const [expandedTournamentId, setExpandedTournamentId] = useState<string | null>(null)
  const [expandedStatsTournamentId, setExpandedStatsTournamentId] = useState<string | null>(null)
  const [expandedSpiritStatsTournamentId, setExpandedSpiritStatsTournamentId] = useState<string | null>(null)
  const [expandedMvpStatsTournamentId, setExpandedMvpStatsTournamentId] = useState<string | null>(null)
  const [statsSortKey, setStatsSortKey] = useState<StatsSortKey>('goals')
  const [statsSortDirection, setStatsSortDirection] = useState<SortDirection>('desc')
  const [permissionError, setPermissionError] = useState<string | null>(null)

  const { data: teams = [] } = useTeams()
  const { data: tournaments = [], isLoading, error } = useTournaments()
  const { data: games = [], isLoading: gamesLoading, error: gamesError } = useGames()
  const { data: goals = [], isLoading: goalsLoading, error: goalsError } = useGoals()
  const { data: defenses = [], isLoading: defensesLoading, error: defensesError } = useDefenses()
  const { data: editingTeams } = useTournamentTeams(editingTournament?.id)
  const createTournament = useCreateTournament()
  const updateTournament = useUpdateTournament()
  const deleteTournamentMutation = useDeleteTournament()
  const { isLoading: authLoading, session, canManage, isEditor, isAdmin } = useAuth()
  const {
    data: spiritScores = [],
    isLoading: spiritScoresLoading,
    error: spiritScoresError,
  } = useTournamentSpiritStats()
  const {
    data: matchMvps = [],
    isLoading: matchMvpsLoading,
    error: matchMvpsError,
  } = useTournamentMvpStats()
  const canEditActions = isEditor || isAdmin

  const requireEditor = () => {
    setPermissionError(null)

    if (authLoading) return false

    if (!session) {
      navigate(`/login?redirectTo=${encodeURIComponent('/torneios')}`)
      return false
    }

    if (!canManage) {
      setPermissionError('Sua conta nao tem permissao para criar ou editar torneios.')
      return false
    }

    return true
  }

  const requireAdmin = () => {
    setPermissionError(null)

    if (authLoading) return false

    if (!session) {
      navigate(`/login?redirectTo=${encodeURIComponent('/torneios')}`)
      return false
    }

    if (!isAdmin) {
      setPermissionError('Sua conta nao tem permissao para excluir torneios.')
      return false
    }

    return true
  }

  useEffect(() => {
    if (editingTournament && editingTeams) setSelectedTeams(editingTeams)
  }, [editingTournament, editingTeams])

  const resetForm = () => {
    setName('')
    setEndDate('')
    setSelectedTeams([])
    setEditingTournament(null)
    setShowForm(false)
  }

  const handleEdit = (tournament: Tournament) => {
    if (!requireEditor()) return
    setEditingTournament(tournament)
    setName(tournament.name)
    setEndDate(tournament.end_date ?? '')
    setSelectedTeams([])
    setShowForm(true)
  }

  const handleStatsSort = (sortKey: StatsSortKey) => {
    if (statsSortKey === sortKey) {
      setStatsSortDirection((current) => current === 'asc' ? 'desc' : 'asc')
      return
    }

    setStatsSortKey(sortKey)
    setStatsSortDirection(sortKey === 'name' ? 'asc' : 'desc')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    if (!requireEditor()) return
    try {
      const payload = {
        name: name.trim(),
        end_date: endDate || null,
        teamIds: selectedTeams.map((t) => t.id),
      }
      if (editingTournament) {
        await updateTournament.mutateAsync({ id: editingTournament.id, ...payload })
      } else {
        await createTournament.mutateAsync(payload)
      }
      resetForm()
    } catch (err) {
      // error shown inline
    }
  }

  if (isLoading) return <LoadingScreen />

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
      <h1 className="text-2xl font-black text-gray-900">Torneios</h1>
      {permissionError && <ErrorMessage message={permissionError} />}

      {showForm ? (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-bold text-gray-800">
            {editingTournament ? 'Editar torneio' : 'Novo torneio'}
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Copa Frisbee 2025"
              autoFocus
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-cobalt-600 focus:ring-2 focus:ring-cobalt-600/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de término{' '}
              <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-cobalt-600 focus:ring-2 focus:ring-cobalt-600/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Times participantes{' '}
              <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <MultiSearchableSelect
              options={teams}
              value={selectedTeams}
              onChange={setSelectedTeams}
              getLabel={(t) => t.name}
              getValue={(t) => t.id}
              placeholder="Buscar e selecionar times..."
            />
          </div>

          {createTournament.isError && (
            <ErrorMessage message={(createTournament.error as Error).message} />
          )}
          {updateTournament.isError && (
            <ErrorMessage message={(updateTournament.error as Error).message} />
          )}

          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={resetForm} className="flex-1">
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={createTournament.isPending || updateTournament.isPending}
              className="flex-1"
            >
              {editingTournament ? 'Salvar torneio' : 'Criar torneio'}
            </Button>
          </div>
        </form>
      ) : (
        <Button onClick={() => {
          if (!requireEditor()) return
          resetForm()
          setShowForm(true)
        }} className="w-full" size="lg" loading={authLoading}>
          + Novo torneio
        </Button>
      )}

      {error && <ErrorMessage message="Erro ao carregar torneios" />}

      <div className="space-y-3">
        {tournaments.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-sm text-gray-400 border border-gray-100">
            Nenhum torneio cadastrado.
          </div>
        ) : (
          tournaments.map((tournament) => {
            const tournamentGames = games.filter((game) => game.tournament_id === tournament.id)
            const tournamentGameIds = new Set(tournamentGames.map((game) => game.id))
            const tournamentStats = computePlayerTournamentStats(tournamentGameIds, goals, defenses)
            const isExpanded = expandedTournamentId === tournament.id
            const statsExpanded = expandedStatsTournamentId === tournament.id
            const spiritStatsExpanded = expandedSpiritStatsTournamentId === tournament.id
            const mvpStatsExpanded = expandedMvpStatsTournamentId === tournament.id
            const canViewStats = isAdmin || isPastDate(tournament.end_date)
            const statsLoading = gamesLoading || goalsLoading || defensesLoading
            const statsError = gamesError || goalsError || defensesError
            const spiritStats = computeSpiritTournamentStats(tournament.id, spiritScores)
            const mvpStats = computeMvpTournamentStats(tournament.id, matchMvps)

            return (
              <div
                key={tournament.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-gray-900">{tournament.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Criado em {formatDate(tournament.created_at)}
                    </div>
                    {tournament.end_date && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        Termina em {formatDateOnly(tournament.end_date)}
                      </div>
                    )}
                  </div>
                  {(canEditActions || isAdmin) && (
                    <div className="flex gap-1 shrink-0">
                      {canEditActions && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(tournament)}
                          className="!px-2 text-cobalt-700 hover:!bg-cobalt-50"
                          aria-label={`Editar ${tournament.name}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                      )}
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (!requireAdmin()) return
                            setDeleteTournament(tournament)
                          }}
                          className="!px-2 text-red-500 hover:!bg-red-50"
                          aria-label={`Excluir ${tournament.name}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setExpandedTournamentId(isExpanded ? null : tournament.id)}
                  className="w-full"
                >
                  {isExpanded ? 'Ocultar jogos' : `Ver jogos (${tournamentGames.length})`}
                </Button>

                {canViewStats && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setExpandedStatsTournamentId(statsExpanded ? null : tournament.id)}
                    className="w-full"
                  >
                    {statsExpanded ? 'Ocultar estatísticas' : 'Ver estatísticas'}
                  </Button>
                )}

                {canViewStats && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setExpandedSpiritStatsTournamentId(spiritStatsExpanded ? null : tournament.id)}
                    className="w-full"
                  >
                    {spiritStatsExpanded ? 'Ocultar estatísticas de espírito' : 'Ver estatísticas de espírito'}
                  </Button>
                )}

                {canViewStats && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setExpandedMvpStatsTournamentId(mvpStatsExpanded ? null : tournament.id)}
                    className="w-full"
                  >
                    {mvpStatsExpanded ? 'Ocultar estatísticas de destaques' : 'Ver estatísticas de destaques'}
                  </Button>
                )}

                {canViewStats && statsExpanded && (
                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <div className="bg-gray-900 text-white px-3 py-2 text-xs font-black tracking-wide">
                      ESTATÍSTICAS DO CAMPEONATO
                    </div>
                    {statsLoading ? (
                      <div className="text-sm text-gray-400 text-center py-3">
                        Carregando estatísticas...
                      </div>
                    ) : statsError ? (
                      <div className="p-3">
                        <ErrorMessage message="Erro ao carregar estatísticas do campeonato" />
                      </div>
                    ) : tournamentStats.length === 0 ? (
                      <div className="text-sm text-gray-400 text-center py-3">
                        Nenhuma estatística registrada neste torneio.
                      </div>
                    ) : (
                      <div className="p-3 space-y-3">
                        <PlayerStatsSection
                          gender="Masculino"
                          stats={tournamentStats}
                          sortKey={statsSortKey}
                          sortDirection={statsSortDirection}
                          onSort={handleStatsSort}
                        />
                        <PlayerStatsSection
                          gender="Feminino"
                          stats={tournamentStats}
                          sortKey={statsSortKey}
                          sortDirection={statsSortDirection}
                          onSort={handleStatsSort}
                        />
                      </div>
                    )}
                  </div>
                )}

                {canViewStats && spiritStatsExpanded && (
                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <div className="bg-emerald-800 text-white px-3 py-2 text-xs font-black tracking-wide">
                      ESTATÍSTICAS DE ESPÍRITO
                    </div>
                    <div className="grid grid-cols-[1fr_58px_72px] gap-2 px-3 py-2 text-[11px] font-black text-gray-400 uppercase bg-gray-50">
                      <span>Time avaliado</span>
                      <span className="text-center">Total</span>
                      <span className="text-center">Notas</span>
                    </div>
                    {spiritScoresLoading ? (
                      <div className="text-sm text-gray-400 text-center py-3">
                        Carregando estatísticas de espírito...
                      </div>
                    ) : spiritScoresError ? (
                      <div className="p-3">
                        <ErrorMessage message="Erro ao carregar estatísticas de espírito" />
                      </div>
                    ) : (
                      <SpiritStatsSection stats={spiritStats} gamesCount={tournamentGames.length} />
                    )}
                  </div>
                )}

                {canViewStats && mvpStatsExpanded && (
                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <div className="bg-amber-700 text-white px-3 py-2 text-xs font-black tracking-wide">
                      ESTATÍSTICAS DE DESTAQUES
                    </div>
                    {matchMvpsLoading ? (
                      <div className="text-sm text-gray-400 text-center py-3">
                        Carregando estatísticas de destaques...
                      </div>
                    ) : matchMvpsError ? (
                      <div className="p-3">
                        <ErrorMessage message="Erro ao carregar estatísticas de destaques" />
                      </div>
                    ) : mvpStats.length === 0 ? (
                      <div className="text-sm text-gray-400 text-center py-3">
                        Nenhum destaque registrado neste torneio.
                      </div>
                    ) : (
                      <div className="p-3 space-y-3">
                        <MvpStatsSection gender="Masculino" stats={mvpStats} />
                        <MvpStatsSection gender="Feminino" stats={mvpStats} />
                      </div>
                    )}
                  </div>
                )}

                {isExpanded && (
                  <div className="border-t border-gray-100 pt-3">
                    {gamesLoading ? (
                      <div className="text-sm text-gray-400 text-center py-3">
                        Carregando jogos...
                      </div>
                    ) : gamesError ? (
                      <ErrorMessage message="Erro ao carregar jogos do torneio" />
                    ) : tournamentGames.length === 0 ? (
                      <div className="text-sm text-gray-400 text-center py-3">
                        Nenhum jogo cadastrado neste torneio.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {tournamentGames.map((game) => {
                          const scoreA = goals.filter(
                            (goal) => goal.game_id === game.id && goal.scoring_team_id === game.team_a_id
                          ).length
                          const scoreB = goals.filter(
                            (goal) => goal.game_id === game.id && goal.scoring_team_id === game.team_b_id
                          ).length

                          return (
                            <Link
                              key={game.id}
                              to={`/jogos/${game.id}`}
                              className="block rounded-xl border border-gray-100 px-3 py-2.5 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-bold text-gray-900 truncate">
                                    {game.team_a.name} × {game.team_b.name}
                                  </div>
                                  <div className="text-xs text-gray-400 mt-0.5">
                                    {formatDateTime(game.created_at)}
                                  </div>
                                </div>

                                <div className="shrink-0 text-center">
                                  {goalsLoading ? (
                                    <div className="text-lg font-black text-gray-400 leading-none">...</div>
                                  ) : (
                                    <div className="text-lg font-black leading-none">
                                      <span className={scoreColorClass(scoreA, scoreB)}>{scoreA}</span>
                                      <span className="text-gray-300 px-1">×</span>
                                      <span className={scoreColorClass(scoreB, scoreA)}>{scoreB}</span>
                                    </div>
                                  )}
                                  <div className="text-[10px] font-bold text-gray-400 uppercase mt-1">
                                    Placar
                                  </div>
                                </div>

                                <GameStatusBadge status={game.status} />
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTournament}
        onClose={() => setDeleteTournament(null)}
        onConfirm={async () => {
          if (!deleteTournament) return
          if (!requireAdmin()) return
          await deleteTournamentMutation.mutateAsync(deleteTournament.id)
          setDeleteTournament(null)
        }}
        title="Excluir torneio"
        message={`Tem certeza que deseja excluir "${deleteTournament?.name}"? Todos os jogos vinculados serão removidos.`}
        loading={deleteTournamentMutation.isPending}
      />
    </div>
  )
}
