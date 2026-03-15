import { Link } from 'react-router-dom'
import { useGames } from '../hooks/useGames'
import { useGameGoals } from '../hooks/useGoals'
import { GameCard } from '../components/games/GameCard'
import { LoadingScreen } from '../components/ui/Spinner'
import type { GameWithTeams } from '../types/database'

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

export function Home() {
  const { data: games = [], isLoading } = useGames()

  const activeGames = games.filter(
    (g) => g.status === 'in_progress' || g.status === 'paused'
  )
  const recentGames = games.slice(0, 5)

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-6">
      {/* Hero */}
      <div className="bg-gray-900 rounded-2xl p-5 text-white flex items-center gap-4">
        <img
          src="/mascot.png"
          alt="Frisbee Urgente"
          className="h-16 w-16 rounded-full object-cover border-2 border-gold-400 shrink-0"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <div>
          <div className="text-gold-400 font-black text-xl leading-tight">
            FRISBEE URGENTE
          </div>
          <div className="text-gray-300 text-sm mt-0.5">em Dados</div>
          <div className="text-gray-400 text-xs mt-1">
            Acompanhe as estatísticas em tempo real
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/jogos" className="bg-cobalt-600 text-white rounded-2xl p-4 hover:bg-cobalt-700 transition-colors">
          <div className="text-2xl mb-1">⚡</div>
          <div className="font-bold text-sm">Ver Jogos</div>
          <div className="text-cobalt-200 text-xs mt-0.5">Criar e acompanhar</div>
        </Link>
        <Link to="/torneios" className="bg-gold-400 text-gray-900 rounded-2xl p-4 hover:bg-gold-500 transition-colors">
          <div className="text-2xl mb-1">🏆</div>
          <div className="font-bold text-sm">Torneios</div>
          <div className="text-gold-700 text-xs mt-0.5">Gerenciar torneios</div>
        </Link>
        <Link to="/times" className="bg-white border border-gray-200 text-gray-800 rounded-2xl p-4 hover:border-gray-300 transition-colors">
          <div className="text-2xl mb-1">👥</div>
          <div className="font-bold text-sm">Times</div>
          <div className="text-gray-400 text-xs mt-0.5">Jogadores e naipes</div>
        </Link>
        {activeGames.length > 0 ? (
          <Link to={`/jogos/${activeGames[0].id}/anotar`}
            className="bg-green-500 text-white rounded-2xl p-4 hover:bg-green-600 transition-colors">
            <div className="text-2xl mb-1">✏️</div>
            <div className="font-bold text-sm">Anotar</div>
            <div className="text-green-100 text-xs mt-0.5 truncate">
              {activeGames[0].team_a.name} × {activeGames[0].team_b.name}
            </div>
          </Link>
        ) : (
          <Link to="/jogos" className="bg-white border border-gray-200 text-gray-800 rounded-2xl p-4 hover:border-gray-300 transition-colors">
            <div className="text-2xl mb-1">✏️</div>
            <div className="font-bold text-sm">Anotar</div>
            <div className="text-gray-400 text-xs mt-0.5">Iniciar um jogo</div>
          </Link>
        )}
      </div>

      {/* Recent games */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-800">Jogos recentes</h2>
          <Link to="/jogos" className="text-cobalt-600 text-sm font-medium">
            Ver todos
          </Link>
        </div>

        {isLoading ? (
          <LoadingScreen />
        ) : recentGames.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-sm text-gray-400 border border-gray-100">
            Nenhum jogo ainda.{' '}
            <Link to="/jogos" className="text-cobalt-600 font-medium">
              Criar o primeiro!
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentGames.map((game) => (
              <RecentGameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
