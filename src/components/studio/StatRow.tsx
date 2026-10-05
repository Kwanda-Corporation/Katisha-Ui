import { ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatRowProps {
  label: string
  value: ReactNode
  /** Optional trend: positive shows an up arrow, negative a down arrow, 0 a dash. */
  trend?: number
  /** Suffix/prefix already included in value; trendLabel is the formatted delta (e.g. "+12%"). */
  trendLabel?: string
  className?: string
}

/**
 * StatRow — a label/value row with an optional trend indicator, used inside
 * StudioCard metric cards (YouTube Studio "Summary" rows).
 */
export default function StatRow({ label, value, trend, trendLabel, className = '' }: StatRowProps) {
  const hasTrend = typeof trend === 'number'
  const TrendIcon = !hasTrend || trend === 0 ? Minus : trend > 0 ? TrendingUp : TrendingDown
  const trendColor = !hasTrend || trend === 0
    ? 'var(--studio-text-muted)'
    : trend > 0
      ? '#16A34A'
      : 'var(--error)'

  return (
    <div className={`flex items-center justify-between gap-3 py-2.5 ${className}`}>
      <span className="text-sm text-[var(--studio-text-sub)]">{label}</span>
      <span className="flex items-center gap-2 text-sm font-semibold text-[var(--studio-text)]">
        {value}
        {hasTrend && (
          <span className="inline-flex items-center gap-0.5 text-xs font-medium" style={{ color: trendColor }}>
            <TrendIcon size={13} aria-hidden="true" />
            {trendLabel ?? (trend > 0 ? `+${trend}%` : `${trend}%`)}
          </span>
        )}
      </span>
    </div>
  )
}
