import { ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import PillButton from './PillButton'

/* ── Layout ─────────────────────────────────────────────────────────────── */

export function DashboardGrid({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`vdk-dash-grid ${className}`}>{children}</div>
}

export function DashboardCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`vdk-card ${className}`}>{children}</div>
}

export function SkeletonBar({ width, height = 14 }: { width: number | string; height?: number }) {
  return <span className="vdk-skel" style={{ width, height }} aria-hidden="true" />
}

/** Card-level loading placeholder (grey shimmer bars). */
export function CardSkeleton() {
  return (
    <div className="vdk-card" aria-busy="true">
      <SkeletonBar width={120} height={18} />
      <div className="mt-6 space-y-3">
        <SkeletonBar width="100%" height={14} />
        <SkeletonBar width="80%" height={14} />
        <SkeletonBar width="90%" height={14} />
      </div>
    </div>
  )
}

/** Card-level error placeholder with a retry action. */
export function CardError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="vdk-card items-center justify-center text-center gap-4">
      <p className="text-sm text-[var(--studio-text-sub)] max-w-[280px]">{message}</p>
      {onRetry && (
        <PillButton variant="soft" size="md" onClick={onRetry}>
          {t('studio.tryAgain')}
        </PillButton>
      )}
    </div>
  )
}

/* ── Card 1 — primary action ────────────────────────────────────────────── */

interface PrimaryActionCardProps {
  /** Empty mode: illustration (160px), message, primary call-to-action. */
  illustration?: ReactNode
  message?: string
  actionLabel?: string
  onAction?: () => void
  /** Data mode: title + content + a bottom soft pill. */
  title?: string
  children?: ReactNode
  footerLabel?: string
  onFooter?: () => void
}

