import { useState } from 'react'
import { useTournaments, useTournamentTeams } from '../hooks/useTournaments'
import { useGames, useCreateGame } from '../hooks/useGames'
import { SearchableSelect } from '../components/ui/SearchableSelect'
import { GameCard } from '../components/games/GameCard'
import { Button } from '../components/ui/Button'
import { LoadingScreen } from '../components/ui/Spinner'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import type { Tournament, Team } from '../types/database'

export function Jogos() {
  const [showForm, setShowForm] = useState(false)
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [teamA, setTeamA] = useState<Team | null>(null)
  const [teamB, setTeamB] = useState<Team | null>(null)

  const { data: tournaments = [] } = useTournaments()
  const { data: tournamentTeams = [] } = useTournamentTeams(selectedTournament?.id)
  const { data: games = [], isLoading, error } = useGames()
  const createGame = useCreateGame()

  const teamAOptions = tournamentTeams.filter((t) => t.id !== teamB?.id)
  const teamBOptions = tournamentTeams.filter((t) => t.id !== teamA?.id)

  const handleTournamentChange = (t: Tournament | null) => {
    setSelectedTournament(t)
    setTeamA(null)
    setTeamB(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTournament || !teamA || !teamB) return
    try {
      await createGame.mutateAsync({
        tournament_id: selectedTournament.id,
        team_a_id: teamA.id,
        team_b_id: teamB.id,
      })
      setSelectedTournament(null)
      setTeamA(null)
      setTeamB(null)
      setShowForm(false)
    } catch (err) {
      // shown inline
    }
  }

  if (isLoading) return <LoadingScreen />

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
      <h1 className="text-2xl font-black text-gray-900">Jogos</h1>

      {showForm ? (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-bold text-gray-800">Novo jogo</h2>

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

          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)} className="flex-1">
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={createGame.isPending}
              disabled={!selectedTournament || !teamA || !teamB}
              className="flex-1"
            >
              Criar jogo
            </Button>
          </div>
        </form>
      ) : (
        <Button onClick={() => setShowForm(true)} className="w-full" size="lg">
          + Novo jogo
        </Button>
      )}

      {error && <ErrorMessage message="Erro ao carregar jogos" />}

      <div className="space-y-3">
        {games.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-sm text-gray-400 border border-gray-100">
            Nenhum jogo cadastrado.
          </div>
        ) : (
          games.map((game) => <GameCard key={game.id} game={game} />)
        )}
      </div>
    </div>
  )
}
