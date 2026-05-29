import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { MatchMvp, MatchMvpWithPlayers } from '../types/database'

const matchMvpSelect =
  '*, team:teams(*), male_player:players!match_mvps_male_player_id_fkey(*), female_player:players!match_mvps_female_player_id_fkey(*)'

export interface MatchMvpPayload {
  game_id: string
  team_id: string
  male_player_id: string
  female_player_id: string
  created_by: string
}

export interface UpdateMatchMvpPayload {
  id: string
  game_id: string
  team_id: string
  male_player_id: string
  female_player_id: string
}

export function useMatchMvp(gameId?: string, enabled = true) {
  return useQuery({
    queryKey: ['games', gameId, 'match-mvp'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('match_mvps')
        .select(matchMvpSelect)
        .eq('game_id', gameId!)
        .maybeSingle()
      if (error) throw error
      return data as MatchMvpWithPlayers | null
    },
    enabled: !!gameId && enabled,
  })
}

export function useAllMatchMvps(enabled = true) {
  return useQuery({
    queryKey: ['match-mvps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('match_mvps')
        .select(matchMvpSelect)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as MatchMvpWithPlayers[]
    },
    enabled,
  })
}

export function useCreateMatchMvp() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload: MatchMvpPayload) => {
      const { data, error } = await supabase
        .from('match_mvps')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data as MatchMvp
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['games', vars.game_id, 'match-mvp'] })
      qc.invalidateQueries({ queryKey: ['match-mvps'] })
    },
  })
}

export function useUpdateMatchMvp() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload: UpdateMatchMvpPayload) => {
      const { id, team_id, male_player_id, female_player_id } = payload
      const { data, error } = await supabase
        .from('match_mvps')
        .update({ team_id, male_player_id, female_player_id })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as MatchMvp
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['games', vars.game_id, 'match-mvp'] })
      qc.invalidateQueries({ queryKey: ['match-mvps'] })
    },
  })
}
