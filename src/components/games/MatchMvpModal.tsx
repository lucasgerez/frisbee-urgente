import { useEffect, useMemo, useState } from 'react'
import type { GameWithTeams, MatchMvpWithPlayers, Player, Team } from '../../types/database'
import { useCreateMatchMvp, useUpdateMatchMvp } from '../../hooks/useMatchMvps'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { ErrorMessage } from '../ui/ErrorMessage'
import { SearchableSelect } from '../ui/SearchableSelect'
import { getPlayerDisplayName, getPlayerLabel } from '../../lib/players'

interface MatchMvpModalProps {
  open: boolean
  onClose: () => void
  game: GameWithTeams | null
  playersA: Player[]
  playersB: Player[]
  currentUserId: string
  isAdmin: boolean
  mvp: MatchMvpWithPlayers | null
}

function getFriendlyError(err: unknown) {
  if (!(err instanceof Error)) return 'Erro ao salvar MVP.'
  if (err.message.includes('duplicate key') || err.message.includes('match_mvps_game_id_key')) {
    return 'Este jogo ja possui MVP cadastrado. Apenas admins podem corrigir a selecao.'
  }
  return err.message
}

export function MatchMvpModal({
  open,
  onClose,
  game,
  playersA,
  playersB,
  currentUserId,
  isAdmin,
  mvp,
}: MatchMvpModalProps) {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [malePlayer, setMalePlayer] = useState<Player | null>(null)
  const [femalePlayer, setFemalePlayer] = useState<Player | null>(null)
  const [error, setError] = useState('')
  const createMatchMvp = useCreateMatchMvp()
  const updateMatchMvp = useUpdateMatchMvp()

  const teamOptions = useMemo(() => {
    if (!game) return []
    return [game.team_a, game.team_b]
  }, [game])

  const selectedPlayers = selectedTeam?.id === game?.team_a_id
    ? playersA
    : selectedTeam?.id === game?.team_b_id
      ? playersB
      : []
  const malePlayers = selectedPlayers.filter((player) => player.gender === 'Masculino')
  const femalePlayers = selectedPlayers.filter((player) => player.gender === 'Feminino')
  const locked = !!mvp && !isAdmin

  useEffect(() => {
    if (!open || !game) return
    const initialTeam = mvp?.team ?? game.team_a
    setSelectedTeam(initialTeam)
    setMalePlayer(mvp?.male_player ?? null)
    setFemalePlayer(mvp?.female_player ?? null)
    setError('')
  }, [open, game, mvp])

  if (!game) return null

  const handleTeamChange = (team: Team | null) => {
    setSelectedTeam(team)
    setMalePlayer(null)
    setFemalePlayer(null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedTeam || !malePlayer || !femalePlayer) {
      setError('Selecione o time e os MVPs masculino e feminino.')
      return
    }

    setError('')
    try {
      if (mvp) {
        if (!isAdmin) {
          setError('Este jogo ja possui MVP cadastrado. Apenas admins podem corrigir a selecao.')
          return
        }
        await updateMatchMvp.mutateAsync({
          id: mvp.id,
          game_id: game.id,
          team_id: selectedTeam.id,
          male_player_id: malePlayer.id,
          female_player_id: femalePlayer.id,
        })
      } else {
        await createMatchMvp.mutateAsync({
          game_id: game.id,
          team_id: selectedTeam.id,
          male_player_id: malePlayer.id,
          female_player_id: femalePlayer.id,
          created_by: currentUserId,
        })
      }
      onClose()
    } catch (err) {
      setError(getFriendlyError(err))
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="MVP da partida">
      <form onSubmit={handleSubmit} className="space-y-4">
        {mvp && (
          <div className={`rounded-xl border p-3 text-sm ${
            locked
              ? 'bg-amber-50 border-amber-100 text-amber-800'
              : 'bg-cobalt-50 border-cobalt-100 text-cobalt-800'
          }`}>
            {locked
              ? 'MVP ja cadastrado para este jogo. Apenas admins podem corrigir a selecao.'
              : 'MVP ja cadastrado. Como admin, voce pode corrigir a selecao.'}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
          <SearchableSelect
            options={teamOptions}
            value={selectedTeam}
            onChange={handleTeamChange}
            getLabel={(team) => team.name}
            getValue={(team) => team.id}
            placeholder="Selecionar time..."
            disabled={locked}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            MVP masculino <span className="text-red-500">*</span>
          </label>
          <SearchableSelect
            options={malePlayers}
            value={malePlayer}
            onChange={setMalePlayer}
            getLabel={getPlayerLabel}
            getValue={(player) => player.id}
            placeholder="Buscar jogador..."
            disabled={locked || !selectedTeam}
            clearable={!locked}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            MVP feminino <span className="text-red-500">*</span>
          </label>
          <SearchableSelect
            options={femalePlayers}
            value={femalePlayer}
            onChange={setFemalePlayer}
            getLabel={getPlayerLabel}
            getValue={(player) => player.id}
            placeholder="Buscar jogadora..."
            disabled={locked || !selectedTeam}
            clearable={!locked}
          />
        </div>

        {mvp && (
          <div className="rounded-xl border border-gray-100 p-3 text-sm">
            <div className="font-bold text-gray-900 mb-1">Selecao atual</div>
            <div className="text-gray-600">{mvp.team.name}</div>
            <div className="text-gray-600">
              Masculino: {getPlayerDisplayName(mvp.male_player)}
            </div>
            <div className="text-gray-600">
              Feminino: {getPlayerDisplayName(mvp.female_player)}
            </div>
          </div>
        )}

        <ErrorMessage message={error} />

        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            {locked ? 'Fechar' : 'Cancelar'}
          </Button>
          {!locked && (
            <Button
              type="submit"
              loading={createMatchMvp.isPending || updateMatchMvp.isPending}
              disabled={!selectedTeam || !malePlayer || !femalePlayer}
              className="flex-1"
            >
              {mvp ? 'Salvar correcao' : 'Salvar MVP'}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  )
}
