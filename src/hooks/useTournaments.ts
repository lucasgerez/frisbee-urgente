import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Tournament, TournamentTeam, Team } from '../types/database'

export function useTournaments() {
  return useQuery({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Tournament[]
    },
  })
}

export function useTournamentTeams(tournamentId?: string) {
  return useQuery({
    queryKey: ['tournaments', tournamentId, 'teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournament_teams')
        .select('*, team:teams(*)')
        .eq('tournament_id', tournamentId!)
      if (error) throw error
      return (data as (TournamentTeam & { team: Team })[]).map((r) => r.team)
    },
    enabled: !!tournamentId,
  })
}

export function useCreateTournament() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      name,
      teamIds,
    }: {
      name: string
      teamIds: string[]
    }) => {
      // Create tournament
      const { data: tournament, error: tErr } = await supabase
        .from('tournaments')
        .insert({ name })
        .select()
        .single()
      if (tErr) throw tErr

      // Link teams
      if (teamIds.length > 0) {
        const { error: ttErr } = await supabase.from('tournament_teams').insert(
          teamIds.map((team_id) => ({
            tournament_id: (tournament as Tournament).id,
            team_id,
          }))
        )
        if (ttErr) throw ttErr
      }
      return tournament as Tournament
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tournaments'] }),
  })
}

export function useDeleteTournament() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tournaments').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tournaments'] }),
  })
}
