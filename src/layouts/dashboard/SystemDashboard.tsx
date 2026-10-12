import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  BarChart, Bar, ComposedChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  DollarSign, Ticket, Route, Users, Building2,
  Download, RefreshCw, Clock, Wallet,
  Smartphone, Globe,
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

const ACCENT = 'var(--studio-accent)'
const RECENT_PER_PAGE = 8

const STATUS_ORDER = ['pending', 'confirmed', 'issued', 'rejected', 'cancelled'] as const
const STATUS_META: Record<string, { color: string }> = {
  pending: { color: 'var(--tone-warning-dot)' },
  confirmed: { color: 'var(--tone-info-dot)' },
  issued: { color: 'var(--tone-success-dot)' },
  rejected: { color: 'var(--tone-danger-dot)' },
  cancelled: { color: 'var(--tone-neutral-dot)' },
}

const STATUS_PILL: Record<string, string> = {
  pending: 'bg-[var(--tone-warning-fill)] text-[var(--tone-warning-ink)]',
  confirmed: 'bg-[var(--tone-info-fill)] text-[var(--tone-info-ink)]',
  issued: 'bg-[var(--tone-success-fill)] text-[var(--tone-success-ink)]',
  rejected: 'bg-[var(--tone-danger-fill)] text-[var(--tone-danger-ink)]',
  cancelled: 'bg-[var(--studio-muted-fill)] text-[var(--studio-text-sub)]',
}

const PAYMENT_ORDER = ['paid', 'pending', 'processing', 'failed', 'refunded'] as const
const PAYMENT_META: Record<string, { color: string }> = {
  paid: { color: 'var(--tone-success-dot)' },
  pending: { color: 'var(--tone-warning-dot)' },
  processing: { color: 'var(--tone-info-dot)' },
  failed: { color: 'var(--tone-danger-dot)' },
  refunded: { color: 'var(--tone-accent-dot)' },
}

const PAYMENT_PILL: Record<string, string> = {
  paid: 'bg-[var(--tone-success-fill)] text-[var(--tone-success-ink)]',
  pending: 'bg-[var(--tone-warning-fill)] text-[var(--tone-warning-ink)]',
  processing: 'bg-[var(--tone-info-fill)] text-[var(--tone-info-ink)]',
  failed: 'bg-[var(--tone-danger-fill)] text-[var(--tone-danger-ink)]',
  refunded: 'bg-[var(--tone-accent-fill)] text-[var(--tone-accent-ink)]',
}

const TOOLTIP_STYLE = {
  borderRadius: 10,
  border: '1px solid var(--studio-border)',
  background: 'var(--studio-surface)',
  fontSize: 12,
}

const rwf = (n: number) => `${(n || 0).toLocaleString()} RWF`

