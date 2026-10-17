import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Ban, Check, Loader, LockOpen, Map as MapIcon, Search, UserCheck, X } from 'lucide-react';
import { api } from '../../api';
import { useToast } from '../../components/ui/Toast';
import { useTripSeats } from '../../Hooks/useTripSeats';
import BusSeatMap from '../../components/seat/BusSeatMap';
import Legend from '../../components/seat/Legend';
import SeatMapSkeleton from '../../components/seat/SeatMapSkeleton';
import { SeatCell } from '../../types/seat';

interface AdminTrip {
  _id: string;
  travelDate: string;
  travelTime: string;
  seatVersion?: number;
  route?: { origin?: string; destination?: string; via?: string };
  agency?: { name?: string; logo?: string };
  busLayout?: { name?: string; totalSeats?: number };
}

const dateStr = (v?: string) => (v ? String(v).slice(0, 10) : '');

export default function SeatManager() {
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const [trips, setTrips] = useState<AdminTrip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [tripQuery, setTripQuery] = useState('');
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);

  const map = useTripSeats({ tripId: selectedTripId });

  // Admin uses its own selection so any seat (free, held, booked, blocked) can
  // be acted on, independently of who holds it.
  const [sel, setSel] = useState<string[]>([]);
  const [inspected, setInspected] = useState<SeatCell | null>(null);
  const [busy, setBusy] = useState(false);
  const [markOpen, setMarkOpen] = useState(false);
  const [markName, setMarkName] = useState('');
  const [markPhone, setMarkPhone] = useState('');

  // `loadTrips` stays referentially stable (toast via ref) so the debounce
  // effect below doesn't re-fire on every provider re-render.
  const loadTrips = useCallback(async (search: string) => {
    setLoadingTrips(true);
    try {
      const params: Record<string, string> = { limit: '100' };
      const q = search.trim();
      if (q) params.search = q;
      const res = await api.getAdminTrips(params);
      const list: AdminTrip[] = res?.data?.trips || [];
      setTrips(list);
      setSelectedTripId((cur) =>
        cur && list.some((t) => t._id === cur) ? cur : (list[0]?._id ?? null),
      );
    } catch (err: any) {
      toastRef.current.error('Could not load trips', err?.message || 'Please try again.');
    } finally {
      setLoadingTrips(false);
    }
  }, []);

  // Debounced server-side search across every trip in the system.
  useEffect(() => {
    const timeout = setTimeout(() => { void loadTrips(tripQuery); }, tripQuery ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [tripQuery, loadTrips]);

  useEffect(() => {
    if (!selectedTripId) setMapOpen(false);
  }, [selectedTripId]);

  const selectedTrip = useMemo(
    () => trips.find((t) => t._id === selectedTripId) || null,
    [trips, selectedTripId],
  );

  const selectTrip = (id: string) => {
    setSelectedTripId(id);
    setSel([]);
    setInspected(null);
  };

  const toggleSeat = (label: string) => {
    setSel((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]));
  };

  const afterAction = useCallback(async () => {
    await map.refresh();
    setSel([]);
    setInspected(null);
  }, [map]);

  const runAction = async (label: string, fn: () => Promise<any>) => {
    if (!selectedTripId || !sel.length) return;
    setBusy(true);
    try {
      await fn();
      toast.success(label, `Updated ${sel.length} seat${sel.length > 1 ? 's' : ''}.`);
      await afterAction();
    } catch (err: any) {
      toast.error(label, err?.message || 'Action failed.');
    } finally {
      setBusy(false);
    }
  };

  const blockSelected = () =>
    runAction('Seats blocked', () => api.adminBlockSeats(selectedTripId!, { seatNumbers: sel }));

  const releaseSelected = () =>
    runAction('Seats released', () => api.adminReleaseSeats(selectedTripId!, { seatNumbers: sel }));

  const markTakenSelected = async () => {
    if (!selectedTripId || !sel.length) return;
    setBusy(true);
    try {
      await api.adminMarkTaken(selectedTripId, {
        seatNumbers: sel,
        passengerName: markName.trim() || undefined,
        passengerPhone: markPhone.trim() || undefined,
        paymentMethod: 'cash',
      });
      toast.success('Seats marked as taken', `Marked ${sel.length} seat${sel.length > 1 ? 's' : ''}.`);
      setMarkOpen(false);
      setMarkName('');
      setMarkPhone('');
      await afterAction();
    } catch (err: any) {
      toast.error('Could not mark seats', err?.message || 'Action failed.');
    } finally {
      setBusy(false);
    }
  };

  const selectedSet = useMemo(() => new Set(sel), [sel]);

  const renderTripHeading = (trip: AdminTrip | null, includeLegend: boolean) => (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-base font-bold text-[var(--text)] truncate">
          {trip?.route?.origin || '—'} → {trip?.route?.destination || '—'}
        </h2>
        <p className="text-xs text-[var(--text-sub)] mt-0.5 truncate">
          {trip?.agency?.name || ''} · {dateStr(trip?.travelDate)} · {trip?.travelTime}
          {trip?.busLayout?.name ? ` · ${trip.busLayout.name}` : ''}
          {map.data ? ` · v${map.version}` : ''}
        </p>
      </div>
      {includeLegend && <Legend />}
    </div>
  );

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-zinc-950">Seat</span>
            <span className="text-[var(--blue)]"> Manager</span>
          </h1>
          <p className="text-sm text-[var(--text-sub)] mt-1">
            Mark station sales, block seats and inspect passengers on the live bus map.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--blue)] opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--blue)]" />
          </span>
          Live updates
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        {/* Trip picker */}
        <div className="space-y-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <input
              value={tripQuery}
              onChange={(e) => setTripQuery(e.target.value)}
              placeholder="Search any route, agency or time…"
              className="w-full h-11 rounded-md border border-[var(--border)] bg-white pl-9 pr-3 text-sm outline-none focus:border-[var(--blue)] focus:ring-4 focus:ring-[var(--blue-bg)]"
            />
          </div>
          <p className="text-[11px] text-[var(--text-muted)] px-0.5">
            Searches every trip in the system, not just the ones already loaded.
          </p>

          <div className="bg-white rounded-md border border-[var(--border)] overflow-hidden">
            {loadingTrips ? (
              <div className="flex items-center justify-center py-10">
                <Loader size={20} className="animate-spin text-[var(--blue)]" />
              </div>
            ) : trips.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] text-center py-10 px-4">
                {tripQuery.trim() ? 'No trips match your search.' : 'No trips found.'}
              </p>
            ) : (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)] px-3 pt-2.5 pb-1.5 border-b border-[var(--border)]">
                  {trips.length} trip{trips.length === 1 ? '' : 's'}
                </p>
                <div className="max-h-[64vh] overflow-y-auto divide-y divide-[var(--border)]">
                  {trips.map((t) => {
                    const active = t._id === selectedTripId;
                    return (
                      <button
                        key={t._id}
                        type="button"
                        onClick={() => selectTrip(t._id)}
                        className={`w-full text-left px-3 py-2.5 cursor-pointer border-none transition-colors ${
                          active ? 'bg-[var(--blue-bg)]' : 'hover:bg-[#F9FAFB]'
                        }`}
                      >
                        <span className={`block text-sm font-semibold ${active ? 'text-[var(--blue-dark)]' : 'text-[var(--text)]'}`}>
                          {t.route?.origin || '—'} → {t.route?.destination || '—'}
                        </span>
                        <span className="block text-[11px] text-[var(--text-muted)] mt-0.5">
                          {t.agency?.name ? `${t.agency.name} · ` : ''}{dateStr(t.travelDate)} · {t.travelTime}
                          {t.route?.via ? ` · via ${t.route.via}` : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Trip detail */}
        <div className="space-y-4 min-w-0">
          {!selectedTripId ? (
            <div className="bg-white rounded-md border border-[var(--border)] p-10 text-center">
              <p className="text-sm text-[var(--text-muted)]">Select a trip to manage its seats.</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-md border border-[var(--border)] p-4">
                {renderTripHeading(selectedTrip, true)}

                <div className="flex flex-wrap gap-4 text-xs text-[var(--text-sub)] mt-4">
                  {selectedTrip?.busLayout?.totalSeats ? (
                    <span>Layout {selectedTrip.busLayout.totalSeats} seats</span>
                  ) : null}
                  {map.data && (
                    <>
                      <span>Total {map.data.summary.total}</span>
                      <span>Available {map.data.summary.available}</span>
                      <span>Taken {map.data.summary.taken}</span>
                      <span>Blocked {map.data.summary.blocked}</span>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setMapOpen(true)}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold bg-[var(--blue)] text-white hover:bg-[var(--blue-dark)] cursor-pointer border-none"
                >
                  <MapIcon size={15} /> Open live seat map
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Live seat map — full-size modal so the bus layout gets enough room */}
      {mapOpen && selectedTrip && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-5"
          onClick={() => setMapOpen(false)}
        >
          <div
            className="bg-white rounded-lg w-full max-w-[1240px] h-[94dvh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 px-4 sm:px-5 py-3 border-b border-[var(--border)]">
              <div className="min-w-0">{renderTripHeading(selectedTrip, false)}</div>
              <div className="flex items-center gap-3 shrink-0">
                <Legend />
                <button
                  type="button"
                  onClick={() => setMapOpen(false)}
                  aria-label="Close seat map"
                  className="w-8 h-8 rounded-sm hover:bg-[#F3F4F6] flex items-center justify-center text-[var(--text-muted)] cursor-pointer border-none bg-transparent"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4">
              {map.loading && !map.data ? (
                <SeatMapSkeleton rows={7} />
              ) : map.error ? (
                <div className="flex items-center gap-2 text-sm text-[var(--tone-danger-ink)]">
                  <AlertCircle size={16} /> {map.error}
                </div>
              ) : (
                <BusSeatMap
                  rows={map.rows}
                  selectedSet={selectedSet}
                  onToggleSeat={toggleSeat}
                  mode="admin"
                  onInspectSeat={setInspected}
                  agencyName={map.data?.trip.agency.name}
                  logo={map.data?.trip.agency.logo}
                  ariaBusy={map.loading}
                  maxHeight="calc(94dvh - 250px)"
                />
              )}

              {/* Inspected seat details */}
              {inspected && (
                <div className="bg-white rounded-md border border-[var(--border)] p-4 mt-4">
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-bold text-[var(--text)]">Seat {inspected.label}</h3>
                    <button
                      type="button"
                      onClick={() => setInspected(null)}
                      aria-label="Close details"
                      className="w-7 h-7 rounded-sm hover:bg-[#F3F4F6] flex items-center justify-center text-[var(--text-muted)] cursor-pointer border-none bg-transparent"
                    >
                      <X size={15} />
                    </button>
                  </div>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-3 text-sm">
                    <Detail label="Status" value={inspected.status?.replace('_', ' ') || 'available'} />
                    {inspected.passengerName && <Detail label="Passenger" value={inspected.passengerName} />}
                    {inspected.passengerPhone && <Detail label="Phone" value={inspected.passengerPhone} />}
                    {inspected.paymentMethod && <Detail label="Payment" value={inspected.paymentMethod} />}
                    {inspected.note && <Detail label="Note" value={inspected.note} />}
                  </dl>
                </div>
              )}
            </div>

            {/* Action bar */}
            <div className="border-t border-[var(--border)] px-4 sm:px-5 py-3 flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-[var(--text-sub)]">
                {sel.length ? `${sel.length} selected: ${sel.join(', ')}` : 'Tap seats to select them'}
              </span>
              <div className="flex-1" />
              <button
                type="button"
                disabled={!sel.length || busy}
                onClick={() => setMarkOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-semibold bg-[var(--blue)] text-white hover:bg-[var(--blue-dark)] disabled:opacity-40 cursor-pointer border-none"
              >
                <UserCheck size={15} /> Mark taken (station)
              </button>
              <button
                type="button"
                disabled={!sel.length || busy}
                onClick={blockSelected}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-semibold border border-[var(--border)] text-[var(--text)] hover:bg-[#F9FAFB] disabled:opacity-40 cursor-pointer bg-white"
              >
                <Ban size={15} /> Block
              </button>
              <button
                type="button"
                disabled={!sel.length || busy}
                onClick={releaseSelected}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-semibold border border-[var(--border)] text-[var(--text)] hover:bg-[#F9FAFB] disabled:opacity-40 cursor-pointer bg-white"
              >
                <LockOpen size={15} /> Release
              </button>
              {sel.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSel([])}
                  className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer bg-transparent border-none"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mark-taken modal */}
      {markOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={() => !busy && setMarkOpen(false)}>
          <div className="bg-white rounded-lg w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-[var(--text)] mb-1">Mark seats as taken</h3>
            <p className="text-xs text-[var(--text-muted)] mb-4">Seats: {sel.join(', ')} — booked directly at the station.</p>
            <label className="block text-xs font-semibold text-[var(--text-sub)] mb-1">Passenger name (optional)</label>
            <input
              value={markName}
              onChange={(e) => setMarkName(e.target.value)}
              placeholder="e.g. Jean Mukamana"
              className="w-full h-11 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--blue)] focus:ring-4 focus:ring-[var(--blue-bg)] mb-3"
            />
            <label className="block text-xs font-semibold text-[var(--text-sub)] mb-1">Phone (optional)</label>
            <input
              value={markPhone}
              onChange={(e) => setMarkPhone(e.target.value)}
              placeholder="+250 7…"
              className="w-full h-11 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--blue)] focus:ring-4 focus:ring-[var(--blue-bg)] mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMarkOpen(false)}
                disabled={busy}
                className="px-4 py-2 rounded-md text-sm font-semibold border border-[var(--border)] text-[var(--text)] hover:bg-[#F9FAFB] cursor-pointer bg-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={markTakenSelected}
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold bg-[var(--blue)] text-white hover:bg-[var(--blue-dark)] cursor-pointer border-none disabled:opacity-50"
              >
                {busy ? <Loader size={15} className="animate-spin" /> : <Check size={15} />} Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</dt>
      <dd className="text-sm text-[var(--text)] capitalize">{value}</dd>
    </div>
  );
}
