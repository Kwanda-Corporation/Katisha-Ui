import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface StatRow {
  label: string
  value: string | number
}

interface StatCardProps {
  label?: string
  value?: string | number
  sub?: string
  icon?: ReactNode
  rows?: StatRow[]
  trend?: { value: string; positive?: boolean }
  loading?: boolean
  accent?: string
  pulse?: boolean
  delay?: number
  variant?: 'default' | 'blue' | 'dark'
}

const ACCENT_MAP = {
  default: { bg: 'bg-white', border: 'border-zinc-200', label: 'text-zinc-600', value: 'text-zinc-900', sub: 'text-zinc-500', iconBg: 'var(--fill-hover)', iconColor: 'var(--studio-accent)' },
  blue: { bg: 'bg-blue-600', border: 'border-blue-600', label: 'text-blue-200', value: 'text-white', sub: 'text-blue-200', iconBg: 'rgba(255,255,255,0.15)', iconColor: '#FFFFFF' },
  dark: { bg: 'bg-zinc-100', border: 'border-zinc-100', label: 'text-zinc-900', value: 'text-black', sub: 'text-zinc-700', iconBg: 'rgba(255,255,255,0.1)', iconColor: 'var(--studio-text)' },
}

export default function StatCard({ label, value, sub, icon, rows, trend, loading, accent, pulse, delay = 0, variant = 'default' }: StatCardProps) {
  const colors = ACCENT_MAP[variant] || ACCENT_MAP.default

  return (
    <motion.div
      className={`${colors.bg} rounded-md border ${colors.border} p-5 transition-all duration-200 hover:border-[var(--studio-border)]`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay }}
    >
      {pulse && (
        <motion.div
          className="absolute right-3 top-3 w-1.5 h-1.5 rounded-full"
          style={{ background: accent || 'var(--studio-accent)' }}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {(label || icon || sub) && (
        <div className="flex items-center gap-3 mb-3">
          {icon && (
            <div
              className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
              style={{ background: colors.iconBg, color: colors.iconColor }}
            >
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1">
            {label && (
              <span className={`text-xs font-semibold uppercase tracking-wider ${colors.label}`}>{label}</span>
            )}
          </div>
        </div>
      )}

      {rows ? (
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between py-1">
              <span className={`text-sm ${colors.label}`}>{row.label}</span>
              {loading ? (
                <div className="h-5 w-16 rounded bg-white/10 animate-pulse" />
              ) : (
                <span className={`text-sm font-semibold ${colors.value}`}>{row.value}</span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div>
          {loading ? (
            <div className="h-9 w-28 rounded bg-white/10 animate-pulse mb-1" />
          ) : (
            <span className={`text-3xl font-bold tracking-tight ${colors.value}`}>{value}</span>
          )}
          {sub && (
            <p className={`text-xs mt-1 ${colors.sub}`}>{sub}</p>
          )}
          {trend && (
            <span className={`inline-flex items-center gap-1 text-xs font-medium mt-2 ${
              variant === 'default'
                ? (trend.positive ? 'text-blue-600' : 'text-red-500')
                : (trend.positive ? 'text-blue-400' : 'text-red-400')
            }`}>
              {trend.value}
            </span>
          )}
        </div>
      )}
    </motion.div>
  )
}