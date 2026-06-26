import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Game, GameStatus, GameWithTeams, TournamentTeam } from '../types/database'
import { buildTournamentTeamSnapshotMap, getTournamentTeamSnapshotName } from '../lib/teamSnapshots'

async function applyGameTeamSnapshots(games: GameWithTeams[]) {
  const tournamentIds = Array.from(new Set(games.map((game) => game.tournament_id)))
  if (tournamentIds.length === 0) return games

  const { data, error } = await supabase
    .from('tournament_teams')
    .select('tournament_id, team_id, team_name')
    .in('tournament_id', tournamentIds)

  if (error) throw error

  const snapshots = buildTournamentTeamSnapshotMap(data as TournamentTeam[])
  return games.map((game) => ({
    ...game,
    team_a: {
      ...game.team_a,
      name: getTournamentTeamSnapshotName(snapshots, game.tournament_id, game.team_a_id, game.team_a.name),
    },
    team_b: {
      ...game.team_b,
      name: getTournamentTeamSnapshotName(snapshots, game.tournament_id, game.team_b_id, game.team_b.name),
    },
  }))
}

export function useGames() {
  return useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('games')
        .select('*, team_a:teams!games_team_a_id_fkey(*), team_b:teams!games_team_b_id_fkey(*), tournament:tournaments(*)')
        .is('archived_at', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      return applyGameTeamSnapshots(data as GameWithTeams[])
    },
  })
}

export function useGame(id?: string) {
  return useQuery({
    queryKey: ['games', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('games')
        .select('*, team_a:teams!games_team_a_id_fkey(*), team_b:teams!games_team_b_id_fkey(*), tournament:tournaments(*)')
        .eq('id', id!)
        .is('archived_at', null)
        .single()
      if (error) throw error
      const [game] = await applyGameTeamSnapshots([data as GameWithTeams])
      return game
    },
    enabled: !!id,
  })
}

export function useCreateGame() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      tournament_id: string
      team_a_id: string
      team_b_id: string
    }) => {
      const { data, error } = await supabase
        .from('games')
        .insert({ ...payload, status: 'pending' })
        .select()
        .single()
      if (error) throw error
      return data as Game
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['games'] }),
  })
}

export function useUpdateGameStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      status,
      started_at,
      ended_at,
    }: {
      id: string
      status: GameStatus
      started_at?: string
      ended_at?: string | null
    }) => {
      const { data, error } = await supabase
        .from('games')
        .update({
          status,
          ...(started_at ? { started_at } : {}),
          ...(ended_at !== undefined ? { ended_at } : {}),
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Game
    },
    onSuccess: async (data, vars) => {
      qc.setQueryData<GameWithTeams | undefined>(['games', vars.id], (current) =>
        current ? { ...current, ...data } : current,
      )
      qc.setQueryData<GameWithTeams[] | undefined>(['games'], (current) =>
        current?.map((game) => (game.id === data.id ? { ...game, ...data } : game)),
      )
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['games', vars.id], exact: true }),
        qc.invalidateQueries({ queryKey: ['games'], exact: true }),
      ])
    },
  })
}

export function useUpdateGame() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      tournament_id,
      team_a_id,
      team_b_id,
    }: {
      id: string
      tournament_id: string
      team_a_id: string
      team_b_id: string
    }) => {
      const { data, error } = await supabase
        .from('games')
        .update({ tournament_id, team_a_id, team_b_id })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Game
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['games', vars.id] })
      qc.invalidateQueries({ queryKey: ['games'] })
    },
  })
}

export function useDeleteGame() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('games')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['games'] }),
  })
}
