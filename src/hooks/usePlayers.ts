import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Player, Gender } from '../types/database'

export function usePlayers(teamId?: string) {
  return useQuery({
    queryKey: ['players', teamId],
    queryFn: async () => {
      let query = supabase.from('players').select('*').order('name')
      if (teamId) query = query.eq('team_id', teamId)
      const { data, error } = await query
      if (error) throw error
      return data as Player[]
    },
    enabled: !!teamId,
  })
}

export function useCreatePlayer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name: string; team_id: string; gender: Gender }) => {
      const { data, error } = await supabase
        .from('players')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data as Player
    },
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ['players', vars.team_id] }),
  })
}

export function useUpdatePlayer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      name,
      gender,
    }: {
      id: string
      name: string
      gender: Gender
      team_id: string
    }) => {
      const { data, error } = await supabase
        .from('players')
        .update({ name, gender })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Player
    },
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ['players', vars.team_id] }),
  })
}

export function useDeletePlayer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, team_id }: { id: string; team_id: string }) => {
      const { error } = await supabase.from('players').delete().eq('id', id)
      if (error) throw error
      return team_id
    },
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ['players', vars.team_id] }),
  })
}
