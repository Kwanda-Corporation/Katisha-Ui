import { ReactNode, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown, Filter, Search, X } from 'lucide-react'

export interface FilterOption { value: string; label: string }
export interface FilterField {
  key: string
  label: string
  icon?: ReactNode
}
export interface FilterDef {
  key: string
  label: string
  options: FilterOption[]
  value?: string
  onChange?: (value: string) => void
  icon?: ReactNode
}

interface FilterBandProps {
  /** Free-text filter value (omit to hide the field). */
  query?: string
  onQueryChange?: (query: string) => void
  queryPlaceholder?: string
  /** Filter fields — the filter icon lists these; choosing one opens its popover. */
  filters?: FilterDef[]
  /** Extra removable chips appended after applied filter chips. */
  children?: ReactNode
  onClearAll?: () => void
  clearAllLabel?: string
  /** Whether the clear-all affordance is shown. */
  hasClearable?: boolean
  className?: string
}

/**
 * FilterBand �?" full-bleed 48px filter band: a borderless filter pill,
 * removable chips, then a borderless search field that fills the band.
 */
export default function FilterBand({
  query,
  onQueryChange,
  queryPlaceholder,
  filters = [],
  children,
  onClearAll,
  clearAllLabel,
  hasClearable = true,
  className = '',
}: FilterBandProps) {
  const { t } = useTranslation()
  const filterLabel = queryPlaceholder ?? t('studio.searchOrFilter')
  const clearLabel = clearAllLabel ?? t('studio.clearAll')

  const [menuOpen, setMenuOpen] = useState(false)
  const [openKey, setOpenKey] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen && !openKey) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
        setOpenKey(null)
      }
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setMenuOpen(false); setOpenKey(null) } }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen, openKey])

  const openFilter = filters.find((f) => f.key === openKey)
  const applied = filters.filter((f) => f.value !== undefined && f.value !== '' && f.value != null)
  const optionLabel = (f: FilterDef) => f.options.find((o) => o.value === f.value)?.label ?? f.value

  return (
    <div
      ref={rootRef}
      className={`vdk-band relative flex flex-wrap items-center gap-2 gap-y-1.5 min-h-12 py-2 pl-4 pr-4 md:pl-6 md:pr-6 xl:pl-8 xl:pr-8 ${className}`}
    >
      {filters.length > 0 && (
        <div className="relative shrink-0">
          <button
            type="button"
            aria-label={t('studio.filter')}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => { setMenuOpen((v) => !v); setOpenKey(null) }}
            className={`inline-flex h-9 items-center gap-2 rounded-full pl-3.5 pr-2.5 text-sm font-medium transition-colors cursor-pointer ${
              menuOpen
                ? 'bg-[var(--studio-accent-soft)] text-[var(--studio-text)]'
                : 'bg-[var(--studio-muted-fill)] text-[var(--studio-text-sub)] hover:bg-[var(--studio-surface-sub)] hover:text-[var(--studio-text)]'
            }`}
          >
            <Filter size={16} />
            <span>{t('studio.filter')}</span>
            {applied.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--studio-accent)] px-1.5 text-[11px] font-semibold text-white">
                {applied.length}
              </span>
            )}
            <ChevronDown
              size={14}
              aria-hidden="true"
              className={`text-[var(--studio-text-muted)] transition-transform ${menuOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute left-0 top-[calc(100%+8px)] z-[970] min-w-[210px] rounded-2xl bg-[var(--studio-surface)] p-1.5 shadow-[var(--studio-shadow-pop)] ring-1 ring-[var(--studio-border)]"
            >
              {filters.map((f) => (
                <button
                  key={f.key}
                  role="menuitem"
                  type="button"
                  onClick={() => { setOpenKey(f.key); setMenuOpen(false) }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-[var(--studio-text)] transition-colors hover:bg-[var(--studio-muted-fill)] cursor-pointer"
                >
                  {f.icon}
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {applied.map((f) => (
        <FilterToken key={f.key} label={`${f.label}: ${optionLabel(f)}`} onRemove={() => f.onChange?.('')} />
      ))}

      {children}

      {onQueryChange && (
        <div className="flex h-9 min-w-[150px] flex-1 items-center gap-2 rounded-full px-1 transition-colors focus-within:bg-[var(--studio-muted-fill)]">
          <Search size={16} className="shrink-0 text-[var(--studio-text-muted)]" aria-hidden="true" />
          <input
            type="search"
            value={query ?? ''}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={filterLabel}
            aria-label={filterLabel}
            data-borderless="true"
            className="vdk-search-input h-full min-w-0 flex-1 text-sm text-[var(--studio-text)] placeholder:text-[var(--studio-text-muted)]"
          />
        </div>
      )}

      {onClearAll && hasClearable && (applied.length > 0 || Boolean(query)) && (
        <button
          type="button"
          onClick={() => { setOpenKey(null); onClearAll() }}
          aria-label={clearLabel}
          className="ml-auto shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-[var(--studio-text-sub)] hover:bg-[var(--studio-hover)] cursor-pointer"
        >
          <X size={20} />
        </button>
      )}

      {openFilter && (
        <div className="absolute left-4 top-[calc(100%+6px)] z-[970] min-w-[220px] rounded-2xl bg-[var(--studio-surface)] p-1.5 shadow-[var(--studio-shadow-pop)] ring-1 ring-[var(--studio-border)] md:left-6 xl:left-8">
          {openFilter.options.map((opt) => {
            const selected = openFilter.value === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { openFilter.onChange?.(opt.value); setOpenKey(null) }}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors cursor-pointer ${
                  selected
                    ? 'bg-[var(--studio-accent-soft)] text-[var(--studio-text)]'
                    : 'text-[var(--studio-text)] hover:bg-[var(--studio-muted-fill)]'
                }`}
              >
                {opt.label}
                {selected && <Check size={15} className="text-[var(--studio-accent)]" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Clickable dropdown-chip trigger (search modal scope row). */
export function FilterChip({
  label,
  active = false,
  count,
}: {
  label: string
  active?: boolean
  count?: number
}) {
  return (
    <span
      className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium cursor-pointer transition-colors ${
        active ? 'bg-[var(--studio-accent-soft)] text-[var(--studio-text)]' : 'bg-[var(--studio-muted-fill)] text-[var(--studio-text)]'
      }`}
    >
      {label}
      {typeof count === 'number' && <span className="text-[var(--studio-text-muted)] font-normal">{count}</span>}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-[var(--studio-text-muted)]">
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

/** Removable applied-filter chip. */
export function FilterToken({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex h-9 min-w-0 max-w-full shrink items-center gap-1.5 rounded-full bg-[var(--studio-accent-soft)] pl-3.5 pr-2 text-sm font-medium text-[var(--studio-text)]">
      <span className="truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={label}
        className="p-0.5 shrink-0 rounded-full transition-colors hover:bg-black/10 cursor-pointer"
      >
        <X size={14} />
      </button>
    </span>
  )
}
