import { Link } from 'react-router-dom'
import { useGames } from '../hooks/useGames'
import { useGameGoals } from '../hooks/useGoals'
import { GameCard } from '../components/games/GameCard'
import { LoadingScreen } from '../components/ui/Spinner'
import type { GameWithTeams } from '../types/database'
import { useTranslation } from "react-i18next";
import { LightningIcon, TrophyIcon, UsersThreeIcon} from "@phosphor-icons/react";
import {useDashboard} from "../hooks/useDashboard.ts";

function RecentGameCard({ game }: { game: GameWithTeams }) {
  const { data: goals = [] } = useGameGoals(game.id)
  return (
    <GameCard
      game={game}
      goalCounts={{
        teamA: goals.filter((g) => g.scoring_team_id === game.team_a_id).length,
        teamB: goals.filter((g) => g.scoring_team_id === game.team_b_id).length,
      }}
    />
  )
}

function DashboardStatSkeleton() {
  return (
    <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
      <div className="size-14 rounded-xl bg-slate-200 animate-pulse" />

      <div className="flex-1 space-y-2">
        <div className="h-3 w-24 rounded bg-slate-200 animate-pulse" />
        <div className="h-6 w-12 rounded bg-slate-200 animate-pulse" />
      </div>
    </div>
  )
}

function Dashboard() {
  const { t } = useTranslation()

  const {
    data: dashboard = {
      gamesCount: 0,
      teamsCount: 0,
      tournamentsCount: 0,
    },
    isLoading,
  } = useDashboard()

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <DashboardStatSkeleton />
        <DashboardStatSkeleton />
        <DashboardStatSkeleton />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
          <TrophyIcon className="size-8" />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium max-[400px]:hidden">
            {t('home.active_tournaments')}
          </p>
          <p className="text-xl font-black text-slate-900">{ dashboard.tournamentsCount }</p></div>
      </div>

      <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
          <UsersThreeIcon className="size-8" />
          <i className="ph ph-users-three text-2xl"></i>
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium max-[400px]:hidden">
            {t('home.registered_teams')}
          </p>
          <p className="text-xl font-black text-slate-900">
            { dashboard.teamsCount }
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
          <LightningIcon className="size-8" />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium max-[400px]:hidden">
            {t('home.games_played')}
          </p>
          <p className="text-xl font-black text-slate-900">
            { dashboard.gamesCount }
          </p>
        </div>
      </div>
    </div>
  )
}

export function Home() {
  const { t } = useTranslation()

  const { data: games = [], isLoading } = useGames()

  const recentGames = games.slice(0, 5)

  return (
    <div className="px-4 py-5 space-y-6">
      <div className="bg-gray-900 rounded-2xl p-5 text-white gap-4 space-y-2">
        <h2 className="text-2xl md:text-3xl font-black text-gold-400">
          {t('home.title')}
        </h2>
        <p className="text-slate-300 text-sm">
          {t('home.description')}
        </p>
      </div>

      <Dashboard />

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-800">{t('home.recent_games')}</h2>
          <Link to="/jogos" className="text-cobalt-600 text-sm font-medium">
            {t('home.see_all_games')}
          </Link>
        </div>

        {isLoading ? (
          <LoadingScreen/>
        ) : recentGames.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-sm text-gray-400 border border-gray-100">
            {t('home.no_games')}{' '}
            <Link to="/jogos" className="text-cobalt-600 font-medium">
              {t('home.create_game')}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentGames.map((game) => (
              <RecentGameCard key={game.id} game={game}/>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
