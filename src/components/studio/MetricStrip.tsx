import { useRef } from 'react'

export interface MetricItem {
  label: string
  value: string | number
  /** Optional change line, e.g. "+12%" / "-4%". */
  change?: string
  /** Tone for the change line. */
  changeTone?: 'up' | 'down' | 'neutral'
}

interface MetricStripProps {
  items: MetricItem[]
  selectedIndex?: number
  onSelect?: (index: number) => void
}

/**
 * MetricStrip — Reports analytics KPI strip: exactly three equal 96px cells
 * split by 1px vertical dividers. The selected cell is white with no bottom
 * border (it opens into the chart panel); unselected cells are #f2f2f2 with a
 * 1px bottom border. Cells are keyboard-operable tabs.
 */
export default function MetricStrip({ items, selectedIndex = 0, onSelect }: MetricStripProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([])
  const interactive = Boolean(onSelect)

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (!interactive) return
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      const next = (index + 1) % items.length
      onSelect?.(next)
      refs.current[next]?.focus()
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = (index - 1 + items.length) % items.length
      onSelect?.(prev)
      refs.current[prev]?.focus()
    }
  }

  return (
    <div className="vdk-strip flex w-full min-w-0" role="tablist">
      {items.map((item, index) => {
        const active = selectedIndex === index
        return (
          <button
            key={item.label + index}
            ref={(el) => { refs.current[index] = el }}
            type="button"
            role={interactive ? 'tab' : undefined}
            aria-selected={interactive ? active : undefined}
            tabIndex={interactive ? (active ? 0 : -1) : undefined}
            onClick={interactive ? () => onSelect?.(index) : undefined}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={`vdk-kpi-cell vdk-focus relative flex h-20 min-w-0 flex-1 flex-col items-center justify-center px-1 sm:h-24 sm:px-2 ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
            style={{
              background: active ? 'var(--studio-surface)' : 'var(--studio-surface-sub)',
              borderRight: index < items.length - 1 ? '1px solid var(--studio-border)' : undefined,
              borderBottom: active ? 'none' : '1px solid var(--studio-border)',
            }}
          >
            <span className="max-w-full truncate px-0.5 text-[11px] leading-4 text-[var(--studio-text-sub)] sm:text-[13px] sm:leading-5" style={{ marginTop: 8 }}>
              {item.label}
            </span>
            <span className="mt-0.5 max-w-full truncate text-[19px] font-bold leading-6 text-[var(--studio-text)] sm:text-[28px] sm:leading-9">
              {item.value}
            </span>
            {item.change && (
              <span
                className="mt-0.5 max-w-full truncate text-[10px] sm:text-xs"
                style={{
                  color:
                    item.changeTone === 'up'
                      ? 'var(--tone-success-ink)'
                      : item.changeTone === 'down'
                        ? 'var(--tone-danger-ink)'
                        : 'var(--studio-text-sub)',
                }}
              >
                {item.change}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