function parseLocalDate(iso: string): Date | null {
  if (!iso) return null
  const bare = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (bare) return new Date(Number(bare[1]), Number(bare[2]) - 1, Number(bare[3]))
  const d = new Date(iso)
  return isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function shortDate(iso: string): string {
  const d = parseLocalDate(iso)
  return d ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'
}

export default function SystemDashboard() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [data, setData] = useState<any>(null)
  const [adminData, setAdminData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [recentPage, setRecentPage] = useState(1)

  const loadAnalytics = useCallback(async () => {
    try {
      const [analyticsRes, adminRes] = await Promise.all([
        api.getSystemAnalytics(),
        api.getAdminDashboard(),
      ])
      if (analyticsRes.data) setData(analyticsRes.data)
      if (adminRes.data) setAdminData(adminRes.data)
      setLastUpdated(new Date())
    } catch {} finally {
      setLoading(false)
    }
  }, [])

  const refreshAll = useCallback(() => {
    loadAnalytics()
  }, [loadAnalytics])

  useEffect(() => {
    refreshAll()
    const interval = setInterval(refreshAll, 30000)
    return () => clearInterval(interval)
  }, [refreshAll])

  const overview = data?.overview || {}
  const revenue = data?.revenue || {}
  const topRoutes = data?.topRoutes || []
  const agencies = data?.agencyBookings || []
  const recentBookings = adminData?.recentBookings || []
  const totalRecentPages = Math.ceil(recentBookings.length / RECENT_PER_PAGE) || 1
  const safeRecentPage = Math.min(Math.max(recentPage, 1), totalRecentPages)
  const paginatedRecent = recentBookings.slice(
    (safeRecentPage - 1) * RECENT_PER_PAGE,
    safeRecentPage * RECENT_PER_PAGE
  )
  const statusBreakdown = data?.statusBreakdown || {}
  const paymentBreakdown = data?.paymentBreakdown || {}
  const bookingMix = data?.bookingMix || {}
  const dailySeries = data?.dailySeries || []

  const dayBookings = overview.dayBookings ?? 0
  const weekBookings = overview.weekBookings ?? 0
  const monthBookings = overview.monthBookings ?? 0
  const totalBookings = overview.totalBookings ?? 0
  const totalAgencies = overview.totalAgencies ?? 0
  const totalUsers = overview.totalUsers ?? 0
  const totalSeats = overview.totalSeats ?? data?.totalSeats ?? 0

  const revenueTotal = revenue.total ?? 0
  const revenueFees = revenue.systemFees ?? 0
  const revenueNet = revenue.netRevenue ?? Math.max(revenueTotal - revenueFees, 0)
  const revenueDay = revenue.dayRevenue ?? 0
  const daySystemFees = revenue.daySystemFees ?? 0
  const weekSystemFees = revenue.weekSystemFees ?? 0
  const monthSystemFees = revenue.monthSystemFees ?? 0

  const adminStats = adminData?.stats || {}
  const processingFeesTotal = adminStats.processingFees ?? 0
  const paidByUsersTotal = adminStats.paidByUsers ?? Math.round(revenueTotal + revenueFees + processingFeesTotal)

  const platformMargin = revenueTotal > 0 ? Math.round((revenueFees / revenueTotal) * 100) : 0

  const greetingKey = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'greetingMorning'
    if (h < 17) return 'greetingAfternoon'
    return 'greetingEvening'
  })()

  const statusTotal = STATUS_ORDER.reduce((sum, s) => sum + (statusBreakdown[s] || 0), 0)
  const statusData = useMemo(
    () => STATUS_ORDER
      .map(s => ({
        name: t(`dashboard.ops.status.${s}`),
        key: s,
        value: statusBreakdown[s] || 0,
      }))
      .filter(d => d.value > 0),
    [statusBreakdown, t]
  )

  const paymentTotal = PAYMENT_ORDER.reduce((sum, p) => sum + (paymentBreakdown[p] || 0), 0)
  const paymentData = useMemo(
    () => PAYMENT_ORDER
      .map(p => ({
        name: t(`dashboard.ops.payment.${p}`),
        key: p,
        value: paymentBreakdown[p] || 0,
      }))
      .filter(d => d.value > 0),
    [paymentBreakdown, t]
  )

  const trendData = useMemo(
    () => dailySeries.map((d: any) => ({
      label: shortDate(d.date),
      Bookings: d.count,
      Revenue: d.revenue,
    })),
    [dailySeries]
  )

  const topAgencies = useMemo(() => agencies.slice(0, 6), [agencies])
  const maxAgencyRevenue = Math.max(...topAgencies.map((a: any) => a.revenue || 0), 1)
  const mixTotal = (bookingMix.guest || 0) + (bookingMix.registered || 0)

  const csvExport = () => {
    if (!agencies.length) return
    const header = [
      t('dashboard.ops.csvAgency'),
      t('dashboard.ops.csvBookings'),
      t('dashboard.ops.csvRevenue'),
      t('dashboard.ops.csvSystemFees'),
    ].join(',') + '\n'
    const rows = agencies.map((a: any) =>
      `${a.name},${a.count},${a.revenue},${a.systemFees ?? ''}`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'system_report.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const statusLabel = (status: string): string => {
    const key = (status || '').toLowerCase()
    return t(`dashboard.ops.status.${key}`, { defaultValue: status || '—' })
  }

  const paymentLabel = (status: string): string => {
    const key = (status || '').toLowerCase()
    return t(`dashboard.ops.payment.${key}`, { defaultValue: status || '—' })
  }

  const pill =
    'inline-flex items-center gap-1.5 h-9 px-3.5 text-sm font-medium border border-[var(--studio-border)] bg-[var(--studio-surface)] text-[var(--studio-text)] hover:bg-[var(--studio-muted-fill)] cursor-pointer transition-colors'

  const routeOf = (b: any) => (b.route?.origin
    ? `${b.route.origin} → ${b.route.destination}${viaLabel(b.route.via)}`
    : `${b.origin} → ${b.destination}`)

  const passengerOf = (b: any) =>
    b.user?.name || b.passengerDetails?.[0]?.name || b.guestName || t('dashboard.ops.guest')

  const phoneOf = (b: any) =>
    b.contactPhone || b.passengerDetails?.[0]?.phone || b.guestPhone || b.user?.phone || '—'

  /** Payment channel badge — MoMo (merchant code) vs Online (pawaPay). */
  const paymentChannelBadge = (b: any) => {
    if (!b.paymentChannel) return <span className="text-xs text-[var(--studio-text-muted)]">—</span>
    const isMomo = b.paymentChannel === 'momo_merchant'
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
          isMomo ? 'bg-[var(--tone-warning-fill)] text-[var(--tone-warning-ink)]' : 'bg-[var(--tone-info-fill)] text-[var(--tone-info-ink)]'
        }`}
        title={isMomo ? t('dashboard.ops.momoChannelTitle') : t('dashboard.ops.onlineChannelTitle')}
      >
        {isMomo ? <Smartphone size={11} aria-hidden="true" /> : <Globe size={11} aria-hidden="true" />}
        {isMomo ? t('dashboard.ops.momoChannel') : t('dashboard.ops.onlineChannel')}
      </span>
    )
  }

  const recentColumns: Column<any>[] = useMemo(() => [
    {
      key: 'referenceCode',
      header: t('dashboard.ops.ref'),
      sortable: true,
      render: (b) => (
        <span className="font-mono text-xs font-semibold text-[var(--studio-accent)]">{b.referenceCode}</span>
      ),
    },
    { key: 'agencyName', header: t('dashboard.ops.agency'), sortValue: (b) => b.agency?.name || '', render: (b) => b.agency?.name || '—' },
    { key: 'passenger', header: t('dashboard.ops.passenger'), render: (b) => passengerOf(b) },
    { key: 'phone', header: t('dashboard.ops.phone'), render: (b) => <span className="text-[var(--studio-text-sub)]">{phoneOf(b)}</span> },
    { key: 'seats', header: t('dashboard.ops.passengers'), align: 'center' },
    { key: 'route', header: t('dashboard.ops.route'), render: (b) => <span className="text-[var(--studio-text-sub)]">{routeOf(b)}</span> },
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
      key: 'ticket',
      header: t('dashboard.ops.colTicket'),
      align: 'right',
      sortValue: (b) => (b.totalAmount || 0),
      render: (b) => <span className="text-[var(--studio-text-sub)]">{rwf(b.totalAmount || 0)}</span>,
    },
    {
      key: 'paid',
      header: t('dashboard.ops.colPaid'),
      align: 'right',
      sortValue: (b) => (b.totalAmount || 0) + (b.systemFee || 0) + (b.paymentFee || 0),
      render: (b) => <span className="font-semibold">{rwf((b.totalAmount || 0) + (b.systemFee || 0) + (b.paymentFee || 0))}</span>,
    },
    {
      key: 'earning',
      header: t('dashboard.ops.colEarn'),
      align: 'right',
      render: (b) => <span className="font-semibold text-[var(--studio-accent)]">{rwf(b.systemFee || 0)}</span>,
    },
    {
      key: 'proc',
      header: t('dashboard.ops.colProc'),
      align: 'right',
      render: (b) => <span className="text-[var(--studio-text-sub)]">{rwf(b.paymentFee || 0)}</span>,
    },
    {
      key: 'payment',
      header: t('dashboard.ops.payment'),
      render: (b) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          {paymentChannelBadge(b)}
          <span
            className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
              PAYMENT_PILL[(b.paymentStatus || '').toLowerCase()] || 'bg-[var(--studio-muted-fill)] text-[var(--studio-text-sub)]'
            }`}
          >
            {paymentLabel(b.paymentStatus)}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: t('dashboard.ops.status'),
      render: (b) => (
        <span
          className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${
            STATUS_PILL[(b.status || '').toLowerCase()] || 'bg-[var(--studio-muted-fill)] text-[var(--studio-text-sub)]'
          }`}
        >
          {statusLabel(b.status)}
        </span>
      ),
    },
  ], [t])

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
            {t('dashboard.ops.systemSubtitle')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={refreshAll} className={pill} style={{ borderRadius: 'var(--studio-radius-pill)' }}>
            <RefreshCw size={14} aria-hidden="true" />
            {t('dashboard.ops.refresh')}
          </button>
          <button type="button" onClick={csvExport} className={pill} style={{ borderRadius: 'var(--studio-radius-pill)' }}>
            <Download size={14} aria-hidden="true" />
            {t('dashboard.ops.csvReport')}
          </button>
        </div>
      </div>

      {lastUpdated && (
        <p className="text-xs text-[var(--studio-text-muted)]">
          {t('dashboard.ops.updatedAuto', { time: lastUpdated.toLocaleTimeString() })}
        </p>
      )}

      {/* ── Quick actions ────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: t('nav.users'), icon: Users, to: '/dashboard/users' },
          { label: t('nav.organizations'), icon: Building2, to: '/dashboard/organizations' },
          { label: t('nav.accounting'), icon: DollarSign, to: '/dashboard/accounting' },
        ].map((action) => (
          <Link key={action.to} to={action.to} className={pill} style={{ borderRadius: 'var(--studio-radius-pill)' }}>
            <action.icon size={15} aria-hidden="true" />
            {action.label}
          </Link>
        ))}
      </div>

      {/* ── Today's operations + key metrics ─────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StudioCard padding="md" className="sm:col-span-2 xl:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={15} className="text-[var(--studio-accent)]" aria-hidden="true" />
            <StudioHeading size="card" marker={false} as="h2" centered={false}>
              {t('dashboard.ops.todayOperations')}
            </StudioHeading>
          </div>
          <div className="divide-y divide-[var(--studio-border)]">
            <StatRow label={t('dashboard.ops.createdToday')} value={loading ? '…' : dayBookings.toLocaleString()} />
            <StatRow label={t('dashboard.ops.collectedToday')} value={loading ? '…' : rwf(revenueDay)} />
            <StatRow label={t('dashboard.ops.earnedToday')} value={loading ? '…' : rwf(daySystemFees)} />
            <StatRow label={t('dashboard.ops.agencies')} value={loading ? '…' : totalAgencies.toLocaleString()} />
          </div>
        </StudioCard>

        <StudioCard padding="md">
          <StatRow
            label={t('dashboard.ops.platformIncome')}
            value={loading ? '…' : rwf(revenueFees)}
            trend={daySystemFees > 0 ? 1 : undefined}
            trendLabel={daySystemFees > 0 ? t('dashboard.ops.todayShortMoney', { value: rwf(daySystemFees) }) : undefined}
          />
        </StudioCard>

        <StudioCard padding="md">
          <StatRow
            label={t('dashboard.ops.totalCollected')}
            value={loading ? '…' : rwf(revenueTotal)}
            trend={revenueDay > 0 ? 1 : undefined}
            trendLabel={revenueDay > 0 ? t('dashboard.ops.todayShortMoney', { value: rwf(revenueDay) }) : undefined}
          />
        </StudioCard>

        <StudioCard padding="md">
          <StatRow
            label={t('dashboard.ops.totalBookings')}
            value={loading ? '…' : totalBookings.toLocaleString()}
            trend={weekBookings > 0 ? 1 : undefined}
            trendLabel={weekBookings > 0 ? t('dashboard.ops.thisWeekShort', { count: weekBookings }) : undefined}
          />
        </StudioCard>

        <StudioCard padding="md">
          <StatRow
            label={t('dashboard.ops.monthBookings')}
            value={loading ? '…' : monthBookings.toLocaleString()}
          />
        </StudioCard>

        <StudioCard padding="md">
          <StatRow label={t('dashboard.ops.seatsSold')} value={loading ? '…' : totalSeats.toLocaleString()} />
        </StudioCard>

        <StudioCard padding="md">
          <StatRow label={t('dashboard.ops.registeredUsers')} value={loading ? '…' : totalUsers.toLocaleString()} />
        </StudioCard>
      </div>

      {/* ── Trend + status breakdown ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StudioCard padding="md" className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Ticket size={15} className="text-[var(--studio-accent)]" aria-hidden="true" />
            <StudioHeading size="card" marker={false} as="h2" centered={false} className="flex-1">
              {t('dashboard.ops.trendLast14')}
            </StudioHeading>
          </div>
          {loading ? (
            <div className="h-[260px] rounded-xl bg-[var(--studio-muted-fill)] animate-pulse" />
          ) : trendData.length === 0 ? (
            <EmptyState
              icon={Ticket}
              title={t('dashboard.ops.noDataLast14')}
              svgAlt={t('dashboard.ops.noDataLast14')}
            />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={trendData} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--studio-border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: 'var(--studio-text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                  interval={1}
                />
                <YAxis
                  yAxisId="bookings"
                  tick={{ fontSize: 11, fill: 'var(--studio-text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  yAxisId="revenue"
                  orientation="right"
                  tick={{ fontSize: 11, fill: 'var(--studio-text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  wrapperStyle={TOOLTIP_STYLE}
                  labelStyle={{ color: 'var(--studio-text)', fontWeight: 600 }}
                  formatter={(value: any, name: any) =>
                    name === 'Revenue' ? rwf(Number(value) || 0) : (Number(value) || 0)
                  }
                />
                <Bar yAxisId="bookings" dataKey="Bookings" fill={ACCENT} radius={[6, 6, 0, 0]} barSize={14} />
                <Line
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="Revenue"
                  stroke="var(--tone-warning-dot)"
                  strokeWidth={2}
                  dot={{ r: 2, fill: 'var(--tone-warning-dot)', strokeWidth: 0 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </StudioCard>

        <StudioCard padding="md">
          <div className="flex items-center gap-2 mb-4">
            <Route size={15} className="text-[var(--studio-accent)]" aria-hidden="true" />
            <StudioHeading size="card" marker={false} as="h2" centered={false} className="flex-1">
              {t('dashboard.ops.bookingStatus')}
            </StudioHeading>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-6 rounded-lg bg-[var(--studio-muted-fill)] animate-pulse" />
              ))}
            </div>
          ) : statusTotal === 0 ? (
            <EmptyState
              icon={Route}
              title={t('dashboard.ops.noBookingsYet')}
              svgAlt={t('dashboard.ops.noBookingsYet')}
            />
          ) : (
            <div>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={70}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {statusData.map((entry: any) => (
                        <Cell key={entry.key} fill={STATUS_META[entry.key].color} />
                      ))}
                    </Pie>
                    <Tooltip wrapperStyle={TOOLTIP_STYLE} formatter={(value: any) => value} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-3 space-y-2">
                {statusData.map((s: any) => {
                  const pct = statusTotal > 0 ? Math.round((s.value / statusTotal) * 100) : 0
                  return (
                    <li key={s.key} className="flex items-center gap-2 text-sm">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: STATUS_META[s.key].color }}
                      />
                      <span className="text-[var(--studio-text-sub)] flex-1">{s.name}</span>
                      <span className="font-semibold text-[var(--studio-text)]">{s.value}</span>
                      <span className="text-xs text-[var(--studio-text-muted)] w-9 text-right">{pct}%</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </StudioCard>
      </div>

      {/* ── Revenue + routes + payment mix ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StudioCard padding="md">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={15} className="text-[var(--studio-accent)]" aria-hidden="true" />
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
              {[
                { key: 'gross', label: t('dashboard.ops.grossRevenue'), value: revenueTotal, color: 'var(--studio-text)' },
                { key: 'paid', label: t('dashboard.ops.paidByUsers'), value: paidByUsersTotal, color: ACCENT },
                { key: 'proc', label: t('dashboard.ops.processingFees'), value: processingFeesTotal, color: 'var(--tone-warning-dot)' },
                { key: 'fees', label: t('dashboard.ops.platformFees'), value: revenueFees, color: ACCENT },
                { key: 'net', label: t('dashboard.ops.paidToAgencies'), value: revenueNet, color: 'var(--tone-info-dot)' },
              ].map((item) => {
                const max = revenueTotal || 1
                const pct = Math.min((item.value / max) * 100, 100)
                return (
                  <div key={item.key}>
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <span className="text-sm text-[var(--studio-text)]">{item.label}</span>
                      <span className="text-sm font-semibold text-[var(--studio-text)]">{rwf(item.value)}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[var(--studio-muted-fill)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: item.color }}
                      />
                    </div>
                  </div>
                )
              })}
              <div className="pt-3 border-t border-[var(--studio-border)]">
                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  {[
                    { label: t('dashboard.ops.today'), value: daySystemFees },
                    { label: t('dashboard.ops.thisWeek'), value: weekSystemFees },
                    { label: t('dashboard.ops.thisMonth'), value: monthSystemFees },
                  ].map((x) => (
                    <div key={x.label}>
                      <p className="text-xs text-[var(--studio-text-sub)]">{x.label}</p>
                      <p className="text-sm font-bold text-[var(--studio-text)]">{rwf(x.value)}</p>
                    </div>
                  ))}
                </div>
                <StatRow label={t('dashboard.ops.platformMargin')} value={`${platformMargin}%`} />
              </div>
            </div>
          )}
        </StudioCard>

        <StudioCard padding="md">
          <div className="flex items-center gap-2 mb-4">
            <Route size={15} className="text-[var(--studio-accent)]" aria-hidden="true" />
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
                  name: `${r.origin}→${r.destination}`,
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
                <Tooltip wrapperStyle={TOOLTIP_STYLE} cursor={{ fill: 'var(--studio-muted-fill)' }} />
                <Bar dataKey="count" fill={ACCENT} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </StudioCard>

        <StudioCard padding="md">
          <div className="flex items-center gap-2 mb-4">
            <Wallet size={15} className="text-[var(--studio-accent)]" aria-hidden="true" />
            <StudioHeading size="card" marker={false} as="h2" centered={false} className="flex-1">
              {t('dashboard.ops.paymentsAndMix')}
            </StudioHeading>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-6 rounded-lg bg-[var(--studio-muted-fill)] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--studio-text-sub)]">
                {t('dashboard.ops.paymentStatus')}
              </p>
              {paymentData.length === 0 ? (
                <p className="text-sm text-[var(--studio-text-muted)]">{t('dashboard.ops.noPaymentsYet')}</p>
              ) : (
                paymentData.map((p: any) => {
                  const pct = paymentTotal > 0 ? Math.round((p.value / paymentTotal) * 100) : 0
                  return (
                    <div key={p.key}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="flex items-center gap-2 text-[var(--studio-text-sub)]">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ background: PAYMENT_META[p.key].color }}
                          />
                          <span>{p.name}</span>
                        </span>
                        <span className="text-xs text-[var(--studio-text-muted)]">
                          {p.value} · {pct}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[var(--studio-muted-fill)] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: PAYMENT_META[p.key].color }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
              <div className="pt-3 border-t border-[var(--studio-border)] space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--studio-text-sub)]">
                  {t('dashboard.ops.bookingSource')}
                </p>
                {[
                  { key: 'registered', label: t('dashboard.ops.registeredUsersLabel'), value: bookingMix.registered || 0, color: ACCENT },
                  { key: 'guest', label: t('dashboard.ops.guestLabel'), value: bookingMix.guest || 0, color: 'var(--tone-warning-dot)' },
                ].map((row) => {
                  const pct = mixTotal > 0 ? Math.round((row.value / mixTotal) * 100) : 0
                  return (
                    <div key={row.key}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-[var(--studio-text-sub)]">{row.label}</span>
                        <span className="text-xs text-[var(--studio-text-muted)]">
                          {row.value} · {pct}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[var(--studio-muted-fill)] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: row.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </StudioCard>
      </div>

      {/* ── Recent bookings ──────────────────────────────────────── */}
      <StudioCard padding="none" as="section" className="overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-[var(--studio-border)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Ticket size={15} className="text-[var(--studio-accent)]" aria-hidden="true" />
            <StudioHeading size="card" marker={false} as="h2" centered={false}>
              {t('dashboard.ops.recentBookings')}
            </StudioHeading>
          </div>
          <span className="text-xs text-[var(--studio-text-muted)]">
            {t('dashboard.ops.latestCount', { count: recentBookings.length })}
          </span>
        </div>
        <div className="p-4 sm:p-5">
          <DataTable
            columns={recentColumns}
            data={paginatedRecent}
            getRowId={(b) => String(b._id)}
            loading={loading}
            emptyState={
              <EmptyState
                icon={Ticket}
                title={t('dashboard.ops.noBookingsYet')}
                svgAlt={t('dashboard.ops.noBookingsYet')}
              />
            }
          />
          <StudioPagination
            page={safeRecentPage}
            totalPages={totalRecentPages}
            total={recentBookings.length}
            pageSize={RECENT_PER_PAGE}
            onPageChange={setRecentPage}
          />
        </div>
      </StudioCard>

      {/* ── Top agencies ─────────────────────────────────────────── */}
      <StudioCard padding="md">
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={15} className="text-[var(--studio-accent)]" aria-hidden="true" />
          <StudioHeading size="card" marker={false} as="h2" centered={false} className="flex-1">
            {t('dashboard.ops.topAgencies')}
          </StudioHeading>
        </div>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-[var(--studio-muted-fill)] animate-pulse" />
            ))}
          </div>
        ) : topAgencies.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={t('dashboard.ops.noAgenciesYet')}
            svgAlt={t('dashboard.ops.noAgenciesYet')}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
            {topAgencies.map((a: any, i: number) => {
              const rev = a.revenue || 0
              const pct = Math.min((rev / maxAgencyRevenue) * 100, 100)
              return (
                <div key={a.name + i}>
                  <div className="flex items-center justify-between gap-2 text-sm mb-1.5">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-[var(--studio-muted-fill)] text-[var(--studio-text-sub)] text-[10px] font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="truncate text-[var(--studio-text)]">{a.name}</span>
                    </span>
                    <span className="text-xs text-[var(--studio-text-muted)] shrink-0">
                      {t('dashboard.ops.agenciesMeta', { count: a.count, revenue: rwf(rev) })}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--studio-muted-fill)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: ACCENT }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </StudioCard>
    </div>
  )
}
