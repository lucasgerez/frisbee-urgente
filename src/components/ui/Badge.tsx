import { cn } from '../../lib/utils'
import type { GameStatus, Gender } from '../../types/database'

interface BadgeProps {
  children: React.ReactNode
  className?: string
  variant?: 'gender' | 'status' | 'default'
  gender?: Gender
  status?: GameStatus
}

const statusLabels: Record<GameStatus, string> = {
  pending: 'Aguardando',
  in_progress: 'Em andamento',
  paused: 'Pausado',
  finished: 'Encerrado',
}

const statusColors: Record<GameStatus, string> = {
  pending: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  finished: 'bg-gray-200 text-gray-500',
}

const genderColors: Record<Gender, string> = {
  Masculino: 'bg-blue-100 text-blue-700',
  Feminino: 'bg-pink-100 text-pink-700',
}

export function Badge({ children, className, variant, gender, status }: BadgeProps) {
  let colorClass = 'bg-gray-100 text-gray-700'

  if (variant === 'gender' && gender) {
    colorClass = genderColors[gender]
    children = gender === 'Masculino' ? 'M' : 'F'
  } else if (variant === 'status' && status) {
    colorClass = statusColors[status]
    children = statusLabels[status]
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        colorClass,
        className
      )}
    >
      {children}
    </span>
  )
}

export function GameStatusBadge({ status }: { status: GameStatus }) {
  return <Badge variant="status" status={status}>{status}</Badge>
}

export function GenderBadge({ gender }: { gender: Gender }) {
  return <Badge variant="gender" gender={gender}>{gender}</Badge>
}
