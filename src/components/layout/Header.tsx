import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/Button'

export function Header() {
  const { user, profile, isEditor, signOut } = useAuth()
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const displayName =
    profile?.full_name ||
    (typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null) ||
    user?.email ||
    'Usuario'

  return (
    <header className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between gap-3 shadow-lg sticky top-0 z-40">
      <Link to="/" className="flex items-center gap-3">
        <img
          src="/mascot.png"
          alt="Frisbee Urgente mascote"
          className="h-10 w-10 rounded-full object-cover border-2 border-gold-400"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none'
          }}
        />
        <div>
          <div className="text-gold-400 font-black text-base leading-tight tracking-wide">
            FRISBEE URGENTE
          </div>
          <div className="text-gray-400 text-xs leading-tight">em Dados</div>
        </div>
      </Link>

      {user ? (
        <div className="flex items-center gap-2">
          <div className="text-right leading-tight">
            <div className="text-xs font-semibold text-white truncate max-w-[140px]">{displayName}</div>
            <div className="text-[11px] text-gray-300 truncate max-w-[140px]">{user.email}</div>
            <div className={`text-[11px] ${isEditor ? 'text-emerald-300' : 'text-amber-300'}`}>
              {isEditor ? 'editor' : 'sem permissao'}
            </div>
            {signOutError && <div className="text-[11px] text-red-300">{signOutError}</div>}
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={async () => {
              setSignOutError(null)
              try {
                await signOut()
              } catch (error) {
                setSignOutError(error instanceof Error ? error.message : 'Falha ao sair')
              }
            }}
          >
            Sair
          </Button>
        </div>
      ) : (
        <Link
          to="/login"
          className="text-xs font-semibold text-gold-400 hover:text-gold-300 transition-colors"
        >
          Entrar
        </Link>
      )}
    </header>
  )
}
