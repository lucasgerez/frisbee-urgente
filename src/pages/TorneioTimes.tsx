import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  useAllTournamentRosterPlayers,
  useTournamentTeamLinks,
  useTournaments,
} from '../hooks/useTournaments'
import { LoadingScreen } from '../components/ui/Spinner'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { formatDate, formatDateOnly } from '../lib/utils'

function rosterKey(tournamentId: string, teamId: string) {
  return `${tournamentId}:${teamId}`
}

export function TorneioTimes() {
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set())
  const [numberRevealedPlayers, setNumberRevealedPlayers] = useState<Set<string>>(new Set())
  const {
    data: tournaments = [],
    isLoading: tournamentsLoading,
    error: tournamentsError,
  } = useTournaments()
  const {
    data: teamLinks = [],
    isLoading: linksLoading,
    error: linksError,
  } = useTournamentTeamLinks()
  const {
    data: rosterPlayers = [],
    isLoading: rosterLoading,
    error: rosterError,
  } = useAllTournamentRosterPlayers()

  if (tournamentsLoading || linksLoading || rosterLoading) return <LoadingScreen />

  if (tournamentsError || linksError || rosterError) {
    return <ErrorMessage message="Erro ao carregar times dos torneios" className="m-4" />
  }

  const rosterCounts = rosterPlayers.reduce(
    (acc, player) => {
      const key = rosterKey(player.tournament_id, player.team_id)
      const current = acc.get(key) ?? { total: 0, masculino: 0, feminino: 0 }
      current.total += 1
      if (player.gender === 'Masculino') current.masculino += 1
      if (player.gender === 'Feminino') current.feminino += 1
      acc.set(key, current)
      return acc
    },
    new Map<string, { total: number; masculino: number; feminino: number }>()
  )

  const toggleExpandedTeam = (id: string) => {
    setExpandedTeams((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const togglePlayerNumber = (id: string) => {
    setNumberRevealedPlayers((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

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
          Times por torneio
        </h1>
      </div>

      {tournaments.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-sm text-gray-400 border border-gray-100">
          Nenhum torneio cadastrado.
        </div>
      ) : (
        <div className="space-y-3">
          {tournaments.map((tournament) => {
            const links = teamLinks
              .filter((link) => link.tournament_id === tournament.id)
              .sort((a, b) => a.team.name.localeCompare(b.team.name))

            return (
              <section
                key={tournament.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3"
              >
                <div>
                  <h2 className="font-black text-gray-900">{tournament.name}</h2>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Criado em {formatDate(tournament.created_at)}
                  </div>
                  {tournament.end_date && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      Termina em {formatDateOnly(tournament.end_date)}
                    </div>
                  )}
                </div>

                {links.length === 0 ? (
                  <div className="text-sm text-gray-400 text-center py-3 border border-dashed border-gray-200 rounded-xl">
                    Nenhum time vinculado.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 overflow-hidden">
                    {links.map((link) => {
                      const teamRoster = rosterPlayers
                        .filter(
                          (player) =>
                            player.tournament_id === tournament.id &&
                            player.team_id === link.team_id
                        )
                        .sort((a, b) => {
                          const nameA = a.nickname?.trim() || a.name
                          const nameB = b.nickname?.trim() || b.name
                          return nameA.localeCompare(nameB)
                        })
                      const counts = rosterCounts.get(rosterKey(tournament.id, link.team_id)) ?? {
                        total: 0,
                        masculino: 0,
                        feminino: 0,
                      }
                      const isExpanded = expandedTeams.has(link.id)

                      return (
                        <div
                          key={link.id}
                          className="px-3 py-2.5"
                        >
                          <button
                            type="button"
                            onClick={() => toggleExpandedTeam(link.id)}
                            className="w-full grid grid-cols-[1fr_auto] gap-3 items-start text-left"
                            aria-expanded={isExpanded}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-bold text-sm text-gray-900 truncate">
                                  {link.team.name}
                                </span>
                                <span className="text-gray-300 text-xs shrink-0">
                                  {isExpanded ? '▲' : '▼'}
                                </span>
                              </div>
                              {link.team.archived_at && (
                                <div className="text-[11px] text-gray-400">Arquivado</div>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-xs font-bold shrink-0">
                              <span className="text-gray-700">{counts.total}</span>
                              <span className="text-blue-600">M {counts.masculino}</span>
                              <span className="text-pink-500">F {counts.feminino}</span>
                            </div>
                          </button>

                          {isExpanded && (
                          <div className="mt-2 overflow-hidden rounded-xl border border-gray-100">
                            {teamRoster.length === 0 ? (
                              <div className="px-3 py-3 text-xs text-gray-400">
                                Nenhum jogador registrado no elenco deste torneio.
                              </div>
                            ) : (
                              <>
                                <div className="grid grid-cols-[52px_1fr_42px_1.2fr] gap-2 bg-gray-50 px-2 py-2 text-[10px] font-black uppercase text-gray-400">
                                  <span>Numero</span>
                                  <span>Apelido</span>
                                  <span className="text-center">F/M</span>
                                  <span>Nome</span>
                                </div>
                                <div className="divide-y divide-gray-100">
                                  {teamRoster.map((player) => {
                                    const displayName = player.nickname?.trim() || player.name
                                    const numberLabel = player.number ? `#${player.number}` : 'Sem #'
                                    const showNumber = numberRevealedPlayers.has(player.id)

                                    return (
                                      <div
                                        key={player.id}
                                        className="grid grid-cols-[52px_1fr_42px_1.2fr] gap-2 px-2 py-2 text-xs items-center"
                                      >
                                        <span className="font-black text-gray-500 truncate">
                                          {numberLabel}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => togglePlayerNumber(player.id)}
                                          className="text-left font-bold text-gray-900 truncate hover:text-cobalt-700"
                                          title="Clique para alternar entre apelido e numero"
                                        >
                                          {showNumber ? numberLabel : displayName}
                                        </button>
                                        <span
                                          className={`text-center font-black ${
                                            player.gender === 'Masculino' ? 'text-blue-600' : 'text-pink-500'
                                          }`}
                                        >
                                          {player.gender === 'Masculino' ? 'M' : 'F'}
                                        </span>
                                        <span className="text-gray-700 truncate">
                                          {player.name}
                                        </span>
                                      </div>
                                    )
                                  })}
                                </div>
                              </>
                            )}
                          </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
