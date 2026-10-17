import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Check,
  Loader,
  AlertCircle,
  Smartphone,
  User,
  Plus,
  ChevronRight,
  Copy,
  Armchair,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const getFocusable = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
    ),
  );

interface ModalFrameProps {
  open: boolean;
  onClose: () => void;
  labelledBy?: string;
  children: ReactNode;
  maxWidth?: number;
  sheet?: boolean;
  /**
   * Panel height. In sheet mode it defaults to 80dvh. In centered mode it pins
   * the panel to this height (and to the same max-height), which is how the
   * booking selectors get a predictable 89%-of-the-screen layout.
   */
  height?: string;
  /**
   * Sheet mode only: keep the panel flush to the bottom and spanning the full
   * width at every breakpoint (a true bottom sheet on desktop too), instead of
   * becoming a centred card from `sm` up.
   */
  fullBleed?: boolean;
}

/**
 * The booking selectors (destination, agency, date, hour, payment) are all
 * built on this so they share one size: a fixed 89% of the viewport. On a phone
 * the panel is a bottom sheet flush with the left, right and bottom edges; from
 * the `sm` breakpoint up it is a centred card. `dvh` keeps the ratio honest when
 * mobile browser chrome collapses.
 */
export const MODAL_VIEWPORT_HEIGHT = 'var(--modal-h, 89dvh)';

