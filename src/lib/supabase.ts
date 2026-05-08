import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase não configurado. Crie um arquivo .env.local com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'
  )
}

// Sem tipagem genérica do Database: o projeto usa uma interface "Database" simplificada,
// e a tipagem do supabase-js acaba inferindo `never` em `insert`/`update`.
// As respostas ainda são casteadas nos hooks usando os tipos do `src/types/database.ts`.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
