import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Ticket, DollarSign, Route, RefreshCw, Download,
  XCircle, Bell, CheckCircle2, MapPin, FileText,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { api } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { viaLabel } from '../../utils/via'
import StudioCard from '../../components/studio/StudioCard'
import StudioHeading from '../../components/studio/StudioHeading'
import StatRow from '../../components/studio/StatRow'
import DataTable, { Column } from '../../components/studio/DataTable'
import StudioPagination from '../../components/studio/StudioPagination'
import EmptyState from '../../components/studio/EmptyState'

const PAGE_SIZES = [10, 25, 50]

const ACTIVITY_ICONS: Record<string, typeof Ticket> = {
  booking_created: Ticket,
  booking_confirmed: CheckCircle2,
  ticket_uploaded: Ticket,
  booking_cancelled: XCircle,
  payment_received: DollarSign,
}

const STATUS_STYLE: Record<string, string> = {
  confirmed: 'bg-[var(--studio-accent-soft)] text-[var(--studio-text)]',
  issued: 'bg-[var(--studio-accent-soft)] text-[var(--studio-text)]',
  rejected: 'bg-[var(--studio-muted-fill)] text-[var(--studio-text-sub)]',
  cancelled: 'bg-[var(--studio-muted-fill)] text-[var(--studio-text-sub)]',
  pending: 'bg-amber-50 text-amber-700',
}

const CHART_TOOLTIP = {
  borderRadius: 10,
  border: '1px solid var(--studio-border)',
  background: 'var(--studio-surface)',
  fontSize: 12,
}

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

