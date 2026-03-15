import { useState, useRef, useEffect } from 'react'
import { cn } from '../../lib/utils'

interface MultiSearchableSelectProps<T> {
  options: T[]
  value: T[]
  onChange: (value: T[]) => void
  getLabel: (item: T) => string
  getValue: (item: T) => string
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function MultiSearchableSelect<T>({
  options,
  value,
  onChange,
  getLabel,
  getValue,
  placeholder = 'Selecione...',
  disabled = false,
  className,
}: MultiSearchableSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedIds = new Set(value.map(getValue))

  const filtered = options.filter((o) =>
    getLabel(o).toLowerCase().includes(search.toLowerCase())
  )

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

  const handleToggle = (item: T) => {
    const id = getValue(item)
    if (selectedIds.has(id)) {
      onChange(value.filter((v) => getValue(v) !== id))
    } else {
      onChange([...value, item])
    }
  }

  const handleRemove = (item: T, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(value.filter((v) => getValue(v) !== getValue(item)))
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Selected badges */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {value.map((item) => (
            <span
              key={getValue(item)}
              className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-cobalt-50 text-cobalt-700 text-xs font-medium rounded-full border border-cobalt-200"
            >
              {getLabel(item)}
              <button
                type="button"
                onClick={(e) => handleRemove(item, e)}
                className="hover:bg-cobalt-200 rounded-full p-0.5 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => {
          if (disabled) return
          setOpen(!open)
          setTimeout(() => inputRef.current?.focus(), 50)
        }}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2.5 bg-white border rounded-xl text-sm text-left transition-colors',
          open ? 'border-cobalt-600 ring-2 ring-cobalt-600/20' : 'border-gray-300 hover:border-gray-400',
          disabled && 'opacity-50 cursor-not-allowed bg-gray-50'
        )}
      >
        <span className="text-gray-400">
          {value.length === 0
            ? placeholder
            : `${value.length} time${value.length !== 1 ? 's' : ''} selecionado${value.length !== 1 ? 's' : ''}`}
        </span>
        <svg
          className={cn('w-4 h-4 text-gray-400 transition-transform shrink-0', open && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
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
              placeholder="Buscar time..."
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
                const isSelected = selectedIds.has(getValue(item))
                return (
                  <li key={getValue(item)}>
                    <button
                      type="button"
                      onClick={() => handleToggle(item)}
                      className={cn(
                        'w-full px-3 py-2.5 text-sm text-left flex items-center gap-2 hover:bg-cobalt-50 transition-colors',
                        isSelected && 'bg-cobalt-50'
                      )}
                    >
                      <span
                        className={cn(
                          'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                          isSelected
                            ? 'bg-cobalt-600 border-cobalt-600'
                            : 'border-gray-300'
                        )}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span className={isSelected ? 'text-cobalt-700 font-medium' : 'text-gray-700'}>
                        {getLabel(item)}
                      </span>
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
