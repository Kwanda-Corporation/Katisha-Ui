/**
 * Shared seat-selection contracts. These mirror the `/api/v1` payload exactly so
 * the seat map component never re-derives geometry or seat numbers — everything
 * comes from the backend layout JSON.
 */

export type SeatStatus =
  | 'available'
  | 'booked_online'
  | 'booked_manual'
  | 'blocked'
  | 'held';

export type SeatCellType = 'seat' | 'aisle' | 'gap' | 'door' | 'driver';

export interface SeatCell {
  type: SeatCellType;
  /** Present only for `type === 'seat'`. Always supplied by the API. */
  label?: string;
  status?: SeatStatus;
  /** True when a hold belongs to this client's own checkout session. */
  heldByMe?: boolean;
  /** Admin mode only. */
  passengerName?: string;
  passengerPhone?: string;
  note?: string;
  paymentMethod?: string;
}

export interface SeatRow {
  y: number;
  cells: SeatCell[];
}

export interface TripSeatMap {
  trip: {
    id: string;
    agency: { id: string; name: string; logo?: string };
    route: { id: string; origin: string; destination: string; via?: string };
    travelDate: string | Date;
    travelTime: string;
    price: number;
    currency: string;
    totalSeats: number;
    seatVersion: number;
  };
  layout: { rows: SeatRow[] };
  summary: { total: number; available: number; taken: number; blocked: number };
  maxPerBooking: number;
}

/** What the UI actually switches on. Both booking kinds render as "taken". */
export type VisualSeatState = 'available' | 'selected' | 'taken' | 'blocked' | 'held';

export function visualState(cell: SeatCell, selected: boolean): VisualSeatState {
  if (selected) return 'selected';
  switch (cell.status) {
    case undefined:
    case 'available':
      return 'available';
    case 'held':
      return cell.heldByMe ? 'available' : 'taken';
    case 'blocked':
      return 'blocked';
    default:
      return 'taken';
  }
}

/** True when a seat cannot be picked by this client. */
export function isInteractive(cell: SeatCell): boolean {
  return cell.status === 'available' || (cell.status === 'held' && !!cell.heldByMe);
}

/** Live `seat_update` broadcast payload (SocketService.emitSeatUpdate). */
export interface SeatUpdateEvent {
  tripId: string;
  version: number;
  seats: { seatNumber: string; status: SeatStatus; heldBy?: string }[];
}

export interface ReserveResult {
  seats: string[];
  expiresAt?: string;
}

export interface ResolveTripResult {
  tripId: string;
  created: boolean;
  totalSeats: number;
  seatVersion: number;
}
