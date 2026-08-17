import { useEffect, useState, useCallback } from 'react';
import {
  Download, RefreshCw, TrendingUp, Calendar, Ticket,
  Clock, CheckCircle, XCircle, ChevronLeft, ChevronRight, Loader2,
} from 'lucide-react';
import { api } from '../../api';
import { PageHeader, StatCard } from '../../components/ui';

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7' | '30'>('30');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportPage, setReportPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const reportPerPage = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await api.getAgencyAnalytics(params);
      if (res.data) setData(res.data);
    } catch {} finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  const overview = data?.overview || {};
  const revenue = data?.revenue || {};
  const statusBrk = data?.statusBreakdown || {};
  const dailySeries = data?.dailySeries || [];
  const recentBookings = data?.recentBookings || [];

  const maxDays = parseInt(period);
  const filteredSeries = dailySeries.slice(-maxDays);

  const maxCount = Math.max(...filteredSeries.map((d: any) => d.count), 1);

  const totalReportPages = Math.ceil(recentBookings.length / reportPerPage) || 1;
  const safeReportPage = Math.min(reportPage, totalReportPages);
  const paginatedReports = recentBookings.slice((safeReportPage - 1) * reportPerPage, safeReportPage * reportPerPage);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      await api.exportAgencyReport(params);
    } catch (err: any) {
      alert(err.message || 'Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  const formatRWF = (n: number) => `${(n || 0).toLocaleString()} RWF`;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports"
        subtitle="Agency booking and revenue reports"
        actions={
          <div className="flex gap-2">
            <button onClick={load}
              className="h-9 px-4 rounded-md border border-[var(--border)] text-sm font-medium flex items-center gap-2 cursor-pointer bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-colors text-zinc-700"
            ><RefreshCw size={14} /> Refresh</button>
            <button onClick={handleExportExcel} disabled={exporting || loading}
              className="h-9 px-4 rounded-md border border-[var(--border)] text-sm font-medium flex items-center gap-2 cursor-pointer bg-[#F9FAFB] hover:bg-[#F3F4F6] disabled:opacity-50 transition-all text-zinc-700"
            >{exporting ? <><Loader2 size={14} className="animate-spin" /> Exporting...</> : <><Download size={14} /> Export Excel Report</>}</button>
          </div>
        }
      />

      {/* Date Filter Bar */}
      <div className="bg-white rounded-md border border-[var(--border)] p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-[var(--text-muted)]" />
          <span className="text-sm font-medium text-[var(--text-sub)]">Filter by date:</span>
        </div>
        <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setReportPage(1); }}
          className="h-9 px-3 rounded-md border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--blue)]"
        />
        <span className="text-sm text-[var(--text-muted)]">to</span>
        <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setReportPage(1); }}
          className="h-9 px-3 rounded-md border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--blue)]"
        />
        {(startDate || endDate) && (
          <button onClick={() => { setStartDate(''); setEndDate(''); setReportPage(1); }}
            className="h-9 px-3 rounded-md border border-[var(--border)] text-sm text-[var(--text-sub)] hover:bg-[#F9FAFB] cursor-pointer bg-white"
          >Clear</button>
        )}
        <div className="ml-auto flex gap-1">
          <button onClick={() => setPeriod('7')}
            className={`px-3 py-1.5 rounded-sm text-xs font-semibold transition-all cursor-pointer border-none ${
              period === '7' ? 'bg-[var(--blue)] text-white' : 'bg-zinc-700 text-[var(--text-muted)] hover:bg-zinc-600'
            }`}
          >7D</button>
          <button onClick={() => setPeriod('30')}
            className={`px-3 py-1.5 rounded-sm text-xs font-semibold transition-all cursor-pointer border-none ${
              period === '30' ? 'bg-[var(--blue)] text-white' : 'bg-zinc-700 text-[var(--text-muted)] hover:bg-zinc-600'
            }`}
          >30D</button>
        </div>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Agency Revenue" value={loading ? '...' : formatRWF(revenue.netRevenue)} sub="Your earnings" icon={<TrendingUp size={16} />} loading={loading} variant="blue" />
        <StatCard label="Total Bookings" value={loading ? '...' : overview.totalBookings} sub="All bookings" icon={<Ticket size={16} />} loading={loading} variant="dark" />
        <StatCard label="Completed" value={loading ? '...' : statusBrk.confirmed} sub="Confirmed trips" icon={<CheckCircle size={16} />} loading={loading} variant="dark" />
        <StatCard label="Cancelled" value={loading ? '...' : statusBrk.cancelled} sub="Cancelled trips" icon={<XCircle size={16} />} loading={loading} variant="dark" />
      </div>

      {/* Period Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard label="Today" value={loading ? '...' : overview.dayBookings} sub={`${formatRWF(revenue.dayRevenue)} revenue`} icon={<Calendar size={16} />} loading={loading} variant="blue" />
        <StatCard label="This Week" value={loading ? '...' : overview.weekBookings} sub={`${formatRWF(revenue.weekRevenue)} revenue`} icon={<Calendar size={16} />} loading={loading} variant="dark" />
        <StatCard label="This Month" value={loading ? '...' : overview.monthBookings} sub={`${formatRWF(revenue.monthRevenue)} revenue`} icon={<Calendar size={16} />} loading={loading} variant="dark" />
      </div>

      {/* Status Breakdown */}
      <div className="bg-[#F9FAFB] rounded-md p-6">
        <h3 className="text-sm font-bold text-zinc-950 mb-4 flex items-center gap-2">
          <CheckCircle size={15} className="text-blue-400" /> Status Breakdown
        </h3>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Pending', value: statusBrk.pending, icon: Clock, color: 'text-[var(--text-sub)]' },
            { label: 'Confirmed', value: statusBrk.confirmed, icon: CheckCircle, color: 'text-[var(--blue)]' },
            { label: 'Rejected', value: statusBrk.rejected, icon: XCircle, color: 'text-[var(--text-sub)]' },
            { label: 'Cancelled', value: statusBrk.cancelled, icon: XCircle, color: 'text-[var(--text-muted)]' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <s.icon size={20} className={`mx-auto mb-2 ${s.color}`} />
              <p className="text-2xl font-bold text-zinc-950">{s.value ?? 0}</p>
              <p className="text-xs font-medium text-[var(--text-sub)] uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Booking Trends */}
      <div className="bg-[#F9FAFB] rounded-md p-6">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
            <TrendingUp size={15} className="text-blue-400" /> Booking Trends
          </h3>
          <p className="text-xs text-[var(--text-sub)] mt-1">Daily booking volume (last {period} days)</p>
        </div>
        <div className="flex items-end gap-1.5 h-32">
          {loading ? (
            Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex-1 bg-[#F9FAFB] rounded-t animate-pulse" style={{ height: `${20 + Math.random() * 60}%` }} />
            ))
          ) : filteredSeries.length === 0 ? (
            <div className="flex-1 flex items-center justify-center h-full">
              <p className="text-xs text-[var(--text-sub)]">No data yet</p>
            </div>
          ) : filteredSeries.map((d: any) => (
            <div key={d._id} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[9px] font-semibold text-[var(--text-sub)]">{d.count}</span>
              <div
                className="w-full bg-zinc-1000/20 rounded-t hover:bg-zinc-1000/40 transition-all cursor-pointer relative group"
                style={{ height: `${(d.count / maxCount) * 100}%`, minHeight: 4 }}
                title={`${d._id}: ${d.count} bookings, ${formatRWF(d.revenue)}`}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  {d.count} bookings<br />{formatRWF(d.revenue)}
                </div>
              </div>
              <span className="text-[8px] text-[var(--text-sub)] truncate w-full text-center">
                {new Date(d._id).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-md border border-[var(--border)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[#F9FAFB]">
          <div className="flex items-center gap-2">
            <Ticket size={15} className="text-[var(--blue)]" />
            <h3 className="text-sm font-bold text-zinc-950">Recent Bookings</h3>
            <span className="text-xs text-[var(--text-muted)]">— Latest {recentBookings.length} bookings</span>
          </div>
          <span className="text-xs text-[var(--text-muted)]">{recentBookings.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F9FAFB]">
                {['Ref', 'Passenger', 'Route', 'Date', 'Amount', 'Agent', 'Status'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-sub)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-6 py-3"><div className="h-4 bg-[#F9FAFB] rounded w-4/5 animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : paginatedReports.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-sm text-[var(--text-muted)]">No bookings yet</td></tr>
              ) : paginatedReports.map((b: any) => (
                <tr key={b._id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="px-6 py-3 font-mono text-xs font-bold text-[var(--blue)]">{b.referenceCode}</td>
                  <td className="px-6 py-3 text-sm text-zinc-700">{b.user?.name || 'Guest'}</td>
                  <td className="px-6 py-3 text-sm text-[var(--text-sub)]">{b.pickupPoint ? `${b.origin} → ${b.pickupPoint}` : b.origin} → {b.destination}</td>
                  <td className="px-6 py-3 text-sm text-[var(--text-sub)]">{new Date(b.travelDate || b.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-3 text-sm font-semibold text-zinc-950">{b.totalAmount?.toLocaleString()} RWF</td>
                  <td className="px-6 py-3 text-sm text-[var(--text-sub)]">
                    {b.handledBy?.name || b.confirmedBy?.name || b.rejectedBy?.name || <span className="text-[var(--text-muted)]">—</span>}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md ${
                      b.status === 'confirmed' ? 'bg-blue-600 text-white' :
                      b.status === 'rejected' || b.status === 'cancelled' ? 'bg-[#F9FAFB] text-[var(--text-sub)]' :
                      'bg-[#F9FAFB] text-[var(--text-sub)]'
                    }`}>{b.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalReportPages > 1 && (
          <div className="px-6 py-3 border-t border-[var(--border)] flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">Page {safeReportPage} of {totalReportPages}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setReportPage(p => Math.max(1, p - 1))} disabled={safeReportPage <= 1}
                className="h-7 w-7 flex items-center justify-center rounded border border-[var(--border)] hover:bg-[#F9FAFB] disabled:opacity-30 cursor-pointer disabled:cursor-default bg-white"
              ><ChevronLeft size={13} /></button>
              {Array.from({ length: totalReportPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setReportPage(p)}
                  className={`h-7 min-w-[28px] px-1 flex items-center justify-center rounded text-xs font-semibold cursor-pointer border-none ${
                    p === safeReportPage ? 'bg-[var(--blue)] text-white' : 'text-[var(--text-sub)] hover:bg-[#F9FAFB]'
                  }`}
                >{p}</button>
              ))}
              <button onClick={() => setReportPage(p => Math.min(totalReportPages, p + 1))} disabled={safeReportPage >= totalReportPages}
                className="h-7 w-7 flex items-center justify-center rounded border border-[var(--border)] hover:bg-[#F9FAFB] disabled:opacity-30 cursor-pointer disabled:cursor-default bg-white"
              ><ChevronRight size={13} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
