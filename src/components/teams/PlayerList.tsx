import { useState } from 'react'
import type { Player } from '../../types/database'
import { GenderBadge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { Modal } from '../ui/Modal'
import { PlayerForm } from './PlayerForm'
import { useUpdatePlayer, useDeletePlayer } from '../../hooks/usePlayers'

interface PlayerListProps {
  players: Player[]
  teamId: string
}

export function PlayerList({ players, teamId }: PlayerListProps) {
  const [editPlayer, setEditPlayer] = useState<Player | null>(null)
  const [deletePlayer, setDeletePlayer] = useState<Player | null>(null)

  const updatePlayer = useUpdatePlayer()
  const deletePlayerMutation = useDeletePlayer()

  if (players.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        Nenhum jogador cadastrado neste time.
      </div>
    )
  }

  return (
    <>
      <ul className="divide-y divide-gray-100">
        {players.map((player) => (
          <li key={player.id} className="flex items-center gap-3 py-3 px-1">
            <GenderBadge gender={player.gender} />
            <span className="flex-1 text-sm font-medium text-gray-900">{player.name}</span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditPlayer(player)}
                className="!px-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeletePlayer(player)}
                className="!px-2 text-red-500 hover:!bg-red-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {/* Edit Modal */}
      <Modal
        open={!!editPlayer}
        onClose={() => setEditPlayer(null)}
        title="Editar jogador"
      >
        {editPlayer && (
          <PlayerForm
            teamId={teamId}
            player={editPlayer}
            onSubmit={async (data) => {
              await updatePlayer.mutateAsync({ id: editPlayer.id, ...data })
              setEditPlayer(null)
            }}
            onCancel={() => setEditPlayer(null)}
          />
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deletePlayer}
        onClose={() => setDeletePlayer(null)}
        onConfirm={async () => {
          if (!deletePlayer) return
          await deletePlayerMutation.mutateAsync({
            id: deletePlayer.id,
            team_id: teamId,
          })
          setDeletePlayer(null)
        }}
        title="Excluir jogador"
        message={`Tem certeza que deseja excluir "${deletePlayer?.name}"?`}
        loading={deletePlayerMutation.isPending}
      />
    </>
  )
}
