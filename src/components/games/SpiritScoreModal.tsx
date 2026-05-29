import { useEffect, useMemo, useState } from 'react'
import type { GameWithTeams, SpiritScoreWithTeam, Team } from '../../types/database'
import { useCreateSpiritScore, useUpdateSpiritScore } from '../../hooks/useSpiritScores'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { ErrorMessage } from '../ui/ErrorMessage'
import { SearchableSelect } from '../ui/SearchableSelect'

const categories = [
  {
    key: 'rules_knowledge',
    title: '1. Conhecimento e aplicação das regras',
    description:
      'Exemplos: Os jogadores não desrespeitaram ou mal interpretaram propositalmente as regras. Eles respeitaram os limites de tempo. Quando não sabiam as regras, mostraram vontade de aprendê-las.',
    notes: [
      {
        label: 'Pontuação ruim',
        examples: [
          'Os jogadores do time adversário repetidamente mostraram conhecimento precário sobre as regras.',
          'Os jogadores do time adversário constantemente desrespeitaram ou mal interpretaram propositalmente as regras.',
          'Eles se recusaram a aprender detalhes de regras e de SOTG.',
        ],
      },
      {
        label: 'Pontuação não tão boa',
        examples: [
          'Para o nível do jogo, os jogadores do time adversário, no geral, mostraram deficiência no conhecimento de regras.',
          'Eles desrespeitaram ou mal interpretaram propositalmente as regras algumas vezes.',
          'Eles se mostraram resistentes a aprender sobre regras e SOTG.',
          'Eles não respeitaram os limites de tempo.',
          'Eles continuaram a fazer offsides durante os pulls mesmo após serem alertados.',
        ],
      },
      {
        label: 'Pontuação boa',
        examples: [
          'Para o nível do jogo, os jogadores do time adversário, no geral, mostraram bom conhecimento sobre as regras.',
          'Eles não desrespeitaram ou mal interpretaram propositalmente as regras.',
          'Eles respeitaram os limites de tempo.',
          'Quando não sabiam as regras, eles mostraram vontade de aprendê-las.',
        ],
      },
      {
        label: 'Pontuação muito boa',
        examples: [
          'Para o nível do jogo, os jogadores do time adversário, no geral, mostraram conhecimento de regras acima da média.',
          'Houve pelo menos um caso em que eles nos ajudaram a aprender uma regra que não conhecíamos.',
        ],
      },
      {
        label: 'Pontuação excelente',
        examples: [
          'Para o nível do jogo, o time adversário, no geral, mostrou conhecimento de regras excelente.',
          'Eles seguiram as regras durante todo o jogo.',
          'Eles explicaram as regras que não conhecíamos de forma muito clara, eficiente e de um jeito que aumentou nosso prazer de jogar.',
        ],
      },
    ],
  },
  {
    key: 'fouls_contact',
    title: '2. Faltas e contato físico',
    description: 'Exemplos: Os jogadores evitaram faltas, contato e jogadas perigosas.',
    notes: [
      {
        label: 'Pontuação ruim',
        examples: [
          'Mesmo após repetidas chamadas, o time adversário continuou a fazer o mesmo tipo de falta ou contato.',
          'Tiveram várias ocasiões de jogadas perigosas ou imprudentes.',
          'Eles fizeram muito pouco esforço para evitar contato corporal.',
        ],
      },
      {
        label: 'Pontuação não tão boa',
        examples: [
          'A quantidade de contato não incidental foi um pouco demasiada.',
          'Tiveram algumas ocasiões de jogadas perigosas ou imprudentes.',
        ],
      },
      {
        label: 'Pontuação boa',
        examples: ['Não ocorreu nenhum contato significante além de contato incidental.'],
      },
      {
        label: 'Pontuação muito boa',
        examples: ['Teve pelo menos um caso claro de evasão consciente de contato.'],
      },
      {
        label: 'Pontuação excelente',
        examples: [
          'Houve vários casos de evasão consciente de contato.',
          'O time adversário jogou de uma forma que evitou potenciais faltas e contatos corporais desnecessários.',
        ],
      },
    ],
  },
  {
    key: 'fairness',
    title: '3. Imparcialidade',
    description:
      'Exemplos: Os jogadores se desculparam quando apropriado e informaram seus companheiros sobre chamadas erradas/desnecessárias. Apenas fizeram chamadas significativas.',
    notes: [
      {
        label: 'Pontuação ruim',
        examples: [
          'O time adversário sempre assumiu que eles estavam corretos nas chamadas.',
          'Quando questionados, os seus jogadores não deram opinião em chamadas que poderiam ir contra seu time.',
          'O time adversário fez muitas chamadas e contestações injustificadas.',
          'Eles usaram chamadas como forma de retaliação.',
          'Eles fizeram faltas ou chamadas por razões táticas frequentemente.',
          'O time adversário atrasou o jogo por razões táticas.',
        ],
      },
      {
        label: 'Pontuação não tão boa',
        examples: [
          'O time adversário frequentemente deu a impressão que eles só viam as coisas de uma maneira favorável ao seu time.',
          'O time adversário fez algumas chamadas e contestações injustificadas.',
          'O time adversário não foi consistente em suas chamadas ao longo do jogo.',
          'O time adversário foi rápido ao reclamar quando nosso time fazia uma chamada, independentemente do motivo da chamada.',
        ],
      },
      {
        label: 'Pontuação boa',
        examples: [
          'O time adversário não fez chamadas que não afetavam o desdobramento da jogada, tal como travels mínimos de um lançador desmarcado, ou faltas em lançamentos que não seriam recebidos.',
          'Eles respeitaram e reconheceram nossas opiniões em chamadas, mesmo discordando delas.',
          'Eles se desculparam em situações onde era apropriado, como uma falta não-contestada.',
          'Eles ajustaram o seu comportamento baseado no nosso feedback de uma forma que aumentou nosso prazer de jogar.',
        ],
      },
      {
        label: 'Pontuação muito boa',
        examples: [
          'Houve pelo menos um caso onde eles informaram seus jogadores que estavam fazendo chamadas/contestações erradas ou desnecessárias.',
          'O time adversário retirou chamadas quando eles acharam que estavam errados.',
        ],
      },
      {
        label: 'Pontuação excelente',
        examples: [
          'Houve diversos eventos claros de jogadores adversários prezando pela verdade da situação, mesmo que isso não os beneficiasse.',
          'O time adversário se manteve imparcial mesmo em situações críticas, como ponto de desempate de jogo ou Universe point.',
        ],
      },
    ],
  },
  {
    key: 'positive_attitude',
    title: '4. Atitude positiva e auto controle',
    description:
      'Exemplos: Os jogadores foram educados e jogaram com intensidade apropriada independente do placar. Deixaram uma impressão geral positiva, durante e após a partida.',
    notes: [
      {
        label: 'Pontuação ruim',
        examples: [
          'Os jogadores do time adversário e/ou a sua sideline foram rudes e não-corteses com seus oponentes, seus próprios jogadores, oficiais, voluntários, organizadores e/ou espectadores frequentemente.',
          'Houve confronto físico dentro/fora de campo.',
          'Ocorreram diversas ocasiões de spike com a borda do disco para baixo, ou comemorações agressivas.',
          'Ocorreram diversas ocasiões de dano deliberado a equipamentos.',
          'Eles jogavam de uma forma prepotente, como somente pontos de scoober ou jogadas acrobáticas.',
        ],
      },
      {
        label: 'Pontuação não tão boa',
        examples: [
          'Os jogadores do time adversário e/ou a sua sideline demostraram falta de autocontrole e falta de atitude positiva com seus jogadores, oponentes, oficiais, voluntários, organizadores e/ou espectadores.',
          'O time adversário ativamente celebrou nossos erros de forma a humilhar jogadores.',
          'Houve algumas ocasiões de spike com a borda do disco para baixo, ou comemorações agressivas.',
          'Ocorreram algumas ocasiões de dano deliberado a equipamentos.',
        ],
      },
      {
        label: 'Pontuação boa',
        examples: [
          'Os jogadores do time adversário e/ou a sua sideline demostraram autocontrole e atitude positiva com seus jogadores, oponentes, oficiais, voluntários, organizadores e/ou espectadores.',
          'O time adversário deixou uma impressão geral positiva durante e após o jogo, como na roda de Espírito.',
          'O time adversário foi educado conosco, seus próprios jogadores, oficiais e espectadores.',
          'Eles nos agradeceram pelo jogo.',
          'O time adversário jogou com intensidade apropriada, independentemente do placar.',
        ],
      },
      {
        label: 'Pontuação muito boa',
        examples: [
          'O time adversário se apresentou para nós.',
          'Eles nos cumprimentaram em uma jogada legal ou celebraram jogadas legais de ambos os times de uma maneira positiva.',
          'Houve 1 ou 2 ocasiões em que eles mostraram autocontrole muito bom.',
        ],
      },
      {
        label: 'Pontuação excelente',
        examples: [
          'O time adversário demonstrou autocontrole excelente no campo durante situações tensas/complicadas.',
          'O time adversário mostrou autocontrole e atitude positiva impecável durante o jogo com oponentes, oficiais e espectadores.',
        ],
      },
    ],
  },
  {
    key: 'communication',
    title: '5. Comunicação',
    description:
      'Exemplos: Os jogadores se comunicaram respeitosamente e nos escutaram. Eles mantiveram as discussões dentro dos limites de tempo.',
    notes: [
      {
        label: 'Pontuação ruim',
        examples: [
          'O time adversário frequentemente se recusou a discutir questões e chamadas.',
          'O time adversário ficou nervoso/reagiu com desprezo em muitas chamadas/contestações.',
          'O time adversário usou linguagem ofensiva frequentemente.',
          'A linguagem corporal do time adversário era frequentemente rude ou agressiva, tal como sorrisinhos ou gestos ofensivos com as mãos.',
        ],
      },
      {
        label: 'Pontuação não tão boa',
        examples: [
          'Jogadores não envolvidos na jogada várias vezes se envolveram sem ter a melhor perspectiva ou sem terem sido acionados/chamados.',
          'Houve algumas ocasiões onde eles não mantiveram a calma enquanto comunicavam.',
          'Houve algumas ocasiões onde a linguagem corporal foi rude ou agressiva, tal como sorrisinhos ou gestos ofensivos com as mãos.',
          'O time adversário não manteve as discussões dentro dos limites de tempo para discussões.',
        ],
      },
      {
        label: 'Pontuação boa',
        examples: [
          'Conflitos foram resolvidos sem problemas.',
          'O time adversário se comunicou respeitosamente.',
          'Eles nos escutaram.',
          'Eles se atentaram aos limites de tempo das discussões.',
          'O time adversário expôs o ponto de vista deles de forma clara.',
          'A sideline/outros jogadores do time adversário ajudaram quando acionados.',
        ],
      },
      {
        label: 'Pontuação muito boa',
        examples: [
          'O time adversário proveu evidências em suas chamadas.',
          'O time adversário expôs o ponto de vista deles calma e efetivamente.',
          'O capitão/líderes do time adversário se comunicaram com nossos líderes muito efetivamente.',
          'O time adversário trouxe à tona questões gerais e de espírito o mais cedo possível.',
        ],
      },
      {
        label: 'Pontuação excelente',
        examples: [
          'O time adversário explicou o jogo para espectadores e pessoas recém-chegadas.',
          'O time adversário nos motivou a manter o Espírito em um patamar alto e nos deu exemplos concretos de como fazê-lo.',
          'O time adversário se comunicou de maneira muito efetiva e nos fez sentir confortáveis discutindo o jogo.',
          'O time adversário utilizou a sinalização oficial para indicar faltas, pontuações, etc.',
        ],
      },
    ],
  },
] as const

