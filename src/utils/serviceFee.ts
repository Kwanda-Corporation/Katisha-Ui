/**
 * Katisha Service-Fee & Margin Pricing System — client mirror.
 *
 * MUST stay identical to `server/src/utils/serviceFee.ts`. The backend is the
 * source of truth for the amount actually charged; the client mirrors the same
 * engine so the fee shown in the wizard matches exactly what is charged.
 *
 * The customer pays `Ticket Price + Service Fee`. Katisha keeps the service
 * fee as revenue and must cover two transaction costs on every booking:
 *
 *   Deposit cost = 1% of (Ticket Price + Service Fee)
 *   Payout cost  = 1% of Ticket Price + 60 RWF
 *
 *          Margin = 0.99 × Fee − 0.02 × Ticket Price − 60
 *
 * Pricing rules:
 *  1. Every single ticket keeps its margin in a target band: 600–800 RWF on
 *     low-value tickets, then 1.5k / 2.5k / 3k on 50k / 70k / 90k+ journeys.
 *  2. The per-ticket fee is hard-capped at `maxFeePerTicket` so expensive
 *     fares never scare the customer away with a huge service fee.
 *  3. Multi-passenger discounts reduce the fee per seat, but the margin must
 *     never fall below `minMarginRate` of the ticket value (the discount floor).
 */

export interface PricingConfig {
  /** Deposit transaction cost as a fraction of the customer total. */
  depositRate: number;
  /** Payout transaction cost as a fraction of the ticket value. */
  payoutRate: number;
  /** Fixed payout cost in RWF per booking. */
  payoutFixed: number;
  /** Margin target (RWF) for tickets below the first MARGIN_TARGET band. */
  lowValueMargin: number;
  /** Lowest acceptable margin as a fraction of the ticket value. */
  minMarginRate: number;
  /** Fees are always rounded up to this step (RWF). */
  roundingStep: number;
  /** Hard cap on the service fee added per ticket (RWF). */
  maxFeePerTicket: number;
}

export const DEFAULT_PRICING: PricingConfig = {
  depositRate: 0.01,
  payoutRate: 0.01,
  payoutFixed: 60,
  lowValueMargin: 700,
  minMarginRate: 0.01,
  roundingStep: 100,
  maxFeePerTicket: 5500,
};

/**
 * Minimum Katisha margin per booking, keyed by ticket price (checked
 * highest-first):
 *
 *   price ≥ 90k   → 3,000 RWF
 *   price ≥ 70k   → 2,500 RWF
 *   price ≥ 50k   → 1,500 RWF
 *   otherwise     → lowValueMargin (700 RWF → lands in 600–800 on cheap fares)
 */
export const MARGIN_TARGETS: Array<{ minPrice: number; margin: number }> = [
  { minPrice: 90000, margin: 3000 },
  { minPrice: 70000, margin: 2500 },
  { minPrice: 50000, margin: 1500 },
];

/** Margin target for a ticket price (band-based). */
export function targetMarginFor(
  ticketPrice: number,
  cfg: PricingConfig = DEFAULT_PRICING
): number {
  const price = Number(ticketPrice) || 0;
  for (const band of MARGIN_TARGETS) {
    if (price >= band.minPrice) return band.margin;
  }
  return cfg.lowValueMargin;
}

/**
 * Effective minimum margin for a booking of `totalTicketValue` at a given
 * ticket price: the price-band target, floored by `minMarginRate` of the
 * total ticket value so a multi-passenger discount can never drag the margin
 * percentage below the floor.
 */
export function requiredMarginFor(
  totalTicketValue: number,
  ticketPrice: number,
  cfg: PricingConfig = DEFAULT_PRICING
): number {
  const value = Number(totalTicketValue) || 0;
  return Math.max(targetMarginFor(ticketPrice, cfg), cfg.minMarginRate * value);
}

/** Round a fee up to the nearest `step` (default 100 RWF). */
export function roundFee(fee: number, step: number = DEFAULT_PRICING.roundingStep): number {
  if (step <= 0) return Math.round(fee);
  return Math.ceil(fee / step) * step;
}

/**
 * Katisha margin for a booking-level fee over a given total ticket value.
 *   Margin = (1 − depositRate) × Fee − (depositRate + payoutRate) × Value − payoutFixed
 */
export function marginFor(
  bookingFee: number,
  totalTicketValue: number,
  cfg: PricingConfig = DEFAULT_PRICING
): number {
  const fee = Number(bookingFee) || 0;
  const value = Number(totalTicketValue) || 0;
  return (
    (1 - cfg.depositRate) * fee -
    (cfg.depositRate + cfg.payoutRate) * value -
    cfg.payoutFixed
  );
}

/**
 * Minimum booking fee required to keep a target margin on a total ticket value.
 *   Fee = (targetMargin + payoutFixed + (depositRate + payoutRate) × Value) / (1 − depositRate)
 */
export function requiredFeeForMargin(
  totalTicketValue: number,
  targetMargin: number = DEFAULT_PRICING.lowValueMargin,
  cfg: PricingConfig = DEFAULT_PRICING
): number {
  const value = Number(totalTicketValue) || 0;
  const target = Number(targetMargin) || 0;
  return (
    (target + cfg.payoutFixed + (cfg.depositRate + cfg.payoutRate) * value) /
    (1 - cfg.depositRate)
  );
}

/**
 * Single-ticket service fee, derived purely from the margin target and the
 * per-ticket cap. Used as the pre-discount base for multi-passenger bookings
 * and as the per-seat fee for display.
 */