export default function OverviewPage() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  const [bookings, setBookings] = useState<any[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalBookings, setTotalBookings] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const [notifications, setNotifications] = useState<any[]>([])

  const loadAnalytics = useCallback(async () => {
    try {
      const res = await api.getAgencyAnalytics()
      if (res.data) setData(res.data)
      setUpdatedAt(new Date())
    } catch {} finally {
      setLoading(false)
    }
  }, [])

  const loadBookings = useCallback(async () => {
    setBookingsLoading(true)
    try {
      const res = await api.getAgencyBookings({
        page: String(page),
        limit: String(pageSize),
      })
      if (res.data) {
        setBookings(res.data.bookings || [])
        setTotalBookings(res.data.total || 0)
        setTotalPages(res.data.pages || 1)
      }
    } catch {} finally {
      setBookingsLoading(false)
    }
  }, [page, pageSize])

  const loadNotifications = useCallback(async () => {
    try {
      const res = await api.getNotifications({ limit: '8' })
      if (res.data) setNotifications(res.data.notifications || res.data || [])
    } catch {}
  }, [])

  const refreshAll = useCallback(() => {
    loadAnalytics()
    loadBookings()
    loadNotifications()
  }, [loadAnalytics, loadBookings, loadNotifications])

  useEffect(() => {
    refreshAll()
    const interval = setInterval(() => {
      loadAnalytics()
      loadNotifications()
    }, 30000)
    return () => clearInterval(interval)
  }, [refreshAll, loadAnalytics, loadNotifications])

  useEffect(() => { setPage(1) }, [pageSize])

  const overview = data?.overview || {}
  const revenue = data?.revenue || {}
  const topRoutes = data?.topRoutes || []

  const dayBookings = overview.dayBookings ?? 0
  const weekBookings = overview.weekBookings ?? 0
  const monthBookings = overview.monthBookings ?? 0
  const totalBookingsCount = overview.totalBookings ?? 0
  const completedBookings = overview.completedBookings ?? 0

  const revenueTotal = revenue.total ?? 0
  const revenueNet = revenue.netRevenue ?? 0
  const revenueFees = revenue.systemFees ?? 0
  const revenueDay = revenue.dayRevenue ?? 0

  const completionRate = totalBookingsCount > 0
    ? Math.round((completedBookings / totalBookingsCount) * 100)
    : 0

  const greetingKey = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'greetingMorning'
    if (h < 17) return 'greetingAfternoon'
    return 'greetingEvening'
  })()

  const timeAgo = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return t('dashboard.ops.justNow')
    if (mins < 60) return t('dashboard.ops.minsAgo', { count: mins })
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return t('dashboard.ops.hoursAgo', { count: hrs })
    return t('dashboard.ops.daysAgo', { count: Math.floor(hrs / 24) })
  }

  const statusLabel = (status: string): string => {
    const key = (status || '').toLowerCase()
    return t(`dashboard.ops.status.${key}`, { defaultValue: status || '—' })
  }

  const latestActivity = useMemo(() => notifications.slice(0, 6), [notifications])

  const columns: Column<any>[] = useMemo(() => [
    {
      key: 'referenceCode',
      header: t('dashboard.ops.ref'),
      sortable: true,
      render: (b) => (
        <span className="font-mono text-xs font-semibold text-[var(--studio-accent)]">{b.referenceCode}</span>
      ),
    },
    {
      key: 'passenger',
      header: t('dashboard.ops.passenger'),
      sortValue: (b) => b.user?.name || b.passengerDetails?.[0]?.name || b.guestName || '',
      render: (b) => b.user?.name || b.passengerDetails?.[0]?.name || b.guestName || t('dashboard.ops.guest'),
    },
    {
      key: 'phone',
      header: t('dashboard.ops.phone'),
      render: (b) => (
        <span className="text-[var(--studio-text-sub)]">
          {b.contactPhone || b.passengerDetails?.[0]?.phone || b.guestPhone || b.user?.phone || '—'}
        </span>
      ),
    },
    { key: 'seats', header: t('dashboard.ops.passengers'), align: 'center' },
    {
      key: 'route',
      header: t('dashboard.ops.route'),
      sortValue: (b) => `${b.origin ?? ''} ${b.destination ?? ''}`,
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
      sortValue: (b) => b.travelDate || '',
      render: (b) => (
        <span className="text-[var(--studio-text-sub)]">
          {parseLocalDate(b.travelDate)?.toLocaleDateString() || '—'}
        </span>
      ),
    },
    { key: 'travelTime', header: t('dashboard.ops.time'), render: (b) => <span className="text-[var(--studio-text-sub)]">{b.travelTime}</span> },
    {
      key: 'amount',
      header: t('dashboard.ops.amount'),
      align: 'right',
      sortValue: (b) => (b.totalAmount || 0) + (b.systemFee || 0),
      render: (b) => (
        <span className="font-semibold">{rwf((b.totalAmount || 0) + (b.systemFee || 0))}</span>
      ),
    },
    {
      key: 'status',
      header: t('dashboard.ops.status'),
      render: (b) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold capitalize rounded-full ${
            STATUS_STYLE[b.status] || 'bg-[var(--studio-muted-fill)] text-[var(--studio-text-sub)]'
          }`}
          style={{ borderRadius: 'var(--studio-radius-pill)' }}
        >
          {statusLabel(b.status)}
        </span>
      ),
    },
  ], [t])

  const revenueRows = [
    { key: 'gross', label: t('dashboard.ops.grossRevenue'), value: revenueTotal, color: 'var(--studio-text)' },
    { key: 'fees', label: t('dashboard.ops.platformFees'), value: revenueFees, color: 'var(--studio-accent)' },
    { key: 'net', label: t('dashboard.ops.netEarnings'), value: revenueNet, color: '#93C5FD' },
  ]

  const sectionPill =
    'inline-flex items-center gap-2 h-9 px-3.5 text-sm font-medium border border-[var(--studio-border)] bg-[var(--studio-surface)] text-[var(--studio-text)] hover:bg-[var(--studio-muted-fill)] cursor-pointer transition-colors'

  return (
    <div className="space-y-6">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <StudioHeading as="h1" sparkles>
            {t(`dashboard.ops.${greetingKey}`, {
              name: user?.name?.split(' ')[0] || t('dashboard.ops.adminFallback'),
            })}
          </StudioHeading>
          <p className="text-sm text-[var(--studio-text-sub)] text-center">
            {user?.agency?.name
              ? t('dashboard.ops.agencySubtitle', { agency: user.agency.name })
              : t('dashboard.ops.systemSubtitle')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={refreshAll}
            className={sectionPill}
            style={{ borderRadius: 'var(--studio-radius-pill)' }}
          >
            <RefreshCw size={14} />
            {t('dashboard.ops.refresh')}
          </button>
          <Link to="/dashboard/reports" className={sectionPill} style={{ borderRadius: 'var(--studio-radius-pill)' }}>
            <Download size={14} />
            {t('dashboard.ops.exportReport')}
          </Link>
        </div>
      </div>

      <p className="text-xs text-[var(--studio-text-muted)]">
        {updatedAt
          ? t('dashboard.ops.updatedAuto', { time: updatedAt.toLocaleTimeString() })
          : t('common.loading')}
      </p>

      {/* ── Quick actions ────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: t('nav.departures'), icon: MapPin, to: '/dashboard/departures' },
          { label: t('nav.reports'), icon: FileText, to: '/dashboard/reports' },
        ].map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className={sectionPill}
            style={{ borderRadius: 'var(--studio-radius-pill)' }}
          >
            <action.icon size={15} />
            {action.label}
          </Link>
        ))}
      </div>

      {/* ── Today's operations + key metrics ─────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StudioCard padding="md" className="sm:col-span-2 xl:col-span-1">
          <StudioHeading size="card" marker={false} as="h2" centered={false}>
            {t('dashboard.ops.todayOperations')}
          </StudioHeading>
          <div className="mt-2 divide-y divide-[var(--studio-border)]">
            <StatRow
              label={t('dashboard.ops.bookingsToday')}
              value={loading ? '…' : dayBookings}
            />
            <StatRow
              label={t('dashboard.ops.todaysIncome')}
              value={loading ? '…' : rwf(revenueDay)}
            />
            <StatRow
              label={t('dashboard.ops.activeRoutes')}
              value={loading ? '…' : topRoutes.length}
            />
            <StatRow
              label={t('dashboard.ops.completion')}
              value={loading ? '…' : `${completionRate}%`}
            />
          </div>
        </StudioCard>

        <StudioCard padding="md">
          <StatRow
            label={t('dashboard.ops.totalBookings')}
            value={loading ? '…' : totalBookingsCount.toLocaleString()}
            trend={weekBookings > 0 ? 1 : undefined}
            trendLabel={weekBookings > 0 ? t('dashboard.ops.thisWeekShort', { count: weekBookings }) : undefined}
          />
        </StudioCard>

        <StudioCard padding="md">
          <StatRow
            label={t('dashboard.ops.thisWeek')}
            value={loading ? '…' : weekBookings.toLocaleString()}
            trend={dayBookings > 0 ? 1 : undefined}
            trendLabel={dayBookings > 0 ? t('dashboard.ops.todayShort', { count: dayBookings }) : undefined}
          />
        </StudioCard>

        <StudioCard padding="md">
          <StatRow
            label={t('dashboard.ops.thisMonth')}
            value={loading ? '…' : monthBookings.toLocaleString()}
          />
        </StudioCard>

        <StudioCard padding="md">
          <StatRow
            label={t('dashboard.ops.completed')}
            value={loading ? '…' : completedBookings.toLocaleString()}
            trend={completionRate > 0 ? completionRate : undefined}
            trendLabel={completionRate > 0 ? t('dashboard.ops.rateShort', { count: completionRate }) : undefined}
          />
        </StudioCard>
      </div>

      {/* ── Revenue + routes ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StudioCard padding="md">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={16} className="text-[var(--studio-accent)]" aria-hidden="true" />
            <StudioHeading size="card" marker={false} as="h2" centered={false} className="flex-1">
              {t('dashboard.ops.revenueOverview')}
            </StudioHeading>
          </div>
          {loading ? (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 rounded-xl bg-[var(--studio-muted-fill)] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {revenueRows.map((row) => {
                const max = revenueTotal || 1
                const pct = Math.min((row.value / max) * 100, 100)
                return (
                  <div key={row.key}>
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <span className="text-sm text-[var(--studio-text)]">{row.label}</span>
                      <span className="text-sm font-semibold text-[var(--studio-text)]">{rwf(row.value)}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[var(--studio-muted-fill)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: row.color }}
                      />
                    </div>
                  </div>
                )
              })}
              <div className="pt-3 border-t border-[var(--studio-border)]">
                <StatRow
                  label={t('dashboard.ops.netMargin')}
                  value={`${revenueTotal > 0 ? Math.round((revenueNet / revenueTotal) * 100) : 0}%`}
                />
              </div>
            </div>
          )}
        </StudioCard>

        <StudioCard padding="md">
          <div className="flex items-center gap-2 mb-4">
            <Route size={16} className="text-[var(--studio-accent)]" aria-hidden="true" />
            <StudioHeading size="card" marker={false} as="h2" centered={false} className="flex-1">
              {t('dashboard.ops.topRoutes')}
            </StudioHeading>
          </div>
          {loading ? (
            <div className="h-[220px] rounded-xl bg-[var(--studio-muted-fill)] animate-pulse" />
          ) : topRoutes.length === 0 ? (
            <EmptyState
              icon={Route}
              title={t('dashboard.ops.noRouteData')}
              svgAlt={t('dashboard.ops.noRouteData')}
            />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={topRoutes.map((r: any) => ({
                  name: r.pickupPoint
                    ? `${r.origin} → ${r.pickupPoint} → ${r.destination}`
                    : `${r.origin} → ${r.destination}`,
                  count: r.count,
                }))}
                margin={{ top: 4, right: 0, left: -20, bottom: 0 }}
                barSize={24}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--studio-border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: 'var(--studio-text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--studio-text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip wrapperStyle={CHART_TOOLTIP} cursor={{ fill: 'var(--studio-muted-fill)' }} />
                <Bar dataKey="count" fill="var(--studio-accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </StudioCard>
      </div>

      {/* ── Activity + bookings ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StudioCard padding="md">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={16} className="text-[var(--studio-accent)]" aria-hidden="true" />
            <StudioHeading size="card" marker={false} as="h2" centered={false} className="flex-1">
              {t('dashboard.ops.recentActivity')}
            </StudioHeading>
          </div>
          {latestActivity.length === 0 ? (
            <EmptyState
              icon={Bell}
              title={t('dashboard.ops.noRecentActivity')}
              svgAlt={t('dashboard.ops.noRecentActivity')}
            />
          ) : (
            <ul className="space-y-3">
              {latestActivity.map((n: any, i: number) => {
                const Icon = ACTIVITY_ICONS[n.type] || Ticket
                return (
                  <li key={n._id || i} className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-full bg-[var(--studio-accent-soft)] flex items-center justify-center shrink-0">
                      <Icon size={14} className="text-[var(--studio-accent)]" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[var(--studio-text)] leading-snug">
                        {n.title || n.message || n.type}
                      </p>
                      {n.createdAt && (
                        <p className="text-xs text-[var(--studio-text-muted)] mt-0.5">{timeAgo(n.createdAt)}</p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </StudioCard>

        <div className="lg:col-span-2 space-y-3">
          <StudioCard padding="md">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Ticket size={16} className="text-[var(--studio-accent)]" aria-hidden="true" />
                <StudioHeading size="card" marker={false} as="h2" centered={false}>
                  {t('dashboard.ops.recentBookings')}
                </StudioHeading>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--studio-text-muted)]">{t('dashboard.ops.rows')}</span>
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
                  svgAlt={t('dashboard.ops.noBookingsYet')}
                  cta={
                    <Link
                      to="/dashboard/departures"
                      className={sectionPill}
                      style={{ borderRadius: 'var(--studio-radius-pill)' }}
                    >
                      <MapPin size={15} />
                      {t('nav.departures')}
                    </Link>
                  }
                />
              }
            />

            <StudioPagination
              page={page}
              totalPages={totalPages}
              total={totalBookings}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </StudioCard>
        </div>
      </div>
    </div>
  )
}
