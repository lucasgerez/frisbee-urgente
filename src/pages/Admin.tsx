import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useAdminUsers, useUpdateUserRole } from '../hooks/useAdminUsers'
import type { AdminUser } from '../hooks/useAdminUsers'
import { LoadingScreen } from '../components/ui/Spinner'
import { ErrorMessage } from '../components/ui/ErrorMessage'

const ROLE_OPTIONS = [
  { value: '', label: 'sem role' },
  { value: 'editor', label: 'editor' },
  { value: 'admin', label: 'admin' },
]

const roleColor: Record<string, string> = {
  admin: 'text-red-600 font-semibold',
  editor: 'text-emerald-600 font-semibold',
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

export function Admin() {
  const navigate = useNavigate()
  const { isAdmin, isLoading: authLoading } = useAuth()
  const { data: users, isLoading, error } = useAdminUsers()
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/', { replace: true })
    }
  }, [authLoading, isAdmin, navigate])

  if (authLoading || (!isAdmin && !authLoading)) return <LoadingScreen />
  if (isLoading) return <LoadingScreen />

  const filtered = users?.filter((u) =>
    (u.email ?? '').toLowerCase().includes(search.toLowerCase())
  ) ?? []

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
      <h1 className="text-2xl font-black text-gray-900">Admin — Usuarios</h1>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por email..."
        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-cobalt-600 focus:ring-2 focus:ring-cobalt-600/20"
      />

      {error && <ErrorMessage message={(error as Error).message} />}

      {!error && filtered.length === 0 && (
        <p className="text-sm text-gray-500">
          {search ? 'Nenhum usuario encontrado para essa busca.' : 'Nenhum usuario encontrado.'}
        </p>
      )}

      <ul className="space-y-3">
        {filtered.map((user) => (
          <UserRow key={user.id} user={user} />
        ))}
      </ul>
    </div>
  )
}
