import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Filter, Calendar, ChevronDown, Download, RefreshCw, Loader2,
  Ticket, CheckCircle, XCircle, Clock, RotateCcw, TrendingUp, ChevronLeft, ChevronRight,
  Eye, X,
} from 'lucide-react';
import { api, resolveImageUrl } from '../../api';
import { downloadImage } from '../../utils/downloadImage';
import { PageHeader, StatCard } from '../../components/ui';

export default function BookingsManagementPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [proofBooking, setProofBooking] = useState<any>(null);
  const itemsPerPage = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;
      const res = await api.getAgencyBookings(params);
      setBookings(res.data?.bookings || []);
    } catch {} finally {
      setLoading(false);
    }
  }, [statusFilter, dateFilter]);

  useEffect(() => { setPage(1); }, [statusFilter, dateFilter, search]);
  useEffect(() => { load(); }, [load]);

  const filtered = bookings.filter(b => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.referenceCode?.toLowerCase().includes(q) ||
      b.origin?.toLowerCase().includes(q) ||
      b.destination?.toLowerCase().includes(q) ||
      b.user?.name?.toLowerCase().includes(q)
    );
  });

  const totalAmount = filtered.reduce((s, b) => s + (b.totalAmount || 0), 0);
  const pendingCount = filtered.filter(b => b.status === 'pending').length;
  const confirmedCount = filtered.filter(b => b.status === 'confirmed').length;
  const rejectedCount = filtered.filter(b => b.status === 'rejected' || b.status === 'cancelled').length;

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) params.startDate = dateFilter;
      if (dateFilter) params.endDate = dateFilter;
      if (search) params.search = search;
      await api.exportAgencyReport(params);
    } catch (err: any) {
      alert(err.message || 'Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-[#F9FAFB] text-[var(--text-sub)]',
      confirmed: 'bg-blue-600 text-white',
      issued: 'bg-emerald-600 text-white',
      rejected: 'bg-[#F9FAFB] text-[var(--text-sub)]',
      cancelled: 'bg-[#F9FAFB] text-[var(--text-sub)]',
    };
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md ${styles[status] || 'bg-[#F9FAFB] text-[var(--text-sub)]'}`}>
        {status === 'pending' && <Clock size={10} />}
        {status === 'confirmed' && <CheckCircle size={10} />}
        {status === 'issued' && <Ticket size={10} />}
        {status === 'rejected' && <XCircle size={10} />}
        {status === 'cancelled' && <RotateCcw size={10} />}
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Bookings"
        subtitle="Manage and monitor all agency bookings"
        actions={
          <div className="flex gap-2">
            <button onClick={load}
              className="h-9 px-4 rounded-md border border-[var(--border)] text-sm font-medium flex items-center gap-2 cursor-pointer bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-colors text-zinc-700"
            ><RefreshCw size={14} /> Refresh</button>
            <button onClick={handleExportExcel} disabled={exporting || !filtered.length}
              className="h-9 px-4 rounded-md border border-[var(--border)] text-sm font-medium flex items-center gap-2 cursor-pointer bg-[#F9FAFB] hover:bg-[#F3F4F6] disabled:opacity-50 transition-all text-zinc-700"
            >{exporting ? <><Loader2 size={14} className="animate-spin" /> Exporting...</> : <><Download size={14} /> Export Report</>}</button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Total" value={loading ? '...' : filtered.length} sub="Filtered bookings" icon={<Ticket size={16} />} loading={loading} variant="blue" />
        <StatCard label="Pending" value={loading ? '...' : pendingCount} sub="Awaiting confirmation" icon={<Clock size={16} />} loading={loading} variant="dark" />
        <StatCard label="Confirmed" value={loading ? '...' : confirmedCount} sub="Approved" icon={<CheckCircle size={16} />} loading={loading} variant="blue" />
        <StatCard label="Rejected" value={loading ? '...' : rejectedCount} sub="Cancelled/Rejected" icon={<XCircle size={16} />} loading={loading} variant="dark" />
      </div>

      <div className="bg-white rounded-md border border-[var(--border)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)] flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-[#F9FAFB]">
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search bookings..."
                className="h-9 pl-9 pr-3 rounded-md border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--blue)] w-48"
              />
            </div>
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="h-9 pl-9 pr-8 rounded-md border border-[var(--border)] text-sm font-medium bg-white appearance-none cursor-pointer focus:outline-none focus:border-[var(--blue)]"
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="issued">Issued</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            </div>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
              <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
                className="h-9 pl-9 pr-3 rounded-md border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--blue)]"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--text-sub)]">
            <TrendingUp size={13} />
            <span className="font-semibold text-zinc-700">{totalAmount.toLocaleString()} RWF</span>
            <span className="text-[var(--text-muted)]">|</span>
            <span>{filtered.length} booking{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F9FAFB]">
                {['Ref', 'Passenger', 'Route', 'Date', 'Time', 'Amount', 'Agent', 'Proof', 'Status'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-sub)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 9 }).map((_, j) => (
                    <td key={j} className="px-6 py-3"><div className="h-4 bg-[#F9FAFB] rounded w-4/5 animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : paginated.length === 0 ? (
                <tr><td colSpan={9} className="py-12 text-center">
                  <Ticket size={28} className="mx-auto text-[var(--text-muted)] mb-2" />
                  <p className="text-sm text-[var(--text-muted)]">No bookings found</p>
                </td></tr>
              ) : paginated.map((b, i) => (
                <motion.tr key={b._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.02 * i }}
                  className="hover:bg-[#F9FAFB] transition-colors"
                >
                  <td className="px-6 py-3 font-mono text-xs font-bold text-[var(--blue)]">{b.referenceCode}</td>
                  <td className="px-6 py-3">
                    <div className="text-sm font-medium text-zinc-950">{b.user?.name || 'Guest'}</div>
                    {(b.contactPhone || b.passengerDetails?.[0]?.phone || b.guestPhone || b.user?.phone) && <div className="text-xs text-[var(--text-muted)]">{b.contactPhone || b.passengerDetails?.[0]?.phone || b.guestPhone || b.user?.phone}</div>}
                  </td>
                  <td className="px-6 py-3 text-sm text-[var(--text-sub)]">
                    {b.pickupPoint
                      ? <>{b.origin}<span className="text-[var(--text-muted)] mx-1">→</span>{b.pickupPoint}<span className="text-[var(--text-muted)] mx-1">→</span></>
                      : <>{b.origin}<span className="text-[var(--text-muted)] mx-1">→</span></>
                    }{b.destination}
                  </td>
                  <td className="px-6 py-3 text-sm text-[var(--text-sub)]">{new Date(b.travelDate).toLocaleDateString()}</td>
                  <td className="px-6 py-3 text-sm text-[var(--text-sub)]">{b.travelTime}</td>
                  <td className="px-6 py-3 text-sm font-semibold text-zinc-950">{b.totalAmount?.toLocaleString()} RWF</td>
                  <td className="px-6 py-3 text-sm text-[var(--text-sub)]">
                    {b.handledBy?.name || b.confirmedBy?.name || b.rejectedBy?.name || <span className="text-[var(--text-muted)]">—</span>}
                  </td>
                  <td className="px-6 py-3">
                    {b.ticketProofImage ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setProofBooking(b)}
                          className="h-7 px-2 rounded-md border border-[var(--border)] text-xs font-medium flex items-center gap-1 cursor-pointer bg-white hover:bg-[#F3F4F6] text-zinc-700"
                          title="View ticket photo"
                        >
                          <Eye size={12} /> View
                        </button>
                        <button
                          onClick={() => {
                            const url = resolveImageUrl(b.ticketProofImage);
                            if (url) downloadImage(url, `ticket-proof-${b.referenceCode}.jpg`);
                          }}
                          className="h-7 w-7 rounded-md border border-[var(--border)] flex items-center justify-center cursor-pointer bg-white hover:bg-[#F3F4F6] text-zinc-700"
                          title="Download proof"
                        >
                          <Download size={12} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-[var(--text-muted)]">Not uploaded</span>
                    )}
                  </td>
                  <td className="px-6 py-3">{statusBadge(b.status)}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-[var(--border)] flex items-center justify-between text-sm text-[var(--text-muted)]">
          <div className="flex items-center gap-4">
            <span>Showing {Math.min(itemsPerPage, filtered.length - (safePage - 1) * itemsPerPage)} of {filtered.length} booking{filtered.length !== 1 ? 's' : ''}</span>
            <span>Total revenue: <strong className="text-zinc-700">{totalAmount.toLocaleString()} RWF</strong></span>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}
                className="h-7 w-7 flex items-center justify-center rounded-sm border border-[var(--border)] hover:bg-[#F9FAFB] disabled:opacity-30 cursor-pointer disabled:cursor-default bg-white"
              ><ChevronLeft size={13} /></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`h-7 min-w-[28px] px-1 flex items-center justify-center rounded-sm text-xs font-semibold cursor-pointer border-none ${
                    p === safePage ? 'bg-[var(--blue)] text-white' : 'text-[var(--text-sub)] hover:bg-[#F9FAFB]'
                  }`}
                >{p}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
                className="h-7 w-7 flex items-center justify-center rounded-sm border border-[var(--border)] hover:bg-[#F9FAFB] disabled:opacity-30 cursor-pointer disabled:cursor-default bg-white"
              ><ChevronRight size={13} /></button>
            </div>
          )}
        </div>
      </div>

      {proofBooking && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setProofBooking(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg w-full max-w-lg overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <div>
                <h3 className="text-sm font-bold text-zinc-950">Ticket photo proof</h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {proofBooking.referenceCode} · {proofBooking.origin} → {proofBooking.destination}
                </p>
              </div>
              <button
                onClick={() => setProofBooking(null)}
                className="h-8 w-8 rounded-md flex items-center justify-center cursor-pointer hover:bg-[#F3F4F6] text-zinc-600"
              >
                <X size={16} />
              </button>
            </div>
            <div className="bg-[#F9FAFB] p-4 max-h-[65vh] overflow-auto">
              <img
                src={resolveImageUrl(proofBooking.ticketProofImage)}
                alt={`Ticket proof ${proofBooking.referenceCode}`}
                className="w-full rounded-md border border-[var(--border)] bg-white"
              />
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-[var(--border)]">
              <button
                onClick={() => {
                  const url = resolveImageUrl(proofBooking.ticketProofImage);
                  if (url) downloadImage(url, `ticket-proof-${proofBooking.referenceCode}.jpg`);
                }}
                className="h-9 px-4 rounded-md bg-[var(--blue)] text-white text-sm font-semibold flex items-center gap-2 cursor-pointer border-none"
              >
                <Download size={14} /> Download proof
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