type CategoryKey = (typeof categories)[number]['key']
type Scores = Record<CategoryKey, number>

interface SpiritScoreModalProps {
  open: boolean
  onClose: () => void
  game: GameWithTeams | null
  currentUserId: string
  isAdmin: boolean
  scores: SpiritScoreWithTeam[]
}

const defaultScores: Scores = {
  rules_knowledge: 2,
  fouls_contact: 2,
  fairness: 2,
  positive_attitude: 2,
  communication: 2,
}

export function SpiritScoreModal({
  open,
  onClose,
  game,
  currentUserId,
  isAdmin,
  scores,
}: SpiritScoreModalProps) {
  const [evaluatedTeam, setEvaluatedTeam] = useState<Team | null>(null)
  const [categoryScores, setCategoryScores] = useState<Scores>(defaultScores)
  const [error, setError] = useState('')
  const createSpiritScore = useCreateSpiritScore()
  const updateSpiritScore = useUpdateSpiritScore()

  const teamOptions = useMemo(() => {
    if (!game) return []
    return [game.team_a, game.team_b]
  }, [game])

  const currentScore = scores.find((score) => {
    if (score.evaluated_team_id !== evaluatedTeam?.id) return false
    return isAdmin || score.created_by === currentUserId
  })
  const locked = !!currentScore && !isAdmin

  useEffect(() => {
    if (!open || !game) return
    setEvaluatedTeam(game.team_b)
    setCategoryScores(defaultScores)
    setError('')
  }, [open, game])

  const handleTeamChange = (team: Team | null) => {
    setEvaluatedTeam(team)
    setError('')
  }

  useEffect(() => {
    if (!currentScore) {
      setCategoryScores(defaultScores)
      return
    }

    setCategoryScores({
      rules_knowledge: currentScore.rules_knowledge,
      fouls_contact: currentScore.fouls_contact,
      fairness: currentScore.fairness,
      positive_attitude: currentScore.positive_attitude,
      communication: currentScore.communication,
    })
  }, [currentScore])

  if (!game) return null

  const total = Object.values(categoryScores).reduce((sum, value) => sum + value, 0)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!evaluatedTeam) {
      setError('Selecione o time avaliado.')
      return
    }

    setError('')
    try {
      if (currentScore) {
        if (!isAdmin) {
          setError('Esta pontuação de espírito ja foi salva. Apenas admins podem corrigir.')
          return
        }
        await updateSpiritScore.mutateAsync({
          id: currentScore.id,
          game_id: game.id,
          ...categoryScores,
        })
      } else {
        await createSpiritScore.mutateAsync({
          game_id: game.id,
          evaluated_team_id: evaluatedTeam.id,
          created_by: currentUserId,
          ...categoryScores,
        })
      }
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar pontuação.'
      setError(
        message.includes('duplicate key') ||
          message.includes('spirit_scores_game_id_evaluated_team_id_created_by_key') ||
          message.includes('Pontuacao de espirito ja cadastrada')
          ? 'Esta pontuação de espírito ja foi salva. Apenas admins podem corrigir.'
          : message
      )
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Espírito de jogo" className="sm:max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {currentScore && (
          <div className={`rounded-xl border p-3 text-sm ${
            locked
              ? 'bg-amber-50 border-amber-100 text-amber-800'
              : 'bg-cobalt-50 border-cobalt-100 text-cobalt-800'
          }`}>
            {locked
              ? 'Pontuação ja salva para este time. Apenas admins podem corrigir.'
              : 'Pontuação ja salva. Como admin, voce pode corrigir a selecao.'}
          </div>
        )}

        <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 space-y-3 text-sm text-gray-700">
          <div>
            <h3 className="font-black text-gray-900">PLANILHA DE PONTUAÇÃO DE ESPÍRITO DE JOGO</h3>
            <p className="mt-1">
              Toda equipe deve se envolver para pontuar o time adversário. Avalie cada uma das cinco
              categorias e some os pontos para gerar a nota de Espírito de Jogo da outra equipe. A
              maioria dos resultados ficará entre 8 a 13 pontos. Um “10” é uma boa pontuação média.
            </p>
          </div>

          <div>
            <div className="font-bold text-gray-900">Somatório dos resultados</div>
            <p>
              Some a pontuação de cada categoria para obter o resultado final e o anote ao lado (o
              resultado final deve ser entre 0 e 20).
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Time avaliado</label>
          <SearchableSelect
            options={teamOptions}
            value={evaluatedTeam}
            onChange={handleTeamChange}
            getLabel={(team) => team.name}
            getValue={(team) => team.id}
            placeholder="Selecionar time..."
            disabled={locked}
          />
        </div>

        <div className="space-y-3">
          {categories.map((category) => (
            <div key={category.key} className="rounded-xl border border-gray-100 p-3 space-y-2">
              <div>
                <div className="text-sm font-bold text-gray-900">{category.title}</div>
                <p className="text-xs text-gray-500 mt-1">{category.description}</p>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[0, 1, 2, 3, 4].map((note) => (
                  <button
                    key={note}
                    type="button"
                    onClick={() => setCategoryScores((current) => ({ ...current, [category.key]: note }))}
                    disabled={locked}
                    className={`h-10 rounded-xl text-sm font-black border transition-colors ${
                      categoryScores[category.key] === note
                        ? 'bg-cobalt-700 text-white border-cobalt-700'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-cobalt-300'
                    }`}
                  >
                    {note}
                  </button>
                ))}
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                <div className="text-xs font-black text-gray-800">
                  {category.notes[categoryScores[category.key]].label}
                </div>
                <ul className="mt-2 space-y-1 text-xs text-gray-600 list-disc pl-4">
                  {category.notes[categoryScores[category.key]].examples.map((example) => (
                    <li key={example}>{example}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-bold">Resultado final</span>
          <span className="text-2xl font-black">{total}/20</span>
        </div>

        {scores.length > 0 && (
          <div className="rounded-xl border border-gray-100 p-3">
            <div className="text-sm font-bold text-gray-900 mb-2">Pontuações visíveis para você</div>
            <div className="space-y-1">
              {scores.map((score) => (
                <div key={score.id} className="flex items-center justify-between text-sm text-gray-600">
                  <span>{score.evaluated_team.name}</span>
                  <span className="font-black text-gray-900">{score.total_score}/20</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <ErrorMessage message={error} />

        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            {locked ? 'Fechar' : 'Cancelar'}
          </Button>
          {!locked && (
            <Button
              type="submit"
              loading={createSpiritScore.isPending || updateSpiritScore.isPending}
              className="flex-1"
            >
              {currentScore ? 'Salvar correção' : 'Salvar pontuação'}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  )
}
