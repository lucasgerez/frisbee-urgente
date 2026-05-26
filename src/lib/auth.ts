import type { Session } from '@supabase/supabase-js'

export function isEditorRole(session: Session | null): boolean {
  return session?.user.app_metadata?.role === 'editor'
}
