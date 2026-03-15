import { useState, useEffect } from 'react'
import type { Game } from '../types/database'
import { formatDuration } from '../lib/utils'

export function useGameTimer(game: Game | undefined) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!game) return

    if (game.status === 'in_progress' && game.started_at) {
      const start = new Date(game.started_at).getTime()
      const tick = () => {
        setElapsed(Math.floor((Date.now() - start) / 1000))
      }
      tick()
      const id = setInterval(tick, 1000)
      return () => clearInterval(id)
    }

    if (
      (game.status === 'paused' || game.status === 'finished') &&
      game.started_at
    ) {
      const start = new Date(game.started_at).getTime()
      const end = game.ended_at
        ? new Date(game.ended_at).getTime()
        : Date.now()
      setElapsed(Math.floor((end - start) / 1000))
    }

    if (game.status === 'pending') {
      setElapsed(0)
    }
  }, [game])

  return {
    display: formatDuration(elapsed),
    isRunning: game?.status === 'in_progress',
    elapsed,
  }
}
