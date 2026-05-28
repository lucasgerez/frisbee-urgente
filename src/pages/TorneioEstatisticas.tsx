import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTournaments, useTournamentTeams } from '../hooks/useTournaments'
import {
  useTournamentStats,
  type PlayerTournamentStats,
} from '../hooks/useTournamentStats'
import { SearchableSelect } from '../components/ui/SearchableSelect'
import { LoadingScreen } from '../components/ui/Spinner'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { cn, formatDateOnly, isPastDate } from '../lib/utils'
import { useAuth } from '../hooks/useAuth'
import type { Team, Gender } from '../types/database'

type Tab = 'total' | 'time'

function sortPlayers(a: PlayerTournamentStats, b: PlayerTournamentStats) {
  if (b.mvp !== a.mvp) return b.mvp - a.mvp
  if (b.defenses !== a.defenses) return b.defenses - a.defenses
  return a.player.name.localeCompare(b.player.name)
}

interface StatProps {
  label: string
  value: number
  highlight?: boolean
}

function Stat({ label, value, highlight }: StatProps) {
  return (
    <div className="flex flex-col items-center min-w-[2.25rem]">
      <span
        className={cn(
          'font-black text-sm',
          highlight ? 'text-cobalt-700' : 'text-gray-900'
        )}
      >
        {value}
      </span>
      <span
        className={cn(
          'text-[10px] font-medium uppercase tracking-wide',
          highlight ? 'text-cobalt-600' : 'text-gray-400'
        )}
      >
        {label}
      </span>
    </div>
  )
}

interface PlayerRankingProps {
  players: PlayerTournamentStats[]
  gender: Gender
  showTeam: boolean
}

function PlayerRanking({ players, gender, showTeam }: PlayerRankingProps) {
  const list = players
    .filter((p) => p.player.gender === gender)
    .sort(sortPlayers)

  const isMale = gender === 'Masculino'
  const headerColor = isMale ? 'text-blue-600' : 'text-pink-500'
  const topRowBg = isMale ? 'bg-blue-50' : 'bg-pink-50'

  return (
    <div>
      <h3
        className={cn(
          'font-black text-sm uppercase tracking-wide mb-2 px-1',
          headerColor
        )}
      >
        {gender}
      </h3>
      {list.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 text-center text-sm text-gray-400 border border-gray-100">
          Sem estatísticas no naipe {gender.toLowerCase()}.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
          {list.map((p, i) => (
            <div
              key={p.player.id}
              className={cn(
                'px-3 py-2.5 flex items-center gap-3',
                i === 0 && topRowBg
              )}
            >
              <span className="w-5 text-right text-xs font-bold text-gray-400 shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900 truncate">
                  {p.player.name}
                </div>
                {showTeam && p.team && (
                  <div className="text-xs text-gray-400 truncate">
                    {p.team.name}
                  </div>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <Stat label="G" value={p.goals} />
                <Stat label="A" value={p.assists} />
                <Stat label="D" value={p.defenses} />
                <Stat label="MVP" value={p.mvp} highlight />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function TorneioEstatisticas() {
  const { id } = useParams<{ id: string }>()
  const [tab, setTab] = useState<Tab>('total')
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)

  const { data: tournaments = [], isLoading: tournamentLoading } =
    useTournaments()
  const { data: teams = [] } = useTournamentTeams(id)
  const { isLoading: authLoading, isAdmin } = useAuth()

  const tournament = tournaments.find((t) => t.id === id)
  const canViewStats = !!tournament && (isAdmin || isPastDate(tournament.end_date))
  const { data: stats, isLoading: statsLoading, error } = useTournamentStats(id, canViewStats)

  if (tournamentLoading || authLoading || statsLoading) return <LoadingScreen />
  if (error)
    return (
      <ErrorMessage message="Erro ao carregar estatísticas" className="m-4" />
    )
  if (!tournament)
    return <ErrorMessage message="Torneio não encontrado" className="m-4" />
  if (!canViewStats) {
    return (
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        <Link
          to="/torneios"
          className="text-xs text-cobalt-600 font-medium hover:underline"
        >
          ← Torneios
        </Link>
        <ErrorMessage
          message={
            tournament.end_date
              ? `As estatísticas deste torneio ficam públicas após ${formatDateOnly(tournament.end_date)}.`
              : 'As estatísticas deste torneio estão disponíveis apenas para admins até uma data de término ser definida e passar.'
          }
        />
      </div>
    )
  }

  const players = stats?.players ?? []
  const filtered =
    tab === 'time' && selectedTeam
      ? players.filter((p) => p.team?.id === selectedTeam.id)
      : players

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5 pb-20">
      <div>
        <Link
          to="/torneios"
          className="text-xs text-cobalt-600 font-medium hover:underline"
        >
          ← Torneios
        </Link>
        <h1 className="text-2xl font-black text-gray-900 mt-1">
          {tournament.name}
        </h1>
        <p className="text-sm text-gray-500">Estatísticas do torneio</p>
      </div>

      <div className="flex bg-gray-100 rounded-xl p-1">
        <button
          type="button"
          onClick={() => setTab('total')}
          className={cn(
            'flex-1 py-2 px-3 text-sm font-bold rounded-lg transition-colors',
            tab === 'total'
              ? 'bg-white text-cobalt-700 shadow-sm'
              : 'text-gray-600'
          )}
        >
          Total
        </button>
        <button
          type="button"
          onClick={() => setTab('time')}
          className={cn(
            'flex-1 py-2 px-3 text-sm font-bold rounded-lg transition-colors',
            tab === 'time'
              ? 'bg-white text-cobalt-700 shadow-sm'
              : 'text-gray-600'
          )}
        >
          Time
        </button>
      </div>

      {tab === 'time' && (
        <SearchableSelect
          options={teams}
          value={selectedTeam}
          onChange={setSelectedTeam}
          getLabel={(t) => t.name}
          getValue={(t) => t.id}
          placeholder="Selecionar time..."
          clearable
        />
      )}

      {tab === 'time' && !selectedTeam ? (
        <div className="bg-white rounded-2xl p-8 text-center text-sm text-gray-400 border border-gray-100">
          Selecione um time para ver as estatísticas.
        </div>
      ) : (
        <div className="space-y-5">
          <PlayerRanking
            players={filtered}
            gender="Masculino"
            showTeam={tab === 'total'}
          />
          <PlayerRanking
            players={filtered}
            gender="Feminino"
            showTeam={tab === 'total'}
          />
        </div>
      )}
    </div>
  )
}
