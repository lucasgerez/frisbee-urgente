import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTeams, useCreateTeam } from '../hooks/useTeams'
import { usePlayers, useCreatePlayer } from '../hooks/usePlayers'
import { SearchableSelect } from '../components/ui/SearchableSelect'
import { PlayerList } from '../components/teams/PlayerList'
import { PlayerForm } from '../components/teams/PlayerForm'
import { Button } from '../components/ui/Button'
import { LoadingScreen } from '../components/ui/Spinner'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { useAuth } from '../hooks/useAuth'
import type { Team } from '../types/database'

export function Times() {
  const navigate = useNavigate()
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [newTeamName, setNewTeamName] = useState('')
  const [showNewTeam, setShowNewTeam] = useState(false)
  const [permissionError, setPermissionError] = useState<string | null>(null)

  const { data: teams = [], isLoading: teamsLoading, error: teamsError } = useTeams()
  const { data: players = [], isLoading: playersLoading } = usePlayers(selectedTeam?.id)
  const createTeam = useCreateTeam()
  const createPlayer = useCreatePlayer()
  const { isLoading: authLoading, session, isEditor } = useAuth()

  const requireEditor = () => {
    setPermissionError(null)

    if (authLoading) return false

    if (!session) {
      navigate(`/login?redirectTo=${encodeURIComponent('/times')}`)
      return false
    }

    if (!isEditor) {
      setPermissionError('Sua conta nao tem permissao para criar ou editar times e jogadores.')
      return false
    }

    return true
  }

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTeamName.trim()) return
    if (!requireEditor()) return
    try {
      const team = await createTeam.mutateAsync(newTeamName.trim())
      setNewTeamName('')
      setShowNewTeam(false)
      setSelectedTeam(team)
    } catch (err) {
      // error shown inline
    }
  }

  if (teamsLoading) return <LoadingScreen />

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
      <h1 className="text-2xl font-black text-gray-900">Times & Jogadores</h1>
      {permissionError && <ErrorMessage message={permissionError} />}

      {/* Create team */}
      {showNewTeam ? (
        <form onSubmit={handleCreateTeam} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <h2 className="font-bold text-gray-800">Novo time</h2>
          <input
            type="text"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder="Nome do time"
            autoFocus
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-cobalt-600 focus:ring-2 focus:ring-cobalt-600/20"
          />
          {createTeam.isError && (
            <ErrorMessage message={(createTeam.error as Error).message} />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowNewTeam(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" loading={createTeam.isPending} className="flex-1">
              Criar time
            </Button>
          </div>
        </form>
      ) : (
        <Button
          onClick={() => {
            if (!requireEditor()) return
            setShowNewTeam(true)
          }}
          className="w-full"
          size="lg"
          loading={authLoading}
        >
          + Novo time
        </Button>
      )}

      {/* Team selector */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Selecionar time</label>
          <SearchableSelect
            options={teams}
            value={selectedTeam}
            onChange={setSelectedTeam}
            getLabel={(t) => t.name}
            getValue={(t) => t.id}
            placeholder="Buscar time..."
            clearable
          />
        </div>

        {teamsError && <ErrorMessage message="Erro ao carregar times" />}

        {/* Players section */}
        {selectedTeam && (
          <div className="space-y-3">
            <h2 className="font-bold text-gray-800">
              Jogadores — {selectedTeam.name}
            </h2>

            {playersLoading ? (
              <LoadingScreen />
            ) : (
              <PlayerList
                players={players}
                teamId={selectedTeam.id}
                canEdit={!!session && isEditor}
                onUnauthorized={() => {
                  requireEditor()
                }}
              />
            )}

            <div className="border-t border-gray-100 pt-3">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Adicionar jogador</h3>
              <PlayerForm
                teamId={selectedTeam.id}
                onSubmit={async (data) => {
                  if (!requireEditor()) return
                  await createPlayer.mutateAsync(data)
                }}
              />
            </div>
          </div>
        )}

        {!selectedTeam && teams.length > 0 && (
          <p className="text-sm text-gray-400 text-center py-4">
            Selecione um time para ver e gerenciar seus jogadores
          </p>
        )}

        {teams.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">
            Nenhum time cadastrado. Crie o primeiro time acima.
          </p>
        )}
      </div>
    </div>
  )
}
