import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useAdminUsers, useUpdateUserRole } from '../hooks/useAdminUsers'
import {
  useTournamentsWithCoOrganizers,
  useAddCoOrganizer,
  useRemoveCoOrganizer,
  filterOrganizerUsers,
  type CoOrganizerWithProfile,
} from '../hooks/useTournamentCoOrganizers'
import type { AdminUser } from '../hooks/useAdminUsers'
import type { Tournament } from '../types/database'
import { LoadingScreen } from '../components/ui/Spinner'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { SearchableSelect } from '../components/ui/SearchableSelect'

const ROLE_OPTIONS = [
  { value: '', label: 'sem role' },
  { value: 'editor', label: 'editor' },
  { value: 'organizador', label: 'organizador' },
  { value: 'admin', label: 'admin' },
]

const roleColor: Record<string, string> = {
  admin: 'text-red-600 font-semibold',
  editor: 'text-emerald-600 font-semibold',
  organizador: 'text-purple-600 font-semibold',
}

function UserRow({ user }: { user: AdminUser }) {
  const updateRole = useUpdateUserRole()
  const [rowError, setRowError] = useState<string | null>(null)
  const currentRole = user.role ?? ''

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowError(null)
    const newRole = e.target.value || null
    try {
      await updateRole.mutateAsync({ userId: user.id, role: newRole })
    } catch (err) {
      setRowError(err instanceof Error ? err.message : 'Erro ao atualizar')
    }
  }

  return (
    <li className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-1">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {user.full_name ?? <span className="text-gray-400 font-normal">sem nome</span>}
          </p>
          <p className="text-xs text-gray-500 truncate">{user.email ?? '—'}</p>
          <p className={`text-xs mt-0.5 ${roleColor[currentRole] ?? 'text-amber-500'}`}>
            {currentRole || 'sem role'}
          </p>
        </div>
        <div className="flex-shrink-0">
          <select
            value={currentRole}
            onChange={handleChange}
            disabled={updateRole.isPending}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-cobalt-600 focus:ring-2 focus:ring-cobalt-600/20 disabled:opacity-50"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {rowError && <ErrorMessage message={rowError} />}
    </li>
  )
}

function CoOrganizerTag({
  co,
  tournamentId,
}: {
  co: CoOrganizerWithProfile
  tournamentId: string
}) {
  const remove = useRemoveCoOrganizer()
  return (
    <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
      {co.profile?.full_name ?? co.user_id.slice(0, 8)}
      <button
        onClick={() => remove.mutate({ tournamentId, userId: co.user_id })}
        disabled={remove.isPending}
        className="ml-0.5 hover:text-purple-600 disabled:opacity-40"
        aria-label="Remover co-organizador"
      >
        ×
      </button>
    </span>
  )
}

