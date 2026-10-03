import { motion } from 'framer-motion';
import { Smartphone, CreditCard, ArrowRight, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ModalFrame, MODAL_VIEWPORT_HEIGHT } from './PaymentModal';

export type PaymentChannel = 'momo_merchant' | 'pawapay_online';

interface PaymentMethodSelectProps {
  open: boolean;
  onClose: () => void;
  onSelect: (channel: PaymentChannel) => void;
  merchantCodeFee: number;
  onlineFee: number;
  merchantTotal: number;
  onlineTotal: number;
}

export default function PaymentMethodSelect({
  open,
  onClose,
  onSelect,
  onlineFee,
  merchantTotal,
  onlineTotal,
}: PaymentMethodSelectProps) {
  const { t } = useTranslation();
  const currency = t('booking.currency');

  return (
    <ModalFrame
      open={open}
      onClose={onClose}
      labelledBy="payment-method-select-title"
      maxWidth={760}
      height={MODAL_VIEWPORT_HEIGHT}
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

        <div className="flex-1 overflow-y-auto px-5 pt-5 sm:px-8 sm:pt-7 pb-4">
          <h2 id="payment-method-select-title" className="text-lg sm:text-xl font-bold text-[#111827] mb-1">
            {t('booking.howToPay', { defaultValue: 'How would you like to pay?' })}
          </h2>
          <p className="text-[13px] text-[#52525B] mb-6">
            {t('booking.choosePaymentOption', { defaultValue: 'Choose the payment option that works best for you.' })}
          </p>

          <div className="space-y-3">
            {/* Option 1: MoMo Merchant Code */}
            <motion.button
              type="button"
              onClick={() => onSelect('momo_merchant')}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full text-left p-4 sm:p-5 mt-1 rounded-[16px] border border-gray-400 hover:border-[#1E40AF] bg-white hover:shadow-[0_4px_20px_-6px_rgba(29,78,216,0.25)] transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-start gap-3.5">
                <span className="w-11 h-11 rounded-xl bg-[#FFF7E6] flex items-center justify-center shrink-0 group-hover:bg-[#FFCB05]/20 transition-colors">
                  <Smartphone size={20} className="text-orange-400" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[15px] font-bold text-[#111827]">
                      {t('booking.payWithMerchantCode', { defaultValue: 'Pay with MoMo Merchant Code' })}
                    </h3>
                    <ArrowRight size={16} className="text-[#A1A1AA] shrink-0 group-hover:text-[#1E40AF] transition-colors" />
                  </div>
                  <p className="text-[12px] text-[#52525B] mt-0.5 leading-relaxed">
                    {t('booking.merchantCodeDesc', { defaultValue: 'Lower cost \u2022 Payment confirmation may take longer' })}
                  </p>
                  {merchantTotal > 0 && (
                    <div className="mt-2.5 flex items-baseline gap-1.5">
                      <span className="text-lg font-extrabold text-[#111827] tabular-nums">{merchantTotal.toLocaleString()}</span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-green-600">{currency}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-gray-400" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A1A1AA]">
                {t('booking.or', { defaultValue: 'OR' })}
              </span>
              <div className="flex-1 h-px bg-gray-400" />
            </div>

            {/* Option 2: Pay Online */}
            <motion.button
              type="button"
              onClick={() => onSelect('pawapay_online')}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full text-left p-4 sm:p-5 rounded-[16px] border border-gray-400 hover:border-[#1E40AF] bg-white hover:shadow-[0_4px_20px_-6px_rgba(29,78,216,0.25)] transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-start gap-3.5">
                <span className="w-11 h-11 rounded-xl bg-[#EFF6FF] flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                  <CreditCard size={20} className="text-[#1E40AF]" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[15px] font-bold text-[#111827]">
                      {t('booking.payOnline', { defaultValue: 'Pay Online' })}
                    </h3>
                    <ArrowRight size={16} className="text-[#A1A1AA] shrink-0 group-hover:text-[#1E40AF] transition-colors" />
                  </div>
                  <p className="text-[12px] text-[#52525B] mt-0.5 leading-relaxed">
                    {t('booking.payOnlineDesc', { defaultValue: 'Fast confirmation \u2022 Additional payment fee applies' })}
                  </p>
                  {onlineTotal > 0 && (
                    <div className="mt-2.5 flex items-baseline gap-1.5">
                      <span className="text-lg font-extrabold text-[#111827] tabular-nums">{onlineTotal.toLocaleString()}</span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-green-600">{currency}</span>
                      {onlineFee > 0 && (
                        <span className="text-[11px] text-[#A1A1AA] ml-1">
                          (+{onlineFee.toLocaleString()} {t('booking.fee', { defaultValue: 'fee' })})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.button>
          </div>
        </div>
      </div>
    </ModalFrame>
  );
}
