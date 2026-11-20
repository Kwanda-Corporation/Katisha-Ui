import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Check, ChevronDown, X } from 'lucide-react'

export interface DateRange {
  from: string
  to: string
}

interface DateRangeFilterProps {
  from: string
  to: string
  onChange: (range: DateRange) => void
  /** Trigger label when no range is selected. */
  label?: string
  className?: string
}

type PresetId = 'all' | 'today' | 'yesterday' | '7d' | '30d' | 'this_month' | 'last_month'

interface Preset {
  id: PresetId
  label: string
  getRange: () => DateRange
}

const pad = (value: number) => String(value).padStart(2, '0')

function toDateInput(value: Date): string {
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
}

function shiftDays(base: Date, days: number): Date {
  const next = new Date(base.getFullYear(), base.getMonth(), base.getDate())
  next.setDate(next.getDate() + days)
  return next
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const PRESETS: Preset[] = [
  { id: 'all', label: 'All dates', getRange: () => ({ from: '', to: '' }) },
  {
    id: 'today',
    label: 'Today',
    getRange: () => {
      const day = toDateInput(new Date())
      return { from: day, to: day }
    },
  },
  {
    id: 'yesterday',
    label: 'Yesterday',
    getRange: () => {
      const day = toDateInput(shiftDays(new Date(), -1))
      return { from: day, to: day }
    },
  },
  {
    id: '7d',
    label: 'Last 7 days',
    getRange: () => ({
      from: toDateInput(shiftDays(new Date(), -6)),
      to: toDateInput(new Date()),
    }),
  },
  {
    id: '30d',
    label: 'Last 30 days',
    getRange: () => ({
      from: toDateInput(shiftDays(new Date(), -29)),
      to: toDateInput(new Date()),
    }),
  },
  {
    id: 'this_month',
    label: 'This month',
    getRange: () => {
      const now = new Date()
      return {
        from: toDateInput(new Date(now.getFullYear(), now.getMonth(), 1)),
        to: toDateInput(now),
      }
    },
  },
  {
    id: 'last_month',
    label: 'Last month',
    getRange: () => {
      const now = new Date()
      return {
        from: toDateInput(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        to: toDateInput(new Date(now.getFullYear(), now.getMonth(), 0)),
      }
    },
  },
]

/**
 * DateRangeFilter — a date-range pill for dashboard filter bars. Offers quick
 * presets (today, last 7/30 days, this/last month) plus a custom from/to range.
 * Dates are inclusive and use the YYYY-MM-DD format expected by the APIs.
 */
export default function DateRangeFilter({
  from,
  to,
  onChange,
  label = 'Date',
  className = '',
}: DateRangeFilterProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const active = Boolean(from || to)
  const summary = from && to
    ? from === to
      ? formatDate(from)
      : `${formatDate(from)} – ${formatDate(to)}`
    : from
      ? `From ${formatDate(from)}`
      : to
        ? `Until ${formatDate(to)}`
        : label

  const presetIsSelected = (preset: Preset) => {
    const range = preset.getRange()
    return range.from === from && range.to === to
  }

  const update = (patch: Partial<DateRange>) => {
    const next: DateRange = { from, to, ...patch }
    if (next.from && next.to && next.from > next.to) {
      // Keep a valid inclusive range — moving one end past the other drags it.
      if (patch.from !== undefined) next.to = next.from
      else next.from = next.to
    }
    onChange(next)
  }

  return (
    <div ref={rootRef} className={`relative inline-flex shrink-0 ${className}`}>
      <div
        className={`inline-flex h-9 items-center rounded-full transition-colors ${
          open
            ? 'bg-[var(--studio-accent-soft)]'
            : active
              ? 'bg-[var(--studio-accent-soft)]'
              : 'bg-[var(--studio-muted-fill)] hover:bg-[var(--studio-surface-sub)]'
        }`}
      >
        <button
          type="button"
          aria-label={active ? `Date filter: ${summary}` : 'Filter by date'}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-full max-w-[260px] items-center gap-1.5 rounded-full pl-3.5 pr-1 text-sm font-medium text-[var(--studio-text)] cursor-pointer"
        >
          <CalendarDays size={15} className="shrink-0 text-[var(--studio-text-muted)]" aria-hidden="true" />
          <span className="truncate">{summary}</span>
          <ChevronDown
            size={14}
            aria-hidden="true"
            className={`shrink-0 text-[var(--studio-text-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
        {active && (
          <button
            type="button"
            onClick={() => onChange({ from: '', to: '' })}
            aria-label="Clear date filter"
            className="mr-1.5 shrink-0 rounded-full p-1 text-[var(--studio-text-sub)] transition-colors hover:bg-black/5 cursor-pointer"
          >
            <X size={13} aria-hidden="true" />
          </button>
        )}
      </div>

      {open && (
        <div
          role="dialog"
          aria-label="Filter by date"
          className="absolute left-0 top-[calc(100%+8px)] z-[970] w-[300px] max-w-[calc(100vw-32px)] rounded-2xl bg-[var(--studio-surface)] p-3 shadow-[var(--studio-shadow-pop)] ring-1 ring-[var(--studio-border)]"
        >
          <div className="grid grid-cols-2 gap-2">
            <label className="min-w-0">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--studio-text-muted)]">
                From
              </span>
              <input
                type="date"
                value={from}
                max={to || undefined}
                onChange={(event) => update({ from: event.target.value })}
                aria-label="From date"
                className="h-9 w-full rounded-lg border border-[var(--studio-border)] bg-[var(--studio-surface)] px-2 text-sm text-[var(--studio-text)] outline-none focus:border-[var(--studio-accent)]"
              />
            </label>
            <label className="min-w-0">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--studio-text-muted)]">
                To
              </span>
              <input
                type="date"
                value={to}
                min={from || undefined}
                onChange={(event) => update({ to: event.target.value })}
                aria-label="To date"
                className="h-9 w-full rounded-lg border border-[var(--studio-border)] bg-[var(--studio-surface)] px-2 text-sm text-[var(--studio-text)] outline-none focus:border-[var(--studio-accent)]"
              />
            </label>
          </div>

          <div className="mt-3 space-y-0.5 border-t border-[var(--studio-border)] pt-2">
            {PRESETS.map((preset) => {
              const selected = presetIsSelected(preset)
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    onChange(preset.getRange())
                    setOpen(false)
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors cursor-pointer ${
                    selected
                      ? 'bg-[var(--studio-accent-soft)] text-[var(--studio-text)]'
                      : 'text-[var(--studio-text)] hover:bg-[var(--studio-muted-fill)]'
                  }`}
                >
                  {preset.label}
                  {selected && <Check size={14} className="shrink-0 text-[var(--studio-accent)]" aria-hidden="true" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
