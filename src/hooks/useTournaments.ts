import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Tournament, TournamentTeam, Team, TournamentRosterPlayer } from '../types/database'
import { applyTeamSnapshotName } from '../lib/teamSnapshots'

export interface TournamentTeamLink extends TournamentTeam {
  team: Team
}

export function useTournaments() {
  return useQuery({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .is('archived_at', null)
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
        .is('archived_at', null)
      if (error) throw error
      return (data as (TournamentTeam & { team: Team })[])
        .filter((r) => !r.team.archived_at)
        .map((r) => applyTeamSnapshotName(r.team, r))
    },
    enabled: !!tournamentId,
  })
}

export function useCreateTournament() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      name,
      end_date,
      teamIds,
    }: {
      name: string
      end_date: string | null
      teamIds: string[]
    }) => {
      // Create tournament
      const { data: tournament, error: tErr } = await supabase
        .from('tournaments')
        .insert({ name, end_date })
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

export function useUpdateTournament() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      name,
      end_date,
      teamIds,
    }: {
      id: string
      name: string
      end_date: string | null
      teamIds: string[]
    }) => {
      const { data: tournament, error: tErr } = await supabase
        .from('tournaments')
        .update({ name, end_date })
        .eq('id', id)
        .select()
        .single()
      if (tErr) throw tErr

      const [{ data: currentLinks, error: linksErr }, { data: existingGames, error: gamesErr }] =
        await Promise.all([
          supabase
            .from('tournament_teams')
            .select('*')
            .eq('tournament_id', id),
          supabase
            .from('games')
            .select('team_a_id, team_b_id')
            .eq('tournament_id', id)
            .is('archived_at', null),
        ])
      if (linksErr) throw linksErr
      if (gamesErr) throw gamesErr

      const desiredTeamIds = new Set(teamIds)
      const activeLinks = (currentLinks as TournamentTeam[]).filter((link) => !link.archived_at)
      const currentTeamIds = new Set(activeLinks.map((link) => link.team_id))
      const gameTeamIds = new Set(
        (existingGames as { team_a_id: string; team_b_id: string }[]).flatMap((game) => [
          game.team_a_id,
          game.team_b_id,
        ])
      )

      const linksToArchive = activeLinks.filter(
        (link) => !desiredTeamIds.has(link.team_id) && !gameTeamIds.has(link.team_id)
      )
      if (linksToArchive.length > 0) {
        const archivedAt = new Date().toISOString()
        const { error: archiveErr } = await supabase
          .from('tournament_teams')
          .update({ archived_at: archivedAt })
          .in('id', linksToArchive.map((link) => link.id))
        if (archiveErr) throw archiveErr

        const { error: rosterArchiveErr } = await supabase
          .from('tournament_roster_players')
          .update({ archived_at: archivedAt })
          .eq('tournament_id', id)
          .in('team_id', linksToArchive.map((link) => link.team_id))
          .is('archived_at', null)
        if (rosterArchiveErr) throw rosterArchiveErr
      }

      const teamIdsToInsert = teamIds.filter((team_id) => !currentTeamIds.has(team_id))
      if (teamIdsToInsert.length > 0) {
        const archivedLinks = (currentLinks as TournamentTeam[]).filter(
          (link) => link.archived_at && desiredTeamIds.has(link.team_id)
        )
        const linksToRestore = archivedLinks.filter((link) => teamIdsToInsert.includes(link.team_id))
        if (linksToRestore.length > 0) {
          const { error: restoreErr } = await supabase
            .from('tournament_teams')
            .update({ archived_at: null })
            .in('id', linksToRestore.map((link) => link.id))
          if (restoreErr) throw restoreErr

          const { error: rosterRestoreErr } = await supabase
            .from('tournament_roster_players')
            .update({ archived_at: null })
            .eq('tournament_id', id)
            .in('team_id', linksToRestore.map((link) => link.team_id))
          if (rosterRestoreErr) throw rosterRestoreErr
        }

        const restoredTeamIds = new Set(linksToRestore.map((link) => link.team_id))
        const newTeamIds = teamIdsToInsert.filter((team_id) => !restoredTeamIds.has(team_id))
        if (newTeamIds.length > 0) {
          const { error: insertErr } = await supabase.from('tournament_teams').insert(
            newTeamIds.map((team_id) => ({
              tournament_id: id,
              team_id,
            }))
          )
        if (insertErr) throw insertErr
        }
      }

      return tournament as Tournament
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['tournaments'] })
      qc.invalidateQueries({ queryKey: ['tournaments', vars.id, 'teams'] })
      qc.invalidateQueries({ queryKey: ['games'] })
    },
  })
}

export function useDeleteTournament() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tournaments')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tournaments'] }),
  })
}

export function useTournamentRosterPlayers(tournamentId?: string, teamId?: string) {
  return useQuery({
    queryKey: ['tournaments', tournamentId, 'teams', teamId, 'roster'],
    queryFn: async () => {
      let query = supabase
        .from('tournament_roster_players')
        .select('*')
        .is('archived_at', null)
        .order('name')

      if (tournamentId) query = query.eq('tournament_id', tournamentId)
      if (teamId) query = query.eq('team_id', teamId)

      const { data, error } = await query
      if (error) throw error
      return data as TournamentRosterPlayer[]
    },
    enabled: !!tournamentId || !!teamId,
  })
}

export function useAllTournamentRosterPlayers() {
  return useQuery({
    queryKey: ['tournament-roster-players'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournament_roster_players')
        .select('*')
        .is('archived_at', null)
        .order('name')
      if (error) throw error
      return data as TournamentRosterPlayer[]
    },
  })
}

export function useTournamentTeamLinks(tournamentId?: string) {
  return useQuery({
    queryKey: tournamentId ? ['tournaments', tournamentId, 'team-links'] : ['tournament-team-links'],
    queryFn: async () => {
      let query = supabase
        .from('tournament_teams')
        .select('*, team:teams(*)')
        .is('archived_at', null)

      if (tournamentId) query = query.eq('tournament_id', tournamentId)

      const { data, error } = await query
      if (error) throw error
      return (data as TournamentTeamLink[]).map((link) => ({
        ...link,
        team: applyTeamSnapshotName(link.team, link),
      }))
    },
  })
}
