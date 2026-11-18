import { useId } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export interface ChartPoint {
  label: string
  value: number
}

interface ChartPanelProps {
  data: ChartPoint[]
  height?: number
  ariaLabel?: string
  className?: string
}

/**
 * ChartPanel — the analytics chart that attaches to the bottom of a
 * MetricStrip: left/right/bottom hairline, bottom corners rounded, 24px
 * padding, horizontal gridlines, y labels on the RIGHT, a 2px brand-blue
 * line over an 8% area fill, and a 2px brand-blue baseline.
 */
export default function ChartPanel({ data, height = 280, ariaLabel = 'Chart', className = '' }: ChartPanelProps) {
  const gradId = useId().replace(/[:]/g, '')

  return (
    <div
      className={`vdk-chartpanel px-2 py-4 sm:px-6 sm:py-6 ${className}`}
      style={{ height }}
      role="img"
      aria-label={ariaLabel}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--studio-accent)" stopOpacity={0.08} />
              <stop offset="100%" stopColor="var(--studio-accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--studio-border)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: 'var(--studio-accent)', strokeWidth: 2 }}
            tick={{ fontSize: 12, fill: 'var(--studio-text-muted)' }}
            dy={6}
            minTickGap={40}
          />
          <YAxis
            orientation="right"
            tickLine={false}
            axisLine={false}
            width={44}
            tick={{ fontSize: 12, fill: 'var(--studio-text-muted)' }}
          />
          <Tooltip
            cursor={{ stroke: 'var(--studio-border)' }}
            contentStyle={{
              background: 'var(--studio-surface)',
              border: 'none',
              borderRadius: 8,
              boxShadow: 'var(--studio-shadow-pop)',
              padding: '8px 12px',
              fontSize: 14,
              color: 'var(--studio-text)',
            }}
            labelStyle={{ color: 'var(--studio-text-sub)', fontSize: 12 }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--studio-accent)"
            strokeWidth={2}
            fill={`url(#${gradId})`}
            isAnimationActive={false}
            dot={false}
            activeDot={{ r: 3, fill: 'var(--studio-accent)', stroke: 'var(--studio-surface)', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
