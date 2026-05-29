import { useState } from 'react'
import type { Player, Team } from '../../types/database'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { SearchableSelect } from '../ui/SearchableSelect'
import { ErrorMessage } from '../ui/ErrorMessage'
import { getPlayerLabel } from '../../lib/players'

interface DefenseModalProps {
  open: boolean
  onClose: () => void
  teamA: Team
  teamB: Team
  playersA: Player[]
  playersB: Player[]
  onConfirm: (data: { player_id: string; team_id: string }) => Promise<void>
}

export function DefenseModal({
  open,
  onClose,
  teamA,
  teamB,
  playersA,
  playersB,
  onConfirm,
}: DefenseModalProps) {
  const [activeTeam, setActiveTeam] = useState<'A' | 'B'>('A')
  const [player, setPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const team = activeTeam === 'A' ? teamA : teamB
  const players = activeTeam === 'A' ? playersA : playersB

  const handleTeamChange = (t: 'A' | 'B') => {
    setActiveTeam(t)
    setPlayer(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!player) {
      setError('Selecione o jogador que fez a defesa')
      return
    }
    setError('')
    setLoading(true)
    try {
      await onConfirm({ player_id: player.id, team_id: team.id })
      setPlayer(null)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar defesa')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setPlayer(null)
    setError('')
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Anotar Defesa">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Team tabs */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
          <div className="flex gap-2">
            {([['A', teamA], ['B', teamB]] as ['A' | 'B', Team][]).map(([key, t]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleTeamChange(key)}
                className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium border transition-colors truncate ${
                  activeTeam === key
                    ? 'bg-cobalt-600 text-white border-cobalt-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Player */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Jogador <span className="text-red-500">*</span>
          </label>
          <SearchableSelect
            options={players}
            value={player}
            onChange={setPlayer}
            getLabel={getPlayerLabel}
            getValue={(p) => p.id}
            placeholder="Buscar jogador..."
            clearable
          />
        </div>

        <ErrorMessage message={error} />

        <div className="flex gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Confirmar Defesa
          </Button>
        </div>
      </form>
    </Modal>
  )
}
