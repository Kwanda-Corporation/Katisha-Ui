import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Ticket, RefreshCw, Download, MapPin, FileText, UserPlus,
  Banknote, CheckCircle2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { api } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { viaLabel } from '../../utils/via'
import {
  PageHeader, DashboardGrid, PrimaryActionCard, AnalyticsCard, WhatsNewCard,
  IconButton, PillButton, DataTable, EmptyState, StatusBadge,
} from '../../components/studio'
import type { Column } from '../../components/studio'

const PAGE_SIZES = [10, 25, 50]

function parseLocalDate(iso: string): Date | null {
  if (!iso) return null
  const bare = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (bare) return new Date(Number(bare[1]), Number(bare[2]) - 1, Number(bare[3]))
  const d = new Date(iso)
  return isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function rwf(value: number): string {
  return `${Number(value || 0).toLocaleString()} RWF`
}

const NEWS_SLIDES = [
  {
    title: 'Reports are here',
    description: 'Open the Reports page to explore bookings, journeys and payments across the last 28 days.',
    icon: <FileText size={40} />,
    path: '/dashboard/reports',
  },
  {
    title: 'Track departures',
    description: 'Manage departures and schedules from one place, and see the day\u2019s trips before they leave.',
    icon: <MapPin size={40} />,
    path: '/dashboard/departures',
  },
  {
    title: 'Grow your agency',
    description: 'Add agents and assign routes so your bookings are handled faster, in a single step.',
    icon: <CheckCircle2 size={40} />,
    path: '/dashboard/agents',
  },
]

export default function OverviewPage() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [bookings, setBookings] = useState<any[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)

  const loadAnalytics = useCallback(async () => {
    try {
      const res = await api.getAgencyAnalytics()
      if (res.data) setData(res.data)
    } catch {} finally {
      setLoading(false)
    }
  }, [])

  const loadBookings = useCallback(async () => {
    setBookingsLoading(true)
    try {
      const res = await api.getAgencyBookings({ page: String(page), limit: String(pageSize) })
      if (res.data) {
        setBookings(res.data.bookings || [])
        setTotalPages(res.data.pages || 1)
      }
    } catch {} finally {
      setBookingsLoading(false)
    }
  }, [page, pageSize])

  const refreshAll = useCallback(() => {
    loadAnalytics()
    loadBookings()
  }, [loadAnalytics, loadBookings])

  useEffect(() => { refreshAll() }, [refreshAll])
  useEffect(() => { setPage(1) }, [pageSize])

  const overview = data?.overview || {}
  const topRoutes = data?.topRoutes || []

  const dayBookings = overview.dayBookings ?? 0
  const weekBookings = overview.weekBookings ?? 0
  const monthBookings = overview.monthBookings ?? 0
  const totalBookingsCount = overview.totalBookings ?? 0
  const completedBookings = overview.completedBookings ?? 0

  const completionRate = totalBookingsCount > 0
    ? Math.round((completedBookings / totalBookingsCount) * 100)
    : 0

  const greetingKey = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'greetingMorning'
    if (h < 17) return 'greetingAfternoon'
    return 'greetingEvening'
  })()

  const firstName = user?.name?.split(' ')[0] || t('dashboard.ops.adminFallback')

  const statusLabel = (status: string): string => {
    const key = (status || '').toLowerCase()
    return t(`dashboard.ops.status.${key}`, { defaultValue: status || '—' })
  }

  const columns: Column<any>[] = useMemo(() => [
    {
      key: 'referenceCode',
      header: t('dashboard.ops.ref'),
      render: (b) => <span className="font-mono text-xs font-semibold text-[var(--studio-accent)]">{b.referenceCode}</span>,
    },
    {
      key: 'passenger',
      header: t('dashboard.ops.passenger'),
      render: (b) => b.user?.name || b.passengerDetails?.[0]?.name || b.guestName || t('dashboard.ops.guest'),
    },
    {
      key: 'route',
      header: t('dashboard.ops.route'),
      render: (b) => (
        <span className="text-[var(--studio-text-sub)]">
          {b.pickupPoint ? `${b.origin} → ${b.pickupPoint} → ${b.destination}` : `${b.origin} → ${b.destination}`}
          {viaLabel(b.route?.via)}
        </span>
      ),
    },
    {
      key: 'travelDate',
      header: t('dashboard.ops.date'),
      render: (b) => (
        <span className="text-[var(--studio-text-sub)]">{parseLocalDate(b.travelDate)?.toLocaleDateString() || '—'}</span>
      ),
    },
    { key: 'seats', header: t('dashboard.ops.passengers'), align: 'center' },
    {
      key: 'amount',
      header: t('dashboard.ops.amount'),
      align: 'right',
      render: (b) => <span className="font-semibold">{rwf((b.totalAmount || 0) + (b.systemFee || 0))}</span>,
    },
    {
      key: 'status',
      header: t('dashboard.ops.bookingStatus'),
      render: (b) => <StatusBadge status={b.status}>{statusLabel(b.status)}</StatusBadge>,
    },
  ], [t])

  const actions = [
    { Icon: MapPin, label: t('nav.departures'), path: '/dashboard/departures' },
    { Icon: FileText, label: t('nav.reports'), path: '/dashboard/reports' },
    { Icon: UserPlus, label: t('nav.agents'), path: '/dashboard/agents' },
    { Icon: Banknote, label: t('nav.settings'), path: '/dashboard/agency-settings' },
  ]

  const summaryRows = [
    { label: t('dashboard.ops.bookingsToday'), value: loading ? '…' : dayBookings.toLocaleString() },
    { label: t('dashboard.ops.thisWeek'), value: loading ? '…' : weekBookings.toLocaleString() },
    { label: t('dashboard.ops.thisMonth'), value: loading ? '…' : monthBookings.toLocaleString() },
    { label: t('dashboard.ops.completion'), value: loading ? '…' : `${completionRate}%` },
  ]

  const routes = (topRoutes || []).slice(0, 3).map((r: any) => ({
    name: r.pickupPoint ? `${r.origin} → ${r.pickupPoint} → ${r.destination}` : `${r.origin} → ${r.destination}`,
    value: String(r.count ?? '—'),
  }))

  return (
    <div>
      <PageHeader
        title={t(`dashboard.ops.${greetingKey}`, { name: firstName })}
        actions={
          <>
            <PillButton variant="outlined" size="md" icon={<Download size={16} />} onClick={() => navigate('/dashboard/reports')}>
              {t('dashboard.ops.exportReport')}
            </PillButton>
            <IconButton
              variant="outlined"
              label={t('dashboard.ops.refresh')}
              icon={<RefreshCw size={18} className={loading ? 'animate-spin' : ''} />}
              onClick={refreshAll}
            />
          </>
        }
      />

      <DashboardGrid className="mt-6 pb-8">
        <PrimaryActionCard title={t('dashboard.ops.quickActions', { defaultValue: 'Quick actions' })}>
          <div className="flex flex-col gap-1">
            {actions.map((a) => (
              <button
                key={a.path}
                type="button"
                onClick={() => navigate(a.path)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[var(--studio-muted-fill)] cursor-pointer"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--studio-muted-fill)] text-[var(--studio-accent)]">
                  <a.Icon size={17} />
                </span>
                <span className="text-sm font-medium text-[var(--studio-text)]">{a.label}</span>
              </button>
            ))}
          </div>
        </PrimaryActionCard>

        <AnalyticsCard
          label={t('dashboard.ops.totalBookings')}
          value={loading ? '—' : totalBookingsCount.toLocaleString()}
          summaryLabel={t('dashboard.ops.todayOperations')}
          summaryPeriod={user?.agency?.name || t('dashboard.ops.systemSubtitle')}
          rows={summaryRows}
          routes={routes}
          topRoutesLabel={t('dashboard.ops.topRoutes')}
          topRoutesCaption={t('dashboard.ops.netEarnings', { defaultValue: 'Bookings per route' })}
          onFooter={() => navigate('/dashboard/reports')}
        />

        <WhatsNewCard slides={NEWS_SLIDES} onReadMore={(path) => path && navigate(path)} />
      </DashboardGrid>

      {/* Recent bookings */}
      <div className="px-4 sm:px-6 pb-10">
        <div className="vdk-panel">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Ticket size={18} className="text-[var(--studio-accent)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-[var(--studio-text)]">{t('dashboard.ops.recentBookings')}</h2>
            </div>
            <div className="inline-flex rounded-full border border-[var(--studio-border)] overflow-hidden">
              {PAGE_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setPageSize(size)}
                  className={`h-8 px-2.5 text-xs font-semibold border-none cursor-pointer transition-colors ${
                    pageSize === size
                      ? 'bg-[var(--studio-accent)] text-white'
                      : 'bg-[var(--studio-surface)] text-[var(--studio-text-sub)] hover:bg-[var(--studio-muted-fill)]'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <DataTable
            columns={columns}
            data={bookings}
            getRowId={(b) => String(b._id)}
            loading={bookingsLoading}
            emptyState={
              <EmptyState
                icon={Ticket}
                title={t('dashboard.ops.noBookingsYet')}
                cta={
                  <PillButton variant="soft" size="md" onClick={() => navigate('/dashboard/departures')}>
                    {t('nav.departures')}
                  </PillButton>
                }
              />
            }
          />

          <div className="mt-4 flex items-center justify-between">
            <span className="text-[13px] text-[var(--studio-text-sub)]">
              {t('dashboard.ops.updatedAuto', { time: new Date().toLocaleTimeString() })}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-8 min-w-[32px] px-2 inline-flex items-center justify-center text-xs font-semibold border cursor-pointer transition-colors disabled:opacity-35 disabled:cursor-default bg-[var(--studio-surface)] text-[var(--studio-text-sub)] border-[var(--studio-border)] hover:bg-[var(--studio-muted-fill)] rounded-full"
              >
                ‹
              </button>
              <span className="text-xs text-[var(--studio-text-sub)]">{page} / {Math.max(totalPages, 1)}</span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="h-8 min-w-[32px] px-2 inline-flex items-center justify-center text-xs font-semibold border cursor-pointer transition-colors disabled:opacity-35 disabled:cursor-default bg-[var(--studio-surface)] text-[var(--studio-text-sub)] border-[var(--studio-border)] hover:bg-[var(--studio-muted-fill)] rounded-full"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
