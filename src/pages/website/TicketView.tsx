import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Loader, AlertCircle, Bus } from 'lucide-react';
import { motion } from 'framer-motion';
import { api, resolveImageUrl } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { cacheTicketWithImage, getCachedTicket } from '../../services/ticketCache';
import SEO from '../../components/seo/SEO';

export default function TicketView() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [ticketData, setTicketData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bookingId) return;
    loadTicket();
  }, [bookingId]);

  const loadTicket = async () => {
    if (!bookingId) return;
    setLoading(true);
    setError('');

    try {
      const res = await api.viewTicket(bookingId);
      const data = res.data;
      setTicketData(data);

      // Cache in IndexedDB (with image blob) for offline access
      if (data?.ticket?.imageUrl) {
        cacheTicketWithImage(bookingId, resolveImageUrl(data.ticket.imageUrl) || data.ticket.imageUrl, data.booking);
      }
    } catch (err: any) {
      // Try cache as fallback
      const cached = await getCachedTicket(bookingId);
      if (cached?.ticketImageBlob) {
        setTicketData({ ticket: { imageUrl: URL.createObjectURL(cached.ticketImageBlob) }, booking: cached.bookingData });
      } else if (cached) {
        setTicketData({ ticket: { imageUrl: cached.ticketImageUrl }, booking: cached.bookingData });
      } else {
        setError(err.message || 'Failed to load ticket');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <h2 className="text-2xl font-bold text-[var(--text)] mb-1">Login Required</h2>
        <p className="text-sm text-[var(--text-sub)] mb-4">Please log in to view your ticket.</p>
        <button
          onClick={() => navigate('/login')}
          className="h-10 px-6 rounded-xl bg-[var(--blue)] text-white text-sm font-semibold cursor-pointer border-none hover:bg-[var(--blue-dark)] transition-colors"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SEO title="Bus Ticket Details & E-Ticket - Katisha" noindex />
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-[var(--border)] px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/my-bookings')}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-colors cursor-pointer border-none"
        >
          <ArrowLeft size={18} className="text-[var(--text-sub)]" />
        </button>
        <div>
          <h1 className="text-sm font-bold text-[var(--text)]">My Ticket</h1>
          <p className="text-xs text-[var(--text-muted)]">Digital Travel Pass</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader size={28} className="animate-spin text-[var(--blue)] mb-3" />
            <p className="text-sm text-[var(--text-sub)]">Loading your ticket...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle size={40} className="text-red-400 mb-3" />
            <h2 className="text-lg font-bold text-[var(--text)] mb-1">Error</h2>
            <p className="text-sm text-[var(--text-sub)] mb-4">{error}</p>
            <button
              onClick={loadTicket}
              className="h-10 px-6 rounded-xl bg-[var(--blue)] text-white text-sm font-semibold cursor-pointer border-none hover:bg-[var(--blue-dark)] transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : ticketData ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Ticket Image */}
            <div className="rounded-xl overflow-hidden border border-[var(--border)] bg-white mb-4">
              <img
                src={ticketData.ticket.imageUrl}
                alt={`Ticket ${ticketData.booking.referenceCode}`}
                className="w-full h-auto"
              />
            </div>

            {/* Status badges */}
            <div className="flex items-center gap-2 mb-4">
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                ticketData.booking.status === 'confirmed'
                  ? 'bg-blue-600 text-white border border-blue-700'
                  : ticketData.booking.status === 'cancelled'
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
              }`}>
                {ticketData.booking.status}
              </span>
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                ticketData.booking.paymentStatus === 'paid'
                  ? 'bg-[var(--blue-light)] text-[var(--blue-dark)] border border-zinc-200'
                  : 'bg-[#F9FAFB] text-[var(--text-sub)] border border-[var(--border)]'
              }`}>
                {ticketData.booking.paymentStatus}
              </span>
            </div>

            {/* Trip summary */}
            <div className="bg-white rounded-xl border border-[var(--border)] p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--blue)] flex items-center justify-center">
                  <Bus size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--text)]">{ticketData.booking.origin} → {ticketData.booking.destination}</p>
                  {ticketData.booking.agency?.name && (
                    <p className="text-xs text-[var(--text-sub)]">{ticketData.booking.agency.name}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center border-t border-[var(--border)] pt-3">
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] font-semibold uppercase">Date</p>
                  <p className="text-xs font-bold text-[var(--text)]">
                    {new Date(ticketData.booking.travelDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] font-semibold uppercase">Time</p>
                  <p className="text-xs font-bold text-[var(--text)]">{ticketData.booking.travelTime}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] font-semibold uppercase">Seats</p>
                  <p className="text-xs font-bold text-[var(--text)]">{ticketData.booking.seats}</p>
                </div>
              </div>
            </div>

            {/* Reference code */}
            <p className="text-center text-xs text-[var(--text-muted)] mt-4">
              Reference: <span className="font-mono font-bold text-[var(--text-sub)]">{ticketData.booking.referenceCode}</span>
            </p>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
