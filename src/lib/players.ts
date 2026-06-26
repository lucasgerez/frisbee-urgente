import type { Gender, Player } from '../types/database'

export interface PlayerDisplaySource {
  name: string
  nickname: string | null
  number?: string | null
  gender: Gender
}

export function getPlayerDisplayName(player: PlayerDisplaySource): string {
  return player.nickname?.trim() || player.name
}

export function getPlayerLabel(player: Player | PlayerDisplaySource): string {
  const displayName = getPlayerDisplayName(player)
  const number = player.number != null ? `#${player.number} ` : ''
  const gender = player.gender === 'Masculino' ? 'M' : 'F'

  return `${number}${displayName} (${gender})`
}
