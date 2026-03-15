interface ErrorMessageProps {
  message?: string
  className?: string
}

export function ErrorMessage({ message, className }: ErrorMessageProps) {
  if (!message) return null
  return (
    <div className={`rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700 ${className ?? ''}`}>
      {message}
    </div>
  )
}
