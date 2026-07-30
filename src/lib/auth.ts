import type { Session } from '@supabase/supabase-js'
import { isPastDate } from './utils'
import type { Tournament } from '../types/database'

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

export function isOrganizerRole(session: Session | null): boolean {
  return getUserRole(session) === 'organizador'
}

export function canManageRole(session: Session | null): boolean {
  const role = getUserRole(session)
  return role === 'editor' || role === 'admin'
}

export function canCreateTournament(session: Session | null): boolean {
  return canManageRole(session) || isOrganizerRole(session)
}

export function canManageTournament(session: Session | null, tournament: Tournament): boolean {
  if (isAdminRole(session)) return true
  if (isPastDate(tournament.end_date)) return false
  if (isEditorRole(session)) return true
  return isOrganizerRole(session) && tournament.organizer_id === (session?.user.id ?? null)
}
