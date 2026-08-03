import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { TournamentCoOrganizer, Tournament } from '../types/database'
import type { AdminUser } from './useAdminUsers'

export interface CoOrganizerWithProfile extends TournamentCoOrganizer {
  profile: { full_name: string | null } | null
}

export interface TournamentWithOrganizers {
  tournament: Tournament
  coOrganizers: CoOrganizerWithProfile[]
}

export function useTournamentCoOrganizers(tournamentId: string | undefined) {
  return useQuery({
    queryKey: ['tournament-co-organizers', tournamentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournament_co_organizers')
        .select('*, profile:profiles(full_name)')
        .eq('tournament_id', tournamentId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as CoOrganizerWithProfile[]
    },
    enabled: !!tournamentId,
  })
}

export function useTournamentsWithCoOrganizers() {
  return useQuery({
    queryKey: ['tournaments-with-co-organizers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournaments')
        .select(`
          *,
          co_organizers:tournament_co_organizers(
            tournament_id,
            user_id,
            added_by,
            created_at,
            profile:profiles(full_name)
          )
        `)
        .is('archived_at', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as (Tournament & { co_organizers: CoOrganizerWithProfile[] })[]
    },
  })
}

export function useAddCoOrganizer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ tournamentId, userId }: { tournamentId: string; userId: string }) => {
      const { error } = await supabase
        .from('tournament_co_organizers')
        .insert({ tournament_id: tournamentId, user_id: userId })
      if (error) throw error
    },
    onSuccess: (_data, { tournamentId }) => {
      qc.invalidateQueries({ queryKey: ['tournament-co-organizers', tournamentId] })
      qc.invalidateQueries({ queryKey: ['tournaments-with-co-organizers'] })
    },
  })
}

export function useRemoveCoOrganizer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ tournamentId, userId }: { tournamentId: string; userId: string }) => {
      const { error } = await supabase
        .from('tournament_co_organizers')
        .delete()
        .eq('tournament_id', tournamentId)
        .eq('user_id', userId)
      if (error) throw error
    },
    onSuccess: (_data, { tournamentId }) => {
      qc.invalidateQueries({ queryKey: ['tournament-co-organizers', tournamentId] })
      qc.invalidateQueries({ queryKey: ['tournaments-with-co-organizers'] })
    },
  })
}

export function filterOrganizerUsers(users: AdminUser[]): AdminUser[] {
  return users.filter((u) => u.role === 'organizador')
}
