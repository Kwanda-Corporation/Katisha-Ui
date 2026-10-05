import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import paymentAnimation from '../../assets/lottie/payment.json';
import { AlertCircle, Loader, X, Check, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../api';
import { useSocket } from '../../contexts/SocketContext';
import { useToast } from '../../components/ui/Toast';
import TopNav from '../../components/website/TopNav';
import SiteFooter from '../../components/website/SiteFooter';
import SEO from '../../components/seo/SEO';

type Status = 'processing' | 'failed' | 'paid';

const WHATSAPP_GROUP = 'https://chat.whatsapp.com/Kd41kMf8OIBFkgzaCM6vXf';

// NEW: add these alongside your existing --error / --error-bg / --error-border
// tokens (same naming pattern, success side):
//   --success:        e.g. #059669
//   --success-bg:     e.g. #ECFDF5
//   --success-border: e.g. #A7F3D0

// Single label/value row inside the ticket. Amount and reference render in
// monospace so the numbers read like a printed receipt rather than UI copy.
function LedgerRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-[13px] text-[var(--text-muted)]">{label}</span>
      <span className="text-sm font-semibold text-[var(--text)] font-mono tracking-wide">{value}</span>
    </div>
  );
}

// The payment record itself, styled as a torn ticket stub: a rounded card on
// top, a perforated strip along the bottom made by CSS-masking a row of
// circles out of a thin div. The mask cuts real transparency, so whatever
// sits behind the page (light or dark) shows through correctly — it isn't a
// color match trick. A drop-shadow filter wraps both pieces so the shadow
// follows the scalloped edge instead of stopping in a hard rectangle.
function TicketCard({ tone, children }: { tone: 'success' | 'error'; children: React.ReactNode }) {
  const borderColor = tone === 'success' ? 'var(--success-border)' : 'var(--error-border)';
  return (
    <div
      className="w-full"
      style={{
        filter:
          'drop-shadow(0 1px 2px rgba(15,23,42,0.05)) drop-shadow(0 16px 32px rgba(15,23,42,0.10))',
      }}
    >
      <div className="bg-white rounded-t-2xl border border-b-0" style={{ borderColor }}>
        {children}
      </div>
      <div
        aria-hidden="true"
        className="h-4 bg-white border-x"
        style={{
          borderColor,
          WebkitMaskImage: 'radial-gradient(circle at 10px 8px, transparent 9px, #000 9px)',
          maskImage: 'radial-gradient(circle at 10px 8px, transparent 9px, #000 9px)',
          WebkitMaskSize: '20px 16px',
          maskSize: '20px 16px',
          WebkitMaskRepeat: 'repeat-x',
          maskRepeat: 'repeat-x',
        }}
      />
    </div>
  );
}

