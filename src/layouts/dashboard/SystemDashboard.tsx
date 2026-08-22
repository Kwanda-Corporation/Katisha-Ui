import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  BarChart, Bar, ComposedChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  DollarSign, Ticket, Route, Users, Building2,
  Download, RefreshCw, Clock, Wallet, UserCheck, ChevronLeft, ChevronRight,
  Smartphone, Globe, CheckCircle2, XCircle, ReceiptText, Loader2,
} from 'lucide-react';
import { api, resolveImageUrl } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { StatCard } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { viaLabel } from '../../utils/via';

const BLUE = '#1D4ED8';

const STATUS_ORDER = ['pending', 'confirmed', 'issued', 'rejected', 'cancelled'] as const;
const STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: '#D97706' },
  confirmed: { label: 'Confirmed', color: '#1D4ED8' },
  issued: { label: 'Issued', color: '#059669' },
  rejected: { label: 'Rejected', color: '#DC2626' },
  cancelled: { label: 'Cancelled', color: '#71717A' },
};

const PAYMENT_ORDER = ['paid', 'pending', 'processing', 'failed', 'refunded'] as const;
const PAYMENT_META: Record<string, { label: string; color: string }> = {
  paid: { label: 'Paid', color: '#059669' },
  pending: { label: 'Pending', color: '#D97706' },
  processing: { label: 'Processing', color: '#1D4ED8' },
  failed: { label: 'Failed', color: '#DC2626' },
  refunded: { label: 'Refunded', color: '#7C3AED' },
};

const TOOLTIP_STYLE = {
  borderRadius: 6,
  border: '1px solid #E4E4E7',
  background: '#fff',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  color: '#18181B',
  fontSize: 12,
};

