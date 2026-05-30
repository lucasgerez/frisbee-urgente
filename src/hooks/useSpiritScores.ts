import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { SpiritScoreWithTeam } from '../types/database'

export interface TournamentSpiritStats {
  tournamentId: string
  teamId: string
  teamName: string
  scoreCount: number
  totalScore: number
}

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

export interface UpdateSpiritScorePayload {
  id: string
  game_id: string
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

export function useCreateSpiritScore() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload: SpiritScorePayload) => {
      const { error } = await supabase
        .from('spirit_scores')
        .insert(payload)
      if (error) throw new Error(error.message)
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['games', vars.game_id, 'spirit-scores'] })
      qc.invalidateQueries({ queryKey: ['spirit-scores'] })
      qc.invalidateQueries({ queryKey: ['tournament-spirit-stats'] })
    },
  })
}

export function useTournamentSpiritStats(enabled = true) {
  return useQuery({
    queryKey: ['tournament-spirit-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_tournament_spirit_stats')
      if (error) throw error
      return (data as {
        tournament_id: string
        team_id: string
        team_name: string
        score_count: number
        total_score: number
      }[]).map((row) => ({
        tournamentId: row.tournament_id,
        teamId: row.team_id,
        teamName: row.team_name,
        scoreCount: Number(row.score_count),
        totalScore: Number(row.total_score),
      })) satisfies TournamentSpiritStats[]
    },
    enabled,
  })
}

export function useUpdateSpiritScore() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload: UpdateSpiritScorePayload) => {
      const {
        id,
        rules_knowledge,
        fouls_contact,
        fairness,
        positive_attitude,
        communication,
      } = payload
      const { error } = await supabase
        .from('spirit_scores')
        .update({
          rules_knowledge,
          fouls_contact,
          fairness,
          positive_attitude,
          communication,
        })
        .eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['games', vars.game_id, 'spirit-scores'] })
      qc.invalidateQueries({ queryKey: ['spirit-scores'] })
      qc.invalidateQueries({ queryKey: ['tournament-spirit-stats'] })
    },
  })
}
