import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Goal, GoalWithPlayers, TournamentTeam } from '../types/database'
import { buildTournamentTeamSnapshotMap, getTournamentTeamSnapshotName } from '../lib/teamSnapshots'

type GoalWithGameTournament = GoalWithPlayers & {
  game?: { tournament_id: string } | null
}

async function applyGoalTeamSnapshots(goals: GoalWithGameTournament[]) {
  const tournamentIds = Array.from(
    new Set(goals.map((goal) => goal.game?.tournament_id).filter(Boolean) as string[])
  )
  if (tournamentIds.length === 0) return goals as GoalWithPlayers[]

  const { data, error } = await supabase
    .from('tournament_teams')
    .select('tournament_id, team_id, team_name')
    .in('tournament_id', tournamentIds)

  if (error) throw error

  const snapshots = buildTournamentTeamSnapshotMap(data as TournamentTeam[])
  return goals.map((goal) => ({
    ...goal,
    scoring_team: {
      ...goal.scoring_team,
      name: goal.game?.tournament_id
        ? getTournamentTeamSnapshotName(
            snapshots,
            goal.game.tournament_id,
            goal.scoring_team_id,
            goal.scoring_team.name
          )
        : goal.scoring_team.name,
    },
  })) as GoalWithPlayers[]
}

export function useGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
const { data, error } = await supabase
        .from('goals')
        .select(
          '*, game:games(tournament_id), scorer:players!goals_scorer_id_fkey(*), assistant:players!goals_assistant_id_fkey(*), scoring_team:teams(*), scorer_roster:tournament_roster_players!goals_scorer_roster_player_id_fkey(*), assistant_roster:tournament_roster_players!goals_assistant_roster_player_id_fkey(*)'
        )
        .is('archived_at', null)
        .order('created_at')
      if (error) throw error
      return applyGoalTeamSnapshots(data as GoalWithGameTournament[])
    },
  })
}

export function useGameGoals(gameId?: string) {
  return useQuery({
    queryKey: ['games', gameId, 'goals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select(
          '*, game:games(tournament_id), scorer:players!goals_scorer_id_fkey(*), assistant:players!goals_assistant_id_fkey(*), scoring_team:teams(*), scorer_roster:tournament_roster_players!goals_scorer_roster_player_id_fkey(*), assistant_roster:tournament_roster_players!goals_assistant_roster_player_id_fkey(*)'
        )
        .eq('game_id', gameId!)
        .is('archived_at', null)
        .order('created_at')
      if (error) throw error
      return applyGoalTeamSnapshots(data as GoalWithGameTournament[])
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
      scorer_roster_player_id: string
      assistant_roster_player_id: string | null
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
      qc.invalidateQueries({ queryKey: ['goals'] })
    },
  })
}

export function useDeleteGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, game_id }: { id: string; game_id: string }) => {
      const { error } = await supabase
        .from('goals')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      return game_id
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['games', vars.game_id, 'goals'] })
      qc.invalidateQueries({ queryKey: ['goals'] })
    },
  })
}
