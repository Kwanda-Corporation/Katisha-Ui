import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import api from '../api';
import { SERVER_ORIGIN } from '../config/apiBase';
import {
  SeatStatus,
  SeatUpdateEvent,
  TripSeatMap,
  isInteractive,
} from '../types/seat';

const CLIENT_ID_KEY = 'vdk_seat_client_id';
/** Belt-and-braces refresh when realtime is unavailable or has gone quiet. */
const DEFAULT_POLL_MS = 15000;

function makeClientId(): string {
  try {
    const existing = localStorage.getItem(CLIENT_ID_KEY);
    if (existing) return existing;
  } catch {
    /* private mode / SSR */
  }
  const id = `c_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  try {
    localStorage.setItem(CLIENT_ID_KEY, id);
  } catch {
    /* ignore */
  }
  return id;
}

export interface UseTripSeatsOptions {
  /** When set, the seat map loads and live-updates. */
  tripId?: string | null;
  /** Admin mode also receives passenger metadata per occupied seat. */
  admin?: boolean;
  /** Client-side cap override; the server's value wins when present. */
  maxSeats?: number;
  /** Poll interval. Pass 0 to disable polling (realtime only). */
  pollingMs?: number;
  enabled?: boolean;
}

export interface UseTripSeatsResult {
  loading: boolean;
  error: string | null;
  data: TripSeatMap | null;
  rows: TripSeatMap['layout']['rows'];
  selected: string[];
  selectedSet: Set<string>;
  maxSeats: number;
  notice: string | null;
  version: number;
  clientId: string;
  refresh: () => Promise<void>;
  toggleSeat: (label: string) => void;
  clearSelection: () => void;
  clearNotice: () => void;
  /** Returns true when the seat can be picked right now. */
  canSelect: (cell: { status?: SeatStatus; heldByMe?: boolean }) => boolean;
  /** Places a short-lived hold on the selection. Rejects with a 409 on conflict. */
  reserve: (ttlMinutes?: number) => Promise<{ seats: string[]; expiresAt?: string }>;
  setSelected: (labels: string[]) => void;
}

export function useTripSeats(options: UseTripSeatsOptions): UseTripSeatsResult {
  const { tripId, maxSeats: maxOverride, pollingMs = DEFAULT_POLL_MS, enabled = true } = options;

  const clientId = useMemo(() => makeClientId(), []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TripSeatMap | null>(null);
  const [selected, setSelectedState] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const selectedRef = useRef<string[]>([]);
  selectedRef.current = selected;
  const dataRef = useRef<TripSeatMap | null>(null);
  dataRef.current = data;

  /** The seat's status as currently known, for a given label. */
  const findCell = useCallback(
    (label: string) => {
      const rows = dataRef.current?.layout.rows;
      if (!rows) return undefined;
      for (const row of rows) {
        for (const cell of row.cells) {
          if (cell.label === label) return cell;
        }
      }
      return undefined;
    },
    [],
  );

  const applyStatuses = useCallback((updates: { seatNumber: string; status: SeatStatus; heldBy?: string }[], version?: number) => {
    setData((prev) => {
      if (!prev) return prev;
      const byLabel = new Map(updates.map((u) => [u.seatNumber, u]));
      const rows = prev.layout.rows.map((row) => ({
        y: row.y,
        cells: row.cells.map((cell) => {
          const u = cell.label ? byLabel.get(cell.label) : undefined;
          if (!u) return cell;
          return {
            ...cell,
            status: u.status,
            heldByMe: u.status === 'held' ? u.heldBy === clientId : undefined,
          };
        }),
      }));
      return { ...prev, layout: { rows }, trip: { ...prev.trip, seatVersion: version ?? prev.trip.seatVersion } };
    });
  }, [clientId]);

  /** Drop any selection that a live update has invalidated, with a message. */
  const reconcileSelection = useCallback(() => {
    const current = selectedRef.current;
    if (!current.length) return;
    const gone = current.filter((label) => {
      const cell = findCell(label);
      return !cell || !isInteractive(cell);
    });
    if (gone.length) {
      setSelectedState((prev) => prev.filter((l) => !gone.includes(l)));
      setNotice(
        gone.length === 1
          ? `Seat ${gone[0]} was just taken, please choose another.`
          : `Seats ${gone.join(', ')} were just taken, please choose another.`,
      );
    }
  }, [findCell]);

  const fetchSeats = useCallback(async () => {
    if (!tripId || !enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getTripSeats(tripId, { clientId });
      setData(res.data);
    } catch (err: any) {
      setError(String(err?.message || 'Unable to load seats'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [tripId, clientId, enabled]);

  // Initial load + load on trip change.
  useEffect(() => {
    setSelectedState([]);
    setNotice(null);
    void fetchSeats();
  }, [fetchSeats]);

  // Realtime: subscribe to this trip's room and apply live seat updates.
  useEffect(() => {
    if (!tripId || !enabled) return;
    let socket: Socket | null = null;
    try {
      socket = io(SERVER_ORIGIN, { transports: ['websocket', 'polling'], reconnection: true, reconnectionDelay: 1500, auth: {} });
      socket.on('connect', () => {
        socket?.emit('trip:subscribe', tripId);
      });
      socket.on('seat_update', (payload: SeatUpdateEvent) => {
        if (payload?.tripId !== tripId) return;
        applyStatuses(payload.seats || [], payload.version);
        // Selection is checked on the next render tick, once the state applied.
        setTimeout(() => reconcileSelection(), 0);
      });
    } catch {
      // Realtime is best-effort; polling keeps the map current.
    }
    return () => {
      try {
        socket?.emit('trip:unsubscribe', tripId);
        socket?.disconnect();
      } catch {
        /* ignore */
      }
    };
  }, [tripId, applyStatuses, reconcileSelection, enabled]);

  // Polling fallback (also re-syncs after a dropped socket).
  useEffect(() => {
    if (!tripId || !enabled || !pollingMs) return;
    const id = setInterval(() => {
      const before = dataRef.current?.trip.seatVersion;
      api
        .getTripSeats(tripId, { clientId })
        .then((res) => {
          if (res?.data && res.data.trip?.seatVersion !== before) {
            setData(res.data);
            setTimeout(() => reconcileSelection(), 0);
          }
        })
        .catch(() => {
          /* ignore transient poll errors */
        });
    }, pollingMs);
    return () => clearInterval(id);
  }, [tripId, clientId, pollingMs, reconcileSelection, enabled]);

  const maxSeats = maxOverride ?? data?.maxPerBooking ?? 5;

  const canSelect = useCallback(
    (cell: { status?: SeatStatus; heldByMe?: boolean }) => isInteractive(cell as any),
    [],
  );

  const toggleSeat = useCallback(
    (label: string) => {
      // Deselecting is always allowed — even if the seat has since been taken or
      // held — so a seat the rider picked can never get stuck selected.
      if (selectedRef.current.includes(label)) {
        setSelectedState((prev) => prev.filter((l) => l !== label));
        return;
      }
      const cell = findCell(label);
      if (!cell || !isInteractive(cell)) return;
      if (selectedRef.current.length >= maxSeats) {
        setNotice(`You can select up to ${maxSeats} seat${maxSeats > 1 ? 's' : ''} per booking.`);
        return;
      }
      setSelectedState((prev) => [...prev, label]);
      setNotice((n) => (n && n.startsWith('You can select up to') ? null : n));
    },
    [findCell, maxSeats],
  );

  const clearSelection = useCallback(() => setSelectedState([]), []);
  const clearNotice = useCallback(() => setNotice(null), []);

  const reserve = useCallback(
    async (ttlMinutes?: number) => {
      const seats = selectedRef.current;
      if (!seats.length) throw new Error('Select at least one seat');
      if (!tripId) throw new Error('No trip selected');
      try {
        const res = await api.reserveTripSeats(tripId, { seatNumbers: seats, clientId, ttlMinutes });
        return res.data;
      } catch (err: any) {
        if (err?.status === 409 && Array.isArray(err.alreadyTaken)) {
          const gone: string[] = err.alreadyTaken;
          setSelectedState((prev) => prev.filter((l) => !gone.includes(l)));
          setNotice(
            gone.length === 1
              ? `Seat ${gone[0]} was just taken, please choose another.`
              : `Seats ${gone.join(', ')} were just taken, please choose another.`,
          );
          void fetchSeats();
        }
        throw err;
      }
    },
    [tripId, clientId, fetchSeats],
  );

  return {
    loading,
    error,
    data,
    rows: data?.layout.rows ?? [],
    selected,
    selectedSet: useMemo(() => new Set(selected), [selected]),
    maxSeats,
    notice,
    version: data?.trip.seatVersion ?? 0,
    clientId,
    refresh: fetchSeats,
    toggleSeat,
    clearSelection,
    clearNotice,
    canSelect,
    reserve,
    setSelected: setSelectedState,
  };
}
