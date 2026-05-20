import type { Player } from '../types/database'

export function getPlayerDisplayName(player: Player): string {
  return player.nickname?.trim() || player.name
}

export function getPlayerLabel(player: Player): string {
  const displayName = getPlayerDisplayName(player)
  const number = player.number !== null ? `#${player.number} ` : ''
  const gender = player.gender === 'Masculino' ? 'M' : 'F'

  return `${number}${displayName} (${gender})`
}
