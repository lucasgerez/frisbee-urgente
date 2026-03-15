import { useState } from 'react'
import type { Player, Gender } from '../../types/database'
import { Button } from '../ui/Button'
import { ErrorMessage } from '../ui/ErrorMessage'

interface PlayerFormProps {
  teamId: string
  player?: Player
  onSubmit: (data: { name: string; gender: Gender; team_id: string }) => Promise<void>
  onCancel?: () => void
}

export function PlayerForm({ teamId, player, onSubmit, onCancel }: PlayerFormProps) {
  const [name, setName] = useState(player?.name ?? '')
  const [gender, setGender] = useState<Gender>(player?.gender ?? 'Masculino')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Nome é obrigatório')
      return
    }
    setError('')
    setLoading(true)
    try {
      await onSubmit({ name: name.trim(), gender, team_id: teamId })
      if (!player) {
        setName('')
        setGender('Masculino')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar jogador')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do jogador"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-cobalt-600 focus:ring-2 focus:ring-cobalt-600/20"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Naipe</label>
        <div className="flex gap-2">
          {(['Masculino', 'Feminino'] as Gender[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGender(g)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                gender === g
                  ? g === 'Masculino'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-pink-500 text-white border-pink-500'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }`}
            >
              {g === 'Masculino' ? 'Masculino (M)' : 'Feminino (F)'}
            </button>
          ))}
        </div>
      </div>

      <ErrorMessage message={error} />

      <div className="flex gap-2 pt-1">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
        )}
        <Button type="submit" loading={loading} className="flex-1">
          {player ? 'Salvar' : 'Adicionar'}
        </Button>
      </div>
    </form>
  )
}
