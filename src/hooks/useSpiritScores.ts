import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { SpiritScore, SpiritScoreWithTeam } from '../types/database'

export interface SpiritScorePayload {
  game_id: string
  evaluated_team_id: string
  created_by: string
  rules_knowledge: number
  fouls_contact: number
  fairness: number
  positive_attitude: number
  communication: number
}

export function useSpiritScores(gameId?: string, enabled = true) {
  return useQuery({
    queryKey: ['games', gameId, 'spirit-scores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spirit_scores')
        .select('*, evaluated_team:teams(*)')
        .eq('game_id', gameId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as SpiritScoreWithTeam[]
    },
    enabled: !!gameId && enabled,
  })
}

export function useAllSpiritScores(enabled = true) {
  return useQuery({
    queryKey: ['spirit-scores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spirit_scores')
        .select('*, evaluated_team:teams(*)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as SpiritScoreWithTeam[]
    },
    enabled,
  })
}

export function useUpsertSpiritScore() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload: SpiritScorePayload) => {
      const { data, error } = await supabase
        .from('spirit_scores')
        .upsert(payload, {
          onConflict: 'game_id,evaluated_team_id,created_by',
        })
        .select()
        .single()
      if (error) throw error
      return data as SpiritScore
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['games', vars.game_id, 'spirit-scores'] })
    },
  })
}
