// ─── Enums ───────────────────────────────────────────────────────────────────

export type Gender = 'Masculino' | 'Feminino'
export type GameStatus = 'pending' | 'in_progress' | 'paused' | 'finished'

// ─── Raw DB row types ─────────────────────────────────────────────────────────

export interface Team {
  id: string
  name: string
  created_at: string
}

export interface Player {
  id: string
  name: string
  nickname: string | null
  number: string | null
  team_id: string
  gender: Gender
  created_at: string
}

export interface Tournament {
  id: string
  name: string
  created_at: string
}

export interface TournamentTeam {
  id: string
  tournament_id: string
  team_id: string
}

export interface Game {
  id: string
  tournament_id: string
  team_a_id: string
  team_b_id: string
  status: GameStatus
  started_at: string | null
  ended_at: string | null
  created_at: string
}

export interface Goal {
  id: string
  game_id: string
  scorer_id: string
  assistant_id: string | null
  scoring_team_id: string
  created_at: string
}

export interface Defense {
  id: string
  game_id: string
  player_id: string
  team_id: string
  created_at: string
}

export interface Profile {
  id: string
  full_name: string | null
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
}

export interface DefenseWithPlayer extends Defense {
  player: Player
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
