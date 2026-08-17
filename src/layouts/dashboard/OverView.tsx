import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Ticket, TrendingUp, DollarSign, Calendar, Route,
  RefreshCw, Clock,
  MapPin, UserCheck, XCircle, Bell,
  Download, Plus,
} from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { StatCard, Pagination } from '../../components/ui';
import { viaLabel } from '../../utils/via';

function parseLocalDate(iso: string): Date | null {
  if (!iso) return null;
  const bare = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (bare) return new Date(Number(bare[1]), Number(bare[2]) - 1, Number(bare[3]));
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

const PAGE_SIZES = [10, 25, 50];

const ACTIVITY_ICONS: Record<string, { icon: typeof Ticket; color: string; bg: string }> = {
  booking_created: { icon: Ticket, color: 'text-blue-600', bg: 'bg-zinc-100' },
  booking_confirmed: { icon: UserCheck, color: 'text-blue-600', bg: 'bg-zinc-100' },
  ticket_uploaded: { icon: Ticket, color: 'text-violet-600', bg: 'bg-violet-50' },
  booking_cancelled: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
  payment_received: { icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function OverviewPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalBookings, setTotalBookings] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [notifications, setNotifications] = useState<any[]>([]);

  const loadAnalytics = async () => {
    try {
      const res = await api.getAgencyAnalytics();
      if (res.data) setData(res.data);
    } catch {} finally {
      setLoading(false);
    }
  };

  const loadBookings = useCallback(async () => {
    setBookingsLoading(true);
    try {
      const res = await api.getAgencyBookings({
        page: String(page),
        limit: String(pageSize),
      });
      if (res.data) {
        setBookings(res.data.bookings || []);
        setTotalBookings(res.data.total || 0);
        setTotalPages(res.data.pages || 1);
      }
    } catch {} finally {
      setBookingsLoading(false);
    }
  }, [page, pageSize]);

  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications({ limit: '8' });
      if (res.data) setNotifications(res.data.notifications || res.data || []);
    } catch {}
  };

  useEffect(() => {
    loadAnalytics();
    loadBookings();
    loadNotifications();
    const interval = setInterval(() => {
      loadAnalytics();
      loadNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { loadBookings(); }, [loadBookings]);
  useEffect(() => { setPage(1); }, [pageSize]);

  const overview = data?.overview || {};
  const revenue = data?.revenue || {};
  const topRoutes = data?.topRoutes || [];

  const dayBookings = overview.dayBookings ?? 0;
  const weekBookings = overview.weekBookings ?? 0;
  const monthBookings = overview.monthBookings ?? 0;
  const totalBookingsCount = overview.totalBookings ?? 0;

  const revenueTotal = revenue.total ?? 0;
  const revenueNet = revenue.netRevenue ?? 0;
  const revenueFees = revenue.systemFees ?? 0;
  const revenueDay = revenue.dayRevenue ?? 0;

  const completionRate = totalBookingsCount > 0
    ? Math.round(((overview.completedBookings ?? 0) / totalBookingsCount) * 100)
    : 0;

  const statusClass = (status: string) => {
    if (status === 'confirmed') return 'bg-[var(--blue)] text-white';
    if (status === 'rejected' || status === 'cancelled') return 'bg-[#F9FAFB] text-[var(--text-sub)]';
    return 'bg-[#F9FAFB] text-[var(--text-sub)]';
  };

  const latestActivity = useMemo(() => {
    return notifications.slice(0, 5);
  }, [notifications]);

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
            {user?.agency?.name ? `${user.agency.name} — ` : ''}Here's your operations overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { loadAnalytics(); loadBookings(); loadNotifications(); }}
            className="h-9 px-4 rounded-md border border-[var(--border)] text-sm font-medium flex items-center gap-2 cursor-pointer bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-colors text-zinc-700"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={() => window.location.href = '/dashboard/reports'}
            className="h-9 px-4 rounded-md border border-[var(--border)] text-sm font-medium flex items-center gap-2 cursor-pointer bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-colors text-zinc-700"
          >
            <Download size={14} /> Export Report
          </button>
        </div>
      </div>

      {/* ── Quick Actions ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'New Booking', icon: Plus, href: '/dashboard/departures' },
          { label: 'Departures', icon: MapPin, href: '/dashboard/departures' },
          { label: 'Reports', icon: Download, href: '/dashboard/reports' },
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
            { label: 'Departures', value: dayBookings, sub: 'Bookings today', icon: Ticket, bg: 'bg-[var(--blue)]' },
            { label: 'Revenue', value: `${revenueDay.toLocaleString()} RWF`, sub: "Today's income", icon: DollarSign, bg: 'bg-[var(--blue)]' },
            { label: 'Active Routes', value: topRoutes.length, sub: 'Operating today', icon: Route, bg: 'bg-zinc-700' },
            { label: 'Completion', value: `${completionRate}%`, sub: 'All-time rate', icon: UserCheck, bg: 'bg-zinc-700' },
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Total Bookings"
          value={loading ? '...' : totalBookingsCount}
          sub="All time"
          icon={<Ticket size={16} />}
          loading={loading}
          trend={weekBookings > 0 ? { value: `${weekBookings} this week`, positive: true } : undefined}
          variant="blue"
          delay={0}
        />
        <StatCard
          label="This Week"
          value={loading ? '...' : weekBookings}
          sub="Weekly total"
          icon={<TrendingUp size={16} />}
          loading={loading}
          trend={dayBookings > 0 ? { value: `${dayBookings} today`, positive: true } : undefined}
          variant="dark"
          delay={0.04}
        />
        <StatCard
          label="This Month"
          value={loading ? '...' : monthBookings}
          sub="Monthly total"
          icon={<Calendar size={16} />}
          loading={loading}
          variant="dark"
          delay={0.08}
        />
        <StatCard
          label="Completed"
          value={loading ? '...' : overview.completedBookings ?? 0}
          sub="Confirmed trips"
          icon={<UserCheck size={16} />}
          loading={loading}
          trend={completionRate > 0 ? { value: `${completionRate}% rate`, positive: completionRate >= 80 } : undefined}
          variant="blue"
          delay={0.12}
        />
      </div>

      {/* ── Revenue Section ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
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
                { label: 'Gross Revenue', value: revenueTotal, barColor: 'bg-zinc-1000' },
                { label: 'Platform Fees', value: revenueFees, barColor: 'bg-blue-300' },
                { label: 'Net Earnings', value: revenueNet, barColor: 'bg-blue-400' },
              ].map((item) => {
                const max = revenueTotal || 1;
                const pct = Math.min((item.value / max) * 100, 100);
                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-[var(--text)]">{item.label}</span>
                      <span className="font-semibold text-[var(--blue)]">{item.value.toLocaleString()} RWF</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${item.barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-[var(--text)]">Net margin</span>
                <span className="text-sm font-bold text-[var(--blue)]">
                  {revenueTotal > 0 ? Math.round((revenueNet / revenueTotal) * 100) : 0}%
                </span>
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
            <div className="h-[200px] flex items-center justify-center text-sm text-[var(--text)]">
              No route data
            </div>
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
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  wrapperStyle={{
                    borderRadius: 6,
                    border: '1px solid #4b5563',
                    background: '#1f2937',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="count" fill="#1D4ED8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Bottom Row: Recent Activity + Bookings Table ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Feed */}
        <div className="bg-[#F9FAFB] rounded-md p-6">
          <h3 className="text-sm font-bold text-zinc-950 mb-5 flex items-center gap-2">
            <Bell size={15} className="text-[var(--blue)]" /> Recent Activity
          </h3>
          {latestActivity.length === 0 ? (
            <div className="py-8 text-center text-sm text-[var(--text-sub)]">No recent activity</div>
          ) : (
            <div className="space-y-4">
              {latestActivity.map((n: any, i: number) => {
                const Icon = ACTIVITY_ICONS[n.type]?.icon || ACTIVITY_ICONS.booking_created.icon;
                return (
                  <div key={n._id || i} className="flex mt-5 bg-[#F3F4F6] p-2 rounded-md items-start gap-3">
                    <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 bg-white/10">
                      <Icon size={14} className="text-blue-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[var(--text)] leading-snug">{n.title || n.message || n.type}</p>
                      <p className="text-xs text-[var(--text-sub)] mt-0.5">
                        {n.createdAt ? timeAgo(n.createdAt) : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Bookings Table */}
        <div className="lg:col-span-2 bg-white rounded-md border border-[var(--border)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between flex-wrap gap-3 bg-[#F9FAFB]">
            <h3 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
              <Ticket size={15} className="text-[var(--blue)]" /> Recent Bookings
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)]">Rows:</span>
              <div className="flex rounded-md overflow-hidden">
                {PAGE_SIZES.map(size => (
                  <button
                    key={size}
                    onClick={() => setPageSize(size)}
                    className={`h-7 px-2.5 text-xs font-medium cursor-pointer border-none transition-colors ${
                      pageSize === size
                        ? 'bg-[var(--blue)] text-white'
                        : 'bg-zinc-700 text-[var(--text-muted)] hover:bg-zinc-600'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9FAFB]">
                  {['Ref', 'Passenger', 'Phone', 'Passengers', 'Route', 'Date', 'Time', 'Amount', 'Status'].map(h => (
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
                {bookingsLoading ? (
                  Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-6 py-3">
                          <div className="h-4 bg-[#F9FAFB] rounded w-4/5 animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-sm text-[var(--text-muted)]">
                      No bookings yet
                    </td>
                  </tr>
                ) : (
                  bookings.map((b: any) => (
                    <tr key={b._id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="px-6 py-3 font-mono text-xs font-bold text-[var(--blue)]">
                        {b.referenceCode}
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
                        {b.pickupPoint
                          ? `${b.origin} → ${b.pickupPoint}`
                          : b.origin}{' '}
                        → {b.destination}{viaLabel(b.route?.via)}
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
                        <span
                          className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md ${statusClass(b.status)}`}
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
          <Pagination
            page={page}
            totalPages={totalPages}
            total={totalBookings}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}