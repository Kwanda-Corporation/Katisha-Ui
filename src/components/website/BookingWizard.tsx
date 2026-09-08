import React, { useState, useEffect, useRef, useMemo, useCallback, Fragment } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bus, MapPin, Calendar, ArrowRight, ArrowLeft, Check, Smartphone,
  Loader, Minus, Plus, Clock, Info, AlertCircle, X, ChevronDown, Search, Lock, Star, Route
} from 'lucide-react';
import { api, resolveImageUrl } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useTranslation } from '../../../node_modules/react-i18next';
import { useToast } from '../ui/Toast';
import PaymentModal, { ModalFrame } from './PaymentModal';
import i18n from '../../i18n';
import { searchRoutesOffline, getPublicAgencyOffline } from '../../services/offlineData';
import { cacheTicketWithImage, cacheTicket } from '../../services/ticketCache';
import { useOnline } from '../../contexts/OnlineContext';
import { systemFeeFor } from '../../utils/serviceFee';

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1.5 text-sm text-red-500 mt-1.5">
      <AlertCircle size={12} className="flex-shrink-0" />
      <span>{message}</span>
    </p>
  );
}

const SUCCESS_CONFETTI = [
  { x: -70, y: -58, r: 210, delay: 0.35, c: '#22C55E', s: 8 },
  { x: 66, y: -64, r: 150, delay: 0.4, c: '#4ADE80', s: 6 },
  { x: -52, y: 60, r: 250, delay: 0.45, c: '#15803D', s: 7 },
  { x: 58, y: 54, r: 190, delay: 0.38, c: '#A3E635', s: 5 },
  { x: -86, y: -8, r: 220, delay: 0.42, c: '#22C55E', s: 6 },
  { x: 84, y: -14, r: 160, delay: 0.36, c: '#4ADE80', s: 8 },
  { x: -22, y: -80, r: 240, delay: 0.5, c: '#86EFAC', s: 5 },
  { x: 26, y: 76, r: 200, delay: 0.47, c: '#16A34A', s: 7 },
];

/* ------------------------------------------------------------------ */
/* Hand-drawn accents (matches the homepage's Odoo-style treatment)   */
/* ------------------------------------------------------------------ */

/** A loose, asymmetric cluster of hand-drawn sparkle strokes. */
function Sparkles({ className = '', color = 'currentColor' }: { className?: string; color?: string }) {
  return (
    <svg
      viewBox="0 0 120 60"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
    >
      <path d="M10 40 L22 32" />
      <path d="M30 12 Q34 26 30 40" />
      <path d="M46 6 L50 24" />
      <path d="M46 6 L52 4" />
      <circle cx="64" cy="10" r="1.6" fill={color} stroke="none" />
      <path d="M78 20 L74 34" />
      <path d="M92 14 L88 30" />
    </svg>
  );
}

/** Highlighter-marker swipe behind a word — two overlapping rounded capsule
 * strokes with a light dot texture, mimicking a real marker drawn twice by hand. */
function HighlightWord({ children, className = 'bg-blue-100' }: { children: React.ReactNode; className?: string }) {
  const dot = 'absolute rounded-full bg-sky-400/70';
  return (
    <div className="flex justify-center items-center">
      <span className="relative inline-block px-2">
        <span
          aria-hidden="true"
          className={`absolute left-1/2 -translate-x-1/2 top-[6%] h-[52%] w-[85%] sm:w-[105%] -z-10 -rotate-1 rounded-full overflow-hidden ${className}`}
        >
          <span className={`${dot} w-1 h-1 left-[12%] top-[30%]`} />
          <span className={`${dot} w-1.5 h-1.5 left-[42%] top-[55%]`} />
          <span className={`${dot} w-1 h-1 left-[68%] top-[20%]`} />
          <span className={`${dot} w-1 h-1 left-[86%] top-[60%]`} />
        </span>
        <span
          aria-hidden="true"
          className={`absolute left-1/2 -translate-x-1/2 bottom-[6%] h-[40%] w-[55%] sm:w-[70%] -z-10 rotate-2 rounded-full overflow-hidden ${className}`}
        >
          <span className={`${dot} w-1 h-1 left-[20%] top-[35%]`} />
          <span className={`${dot} w-1.5 h-1.5 left-[62%] top-[50%]`} />
        </span>
        <span className="relative">{children}</span>
      </span>
    </div>
  );
}
const getKigaliTodayStr = (): string => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Kigali',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  return `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}-${parts.find(p => p.type === 'day')?.value}`;
};

const kigaliTodayDate = (): Date => new Date(`${getKigaliTodayStr()}T00:00:00`);

const formatDateStr = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const getKigaliTimeMinutes = (): number => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Kigali',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const hour = Number(parts.find(p => p.type === 'hour')?.value) % 24;
  const minute = Number(parts.find(p => p.type === 'minute')?.value);
  return hour * 60 + minute;
};

const timeToMinutes = (time: string): number => {
  const [h, m] = String(time).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

interface CatalogRoute {
  origin?: string;
  destination?: string;
  via?: string;
  countries?: string[];
  provinces?: string[];
  type?: string;
}

/**
 * Walks every page of active routes. The server clamps a single request to 100
 * routes, so the via map must be built from the full catalogue or routes like
 * "Kigali → Nairobi via Gatuna" silently disappear from the picker.
 */
async function fetchAllActiveRoutes(): Promise<CatalogRoute[]> {
  const all: CatalogRoute[] = [];
  let page = 1;
  let pages = 1;
  do {
    const res = await api.getRoutes({ status: 'active', limit: '100', page: String(page) });
    const routes = (res?.data?.routes || res?.routes || []) as CatalogRoute[];
    if (Array.isArray(routes)) all.push(...routes);
    pages = Number(res?.data?.pages) || pages;
    page += 1;
  } while (page <= pages);
  return all;
}

const PAYMENT_METHODS = [
  { value: 'mom', label: 'MTN Mobile Money', icon: Smartphone },
  { value: 'airtel', label: 'Airtel Money', icon: Smartphone },
  { value: 'mpesa', label: 'M-Pesa', icon: Smartphone },
];

const LOCALE_MAP: Record<string, string> = { en: 'en-US', kin: 'rw', sw: 'sw' };
const dateLocale = () => LOCALE_MAP[i18n.language] || 'en-US';

const generateTimeSlots = () => {
  const slots = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = h.toString().padStart(2, '0');
      const min = m.toString().padStart(2, '0');
      slots.push(`${hour}:${min}`);
    }
  }
  return slots;
};
const TIME_SLOTS = generateTimeSlots();

/**
 * Filters the searched routes down to the ones that actually serve the
 * selected origin → destination (either as the route's final destination or
 * via its via point), keeps distinct via routes from the same agency (e.g.
 * Kigali → Kampala via Kagitumba and Kigali → Kampala via Gatuna are separate
 * bookable routes), and orders featured agencies first. When a `via` is given
 * (e.g. the user picked "Nairobi via Kagitumba"), only routes through that
 * specific via point are kept. Only East African routes are considered.
 */
function normalizeAgencyRoutes(routes: any[], origin: string, destination: string, via?: string): any[] {
  const o = origin.trim().toLowerCase();
  const d = destination.trim().toLowerCase();
  const v = (via || '').trim().toLowerCase();

  const direct: any[] = [];
  const viaRoutes: any[] = [];
  for (const r of routes) {
    if (r.type && r.type !== 'east_africa') continue;
    const rOrigin = (r.origin || '').toLowerCase();
    if (rOrigin !== o) continue;
    if ((r.destination || '').toLowerCase() === d) {
      direct.push(r);
    } else if ((r.via || '').toLowerCase() === d) {
      viaRoutes.push(r);
    }
  }

  const priceOf = (r: any) => r.effectivePrice || r.price || 0;
  const byKey = new Map<string, any>();
  const keyOf = (r: any) => `${r.agency?._id || r.agency?.id || ''}::${(r.via || '').toLowerCase()}`;
  const collect = (list: any[]) => {
    for (const r of list) {
      const key = keyOf(r);
      if (key && !byKey.has(key)) byKey.set(key, r);
    }
  };
  collect([...direct].sort((a, b) => priceOf(a) - priceOf(b)));
  collect([...viaRoutes].sort((a, b) => priceOf(a) - priceOf(b)));

  const list = v
    ? Array.from(byKey.values()).filter(r => (r.via || '').trim().toLowerCase() === v)
    : Array.from(byKey.values());
  list.sort((a, b) => {
    const fa = a.agency?.featured ? 1 : 0;
    const fb = b.agency?.featured ? 1 : 0;
    if (fa !== fb) return fb - fa;
    return (a.agency?.name || '').localeCompare(b.agency?.name || '');
  });
  return list;
}