function TournamentOrganizerCard({
  tournament,
  coOrganizers,
  organizerUsers,
  primaryOrganizer,
}: {
  tournament: Tournament
  coOrganizers: CoOrganizerWithProfile[]
  organizerUsers: AdminUser[]
  primaryOrganizer: AdminUser | undefined
}) {
  const add = useAddCoOrganizer()
  const [addError, setAddError] = useState<string | null>(null)

  const existingUserIds = new Set(coOrganizers.map((c) => c.user_id))
  if (tournament.organizer_id) existingUserIds.add(tournament.organizer_id)
  const available = organizerUsers.filter((u) => !existingUserIds.has(u.id))

  const handleAdd = async (user: AdminUser | null) => {
    if (!user) return
    setAddError(null)
    try {
      await add.mutateAsync({ tournamentId: tournament.id, userId: user.id })
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Erro ao adicionar')
    }
  }

  return (
    <li className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
      <p className="font-semibold text-gray-900">{tournament.name}</p>

      <div className="space-y-1">
        <p className="text-xs text-gray-500 uppercase tracking-wide">Organizador principal</p>
        <p className="text-sm text-gray-700">
          {primaryOrganizer
            ? (primaryOrganizer.full_name ?? primaryOrganizer.email ?? tournament.organizer_id)
            : <span className="text-gray-400">não definido</span>
          }
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-gray-500 uppercase tracking-wide">Co-organizadores</p>
        {coOrganizers.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {coOrganizers.map((co) => (
              <CoOrganizerTag key={co.user_id} co={co} tournamentId={tournament.id} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400">Nenhum</p>
        )}
      </div>

      {available.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Adicionar organizador</p>
          <SearchableSelect
            options={available}
            value={null}
            onChange={handleAdd}
            getLabel={(u) => u.full_name ?? u.email ?? u.id}
            getValue={(u) => u.id}
            placeholder="Selecionar organizador..."
            clearable={false}
          />
        </div>
      )}

      {addError && <ErrorMessage message={addError} />}
    </li>
  )
}

function TourneiosTab({ organizerUsers, allUsers }: { organizerUsers: AdminUser[]; allUsers: AdminUser[] }) {
  const { data: tournaments, isLoading, error } = useTournamentsWithCoOrganizers()
  const [search, setSearch] = useState('')

  if (isLoading) return <LoadingScreen />
  if (error) return <ErrorMessage message={(error as Error).message} />

  const usersById = Object.fromEntries(allUsers.map((u) => [u.id, u]))

  const filtered = (tournaments ?? []).filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar torneio..."
        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-cobalt-600 focus:ring-2 focus:ring-cobalt-600/20"
      />

      {filtered.length === 0 && (
        <p className="text-sm text-gray-500">
          {search ? 'Nenhum torneio encontrado.' : 'Nenhum torneio ativo.'}
        </p>
      )}

      <ul className="space-y-3">
        {filtered.map((t) => (
          <TournamentOrganizerCard
            key={t.id}
            tournament={t}
            coOrganizers={t.co_organizers ?? []}
            organizerUsers={organizerUsers}
            primaryOrganizer={t.organizer_id ? usersById[t.organizer_id] : undefined}
          />
        ))}
      </ul>
    </div>
  )
}

export function Admin() {
  const navigate = useNavigate()
  const { isAdmin, isLoading: authLoading } = useAuth()
  const { data: users, isLoading, error } = useAdminUsers()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'usuarios' | 'torneios'>('usuarios')

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/', { replace: true })
    }
  }, [authLoading, isAdmin, navigate])

  if (authLoading || (!isAdmin && !authLoading)) return <LoadingScreen />
  if (isLoading) return <LoadingScreen />

  const organizerUsers = filterOrganizerUsers(users ?? [])

  const filteredUsers = (users ?? []).filter((u) =>
    (u.email ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="px-4 py-5 space-y-5">
      <h1 className="text-2xl font-black text-gray-900">Admin</h1>

      {/* Tab switcher */}
      <div className="flex gap-2 border-b border-gray-200">
        {(['usuarios', 'torneios'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 px-1 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? 'text-cobalt-600 border-b-2 border-cobalt-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'usuarios' ? 'Usuários' : 'Torneios'}
          </button>
        ))}
      </div>

      {tab === 'usuarios' && (
        <>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por email..."
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-cobalt-600 focus:ring-2 focus:ring-cobalt-600/20"
          />

          {error && <ErrorMessage message={(error as Error).message} />}

          {!error && filteredUsers.length === 0 && (
            <p className="text-sm text-gray-500">
              {search ? 'Nenhum usuario encontrado para essa busca.' : 'Nenhum usuario encontrado.'}
            </p>
          )}

          <ul className="space-y-3">
            {filteredUsers.map((user) => (
              <UserRow key={user.id} user={user} />
            ))}
          </ul>
        </>
      )}

      {tab === 'torneios' && (
        <TourneiosTab organizerUsers={organizerUsers} allUsers={users ?? []} />
      )}
    </div>
  )
}
