// ─── Enums ───────────────────────────────────────────────────────────────────

export type Gender = 'Masculino' | 'Feminino'
export type GameStatus = 'pending' | 'in_progress' | 'paused' | 'finished'

// ─── Raw DB row types ─────────────────────────────────────────────────────────

export interface Team {
  id: string
  name: string
  archived_at: string | null
  created_at: string
}

export interface Player {
  id: string
  name: string
  nickname: string | null
  number: string | null
  team_id: string
  gender: Gender
  archived_at: string | null
  created_at: string
}

export interface Tournament {
  id: string
  name: string
  end_date: string | null
  archived_at: string | null
  created_at: string
}

export interface TournamentTeam {
  id: string
  tournament_id: string
  team_id: string
  team_name: string
  archived_at: string | null
}

export interface TournamentRosterPlayer {
  id: string
  tournament_id: string
  team_id: string
  player_id: string
  name: string
  nickname: string | null
  number: string | null
  gender: Gender
  created_at: string
  archived_at: string | null
}

export interface Game {
  id: string
  tournament_id: string
  team_a_id: string
  team_b_id: string
  status: GameStatus
  started_at: string | null
  ended_at: string | null
  archived_at: string | null
  created_at: string
}

export interface Goal {
  id: string
  game_id: string
  scorer_id: string
  assistant_id: string | null
  scoring_team_id: string
  scorer_roster_player_id: string | null
  assistant_roster_player_id: string | null
  archived_at: string | null
  created_at: string
}

export interface Defense {
  id: string
  game_id: string
  player_id: string
  team_id: string
  roster_player_id: string | null
  archived_at: string | null
  created_at: string
}

export interface Profile {
  id: string
  full_name: string | null
  created_at: string
  updated_at: string
}

export interface SpiritScore {
  id: string
  game_id: string
  evaluated_team_id: string
  created_by: string
  rules_knowledge: number
  fouls_contact: number
  fairness: number
  positive_attitude: number
  communication: number
  total_score: number
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface MatchMvp {
  id: string
  game_id: string
  team_id: string
  male_player_id: string
  female_player_id: string
  male_roster_player_id: string | null
  female_roster_player_id: string | null
  created_by: string
  archived_at: string | null
  created_at: string
  updated_at: string
}

// ─── Joined / UI shapes ───────────────────────────────────────────────────────

export interface GameWithTeams extends Game {
  team_a: Team
  team_b: Team
  tournament: Tournament
}

export interface GoalWithPlayers extends Goal {
  scorer: Player
  assistant: Player | null
  scoring_team: Team
  scorer_roster?: TournamentRosterPlayer | null
  assistant_roster?: TournamentRosterPlayer | null
}

export interface DefenseWithPlayer extends Defense {
  player: Player
  roster_player?: TournamentRosterPlayer | null
}

export interface SpiritScoreWithTeam extends SpiritScore {
  evaluated_team: Team
}

export interface MatchMvpWithPlayers extends MatchMvp {
  team: Team
  male_player: Player
  female_player: Player
  male_roster_player?: TournamentRosterPlayer | null
  female_roster_player?: TournamentRosterPlayer | null
}

// ─── Supabase Database generic type ──────────────────────────────────────────

export type Database = {
  public: {
    Tables: {
      teams: {
        Row: Team
        Insert: Omit<Team, 'id' | 'created_at'>
        Update: Partial<Omit<Team, 'id' | 'created_at'>>
        Relationships: []
      }
      players: {
        Row: Player
        Insert: Omit<Player, 'id' | 'created_at'>
        Update: Partial<Omit<Player, 'id' | 'created_at'>>
        Relationships: []
      }
      tournaments: {
        Row: Tournament
        Insert: Omit<Tournament, 'id' | 'created_at'>
        Update: Partial<Omit<Tournament, 'id' | 'created_at'>>
        Relationships: []
      }
      tournament_teams: {
        Row: TournamentTeam
        Insert: Omit<TournamentTeam, 'id'>
        Update: Partial<Omit<TournamentTeam, 'id'>>
        Relationships: []
      }
      tournament_roster_players: {
        Row: TournamentRosterPlayer
        Insert: Omit<TournamentRosterPlayer, 'id' | 'created_at'>
        Update: Partial<Omit<TournamentRosterPlayer, 'id' | 'created_at'>>
        Relationships: []
      }
      games: {
        Row: Game
        Insert: Omit<Game, 'id' | 'created_at'>
        Update: Partial<Omit<Game, 'id' | 'created_at'>>
        Relationships: []
      }
      goals: {
        Row: Goal
        Insert: Omit<Goal, 'id' | 'created_at'>
        Update: Partial<Omit<Goal, 'id' | 'created_at'>>
        Relationships: []
      }
      defenses: {
        Row: Defense
        Insert: Omit<Defense, 'id' | 'created_at'>
        Update: Partial<Omit<Defense, 'id' | 'created_at'>>
        Relationships: []
      }
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'created_at' | 'updated_at'>>
      }
      spirit_scores: {
        Row: SpiritScore
        Insert: Omit<SpiritScore, 'id' | 'created_at' | 'updated_at' | 'total_score'>
        Update: Partial<Omit<SpiritScore, 'id' | 'created_at' | 'updated_at' | 'total_score'>>
      }
      match_mvps: {
        Row: MatchMvp
        Insert: Omit<MatchMvp, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<MatchMvp, 'id' | 'created_at' | 'updated_at' | 'created_by'>>
      }
    }
    Views: {}
    Functions: {}
    Enums: {
      gender_enum: Gender
      game_status: GameStatus
    }
    CompositeTypes: {}
  }
}
