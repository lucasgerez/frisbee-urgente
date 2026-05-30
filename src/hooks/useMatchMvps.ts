import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Gender, MatchMvpWithPlayers } from '../types/database'

const matchMvpSelect =
  '*, team:teams(*), male_player:players!match_mvps_male_player_id_fkey(*), female_player:players!match_mvps_female_player_id_fkey(*)'

export interface TournamentMvpStats {
  tournamentId: string
  playerId: string
  playerName: string
  gender: Gender
  count: number
}

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

export function useGameMatchMvps(gameId?: string, enabled = true) {
  return useQuery({
    queryKey: ['games', gameId, 'match-mvps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('match_mvps')
        .select(matchMvpSelect)
        .eq('game_id', gameId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as MatchMvpWithPlayers[]
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

export function useTournamentMvpStats(enabled = true) {
  return useQuery({
    queryKey: ['tournament-mvp-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_tournament_mvp_stats')
      if (error) throw error
      return (data as {
        tournament_id: string
        player_id: string
        player_name: string
        gender: Gender
        mvp_count: number
      }[]).map((row) => ({
        tournamentId: row.tournament_id,
        playerId: row.player_id,
        playerName: row.player_name,
        gender: row.gender,
        count: Number(row.mvp_count),
      })) satisfies TournamentMvpStats[]
    },
    enabled,
  })
}

export function useCreateMatchMvp() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload: MatchMvpPayload) => {
      const { error } = await supabase
        .from('match_mvps')
        .insert(payload)
      if (error) throw new Error(error.message)
    },
    onSuccess: (_data, vars) => Promise.all([
      qc.invalidateQueries({ queryKey: ['games', vars.game_id, 'match-mvps'] }),
      qc.invalidateQueries({ queryKey: ['games', vars.game_id, 'match-mvp'] }),
      qc.invalidateQueries({ queryKey: ['match-mvps'] }),
      qc.invalidateQueries({ queryKey: ['tournament-mvp-stats'] }),
    ]),
  })
}

export function useUpdateMatchMvp() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload: UpdateMatchMvpPayload) => {
      const { id, team_id, male_player_id, female_player_id } = payload
      const { error } = await supabase.rpc('update_match_mvp_as_admin', {
        mvp_id: id,
        selected_team_id: team_id,
        selected_male_player_id: male_player_id,
        selected_female_player_id: female_player_id,
      })
      if (error) throw new Error(error.message)
    },
    onSuccess: (_data, vars) => Promise.all([
      qc.invalidateQueries({ queryKey: ['games', vars.game_id, 'match-mvps'] }),
      qc.invalidateQueries({ queryKey: ['games', vars.game_id, 'match-mvp'] }),
      qc.invalidateQueries({ queryKey: ['match-mvps'] }),
      qc.invalidateQueries({ queryKey: ['tournament-mvp-stats'] }),
    ]),
  })
}
