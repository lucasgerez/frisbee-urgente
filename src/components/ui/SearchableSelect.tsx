import { useState, useRef, useEffect } from 'react'
import { cn } from '../../lib/utils'

interface SearchableSelectProps<T> {
  options: T[]
  value: T | null
  onChange: (value: T | null) => void
  getLabel: (item: T) => string
  getValue: (item: T) => string
  placeholder?: string
  disabled?: boolean
  className?: string
  clearable?: boolean
}

export function SearchableSelect<T>({
  options,
  value,
  onChange,
  getLabel,
  getValue,
  placeholder = 'Selecione...',
  disabled = false,
  className,
  clearable = false,
}: SearchableSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = options.filter((o) =>
    getLabel(o).toLowerCase().includes(search.toLowerCase())
  )

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = () => {
    if (disabled) return
    setOpen(true)
    setSearch('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleSelect = (item: T) => {
    onChange(item)
    setOpen(false)
    setSearch('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2.5 bg-white border rounded-xl text-sm text-left transition-colors',
          open ? 'border-cobalt-600 ring-2 ring-cobalt-600/20' : 'border-gray-300 hover:border-gray-400',
          disabled && 'opacity-50 cursor-not-allowed bg-gray-50'
        )}
      >
        <span className={cn('truncate', !value && 'text-gray-400')}>
          {value ? getLabel(value) : placeholder}
        </span>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          {clearable && value && (
            <span
              onClick={handleClear}
              className="p-0.5 rounded hover:bg-gray-200 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          )}
          <svg
            className={cn('w-4 h-4 text-gray-400 transition-transform', open && 'rotate-180')}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="w-full px-2 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-cobalt-600"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-sm text-gray-400 text-center">
                Nenhum resultado
              </li>
            ) : (
              filtered.map((item) => {
                const isSelected = value ? getValue(value) === getValue(item) : false
                return (
                  <li key={getValue(item)}>
                    <button
                      type="button"
                      onClick={() => handleSelect(item)}
                      className={cn(
                        'w-full px-3 py-2.5 text-sm text-left hover:bg-cobalt-50 transition-colors',
                        isSelected && 'bg-cobalt-50 text-cobalt-700 font-medium'
                      )}
                    >
                      {getLabel(item)}
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