interface BookingForm {
  journeyType: 'east_africa';
  origin: string;
  destination: string;
  via: string;
  travelDate: string;
  travelTime: string;
  routeId: string;
  agencyId: string;
  pickupPoint: string;
  seats: number;
  paymentMethod: string;
  phone: string;
  contactPhone: string;
  isGuest?: boolean;
}

export default function BookingWizard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const toast = useToast();
  const [useFreeTicket, setUseFreeTicket] = useState(false);
  const [guestName, setGuestName] = useState('');


  const [step, setStep] = useState(0);
  const [form, setForm] = useState<BookingForm>({
    journeyType: 'east_africa', origin: 'Kigali', destination: '', via: '', travelDate: '', travelTime: '',
    routeId: '', agencyId: '', pickupPoint: '', seats: 1,
    paymentMethod: '', phone: '+250 ', contactPhone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableRoutes, setAvailableRoutes] = useState<any[]>([]);
  const { isOnline } = useOnline();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [freeTicketsCount, setFreeTicketsCount] = useState(0);
  const hasPlayedSound = useRef(false);

  const [selectedMonth, setSelectedMonth] = useState(() => kigaliTodayDate().getMonth());
  const [selectedYear, setSelectedYear] = useState(() => kigaliTodayDate().getFullYear());
  const [showDateModal, setShowDateModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [useExtraContactPhone, setUseExtraContactPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [contactPhoneInput, setContactPhoneInput] = useState('');
  const [cityPickerField, setCityPickerField] = useState<'origin' | 'destination' | null>(null);
  const [citySearch, setCitySearch] = useState('');
  const [viaByDest, setViaByDest] = useState<Array<{ dest: string; destKey: string; vias: string[] }>>([]);
  const [catalogue, setCatalogue] = useState<CatalogRoute[]>([]);
  const viaFetchedOriginRef = useRef<string | null>(null);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<string[]>([]);
  const [scheduleConfigured, setScheduleConfigured] = useState(false);
  const [scheduleTimes, setScheduleTimes] = useState<string[]>([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmationRef = useRef<HTMLDivElement>(null);
  const pendingAgencyRef = useRef<string | null>(null);

  // Payment channel is always online via PawaPay
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState<{ depositRate: number; payoutRate: number; payoutFixed: number } | null>(null);

  // Deep-link hydration: /book?to=Huye&agency=...&date=... from SEO landing
  // pages. Pre-fills the destination (origin is fixed to Kigali), jumps to the
  // agency step, and auto-selects the agency when it serves the route.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const to = (params.get('to') || params.get('destination') || '').trim();
    const agency = params.get('agency') || params.get('agencyId');
    const date = params.get('date') || params.get('travelDate');
    if (!to) return;

    const tomorrow = new Date(kigaliTodayDate());
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = formatDateStr(tomorrow);
    const travelDate = date && !isNaN(Date.parse(date)) && date >= tomorrowStr ? date : '';

    setForm(f => ({
      ...f,
      destination: to,
      routeId: '',
      agencyId: '',
      pickupPoint: '',
      travelTime: '',
      travelDate,
    }));
    if (agency) pendingAgencyRef.current = agency;
  }, []);

  const applyPendingAgency = (routes: any[]) => {
    const target = pendingAgencyRef.current;
    if (!target) return;
    pendingAgencyRef.current = null;

    const match = routes.find(r => {
      const id = r.agency?._id || r.agency?.id;
      if (id && String(id) === target) return true;
      const name = (r.agency?.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return !!name && name === target;
    });

    if (match) {
      setForm(f => ({ ...f, routeId: match._id, agencyId: match.agency?._id || '' }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      scheduleTimerRef.current = setTimeout(() => setShowSchedule(true), 500);
    }
  };

  const renderSelectField = ({
    label, placeholder, value, icon: Icon, onOpen, error,
  }: {
    label: string; placeholder: string; value: string; icon: React.ComponentType<{ size: number; className?: string }>;
    onOpen: () => void; error?: string;
  }) => {
    const hasValue = !!value;
    return (
      <div className="min-w-0">
        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-sub)] block mb-2">{label}</label>
        <button
          type="button"
          onClick={onOpen}
          className={`group w-full h-[54px] rounded-md border-[1.5px] bg-white pl-3 pr-3.5 text-left text-base outline-none cursor-pointer transition-all duration-200 flex items-center justify-between gap-2.5 ${
            hasValue ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'
          } border-[var(--blue)] hover:border-[var(--blue-dark)] focus-visible:border-[var(--blue-dark)] focus-visible:ring-4 focus-visible:ring-[var(--blue-bg)] hover:shadow-[0_3px_12px_-5px_rgba(29, 78, 216,0.45)]`}
        >
          <span className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="w-9 h-9 rounded-md bg-[var(--blue-bg)] text-[var(--blue-dark)] flex items-center justify-center shrink-0 transition-colors duration-200 group-hover:bg-[var(--blue)] group-hover:text-white">
              <Icon size={16} />
            </span>
            <span className={`truncate ${hasValue ? 'font-medium' : ''}`}>{value || placeholder}</span>
          </span>
          <ChevronDown size={16} className="shrink-0 text-[var(--text-muted)]" />
        </button>
        {error && <FieldError message={error} />}
      </div>
    );
  };

  const selectLocation = (field: 'origin' | 'destination', value: string, via?: string) => {
    if (field === 'origin') return;
    if (scheduleTimerRef.current) clearTimeout(scheduleTimerRef.current);
    setShowSchedule(false);
    setForm(f => ({
      ...f,
      destination: value,
      via: via || '',
      routeId: '',
      agencyId: '',
      pickupPoint: '',
      travelTime: '',
    }));
    setCityPickerField(null);
  };

  const selectViaDestination = (dest: string, via: string) => {
    selectLocation('destination', dest, via);
  };

  const handleAgencySelect = (route: any) => {
    setForm(f => ({ ...f, routeId: route._id, agencyId: route.agency?._id || '' }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (scheduleTimerRef.current) clearTimeout(scheduleTimerRef.current);
    scheduleTimerRef.current = setTimeout(() => setShowSchedule(true), 500);
  };

  const totalSteps = 3;
  const visibleSteps = [0, 1, 2];

  const stepToIndex = (s: number) => visibleSteps.indexOf(s);
  const indexToStep = (i: number) => visibleSteps[i];

  const selectedRoute = availableRoutes.find(r => r._id === form.routeId);
  const effectivePrice = selectedRoute?.effectivePrice || availableRoutes[0]?.price || 0;
  const fareTotal = effectivePrice * form.seats || 0;
  const serviceFeeTotal = systemFeeFor(form.journeyType, effectivePrice, form.seats);
  const totalDue = fareTotal + serviceFeeTotal;

  // Katisha total = Ticket Price + Katisha Service Fee + Transaction Fee
  // Transaction Fee = (Payout Amount × 1%) + 60 RWF
  const onlinePaymentFee = paymentConfig
    ? Math.round(fareTotal * paymentConfig.payoutRate) + paymentConfig.payoutFixed
    : Math.round(fareTotal * 0.01) + 60;
  const onlineTotal = totalDue + onlinePaymentFee;
  const medianPrice = useMemo(() => {
    const prices = availableRoutes
      .map(r => Number(r.effectivePrice || r.price) || 0)
      .sort((a, b) => a - b);
    const n = prices.length;
    if (!n) return 0;
    const mid = Math.floor(n / 2);
    return n % 2 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2;
  }, [availableRoutes]);
  const phoneDisplay = phoneInput;
  const contactPhoneDisplay = contactPhoneInput;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' as ScrollBehavior });
  }, [step]);

  useEffect(() => {
    if (bookingResult?.status === 'paid') {
      window.scrollTo({ top: 0, behavior: 'smooth' as ScrollBehavior });
    }
  }, [bookingResult?.status]);

  useEffect(() => {
    if (bookingResult?.status === 'paid') {
      window.scrollTo({ top: 0, behavior: 'smooth' as ScrollBehavior });
    }
  }, [bookingResult?.status]);

  useEffect(() => {
    if (step === 1 && user) {
      api.getRewards().then(res => {
        const count = res.data?.freeTickets ?? 0;
        setFreeTicketsCount(count);
        if (count === 0) setUseFreeTicket(false);
      }).catch(() => {});
    } else {
      setFreeTicketsCount(0);
      setUseFreeTicket(false);
    }
  }, [step, user]);

  useEffect(() => {
    if (step !== 2) return;
    const available = PAYMENT_METHODS;
    if (available.length === 0) return;
    if (!form.paymentMethod || !available.some(pm => pm.value === form.paymentMethod)) {
      setForm(f => ({ ...f, paymentMethod: available[0].value }));
    }
    // Online payment is the only option — open the payment modal directly.
    setShowPaymentModal(true);
  }, [step, form.paymentMethod]);

  /**/

  useEffect(() => {
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
      if (scheduleTimerRef.current) clearTimeout(scheduleTimerRef.current);
    };
  }, []);

// Fetch payment configuration (PawaPay fee rates)
  useEffect(() => {
    api.getPaymentConfig()
      .then((res: any) => {
        const data = res?.data || res;
        setPaymentConfig({
          depositRate: data?.pawapayDepositFeeRate ?? 0.018791,
          payoutRate: data?.pawapayPayoutFeeRate ?? 0.01,
          payoutFixed: data?.pawapayPayoutFixed ?? 60,
        });
      })
      .catch(() => {
        setPaymentConfig({
          depositRate: 0.018791,
          payoutRate: 0.01,
          payoutFixed: 60,
        });
      });
  }, []);

  // Play success sound when booking is confirmed
  useEffect(() => {
    if (bookingResult?.status === 'paid' && !hasPlayedSound.current) {
      hasPlayedSound.current = true;
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const playNote = (freq: number, startTime: number, duration: number) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.3, startTime);
          gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(startTime);
          osc.stop(startTime + duration);
        };
        const now = audioCtx.currentTime;
        playNote(523.25, now, 0.15);
        playNote(659.25, now + 0.12, 0.15);
        playNote(783.99, now + 0.24, 0.25);
      } catch {}
      // Auto-redirect to My Trips after 3 seconds
      const redirectTimer = setTimeout(() => {
        navigate(`/my-bookings?ticket=${bookingResult.bookingId}`);
      }, 3000);
      return () => clearTimeout(redirectTimer);
    }
  }, [bookingResult?.status, bookingResult?.bookingId]);

  useEffect(() => {
    if (!socket || !bookingResult?.bookingId) return;
    const onStatus = (data: { bookingId: string; status: string; referenceCode: string }) => {
      if (data.bookingId !== bookingResult.bookingId) return;
      if (data.status === 'confirmed') {
        setBookingResult((prev: any) => ({ ...prev, status: 'paid' }));
      }
    };
    socket.on('booking_status', onStatus);
    return () => {
      socket.off('booking_status', onStatus);
    };
  }, [socket, bookingResult?.bookingId]);

  // Prefetch the departure schedule + blocked times as soon as a route is
  // selected (using the next bookable date) so the date/time modals open with
  // data already loaded. Once a specific date is picked, refetches for it.
  useEffect(() => {
    if (!form.routeId) { setBlockedTimes([]); setScheduleConfigured(false); setScheduleTimes([]); return; }
    const prefetchDate = kigaliTodayDate();
    prefetchDate.setDate(prefetchDate.getDate() + 2);
    const travelDate = form.travelDate || formatDateStr(prefetchDate);
    let cancelled = false;
    api.getBlockedTimes({ routeId: form.routeId, travelDate })
      .then(res => { if (!cancelled) setBlockedTimes(res.data?.blockedTimes || []); })
      .catch(() => { if (!cancelled) setBlockedTimes([]); });
    api.getPublicSchedule({ routeId: form.routeId, travelDate })
      .then(res => {
        if (cancelled) return;
        setScheduleConfigured(res.data?.configured || false);
        setScheduleTimes(res.data?.times || []);
      })
      .catch(() => { if (!cancelled) { setScheduleConfigured(false); setScheduleTimes([]); } });
    return () => { cancelled = true; };
  }, [form.routeId, form.travelDate]);

  const generateCalendarDays = () => {
    const firstDay = (new Date(selectedYear, selectedMonth, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (step === 0) {
      if (!form.origin) e.origin = t('booking.selectOrigin');
      if (!form.destination) e.destination = t('booking.selectDestination');
      if (form.origin && form.origin === form.destination) e.destination = t('booking.destDiffOrigin');
      if (!form.routeId || !form.agencyId) e.agencyId = t('booking.selectRoute');
      if (!form.travelDate) e.travelDate = t('booking.selectTravelDate');
      if (!form.travelTime) e.travelTime = t('booking.selectDepartureTime');
    }
    if (step === 1) {
      if (form.seats < 1) e.seats = t('booking.atLeastOneSeat');
    }
    if (step === 2) {
      if (!form.paymentMethod) e.paymentMethod = t('booking.selectPaymentMethod');
      const phoneDigits = form.phone.replace(/\D/g, '').replace(/^250/, '');
      if (!phoneDigits || phoneDigits.length < 9) e.phone = t('booking.phoneRequired');
      if (useExtraContactPhone) {
        const contactDigits = form.contactPhone.replace(/\D/g, '').replace(/^250/, '');
        if (!contactDigits || contactDigits.length < 9) e.contactPhone = t('booking.contactPhoneRequired');
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const searchRoutes = async (origin: string, destination: string, via?: string) => {
    setLoading(true);
    try {
      const { data: routes } = await searchRoutesOffline(origin, destination);
      const normalized = normalizeAgencyRoutes(routes || [], origin, destination, via);
      setAvailableRoutes(normalized);
      applyPendingAgency(normalized);
    } catch {
      setAvailableRoutes([]);
      applyPendingAgency([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (step !== 0 || !form.origin || !form.destination) return;
    searchRoutes(form.origin, form.destination, form.via || undefined);
  }, [step, form.origin, form.destination, form.via]);

  // Load the via points served from the selected origin, grouped by the city
  // they lead to (e.g. Nairobi → [Gatuna]) so the picker can offer
  // "Nairobi via Gatuna" style destinations. Fetches the FULL route catalogue
  // once per origin (the server pages at 100) so no via route is missed.
  const loadViaRoutes = useCallback(async (origin: string) => {
    if (viaFetchedOriginRef.current === origin) return;
    viaFetchedOriginRef.current = origin;
    setViaByDest([]);
    try {
      const routes = await fetchAllActiveRoutes();
      const routeList = Array.isArray(routes) ? routes : [];
      setCatalogue(routeList);
      const o = origin.trim().toLowerCase();
      const viaMap = new Map<string, { dest: string; vias: Set<string> }>();
      for (const r of (Array.isArray(routes) ? routes : [])) {
        const via = (r.via || '').trim();
        const dest = (r.destination || '').trim();
        if (!via || !dest || (r.origin || '').trim().toLowerCase() !== o) continue;
        const dKey = dest.toLowerCase();
        let entry = viaMap.get(dKey);
        if (!entry) {
          entry = { dest, vias: new Set() };
          viaMap.set(dKey, entry);
        }
        entry.vias.add(via);
      }
      setViaByDest(
        Array.from(viaMap.entries())
          .map(([destKey, { dest, vias }]) => ({ dest, destKey, vias: Array.from(vias).sort((a, b) => a.localeCompare(b)) }))
          .sort((a, b) => a.dest.localeCompare(b.dest))
      );
    } catch {
      viaFetchedOriginRef.current = null; // allow a retry the next time the picker opens
    }
  }, []);

  // Prefetch the via catalogue as soon as the origin is known, so the
  // destination picker doesn't have to wait on the network when it opens.
  useEffect(() => {
    if (form.origin) loadViaRoutes(form.origin);
  }, [form.origin, loadViaRoutes]);

  // Fallback retry: if the prefetch failed (or never ran) and the destination
  // picker opens, fetch again so via routes still show up.
  useEffect(() => {
    if (cityPickerField !== 'destination' || !form.origin) return;
    if (viaFetchedOriginRef.current !== form.origin) loadViaRoutes(form.origin);
  }, [cityPickerField, form.origin, loadViaRoutes]);

  // Destination picker groups, built from the LIVE route catalogue (the same
  // fetch used for via routes) rather than a hardcoded list. East African
  // travel groups by destination country (Rwanda excluded).
  const destinationGroups = useMemo(() => {
    const originKey = form.origin.trim().toLowerCase();
    const byGroup = new Map<string, Set<string>>();
    for (const r of catalogue) {
      const dest = (r.destination || '').trim();
      if (!dest || (r.origin || '').trim().toLowerCase() !== originKey) continue;
      if (r.type && r.type !== 'east_africa') continue;
      const label = Array.isArray(r.countries) && r.countries[0] ? r.countries[0] : 'Other';
      if (label.trim().toLowerCase() === 'rwanda') continue;
      let set = byGroup.get(label);
      if (!set) { set = new Set(); byGroup.set(label, set); }
      set.add(dest);
    }
    return Array.from(byGroup.entries())
      .map(([label, cities]) => ({ label, cities: Array.from(cities).sort((a, b) => a.localeCompare(b)) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [catalogue, form.origin]);

  const handleNext = async () => {
    if (!validate()) return;
    setErrors({});

    if (step === 0) {
      if (form.origin && form.destination) {
        await searchRoutes(form.origin, form.destination, form.via || undefined);
      }

      if (form.agencyId && form.travelDate && form.travelTime) {
        try {
          let latestBlocked: string[] = [];
          try {
            const blockedRes = await api.getBlockedTimes({ routeId: form.routeId, travelDate: form.travelDate });
            latestBlocked = blockedRes.data?.blockedTimes || [];
          } catch {
            latestBlocked = [];
          }
          setBlockedTimes(latestBlocked);

          if (latestBlocked.includes(form.travelTime)) {
            setErrors({ travelTime: t('booking.departureNoLongerAvailable') || 'This departure is no longer available. Please select another time.' });
            setShowTimeModal(true);
            return;
          }

          let latestScheduled: string[] | null = null;
          try {
            const schedRes = await api.getPublicSchedule({ routeId: form.routeId, travelDate: form.travelDate });
            if (schedRes.data?.configured) {
              latestScheduled = schedRes.data?.times || [];
              setScheduleConfigured(true);
              setScheduleTimes(latestScheduled || []);
            }
          } catch {
            /* schedule check is best-effort */
          }
          if (latestScheduled && !latestScheduled.includes(form.travelTime)) {
            setErrors({ travelTime: t('booking.departureNoLongerAvailable') || 'This departure is no longer available. Please select another time.' });
            setShowTimeModal(true);
            return;
          }

          const todayStr = getKigaliTodayStr();
          if (form.travelDate <= todayStr) {
            setErrors({ travelDate: t('booking.bookTomorrow') || 'You can only book travel from tomorrow onwards. Please choose another date.' });
            setShowDateModal(true);
            return;
          }
        } catch {
          /* blocked-time validation is best-effort */
        }
      }
      if (scheduleTimerRef.current) clearTimeout(scheduleTimerRef.current);
      setShowSchedule(true);
    }

    const lastStepIndex = totalSteps - 1;
    const currentIndex = stepToIndex(step);
    if (currentIndex >= lastStepIndex) {
      await handleSubmit();
      return;
    }
    setStep(indexToStep(currentIndex + 1));
  };

  const handleBack = () => {
    if (step === 0) {
      // Plan-your-trip sub-steps: schedule → agency → destination.
      if (showSchedule) {
        setShowSchedule(false);
      } else if (form.destination) {
        setForm(f => ({ ...f, destination: '', via: '', routeId: '', agencyId: '', pickupPoint: '', travelTime: '' }));
      }
      return;
    }
    const currentIndex = stepToIndex(step);
    setStep(indexToStep(currentIndex - 1));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const selectedRoute = availableRoutes.find(r => r._id === form.routeId) || availableRoutes[0];
      const isGuest = !user;
      const bookingData: Record<string, any> = {
        routeId: selectedRoute?._id || form.routeId,
        agencyId: form.agencyId,
        origin: form.origin,
        destination: form.destination,
        travelDate: form.travelDate,
        travelTime: form.travelTime,
        seats: form.seats,
        paymentMethod: form.paymentMethod,
        paymentChannel: 'pawapay_online',
        phone: form.phone,
        contactPhone: useExtraContactPhone ? (form.contactPhone.trim() || undefined) : form.phone,
      };

      if (isGuest) {
        bookingData.guestName = guestName.trim() || t('booking.guest');
        bookingData.isGuest = true;
      } else {
        bookingData.useFreeTicket = useFreeTicket;
      }

      const res = isGuest ? await api.createGuestBooking(bookingData) : await api.createBooking(bookingData);
      const { booking, paymentStatus } = res.data;

      // If guest booking, auto-login by saving tokens
      if (isGuest && res.data.accessToken && res.data.refreshToken) {
        const authUser = res.data.user;
        localStorage.setItem('vdk_access_token', res.data.accessToken);
        localStorage.setItem('vdk_refresh_token', res.data.refreshToken);
        localStorage.setItem('vdk_user', JSON.stringify(authUser));
        // Reload auth state by triggering a page navigation
        // The AuthContext will pick up the new tokens on the next render cycle
        window.dispatchEvent(new Event('auth-stored'));
      }

      if (paymentStatus === 'paid' || paymentStatus === 'pending') {
        setBookingResult({
          referenceCode: booking.referenceCode,
          status: 'paid',
          totalAmount: booking.totalAmount,
          origin: booking.origin,
          destination: booking.destination,
          travelDate: booking.travelDate,
          travelTime: booking.travelTime,
          seats: booking.seats,
          bookingId: booking._id,
          ticketImage: booking.ticketImage,
        });
        if (booking.ticketImage) {
          const url = resolveImageUrl(booking.ticketImage);
          if (url) cacheTicketWithImage(booking._id, url, booking).catch(() => {});
        } else {
          cacheTicket(booking._id, '', booking).catch(() => {});
        }
      } else if (paymentStatus === 'processing') {
        const totalAmount = booking.pricing?.customerTotal ?? booking.totalAmount;
        navigate(`/payment/${encodeURIComponent(booking.referenceCode)}?bookingId=${booking._id}&amount=${encodeURIComponent(String(totalAmount))}`);
      }
    } catch (err: any) {
      const raw = String(err?.message || '');
      let msg = raw || t('booking.bookingFailed');
      if (raw.includes('Travel date must be tomorrow')) {
        msg = t('booking.bookTomorrow');
      } else if (raw.includes('have been closed')) {
        msg = t('booking.departureNoLongerAvailable');
      }
      setSubmitError(msg);
      toast.error(t('booking.bookingFailed'), msg);
    } finally {
      setSubmitting(false);
    }
  };

  const STEP_TITLES = [
    t('booking.tripTitle'),
    t('booking.title5'), t('booking.title6'),
  ];
  const STEP_DESCS = [
    t('booking.tripDesc'),
    t('booking.desc5'), t('booking.desc6'),
  ];

  if (bookingResult?.status === 'paid') {
    return (
      <ModalFrame open onClose={() => navigate(`/my-bookings?ticket=${bookingResult.bookingId}`)} labelledBy="booking-success-title" maxWidth={480}>
        <button
          type="button"
          onClick={() => navigate(`/my-bookings?ticket=${bookingResult.bookingId}`)}
          aria-label="Close"
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-[#F3F4F6] hover:bg-[#E9ECEF] text-[#52525B] flex items-center justify-center transition-colors duration-200 cursor-pointer border-none"
        >
          <X size={18} />
        </button>

        <div ref={confirmationRef} className="flex flex-col items-center p-6 sm:p-10 text-center overflow-y-auto">
          {/* Animated success badge with pulsing rings + confetti burst */}
          <div className="relative w-20 h-20 mb-6">
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.5, 1.25, 1], opacity: [0, 0.55, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
              className="absolute inset-0 rounded-full bg-[#22C55E]/30"
            />
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.5, 1.45, 1], opacity: [0, 0.35, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', delay: 0.45 }}
              className="absolute inset-0 rounded-full bg-[#22C55E]/20"
            />
            {SUCCESS_CONFETTI.map((c, i) => (
              <motion.span
                key={i}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                animate={{ x: c.x, y: c.y, opacity: 0, scale: 1, rotate: c.r }}
                transition={{ duration: 0.9, delay: c.delay, ease: [0.22, 1, 0.36, 1] }}
                className="absolute left-1/2 top-1/2 -ml-1 -mt-1 rounded-[2px] pointer-events-none"
                style={{ width: c.s, height: c.s, background: c.c }}
              />
            ))}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 14 }}
              className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#22C55E] to-[#15803D] flex items-center justify-center"
              style={{ boxShadow: '0 14px 40px -8px rgba(34,197,94,0.7)' }}
            >
              <svg viewBox="0 0 24 24" className="w-10 h-10" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <motion.path
                  d="M20 6 L9 17 L4 12"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
                />
              </svg>
            </motion.div>
          </div>

          <motion.h2
            id="booking-success-title"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-2xl font-bold text-[#111827] mb-2"
          >
            {t('booking.confirmed')}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-sm text-[#52525B] mb-6"
          >
            {t('booking.redirecting')}
          </motion.p>

          {bookingResult?.referenceCode && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-xs rounded-2xl border border-[#DCFCE7] bg-gradient-to-br from-[#F0FDF4] to-white px-4 py-3 text-left mb-6"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#52525B]">{t('booking.refCode')}</span>
                <span className="font-mono font-semibold text-[#15803D]">{bookingResult.referenceCode}</span>
              </div>
              {bookingResult?.totalAmount ? (
                <div className="flex items-center justify-between text-sm mt-1.5 pt-1.5 border-t border-[#DCFCE7]">
                  <span className="text-[#52525B]">{t('booking.amount')}</span>
                  <span className="font-bold text-[#111827]">{bookingResult.totalAmount.toLocaleString()} {t('booking.currency')}</span>
                </div>
              ) : null}
            </motion.div>
          )}

          <motion.button
            type="button"
            onClick={() => navigate(`/my-bookings?ticket=${bookingResult.bookingId}`)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="mt-1 w-full h-12 rounded-md bg-gradient-to-br from-[#22C55E] to-[#15803D] hover:from-[#16A34A] hover:to-[#15803D] text-white font-semibold text-base flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer border-none shadow-[0_10px_28px_-10px_rgba(34,197,94,0.8)]"
          >
            {t('booking.myBookings')}
          </motion.button>
        </div>
      </ModalFrame>
    );
  }

  const renderAgencySection = () => {
    return (
      <div className="flex flex-col gap-5">
        <label className="text-sm sm:text-base font-medium uppercase tracking-[0.12em] text-[var(--text-sub)] block">{t('booking.selectAgency')}</label>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader size={24} className="animate-spin text-[var(--blue)]" />
          </div>
        ) : availableRoutes.length === 0 ? (
          <div className="text-center py-10">
            <Bus size={32} className="mx-auto text-[var(--text-muted)] mb-2" />
            <p className="text-base text-[var(--text-sub)]">{t('booking.noRoutes')}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableRoutes.map((route, i) => {
                const selected = form.routeId === route._id;
                const routePrice = Number(route.effectivePrice || route.price) || 0;
                const isExpensive = routePrice >= medianPrice;
                // Two-layer solid brand gradient (no background photos).
                const base = selected
                  ? 'linear-gradient(135deg, #71717A 0%, #52525B 100%)'
                  : 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)';
                return (
                  <motion.button key={route._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.08 + i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ scale: 1.01, x: 2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleAgencySelect(route)}
                    className={`w-full p-4 sm:p-5 rounded-md border-2 text-left transition-all duration-200 cursor-pointer text-white ${
                      selected
                        ? 'border-[#71717A] ring-2 ring-white/70 shadow-[0_4px_18px_rgba(113,113,122,0.5)]'
                        : 'border-[var(--blue)] hover:shadow-[0_4px_14px_rgba(29,78,216,0.35)]'
                    }`}
                    style={{
                      backgroundImage: base,
                    }}
                  >
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <motion.div
                          animate={form.routeId === route._id ? { scale: [1, 1.15, 1] } : {}}
                          transition={{ duration: 0.3 }}
                          className="w-9 h-9 rounded-md flex items-center justify-center text-base font-semibold shrink-0 bg-white/20 text-white"
                        >
                          {route.agency?.name?.[0] || '?'}
                        </motion.div>
                        <div className="min-w-0">
                          <p className="font-medium text-base truncate text-white">
                            {route.agency?.name || t('booking.unknownAgency')}
                            {route.agency?.featured && (
                              <Star size={12} className="inline ml-1 mb-0.5 text-[#FCD34D]" fill="currentColor" />
                            )}
                            {isExpensive ? (
                              <span className="inline-flex items-center gap-0.5 ml-1 mb-0.5">
                                <Star size={12} className="text-[#FCD34D]" fill="currentColor" />
                                <Star size={12} className="text-[#FCD34D]" fill="currentColor" />
                              </span>
                            ) : (
                              <span className="inline-flex items-center ml-1 mb-0.5">
                                <Star size={12} className="text-[#A1A1AA]" fill="currentColor" />
                              </span>
                            )}
                          </p>
                          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                            <span className="text-sm font-medium truncate text-white">{form.origin} → {form.destination}</span>
                            {route.via && route.via.trim().toLowerCase() !== form.destination.trim().toLowerCase() && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-sm bg-white/20 text-white shrink-0">
                                <Route size={10} /> via {route.via}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/25 flex items-center justify-between">
                      <span className="text-xs text-white/60">{route.estimatedDuration || ''}</span>
                      <span className="font-semibold text-base whitespace-nowrap text-white">
                        {((Number(route.effectivePrice || route.price) + Number(route.systemFeePerSeat || 0)).toLocaleString())} {t('booking.currency')}
                      </span>
                    </div>
                  </div>
                </motion.button>
              );
              })}
            </div>
          </>
        )}
        {errors.agencyId && <FieldError message={errors.agencyId} />}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="flex flex-col gap-6 pt-2">
            {!form.destination && (
              <div>
                {/* Origin (fixed to Kigali) + Destination */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="min-w-0">
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-sub)] block mb-2">{t('booking.origin')}</label>
                    <div className="w-full h-[54px] rounded-md border-[1.5px] border-[var(--blue)] bg-[var(--blue-bg)]/60 pl-3 pr-3.5 text-left flex items-center justify-between gap-2.5">
                      <span className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="w-9 h-9 rounded-md bg-[var(--blue)] text-white flex items-center justify-center shrink-0">
                          <Lock size={16} />
                        </span>
                        <span className="truncate font-medium text-[var(--text)]">{form.origin || 'Kigali'}</span>
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] shrink-0">{t('booking.fixed') || 'Fixed'}</span>
                    </div>
                  </div>
                  {renderSelectField({
                    label: t('booking.destination'),
                    placeholder: t('booking.selectDestination'),
                    value: form.via ? `${form.destination} via ${form.via}` : form.destination,
                    icon: MapPin,
                    onOpen: () => setCityPickerField('destination'),
                    error: errors.destination,
                  })}
                </div>
              </div>
            )}

            {form.destination && (
              <AnimatePresence mode="wait">
                {!showSchedule ? (
                  <motion.div
                    key="agency"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {renderAgencySection()}
                  </motion.div>
                ) : (
                  <motion.div
                    key="schedule"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {renderSelectField({
                        label: t('booking.travelDate'),
                        placeholder: t('booking.selectTravelDate'),
                        value: form.travelDate
                          ? new Date(form.travelDate + 'T00:00:00').toLocaleDateString(dateLocale(), { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                          : '',
                        icon: Calendar,
                        onOpen: () => setShowDateModal(true),
                        error: errors.travelDate,
                      })}
                      {renderSelectField({
                        label: t('booking.departureTime'),
                        placeholder: t('booking.selectDepartureTime'),
                        value: form.travelTime,
                        icon: Clock,
                        onOpen: () => setShowTimeModal(true),
                        error: errors.travelTime,
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        );

      case 1:
        return (
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm sm:text-base font-medium uppercase tracking-[0.12em] text-[var(--text-sub)]">{t('booking.numSeats')}</label>
              </div>
              <div className="flex items-center gap-3">
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setForm(f => ({ ...f, seats: Math.max(1, f.seats - 1) }))}
                  className="w-11 h-11 rounded-sm border-2 border-[var(--border)] flex items-center justify-center hover:border-[var(--blue)] hover:bg-[var(--blue-bg)] transition-all duration-200 cursor-pointer text-[var(--text-sub)] hover:text-[var(--blue-dark)] shrink-0"
                >
                  <Minus size={18} />
                </motion.button>
                <motion.span key={form.seats} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="text-4xl font-semibold text-[var(--text)] w-16 text-center tabular-nums">{form.seats}</motion.span>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setForm(f => ({ ...f, seats: Math.min(10, f.seats + 1) }))}
                  className="w-11 h-11 rounded-sm border-2 border-[var(--border)] flex items-center justify-center hover:border-[var(--blue)] hover:bg-[var(--blue-bg)] transition-all duration-200 cursor-pointer text-[var(--text-sub)] hover:text-[var(--blue-dark)] shrink-0"
                >
                  <Plus size={18} />
                </motion.button>
              </div>
              {errors.seats && <FieldError message={errors.seats} />}
            </div>
          </div>
        );

    }
  };

  const renderCityPickerModal = () => {
    const field = cityPickerField;
    const query = citySearch.trim().toLowerCase();
    const otherSelected = field === 'origin' ? form.destination : form.origin;
    const excluded = otherSelected ? otherSelected.toLowerCase() : null;
    const isOrigin = field === 'origin';

    // Via routes (e.g. "Kigali → Nairobi via Gatuna") are offered as
    // sub-options nested under the city they lead to, so the picker shows
    // "Nairobi" plus "Nairobi via Gatuna" — via points are never listed as
    // standalone destinations. Every destination (direct or via-only) comes
    // from the live route catalogue, so nothing is hardcoded.
    const buildCityItem = (city: string) => {
      const key = city.toLowerCase();
      const cityMatch = key !== excluded && (!query || key.includes(query));
      const viaLookup = viaByDest.find(x => x.destKey === key);
      const vias = (viaLookup ? viaLookup.vias : [])
        .filter(v => v.toLowerCase() !== excluded)
        .filter(v => !query || v.toLowerCase().includes(query));
      return { city, cityMatch, vias };
    };

    const groupItems: Array<{ label: string; items: ReturnType<typeof buildCityItem>[] }> = [];
    for (const group of destinationGroups) {
      const items = group.cities.map(buildCityItem).filter(it => it.cityMatch || it.vias.length > 0);
      if (items.length) groupItems.push({ label: group.label, items });
    }

    const hasResults = groupItems.length > 0;
    return (
      <ModalFrame
        sheet
        open={field !== null}
        onClose={() => setCityPickerField(null)}
        labelledBy="city-picker-title"
        maxWidth={560}
      >
        <div className="flex flex-col min-h-0 flex-1">
          <div className="flex items-start justify-between gap-3 px-5 sm:px-8 pt-4 sm:pt-8 pb-2 shrink-0">
            <div className="min-w-0">
              <h2 id="city-picker-title" className="text-lg font-bold text-[var(--text)]">
                {isOrigin ? t('booking.selectOrigin') : t('booking.selectDestination')}
              </h2>
              <p className="text-[13px] text-[var(--text-sub)] mt-0.5">
                {isOrigin ? t('booking.chooseDeparture') || 'Where are you travelling from?' : t('booking.chooseArrival') || 'Where are you going to?'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCityPickerField(null)}
              aria-label="Close"
              className="w-9 h-9 rounded-sm bg-[#F3F4F6] hover:bg-[#E9ECEF] text-[#52525B] flex items-center justify-center transition-colors duration-200 cursor-pointer border-none shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          <div className="relative px-5 sm:px-8 pt-2 pb-3 shrink-0">
            <Search size={16} className="absolute left-8 sm:left-11 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <input
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              placeholder={t('booking.searchDistricts')}
              className="w-full h-12 rounded-md border border-[#E5E7EB] bg-white pl-11 pr-4 text-base outline-none transition-all duration-200 focus:border-[var(--blue)] focus:ring-4 focus:ring-[var(--blue-bg)]"
            />
          </div>

          <div className="min-h-0 overflow-y-auto px-5 sm:px-8 pb-6 -mx-0">
            {groupItems.map(({ label, items }) => (
              <div key={label} className="mb-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] px-2.5 mb-1.5">{label}</p>
                <div className="flex flex-col gap-0.5">
                  {items.map(({ city, cityMatch, vias }) => (
                    <Fragment key={city}>
                      {cityMatch && (
                        <motion.button
                          type="button"
                          onClick={() => field && selectLocation(field, city)}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.15 }}
                          className={`w-full flex items-center justify-between gap-2 px-2.5 py-2.5 rounded-sm text-left cursor-pointer border-none transition-colors duration-150 ${
                            field !== null && form[field] === city && !form.via ? 'bg-[var(--blue-bg)] text-[var(--blue-dark)]' : 'text-[var(--text)] hover:bg-[#F9FAFB]'
                          }`}
                        >
                          <span className="flex items-center gap-2.5 min-w-0">
                            <span className={`w-7 h-7 rounded-sm flex items-center justify-center shrink-0 ${field !== null && form[field] === city && !form.via ? 'bg-[var(--blue)]/15' : 'bg-[#F3F4F6]'}`}>
                              <MapPin size={14} className={`shrink-0 ${field !== null && form[field] === city && !form.via ? 'text-[var(--blue)]' : 'text-[var(--text-muted)]'}`} />
                            </span>
                            <span className={`text-[15px] font-medium truncate ${field !== null && form[field] === city && !form.via ? 'font-semibold' : ''}`}>{city}</span>
                          </span>
                          {field !== null && form[field] === city && !form.via && <Check size={16} className="shrink-0 text-[var(--blue)]" />}
                        </motion.button>
                      )}
                      {vias.length > 0 && (
                        <div className="ml-9 pl-3 border-l-2 border-[var(--blue)]/20 flex flex-col gap-0.5">
                          {vias.map(via => {
                            const isSel = form.destination === city && form.via === via;
                            return (
                              <motion.button
                                key={`${city}-via-${via}`}
                                type="button"
                                onClick={() => selectViaDestination(city, via)}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.15 }}
                                className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-sm text-left cursor-pointer border-none transition-colors duration-150 ${
                                  isSel ? 'bg-[var(--blue-bg)] text-[var(--blue-dark)]' : 'text-[var(--text)] hover:bg-[var(--blue-bg)]'
                                }`}
                              >
                                <span className="flex items-center gap-2 min-w-0">
                                  <Route size={13} className={`shrink-0 ${isSel ? 'text-[var(--blue)]' : 'text-[var(--blue)]'}`} />
                                  <span className="flex flex-col min-w-0">
                                    <span className={`text-[14px] font-medium truncate ${isSel ? 'font-semibold' : ''}`}>{city} via {via}</span>
                                    <span className="text-[11px] text-[var(--text-muted)] truncate">{form.origin} → {city}</span>
                                  </span>
                                </span>
                                <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-sm bg-[var(--blue-bg)] text-[var(--blue)] shrink-0">
                                  via
                                </span>
                                {isSel && <Check size={16} className="shrink-0 text-[var(--blue)]" />}
                              </motion.button>
                            );
                          })}
                        </div>
                      )}
                    </Fragment>
                  ))}
                </div>
              </div>
            ))}
            {!hasResults && (
              <div className="text-center text-sm text-[var(--text-muted)] py-10">
                <Search size={24} className="mx-auto text-[var(--text-muted)] opacity-40 mb-2" />
                {catalogue.length === 0
                  ? (t('booking.loadingDestinations') || 'Loading destinations…')
                  : (t('booking.noResults') || 'No matching locations found.')}
              </div>
            )}
          </div>
        </div>
      </ModalFrame>
    );
  };

  const renderDateModal = () => {
    return (
      <ModalFrame
        sheet
        open={showDateModal}
        onClose={() => setShowDateModal(false)}
        labelledBy="date-modal-title"
        maxWidth={720}
      >
        <div className="flex flex-col min-h-0 flex-1">
          <div className="flex items-start justify-between gap-3 px-5 sm:px-8 pt-4 sm:pt-8 pb-2 shrink-0">
            <div className="min-w-0">
              <h2 id="date-modal-title" className="text-lg font-bold text-[var(--text)]">
                {t('booking.selectTravelDate')}
              </h2>
              <p className="text-sm sm:text-[13px] text-[var(--text-sub)] mt-0.5">
                {t('booking.chooseDate') || 'When do you want to travel?'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDateModal(false)}
              aria-label="Close"
              className="w-9 h-9 rounded-sm bg-[#F3F4F6] hover:bg-[#E9ECEF] text-[#52525B] flex items-center justify-center transition-colors duration-200 cursor-pointer border-none shrink-0"
            >
              <X size={18} />
            </button>
          </div>
          <div className="min-h-0 overflow-y-auto px-5 sm:px-8 pb-6 -mx-0">
          <div className="bg-white rounded-md border border-[var(--border)] shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => {
                  const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
                  const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
                  const now = kigaliTodayDate();
                  if (prevYear < now.getFullYear() || (prevYear === now.getFullYear() && prevMonth < now.getMonth())) return;
                  if (selectedMonth === 0) { setSelectedYear(y => y - 1); setSelectedMonth(11); }
                  else { setSelectedMonth(m => m - 1); }
                }}
                className="w-9 h-9 rounded-sm hover:bg-[var(--blue-bg)] hover:text-[var(--blue-dark)] flex items-center justify-center cursor-pointer border-none text-[var(--text-sub)] transition-colors duration-200"
              >
                <ArrowLeft size={15} />
              </motion.button>
              <motion.span key={`${selectedMonth}-${selectedYear}`} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="font-semibold text-lg sm:text-base text-[var(--text)]">
                {new Date(selectedYear, selectedMonth).toLocaleDateString(dateLocale(), { month: 'long', year: 'numeric' })}
              </motion.span>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => { if (selectedMonth === 11) { setSelectedYear(y => y + 1); setSelectedMonth(0); } else { setSelectedMonth(m => m + 1); } }}
                className="w-9 h-9 rounded-sm hover:bg-[var(--blue-bg)] hover:text-[var(--blue-dark)] flex items-center justify-center cursor-pointer border-none text-[var(--text-sub)] transition-colors duration-200"
              >
                <ArrowRight size={15} />
              </motion.button>
            </div>
            <div className="grid grid-cols-7 gap-1 sm:gap-0.5 mb-1">
              {Array.from({ length: 7 }, (_, i) => new Date(2024, 0, i + 1).toLocaleDateString(dateLocale(), { weekday: 'narrow' })).map((d, i) => (
                <span key={i} className="text-base sm:text-sm font-medium text-[var(--text-muted)] text-center py-0.5">{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 sm:gap-0.5">
              {generateCalendarDays().map((day, i) => {
                if (day === null) return <div key={`e${i}`} />;
                const dateStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                const todayStr = getKigaliTodayStr();
                const isToday = dateStr === todayStr;
                const isSelected = form.travelDate === dateStr;
                const minDays = 2;
                const minDate = kigaliTodayDate();
                minDate.setDate(minDate.getDate() + minDays);
                const minDateStr = formatDateStr(minDate);
                const isPast = dateStr < minDateStr;
                const isBlocked = blockedDates.includes(dateStr);
                const disabled = isPast || isBlocked;
                return (
                  <motion.button key={day} disabled={disabled}
                    whileTap={disabled ? {} : { scale: 0.93 }}
                    onClick={() => {
                      const changed = form.travelDate !== dateStr;
                      setForm(f => f.travelDate === dateStr ? f : { ...f, travelDate: dateStr, travelTime: '' });
                      setShowDateModal(false);
                      // Flow straight into departure-time selection after a
                      // date is picked; the schedule/blocked-times effect
                      // refetches for the new date automatically.
                      if (changed) setShowTimeModal(true);
                    }}
                    className={`w-full h-11 sm:h-10 rounded-md text-base sm:text-sm font-medium flex items-center justify-center transition-all duration-200 cursor-pointer ${
                      isSelected ? 'bg-[var(--blue)] text-white shadow-[0_3px_10px_-3px_rgba(29, 78, 216,0.6)]' :
                      disabled ? (isBlocked ? 'text-red-300 cursor-not-allowed line-through decoration-red-400' : 'text-[var(--text-muted)] cursor-not-allowed line-through decoration-red-400') :
                      isToday ? 'bg-[var(--blue-bg)] text-[var(--blue-dark)] ring-1 ring-[var(--blue-border)]' :
                      'hover:bg-[#F9FAFB] text-[var(--text)]'
                    }`}
                  >
                    {day}
                  </motion.button>
                );
              })}
            </div>
          </div>
          </div>
        </div>
      </ModalFrame>
    );
  };

  const renderTimeModal = () => {
    return (
      <ModalFrame
        sheet
        open={showTimeModal}
        onClose={() => setShowTimeModal(false)}
        labelledBy="time-modal-title"
        maxWidth={560}
      >
        <div className="flex flex-col min-h-0 flex-1">
          <div className="flex items-start justify-between gap-3 px-5 sm:px-8 pt-4 sm:pt-8 pb-2 shrink-0">
            <div className="min-w-0">
              <h2 id="time-modal-title" className="text-lg font-bold text-[var(--text)]">
                {t('booking.selectDepartureTime')}
              </h2>
              <p className="text-sm sm:text-[13px] text-[var(--text-sub)] mt-0.5">
                {t('booking.chooseTime') || 'What time would you like to depart?'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowTimeModal(false)}
              aria-label="Close"
              className="w-9 h-9 rounded-sm bg-[#F3F4F6] hover:bg-[#E9ECEF] text-[#52525B] flex items-center justify-center transition-colors duration-200 cursor-pointer border-none shrink-0"
            >
              <X size={18} />
            </button>
          </div>
          <div className="min-h-0 overflow-y-auto px-5 sm:px-8 pb-6 -mx-0">
          {!form.travelDate ? (
            <div className="py-8 text-center">
              <Clock size={28} className="mx-auto text-[var(--text-muted)] mb-2" />
              <p className="text-sm text-[var(--text-muted)]">{t('booking.selectDate')}</p>
            </div>
          ) : (() => {
            const isTimeDisabled = (time: string): boolean => {
              return blockedTimes.includes(time);
            };

            const selectedRoute = availableRoutes.find(r => r._id === form.routeId);
            const routeDepartureTimes: string[] = Array.isArray(selectedRoute?.departureTimes)
              ? selectedRoute.departureTimes.slice().sort()
              : [];
            let allSlots = scheduleConfigured
              ? scheduleTimes
              : (routeDepartureTimes.length > 0 ? routeDepartureTimes : TIME_SLOTS);

            if (allSlots.length === 0) {
              return (
                <div className="py-8 text-center">
                  <Clock size={28} className="mx-auto text-[var(--text-muted)] mb-2" />
                  <p className="text-sm text-[var(--text-sub)]">{t('booking.noBookableDepartures') || 'No departures are available for booking on this date.'}</p>
                </div>
              );
            }

            const morning = allSlots.filter(t => {
              const h = parseInt(t.split(':')[0]);
              return h < 12;
            });
            const afternoon = allSlots.filter(t => {
              const h = parseInt(t.split(':')[0]);
              return h >= 12 && h < 18;
            });
            const night = allSlots.filter(t => {
              const h = parseInt(t.split(':')[0]);
              return h >= 18;
            });

            const renderSection = (title: string, slots: string[]) => {
              if (slots.length === 0) return null;
              return (
                <div className="mb-3 last:mb-0">
                  <div className="flex items-center gap-2 px-1 mb-2">
                    <div className="w-[3px] h-3 rounded-full bg-[var(--blue)]" />
                    <span className="text-base sm:text-sm font-medium uppercase tracking-wide text-[var(--text-muted)]">{title}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {slots.map((time, i) => {
                      const isSelected = form.travelTime === time;
                      const isDisabled = isTimeDisabled(time);
                      return (
                        <motion.button key={time}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.15, delay: 0.12 + i * 0.015, ease: [0.22, 1, 0.36, 1] }}
                          whileHover={isDisabled ? undefined : { scale: 1.04 }}
                          whileTap={isDisabled ? undefined : { scale: 0.95 }}
                          disabled={isDisabled}
                          onClick={() => {
                            if (isDisabled) return;
                            setForm(f => ({ ...f, travelTime: time }));
                            setShowTimeModal(false);
                            if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
                            autoAdvanceRef.current = setTimeout(() => {
                              const currentIndex = stepToIndex(step);
                              if (currentIndex < totalSteps - 1) {
                                setStep(indexToStep(currentIndex + 1));
                              }
                            }, 350);
                          }}
                          className={`px-3 py-3 sm:py-2.5 rounded-md text-base sm:text-sm font-medium transition-colors duration-200 ${
                            isDisabled
                              ? 'bg-[#F3F4F6] text-[#C4C7CC] cursor-not-allowed opacity-70'
                              : isSelected
                                ? 'bg-[var(--blue)] text-white cursor-pointer'
                                : 'bg-[#F9FAFB] hover:bg-[var(--blue-bg)] hover:text-[var(--blue-dark)] text-[var(--text)] cursor-pointer'
                          }`}
                        >
                          <span className="block leading-tight">{time}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              );
            };

            return (
              <>
                {renderSection(t('booking.timePeriodMorning') || 'Morning', morning)}
                {renderSection(t('booking.timePeriodAfternoon') || 'Afternoon', afternoon)}
                {renderSection(t('booking.timePeriodNight') || 'Night', night)}
              </>
            );
          })()}
          </div>
        </div>
      </ModalFrame>
    );
  };

  return (
    <div className="w-full px-4 sm:px-6 md:px-6 pt-6 pb-6 sm:pb-10 md:pt-0.5 max-w-6xl mx-auto">

      {/* Main wizard column */}
        <div className="w-full max-w-5xl mx-auto">

      {!isOnline && (
        <div           className="flex items-center gap-2 px-3.5 py-2.5 mb-4 rounded-md text-sm font-medium"
          style={{ background: 'rgba(29, 78, 216, 0.08)', color: 'var(--blue-dark)', border: '1px solid rgba(29, 78, 216, 0.2)' }}
        >
          <Info size={14} className="shrink-0" />
          <span>
            {t('booking.offlineMode') || "You're offline — showing saved schedules. Booking & payments need an internet connection."}
          </span>
        </div>
      )}

      {/* Progress bar */}
      <div className="hidden md:block mt-2 mb-8">
        <div className="flex items-start">
          {STEP_TITLES.map((label, i) => {
            const idx = stepToIndex(step);
            const done = i < idx;
            const active = i === idx;
            return (
              <Fragment key={label}>
                {i > 0 && (
                  <div className="relative flex-1 mt-[13px] mx-2 border-t-2 border-dashed border-zinc-300">
                    <motion.div
                      className="absolute inset-y-0 left-0 border-t-2 border-[var(--blue)]"
                      style={{ top: '-2px', width: 0 }}
                      initial={false}
                      animate={{ width: done ? '100%' : '0%' }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                )}
                <div className="flex flex-col items-center gap-2 shrink-0 w-24">
                  <span className="relative isolate flex items-center justify-center">
                    {active && (
                      <span
                        aria-hidden="true"
                        className="absolute -inset-1.5 -z-10 rotate-3 rounded-full bg-blue-400"
                      />
                    )}
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                        done
                          ? 'bg-[var(--blue)] border-[var(--blue)] text-white shadow-[0_2px_10px_rgba(29,78,216,0.45)]'
                          : active
                            ? 'border-[var(--text)] bg-white text-[var(--text)]'
                            : 'border-zinc-300 bg-white text-[var(--text-muted)]'
                      }`}
                    >
                      {done ? <Check size={13} /> : i + 1}
                    </span>
                  </span>
                  <span
                    className={`text-[11px] leading-tight text-center transition-colors duration-300 ${
                      active ? 'font-bold text-[var(--text)]' : done ? 'font-semibold text-[var(--text)]' : 'font-medium text-[var(--text-muted)]'
                    }`}
                  >
                    {label}
                  </span>
                </div>
              </Fragment>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="pb-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center"
          >
            <div className="relative isolate inline-block">
              <Sparkles
                className="pointer-events-none absolute -top-6 -left-9 h-8 w-16 text-[var(--blue)]"
              />
              <h2 className="font-semibold text-3xl sm:text-5xl text-black text-center">
                <HighlightWord>{STEP_TITLES[step]}</HighlightWord>
              </h2>
            </div>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-base text-[var(--text-sub)] pb-5 sm:mb-10 pt-2 leading-relaxed text-center"
          >
            {STEP_DESCS[step]}
          </motion.p>
          {renderStepContent()}
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center justify-between pt-5 border-t border-zinc-200 gap-2"
      >
        <motion.button onClick={handleBack} disabled={step === 0 && !showSchedule && !form.destination}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-md text-base font-semibold transition-all duration-200 cursor-pointer shrink-0 text-[var(--text)] hover:bg-[#F9FAFB] border-2 border-[var(--border)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          <ArrowLeft size={14} />
          <span className="hidden xs:inline sm:inline">{t('booking.back')}</span>
        </motion.button>

        <motion.button onClick={handleNext} disabled={submitting || loading}
          whileTap={{ scale: 0.97 }}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-md bg-[var(--blue)] text-white text-base font-semibold hover:bg-[var(--blue-dark)] active:bg-[var(--blue-deep)] transition-all duration-200 disabled:opacity-50 cursor-pointer"
        >
          {submitting ? (
            <><Loader size={14} className="animate-spin" /> {t('booking.booking')}...</>
          ) : step === 2 ? (
            <>{t('booking.payNow')} <ArrowRight size={14} /></>
          ) : (
            <>{t('booking.continue')} <ArrowRight size={14} /></>
          )}
        </motion.button>
      </motion.div>

      {/* Footer info */}
      {step !== 2 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="mt-7 pt-5 border-t border-zinc-300 "
        >
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 text-base font-medium text-[var(--text-sub)]">
            <motion.div className="flex items-start gap-2 flex-1"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <Clock size={12} className="shrink-0 mt-0.5  text-[var(--blue)]" />
              <span className="leading-relaxed text-[13px] ">{t('booking.cancelPolicy')}</span>
            </motion.div>
            <motion.div className="flex items-start gap-2 flex-1"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <Smartphone size={12} className="shrink-0 mt-0.5 text-[var(--blue)]" />
              <span className="leading-relaxed text-[13px]">{t('booking.payMethods')}</span>
            </motion.div>
            <motion.div className="flex items-start gap-2 flex-1"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <Info size={12} className="shrink-0 mt-0.5 text-[var(--blue)]" />
              <Link to="/guide" className="leading-relaxed text-[13px]  text-[var(--blue-dark)] underline underline-offset-2 hover:text-[var(--blue-deep)] transition-colors">
                {t('booking.guideLink')}
              </Link>
            </motion.div>
          </div>
        </motion.div>
      )}
        </div>

      {/* Pay Online modal — the only payment option (opens on step 2 entry) */}
      <PaymentModal
        open={step === 2 && showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setStep(1);
        }}
        phoneValue={phoneDisplay}
        onPhoneChange={(raw) => {
          const digits = raw.replace(/\D/g, '').replace(/^250/, '').slice(0, 10);
          setPhoneInput(digits);
          const normalized = digits.replace(/^0+/, '').slice(0, 9);
          setForm(f => ({ ...f, phone: `${t('booking.phonePrefix')} ${normalized}` }));
          if (errors.phone) setErrors(e => ({ ...e, phone: '' }));
        }}
        phoneError={errors.phone}
        showGuestName={!user}
        guestName={guestName}
        onGuestNameChange={setGuestName}
        useExtraContactPhone={useExtraContactPhone}
        onToggleExtraContactPhone={() => setUseExtraContactPhone(v => !v)}
        contactPhone={contactPhoneDisplay}
        onContactPhoneChange={(raw) => {
          const digits = raw.replace(/\D/g, '').replace(/^250/, '').slice(0, 10);
          setContactPhoneInput(digits);
          const normalized = digits.replace(/^0+/, '').slice(0, 9);
          setForm(f => ({ ...f, contactPhone: `${t('booking.phonePrefix')} ${normalized}` }));
          if (errors.contactPhone) setErrors(e => ({ ...e, contactPhone: '' }));
        }}
        contactPhoneError={errors.contactPhone}
        total={onlineTotal}
        fareTotal={fareTotal}
        serviceFeeTotal={serviceFeeTotal}
        paymentFee={onlinePaymentFee}
        origin={form.origin}
        destination={form.destination}
        via={form.via}
        submitting={submitting}
        onSubmit={handleNext}
        submitError={submitError || undefined}
        freeTicketsCount={freeTicketsCount}
        useFreeTicket={useFreeTicket}
        onToggleFreeTicket={() => setUseFreeTicket(v => !v)}
        showPricingBreakdown
      />

      {renderCityPickerModal()}
      {renderDateModal()}
      {renderTimeModal()}
    </div>
  );
}