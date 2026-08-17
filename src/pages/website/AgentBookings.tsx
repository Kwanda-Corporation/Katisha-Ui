import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, Search, TicketCheck, Calendar, Loader, Activity, RefreshCw, Ticket,
} from 'lucide-react';
import { useTranslation } from '../../../node_modules/react-i18next';
import { api } from '../../api';
import { viaLabel } from '../../utils/via';

function parseLocalDate(iso: string): Date | null {
  if (!iso) return null;
  const bare = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (bare) return new Date(Number(bare[1]), Number(bare[2]) - 1, Number(bare[3]));
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
import { useSocket } from '../../contexts/SocketContext';
import { useNotificationSound } from '../../Hooks/useNotificationSound';
import { usePushNotifications } from '../../Hooks/usePushNotifications';
import { Pagination } from '../../components/ui';

export default function AgentBookings() {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('confirmed');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [stats, setStats] = useState({ totalConfirmed: 0, todayConfirmed: 0, todayIssued: 0 });
  const [issuingId, setIssuingId] = useState<string | null>(null);
  const [newBookingSound, setNewBookingSound] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const { socket } = useSocket();
  const { playNotificationSequence } = useNotificationSound();
  const { showNotification, requestPermission } = usePushNotifications();

  useEffect(() => { requestPermission(); }, [requestPermission]);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      params.page = String(page);
      params.limit = '20';
      const res = await api.getAgentBookings(params);
      setBookings(res.data?.bookings || []);
      setTotal(res.data?.total || 0);
      setPages(res.data?.pages || 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  const loadStats = useCallback(async () => {
    try {
      const res = await api.getAgentDashboard();
      const s = res.data?.stats;
      if (s) {
        setStats({
          totalConfirmed: s.totalConfirmed || 0,
          todayConfirmed: s.todayConfirmed || 0,
          todayIssued: s.todayIssued || 0,
        });
      }
    } catch {}
  }, []);

  const handleIssue = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIssuingId(id);
    try {
      await api.issueBooking(id);
      await loadBookings();
      await loadStats();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIssuingId(null);
    }
  };

  useEffect(() => { setPage(1); }, [statusFilter]);

  useEffect(() => {
    loadBookings();
    loadStats();
  }, [loadBookings, loadStats]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadBookings();
      loadStats();
    }, 60000);
    return () => clearInterval(interval);
  }, [loadBookings, loadStats]);

  useEffect(() => {
    if (!socket) return;
    const onNewBooking = () => {
      loadBookings();
      loadStats();
      playNotificationSequence();
      showNotification('New Booking', 'A new booking has been received!', 'new-booking');
      setNewBookingSound(true);
      setTimeout(() => setNewBookingSound(false), 3000);
    };
    const onStatusUpdate = () => {
      loadBookings();
      loadStats();
      playNotificationSequence();
    };
    const onNewNotification = () => {
      playNotificationSequence();
    };
    socket.on('new_booking', onNewBooking);
    socket.on('booking_confirmed', onStatusUpdate);
    socket.on('booking_rejected', onStatusUpdate);
    socket.on('booking_cancelled', onStatusUpdate);
    socket.on('new_notification', onNewNotification);
    return () => {
      socket.off('new_booking', onNewBooking);
      socket.off('booking_confirmed', onStatusUpdate);
      socket.off('booking_rejected', onStatusUpdate);
      socket.off('booking_cancelled', onStatusUpdate);
      socket.off('new_notification', onNewNotification);
    };
  }, [socket, loadBookings, loadStats, playNotificationSequence, showNotification]);

  const filteredBookings = bookings.filter(b =>
    b.referenceCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.passengerDetails?.some((p: any) => p.name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      confirmed: 'bg-[var(--blue)] text-white',
      issued: 'bg-zinc-100 text-zinc-800',
      pending: 'bg-amber-50 text-amber-700',
      rejected: 'bg-[#F9FAFB] text-[var(--text-sub)]',
      cancelled: 'bg-[#F9FAFB] text-[var(--text-sub)]',
    };
    return map[status] || map.confirmed;
  };

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-zinc-950">{t('agent.dashboard')}</span>
          </h1>
          <p className="text-sm text-[var(--text-sub)] mt-1">{t('dashboard.recentBookings')}</p>
        </div>
        <button
          onClick={() => { loadBookings(); loadStats(); }}
          className="h-9 px-4 rounded-md border border-[var(--border)] text-sm font-medium flex items-center gap-2 cursor-pointer bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-colors text-zinc-700"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── New booking alert ──────────────────────────────────────── */}
      <AnimatePresence>
        {newBookingSound && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="px-4 py-3 bg-[var(--blue-light)] border border-[var(--border)] rounded-md flex items-center gap-3"
          >
            <span className="w-2 h-2 rounded-full bg-[var(--blue)] animate-pulse" />
            <span className="text-sm font-semibold text-[var(--blue-dark)]">{t('dashboard.newBooking')}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="px-4 py-3 bg-[#F9FAFB] border border-[var(--border)] rounded-md">
          <p className="text-xs text-[var(--text-sub)]">{error}</p>
        </div>
      )}

      {/* ── Today's Operations ─────────────────────────────────────── */}
      <div className="bg-[#F9FAFB] rounded-md p-6">
        <h3 className="text-sm font-bold text-zinc-950 mb-4 flex items-center gap-2">
          <Activity size={15} className="text-[var(--blue)]" /> Today's Operations
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            { label: t('status.confirmed'), value: stats.totalConfirmed, icon: Check, bg: 'bg-[var(--blue)]' },
            { label: t('dashboard.todayBookings'), value: stats.todayConfirmed, icon: Calendar, bg: 'bg-[var(--blue)]' },
            { label: t('status.issued'), value: stats.todayIssued, icon: TicketCheck, bg: 'bg-zinc-700' },
          ].map(item => (
            <div key={item.label} className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-md ${item.bg} flex items-center justify-center shrink-0`}>
                <item.icon size={16} className="text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-zinc-950 tracking-tight">{item.value}</p>
                <p className="text-xs text-[var(--text-muted)]">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('agent.searchBooking')}
            className="w-full h-10 pl-9 pr-4 rounded-md border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--blue)]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {['all', 'confirmed', 'issued', 'rejected', 'cancelled'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`h-9 px-4 rounded-md text-sm font-medium transition-colors cursor-pointer border ${
                statusFilter === s ? 'bg-[var(--blue)] text-white border-[var(--blue)]' : 'bg-white text-[var(--text-sub)] border-[var(--border)] hover:border-[var(--blue)]'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Recent Bookings table ──────────────────────────────────── */}
      <div className="bg-white rounded-md border border-[var(--border)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between flex-wrap gap-3 bg-[#F9FAFB]">
          <h3 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
            <Ticket size={15} className="text-[var(--blue)]" /> Recent Bookings
          </h3>
          <span className="text-xs text-[var(--text-muted)]">{total} {t('booking.booking')}{total !== 1 ? 's' : ''}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F9FAFB]">
                {['Ref', 'Passenger', 'Phone', 'Passengers', 'Route', 'Date', 'Time', 'Amount', 'Status', 'Action'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-sub)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 10 }).map((_, j) => (
                        <td key={j} className="px-6 py-3">
                          <div className="h-4 bg-[#F9FAFB] rounded w-4/5 animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-sm text-[var(--text-muted)]">{t('booking.noBookings')}</td>
                  </tr>
              ) : (
                filteredBookings.map(b => (
                  <tr key={b._id} className="hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                    onClick={() => { setSelectedBooking(b); setShowDetailModal(true); }}
                  >
                    <td className="px-6 py-3 font-mono text-xs font-bold text-[var(--blue)]">{b.referenceCode}</td>
                    <td className="px-6 py-3 text-sm text-zinc-700">{b.user?.name || b.passengerDetails?.[0]?.name || b.guestName || 'Guest'}</td>
                    <td className="px-6 py-3 text-sm text-[var(--text-sub)]">{b.contactPhone || b.passengerDetails?.[0]?.phone || b.guestPhone || b.user?.phone || '—'}</td>
                    <td className="px-6 py-3 text-sm text-zinc-700">{b.seats}</td>
                    <td className="px-6 py-3 text-sm text-[var(--text-sub)]">
                      {b.pickupPoint ? `${b.origin} → ${b.pickupPoint}` : b.origin} → {b.destination}{viaLabel(b.route?.via)}
                    </td>
                    <td className="px-6 py-3 text-sm text-[var(--text-sub)]">{parseLocalDate(b.travelDate)?.toLocaleDateString() || '—'}</td>
                    <td className="px-6 py-3 text-sm text-[var(--text-sub)]">{b.travelTime}</td>
                    <td className="px-6 py-3 text-sm font-semibold text-zinc-950">{((b.totalAmount || 0) + (b.systemFee || 0)).toLocaleString()} RWF</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md ${statusBadge(b.status)}`}>{b.status}</span>
                    </td>
                    <td className="px-6 py-3">
                      {b.status === 'confirmed' && (
                        <button
                          onClick={e => handleIssue(b._id, e)}
                          disabled={issuingId === b._id}
                          className="h-8 px-3 rounded-md bg-[var(--blue)] text-white text-xs font-semibold cursor-pointer border-none flex items-center gap-1.5 transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                          {issuingId === b._id ? <Loader size={12} className="animate-spin" /> : <TicketCheck size={12} />}
                          {t('agent.markIssued')}
                        </button>
                      )}
                      {b.status === 'issued' && (
                        <span className="text-xs text-[var(--blue)] flex items-center gap-1.5">
                          <TicketCheck size={12} /> {t('status.issued')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={pages} total={total} onPageChange={setPage} />
      </div>

      {/* ── Booking detail modal ───────────────────────────────────── */}
      <AnimatePresence>
        {showDetailModal && selectedBooking && (
          <Modal onClose={() => setShowDetailModal(false)}>
            <div className="mb-4">
              <h3 className="text-lg font-bold text-[var(--text)]">{t('booking.viewDetails')}</h3>
              <p className="text-xs text-[var(--text-sub)] mt-1">{selectedBooking.referenceCode}</p>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="px-3 py-2 bg-[#F9FAFB] rounded-md">
                  <p className="text-[10px] font-bold uppercase text-[var(--text-sub)] tracking-wider">{t('common.status')}</p>
                  <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-md border text-xs font-semibold ${statusBadge(selectedBooking.status)}`}>{selectedBooking.status}</span>
                </div>
                <div className="px-3 py-2 bg-[#F9FAFB] rounded-md">
                  <p className="text-[10px] font-bold uppercase text-[var(--text-sub)] tracking-wider">{t('booking.totalAmount')}</p>
                  <p className="text-sm font-bold text-[var(--text)] mt-0.5">
                    {((selectedBooking.totalAmount || 0) + (selectedBooking.systemFee || 0)).toLocaleString()} RWF
                  </p>
                  <p className="text-xs text-[var(--text-sub)] mt-0.5">
                    Ticket {selectedBooking.totalAmount?.toLocaleString()} RWF
                    {selectedBooking.systemFee > 0 && ` + Fee ${selectedBooking.systemFee?.toLocaleString()} RWF`}
                  </p>
                </div>
              </div>
              <div className="px-3 py-2 bg-[#F9FAFB] rounded-md">
                <p className="text-[10px] font-bold uppercase text-[var(--text-sub)] tracking-wider">{t('booking.route')}</p>
                <p className="text-sm font-semibold text-[var(--text)] mt-0.5">
                  {selectedBooking.origin} → {selectedBooking.destination}{viaLabel(selectedBooking.route?.via)}
                </p>
                {selectedBooking.pickupPoint && (
                  <p className="text-xs text-[var(--text-sub)] mt-0.5">{t('booking.pickupPoint')}: {selectedBooking.pickupPoint}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="px-3 py-2 bg-[#F9FAFB] rounded-md">
                  <p className="text-[10px] font-bold uppercase text-[var(--text-sub)] tracking-wider">{t('booking.date')}</p>
                  <p className="text-sm font-semibold text-[var(--text)] mt-0.5">{parseLocalDate(selectedBooking.travelDate)?.toLocaleDateString() || '—'}</p>
                </div>
                <div className="px-3 py-2 bg-[#F9FAFB] rounded-md">
                  <p className="text-[10px] font-bold uppercase text-[var(--text-sub)] tracking-wider">{t('booking.time')}</p>
                  <p className="text-sm font-semibold text-[var(--text)] mt-0.5">{selectedBooking.travelTime}</p>
                </div>
              </div>
              <div className="px-3 py-2 bg-[#F9FAFB] rounded-md">
                <p className="text-[10px] font-bold uppercase text-[var(--text-sub)] tracking-wider">{t('booking.passenger')}</p>
                <p className="text-sm font-semibold text-[var(--text)] mt-0.5">
                  {selectedBooking.user?.name || selectedBooking.passengerDetails?.[0]?.name || selectedBooking.guestName || 'Guest'}
                </p>
                <p className="text-xs text-[var(--text-sub)]">
                  {selectedBooking.contactPhone || selectedBooking.passengerDetails?.[0]?.phone || selectedBooking.guestPhone || selectedBooking.user?.phone}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="px-3 py-2 bg-[#F9FAFB] rounded-md">
                  <p className="text-[10px] font-bold uppercase text-[var(--text-sub)] tracking-wider">{t('booking.seats')}</p>
                  <p className="text-sm font-semibold text-[var(--text)] mt-0.5">{selectedBooking.seats}</p>
                </div>
                {selectedBooking.seatNumbers?.length > 0 && (
                  <div className="px-3 py-2 bg-[#F9FAFB] rounded-md">
                    <p className="text-[10px] font-bold uppercase text-[var(--text-sub)] tracking-wider">Seat Numbers</p>
                    <p className="text-sm font-semibold text-[var(--text)] mt-0.5">
                      {selectedBooking.seatNumbers.join(', ')}
                    </p>
                  </div>
                )}
              </div>
              {selectedBooking.isBulkBooking && (
                <div className="px-3 py-2 bg-emerald-50 rounded-md border border-emerald-200">
                  <p className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider">Bulk Booking</p>
                  <p className="text-sm font-semibold text-emerald-800 mt-0.5">{selectedBooking.purpose || '—'}</p>
                  {selectedBooking.pickupDistrict && (
                    <p className="text-xs text-emerald-600 mt-0.5">
                      Pickup District: {selectedBooking.pickupDistrict}
                      {selectedBooking.pickupDescription ? ` — ${selectedBooking.pickupDescription}` : ''}
                    </p>
                  )}
                  {selectedBooking.contactPhone && (
                    <p className="text-xs text-emerald-600 mt-0.5">Contact: {selectedBooking.contactPhone}</p>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setShowDetailModal(false)} className="h-10 px-6 rounded-md bg-[var(--blue)] text-white text-sm font-semibold cursor-pointer border-none">{t('common.close')}</button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-md p-6 w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
