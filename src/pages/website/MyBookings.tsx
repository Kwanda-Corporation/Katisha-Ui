import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Download, Eye, Loader, AlertCircle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api, resolveImageUrl } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useOnline } from '../../contexts/OnlineContext';
import TopNav from '../../components/website/TopNav';
import SEO from '../../components/seo/SEO';
import Pagination from '../../components/ui/Pagination';
import {
  clearExpiredTickets, cacheTicketWithImage,
  getCachedTicket, getAllCachedTickets,
} from '../../services/ticketCache';
import { downloadImage } from '../../utils/downloadImage';

export default function MyBookings() {
  const { t } = useTranslation(); 
  const { isAuthenticated } = useAuth();
  const { socket } = useSocket();
  const { isOnline } = useOnline();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const autoOpenedRef = useRef(false);

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [offlineCache, setOfflineCache] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [ticketModalBooking, setTicketModalBooking] = useState<any>(null);
  const [ticketImageUrl, setTicketImageUrl] = useState<string | null>(null);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketError, setTicketError] = useState('');
  const [merchantReceiptBooking, setMerchantReceiptBooking] = useState<any>(null);

  const openMerchantReceipt = (booking: any) => {
    setMerchantReceiptBooking(booking);
  };

  const downloadMerchantReceipt = useCallback(async () => {
    const booking = merchantReceiptBooking;
    if (!booking?.merchantReceiptImage) return;
    const url = resolveImageUrl(booking.merchantReceiptImage);
    if (!url) return;
    await downloadImage(url, `katisha-receipt-${booking.referenceCode || 'receipt'}.png`);
  }, [merchantReceiptBooking]);

  // Lazily fetch ticket images for bookings that are missing one (e.g. ticket
  // generation failed at booking time). Falls back to the local cache first.
  const ensureTicketImages = useCallback(async (list: any[]) => {
    const missing = list.filter(b => b._id && !b.ticketImage);
    if (missing.length === 0) return;

    for (const b of missing) {
      try {
        const cached = await getCachedTicket(b._id);
        if (cached?.ticketImageBlob) {
          const url = URL.createObjectURL(cached.ticketImageBlob);
          setBookings(prev => prev.map(p => (p._id === b._id ? { ...p, ticketImage: url } : p)));
          continue;
        }
        if (cached?.ticketImageUrl) {
          setBookings(prev => prev.map(p => (p._id === b._id ? { ...p, ticketImage: cached.ticketImageUrl } : p)));
          continue;
        }
        const res = await api.viewTicket(b._id);
        const url = res.data?.ticket?.imageUrl;
        if (url) {
          setBookings(prev => prev.map(p => (p._id === b._id ? { ...p, ticketImage: url } : p)));
          cacheTicketWithImage(b._id, url, res.data.booking).catch(() => {});
        }
      } catch {
        // Ignore per-booking failures; the modal still works for retries.
      }
    }
  }, []);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    setOfflineCache(false);
    try {
      if (!isOnline) throw new Error('offline');
      const res = await api.getUserBookings({ page: String(page), limit: '20' });
      const list = res.data?.bookings || [];
      setBookings(list);
      setTotalPages(res.data?.pages || 1);
      ensureTicketImages(list);
    } catch (err: any) {
      // Offline (or server unreachable): fall back to locally saved tickets.
      const cached = await getAllCachedTickets().catch(() => []);
      const fromCache = cached.map(c => ({
        ...c.bookingData,
        _id: c.bookingId,
        ticketImage: c.ticketImageBlob
          ? URL.createObjectURL(c.ticketImageBlob)
          : (c.ticketImageUrl || c.bookingData?.ticketImage),
      }));
      if (cached.length > 0) {
        setBookings(fromCache);
        setOfflineCache(true);
        setTotalPages(1);
        ensureTicketImages(fromCache);
      } else if (err?.message !== 'offline') {
        console.error('Failed to load bookings:', err);
        setError(err.message || t('booking.loadError'));
        setBookings([]);
      } else {
        setBookings([]);
      }
    } finally {
      setLoading(false);
    }
  }, [t, page, isOnline, ensureTicketImages]);

  useEffect(() => {
    if (isAuthenticated) loadBookings();
  }, [isAuthenticated, loadBookings]);

  // Auto-clear expired tickets from cache on mount
  useEffect(() => {
    clearExpiredTickets().catch(() => {});
  }, []);

  // Load ticket for modal
  const loadTicketModal = useCallback(async (booking: any) => {
    setTicketModalBooking(booking);
    setTicketLoading(true);
    setTicketError('');
    setTicketImageUrl(null);
    try {
      const res = await api.viewTicket(booking._id);
      const data = res.data;
      const url = data?.ticket?.imageUrl;
      if (url) {
        setTicketImageUrl(url);
        cacheTicketWithImage(booking._id, url, data.booking).catch(() => {});
      } else {
        setTicketError('Ticket image not available');
      }
    } catch (err: any) {
      // Offline fallback: use the locally saved image (blob) if available.
      const cached = await getCachedTicket(booking._id);
      if (cached?.ticketImageBlob) {
        setTicketImageUrl(URL.createObjectURL(cached.ticketImageBlob));
      } else if (cached?.ticketImageUrl) {
        setTicketImageUrl(cached.ticketImageUrl);
      } else {
        setTicketError(err.message || 'Failed to load ticket');
      }
    } finally {
      setTicketLoading(false);
    }
  }, []);

  // Auto-open the ticket modal for a just-paid booking (deep link ?ticket=<id>),
  // then clear the param so a refresh doesn't reopen it. Download closes the modal.
  useEffect(() => {
    const ticketId = searchParams.get('ticket');
    if (!ticketId || autoOpenedRef.current || loading) return;
    const target = bookings.find(b => b._id === ticketId);
    if (!target) return;
    autoOpenedRef.current = true;
    loadTicketModal(target);
    const params = new URLSearchParams(searchParams);
    params.delete('ticket');
    setSearchParams(params, { replace: true });
  }, [bookings, loading, loadTicketModal, searchParams, setSearchParams]);

  // Download the ticket image to the user's device. Uses the shared blob-based
  // downloader so the browser saves the file instead of navigating to it (a
  // plain <a href download> is ignored for cross-origin URLs). Falls back to
  // opening the image in a new tab when the remote host blocks cross-origin
  // fetches.
  const downloadTicket = useCallback(async () => {
    const url = ticketImageUrl;
    const booking = ticketModalBooking;
    if (!url || !booking) return;
    await downloadImage(url, `ticket-${booking.referenceCode || 'ticket'}.png`);
    setTicketModalBooking(null);
    setTicketImageUrl(null);
  }, [ticketImageUrl, ticketModalBooking]);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;
    const handler = () => loadBookings();
    socket.on('booking_status', handler);
    socket.on('ticket_uploaded', handler);
    return () => {
      socket.off('booking_status', handler);
      socket.off('ticket_uploaded', handler);
    };
  }, [socket, loadBookings]);

  // Split tickets into "Today" (the one to board now) vs "Upcoming" so the
  // current ticket is never confused with later trips. Past trips stay hidden.
  const todayStr = new Date().toISOString().substring(0, 10);

  const travelDateOf = (b: any) => {
    if (!b.travelDate) return '';
    return typeof b.travelDate === 'string'
      ? b.travelDate.substring(0, 10)
      : new Date(b.travelDate).toISOString().substring(0, 10);
  };

  const byDeparture = (a: any, b: any) =>
    travelDateOf(a) < travelDateOf(b) ? -1 : travelDateOf(a) > travelDateOf(b) ? 1 : 0;

  const splitBookings = () => {
    const today: any[] = [];
    const upcoming: any[] = [];
    for (const b of bookings) {
      if (b.status === 'cancelled' || b.status === 'rejected') continue;
      const date = travelDateOf(b);
      if (!date) continue;
      if (date === todayStr) today.push(b);
      else if (date > todayStr) upcoming.push(b);
    }
    return { today: today.sort(byDeparture), upcoming: upcoming.sort(byDeparture) };
  };

  const { today: todayBookings, upcoming: upcomingBookings } = splitBookings();

  const TicketCard = ({ booking, index, isToday }: { booking: any; index: number; isToday?: boolean }) => {
    const isMerchantPending = booking.paymentChannel === 'momo_merchant' && booking.paymentStatus === 'processing';
    const displayImage = booking.ticketImage || booking.merchantReceiptImage;
    return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.5), duration: 0.3 }}
      className="group cursor-pointer mx-auto w-full max-w-[320px]"
      onClick={() => isMerchantPending ? openMerchantReceipt(booking) : loadTicketModal(booking)}
    >
      {/* Ticket image — no card, just the ticket */}
      <div className={`relative flex flex-col items-center${isToday ? ' ring-2 ring-[var(--blue)] rounded-lg' : ''}`}>
        {displayImage ? (
          <img
            src={resolveImageUrl(displayImage)}
            alt={`Ticket ${booking.referenceCode}`}
            className="w-full h-auto object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="w-full aspect-[2/3] bg-[#F9FAFB] rounded-lg"></div>
        )}
        {isToday && (
          <span className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--blue)] text-white text-[11px] font-bold shadow-md">
            <Clock size={11} className="shrink-0" />
            {t('booking.today') || 'Today'}
          </span>
        )}
        {isMerchantPending && (
          <span className="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#D97706] text-white text-[11px] font-bold shadow-md">
            <Clock size={11} className="shrink-0" />
            {t('booking.paymentUnderReview', { defaultValue: 'Payment Under Review' })}
          </span>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-lg">
          <div className="bg-white/90 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <Eye size={14} className="text-[var(--blue)]" />
            <span className="text-xs font-semibold text-zinc-700">{isMerchantPending ? (t('booking.viewReceipt') || 'View Receipt') : (t('booking.viewTicket') || 'View Ticket')}</span>
          </div>
        </div>
      </div>

      {/* Route / date / time */}
      <div className="mt-3 text-center">
        <h3 className="text-sm font-semibold text-[var(--text)] leading-snug">
          {booking.origin} <span className="text-[var(--text-muted)]">→</span> {booking.destination}
        </h3>
        <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-[var(--text-sub)]">
          <Clock size={11} className="text-[var(--text-muted)] shrink-0" />
          <span>{new Date(booking.travelDate).toLocaleDateString()}</span>
          <span className="text-[var(--text-muted)]">·</span>
          <span>{booking.travelTime}</span>
        </p>
      </div>
    </motion.div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white">
        <SEO title="My Bus Trips & Ticket History - Katisha" noindex canonical={location.pathname} />
        <TopNav />
        <main className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24 flex flex-col items-center text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">
            {t('booking.myTrips') || 'My Trips'}
          </h1>
          <p className="text-sm text-[var(--text-sub)] mt-2 mb-6 max-w-md">
            {t('booking.loginToView') || 'Please log in to view your trips.'}
          </p>
          <button
            onClick={() => navigate('/login')}
            className="h-11 px-8 rounded-lg bg-[var(--blue)] text-white text-sm font-semibold cursor-pointer border-none hover:bg-[var(--blue-dark)] transition-colors"
          >
            {t('auth.login') || 'Log In'}
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SEO title="My Bus Trips & Ticket History - Katisha" noindex canonical={location.pathname} />
      <TopNav />

      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-10 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-xl underline underline-offset-1 underline-blue-600 font-bold text-[var(--text)]">{t('booking.myTrips') || 'My Trips'}</h1>
          <p className="text-sm text-[var(--text-sub)] mt-1.5">{t('booking.manageTrips') || 'View your tickets and trip history'}</p>
        </div>

        {!isOnline && (
          <div className="flex items-center gap-2 px-3.5 py-2.5 mb-6 rounded-lg text-xs font-medium bg-[var(--blue-light)] text-[var(--blue-dark)] border border-zinc-200">
            <AlertCircle size={14} className="shrink-0" />
            <span>
              {offlineCache
                ? (t('booking.offlineSavedTickets') || "You're offline — showing tickets saved on this device.")
                : (t('booking.offlineMode') || "You're offline. Connect to the internet to load your trips.")}
            </span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader size={28} className="animate-spin text-[var(--blue)] mb-3" />
            <p className="text-sm text-[var(--text-sub)]">{t('booking.loading') || 'Loading your trips...'}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle size={40} className="text-red-400 mb-3" />
            <p className="text-sm text-[var(--text-sub)] mb-4">{error}</p>
            <button
              onClick={loadBookings}
              className="h-10 px-6 rounded-lg bg-[var(--blue)] text-white text-sm font-semibold cursor-pointer border-none hover:bg-[var(--blue-dark)] transition-colors"
            >
              {t('common.retry') || 'Try Again'}
            </button>
          </div>
        ) : todayBookings.length === 0 && upcomingBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-sm font-semibold text-zinc-700 mb-1">
              {t('booking.noUpcoming') || 'No upcoming trips'}
            </p>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              {t('booking.bookFirst') || 'Book your first trip to get started'}
            </p>
            <button
              onClick={() => navigate('/book')}
              className="h-10 px-6 rounded-lg bg-[var(--blue)] text-white text-sm font-semibold cursor-pointer border-none hover:bg-[var(--blue-dark)] transition-colors"
            >
              {t('booking.bookNow') || 'Book a Trip'}
            </button>
          </div>
        ) : (
          <div className="space-y-14">
            {todayBookings.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-lg font-bold text-[var(--text)]">
                    {t('booking.today') || 'Today'}
                  </h2>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[var(--blue)] text-white">
                    {t('booking.boardingToday') || 'Boarding today'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-10">
                  {todayBookings.map((booking, i) => (
                    <TicketCard key={booking._id} booking={booking} index={i} isToday />
                  ))}
                </div>
              </section>
            )}

            {upcomingBookings.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-lg font-bold text-[var(--text)]">
                    {t('booking.upcoming') || 'Upcoming'}
                  </h2>
                  {upcomingBookings.length > 1 && (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[var(--blue-light)] text-[var(--blue-dark)]">
                      {upcomingBookings.length}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-10">
                  {upcomingBookings.map((booking, i) => (
                    <TicketCard key={booking._id} booking={booking} index={i} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Full-screen ticket image modal */}
      <AnimatePresence>
        {ticketModalBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => { setTicketModalBooking(null); setTicketImageUrl(null); }}
          >
            {/* Close button */}
            <button
              onClick={() => { setTicketModalBooking(null); setTicketImageUrl(null); }}
              className="absolute top-4 right-4 z-50 w-10 h-10 rounded-lg bg-white/90 hover:bg-white flex items-center justify-center cursor-pointer border-none transition-colors"
            >
              <X size={20} className="text-[var(--text)]" />
            </button>

            {/* Ticket image — centered */}
            <div
              className="relative w-full max-w-lg lg:max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {ticketLoading ? (
                <div className="w-full flex flex-col items-center">
                  <div className="w-full max-w-md rounded-lg bg-white/10 p-6 animate-pulse overflow-hidden">
                    <div className="h-5 bg-white/20 rounded w-2/5 mb-5" />
                    <div className="space-y-3">
                      <div className="h-3.5 bg-white/15 rounded w-3/4" />
                      <div className="h-3.5 bg-white/15 rounded w-1/2" />
                      <div className="h-3.5 bg-white/15 rounded w-2/3" />
                      <div className="h-3.5 bg-white/15 rounded w-4/5" />
                      <div className="h-3.5 bg-white/15 rounded w-1/3" />
                    </div>
                    <div className="flex items-center justify-between mt-7 pt-5 border-t border-white/10">
                      <div className="h-3.5 bg-white/15 rounded w-1/4" />
                      <div className="h-9 bg-white/25 rounded w-28" />
                    </div>
                  </div>
                  <p className="text-sm text-white/60 mt-4">{t('common.loading') || 'Loading...'}</p>
                </div>
              ) : ticketError ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <AlertCircle size={36} className="text-red-400 mb-3" />
                  <p className="text-sm text-white/70 mb-4">{ticketError}</p>
                  <button
                    onClick={() => loadTicketModal(ticketModalBooking)}
                    className="h-10 px-6 rounded-lg bg-white text-[var(--text)] text-sm font-semibold cursor-pointer border-none hover:bg-[#F9FAFB] transition-colors"
                  >
                    {t('common.retry') || 'Try Again'}
                  </button>
                </div>
              ) : ticketImageUrl ? (
                <div className="flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-8 w-full">
                  <div className="flex flex-col items-center gap-4 lg:flex-1 lg:min-w-0">
                    <img
                      src={ticketImageUrl}
                      alt={`Ticket ${ticketModalBooking.referenceCode}`}
                      className="w-auto h-auto max-w-full max-h-[80vh] rounded-lg"
                    />
                    <p className="text-white/90 text-sm font-semibold text-center">
                      {t('booking.ticketHelp') || 'If you have any problem with your ticket, please contact us on +250 793 216 191.'}
                    </p>
                  </div>
                  <div className="flex w-full lg:w-auto lg:shrink-0 lg:items-center">
                    <button
                      onClick={downloadTicket}
                      className="w-full lg:w-auto h-14 lg:h-16 px-8 lg:px-10 rounded-lg bg-[var(--blue)] hover:bg-[var(--blue-dark)] text-white text-base lg:text-lg font-semibold cursor-pointer border-none flex items-center justify-center gap-2.5 transition-colors shadow-lg"
                    >
                      <Download size={24} />
                      {t('booking.downloadTicket') || 'Download Ticket'}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Merchant receipt modal — backdrop overlay */}
      <AnimatePresence>
        {merchantReceiptBooking && merchantReceiptBooking.merchantReceiptImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
            onClick={() => setMerchantReceiptBooking(null)}
          >
            <button
              onClick={() => setMerchantReceiptBooking(null)}
              className="absolute top-4 right-4 z-50 w-10 h-10 rounded-lg bg-white/90 hover:bg-white flex items-center justify-center cursor-pointer border-none transition-colors"
            >
              <X size={20} className="text-zinc-700" />
            </button>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-lg flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={resolveImageUrl(merchantReceiptBooking.merchantReceiptImage)}
                alt="Payment receipt"
                className="w-full max-w-[360px] rounded-2xl shadow-2xl border border-[#FDE68A] mb-5"
              />
              <button
                type="button"
                onClick={downloadMerchantReceipt}
                className="w-full max-w-[360px] h-14 rounded-2xl bg-[#D97706] hover:bg-[#B45309] text-white text-base font-bold flex items-center justify-center gap-3 transition-colors duration-200 cursor-pointer border-none shadow-lg"
              >
                <Download size={20} />
                {t('booking.downloadReceipt', { defaultValue: 'Download Receipt' })}
              </button>
              <p className="text-white/70 text-xs text-center mt-4 max-w-xs">
                {t('booking.receiptDesc', { defaultValue: 'Your payment is being verified. We will send your ticket once confirmed.' })}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
