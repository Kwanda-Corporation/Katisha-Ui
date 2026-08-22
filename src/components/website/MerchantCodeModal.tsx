import { useState, useEffect } from 'react';
import {
  X, Smartphone, User, Loader, Copy, Check, Phone, ArrowRight,
} from 'lucide-react';
import { useTranslation } from '../../../node_modules/react-i18next';
import { ModalFrame } from './PaymentModal';

interface MerchantCodeModalProps {
  open: boolean;
  onClose: () => void;
  merchantCode: string;
  merchantName?: string;
  ussdTemplate: string;
  amount: number;
  showGuestName: boolean;
  guestName: string;
  onGuestNameChange: (v: string) => void;
  phoneValue: string;
  onPhoneChange: (raw: string) => void;
  phoneError?: string;
  submitting: boolean;
  onSubmit: () => void;
  submitError?: string;
  bookingResult?: any;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return isMobile;
}

function generateUssd(template: string, code: string, amount: number): string {
  return template
    .replace('{{code}}', code)
    .replace('{{amount}}', String(amount));
}

function attemptDial(ussd: string): boolean {
  try {
    const a = document.createElement('a');
    // '#' delimits a URL fragment, so it must be percent-encoded — otherwise
    // the browser strips everything from '#' onward and the dialer receives
    // an incomplete USSD string.
    a.href = `tel:${ussd.replace(/#/g, '%23')}`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  } catch {
    return false;
  }
}

