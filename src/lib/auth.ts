import type { Session } from '@supabase/supabase-js'

export function getUserRole(session: Session | null): string | null {
  const role = session?.user.app_metadata?.role
  return typeof role === 'string' ? role : null
}

export function isEditorRole(session: Session | null): boolean {
  return getUserRole(session) === 'editor'
}

export function isAdminRole(session: Session | null): boolean {
  return getUserRole(session) === 'admin'
}

export function canManageRole(session: Session | null): boolean {
  const role = getUserRole(session)
  return role === 'editor' || role === 'admin'
}
