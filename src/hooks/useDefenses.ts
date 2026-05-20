import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Defense, DefenseWithPlayer } from '../types/database'

export function useDefenses() {
  return useQuery({
    queryKey: ['defenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('defenses')
        .select('*, player:players(*)')
        .order('created_at')
      if (error) throw error
      return data as DefenseWithPlayer[]
    },
  })
}

export function useGameDefenses(gameId?: string) {
  return useQuery({
    queryKey: ['games', gameId, 'defenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('defenses')
        .select('*, player:players(*)')
        .eq('game_id', gameId!)
        .order('created_at')
      if (error) throw error
      return data as DefenseWithPlayer[]
    },
    enabled: !!gameId,
  })
}

export function useCreateDefense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      game_id: string
      player_id: string
      team_id: string
    }) => {
      const { data, error } = await supabase
        .from('defenses')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data as Defense
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['games', vars.game_id, 'defenses'] })
      qc.invalidateQueries({ queryKey: ['defenses'] })
    },
  })
}

export function useDeleteDefense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, game_id }: { id: string; game_id: string }) => {
      const { error } = await supabase.from('defenses').delete().eq('id', id)
      if (error) throw error
      return game_id
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['games', vars.game_id, 'defenses'] })
      qc.invalidateQueries({ queryKey: ['defenses'] })
    },
  })
}
