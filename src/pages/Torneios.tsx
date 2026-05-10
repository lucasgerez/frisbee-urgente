import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTeams } from '../hooks/useTeams'
import { useTournaments, useCreateTournament, useDeleteTournament } from '../hooks/useTournaments'
import { MultiSearchableSelect } from '../components/ui/MultiSearchableSelect'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { LoadingScreen } from '../components/ui/Spinner'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { formatDate } from '../lib/utils'
import type { Team, Tournament } from '../types/database'

export function Torneios() {
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [selectedTeams, setSelectedTeams] = useState<Team[]>([])
  const [deleteTournament, setDeleteTournament] = useState<Tournament | null>(null)

  const { data: teams = [] } = useTeams()
  const { data: tournaments = [], isLoading, error } = useTournaments()
  const createTournament = useCreateTournament()
  const deleteTournamentMutation = useDeleteTournament()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    try {
      await createTournament.mutateAsync({
        name: name.trim(),
        teamIds: selectedTeams.map((t) => t.id),
      })
      setName('')
      setSelectedTeams([])
      setShowForm(false)
    } catch (err) {
      // error shown inline
    }
  }

  if (isLoading) return <LoadingScreen />

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
      <h1 className="text-2xl font-black text-gray-900">Torneios</h1>

      {showForm ? (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-bold text-gray-800">Novo torneio</h2>

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

          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" loading={createTournament.isPending} className="flex-1">
              Criar torneio
            </Button>
          </div>
        </form>
      ) : (
        <Button onClick={() => setShowForm(true)} className="w-full" size="lg">
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
          tournaments.map((tournament) => (
            <div
              key={tournament.id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-gray-900">{tournament.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Criado em {formatDate(tournament.created_at)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteTournament(tournament)}
                  className="!px-2 text-red-500 hover:!bg-red-50 shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </Button>
              </div>
              <Link to={`/torneios/${tournament.id}/estatisticas`} className="block mt-3">
                <Button variant="secondary" size="sm" className="w-full">
                  Estatísticas
                </Button>
              </Link>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTournament}
        onClose={() => setDeleteTournament(null)}
        onConfirm={async () => {
          if (!deleteTournament) return
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
