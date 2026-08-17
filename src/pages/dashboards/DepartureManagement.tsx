import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin, Ban, CheckCircle, Loader, ArrowLeft, ArrowRight, Bus, ChevronLeft, ChevronRight, Search,
} from 'lucide-react';
import { api } from '../../api';
import { viaLabel } from '../../utils/via';

function CalendarMonth({ year, month, selectedDate, blockedDates, onSelect }: {
  year: number; month: number; selectedDate: string; blockedDates: Record<string, number>;
  onSelect: (date: string) => void;
}) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split('T')[0];

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="bg-white rounded-md border border-[var(--border)] p-4 w-full">
      <div className="grid grid-cols-7 gap-0">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-[var(--text-muted)] uppercase py-1">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isBlocked = blockedDates[dateStr];
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === today;
          const isPast = new Date(dateStr) < new Date(today);

          return (
            <button
              key={dateStr}
              onClick={() => onSelect(dateStr)}
              className={`relative flex flex-col items-center justify-center h-9 rounded-md text-xs font-medium transition-all cursor-pointer border-none ${
                isSelected
                  ? 'bg-[var(--blue)] text-white'
                  : isBlocked
                    ? 'bg-red-50 text-red-700 font-bold'
                    : isToday
                      ? 'bg-[var(--blue-light)] text-[var(--blue-dark)] font-bold'
                      : isPast
                        ? 'text-[var(--text-muted)] hover:bg-[#F9FAFB]'
                        : 'text-zinc-700 hover:bg-[#F9FAFB]'
              }`}
            >
              {day}
              {isBlocked && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-px">
                  {Array.from({ length: Math.min(isBlocked, 3) }).map((_, j) => (
                    <span key={j} className="w-1 h-1 rounded-full bg-red-400" />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function DepartureManagement() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [routeSearch, setRouteSearch] = useState('');
  const [blockedDates, setBlockedDates] = useState<Record<string, number>>({});

  const viewMonth = useMemo(() => {
    const d = new Date(selectedDate);
    return { year: d.getFullYear(), month: d.getMonth() };
  }, [selectedDate]);

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getDepartureSchedule({ travelDate: selectedDate });
      setSchedule(res.data?.schedule || []);
    } catch {
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  const loadBlockedDates = useCallback(async () => {
    const { year, month } = viewMonth;
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
    try {
      const res = await api.getBlockedDates({ startDate, endDate });
      setBlockedDates(res.data?.blockedDates || {});
    } catch {
      setBlockedDates({});
    }
  }, [viewMonth]);

  useEffect(() => { loadSchedule(); }, [loadSchedule]);
  useEffect(() => { loadBlockedDates(); }, [loadBlockedDates]);

  const handleBlock = async (routeId: string, travelTime: string) => {
    const key = `${routeId}_${travelTime}`;
    setActionLoading(key);
    try {
      await api.blockDeparture({ routeId, travelDate: selectedDate, travelTime });
      await loadSchedule();
      await loadBlockedDates();
    } catch (err: any) {
      alert(err.message || 'Failed to block departure');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnblock = async (routeId: string, travelTime: string) => {
    const key = `${routeId}_${travelTime}`;
    setActionLoading(key);
    try {
      await api.unblockDeparture({ routeId, travelDate: selectedDate, travelTime });
      await loadSchedule();
      await loadBlockedDates();
    } catch (err: any) {
      alert(err.message || 'Failed to unblock departure');
    } finally {
      setActionLoading(null);
    }
  };

  const routes = Array.from(new Set(schedule.map(s => JSON.stringify(s.route)))).map(r => JSON.parse(r));
  const filteredRoutes = routes.filter(r => {
    if (!routeSearch) return true;
    const q = routeSearch.toLowerCase();
    return r.origin?.toLowerCase().includes(q) || r.destination?.toLowerCase().includes(q) ||
           `${r.origin} → ${r.destination}`.toLowerCase().includes(q);
  });
  const filteredSchedule = selectedRoute ? schedule.filter(s => s.route._id === selectedRoute) : schedule;

  const dayOffset = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const monthNav = (offset: number) => {
    const d = new Date(viewMonth.year, viewMonth.month + offset, 1);
    setSelectedDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`);
  };

  const totalBlocked = Object.keys(blockedDates).length;
  const monthLabel = new Date(viewMonth.year, viewMonth.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-zinc-950">Departure</span>
            <span className="text-[var(--blue)]"> Management</span>
          </h1>
          <p className="text-sm text-[var(--text-sub)] mt-1">Block or unblock departures by route, date, and time</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Left: Calendar */}
        <div className="space-y-4">
          <div className="bg-white rounded-md border border-[var(--border)] p-4">
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => monthNav(-1)}
                className="w-8 h-8 rounded-sm bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[var(--border)] text-zinc-700 flex items-center justify-center cursor-pointer">
                <ChevronLeft size={14} />
              </button>
              <span className="text-sm font-bold text-[var(--text)]">{monthLabel}</span>
              <button onClick={() => monthNav(1)}
                className="w-8 h-8 rounded-sm bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[var(--border)] text-zinc-700 flex items-center justify-center cursor-pointer">
                <ChevronRight size={14} />
              </button>
            </div>
            <CalendarMonth
              year={viewMonth.year}
              month={viewMonth.month}
              selectedDate={selectedDate}
              blockedDates={blockedDates}
              onSelect={setSelectedDate}
            />
          </div>

          {/* Legend */}
          <div className="bg-white rounded-md border border-[var(--border)] p-4 space-y-2">
            <p className="text-xs font-bold text-[var(--text-sub)] uppercase tracking-wider">Legend</p>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-[var(--blue)]" />
              <span className="text-xs text-[var(--text-sub)]">Selected date</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-red-50 border border-red-200 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              </span>
              <span className="text-xs text-[var(--text-sub)]">Has blocked departures</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-[var(--blue-light)] border border-zinc-200" />
              <span className="text-xs text-[var(--text-sub)]">Today</span>
            </div>
          </div>

          {/* Blocked summary */}
          {totalBlocked > 0 && (
            <div className="bg-red-50 rounded-md border border-red-200 p-4">
              <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">This Month</p>
              <p className="text-2xl font-bold text-red-700">{totalBlocked}</p>
              <p className="text-xs text-red-500">date{totalBlocked !== 1 ? 's' : ''} with blocked departures</p>
            </div>
          )}
        </div>

        {/* Right: Schedule grid */}
        <div>
          {/* Date navigation bar */}
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => dayOffset(-1)}
              className="w-9 h-9 rounded-sm bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[var(--border)] text-zinc-700 flex items-center justify-center cursor-pointer">
              <ArrowLeft size={15} />
            </button>
            <div className="flex-1 text-center">
              <span className="text-sm font-bold text-[var(--text)]">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <button onClick={() => dayOffset(1)}
              className="w-9 h-9 rounded-sm bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[var(--border)] text-zinc-700 flex items-center justify-center cursor-pointer">
              <ArrowRight size={15} />
            </button>
          </div>

          {/* Route filter */}
          {routes.length > 0 && (
            <div className="mb-4 space-y-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  value={routeSearch}
                  onChange={e => { setRouteSearch(e.target.value); setSelectedRoute(null); }}
                  className="w-full h-9 pl-9 pr-3 rounded-md border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--blue)]"
                  placeholder="Search routes..."
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setSelectedRoute(null)}
                  className={`px-3 py-1.5 rounded-sm text-xs font-semibold border cursor-pointer transition-colors ${
                    !selectedRoute
                      ? 'bg-[var(--blue)] text-white border-[var(--blue)]'
                      : 'bg-[#F9FAFB] text-[var(--text-sub)] border-[var(--border)] hover:border-[var(--blue)]'
                  }`}
                >All Routes ({routes.length})</button>
                {filteredRoutes.map(r => (
                  <button key={r._id} onClick={() => setSelectedRoute(r._id)}
                    className={`px-3 py-1.5 rounded-sm text-xs font-semibold border cursor-pointer transition-colors ${
                      selectedRoute === r._id
                        ? 'bg-[var(--blue)] text-white border-[var(--blue)]'
                        : 'bg-[#F9FAFB] text-[var(--text-sub)] border-[var(--border)] hover:border-[var(--blue)]'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <MapPin size={11} /> {r.origin} → {r.destination}<span className="font-medium opacity-80">{viaLabel(r.via)}</span>
                    </span>
                  </button>
                ))}
                {routeSearch && filteredRoutes.length === 0 && (
                  <p className="text-xs text-[var(--text-muted)]">No routes match "{routeSearch}"</p>
                )}
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <Loader size={24} className="mx-auto animate-spin text-[var(--blue)]" />
            </div>
          ) : filteredSchedule.length === 0 ? (
            <div className="text-center py-12 bg-[#F9FAFB] rounded-md border border-[var(--border)]">
              <Bus size={40} className="mx-auto text-[var(--text-muted)] mb-3" />
              <p className="text-sm font-semibold text-[var(--text-sub)]">No routes or departures found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRoutes.filter(r => !selectedRoute || r._id === selectedRoute).map(route => {
                const routeSlots = filteredSchedule.filter(s => s.route._id === route._id);
                const blockedCount = routeSlots.filter(s => s.status === 'blocked').length;
                return (
                  <motion.div key={route._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-md border border-[var(--border)] overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-[var(--blue)]" />
                        <span className="text-sm font-bold text-[var(--text)]">{route.origin} → {route.destination}<span className="text-[var(--text-muted)] font-medium">{viaLabel(route.via)}</span></span>
                      </div>
                      {blockedCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                          <Ban size={9} /> {blockedCount} blocked
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-1.5">
                        {routeSlots.map(slot => {
                          const isBlocked = slot.status === 'blocked';
                          const hasBookings = slot.bookingCount > 0;
                          const key = `${route._id}_${slot.travelTime}`;
                          const isLoading = actionLoading === key;

                          return (
                            <motion.button key={slot.travelTime}
                              disabled={isLoading}
                              whileTap={isLoading ? {} : { scale: 0.95 }}
                              onClick={() => isBlocked
                                ? handleUnblock(route._id, slot.travelTime)
                                : handleBlock(route._id, slot.travelTime)
                              }
                              className={`relative p-2 rounded-md text-center border-2 transition-all duration-200 cursor-pointer ${
                                isBlocked
                                  ? 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'
                                  : hasBookings
                                    ? 'bg-blue-600 border-blue-700 text-white'
                                    : 'bg-[#F9FAFB] border-[var(--border)] text-[var(--text)] hover:border-[var(--blue)] hover:bg-[var(--blue-light)]'
                              }`}
                            >
                              {isLoading ? (
                                <Loader size={14} className="mx-auto animate-spin" />
                              ) : (
                                <>
                                  <span className="text-xs font-bold block">{slot.travelTime}</span>
                                  {isBlocked ? (
                                    <Ban size={10} className="mx-auto mt-0.5" />
                                  ) : hasBookings ? (
                                    <span className="text-[9px] block mt-0.5">{slot.bookingCount} bookings</span>
                                  ) : (
                                    <CheckCircle size={10} className="mx-auto mt-0.5 opacity-40" />
                                  )}
                                </>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
