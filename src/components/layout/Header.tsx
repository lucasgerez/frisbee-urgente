import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/Button'

export function Header() {
  const navigate = useNavigate()
  const { user, profile, canManage, isAdmin, role, signOut } = useAuth()
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
        <div className="flex items-center gap-3 cursor-pointer group">
          <div
            className="bg-amber-500 text-slate-950 p-2 rounded-xl font-black text-xl leading-none shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            🥏
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-lg tracking-wider text-white">
                FRISBEE <span className="text-amber-400">URGENTE</span>
              </h1>
            </div>
            <div className="text-gray-400 text-xs leading-tight">
              Ultimate Frisbee Analytics
            </div>
          </div>
        </div>
      </Link>

      <Navigation/>

      {user ? (
        <div className="flex items-center gap-2">
          <div className="text-right leading-tight">
            <div className="text-xs font-semibold text-white truncate max-w-[140px]">{displayName}</div>
            <div className="text-[11px] text-gray-300 truncate max-w-[140px]">{user.email}</div>
            <div className={`text-[11px] ${canManage ? 'text-emerald-300' : 'text-amber-300'}`}>
              {canManage ? role : 'sem permissao'}
            </div>
            {signOutError && <div className="text-[11px] text-red-300">{signOutError}</div>}
          </div>
          {isAdmin && (
            <Link
              to="/admin"
              aria-label="Painel administrativo"
              title="Painel administrativo"
              className="text-gold-400 hover:text-gold-300 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </Link>
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={async () => {
              setSignOutError(null)
              try {
                await signOut()
                navigate('/jogos', { replace: true })
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

import { NavLink } from 'react-router-dom'
import {useTranslation} from "react-i18next";

export function Navigation() {
  const { t } = useTranslation()

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-1.5 text-xs rounded-lg transition ${
      isActive
        ? 'font-bold bg-amber-500 text-slate-950 shadow-md'
        : 'font-semibold text-slate-400 hover:text-white'
    }`

  const tabs = [
    {
      to: '/',
      label: t('navigation.home'),
    },
    {
      to: '/times',
      label: t('navigation.teams'),
    },
    {
      to: '/torneios',
      label: t('navigation.tournaments'),
    },
    {
      to: '/jogos',
      label: t('navigation.games'),
    },
  ]

  return (
    <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
      {
        tabs.map(({ to, label }, index) => (
          <NavLink to={to} key={index} className={navClass}>{label}</NavLink>
        ))
      }
    </nav>
  )
}