export function singleSeatFee(
  ticketPrice: number,
  cfg: PricingConfig = DEFAULT_PRICING
): number {
  const price = Number(ticketPrice) || 0;
  const fee = roundFee(
    requiredFeeForMargin(price, targetMarginFor(price, cfg), cfg),
    cfg.roundingStep
  );
  return Math.min(fee, cfg.maxFeePerTicket);
}

/** Multi-passenger discount rate for a seat count (1 when no discount applies). */
export function multiPassengerRate(seats: number): number {
  const n = Math.max(1, Math.floor(Number(seats) || 1));
  if (n <= 2) return 1;
  for (const tier of MULTI_PASSENGER_RATES) {
    if (n >= tier.minSeats) return tier.rate;
  }
  return 1;
}

/** Multi-passenger discount tiers — bigger groups get a better per-seat fee. */
export const MULTI_PASSENGER_RATES: Array<{ minSeats: number; rate: number }> = [
  { minSeats: 6, rate: 0.65 },
  { minSeats: 5, rate: 0.72 },
  { minSeats: 4, rate: 0.78 },
  { minSeats: 3, rate: 0.85 },
];

/**
 * Full booking-level service fee for a ticket price and passenger count.
 *
 * Flow:
 *  1. Start from the margin-driven single-seat fee.
 *  2. For seats > 2 apply the multi-passenger discount.
 *  3. Round the proposal up to a clean 100 RWF step.
 *  4. Floor it at the fee required for the effective margin (band target and
 *     `minMarginRate` of the total ticket value).
 *  5. Cap the per-ticket fee at `maxFeePerTicket` so the customer never sees
 *     a service fee above the cap on any seat.
 */
export function bookingServiceFee(
  ticketPrice: number,
  seats: number,
  cfg: PricingConfig = DEFAULT_PRICING
): number {
  const n = Math.max(1, Math.floor(Number(seats) || 1));
  const price = Number(ticketPrice) || 0;
  const totalValue = price * n;

  const rate = multiPassengerRate(n);
  const proposed = roundFee(singleSeatFee(price, cfg) * n * rate, cfg.roundingStep);
  const minFee = roundFee(
    requiredFeeForMargin(totalValue, requiredMarginFor(totalValue, price, cfg), cfg),
    cfg.roundingStep
  );

  const fee = Math.max(proposed, minFee);
  return Math.min(fee, cfg.maxFeePerTicket * n);
}

export const INTERCITY_FLAT_FEE = 200;

/** Rwandan intercity journeys carry a flat 200 RWF system fee; every other
 * journey type uses the margin-driven booking fee. */
export function systemFeeFor(
  journeyType: string | null | undefined,
  ticketPrice: number,
  seats: number,
  cfg: PricingConfig = DEFAULT_PRICING
): number {
  if (journeyType === 'intercity') return INTERCITY_FLAT_FEE;
  return bookingServiceFee(ticketPrice, seats, cfg);
}

export interface PricingBreakdown {
  ticketPrice: number;
  seats: number;
  totalTicketValue: number;
  perTicketFee: number;
  multiPassengerRate: number;
  bookingFee: number;
  depositCost: number;
  payoutCost: number;
  margin: number;
  customerTotal: number;
  marginPass: boolean;
}

/** Full pricing breakdown for a booking — used for validation, display & audit. */
export function pricingBreakdown(
  ticketPrice: number,
  seats: number,
  cfg: PricingConfig = DEFAULT_PRICING
): PricingBreakdown {
  const n = Math.max(1, Math.floor(Number(seats) || 1));
  const price = Number(ticketPrice) || 0;
  const totalValue = price * n;
  const bookingFee = bookingServiceFee(price, n, cfg);
  const customerTotal = totalValue + bookingFee;
  const depositCost = Math.round(customerTotal * cfg.depositRate);
  const payoutCost = Math.round(totalValue * cfg.payoutRate) + cfg.payoutFixed;
  const margin = marginFor(bookingFee, totalValue, cfg);

  // Best margin achievable without breaching the per-ticket cap — a booking
  // counts as passing when it hits that (a shortfall vs the band target is
  // always caused by the customer-facing fee cap, not by the discount).
  const required = requiredMarginFor(totalValue, price, cfg);
  const achievableUnderCap = marginFor(cfg.maxFeePerTicket * n, totalValue, cfg);

  return {
    ticketPrice: price,
    seats: n,
    totalTicketValue: totalValue,
    perTicketFee: singleSeatFee(price, cfg),
    multiPassengerRate: multiPassengerRate(n),
    bookingFee,
    depositCost,
    payoutCost,
    margin: Math.round(margin),
    customerTotal,
    marginPass: margin >= Math.min(required, achievableUnderCap),
  };
}

/**
 * Full PawaPay processing fee — deposit cost + payout cost.
 *
 *   Deposit cost = depositRate × customerTotal  (PawaPay 1% + MTN 0.8791%)
 *   Payout cost  = payoutRate × ticketValue + payoutFixed  (PawaPay 1% + 60 RWF)
 *
 * This is the additional fee on top of the Katisha service fee for online payments.
 */
export function pawapayFee(
  customerTotal: number,
  ticketValue: number,
  depositRate: number = 0.018791,
  payoutRate: number = 0.01,
  payoutFixed: number = 60,
): number {
  const total = Number(customerTotal) || 0;
  const ticket = Number(ticketValue) || 0;
  if (total <= 0 && ticket <= 0) return 0;
  const depositCost = Math.round(total * depositRate);
  const payoutCost = Math.round(ticket * payoutRate) + payoutFixed;
  return depositCost + payoutCost;
}
