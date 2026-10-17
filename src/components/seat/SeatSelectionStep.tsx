import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Loader, Minus, Plus, AlertCircle } from 'lucide-react';
import { api } from '../../api';
import { useTripSeats } from '../../Hooks/useTripSeats';
import BusSeatMap from './BusSeatMap';
import SeatMapSkeleton from './SeatMapSkeleton';

export interface SeatSelectionValue {
  seats: number;
  seatNumbers: string[];
  /** Session id that owns any holds, so the booking can claim them. */
  clientId?: string;
}

export interface SeatSelectionStepHandle {
  /** Places a hold on the current selection. Throws on a 409 conflict. */
  reserve: () => Promise<void>;
  /** True when the interactive map (not the stepper fallback) is in use. */
  isActive: () => boolean;
  getSelection: () => SeatSelectionValue;
  /** Removes a single seat from the current selection. */
  removeSeat: (label: string) => void;
  /** Clears the whole selection. */
  clear: () => void;
}

interface Props {
  agencyId: string;
  routeId: string;
  travelDate: string;
  travelTime: string;
  price: number;
  /** Seats carried in from a deep link / the standalone seat page. */
  initialSeatNumbers?: string[];
  /** Max height of the scrolling seat area (tuned for the hosting context). */
  mapMaxHeight?: string;
  onChange: (value: SeatSelectionValue) => void;
  /** Reports whether the data-driven map is active (trip resolved). */
  onMode?: (active: boolean) => void;
  /** Non-blocking message (e.g. a seat was taken while selecting). */
  onNotice?: (message: string) => void;
}

/**
 * Renders the data-driven seat map for the wizard's seat step. It resolves the
 * (agency, route, date, time) tuple to a trip and, when a layout exists, shows
 * the interactive map; otherwise it degrades to the original seat-count stepper
 * so no booking path is ever blocked by a missing layout.
 */
const SeatSelectionStep = forwardRef<SeatSelectionStepHandle, Props>(function SeatSelectionStep(
  { agencyId, routeId, travelDate, travelTime, price, initialSeatNumbers, mapMaxHeight, onChange, onMode, onNotice },
  ref,
) {
  const [tripId, setTripId] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [failed, setFailed] = useState(false);
  const [manualSeats, setManualSeats] = useState(1);
  const prefilledRef = useRef(false);

  const active = !!tripId && !failed;
  const seats = useTripSeats({ tripId, enabled: active });

  // Resolve (or create) the trip for this departure. Re-runs when the tuple
  // changes (e.g. the user backs up and picks another time).
  useEffect(() => {
    if (!agencyId || !routeId || !travelDate || !travelTime) return;
    let cancelled = false;
    setResolving(true);
    setFailed(false);
    setTripId(null);
    prefilledRef.current = false;
    api
      .resolveTrip({ agencyId, routeId, travelDate, travelTime, price })
      .then((res) => {
        if (cancelled) return;
        const id = res?.data?.tripId;
        if (id) setTripId(String(id));
        else setFailed(true);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setResolving(false);
      });
    return () => {
      cancelled = true;
    };
  }, [agencyId, routeId, travelDate, travelTime, price]);

  useEffect(() => {
    onMode?.(active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    if (seats.notice && onNotice) onNotice(seats.notice);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seats.notice]);

  // Apply any seats carried in from outside, once the layout has loaded.
  useEffect(() => {
    if (!active || prefilledRef.current || !seats.data) return;
    prefilledRef.current = true;
    const wanted = (initialSeatNumbers || []).filter(Boolean);
    if (!wanted.length) return;
    const taken = new Set<string>();
    seats.data.layout.rows.forEach((r) =>
      r.cells.forEach((c) => {
        if (c.type === 'seat' && c.label && (c.status === 'booked_online' || c.status === 'booked_manual' || c.status === 'blocked')) {
          taken.add(c.label);
        }
      }),
    );
    const keep = wanted.filter((s) => !taken.has(s)).slice(0, seats.maxSeats);
    if (keep.length) seats.setSelected(keep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, seats.data]);

  const selection: SeatSelectionValue = useMemo(
    () =>
      active
        ? { seats: Math.max(1, seats.selected.length), seatNumbers: seats.selected, clientId: seats.clientId }
        : { seats: manualSeats, seatNumbers: [] },
    [active, seats.selected, seats.clientId, manualSeats],
  );

  useEffect(() => {
    onChange(selection);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection.seats, selection.seatNumbers.join(',')]);

  useImperativeHandle(
    ref,
    () => ({
      reserve: async () => {
        if (!active) return;
        await seats.reserve();
      },
      isActive: () => active,
      getSelection: () => selection,
      removeSeat: (label: string) => seats.toggleSeat(label),
      clear: () => seats.clearSelection(),
    }),
    [active, seats.reserve, seats.toggleSeat, seats.clearSelection, selection],
  );

  if (!agencyId || !routeId || !travelDate || !travelTime) {
    return (
      <p className="text-sm text-[var(--text-muted)] py-6 text-center">
        Choose a destination, date and departure time to see available seats.
      </p>
    );
  }

  if (resolving && !tripId) {
    return <SeatMapSkeleton rows={6} />;
  }

  if (!active) {
    // Fallback: the classic seat-count stepper. Networking/layout problems must
    // never block a booking.
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-2 text-[13px] text-[var(--text-sub)] bg-[var(--fill-subtle)] rounded-md px-3 py-2.5">
          <AlertCircle size={14} className="shrink-0 mt-0.5 text-[var(--text-muted)]" />
          <span>Seat map is unavailable for this departure — choose how many seats you need.</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setManualSeats((s) => Math.max(1, s - 1))}
            className="w-11 h-11 rounded-sm border-2 border-[var(--border)] flex items-center justify-center hover:border-[var(--blue)] hover:bg-[var(--blue-bg)] transition-all duration-200 cursor-pointer text-[var(--text-sub)] hover:text-[var(--blue-dark)] shrink-0"
          >
            <Minus size={18} />
          </button>
          <span className="text-4xl font-semibold text-[var(--text)] w-16 text-center tabular-nums">{manualSeats}</span>
          <button
            type="button"
            onClick={() => setManualSeats((s) => Math.min(10, s + 1))}
            className="w-11 h-11 rounded-sm border-2 border-[var(--border)] flex items-center justify-center hover:border-[var(--blue)] hover:bg-[var(--blue-bg)] transition-all duration-200 cursor-pointer text-[var(--text-sub)] hover:text-[var(--blue-dark)] shrink-0"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <BusSeatMap
        rows={seats.rows}
        selectedSet={seats.selectedSet}
        onToggleSeat={seats.toggleSeat}
        agencyName={seats.data?.trip.agency.name}
        logo={seats.data?.trip.agency.logo}
        maxHeight={mapMaxHeight}
        ariaBusy={seats.loading}
      />
      {seats.notice && (
        <div className="mx-5 sm:mx-0 flex items-center gap-2 text-[13px] text-[var(--tone-warning-ink)] bg-[var(--tone-warning-fill)] border border-[var(--tone-warning-line)] rounded-md px-3 py-2">
          <AlertCircle size={14} className="shrink-0" />
          <span>{seats.notice}</span>
        </div>
      )}
      {seats.loading && tripId && (
        <div className="flex items-center justify-center gap-2 text-[13px] text-[var(--text-muted)]">
          <Loader size={14} className="animate-spin" /> Updating seats…
        </div>
      )}
    </div>
  );
});

export default SeatSelectionStep;