const rwf = (n: number) => `${(n || 0).toLocaleString()} RWF`;

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function parseLocalDate(iso: string): Date | null {
  if (!iso) return null;
  const bare = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (bare) return new Date(Number(bare[1]), Number(bare[2]) - 1, Number(bare[3]));
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function shortDate(iso: string): string {
  const d = parseLocalDate(iso);
  return d ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—';
}

export default function SystemDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState<any>(null);
  const [adminData, setAdminData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [recentPage, setRecentPage] = useState(1);
  const [pendingMomo, setPendingMomo] = useState<any[]>([]);
  const [momoBusyId, setMomoBusyId] = useState<string | null>(null);

  const loadPendingMomo = useCallback(async () => {
    try {
      const res = await api.getPendingMomoPayments();
      setPendingMomo(res.data?.bookings || []);
    } catch {
      // Non-critical: panel just stays empty.
      setPendingMomo([]);
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      const [analyticsRes, adminRes] = await Promise.all([
        api.getSystemAnalytics(),
        api.getAdminDashboard(),
      ]);
      if (analyticsRes.data) setData(analyticsRes.data);
      if (adminRes.data) setAdminData(adminRes.data);
      setLastUpdated(new Date());
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
    loadPendingMomo();
    const interval = setInterval(() => {
      loadAnalytics();
      loadPendingMomo();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadAnalytics, loadPendingMomo]);

  const handleMomoApprove = async (b: any) => {
    setMomoBusyId(b._id);
    try {
      await api.approveMomoPayment(b._id);
      toast.success('Payment approved', `Ticket for ${b.referenceCode} has been issued.`);
      await Promise.all([loadAnalytics(), loadPendingMomo()]);
    } catch (err: any) {
      toast.error('Approval failed', err?.message || 'Could not approve this payment.');
    } finally {
      setMomoBusyId(null);
    }
  };

  const handleMomoReject = async (b: any) => {
    if (!window.confirm(`Reject MoMo payment ${b.referenceCode}? The booking will be cancelled.`)) return;
    setMomoBusyId(b._id);
    try {
      await api.rejectMomoPayment(b._id);
      toast.info('Payment rejected', `${b.referenceCode} was cancelled.`);
      await Promise.all([loadAnalytics(), loadPendingMomo()]);
    } catch (err: any) {
      toast.error('Rejection failed', err?.message || 'Could not reject this payment.');
    } finally {
      setMomoBusyId(null);
    }
  };

  const overview = data?.overview || {};
  const revenue = data?.revenue || {};
  const topRoutes = data?.topRoutes || [];
  const agencies = data?.agencyBookings || [];
  const recentBookings = adminData?.recentBookings || [];
  const RECENT_PER_PAGE = 8;
  const totalRecentPages = Math.ceil(recentBookings.length / RECENT_PER_PAGE) || 1;
  const safeRecentPage = Math.min(Math.max(recentPage, 1), totalRecentPages);
  const paginatedRecent = recentBookings.slice((safeRecentPage - 1) * RECENT_PER_PAGE, safeRecentPage * RECENT_PER_PAGE);
  const statusBreakdown = data?.statusBreakdown || {};
  const paymentBreakdown = data?.paymentBreakdown || {};
  const bookingMix = data?.bookingMix || {};
  const dailySeries = data?.dailySeries || [];

  const dayBookings = overview.dayBookings ?? 0;
  const weekBookings = overview.weekBookings ?? 0;
  const monthBookings = overview.monthBookings ?? 0;
  const totalBookings = overview.totalBookings ?? 0;
  const totalAgencies = overview.totalAgencies ?? 0;
  const totalUsers = overview.totalUsers ?? 0;
  const totalSeats = overview.totalSeats ?? data?.totalSeats ?? 0;

  const revenueTotal = revenue.total ?? 0;
  const revenueFees = revenue.systemFees ?? 0;
  const revenueNet = revenue.netRevenue ?? Math.max(revenueTotal - revenueFees, 0);
  const revenueDay = revenue.dayRevenue ?? 0;
  const daySystemFees = revenue.daySystemFees ?? 0;
  const weekSystemFees = revenue.weekSystemFees ?? 0;
  const monthSystemFees = revenue.monthSystemFees ?? 0;

  const platformMargin = revenueTotal > 0 ? Math.round((revenueFees / revenueTotal) * 100) : 0;

  const statusTotal = STATUS_ORDER.reduce((sum, s) => sum + (statusBreakdown[s] || 0), 0);
  const statusData = useMemo(
    () => STATUS_ORDER.map(s => ({ name: STATUS_META[s].label, key: s, value: statusBreakdown[s] || 0 })).filter(d => d.value > 0),
    [statusBreakdown]
  );

  const paymentTotal = PAYMENT_ORDER.reduce((sum, p) => sum + (paymentBreakdown[p] || 0), 0);
  const paymentData = useMemo(
    () => PAYMENT_ORDER.map(p => ({ name: PAYMENT_META[p].label, key: p, value: paymentBreakdown[p] || 0 })).filter(d => d.value > 0),
    [paymentBreakdown]
  );

  const trendData = useMemo(
    () => dailySeries.map((d: any) => ({
      label: shortDate(d.date),
      Bookings: d.count,
      Revenue: d.revenue,
    })),
    [dailySeries]
  );

  const topAgencies = useMemo(() => agencies.slice(0, 6), [agencies]);
  const maxAgencyRevenue = Math.max(...topAgencies.map((a: any) => a.revenue || 0), 1);
  const mixTotal = (bookingMix.guest || 0) + (bookingMix.registered || 0);

  const csvExport = () => {
    if (!agencies.length) return;
    const header = 'Agency,Bookings,Revenue,System Fees\n';
    const rows = agencies.map((a: any) =>
      `${a.name},${a.count},${a.revenue},${a.systemFees ?? ''}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'system_report.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const statusClass = (status: string) => {
    if (status === 'pending') return 'bg-amber-100 text-amber-800';
    if (status === 'confirmed') return 'bg-blue-100 text-blue-800';
    if (status === 'issued') return 'bg-emerald-100 text-emerald-800';
    if (status === 'rejected') return 'bg-red-100 text-red-700';
    if (status === 'cancelled') return 'bg-zinc-200 text-zinc-700';
    return 'bg-zinc-100 text-zinc-600';
  };

  const paymentStatusClass = (s: string) => {
    if (s === 'paid') return 'bg-emerald-100 text-emerald-800';
    if (s === 'processing' || s === 'pending') return 'bg-amber-100 text-amber-800';
    if (s === 'failed') return 'bg-red-100 text-red-700';
    if (s === 'refunded') return 'bg-purple-100 text-purple-700';
    return 'bg-zinc-100 text-zinc-600';
  };

  // Payment channel badge — MoMo (merchant code) vs Online (pawaPay).
  const paymentTypeBadge = (b: any) => {
    if (!b.paymentChannel) {
      return <span className="text-xs text-[var(--text-muted)]">—</span>;
    }
    const isMomo = b.paymentChannel === 'momo_merchant';
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md ${
          isMomo ? 'bg-[#FEF3C7] text-[#92400E]' : 'bg-blue-100 text-blue-800'
        }`}
        title={isMomo ? 'Paid via MoMo merchant code' : 'Paid online (pawaPay)'}
      >
        {isMomo ? <Smartphone size={11} /> : <Globe size={11} />}
        {isMomo ? 'MoMo' : 'Online'}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* ── Personalized Header ─────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-zinc-950">{getGreeting()}, </span>
            <span className="text-[var(--blue)]">{user?.name?.split(' ')[0] || 'Admin'}</span>
          </h1>
          <p className="text-sm text-[var(--text-sub)] mt-1">
            Platform-wide analytics and monitoring
            {lastUpdated && (
              <span className="ml-2 text-xs text-[var(--text-muted)]">
                · updated {lastUpdated.toLocaleTimeString()} · auto-refreshes every 30s
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { loadAnalytics(); loadPendingMomo(); }}
            className="h-9 px-4 rounded-md border border-[var(--border)] text-sm font-medium flex items-center gap-2 cursor-pointer bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-colors text-zinc-700"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={csvExport}
            className="h-9 px-4 rounded-md border border-[var(--border)] text-sm font-medium flex items-center gap-2 cursor-pointer bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-colors text-zinc-700"
          >
            <Download size={14} /> CSV Report
          </button>
        </div>
      </div>

      {/* ── Quick Actions ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Users', icon: Users, href: '/dashboard/users' },
          { label: 'Organizations', icon: Building2, href: '/dashboard/organizations' },
          { label: 'Accounting', icon: DollarSign, href: '/dashboard/accounting' },
        ].map(action => (
          <a
            key={action.label}
            href={action.href}
            className="flex items-center gap-3 px-4 py-3 rounded-md bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-colors cursor-pointer text-zinc-700"
          >
            <action.icon size={18} />
            <span className="text-sm font-semibold">{action.label}</span>
          </a>
        ))}
      </div>

      {/* ── Today's Operations ──────────────────────────────────── */}
      <div className="bg-[#F9FAFB] rounded-md p-6">
        <h3 className="text-sm font-bold text-zinc-950 mb-4 flex items-center gap-2">
          <Clock size={15} className="text-[var(--blue)]" /> Today's Operations
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Bookings', value: dayBookings, sub: 'Created today', icon: Ticket, bg: 'bg-[var(--blue)]' },
            { label: 'Revenue', value: rwf(revenueDay), sub: 'Collected today', icon: DollarSign, bg: 'bg-[var(--blue)]' },
            { label: 'Platform Fees', value: rwf(daySystemFees), sub: 'Earned today', icon: Wallet, bg: 'bg-zinc-700' },
            { label: 'Agencies', value: totalAgencies, sub: 'Registered on platform', icon: Building2, bg: 'bg-zinc-700' },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-md ${item.bg} flex items-center justify-center shrink-0`}>
                <item.icon size={16} className="text-white" />
              </div>
              <div>
                {loading ? (
                  <div className="h-6 w-16 rounded bg-white/10 animate-pulse mb-1" />
                ) : (
                  <p className="text-xl font-bold text-zinc-950 tracking-tight">{item.value}</p>
                )}
                <p className="text-xs text-[var(--text-muted)]">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Key Metrics ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
        <StatCard
          label="Platform Income"
          value={loading ? '...' : rwf(revenueFees)}
          sub="From service fees"
          icon={<DollarSign size={16} />}
          loading={loading}
          trend={daySystemFees > 0 ? { value: `${rwf(daySystemFees)} today`, positive: true } : undefined}
          variant="blue"
          delay={0}
        />
        <StatCard
          label="Total Collected"
          value={loading ? '...' : rwf(revenueTotal)}
          sub="Passengers paid (gross)"
          icon={<DollarSign size={16} />}
          loading={loading}
          trend={revenueDay > 0 ? { value: `${rwf(revenueDay)} today`, positive: true } : undefined}
          variant="dark"
          delay={0.04}
        />
        <StatCard
          label="Total Bookings"
          value={loading ? '...' : totalBookings}
          sub="All time"
          icon={<Ticket size={16} />}
          loading={loading}
          trend={weekBookings > 0 ? { value: `${weekBookings} this week`, positive: true } : undefined}
          variant="default"
          delay={0.08}
        />
        <StatCard
          label="Seats Sold"
          value={loading ? '...' : totalSeats}
          sub="All-time passenger seats"
          icon={<UserCheck size={16} />}
          loading={loading}
          trend={monthBookings > 0 ? { value: `${monthBookings} bookings this month`, positive: true } : undefined}
          variant="dark"
          delay={0.12}
        />
        <StatCard
          label="Registered Users"
          value={loading ? '...' : totalUsers}
          sub="All-time signups"
          icon={<Users size={16} />}
          loading={loading}
          variant="blue"
          delay={0.16}
        />
      </div>

      {/* ── Trend + Status Breakdown ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Trend */}
        <div className="lg:col-span-2 bg-[#F9FAFB] rounded-md p-6">
          <h3 className="text-sm font-bold text-zinc-950 mb-5 flex items-center gap-2">
            <Ticket size={15} className="text-[var(--blue)]" /> Bookings & Revenue — Last 14 Days
          </h3>
          {loading ? (
            <div className="h-[260px] rounded bg-white/5 animate-pulse" />
          ) : trendData.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-sm text-[var(--text-sub)]">
              No data for the last 14 days
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={trendData} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#71717A' }}
                  axisLine={false}
                  tickLine={false}
                  interval={1}
                />
                <YAxis
                  yAxisId="bookings"
                  tick={{ fontSize: 11, fill: '#71717A' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  yAxisId="revenue"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#71717A' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  wrapperStyle={TOOLTIP_STYLE}
                  labelStyle={{ color: '#18181B', fontWeight: 600 }}
                  formatter={(value: any, name: any) =>
                    name === 'Revenue' ? rwf(Number(value) || 0) : (Number(value) || 0)
                  }
                />
                <Bar yAxisId="bookings" dataKey="Bookings" fill={BLUE} radius={[3, 3, 0, 0]} barSize={14} />
                <Line
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="Revenue"
                  stroke="#D97706"
                  strokeWidth={2}
                  dot={{ r: 2, fill: '#D97706', strokeWidth: 0 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Booking Status Breakdown */}
        <div className="bg-[#F9FAFB] rounded-md p-6">
          <h3 className="text-sm font-bold text-zinc-950 mb-5 flex items-center gap-2">
            <Route size={15} className="text-[var(--blue)]" /> Booking Status
          </h3>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-6 rounded bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : statusTotal === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-sm text-[var(--text-sub)]">
              No bookings yet
            </div>
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
              <div className="mt-3 space-y-2">
                {statusData.map((s: any) => {
                  const pct = statusTotal > 0 ? Math.round((s.value / statusTotal) * 100) : 0;
                  return (
                    <div key={s.key} className="flex items-center gap-2 text-sm">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: STATUS_META[s.key].color }}
                      />
                      <span className="text-[var(--text-sub)] flex-1 capitalize">{s.name}</span>
                      <span className="font-semibold text-zinc-950">{s.value}</span>
                      <span className="text-xs text-[var(--text-muted)] w-9 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Revenue + Routes + Payment Mix ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Overview */}
        <div className="bg-[#F9FAFB] rounded-md p-6">
          <h3 className="text-sm font-bold text-zinc-950 mb-5 flex items-center gap-2">
            <DollarSign size={15} className="text-[var(--blue)]" /> Revenue Overview
          </h3>
          {loading ? (
            <div className="space-y-4">
              {[0, 1, 2].map(i => (
                <div key={i} className="h-14 rounded bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {[
                { label: 'Total Collected (Gross)', value: revenueTotal, barColor: 'bg-zinc-700' },
                { label: 'Platform Income (Fees)', value: revenueFees, barColor: 'bg-[var(--blue)]' },
                { label: 'Paid to Agencies (Net)', value: revenueNet, barColor: 'bg-blue-400' },
              ].map((item) => {
                const max = revenueTotal || 1;
                const pct = Math.min((item.value / max) * 100, 100);
                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-[var(--text)]">{item.label}</span>
                      <span className="font-semibold text-[var(--blue)]">{rwf(item.value)}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#E4E4E7] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${item.barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="pt-3 border-t border-[#E4E4E7]">
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Today', value: daySystemFees },
                    { label: 'This week', value: weekSystemFees },
                    { label: 'This month', value: monthSystemFees },
                  ].map(x => (
                    <div key={x.label}>
                      <p className="text-xs text-[var(--text-sub)]">{x.label}</p>
                      <p className="text-sm font-bold text-[var(--blue)]">{rwf(x.value)}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#E4E4E7]">
                  <span className="text-xs text-[var(--text-sub)]">Platform margin</span>
                  <span className="text-sm font-bold text-[var(--blue)]">{platformMargin}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Top Routes Chart */}
        <div className="bg-[#F9FAFB] rounded-md p-6">
          <h3 className="text-sm font-bold text-zinc-950 mb-5 flex items-center gap-2">
            <Route size={15} className="text-[var(--blue)]" /> Top Routes by Bookings
          </h3>
          {loading ? (
            <div className="h-[200px] flex items-center justify-center">
              <div className="h-full w-full rounded bg-white/5 animate-pulse" />
            </div>
          ) : topRoutes.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-sm text-[var(--text-sub)]">
              No route data
            </div>
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
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#71717A' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#71717A' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip wrapperStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" fill={BLUE} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Payment & Booking Mix */}
        <div className="bg-[#F9FAFB] rounded-md p-6">
          <h3 className="text-sm font-bold text-zinc-950 mb-5 flex items-center gap-2">
            <Wallet size={15} className="text-[var(--blue)]" /> Payments & Booking Mix
          </h3>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-6 rounded bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-sub)]">
                Payment Status
              </p>
              {paymentData.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] py-1">No payments yet</p>
              ) : (
                paymentData.map((p: any) => {
                  const pct = paymentTotal > 0 ? Math.round((p.value / paymentTotal) * 100) : 0;
                  return (
                    <div key={p.key}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="flex items-center gap-2 text-[var(--text-sub)]">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ background: PAYMENT_META[p.key].color }}
                          />
                          <span className="capitalize">{p.name}</span>
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">
                          {p.value} · {pct}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#E4E4E7] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: PAYMENT_META[p.key].color }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
              <div className="pt-3 border-t border-[#E4E4E7] space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-sub)]">
                  Booking Source
                </p>
                {[
                  { label: 'Registered users', value: bookingMix.registered || 0, color: '#1D4ED8' },
                  { label: 'Guests', value: bookingMix.guest || 0, color: '#D97706' },
                ].map((row) => {
                  const pct = mixTotal > 0 ? Math.round((row.value / mixTotal) * 100) : 0;
                  return (
                    <div key={row.label}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-[var(--text-sub)]">{row.label}</span>
                        <span className="text-xs text-[var(--text-muted)]">
                          {row.value} · {pct}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#E4E4E7] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: row.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MoMo Payments Pending Review ────────────────────────── */}
      <div className="bg-white rounded-md border border-[var(--border)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between flex-wrap gap-3 bg-[#FFFBEB]">
          <h3 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
            <Smartphone size={15} className="text-[#D97706]" /> MoMo Payments — Pending Review
          </h3>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#92400E] bg-[#FEF3C7] px-2 py-0.5 rounded-md">
            {pendingMomo.length} awaiting approval
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F9FAFB]">
                {['Ref', 'Agency', 'Passenger', 'Phone', 'Route', 'Travel Date', 'Amount', 'Receipt', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-sub)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {pendingMomo.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-sm text-[var(--text-muted)]">
                    No pending MoMo payments — all merchant-code payments have been reviewed.
                  </td>
                </tr>
              ) : (
                pendingMomo.map(b => (
                  <tr key={b._id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-6 py-3 font-mono text-xs font-bold text-[var(--blue)]">{b.referenceCode}</td>
                    <td className="px-6 py-3 text-sm text-zinc-700">{b.agency?.name || '—'}</td>
                    <td className="px-6 py-3 text-sm text-zinc-700">
                      {b.user?.name || b.passengerDetails?.[0]?.name || b.guestName || 'Guest'}
                    </td>
                    <td className="px-6 py-3 text-sm text-[var(--text-sub)]">
                      {b.contactPhone || b.passengerDetails?.[0]?.phone || b.guestPhone || b.user?.phone || '—'}
                    </td>
                    <td className="px-6 py-3 text-sm text-[var(--text-sub)]">
                      {b.route?.origin ? `${b.route.origin} → ${b.route.destination}${viaLabel(b.route.via)}` : `${b.origin} → ${b.destination}`}
                    </td>
                    <td className="px-6 py-3 text-sm text-[var(--text-sub)]">
                      {parseLocalDate(b.travelDate)?.toLocaleDateString() || '—'} · {b.travelTime}
                    </td>
                    <td className="px-6 py-3 text-sm font-semibold text-zinc-950">
                      {(b.pricing?.customerTotal ?? ((b.totalAmount || 0) + (b.systemFee || 0))).toLocaleString()} RWF
                      <span className="ml-1.5 inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] align-middle">
                        <Smartphone size={10} /> MoMo
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      {b.merchantReceiptImage ? (
                        <a
                          href={resolveImageUrl(b.merchantReceiptImage)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--blue)] hover:underline cursor-pointer"
                        >
                          <ReceiptText size={13} /> View Receipt
                        </a>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleMomoApprove(b)}
                          disabled={momoBusyId === b._id}
                          className="h-8 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer border-none flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-default"
                        >
                          {momoBusyId === b._id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                          Approve
                        </button>
                        <button
                          onClick={() => handleMomoReject(b)}
                          disabled={momoBusyId === b._id}
                          className="h-8 px-3 rounded-md border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-default"
                        >
                          <XCircle size={12} />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Recent Bookings Table ───────────────────────────────── */}
      <div className="bg-white rounded-md border border-[var(--border)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between flex-wrap gap-3 bg-[#F9FAFB]">
          <h3 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
            <Ticket size={15} className="text-[var(--blue)]" /> Recent Bookings
          </h3>
          <span className="text-xs text-[var(--text-muted)]">Latest {recentBookings.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F9FAFB]">
                {['Ref', 'Agency', 'Passenger', 'Phone', 'Passengers', 'Route', 'Date', 'Time', 'Amount', 'Payment', 'Status'].map(h => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-sub)]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                Array.from({ length: RECENT_PER_PAGE }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 11 }).map((_, j) => (
                      <td key={j} className="px-6 py-3">
                        <div className="h-4 bg-[#F9FAFB] rounded w-4/5 animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : recentBookings.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-sm text-[var(--text-muted)]">
                    No bookings yet
                  </td>
                </tr>
              ) : (
                paginatedRecent.map((b: any) => (
                  <tr key={b._id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-6 py-3 font-mono text-xs font-bold text-[var(--blue)]">
                      {b.referenceCode}
                    </td>
                    <td className="px-6 py-3 text-sm text-zinc-700">
                      {b.agency?.name || '—'}
                    </td>
                    <td className="px-6 py-3 text-sm text-zinc-700">
                      {b.user?.name || b.passengerDetails?.[0]?.name || b.guestName || 'Guest'}
                    </td>
                    <td className="px-6 py-3 text-sm text-[var(--text-sub)]">
                      {b.contactPhone || b.passengerDetails?.[0]?.phone || b.guestPhone || b.user?.phone || '—'}
                    </td>
                    <td className="px-6 py-3 text-sm text-zinc-700">
                      {b.seats}
                    </td>
                    <td className="px-6 py-3 text-sm text-[var(--text-sub)]">
                      {b.route?.origin ? `${b.route.origin} → ${b.route.destination}${viaLabel(b.route.via)}` : '—'}
                    </td>
                    <td className="px-6 py-3 text-sm text-[var(--text-sub)]">
                      {parseLocalDate(b.travelDate)?.toLocaleDateString() || '—'}
                    </td>
                    <td className="px-6 py-3 text-sm text-[var(--text-sub)]">
                      {b.travelTime}
                    </td>
                    <td className="px-6 py-3 text-sm font-semibold text-zinc-950">
                      {((b.totalAmount || 0) + (b.systemFee || 0)).toLocaleString()} RWF
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {paymentTypeBadge(b)}
                        <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md ${paymentStatusClass(b.paymentStatus)}`}>
                          {b.paymentStatus || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center text-sm font-semibold capitalize px-3 py-1 rounded-sm ${statusClass(b.status)}`}
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalRecentPages > 1 && (
          <div className="px-6 py-3 border-t border-[var(--border)] flex items-center justify-between flex-wrap gap-3">
            <span className="text-xs text-[var(--text-muted)]">
              Page {safeRecentPage} of {totalRecentPages} · {recentBookings.length} bookings
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setRecentPage(p => Math.max(1, p - 1))} disabled={safeRecentPage <= 1}
                className="h-7 w-7 flex items-center justify-center rounded border border-[var(--border)] hover:bg-[#F9FAFB] disabled:opacity-30 cursor-pointer disabled:cursor-default bg-white"
              ><ChevronLeft size={13} /></button>
              {Array.from({ length: totalRecentPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setRecentPage(p)}
                  className={`h-7 min-w-[28px] px-1 flex items-center justify-center rounded text-xs font-semibold cursor-pointer border-none ${
                    p === safeRecentPage ? 'bg-[var(--blue)] text-white' : 'text-[var(--text-sub)] hover:bg-[#F9FAFB]'
                  }`}
                >{p}</button>
              ))}
              <button onClick={() => setRecentPage(p => Math.min(totalRecentPages, p + 1))} disabled={safeRecentPage >= totalRecentPages}
                className="h-7 w-7 flex items-center justify-center rounded border border-[var(--border)] hover:bg-[#F9FAFB] disabled:opacity-30 cursor-pointer disabled:cursor-default bg-white"
              ><ChevronRight size={13} /></button>
            </div>
          </div>
        )}
      </div>

      {/* ── Top Agencies Ranking ────────────────────────────────── */}
      <div className="bg-[#F9FAFB] rounded-md p-6">
        <h3 className="text-sm font-bold text-zinc-950 mb-5 flex items-center gap-2">
          <Building2 size={15} className="text-[var(--blue)]" /> Top Agencies
        </h3>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 rounded bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : topAgencies.length === 0 ? (
          <div className="py-10 text-center text-sm text-[var(--text-sub)]">No agencies yet</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
            {topAgencies.map((a: any, i: number) => {
              const rev = a.revenue || 0;
              const pct = Math.min((rev / maxAgencyRevenue) * 100, 100);
              return (
                <div key={a.name + i}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded bg-zinc-200 text-[var(--text-sub)] text-[10px] font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="truncate text-zinc-700">{a.name}</span>
                    </span>
                    <span className="text-xs text-[var(--text-muted)] shrink-0 ml-2">
                      {a.count} bk · {rwf(rev)}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#E4E4E7] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--blue)] transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
