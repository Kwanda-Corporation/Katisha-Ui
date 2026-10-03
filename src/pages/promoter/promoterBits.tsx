import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { TONE_CLASS, type Tone, statusKey } from './promoterUi'

/**
 * StatusPill renders a coloured dot + localized status label. Unknown states
 * fall back to a neutral pill so a new server-side status never breaks a table.
 */
export function StatusPill({ status, tone }: { status?: string | null; tone?: Record<string, Tone> }) {
  const { t } = useTranslation()
  const key = String(status || '').toLowerCase()
  const meta = TONE_CLASS[(tone?.[key] ?? 'grey') as Tone]
  const label = t(statusKey(status), { defaultValue: key ? key : '—' })

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${meta.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
      {label}
    </span>
  )
}

/** Small metric card used across the promoter sub-pages. */
export function MetricCard({
  label,
  value,
  icon,
  hint,
}: {
  label: string
  value: ReactNode
  icon?: ReactNode
  hint?: ReactNode
}) {
  return (
    <div className="bg-[var(--studio-surface)] border border-[var(--studio-card-border)] rounded-2xl p-4" style={{ borderRadius: 'var(--studio-radius-card)' }}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--studio-text-sub)]">{label}</span>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-semibold text-[var(--studio-text)]">{value}</p>
      {hint && <p className="mt-1 text-xs text-[var(--studio-text-muted)]">{hint}</p>}
    </div>
  )
}

/** Inline error card shared by the promoter tables. */
export function ErrorNote({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
      <p className="text-sm text-red-700">{message}</p>
    </div>
  )
}
