import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTournaments, useTournamentTeams, useTournamentRosterPlayers } from '../hooks/useTournaments'
import { useGames, useCreateGame, useUpdateGame, useDeleteGame } from '../hooks/useGames'
import { useGoals } from '../hooks/useGoals'
import { useSpiritScores } from '../hooks/useSpiritScores'
import { useGameMatchMvps } from '../hooks/useMatchMvps'
import { useAuth } from '../hooks/useAuth'
import { SearchableSelect } from '../components/ui/SearchableSelect'
import { GameCard } from '../components/games/GameCard'
import { SpiritScoreModal } from '../components/games/SpiritScoreModal'
import { MatchMvpModal } from '../components/games/MatchMvpModal'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { LoadingScreen } from '../components/ui/Spinner'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { isPastDate } from '../lib/utils'
import type { GameWithTeams, Tournament, Team } from '../types/database'

export function Jogos() {
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [editingGame, setEditingGame] = useState<GameWithTeams | null>(null)
  const [deleteGame, setDeleteGame] = useState<GameWithTeams | null>(null)
  const [spiritGame, setSpiritGame] = useState<GameWithTeams | null>(null)
  const [mvpGame, setMvpGame] = useState<GameWithTeams | null>(null)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [teamA, setTeamA] = useState<Team | null>(null)
  const [teamB, setTeamB] = useState<Team | null>(null)

  const { data: tournaments = [] } = useTournaments()
  const { data: tournamentTeams = [] } = useTournamentTeams(selectedTournament?.id)
  const { data: games = [], isLoading, error } = useGames()
  const { data: goals = [], error: goalsError } = useGoals()
  const createGame = useCreateGame()
  const updateGame = useUpdateGame()
  const deleteGameMutation = useDeleteGame()
  const { isLoading: authLoading, session, canManage, user, isEditor, isAdmin } = useAuth()
  const { data: spiritScores = [] } = useSpiritScores(spiritGame?.id, !!session && !!spiritGame)
  const { data: matchMvps = [] } = useGameMatchMvps(mvpGame?.id, !!mvpGame)
  const { data: mvpPlayersA = [] } = useTournamentRosterPlayers(mvpGame?.tournament_id, mvpGame?.team_a_id)
  const { data: mvpPlayersB = [] } = useTournamentRosterPlayers(mvpGame?.tournament_id, mvpGame?.team_b_id)

  const teamAOptions = tournamentTeams.filter((t) => t.id !== teamB?.id)
  const teamBOptions = tournamentTeams.filter((t) => t.id !== teamA?.id)
  const canCreateActionsForGame = (game: GameWithTeams) =>
    isAdmin || (isEditor && !isPastDate(game.tournament.end_date))

  const handleTournamentChange = (t: Tournament | null) => {
    setSelectedTournament(t)
    setTeamA(null)
    setTeamB(null)
  }

  const resetForm = () => {
    setSelectedTournament(null)
    setTeamA(null)
    setTeamB(null)
    setEditingGame(null)
    setShowForm(false)
  }

  const requireCreatePermission = (tournament?: Tournament | null) => {
    setPermissionError(null)

    if (authLoading) return false

    if (!session) {
      navigate(`/login?redirectTo=${encodeURIComponent('/jogos')}`)
      return false
    }

    if (!canManage) {
      setPermissionError('Sua conta nao tem permissao para criar jogos.')
      return false
    }

    if (tournament && !isAdmin && isPastDate(tournament.end_date)) {
      setPermissionError('Apenas admins podem editar dados de torneios encerrados.')
      return false
    }

    return true
  }

  const requireAdmin = () => {
    setPermissionError(null)

    if (authLoading) return false

    if (!session) {
      navigate(`/login?redirectTo=${encodeURIComponent('/jogos')}`)
      return false
    }

    if (!isAdmin) {
      setPermissionError('Sua conta nao tem permissao para editar ou excluir jogos.')
      return false
    }

    return true
  }

  const handleCreateClick = () => {
    if (!requireCreatePermission()) return
    resetForm()
    setShowForm(true)
  }

  const handleEdit = (game: GameWithTeams) => {
    if (!requireAdmin()) return
    setEditingGame(game)
    setSelectedTournament(game.tournament)
    setTeamA(game.team_a)
    setTeamB(game.team_b)
    setShowForm(true)
  }

  const handleSpiritScore = (game: GameWithTeams) => {
    if (!requireCreatePermission(game.tournament)) return
    setSpiritGame(game)
  }

  const handleMatchMvp = (game: GameWithTeams) => {
    if (!requireCreatePermission(game.tournament)) return
    setMvpGame(game)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTournament || !teamA || !teamB) return
    if (editingGame) {
      if (!requireAdmin()) return
    } else if (!requireCreatePermission(selectedTournament)) {
      return
    }
    try {
      const payload = {
        tournament_id: selectedTournament.id,
        team_a_id: teamA.id,
        team_b_id: teamB.id,
      }
      if (editingGame) {
        await updateGame.mutateAsync({ id: editingGame.id, ...payload })
      } else {
        await createGame.mutateAsync(payload)
      }
      resetForm()
    } catch (err) {
      // shown inline
    }
  }

  if (isLoading) return <LoadingScreen />

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
      <h1 className="text-2xl font-black text-gray-900">Jogos</h1>
      {permissionError && <ErrorMessage message={permissionError} />}

      {showForm ? (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-bold text-gray-800">
            {editingGame ? 'Editar jogo' : 'Novo jogo'}
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Torneio</label>
            <SearchableSelect
              options={tournaments}
              value={selectedTournament}
              onChange={handleTournamentChange}
              getLabel={(t) => t.name}
              getValue={(t) => t.id}
              placeholder="Selecionar torneio..."
            />
          </div>

          {selectedTournament && (
            <>
              {tournamentTeams.length < 2 ? (
                <p className="text-sm text-amber-600 bg-amber-50 rounded-xl p-3">
                  Este torneio precisa de pelo menos 2 times cadastrados.
                </p>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time A</label>
                    <SearchableSelect
                      options={teamAOptions}
                      value={teamA}
                      onChange={setTeamA}
                      getLabel={(t) => t.name}
                      getValue={(t) => t.id}
                      placeholder="Selecionar time A..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time B</label>
                    <SearchableSelect
                      options={teamBOptions}
                      value={teamB}
                      onChange={setTeamB}
                      getLabel={(t) => t.name}
                      getValue={(t) => t.id}
                      placeholder="Selecionar time B..."
                    />
                  </div>
                </>
              )}
            </>
          )}

          {createGame.isError && (
            <ErrorMessage message={(createGame.error as Error).message} />
          )}
          {updateGame.isError && (
            <ErrorMessage message={(updateGame.error as Error).message} />
          )}

          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={resetForm} className="flex-1">
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={createGame.isPending || updateGame.isPending}
              disabled={!selectedTournament || !teamA || !teamB}
              className="flex-1"
            >
              {editingGame ? 'Salvar jogo' : 'Criar jogo'}
            </Button>
          </div>
        </form>
      ) : (
        <Button onClick={handleCreateClick} className="w-full" size="lg" loading={authLoading}>
          + Novo jogo
        </Button>
      )}

      {error && <ErrorMessage message="Erro ao carregar jogos" />}
      {goalsError && <ErrorMessage message="Erro ao carregar placares" />}

      <div className="space-y-3">
        {games.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-sm text-gray-400 border border-gray-100">
            Nenhum jogo cadastrado.
          </div>
        ) : (
          games.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              goalCounts={{
                teamA: goals.filter(
                  (goal) => goal.game_id === game.id && goal.scoring_team_id === game.team_a_id
                ).length,
                teamB: goals.filter(
                  (goal) => goal.game_id === game.id && goal.scoring_team_id === game.team_b_id
                ).length,
              }}
              onSpiritScore={canCreateActionsForGame(game) ? handleSpiritScore : undefined}
              onMatchMvp={canCreateActionsForGame(game) ? handleMatchMvp : undefined}
              onEdit={isAdmin ? handleEdit : undefined}
              onDelete={isAdmin ? (game) => {
                if (!requireAdmin()) return
                setDeleteGame(game)
              } : undefined}
            />
          ))
        )}
      </div>

      <ConfirmDialog
        open={!!deleteGame}
        onClose={() => setDeleteGame(null)}
        onConfirm={async () => {
          if (!deleteGame) return
          if (!requireAdmin()) return
          await deleteGameMutation.mutateAsync(deleteGame.id)
          setDeleteGame(null)
        }}
        title="Excluir jogo"
        message={`Tem certeza que deseja excluir "${deleteGame?.team_a.name} × ${deleteGame?.team_b.name}"? Gols e defesas desse jogo tambem serão removidos.`}
        loading={deleteGameMutation.isPending}
      />

      <SpiritScoreModal
        open={!!spiritGame}
        onClose={() => setSpiritGame(null)}
        game={spiritGame}
        currentUserId={user?.id ?? ''}
        isAdmin={isAdmin}
        scores={spiritScores}
      />

      <MatchMvpModal
        open={!!mvpGame}
        onClose={() => setMvpGame(null)}
        game={mvpGame}
        playersA={mvpPlayersA}
        playersB={mvpPlayersB}
        currentUserId={user?.id ?? ''}
        isAdmin={isAdmin}
        mvps={matchMvps}
      />
    </div>
  )
}
