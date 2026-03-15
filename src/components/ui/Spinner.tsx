import { cn } from '../../lib/utils'

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin h-6 w-6 text-gold-500', className)}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8z"
      />
    </svg>
  )
}

export function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <Spinner className="h-10 w-10" />
    </div>
  )
}
