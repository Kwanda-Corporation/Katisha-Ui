import { ReactNode, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, X, ChevronDown, Search } from 'lucide-react'

export interface AppliedFilter {
  key: string
  label: string
  onRemove: () => void
}

export interface FilterDropdown {
  key: string
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}

interface FilterChipsProps {
  /** The free-text filter input value. */
  query?: string
  onQueryChange?: (query: string) => void
  queryPlaceholder?: string
  /** Applied filters rendered as removable chips. */
  applied?: AppliedFilter[]
  /** Dropdown chips (e.g. "Published ▾", "Most relevant ▾"). */
  dropdowns?: FilterDropdown[]
  onClearAll?: () => void
  clearAllLabel?: string
  className?: string
  children?: ReactNode
}

/**
 * FilterChips — the YouTube Studio "Content" filter bar: a filter input,
 * removable applied-filter chips, dropdown chips and a "clear all" action.
 */
export default function FilterChips({
  query,
  onQueryChange,
  queryPlaceholder,
  applied = [],
  dropdowns = [],
  onClearAll,
  clearAllLabel,
  className = '',
  children,
}: FilterChipsProps) {
  const { t } = useTranslation()
  const filterLabel = queryPlaceholder ?? t('studio.filter')
  const clearLabel = clearAllLabel ?? t('studio.clearAll')
  const hasClearable = applied.length > 0 || (query ?? '') !== ''
  const [openKey, setOpenKey] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!openKey) return
    const onDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpenKey(null)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenKey(null)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [openKey])

  return (
    <div ref={rootRef} className={`flex flex-wrap items-center gap-2 ${className}`}>
      {onQueryChange && (
        <div className="relative flex h-9 min-w-[160px] flex-1 items-center rounded-full bg-[var(--studio-muted-fill)] transition-colors focus-within:bg-[var(--studio-accent-soft)] sm:flex-none">
          <Search size={15} className="absolute left-3 text-[var(--studio-text-muted)]" aria-hidden="true" />
          <input
            type="search"
            value={query ?? ''}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={filterLabel}
            aria-label={filterLabel}
            data-borderless="true"
            className="vdk-search-input h-full w-full sm:w-56 rounded-full pl-9 pr-3 text-sm text-[var(--studio-text)] placeholder:text-[var(--studio-text-muted)]"
          />
        </div>
      )}

      {applied.map((f) => (
        <span
          key={f.key}
          className="inline-flex min-w-0 max-w-full items-center gap-1.5 h-9 pl-3.5 pr-2 text-sm rounded-full bg-[var(--studio-accent-soft)] text-[var(--studio-text)]"
        >
          <span className="truncate">{f.label}</span>
          <button
            type="button"
            onClick={f.onRemove}
            aria-label={t('studio.removeFilter', { label: f.label })}
            className="p-0.5 shrink-0 rounded-full hover:bg-black/5 cursor-pointer"
          >
            <X size={13} />
          </button>
        </span>
      ))}

      {dropdowns.map((d) => {
        const selected = d.options.find((o) => o.value === d.value)
        const open = openKey === d.key
        return (
          <div key={d.key} className="relative">
            <button
              type="button"
              onClick={() => setOpenKey(open ? null : d.key)}
              aria-label={d.label}
              aria-haspopup="listbox"
              aria-expanded={open}
              className={`inline-flex max-w-full h-9 items-center gap-1.5 rounded-full pl-3.5 pr-2.5 text-sm font-medium transition-colors cursor-pointer ${
                open
                  ? 'bg-[var(--studio-accent-soft)] text-[var(--studio-text)]'
                  : 'bg-[var(--studio-muted-fill)] text-[var(--studio-text)] hover:bg-[var(--studio-surface-sub)]'
              }`}
            >
              <span className="truncate">{selected?.label ?? d.label}</span>
              <ChevronDown
                size={14}
                aria-hidden="true"
                className={`shrink-0 text-[var(--studio-text-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
              />
            </button>
            {open && (
              <div
                role="listbox"
                aria-label={d.label}
                className="absolute left-0 top-[calc(100%+8px)] z-[970] min-w-[190px] max-w-[calc(100vw-32px)] rounded-2xl bg-[var(--studio-surface)] p-1.5 shadow-[var(--studio-shadow-pop)] ring-1 ring-[var(--studio-border)]"
              >
                {d.options.map((o) => {
                  const isSelected = o.value === d.value
                  return (
                    <button
                      key={o.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        d.onChange(o.value)
                        setOpenKey(null)
                      }}
                      className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--studio-accent-soft)] text-[var(--studio-text)]'
                          : 'text-[var(--studio-text)] hover:bg-[var(--studio-muted-fill)]'
                      }`}
                    >
                      {o.label}
                      {isSelected && <Check size={14} className="text-[var(--studio-accent)]" aria-hidden="true" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {children}

      {onClearAll && hasClearable && (
        <button
          type="button"
          onClick={() => {
            setOpenKey(null)
            onClearAll()
          }}
          className="inline-flex h-9 items-center gap-1 rounded-full px-3.5 text-sm text-[var(--studio-text-sub)] transition-colors hover:bg-[var(--studio-muted-fill)] cursor-pointer"
        >
          {clearLabel} <X size={13} />
        </button>
      )}
    </div>
  )
}
