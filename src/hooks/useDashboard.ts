import {useQuery, UseQueryResult} from "@tanstack/react-query";
import { supabase } from '../lib/supabase'

type DashboardStats = {
  gamesCount: number
  teamsCount: number
  tournamentsCount: number
}

export function useDashboard(): UseQueryResult<DashboardStats, Error> {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]

      const [
        gamesCountResult,
        teamsCountResult,
        tournamentsCountResult,
      ] = await Promise.all([
        supabase
          .from('games')
          .select('*', { count: 'exact', head: true })
          .is('archived_at', null),

        supabase
          .from('teams')
          .select('*', { count: 'exact', head: true })
          .is('archived_at', null),

        supabase
          .from('tournaments')
          .select('*', { count: 'exact', head: true })
          .is('archived_at', null)
          .gt('end_date', today),
      ])

      if (gamesCountResult.error) throw gamesCountResult.error
      if (teamsCountResult.error) throw teamsCountResult.error
      if (tournamentsCountResult.error) throw tournamentsCountResult.error

      return {
        gamesCount: gamesCountResult.count ?? 0,
        teamsCount: teamsCountResult.count ?? 0,
        tournamentsCount: tournamentsCountResult.count ?? 0,
      }
    },
  })
}