export function ModalFrame({ open, onClose, labelledBy, children, maxWidth = 1000, sheet = false, height, fullBleed = false }: ModalFrameProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  const sheetHeight = height ?? '80dvh';

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key === 'Tab' && panelRef.current) {
        const focusable = getFocusable(panelRef.current);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;
        if (e.shiftKey) {
          if (active === first || !panelRef.current.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else if (active === last || !panelRef.current.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    panelRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      restoreFocusRef.current?.focus?.();
    };
  }, [open]);

  // When the on-screen keyboard opens (mobile), the visual viewport shrinks
  // while the layout viewport stays the same. Push the bottom sheet above the
  // keyboard so focused inputs, their suggestions, and the modal's footer stay
  // visible instead of being covered by the keypad.
  useEffect(() => {
    if (!open || !sheet) return;
    const vv = window.visualViewport;
    if (!vv) {
      setKeyboardOffset(0);
      return;
    }
    const update = () => {
      const offset = Math.max(0, Math.round(window.innerHeight - vv.height));
      setKeyboardOffset(offset);
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      setKeyboardOffset(0);
    };
  }, [open, sheet]);

  const keyboardVisible = keyboardOffset > 0;

  return (
    <AnimatePresence>
      {open && (
        <div className={`fixed inset-0 z-[1000] ${sheet ? '' : 'overflow-y-auto'}`}>
          <motion.div
            className="fixed inset-0"
            style={{ background: 'rgba(15, 23, 42, 0.45)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={onClose}
          />
          {sheet ? (
            <div
              className={`relative flex h-full justify-center items-end ${fullBleed || keyboardVisible ? 'sm:items-end' : 'sm:items-center'} ${fullBleed ? '' : 'sm:p-6'}`}
              onClick={e => {
                if (e.target === e.currentTarget) onClose();
              }}
            >
              <motion.div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={labelledBy}
                tabIndex={-1}
                className={`relative w-full flex flex-col overflow-hidden bg-white outline-none rounded-t-[20px] ${fullBleed ? '' : 'sm:rounded-[20px]'}`}
                style={{
                  maxWidth: fullBleed ? '100%' : maxWidth,
                  height: keyboardVisible ? `calc(100% - ${keyboardOffset}px)` : sheetHeight,
                  maxHeight: keyboardVisible ? `calc(100% - ${keyboardOffset}px)` : sheetHeight,
                  marginBottom: keyboardVisible ? keyboardOffset : 0,
                  boxShadow: '0 -12px 40px -12px rgba(15, 23, 42, 0.25), 0 16px 40px -18px rgba(15, 23, 42, 0.22)',
                }}
                initial={{ y: '100%', opacity: 0.6 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0.6 }}
                transition={{ type: 'spring', damping: 30, stiffness: 340 }}
                onClick={e => e.stopPropagation()}
              >
                <div className="shrink-0 flex justify-center pt-3 pb-1 sm:hidden">
                  <div className="w-10 h-1.5 rounded-full bg-[#E4E4E7]" />
                </div>
                {children}
              </motion.div>
            </div>
          ) : (
            <div
              className="relative flex h-full items-center justify-center p-3 sm:p-6"
              onClick={e => {
                if (e.target === e.currentTarget) onClose();
              }}
            >
              <motion.div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={labelledBy}
                tabIndex={-1}
                className="relative w-full flex flex-col overflow-hidden bg-white outline-none border border-[#E5E7EB] rounded-[20px]"
                style={{
                  maxWidth,
                  // A supplied height pins the panel (both axes) so every
                  // booking selector occupies the same 89% of the screen; with
                  // no height the dialog stays content-sized as before.
                  ...(height
                    ? { height, maxHeight: height }
                    : { maxHeight: 'min(90vh, 600px)' }),
                  boxShadow: '0 30px 80px rgba(15, 23, 42, 0.16)',
                }}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                onClick={e => e.stopPropagation()}
              >
                {children}
              </motion.div>
            </div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}

/* ---------------------------------------------------------------------- */
/* Payment method sidebar                                                 */
/* ---------------------------------------------------------------------- */

// Airtel Money shares the same MoMo-style flow/key as MTN (phone entry +
// optional USSD dial), so both are treated as "momo-like" providers below.
type PaymentMethodId = 'mtn' | 'airtel';

interface PaymentMethodDef {
  id: PaymentMethodId;
  labelKey: string;
  fallbackLabel: string;
  enabled: boolean;
  icon: ReactNode;
}

function MtnBadge() {
  return (
    <span className="w-8 h-8 rounded-full bg-[#FFCB05] flex items-center justify-center shrink-0 border border-[#F0BE00]">
      <span className="text-[9px] font-extrabold tracking-tight text-[#111111]">MTN</span>
    </span>
  );
}

function AirtelBadge() {
  return (
    <span className="relative w-8 h-8 rounded-full bg-[#FCE9EA] flex items-center justify-center shrink-0">
      <span className="w-4 h-4 rounded-full border-2 border-[#ED1C24]" />
    </span>
  );
}

function usePaymentMethods(): PaymentMethodDef[] {
  return [
    { id: 'mtn', labelKey: 'booking.momo', fallbackLabel: 'MTN Mobile Money', enabled: true, icon: <MtnBadge /> },
    { id: 'airtel', labelKey: 'booking.airtel', fallbackLabel: 'Airtel Money', enabled: true, icon: <AirtelBadge /> },
  ];
}

function PaymentMethodIconsRow({
  selected,
  onSelect,
}: {
  selected: PaymentMethodId;
  onSelect: (id: PaymentMethodId) => void;
}) {
  const { t } = useTranslation();
  const methods = usePaymentMethods();

  return (
    <div className="md:hidden shrink-0 flex items-center justify-between gap-3 px-4 py-2.5 border-b border-[#E5E7EB] bg-[#F6F7F9]">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-[11px] font-semibold text-[#52525B] shrink-0">{t('booking.choosePaymentMethod')}</span>
        <div className="flex items-center gap-1.5">
          {methods.map(method => {
            const isSelected = method.id === selected;
            const label = t(method.labelKey, { defaultValue: method.fallbackLabel });
            return (
              <button
                key={method.id}
                type="button"
                disabled={!method.enabled}
                onClick={() => method.enabled && onSelect(method.id)}
                aria-label={label}
                aria-pressed={isSelected}
                className={`rounded-full transition-all duration-150 cursor-pointer ${isSelected ? 'ring-2 ring-[#1D4ED8] ring-offset-1 ring-offset-[#F6F7F9]' : 'opacity-75'}`}
              >
                {method.icon}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PaymentMethodSidebar({
  selected,
  onSelect,
  total,
}: {
  selected: PaymentMethodId;
  onSelect: (id: PaymentMethodId) => void;
  total: number;
}) {
  const { t } = useTranslation();
  const methods = usePaymentMethods();
  const currency = t('booking.currency');

  return (
    <div className="hidden md:block w-[210px] shrink-0 bg-zinc-50 px-4 py-6 overflow-y-auto">

      <h4 className="text-base font-bold text-[#111827] px-1 mb-3">{t('booking.choosePaymentMethod')}</h4>
      <div className="space-y-1.5">
        {methods.map(method => {
          const isSelected = method.id === selected;
          const label = t(method.labelKey, { defaultValue: method.fallbackLabel });
          return (
            <button
              key={method.id}
              type="button"
              disabled={!method.enabled}
              onClick={() => method.enabled && onSelect(method.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[14px] text-left transition-all duration-150 ${
                isSelected
                  ? 'bg-white shadow-[0_2px_10px_-4px_rgba(15,23,42,0.18)]'
                  : method.enabled
                    ? 'hover:bg-white/70 cursor-pointer'
                    : 'opacity-60 cursor-not-allowed'
              }`}
            >
              {method.icon}
              <span className={`flex-1 min-w-0 text-sm truncate ${isSelected ? 'font-bold text-[#111827]' : 'font-semibold text-[#27272A]'}`}>
                {label}
              </span>
              {!method.enabled && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#A1A1AA] shrink-0">
                  {t('booking.comingSoon', { defaultValue: 'Soon' })}
                </span>
              )}
              {method.enabled && !isSelected && <ChevronRight size={16} className="text-[#A1A1AA] shrink-0" />}
            </button>
          );
        })}
      </div>
      <div className="rounded-[14px]  px-3.5 py-3 mt-20">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#52525B] mb-0.5">{t('booking.total')}</p>
        <p className="text-lg font-extrabold text-zinc-900 tabular-nums">{(total ?? 0).toLocaleString()} <span className=" font-extrabold uppercase tracking-wider text-green-600">{currency}</span> </p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Payment modal                                                          */
/* ---------------------------------------------------------------------- */

export interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  phoneValue: string;
  onPhoneChange: (value: string) => void;
  phoneError?: string;
  showGuestName?: boolean;
  guestName?: string;
  onGuestNameChange?: (value: string) => void;
  useExtraContactPhone?: boolean;
  onToggleExtraContactPhone?: () => void;
  contactPhone?: string;
  onContactPhoneChange?: (value: string) => void;
  contactPhoneError?: string;
  total: number;
  /** Number of seats being paid for; shown on the payment screen. */
  seats?: number;
  /** Trip origin, accepted for API compatibility. */
  origin?: string;
  /** Trip destination, accepted for API compatibility. */
  destination?: string;
  /** Optional via point, accepted for API compatibility. */
  via?: string;
  submitting?: boolean;
  onSubmit: () => void;
  submitError?: string;
  freeTicketsCount?: number;
  useFreeTicket?: boolean;
  onToggleFreeTicket?: () => void;
  /** Optional USSD dial string for "Option 2". If omitted, Option 2 is hidden. */
  ussdCode?: string;
  /** Portion of the ussdCode to visually highlight (e.g. the merchant/txn code). */
  ussdHighlight?: string;
}

export default function PaymentModal({
  open,
  onClose,
  phoneValue,
  onPhoneChange,
  phoneError,
  showGuestName = false,
  guestName = '',
  onGuestNameChange,
  useExtraContactPhone = false,
  onToggleExtraContactPhone,
  contactPhone = '',
  onContactPhoneChange,
  contactPhoneError,
  total,
  seats,
  submitting = false,
  onSubmit,
  submitError,
  freeTicketsCount = 0,
  useFreeTicket = false,
  onToggleFreeTicket,
  ussdCode,
  ussdHighlight,
}: PaymentModalProps) {
  const { t } = useTranslation();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId>('mtn');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedMethod('mtn');
      setCopied(false);
    }
  }, [open]);

  const currency = t('booking.currency');
  const canPay = useFreeTicket || (!!phoneValue && !phoneError);

  // Airtel Money rides on the same underlying MoMo key/flow as MTN, so both
  // providers share the phone-entry + USSD UI below, just with a different
  // provider name shown to the user.
  const providerName = selectedMethod === 'airtel' ? t('booking.airtel', { defaultValue: 'Airtel Money' }) : t('booking.momo', { defaultValue: 'MTN MoMo' });

  const handleCopy = async () => {
    if (!ussdCode) return;
    try {
      await navigator.clipboard.writeText(ussdCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable — silently ignore
    }
  };

  const renderUssd = () => {
    if (!ussdCode) return null;
    if (!ussdHighlight || !ussdCode.includes(ussdHighlight)) return ussdCode;
    const idx = ussdCode.indexOf(ussdHighlight);
    return (
      <>
        {ussdCode.slice(0, idx)}
        <span className="bg-[#DCFCE7] text-[#111827] rounded px-0.5">{ussdHighlight}</span>
        {ussdCode.slice(idx + ussdHighlight.length)}
      </>
    );
  };

  return (
    <ModalFrame sheet open={open} onClose={onClose} labelledBy="payment-modal-title" maxWidth={900} height={MODAL_VIEWPORT_HEIGHT}>
      <div className="relative flex flex-col md:flex-row flex-1 min-h-0">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-2 right-4 text-red-500 sm:top-3.5 sm:right-4 z-10 w-8 h-8 rounded-full bg-zinc-300/30 backdrop-blur-2xl shadow-[0_2px_10px_-2px_rgba(220,38,38,0.45)] flex items-center justify-center transition-colors duration-200 cursor-pointer border-none hover:bg-[#B91C1C]"
        >
          <X size={16} />
        </button>

        {/* Sidebar (desktop) */}
        <PaymentMethodSidebar selected={selectedMethod} onSelect={setSelectedMethod} total={total} />

        {/* Mobile payment-method icons row */}
        <PaymentMethodIconsRow selected={selectedMethod} onSelect={setSelectedMethod} />

        {/* Main panel */}
        <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">
          {!useFreeTicket && (
            <div className="px-5 pt-4 sm:px-7 sm:pt-5 pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h4 className="text-[15px] font-bold text-[#111827]">
                    {t('booking.payOption1', { method: providerName })}
                  </h4>
                  {!!seats && seats > 0 && (
                    <p className="mt-0.5 flex items-center gap-1.5 text-[13px] font-semibold text-[#1D4ED8]">
                      <Armchair size={13} className="shrink-0" />
                      {seats} seat{seats > 1 ? 's' : ''} to pay for
                    </p>
                  )}
                </div>
                <span className="md:hidden text-[16px] font-extrabold text-[#1D4ED8] tabular-nums whitespace-nowrap shrink-0">
                  {total.toLocaleString()} {currency}
                </span>
              </div>
              <div className="relative">
                <Smartphone size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71717A] pointer-events-none" />
                <input
                  id="payment-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phoneValue}
                  onChange={e => onPhoneChange(e.target.value)}
                  placeholder={t('booking.payPhonePlaceholder')}
                  aria-invalid={!!phoneError}
                  maxLength={11}
                  className={`w-full h-12 sm:h-14 rounded-[14px] sm:rounded-[16px] border bg-white pl-11 pr-4 text-base outline-none placeholder:text-[#A1A1AA] transition-all duration-200 ${
                    phoneError
                      ? 'border-[#FCA5A5] focus:border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/20'
                      : 'border-gray-400 border-dashed focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20'
                  }`}
                />
              </div>
              {phoneError && <p className="text-xs text-[#DC2626] mt-2">{phoneError}</p>}
              <p className="text-[13px] text-[#52525B] leading-relaxed mt-2">{t('booking.payInstructions')}</p>
            </div>
          )}

          <div className="px-5 pt-3 sm:px-7 sm:pt-4 pb-4 space-y-3">
            <h3 id="payment-modal-title" className="sr-only">
              {t('booking.paymentTitle')}
            </h3>

            {showGuestName && (
              <div className="space-y-2">
                <label htmlFor="payment-guest-name" className="block text-sm font-semibold text-[#111827]">
                  {t('booking.fullName')}
                </label>
                <div className="relative">
                  <User size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71717A] pointer-events-none" />
                  <input
                    id="payment-guest-name"
                    autoComplete="name"
                    value={guestName}
                    onChange={e => onGuestNameChange?.(e.target.value)}
                    placeholder={t('booking.guestNamePlaceholder')}
                    className="w-full h-12 rounded-[14px] border border-[#E5E7EB] bg-white pl-11 pr-4 text-sm outline-none placeholder:text-[#A1A1AA] focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20 transition-all duration-200"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              {!useExtraContactPhone ? (
                <button
                  type="button"
                  onClick={onToggleExtraContactPhone}
                  className="w-full flex items-center gap-3 rounded-[14px] border border-dashed border-[#D1D5DB] bg-white px-4 py-3 text-left hover:border-[#1E40AF] hover:bg-[#F8FAFC] transition-all duration-200 cursor-pointer"
                >
                  <span className="w-7 h-7 rounded-full bg-[#EFF6FF] text-[#1E40AF] flex items-center justify-center shrink-0">
                    <Plus size={14} />
                  </span>
                  <span className="text-sm font-semibold text-[#111827]">{t('booking.addContactPhone')}</span>
                </button>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <label htmlFor="payment-contact-phone" className="block text-sm font-semibold text-[#111827]">
                      {t('booking.contactPhoneTitle')}
                    </label>
                    <button
                      type="button"
                      onClick={onToggleExtraContactPhone}
                      aria-label={t('booking.removeContactPhone')}
                      className="w-7 h-7 rounded-full bg-[#F3F4F6] hover:bg-[#E9ECEF] text-[#52525B] flex items-center justify-center transition-colors duration-200 cursor-pointer border-none shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="relative">
                    <Smartphone size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71717A] pointer-events-none" />
                    <input
                      id="payment-contact-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={contactPhone}
                      onChange={e => onContactPhoneChange?.(e.target.value)}
                      placeholder={t('booking.payPhonePlaceholder')}
                      aria-invalid={!!contactPhoneError}
                      maxLength={11}
                      className={`w-full h-12 rounded-[14px] border bg-white pl-11 pr-4 text-sm outline-none placeholder:text-[#A1A1AA] transition-all duration-200 ${
                        contactPhoneError
                          ? 'border-[#FCA5A5] focus:border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/20'
                          : 'border-[#E5E7EB] focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20'
                      }`}
                    />
                  </div>
                  {contactPhoneError && <p className="text-xs text-[#DC2626]">{contactPhoneError}</p>}
                  <p className="text-xs text-[#52525B] leading-relaxed">{t('booking.contactModalDesc')}</p>
                </>
              )}
            </div>

            {freeTicketsCount > 0 && (
              <div>
                <button
                  type="button"
                  onClick={onToggleFreeTicket}
                  aria-pressed={useFreeTicket}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-[14px] border transition-all duration-200 cursor-pointer ${
                    useFreeTicket
                      ? 'bg-[#F4F4F5] border-[#1E40AF] shadow-[0_0_0_3px_rgba(37,99,235,0.10)]'
                      : 'bg-white border-[#E5E7EB] hover:shadow-[0_4px_14px_-6px_rgba(15,23,42,0.12)]'
                  }`}
                >
                  <span
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200 ${
                      useFreeTicket ? 'bg-[#F4F4F5] text-[#1E40AF]' : 'bg-[#F1F5F9] text-[#64748B]'
                    }`}
                  >
                    <Check size={16} />
                  </span>
                  <span className="text-left flex-1 min-w-0">
                    <span className={`block text-sm ${useFreeTicket ? 'font-bold text-[#1D4ED8]' : 'font-semibold text-[#111827]'}`}>
                      {t('booking.useFreeTicket')}
                    </span>
                    <span className="block text-xs text-[#52525B]">
                      {freeTicketsCount} {t('booking.available')}
                    </span>
                  </span>
                </button>
                {useFreeTicket && <p className="mt-2 text-xs text-[#1E40AF]">{t('booking.freeBookingInfo')}</p>}
              </div>
            )}

            {/* Option 2: USSD dial (MTN or Airtel — same code/flow) */}
            {!useFreeTicket && ussdCode && (
              <>
                <div className="" />
                <div className="rounded-[16px] bg-[#F6F7F9] p-4 space-y-3">
                  <h4 className="text-[15px] font-bold text-[#111827]">
                    {t('booking.payOption2', { defaultValue: `Option 2: Dial this on your ${providerName} phone to pay` })}
                  </h4>
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-white border border-[#E5E7EB] text-[#71717A] flex items-center justify-center shrink-0 font-bold">
                      #
                    </span>
                    <span className="flex-1 min-w-0 text-lg font-bold text-[#111827] tabular-nums truncate">{renderUssd()}</span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="h-10 px-4 rounded-[12px] bg-white border border-[#E5E7EB] text-sm font-semibold text-[#111827] flex items-center gap-2 hover:bg-[#F8FAFC] transition-all duration-200 cursor-pointer shrink-0"
                    >
                      {copied ? <Check size={15} className="text-[#059669]" /> : <Copy size={15} />}
                      {copied ? t('booking.payCopied') : t('booking.payCopy')}
                    </button>
                  </div>
                </div>
              </>
            )}

            {submitError && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-[14px]" style={{ background: '#FEF2F2', border: '1px solid #FCA5A5' }}>
                <AlertCircle size={16} className="text-[#DC2626] mt-0.5 shrink-0" />
                <p className="text-[13px] font-medium text-[#B91C1C]">{submitError}</p>
              </div>
            )}
          </div>

          {/* Bottom pay bar */}
          <div className="shrink-0 px-5 pt-3 pb-4 sm:px-7 sm:pt-4 sm:pb-5 border-t border-[#E5E7EB]">
            {!useFreeTicket ? (
              <button
                type="button"
                onClick={onSubmit}
                disabled={!canPay || submitting}
                className="w-full h-12 sm:h-14 rounded-[14px] sm:rounded-[16px] bg-[var(--green-cta)] hover:bg-[var(--green-cta-hover)] active:bg-[var(--green-cta-active)] text-[var(--green-ink)] text-sm font-bold shadow-[0_10px_24px_-10px_rgba(116,226,76,0.9)] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {submitting ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    {t('booking.booking')}...
                  </>
                ) : (
                  t('booking.payButton', { amount: total.toLocaleString(), currency })
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={onSubmit}
                disabled={submitting}
                className="w-full h-12 sm:h-14 rounded-[14px] sm:rounded-[16px] bg-[var(--green-cta)] hover:bg-[var(--green-cta-hover)] active:bg-[var(--green-cta-active)] text-[var(--green-ink)] text-sm font-bold shadow-[0_10px_24px_-10px_rgba(116,226,76,0.9)] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    {t('booking.booking')}...
                  </>
                ) : (
                  t('booking.bookFreeTicket')
                )}
              </button>
            )}
          </div>
          
        </div>
      </div>
    </ModalFrame>
  );
}