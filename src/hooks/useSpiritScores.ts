import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { SpiritScoreWithTeam, TournamentTeam } from '../types/database'
import { buildTournamentTeamSnapshotMap, getTournamentTeamSnapshotName } from '../lib/teamSnapshots'

type SpiritScoreWithGameTournament = SpiritScoreWithTeam & {
  game?: { tournament_id: string } | null
}

async function applySpiritTeamSnapshots(scores: SpiritScoreWithGameTournament[]) {
  const tournamentIds = Array.from(
    new Set(scores.map((score) => score.game?.tournament_id).filter(Boolean) as string[])
  )
  if (tournamentIds.length === 0) return scores as SpiritScoreWithTeam[]

  const { data, error } = await supabase
    .from('tournament_teams')
    .select('tournament_id, team_id, team_name')
    .in('tournament_id', tournamentIds)

  if (error) throw error

  const snapshots = buildTournamentTeamSnapshotMap(data as TournamentTeam[])
  return scores.map((score) => ({
    ...score,
    evaluated_team: {
      ...score.evaluated_team,
      name: score.game?.tournament_id
        ? getTournamentTeamSnapshotName(
            snapshots,
            score.game.tournament_id,
            score.evaluated_team_id,
            score.evaluated_team.name
          )
        : score.evaluated_team.name,
    },
  })) as SpiritScoreWithTeam[]
}

export interface TournamentSpiritStats {
  tournamentId: string
  teamId: string
  teamName: string
  scoreCount: number
  totalScore: number
}

export interface SpiritScoreGameDetail {
  tournamentId: string
  evaluatedTeamId: string
  gameId: string
  opponentTeamName: string
  gameDate: string | null
  rulesKnowledge: number
  foulsContact: number
  fairness: number
  positiveAttitude: number
  communication: number
  totalScore: number
}

export const SPIRIT_ITEM_LABELS: Record<
  'rules_knowledge' | 'fouls_contact' | 'fairness' | 'positive_attitude' | 'communication',
  string
> = {
  rules_knowledge: 'Conhecimento de regras',
  fouls_contact: 'Faltas e contato',
  fairness: 'Imparcialidade',
  positive_attitude: 'Atitude positiva',
  communication: 'Comunicação',
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
        .select('*, game:games(tournament_id), evaluated_team:teams(*)')
        .eq('game_id', gameId!)
        .is('archived_at', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      return applySpiritTeamSnapshots(data as SpiritScoreWithGameTournament[])
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
        .select('*, game:games(tournament_id), evaluated_team:teams(*)')
        .is('archived_at', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      return applySpiritTeamSnapshots(data as SpiritScoreWithGameTournament[])
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
      qc.invalidateQueries({ queryKey: ['tournament-spirit-score-details'] })
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

export function useTournamentSpiritScoreDetails(enabled = true) {
  return useQuery({
    queryKey: ['tournament-spirit-score-details'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_tournament_spirit_score_details')
      if (error) throw error
      return (data as {
        tournament_id: string
        evaluated_team_id: string
        game_id: string
        opponent_team_name: string
        game_date: string | null
        rules_knowledge: number
        fouls_contact: number
        fairness: number
        positive_attitude: number
        communication: number
        total_score: number
      }[]).map((row) => ({
        tournamentId: row.tournament_id,
        evaluatedTeamId: row.evaluated_team_id,
        gameId: row.game_id,
        opponentTeamName: row.opponent_team_name,
        gameDate: row.game_date,
        rulesKnowledge: Number(row.rules_knowledge),
        foulsContact: Number(row.fouls_contact),
        fairness: Number(row.fairness),
        positiveAttitude: Number(row.positive_attitude),
        communication: Number(row.communication),
        totalScore: Number(row.total_score),
      })) satisfies SpiritScoreGameDetail[]
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
      qc.invalidateQueries({ queryKey: ['tournament-spirit-score-details'] })
    },
  })
}
