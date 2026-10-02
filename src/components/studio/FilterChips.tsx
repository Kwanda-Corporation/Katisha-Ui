import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Filter, X, ChevronDown } from 'lucide-react'

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
  queryPlaceholder = 'Filter',
  applied = [],
  dropdowns = [],
  onClearAll,
  clearAllLabel = 'Clear all',
  className = '',
  children,
}: FilterChipsProps) {
  const { t } = useTranslation()
  const hasClearable = applied.length > 0 || (query ?? '') !== ''

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {onQueryChange && (
        <div className="relative">
          <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--studio-text-muted)]" aria-hidden="true" />
          <input
            type="search"
            value={query ?? ''}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={queryPlaceholder}
            aria-label={queryPlaceholder}
            className="h-9 pl-9 pr-3 w-44 sm:w-56 rounded-full border border-[var(--studio-border)] bg-white text-sm text-[var(--studio-text)] outline-none focus:border-[var(--studio-accent)]"
            style={{ borderRadius: 'var(--studio-radius-pill)' }}
          />
        </div>
      )}

      {applied.map((f) => (
        <span
          key={f.key}
          className="inline-flex items-center gap-1.5 h-9 pl-3 pr-2 text-sm rounded-full bg-[var(--studio-accent-soft)] text-[var(--studio-text)] border border-[var(--studio-border)]"
          style={{ borderRadius: 'var(--studio-radius-pill)' }}
        >
          {f.label}
          <button
            type="button"
            onClick={f.onRemove}
            aria-label={t('studio.removeFilter', { label: f.label })}
            className="p-0.5 rounded-full hover:bg-black/5 cursor-pointer"
          >
            <X size={13} />
          </button>
        </span>
      ))}

      {dropdowns.map((d) => (
        <label
          key={d.key}
          className="relative inline-flex items-center gap-1 h-9 pl-3 pr-2 text-sm rounded-full border border-[var(--studio-border)] bg-white text-[var(--studio-text)] cursor-pointer"
          style={{ borderRadius: 'var(--studio-radius-pill)' }}
        >
          <span className="sr-only">{d.label}</span>
          <select
            value={d.value}
            onChange={(e) => d.onChange(e.target.value)}
            aria-label={d.label}
            className="appearance-none bg-transparent border-none outline-none text-sm pr-1 cursor-pointer text-[var(--studio-text)]"
          >
            {d.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="text-[var(--studio-text-muted)]" aria-hidden="true" />
        </label>
      ))}

      {children}

      {onClearAll && hasClearable && (
        <button
          type="button"
          onClick={onClearAll}
          className="inline-flex items-center gap-1 h-9 px-3 text-sm rounded-full text-[var(--studio-text-sub)] hover:bg-[var(--studio-muted-fill)] cursor-pointer"
          style={{ borderRadius: 'var(--studio-radius-pill)' }}
        >
          {clearAllLabel} <X size={13} />
        </button>
      )}
    </div>
  )
}