export default function MerchantCodeModal({
  open,
  onClose,
  merchantCode,
  merchantName,
  ussdTemplate,
  amount,
  showGuestName,
  guestName,
  onGuestNameChange,
  phoneValue,
  onPhoneChange,
  phoneError,
  submitting,
  onSubmit,
  submitError,
  bookingResult,
}: MerchantCodeModalProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const currency = t('booking.currency');
  const [copied, setCopied] = useState(false);

  const ussd = generateUssd(ussdTemplate, merchantCode, amount);

  const handleDialAndConfirm = () => {
    // Handing off to the phone's dialer suspends this page — wait 2 seconds
    // so the booking request goes out and the UI can show progress first,
    // then open the call app with the USSD pre-filled.
    window.setTimeout(() => attemptDial(ussd), 2000);
    onSubmit();
  };

  const handleCopyAndConfirm = async () => {
    try {
      await navigator.clipboard.writeText(ussd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  const canSubmit = showGuestName ? (!!guestName.trim() && !!phoneValue && !phoneError) : (!!phoneValue && !phoneError);

  if (bookingResult) {
    return (
      <ModalFrame
        sheet
        open={open}
        onClose={onClose}
        labelledBy="merchant-receipt-title"
        maxWidth={680}
        height={isMobile ? '92dvh' : 'min(75dvh, 580px)'}
      >
        <div className="relative flex flex-col flex-1 min-h-0">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-2 right-4 text-red-500 sm:top-3.5 sm:right-4 z-10 w-8 h-8 rounded-full bg-zinc-300/30 backdrop-blur-2xl shadow-[0_2px_10px_-2px_rgba(220,38,38,0.45)] flex items-center justify-center transition-colors duration-200 cursor-pointer border-none hover:bg-[#B91C1C]"
          >
            <X size={16} />
          </button>

          <div className="flex-1 overflow-y-auto px-5 pt-6 sm:px-8 sm:pt-8 pb-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-[#FEF3C7] border-2 border-[#FCD34D] flex items-center justify-center mx-auto mb-4">
                <Loader size={28} className="text-[#CA8A04] animate-spin" />
              </div>
              <h2 id="merchant-receipt-title" className="text-xl font-bold text-[#111827] mb-1">
                {t('booking.paymentProcessing', { defaultValue: 'Payment Processing' })}
              </h2>
              <p className="text-[13px] text-[#52525B] leading-relaxed">
                {t('booking.merchantCodeProcessingMsg', {
                  defaultValue: 'Your booking has been created and we are waiting for payment confirmation. We will confirm your payment and send your ticket once verified.',
                })}
              </p>
            </div>

            <div className="rounded-md border border-[#E5E7EB] bg-[#FAFAFA] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E5E7EB] bg-[#F4F4F5]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#52525B]">
                  {t('booking.bookingReceipt', { defaultValue: 'Booking Receipt' })}
                </span>
              </div>
              <div className="px-4 divide-y divide-[#E5E7EB]">
                <ReceiptRow label={t('booking.refCode')} value={bookingResult.referenceCode} />
                <ReceiptRow label={t('booking.destination')} value={`${bookingResult.origin} \u2192 ${bookingResult.destination}`} />
                <ReceiptRow label={t('booking.travelDate')} value={bookingResult.travelDate ? new Date(bookingResult.travelDate).toLocaleDateString() : ''} />
                <ReceiptRow label={t('booking.departureTime')} value={bookingResult.travelTime} />
                <ReceiptRow label={t('booking.numSeats')} value={String(bookingResult.seats)} />
                <ReceiptRow label={t('booking.amount')} value={`${bookingResult.totalAmount?.toLocaleString()} ${currency}`} />
                {bookingResult.systemFee > 0 && (
                  <ReceiptRow label={t('booking.katishaFee', { defaultValue: 'Katisha fee' })} value={`${bookingResult.systemFee.toLocaleString()} ${currency}`} />
                )}
                <ReceiptRow
                  label={t('booking.total')}
                  value={`${(bookingResult.totalAmount + (bookingResult.systemFee || 0)).toLocaleString()} ${currency}`}
                  bold
                />
                <ReceiptRow label={t('booking.paymentMethod', { defaultValue: 'Payment method' })} value={t('booking.payWithMerchantCode', { defaultValue: 'MoMo Merchant Code' })} />
                <ReceiptRow
                  label={t('booking.paymentStatus', { defaultValue: 'Payment status' })}
                  value={t('booking.awaitingConfirmation', { defaultValue: 'Awaiting Confirmation' })}
                  highlight
                />
              </div>
            </div>

            <div className="mt-4 rounded-md bg-[#EFF6FF] border border-[#BFDBFE] p-3.5">
              <p className="text-[12px] text-[#1E40AF] leading-relaxed text-center">
                {t('booking.merchantCodeReceiptNote', {
                  defaultValue: 'Your payment is being processed. You will receive your ticket once the payment is confirmed by our team.',
                })}
              </p>
            </div>
          </div>
        </div>
      </ModalFrame>
    );
  }

  return (
    <ModalFrame
      sheet
      open={open}
      onClose={onClose}
      labelledBy="merchant-modal-title"
      maxWidth={680}
      height={isMobile ? '92dvh' : 'min(82dvh, 680px)'}
    >
      <div className="relative flex flex-col flex-1 min-h-0">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-2 right-4 text-red-500 sm:top-3.5 sm:right-4 z-10 w-8 h-8 rounded-full bg-zinc-300/30 backdrop-blur-2xl shadow-[0_2px_10px_-2px_rgba(220,38,38,0.45)] flex items-center justify-center transition-colors duration-200 cursor-pointer border-none hover:bg-[#B91C1C] hover:text-white"
        >
          <X size={16} />
        </button>

        <div className="flex-1 min-h-0 px-4 pt-4 sm:px-6 sm:pt-6 pb-3 overflow-y-auto">
          <h2 id="merchant-modal-title" className="text-lg sm:text-xl font-bold text-[#111827] mb-1 tracking-tight">
            {t('booking.payWithMerchantCode', { defaultValue: 'Pay with MoMo Merchant Code' })}
          </h2>
          <p className="text-[13px] text-[#52525B] mb-4 leading-relaxed">
            {t('booking.merchantCodeInstructions', {
              defaultValue: 'Dial the USSD code below on your phone to complete the payment.',
            })}
          </p>

          {/* Guest name */}
          {showGuestName && (
            <div className="space-y-1.5 mb-3">
              <label htmlFor="mc-guest-name" className="block text-sm font-semibold text-[#111827]">
                {t('booking.fullName')}
              </label>
              <div className="relative">
                <User size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71717A] pointer-events-none" />
                <input
                  id="mc-guest-name"
                  autoComplete="name"
                  value={guestName}
                  onChange={e => onGuestNameChange(e.target.value)}
                  placeholder={t('booking.guestNamePlaceholder')}
                  className="w-full h-11 rounded-md border border-[#E5E7EB] bg-white pl-11 pr-4 text-sm outline-none placeholder:text-[#A1A1AA] focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20 transition-all duration-200"
                />
              </div>
            </div>
          )}

          {/* Phone number */}
          <div className="space-y-1.5 mb-4">
            <label htmlFor="mc-phone" className="block text-sm font-semibold text-[#111827]">
              {t('booking.paymentPhone', { defaultValue: 'Payment phone number' })}
            </label>
            <div className="relative">
              <Smartphone size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71717A] pointer-events-none" />
              <input
                id="mc-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phoneValue}
                onChange={e => onPhoneChange(e.target.value)}
                placeholder={t('booking.payPhonePlaceholder')}
                aria-invalid={!!phoneError}
                maxLength={11}
                className={`w-full h-11 sm:h-12 rounded-md border bg-white pl-11 pr-4 text-base outline-none placeholder:text-[#A1A1AA] transition-all duration-200 ${
                  phoneError
                    ? 'border-[#FCA5A5] focus:border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/20'
                    : 'border-[#E5E7EB] focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20'
                }`}
              />
            </div>
            {phoneError && <p className="text-xs text-[#DC2626]">{phoneError}</p>}
          </div>

          {/* Payment card — amount + USSD code, compact */}
          <div className="relative rounded-md  p-4 mb-4 overflow-hidden  ">
            <div className="pointer-events-none absolute inset-0 bg-zinc-100" />
            <div className="pointer-events-none absolute -top-12 -right-10 w-44 h-44 rounded-full bg-white/25 blur-3xl" />

            <div className="relative">
              {/* Amount */}
              <div className="mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-0.5">
                  {t('booking.amountToPay', { defaultValue: 'Amount to pay' })}
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[26px] font-extrabold text-green-900 tabular-nums leading-none">
                    {amount.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-bold uppercase text-red-600">{currency}</span>
                </div>
              </div>

              <div className="h-px bg-black/10 mb-3" />

              {/* USSD code */}
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
                {t('booking.dialThisCode', { defaultValue: 'Dial this code' })}
              </p>
              <div className="flex items-center gap-2 mb-3">
                <span className="flex-1 text-[16px] sm:text-lg font-bold text-zinc-900 tabular-nums break-all font-mono tracking-wide leading-snug">
                  {ussd}
                </span>
                <button
                  type="button"
                  onClick={handleCopyAndConfirm}
                  className="h-8 px-2.5 rounded-[10px] bg-white/85 ring-1 ring-black/10 text-[11px] font-semibold text-zinc-800 flex items-center gap-1.5 hover:bg-white transition-all duration-200 cursor-pointer shrink-0 backdrop-blur-sm"
                >
                  {copied ? <Check size={13} className="text-[#059669]" /> : <Copy size={13} />}
                  {copied ? t('booking.payCopied') : t('booking.payCopy')}
                </button>
              </div>

              {merchantName && (
                <div className="mb-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-0.5">
                    {t('booking.namesOnCode', { defaultValue: 'Names on the code' })}
                  </p>
                  <p className="text-sm font-bold text-zinc-900 leading-tight">{merchantName}</p>
                </div>
              )}

              {isMobile ? (
                <button
                  type="button"
                  onClick={handleDialAndConfirm}
                  disabled={!canSubmit || submitting}
                  className="w-full h-11 rounded-md bg-green-500 hover:bg-green-600 active:bg-green-500 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer  active:scale-[0.98] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  <Phone size={15} />
                  {submitting ? (
                    <>
                      <Loader size={15} className="animate-spin" />
                      {t('booking.booking')}...
                    </>
                  ) : (
                    t('booking.dialAndConfirm', { defaultValue: 'Dial & Confirm Booking' })
                  )}
                </button>
              ) : (
                <div className="rounded-[12px] bg-white/70 ring-1 ring-black/10 p-2.5 text-center backdrop-blur-sm">
                  <p className="text-[11px] font-medium text-zinc-700">
                    {t('booking.desktopFallback', { defaultValue: 'Use your phone to dial the code above, then confirm below.' })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {submitError && (
            <div className="flex items-start gap-2.5 p-3 rounded-md bg-[#FEF2F2] border border-[#FCA5A5] mb-2">
              <span className="text-[13px] font-medium text-[#B91C1C]">{submitError}</span>
            </div>
          )}
        </div>

        {/* Footer — confirm button: desktop only */}
        {!isMobile && (
          <div className="shrink-0 px-4 pt-2 pb-3 sm:px-6 sm:pt-3 sm:pb-4 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit || submitting}
              className="w-full h-12 sm:h-13 rounded-md sm:rounded-[16px] bg-[var(--green-cta)] hover:bg-[var(--green-cta-hover)] active:bg-[var(--green-cta-active)] text-[var(--green-ink)] text-sm font-bold shadow-[0_10px_24px_-10px_rgba(116,226,76,0.9)] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {submitting ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  {t('booking.booking')}...
                </>
              ) : (
                <>
                  {t('booking.confirmBooking', { defaultValue: 'Confirm Booking' })}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </ModalFrame>
  );
}

function ReceiptRow({ label, value, bold, highlight }: { label: string; value: string; bold?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-[12px] text-[#71717A]">{label}</span>
      {highlight ? (
        <span className="text-[12px] font-bold text-[#CA8A04] uppercase tracking-wide">{value}</span>
      ) : (
        <span className={`text-[13px] ${bold ? 'font-bold text-[#111827]' : 'font-semibold text-[#111827]'}`}>{value}</span>
      )}
    </div>
  );
}