export default function PaymentStatus() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const { socket } = useSocket();
  const { referenceCode } = useParams();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId') || '';
  const amount = Number(searchParams.get('amount') || 0);
  const [status, setStatus] = useState<Status>('processing');
  const [cancelling, setCancelling] = useState(false);

  // Local dev/testing aid: ?simulate=failed or ?simulate=paid drives the page
  // through the real processing → failed/paid transition without needing a live
  // deposit. Ignored in production builds.
  const simulate = import.meta.env.DEV ? searchParams.get('simulate') : null;

  // Live polling: the booking flips to paid (deposit confirmed) or failed
  // (deposit rejected / cancelled server-side). Poll aggressively at 1s for
  // the first 10 seconds (quick failures like insufficient funds resolve in
  // <10s), then settle to 2s intervals.
  useEffect(() => {
    if (simulate || status !== 'processing' || !referenceCode) return;
    let cancelled = false;
    let elapsed = 0;
    const FAST_INTERVAL = 1000;
    const SLOW_INTERVAL = 2000;
    const FAST_THRESHOLD = 10000;

    const poll = async () => {
      try {
        const res = await api.trackBookingStatus(referenceCode);
        if (cancelled) return;
        const b = res.data;
        if (b?.paymentStatus === 'paid') {
          setStatus('paid');
        } else if (b?.paymentStatus === 'failed' || b?.status === 'cancelled') {
          setStatus('failed');
        }
      } catch {
        /* transient error — keep polling */
      }
    };

    poll();
    let id = window.setInterval(() => {
      elapsed += FAST_INTERVAL;
      poll();
      // After the fast phase, switch to slower interval
      if (elapsed >= FAST_THRESHOLD) {
        window.clearInterval(id);
        id = window.setInterval(poll, SLOW_INTERVAL);
      }
    }, FAST_INTERVAL);
    return () => { cancelled = true; window.clearInterval(id); };
  }, [status, referenceCode]);

  // 5-minute abandon timeout: one final verification, then cancel the booking
  // so the seat is released and no unpaid booking is left behind.
  useEffect(() => {
    if (simulate || status !== 'processing' || !referenceCode) return;
    const timer = window.setTimeout(async () => {
      let stillProcessing = true;
      try {
        const res = await api.trackBookingStatus(referenceCode);
        const b = res.data;
        if (b?.paymentStatus === 'paid') {
          setStatus('paid');
          stillProcessing = false;
        } else if (b?.paymentStatus === 'failed' || b?.status === 'cancelled') {
          stillProcessing = false;
        }
      } catch {
        /* keep the abandon attempt below */
      }
      if (!stillProcessing) return;
      if (bookingId) {
        try {
          await api.abandonBooking(bookingId);
        } catch {
          /* already cancelled/failed server-side is fine */
        }
      }
      setStatus('failed');
    }, 5 * 60 * 1000);
    return () => window.clearTimeout(timer);
  }, [status, referenceCode, bookingId]);

  // Socket push for instant confirmation when the deposit completes or fails.
  useEffect(() => {
    if (simulate || status !== 'processing' || !socket || !bookingId) return;
    const onStatus = (data: { bookingId: string; status: string }) => {
      if (data.bookingId !== bookingId) return;
      if (data.status === 'confirmed') setStatus('paid');
      else if (data.status === 'failed') setStatus('failed');
    };
    socket.on('booking_status', onStatus);
    return () => {
      socket.off('booking_status', onStatus);
    };
  }, [simulate, status, socket, bookingId]);

  // Simulation: flip the state after a short delay so the processing → failed/
  // paid transition is visible. Only active in dev builds.
  useEffect(() => {
    if (!simulate) return;
    const timer = window.setTimeout(() => {
      setStatus(simulate === 'failed' ? 'failed' : 'paid');
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [simulate]);

  // Redirect to the ticket once paid.
  useEffect(() => {
    if (simulate || status !== 'paid' || !bookingId) return;
    const timer = window.setTimeout(() => navigate(`/my-bookings?ticket=${bookingId}`), 1800);
    return () => window.clearTimeout(timer);
  }, [status, bookingId, navigate]);

  const handleCancelPayment = async () => {
    if (cancelling) return;
    setCancelling(true);
    try {
      if (bookingId) {
        await api.abandonBooking(bookingId);
      }
      toast.info(t('booking.paymentCancelled'));
    } catch (err: any) {
      console.warn('Cancel payment failed:', err?.message || err);
      toast.error(t('booking.paymentCancelFailed'));
    } finally {
      setCancelling(false);
      navigate('/book');
    }
  };

  if (!referenceCode) {
    return <Navigate to="/book" replace />;
  }

  const currency = t('booking.currency');

  // Processing state uses the full-screen overlay with the payment Lottie
  // animation instead of a spinner.
  if (status === 'processing') {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ background: '#FFFFFF' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-waiting-title"
      >
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center px-6 text-center max-w-sm"
        >
          <Lottie
            animationData={paymentAnimation}
            loop
            autoplay
            style={{ width: 200, height: 200 }}
            aria-label={t('booking.paymentPromptSent')}
          />
          <h2 id="payment-waiting-title" className="text-xl font-semibold text-[var(--text)] mb-2">
            {t('booking.paymentPromptSent')}
          </h2>
          <p className="text-sm text-[var(--text-sub)] leading-relaxed mb-5">{t('booking.paymentPromptDesc')}</p>
          {referenceCode && (
            <p className="text-xs text-[var(--text-muted)] mb-1">
              {t('booking.refCode')}: <span className="font-mono text-[var(--text)]/80">{referenceCode}</span>
            </p>
          )}
          {amount > 0 && (
            <p className="text-xs text-[var(--text-muted)]">
              {t('booking.amount')}: {amount.toLocaleString()} {currency}
            </p>
          )}
          <button
            onClick={handleCancelPayment}
            disabled={cancelling}
            className="mt-7 h-10 rounded-md bg-[var(--green-cta)] hover:bg-[var(--green-cta-hover)] active:bg-[var(--green-cta-active)] text-[var(--green-ink)] text-sm font-semibold px-6 flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer border-none disabled:opacity-60 mx-auto"
          >
            {cancelling ? <Loader size={14} className="animate-spin" /> : <X size={16} />}
            {cancelling ? t('booking.paymentCancelling') : t('booking.paymentCancel')}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    // bg changed from bg-white to a faint slate tint — the ticket card is
    // still white, and that tiny contrast is what makes the perforated edge
    // (which cuts real transparency) actually visible against the page.
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <SEO title="Payment" noindex />
      <TopNav />

      <main className="flex-1 w-full flex items-center justify-center px-5 sm:px-6 py-14 sm:py-20">
        <motion.div
          key={status}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          {status === 'failed' && (
            <div className="flex flex-col items-center text-center">
              <TicketCard tone="error">
                <div className="px-6 pt-9 pb-1">
                  <div className="w-14 h-14 rounded-full bg-[var(--error-bg)] border border-[var(--error-border)] flex items-center justify-center mx-auto mb-5">
                    <AlertCircle size={26} className="text-[var(--error)]" strokeWidth={2.25} />
                  </div>
                  <p className="text-[13px] font-semibold text-[var(--error)] mb-1.5">
                    {t('booking.paymentFailedEyebrow', 'Payment declined')}
                  </p>
                  <h1 className="text-xl sm:text-2xl font-bold text-[var(--text)] leading-snug mb-2">
                    {t('booking.paymentFailedTitle')}
                  </h1>
                  <p className="text-sm text-[var(--text-sub)] leading-relaxed mb-5">
                    {t('booking.paymentFailedFundsDesc')}
                  </p>
                  <div className="border-t border-dashed border-[var(--border)] -mx-6" />
                  <div className="divide-y divide-[var(--border)]">
                    <LedgerRow label={t('booking.refCode')} value={referenceCode} />
                    {amount > 0 && (
                      <LedgerRow label={t('booking.amount')} value={`${amount.toLocaleString()} ${currency}`} />
                    )}
                  </div>
                </div>
              </TicketCard>

              <div className="w-full rounded-xl bg-[var(--blue-bg)] border border-[var(--border)] p-4 text-left mt-6 mb-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--blue-dark)] mb-1.5">
                  {t('booking.paymentFailedNextTitle')}
                </p>
                <p className="text-sm text-[var(--text-sub)] leading-relaxed">
                  {t('booking.paymentFailedNextDesc')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full">
                <Link
                  to="/book"
                  className="h-11 rounded-xl bg-[var(--blue)] hover:bg-[var(--blue-dark)] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors duration-200 no-underline"
                >
                  <Check size={16} />
                  {t('booking.bookAgain')}
                </Link>
                <a
                  href={WHATSAPP_GROUP}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-11 rounded-xl bg-[#F4F4F5] hover:bg-[#E9ECEF] text-[var(--text)] text-sm font-semibold flex items-center justify-center gap-2 transition-colors duration-200 no-underline border border-[var(--border)]"
                >
                  <MessageCircle size={16} />
                  {t('booking.contactSupport')}
                </a>
              </div>

              <p className="text-xs text-[var(--text-muted)] mt-4">
                {t('booking.paymentFailedNoCharge')}
              </p>
            </div>
          )}

          {status === 'paid' && (
            <div className="flex flex-col items-center text-center">
              <TicketCard tone="success">
                <div className="px-6 pt-9 pb-1">
                  <div className="w-14 h-14 rounded-full bg-[var(--success-bg)] border border-[var(--success-border)] flex items-center justify-center mx-auto mb-5">
                    <Check size={26} className="text-[var(--success)]" strokeWidth={2.25} />
                  </div>
                  <p className="text-[13px] font-semibold text-[var(--success)] mb-1.5">
                    {t('booking.paymentConfirmedEyebrow', 'Payment confirmed')}
                  </p>
                  <h1 className="text-xl sm:text-2xl font-bold text-[var(--text)] leading-snug mb-2">
                    {t('booking.confirmed')}
                  </h1>
                  <p className="text-sm text-[var(--text-sub)] leading-relaxed mb-5">
                    {t('booking.redirecting')}
                  </p>
                  <div className="border-t border-dashed border-[var(--border)] -mx-6" />
                  <div className="divide-y divide-[var(--border)]">
                    <LedgerRow label={t('booking.refCode')} value={referenceCode} />
                    {amount > 0 && (
                      <LedgerRow label={t('booking.amount')} value={`${amount.toLocaleString()} ${currency}`} />
                    )}
                  </div>
                </div>
              </TicketCard>

              <div className="flex items-center justify-center gap-2 mt-6 text-[var(--text-sub)]">
                <Loader size={16} className="animate-spin text-[var(--blue)]" />
                <span className="text-sm">{t('booking.openingTicket', 'Opening your ticket')}</span>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      <SiteFooter />
    </div>
  );
}