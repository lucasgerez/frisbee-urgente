import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useGameRealtime(gameId?: string) {
  const qc = useQueryClient()

  useEffect(() => {
    if (!gameId) return

    const channel = supabase
      .channel(`game:${gameId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'goals', filter: `game_id=eq.${gameId}` },
        () => qc.invalidateQueries({ queryKey: ['games', gameId, 'goals'] }),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'defenses', filter: `game_id=eq.${gameId}` },
        () => qc.invalidateQueries({ queryKey: ['games', gameId, 'defenses'] }),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
        () => qc.invalidateQueries({ queryKey: ['games', gameId] }),
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [gameId, qc])
}