export function PrimaryActionCard({
  illustration,
  message,
  actionLabel,
  onAction,
  title,
  children,
  footerLabel,
  onFooter,
}: PrimaryActionCardProps) {
  const hasData = Boolean(title)

  if (hasData) {
    return (
      <div className="vdk-card">
        <h2 className="text-lg font-semibold leading-6 text-[var(--studio-text)]">{title}</h2>
        <div className="mt-4 flex-1 min-h-0 overflow-y-auto">{children}</div>
        {footerLabel && (
          <div className="mt-4">
            <PillButton variant="soft" size="md" onClick={onFooter}>
              {footerLabel}
            </PillButton>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="vdk-card">
      <div
        className="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl p-6 text-center"
        style={{ border: '1px dashed var(--studio-border)' }}
      >
        {illustration}
        {message && (
          <p className="text-sm leading-5 text-[var(--studio-text-sub)] max-w-[280px]">{message}</p>
        )}
        {actionLabel && (
          <PillButton size="md" onClick={onAction}>
            {actionLabel}
          </PillButton>
        )}
      </div>
    </div>
  )
}

/* ── Card 2 — analytics summary ─────────────────────────────────────────── */

interface AnalyticsRow {
  label: string
  value: string
  trend?: 'up' | 'down' | 'flat'
}

interface AnalyticsCardProps {
  label?: string
  value?: string | number
  summaryLabel?: string
  summaryPeriod?: string
  rows?: AnalyticsRow[]
  topRoutesLabel?: string
  topRoutesCaption?: string
  routes?: Array<{ name: string; value: string }>
  footerLabel?: string
  onFooter?: () => void
}

function Trend({ trend }: { trend: AnalyticsRow['trend'] }) {
  if (trend === 'up') return <ArrowUpRight size={14} className="text-[var(--tone-success-dot)]" aria-hidden="true" />
  if (trend === 'down') return <ArrowDownRight size={14} className="text-[var(--tone-danger-dot)]" aria-hidden="true" />
  return <span className="text-xs text-[var(--studio-text-muted)]">—</span>
}

export function AnalyticsCard({
  label,
  value = '—',
  summaryLabel,
  summaryPeriod,
  rows = [],
  topRoutesLabel,
  topRoutesCaption,
  routes = [],
  footerLabel,
  onFooter,
}: AnalyticsCardProps) {
  const { t } = useTranslation()
  const divider = <div className="my-4" style={{ borderTop: '1px solid var(--studio-border)' }} />

  return (
    <div className="vdk-card">
      <h2 className="text-lg font-semibold leading-6 text-[var(--studio-text)]">{t('studio.analytics')}</h2>

      {label && <div className="mt-4 text-sm text-[var(--studio-text)]">{label}</div>}
      <div className="mt-1 text-[28px] font-bold leading-9 text-[var(--studio-text)]">{value}</div>

      {divider}

      <div className="text-[15px] font-semibold text-[var(--studio-text)]">{summaryLabel || t('studio.summary')}</div>
      <div className="text-xs text-[var(--studio-text-sub)]">{summaryPeriod || t('studio.last28Days')}</div>

      <div className="mt-3">
        {rows.slice(0, 4).map((row) => (
          <div key={row.label} className="flex h-8 items-center justify-between gap-3">
            <span className="text-sm text-[var(--studio-text)] truncate">{row.label}</span>
            <span className="flex items-center gap-2 text-sm text-[var(--studio-text)] shrink-0">
              {row.value}
              <Trend trend={row.trend} />
            </span>
          </div>
        ))}
      </div>

      {divider}

      <div className="text-[15px] font-semibold text-[var(--studio-text)]">{topRoutesLabel || t('studio.topRoutes')}</div>
      <div className="text-xs text-[var(--studio-text-sub)]">{topRoutesCaption || t('studio.last48HoursBookings')}</div>
      <div className="mt-2">
        {routes.slice(0, 3).map((route) => (
          <div key={route.name} className="flex h-8 items-center justify-between gap-3">
            <span className="text-sm text-[var(--studio-text)] truncate">{route.name}</span>
            <span className="text-sm text-[var(--studio-text)] shrink-0">{route.value}</span>
          </div>
        ))}
      </div>

      {(footerLabel || onFooter) && (
        <div className="mt-auto pt-4">
          <PillButton variant="soft" size="md" onClick={onFooter}>
            {footerLabel ?? t('studio.goToReports')}
          </PillButton>
        </div>
      )}
    </div>
  )
}

/* ── Card 3 — what's new carousel ───────────────────────────────────────── */

interface WhatsNewSlide {
  title: string
  description: string
  image?: string
  icon?: ReactNode
  path?: string
}

export function WhatsNewCard({ slides, onReadMore }: { slides: WhatsNewSlide[]; onReadMore?: (path?: string) => void }) {
  const { t } = useTranslation()
  const [index, setIndex] = useState(0)
  const total = Math.max(slides.length, 1)
  const slide = slides[index]

  const go = (delta: number) => setIndex((i) => (i + delta + total) % total)

  return (
    <div className="vdk-card">
      <div className="flex items-center justify-between h-8">
        <h2 className="text-lg font-semibold leading-6 text-[var(--studio-text)]">{t('studio.whatsNew')}</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={t('studio.previous')}
            onClick={() => go(-1)}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-[var(--studio-hover)] cursor-pointer text-[var(--studio-text-sub)]"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-[13px] text-[var(--studio-text-sub)] tabular-nums">
            {index + 1} / {total}
          </span>
          <button
            type="button"
            aria-label={t('studio.next')}
            onClick={() => go(1)}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-[var(--studio-hover)] cursor-pointer text-[var(--studio-text-sub)]"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {slide && (
        <div className="mt-4 flex flex-1 flex-col">
          {slide.image ? (
            <img
              src={slide.image}
              alt=""
              className="w-full aspect-video object-cover rounded-xl"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div
              className="w-full aspect-video rounded-xl flex items-center justify-center"
              style={{ background: 'var(--studio-accent-soft)', color: 'var(--studio-accent)' }}
            >
              {slide.icon}
            </div>
          )}
          <h3 className="mt-4 text-base font-semibold leading-6 text-[var(--studio-text)] line-clamp-2">{slide.title}</h3>
          <p className="mt-2 text-sm leading-5 text-[var(--studio-text-sub)] line-clamp-4">{slide.description}</p>
          <div className="mt-auto pt-4">
            <PillButton variant="soft" size="md" onClick={onReadMore ? () => onReadMore(slide.path) : undefined}>{t('studio.readMore')}</PillButton>
          </div>
        </div>
      )}
    </div>
  )
}
