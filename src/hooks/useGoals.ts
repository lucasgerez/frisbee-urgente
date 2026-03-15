import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Goal, GoalWithPlayers } from '../types/database'

export function useGameGoals(gameId?: string) {
  return useQuery({
    queryKey: ['games', gameId, 'goals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select(
          '*, scorer:players!goals_scorer_id_fkey(*), assistant:players!goals_assistant_id_fkey(*), scoring_team:teams(*)'
        )
        .eq('game_id', gameId!)
        .order('created_at')
      if (error) throw error
      return data as GoalWithPlayers[]
    },
    enabled: !!gameId,
  })
}

export function useCreateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      game_id: string
      scorer_id: string
      assistant_id: string | null
      scoring_team_id: string
    }) => {
      const { data, error } = await supabase
        .from('goals')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data as Goal
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['games', vars.game_id, 'goals'] })
    },
  })
}

export function useDeleteGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, game_id }: { id: string; game_id: string }) => {
      const { error } = await supabase.from('goals').delete().eq('id', id)
      if (error) throw error
      return game_id
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['games', vars.game_id, 'goals'] })
    },
  })
}
