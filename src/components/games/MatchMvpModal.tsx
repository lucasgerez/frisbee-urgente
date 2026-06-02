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
  mvps: MatchMvpWithPlayers[]
}

function getFriendlyError(err: unknown) {
  if (!(err instanceof Error)) return 'Erro ao salvar destaque.'
  if (err.message.includes('Editor ja cadastrou MVP para este jogo')) {
    return 'Voce ja cadastrou destaque para este jogo. Cada editor pode votar apenas uma vez.'
  }
  if (
    err.message.includes('duplicate key') ||
    err.message.includes('match_mvps_game_id_key') ||
    err.message.includes('match_mvps_game_id_team_id_key') ||
    err.message.includes('duplicate key value violates unique constraint')
  ) {
    return 'Este time ja possui destaque cadastrado para este jogo. Apenas admins podem corrigir a selecao.'
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
  mvps,
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
  const editorMvp = mvps.find((mvp) => mvp.created_by === currentUserId) ?? null
  const selectedTeamMvp = mvps.find((mvp) => mvp.team_id === selectedTeam?.id) ?? null
  const currentMvp = isAdmin ? selectedTeamMvp : editorMvp
  const locked = !!editorMvp && !isAdmin

  useEffect(() => {
    if (!open || !game) return
    const votedTeamIds = new Set(mvps.map((mvp) => mvp.team_id))
    const initialTeam = (!isAdmin ? editorMvp?.team : null)
      ?? [game.team_a, game.team_b].find((team) => !votedTeamIds.has(team.id))
      ?? mvps[0]?.team
      ?? game.team_a
    setSelectedTeam(initialTeam)
    const initialMvp = mvps.find((mvp) => mvp.team_id === initialTeam.id) ?? null
    setMalePlayer(initialMvp?.male_player ?? null)
    setFemalePlayer(initialMvp?.female_player ?? null)
    setError('')
  }, [open, game, mvps, isAdmin, editorMvp])

  useEffect(() => {
    if (!open) return
    setMalePlayer(currentMvp?.male_player ?? null)
    setFemalePlayer(currentMvp?.female_player ?? null)
  }, [open, currentMvp])

  if (!game) return null

  const handleTeamChange = (team: Team | null) => {
    setSelectedTeam(team)
    setMalePlayer(null)
    setFemalePlayer(null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedTeam || !malePlayer || !femalePlayer) {
      setError('Selecione o time e os destaques masculino e feminino.')
      return
    }

    setError('')
    try {
      if (currentMvp) {
        if (!isAdmin) {
          setError('Voce ja cadastrou destaque para este jogo. Cada editor pode votar apenas uma vez.')
          return
        }
        await updateMatchMvp.mutateAsync({
          id: currentMvp.id,
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
    <Modal open={open} onClose={onClose} title="Destaque Pindorama">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-cobalt-100 bg-cobalt-50 p-3 text-sm text-cobalt-900">
          <div className="font-bold mb-1">Critérios para o voto</div>
          <ul className="list-disc space-y-1 pl-5">
            <li>Soube as regras de espírito de jogo e as colocou em prática</li>
            <li>Foi imparcial quando a oportunidade surgiu</li>
            <li>Fez diferença no desempenho do próprio time (em pontuação, liderança, organização, presença etc.) ao longo do jogo</li>
            <li>Destacou-se em habilidades do ultimate (lançamento, corte, recepção, posicionamento etc.)</li>
            <li>Manteve atitude positiva durante todo o jogo</li>
          </ul>
        </div>

        {currentMvp && (
          <div className={`rounded-xl border p-3 text-sm ${
            locked
              ? 'bg-amber-50 border-amber-100 text-amber-800'
              : 'bg-cobalt-50 border-cobalt-100 text-cobalt-800'
          }`}>
            {locked
              ? 'Voce ja cadastrou destaque para este jogo. Cada editor pode votar apenas uma vez.'
              : 'Destaque ja cadastrado para este time. Como admin, voce pode corrigir a selecao.'}
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
            Destaque masculino <span className="text-red-500">*</span>
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
            Destaque feminino <span className="text-red-500">*</span>
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

        {currentMvp && (
          <div className="rounded-xl border border-gray-100 p-3 text-sm">
            <div className="font-bold text-gray-900 mb-1">Selecao atual</div>
            <div className="text-gray-600">{currentMvp.team.name}</div>
            <div className="text-gray-600">
              Masculino: {getPlayerDisplayName(currentMvp.male_player)}
            </div>
            <div className="text-gray-600">
              Feminino: {getPlayerDisplayName(currentMvp.female_player)}
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
              {currentMvp ? 'Salvar correcao' : 'Salvar destaque'}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  )
}
