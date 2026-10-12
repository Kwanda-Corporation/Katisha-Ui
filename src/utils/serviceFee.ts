/**
 * Katisha Ticket Pricing Engine — client mirror.
 *
 * MUST stay identical to `server/src/utils/serviceFee.ts`. The backend is the
 * source of truth for the amount actually charged; the client mirrors the same
 * engine so the price shown in the wizard matches exactly what is charged.
 *
 * Deterministic quote for a booking. Currency is RWF. The customer pays
 * `total_price` to us through pawaPay (a DEPOSIT); pawaPay takes a deposit fee
 * out of that total; the operator is paid EXACTLY the ticket price `T` (a
 * PAYOUT) and pawaPay takes a payout fee for that. Whatever is left must be at
 * least our service fee (7% of T):
 *
 *   total_price - deposit_fee - T (operator) - payout_fee >= service_fee
 *
 * The customer's processing fee must cover BOTH the deposit fee and the payout
 * fee. Because the deposit fee is charged on the whole total (including the
 * service fee and the processing fee itself) the total is divided by
 * (1 - deposit_rate) instead of just adding a percentage.
 *
 * MONEY RULES (never change):
 *  - service_fee = round_half_up(T × serviceFeeRate); never discounted or waived.
 *  - operator_payout is always exactly T; never more, never less.
 *  - processing_fee = total_price − T − service_fee (covers deposit + payout),
 *    computed by subtraction so the three parts always add up exactly.
 */

export type Mno = 'MTN' | 'AIRTEL';

export interface TicketPricingConfig {
  /** Katisha service fee as a fraction of the ticket value. */
  serviceFeeRate: number;
  /** Deposit transaction cost as a fraction of the customer total, per network. */
  depositRate: Record<Mno, number>;
  /** Payout transaction cost as a fraction of the ticket value, per network. */
  payoutRate: Record<Mno, number>;
  /** Fixed payout transaction cost in RWF, per network. */
  payoutFixed: Record<Mno, number>;
}

/**
 * CONFIG — update here if pawaPay rates change.
 *
 *   deposit_rate : MTN = 2.1% MTN + 1% pawaPay = 3.1%
 *                  AIRTEL = 1.5% Airtel + 1% pawaPay = 2.5%
 *   payout_fixed : MTN = 60 RWF, AIRTEL = 0 RWF
 *   payout_rate  : MTN = 1%, AIRTEL = 1%
 */
export const TICKET_PRICING: TicketPricingConfig = {
  serviceFeeRate: 0.07,
  depositRate: { MTN: 0.031, AIRTEL: 0.025 },
  payoutRate: { MTN: 0.01, AIRTEL: 0.01 },
  payoutFixed: { MTN: 60, AIRTEL: 0 },
};

/** Coerce an unknown network label to a supported MNO (defaults to MTN). */
export function normalizeMno(value?: string | null): Mno {
  return String(value || '').trim().toUpperCase() === 'AIRTEL' ? 'AIRTEL' : 'MTN';
}

/** Map a stored payment method ('mom' | 'airtel' | 'mpesa') to its network. */
export function mnoFromPaymentMethod(method?: string | null): Mno {
  return normalizeMno(String(method || '').toLowerCase() === 'airtel' ? 'AIRTEL' : 'MTN');
}

/** Round half up to the nearest whole RWF. */
export function roundHalfUp(value: number): number {
  return Math.floor(value + 0.5);
}

/** Service fee = 7% of the ticket value, rounded half up. */
export function serviceFeeFor(
  ticketPrice: number,
  config: TicketPricingConfig = TICKET_PRICING
): number {
  return roundHalfUp((Number(ticketPrice) || 0) * config.serviceFeeRate);
}

export interface TicketQuote {
  ticket_price: number;
  service_fee: number;
  processing_fee: number;
  total_price: number;
  currency: 'RWF';
  deposit_mno: Mno;
  payout_mno: Mno;
  settlement: {
    deposit_fee: number;
    operator_payout: number;
    payout_fee: number;
    service_fee_kept: number;
    service_fee_protected: boolean;
  };
}

/**
 * Full deterministic quote for a request. `ticketPrice` is the operator's total
 * payable for the booking (unit price × seats). Throws `invalid ticket_price`
 * when the price is missing, zero, negative or not a number.
 */
export function ticketQuote(params: {
  ticketPrice: number;
  depositMno?: string | null;
  payoutMno?: string | null;
  config?: TicketPricingConfig;
}): TicketQuote {
  const config = params.config || TICKET_PRICING;
  const ticketPrice = Number(params.ticketPrice);
  if (!Number.isFinite(ticketPrice) || ticketPrice <= 0) {
    throw new Error('invalid ticket_price');
  }

  const depositMno = normalizeMno(params.depositMno);
  const payoutMno = normalizeMno(params.payoutMno);

  const serviceFee = roundHalfUp(ticketPrice * config.serviceFeeRate);
  const operatorPayout = ticketPrice;
  const payoutFee = config.payoutFixed[payoutMno] + config.payoutRate[payoutMno] * ticketPrice;
  const depositRate = config.depositRate[depositMno];

  // Gross up so the deposit fee (charged on the whole total) still leaves the
  // full service fee intact.
  let totalPrice = Math.ceil((ticketPrice + serviceFee + payoutFee) / (1 - depositRate));
  let processingFee = totalPrice - ticketPrice - serviceFee;

  // Mandatory settlement check: bump the total by 1 RWF until the deposit and
  // payout fees can never eat into the service fee.
  let depositFee = depositRate * totalPrice;
  let serviceFeeKept = totalPrice - depositFee - operatorPayout - payoutFee;
  let guard = 0;
  while (serviceFeeKept < serviceFee && guard < 1000) {
    totalPrice += 1;
    processingFee = totalPrice - ticketPrice - serviceFee;
    depositFee = depositRate * totalPrice;
    serviceFeeKept = totalPrice - depositFee - operatorPayout - payoutFee;
    guard += 1;
  }

  return {
    ticket_price: ticketPrice,
    service_fee: serviceFee,
    processing_fee: processingFee,
    total_price: totalPrice,
    currency: 'RWF',
    deposit_mno: depositMno,
    payout_mno: payoutMno,
    settlement: {
      deposit_fee: round2(depositFee),
      operator_payout: operatorPayout,
      payout_fee: round2(payoutFee),
      service_fee_kept: round2(serviceFeeKept),
      service_fee_protected: serviceFeeKept >= serviceFee,
    },
  };
}

/** Round to 2 decimals for settlement reporting. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
