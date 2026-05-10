import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type {
  GoalWithPlayers,
  DefenseWithPlayer,
  Player,
  Team,
  TournamentTeam,
} from '../types/database'

export interface PlayerTournamentStats {
  player: Player
  team: Team | null
  goals: number
  assists: number
  defenses: number
  mvp: number
}

export interface TournamentStats {
  players: PlayerTournamentStats[]
}

export function useTournamentStats(tournamentId?: string) {
  return useQuery({
    queryKey: ['tournaments', tournamentId, 'stats'],
    queryFn: async (): Promise<TournamentStats> => {
      const { data: gameRows, error: gErr } = await supabase
        .from('games')
        .select('id')
        .eq('tournament_id', tournamentId!)
      if (gErr) throw gErr

      const gameIds = (gameRows as { id: string }[]).map((g) => g.id)

      const [teamsRes, goalsRes, defensesRes] = await Promise.all([
        supabase
          .from('tournament_teams')
          .select('*, team:teams(*)')
          .eq('tournament_id', tournamentId!),
        gameIds.length > 0
          ? supabase
              .from('goals')
              .select(
                '*, scorer:players!goals_scorer_id_fkey(*), assistant:players!goals_assistant_id_fkey(*), scoring_team:teams(*)'
              )
              .in('game_id', gameIds)
          : Promise.resolve({ data: [] as GoalWithPlayers[], error: null }),
        gameIds.length > 0
          ? supabase
              .from('defenses')
              .select('*, player:players(*)')
              .in('game_id', gameIds)
          : Promise.resolve({ data: [] as DefenseWithPlayer[], error: null }),
      ])

      if (teamsRes.error) throw teamsRes.error
      if (goalsRes.error) throw goalsRes.error
      if (defensesRes.error) throw defensesRes.error

      const teamsMap = new Map<string, Team>()
      ;(teamsRes.data as (TournamentTeam & { team: Team })[]).forEach(({ team }) =>
        teamsMap.set(team.id, team)
      )

      const playerMap = new Map<string, PlayerTournamentStats>()
      const ensure = (player: Player): PlayerTournamentStats => {
        let entry = playerMap.get(player.id)
        if (!entry) {
          entry = {
            player,
            team: teamsMap.get(player.team_id) ?? null,
            goals: 0,
            assists: 0,
            defenses: 0,
            mvp: 0,
          }
          playerMap.set(player.id, entry)
        }
        return entry
      }

      ;(goalsRes.data as GoalWithPlayers[]).forEach((g) => {
        if (g.scorer) ensure(g.scorer).goals += 1
        if (g.assistant) ensure(g.assistant).assists += 1
      })

      ;(defensesRes.data as DefenseWithPlayer[]).forEach((d) => {
        if (d.player) ensure(d.player).defenses += 1
      })

      playerMap.forEach((p) => {
        p.mvp = p.goals * p.assists
      })

      return { players: Array.from(playerMap.values()) }
    },
    enabled: !!tournamentId,
  })
}
