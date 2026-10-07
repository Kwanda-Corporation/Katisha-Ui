import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Bus, Clock, Plus, X, Loader,
  CalendarDays, CheckCircle, Ban, Info, ArrowUpDown,
} from 'lucide-react';
import { api } from '../../api';
import { PageHeader, Button, Input, Select } from '../../components/ui';
import { viaLabel } from '../../utils/via';

const DAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

const DAY_NAMES: Record<number, string> = {
  0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday',
  4: 'Thursday', 5: 'Friday', 6: 'Saturday',
};

interface Agency {
  _id: string;
  name: string;
  status: string;
  isActive?: boolean;
}

interface RouteItem {
  _id: string;
  origin: string;
  destination: string;
  via?: string;
}

interface OverrideItem {
  _id: string;
  travelDate: string;
  travelTime: string;
  action: 'add' | 'remove';
}

export default function ScheduleManagement() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [agencyId, setAgencyId] = useState('');
  const [routeId, setRouteId] = useState('');
  const [loadingAgencies, setLoadingAgencies] = useState(true);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  const [weekly, setWeekly] = useState<Record<number, { time: string; isDefault: boolean }[]>>({});
  const [selectedDay, setSelectedDay] = useState<number>(() => new Date().getDay());
  const [newTime, setNewTime] = useState('');

  const todayStr = () => new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [overrides, setOverrides] = useState<OverrideItem[]>([]);
  const [overrideTime, setOverrideTime] = useState('');
  const [overrideAction, setOverrideAction] = useState<'add' | 'remove'>('add');

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const selectedAgency = agencies.find(a => a._id === agencyId);
  const selectedRoute = routes.find(r => r._id === routeId);

  useEffect(() => {
    let cancelled = false;
    setLoadingAgencies(true);
    api.getAgencies({ limit: '200' })
      .then(res => {
        if (cancelled) return;
        const list: Agency[] = (res.data?.agencies || []).filter((a: Agency) => a.status === 'active' || a.isActive);
        setAgencies(list);
      })
      .catch(() => { if (!cancelled) setAgencies([]); })
      .finally(() => { if (!cancelled) setLoadingAgencies(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setRouteId('');
    setWeekly({});
    setOverrides([]);
    if (!agencyId) { setRoutes([]); return; }
    setLoadingRoutes(true);
    api.getAgencyRoutes(agencyId)
      .then(res => setRoutes((res.data?.routes || []).filter((r: any) => r.status === 'active')))
      .catch(() => setRoutes([]))
      .finally(() => setLoadingRoutes(false));
  }, [agencyId]);

  const loadWeekly = useCallback(async (rid: string) => {
    setLoadingSchedule(true);
    try {
      const res = await api.getWeeklySchedules({ routeId: rid });
      const grouped: Record<number, { time: string; isDefault: boolean }[]> = {};
      for (const s of res.data?.weekly || []) {
        const d = s.dayOfWeek as number;
        if (!grouped[d]) grouped[d] = [];
        grouped[d].push({ time: s.travelTime, isDefault: s.source === 'route-default' });
      }
      for (const d of Object.keys(grouped)) grouped[Number(d)].sort((a, b) => a.time.localeCompare(b.time));
      setWeekly(grouped);
    } catch {
      setWeekly({});
    } finally {
      setLoadingSchedule(false);
    }
  }, []);

  useEffect(() => {
    if (!routeId) return;
    loadWeekly(routeId);
  }, [routeId, loadWeekly]);

  const loadOverrides = useCallback(async (rid: string, date: string) => {
    setLoadingSchedule(true);
    try {
      const res = await api.getOverrides({ routeId: rid, travelDate: date });
      setOverrides(res.data?.overrides || []);
    } catch {
      setOverrides([]);
    } finally {
      setLoadingSchedule(false);
    }
  }, []);

  useEffect(() => {
    if (!routeId) return;
    loadOverrides(routeId, selectedDate);
  }, [routeId, selectedDate, loadOverrides]);

  const flash = (msg: string, isError = false) => {
    if (isError) { setError(msg); setNotice(''); }
    else { setNotice(msg); setError(''); }
    setTimeout(() => { setError(''); setNotice(''); }, 3000);
  };

  const handleAddWeekly = async () => {
    if (!agencyId || !routeId || !newTime) return;
    if ((weekly[selectedDay] || []).some(w => w.time === newTime)) { flash('This time is already scheduled on that day', true); return; }
    setActionLoading(`w-add-${selectedDay}-${newTime}`);
    try {
      await api.addWeeklySchedule({ agencyId, routeId, dayOfWeek: selectedDay, travelTime: newTime });
      await loadWeekly(routeId);
      setNewTime('');
      flash(`Added ${newTime} on ${DAY_NAMES[selectedDay]}`);
    } catch (err: any) {
      flash(err.message || 'Failed to add schedule', true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveWeekly = async (time: string) => {
    if (!agencyId || !routeId) return;
    setActionLoading(`w-rem-${selectedDay}-${time}`);
    try {
      await api.removeWeeklySchedule({ agencyId, routeId, dayOfWeek: selectedDay, travelTime: time });
      await loadWeekly(routeId);
      flash(`Removed ${time} on ${DAY_NAMES[selectedDay]}`);
    } catch (err: any) {
      flash(err.message || 'Failed to remove schedule', true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddOverride = async () => {
    if (!agencyId || !routeId || !selectedDate || !overrideTime) return;
    if (overrides.some(o => o.travelTime === overrideTime && o.action === overrideAction)) {
      flash('This override already exists', true);
      return;
    }
    setActionLoading(`o-add-${overrideTime}`);
    try {
      await api.addOverride({ agencyId, routeId, travelDate: selectedDate, travelTime: overrideTime, action: overrideAction });
      await loadOverrides(routeId, selectedDate);
      setOverrideTime('');
      flash(`${overrideAction === 'add' ? 'Added' : 'Removed'} ${overrideTime} for ${selectedDate}`);
    } catch (err: any) {
      flash(err.message || 'Failed to save override', true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveOverride = async (time: string) => {
    if (!agencyId || !routeId) return;
    setActionLoading(`o-rem-${time}`);
    try {
      await api.removeOverride({ agencyId, routeId, travelDate: selectedDate, travelTime: time });
      await loadOverrides(routeId, selectedDate);
      flash(`Cleared override for ${time} on ${selectedDate}`);
    } catch (err: any) {
      flash(err.message || 'Failed to clear override', true);
    } finally {
      setActionLoading(null);
    }
  };

  const effectiveTimes = useMemo(() => {
    if (!routeId) return { configured: false, times: [] as string[] };
    const base = new Set((weekly[new Date(selectedDate + 'T00:00:00').getDay()] || []).map(w => w.time));
    for (const o of overrides) {
      if (o.action === 'add') base.add(o.travelTime);
      else base.delete(o.travelTime);
    }
    const times = Array.from(base).sort();
    return { configured: overrides.length > 0 || times.length > 0, times };
  }, [routeId, weekly, overrides, selectedDate]);

  const timeSlotsForDay = weekly[selectedDay] || [];

  return (
    <div>
      <PageHeader
        title="Schedule Management"
        subtitle="Add or remove travel hours per day for any route and bus agency"
      />

      {/* Agency + Route selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Select
          label="Bus Agency"
          placeholder="Select an agency…"
          value={agencyId}
          onChange={e => setAgencyId(e.target.value)}
          options={agencies.map(a => ({ value: a._id, label: a.name }))}
          disabled={loadingAgencies}
        />
        <Select
          label="Route"
          placeholder={agencyId ? 'Select a route…' : 'Select an agency first'}
          value={routeId}
          onChange={e => setRouteId(e.target.value)}
          options={routes.map(r => ({ value: r._id, label: `${r.origin} → ${r.destination}${viaLabel(r.via)}` }))}
          disabled={!agencyId || loadingRoutes}
        />
      </div>

      {!agencyId && (
        <div className="bg-white rounded-md border border-[var(--studio-border)] p-10 text-center">
          <Building2 size={40} className="mx-auto text-[var(--studio-text-muted)] mb-3" />
          <p className="text-sm font-semibold text-[var(--studio-text-sub)]">Select a bus agency to manage its schedules</p>
        </div>
      )}

      {agencyId && !routeId && (
        <div className="bg-white rounded-md border border-[var(--studio-border)] p-10 text-center">
          <Bus size={40} className="mx-auto text-[var(--studio-text-muted)] mb-3" />
          <p className="text-sm font-semibold text-[var(--studio-text-sub)]">{loadingRoutes ? 'Loading routes…' : 'Select a route to manage its schedules'}</p>
        </div>
      )}

      {agencyId && routeId && selectedRoute && (
        <div className="space-y-6">
          {/* Route summary */}
          <div className="flex items-center justify-between flex-wrap gap-3 bg-white rounded-md border border-[var(--studio-border)] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-[var(--blue-bg)] text-[var(--studio-accent)] flex items-center justify-center">
                <Bus size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--studio-text)]">{selectedRoute.origin} → {selectedRoute.destination}<span className="text-[var(--studio-text-sub)] font-medium">{viaLabel(selectedRoute.via)}</span></p>
                <p className="text-xs text-[var(--studio-text-sub)]">{selectedAgency?.name}</p>
              </div>
            </div>
          </div>

          {(error || notice) && (
            <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-md text-sm font-medium border ${
              error ? 'bg-[var(--tone-danger-fill)] text-[var(--tone-danger-ink)] border-[var(--tone-danger-line)]' : 'bg-[var(--blue-bg)] text-[var(--studio-accent)] border-[var(--blue-border)]'
            }`}>
              {error ? <Ban size={14} className="shrink-0" /> : <CheckCircle size={14} className="shrink-0" />}
              {error || notice}
            </div>
          )}

          {/* Weekly recurring schedule */}
          <div className="bg-white rounded-md border border-[var(--studio-border)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--studio-border)] flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-[var(--studio-accent)]" />
                <span className="text-sm font-bold text-[var(--studio-text)]">Weekly schedule (recurring)</span>
              </div>
              <span className="text-[11px] text-[var(--studio-text-muted)]">Travel hours that repeat every week</span>
            </div>

            {/* Day tabs */}
            <div className="flex gap-1.5 px-4 pt-3 overflow-x-auto">
              {DAYS.map(day => {
                const count = (weekly[day.value] || []).length;
                const active = selectedDay === day.value;
                return (
                  <button key={day.value} onClick={() => setSelectedDay(day.value)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold border cursor-pointer transition-colors whitespace-nowrap ${
                      active ? 'bg-[var(--studio-accent)] text-white border-[var(--studio-accent)]' : 'bg-[var(--fill-subtle)] text-[var(--studio-text-sub)] border-[var(--studio-border)] hover:border-[var(--studio-accent)]'
                    }`}>
                    {day.label}
                    {count > 0 && <span className={`ml-1.5 text-[10px] font-bold ${active ? 'text-white/80' : 'text-[var(--studio-text-muted)]'}`}>({count})</span>}
                  </button>
                );
              })}
            </div>

            <div className="p-4">
              {loadingSchedule && timeSlotsForDay.length === 0 ? (
                <div className="text-center py-8">
                  <Loader size={22} className="mx-auto animate-spin text-[var(--studio-accent)]" />
                </div>
              ) : timeSlotsForDay.length === 0 ? (
                <div className="text-center py-6 bg-[var(--fill-subtle)] rounded-md border border-[var(--studio-border)]">
                  <Clock size={26} className="mx-auto text-[var(--studio-text-muted)] mb-2" />
                  <p className="text-sm font-semibold text-[var(--studio-text-sub)]">No travel hours on {DAY_NAMES[selectedDay]}</p>
                  <p className="text-xs text-[var(--studio-text-muted)] mt-0.5">Add the departure hours this route runs on this day.</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 mb-4">
                  {timeSlotsForDay.map(slot => {
                    const time = slot.time;
                    const key = `w-rem-${selectedDay}-${time}`;
                    return (
                      <motion.span key={time} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[var(--blue-bg)] border border-[var(--blue-border)] text-[var(--studio-accent)] text-xs font-bold">
                        <Clock size={11} />
                        {time}
                        {slot.isDefault && <span className="text-[9px] font-bold uppercase text-[var(--studio-text-muted)]">default</span>}
                        {!slot.isDefault && (
                          <button onClick={() => handleRemoveWeekly(time)} disabled={actionLoading === key}
                            className="text-[var(--studio-accent)]/50 hover:text-[var(--tone-danger-ink)] cursor-pointer transition-colors border-none bg-transparent p-0 flex items-center" aria-label={`Remove ${time}`}>
                            {actionLoading === key ? <Loader size={11} className="animate-spin" /> : <X size={11} />}
                          </button>
                        )}
                      </motion.span>
                    );
                  })}
                </div>
              )}

              {/* Add time */}
              <div className="flex flex-wrap items-end gap-2">
                <div className="w-36">
                  <Input label="Travel hour" type="time" value={newTime} onChange={e => setNewTime(e.target.value)} />
                </div>
                <Button size="sm" onClick={handleAddWeekly} loading={actionLoading?.startsWith('w-add')} disabled={!newTime}>
                  <Plus size={14} /> Add on {DAY_NAMES[selectedDay]}
                </Button>
              </div>
            </div>
          </div>

          {/* Date overrides */}
          <div className="bg-white rounded-md border border-[var(--studio-border)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--studio-border)] flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CalendarDays size={14} className="text-[var(--studio-accent)]" />
                <span className="text-sm font-bold text-[var(--studio-text)]">Date overrides</span>
              </div>
              <span className="text-[11px] text-[var(--studio-text-muted)]">One-off changes for a single day</span>
            </div>

            <div className="p-4">
              <div className="flex flex-wrap items-end gap-2 mb-4">
                <div className="w-44">
                  <Input label="Date" type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                </div>
                <div className="w-36">
                  <Input label="Travel hour" type="time" value={overrideTime} onChange={e => setOverrideTime(e.target.value)} />
                </div>
                <div className="flex gap-1.5 mb-0.5">
                  <button onClick={() => setOverrideAction('add')}
                    className={`px-3 h-9 rounded-md text-xs font-semibold border cursor-pointer transition-colors ${
                      overrideAction === 'add' ? 'bg-[var(--solid-success)] text-white border-emerald-600' : 'bg-[var(--fill-subtle)] text-[var(--studio-text-sub)] border-[var(--studio-border)] hover:border-[var(--tone-success-line)]'
                    }`}>
                    Add departure
                  </button>
                  <button onClick={() => setOverrideAction('remove')}
                    className={`px-3 h-9 rounded-md text-xs font-semibold border cursor-pointer transition-colors ${
                      overrideAction === 'remove' ? 'bg-[var(--solid-danger)] text-white border-red-600' : 'bg-[var(--fill-subtle)] text-[var(--studio-text-sub)] border-[var(--studio-border)] hover:border-[var(--tone-danger-line)]'
                    }`}>
                    Remove departure
                  </button>
                </div>
                <Button size="sm" onClick={handleAddOverride} loading={actionLoading?.startsWith('o-add')} disabled={!overrideTime}>
                  <Plus size={14} /> Apply
                </Button>
              </div>

              {overrides.length === 0 ? (
                <div className="text-center py-5 bg-[var(--fill-subtle)] rounded-md border border-[var(--studio-border)]">
                  <p className="text-sm font-semibold text-[var(--studio-text-sub)]">No overrides for this date</p>
                  <p className="text-xs text-[var(--studio-text-muted)] mt-0.5">The weekly schedule applies as-is on {selectedDate}.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {overrides.map(o => {
                    const key = `o-rem-${o.travelTime}`;
                    return (
                      <div key={o._id} className="flex items-center justify-between px-3 py-2 rounded-md border border-[var(--studio-border)] bg-[var(--fill-subtle)]">
                        <div className="flex items-center gap-2 text-xs font-bold text-[var(--studio-text)]">
                          <ArrowUpDown size={12} className="text-[var(--studio-text-muted)]" />
                          {o.travelTime}
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            o.action === 'add' ? 'bg-[var(--tone-success-fill)] text-[var(--tone-success-ink)]' : 'bg-[var(--tone-danger-fill)] text-[var(--tone-danger-ink)]'
                          }`}>
                            {o.action === 'add' ? 'Added' : 'Removed'}
                          </span>
                        </div>
                        <button onClick={() => handleRemoveOverride(o.travelTime)} disabled={actionLoading === key}
                          className="text-[var(--studio-text-muted)] hover:text-[var(--tone-danger-ink)] cursor-pointer transition-colors border-none bg-transparent p-0" aria-label="Clear override">
                          {actionLoading === key ? <Loader size={13} className="animate-spin" /> : <X size={13} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Effective preview */}
          <div className="bg-white rounded-md border border-[var(--studio-border)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--studio-border)] flex items-center gap-2">
              <Info size={14} className="text-[var(--studio-accent)]" />
              <span className="text-sm font-bold text-[var(--studio-text)]">Effective schedule — {selectedDate}</span>
              <span className="text-[11px] text-[var(--studio-text-muted)]">
                ({DAY_NAMES[new Date(selectedDate + 'T00:00:00').getDay()]})
              </span>
            </div>
            <div className="p-4">
              {effectiveTimes.configured ? (
                <div className="flex flex-wrap gap-2">
                  {effectiveTimes.times.length > 0 ? effectiveTimes.times.map(t => (
                    <span key={t} className="px-2.5 py-1.5 rounded-md bg-[var(--fill-subtle)] border border-[var(--studio-border)] text-xs font-bold text-[var(--studio-text)]">
                      {t}
                    </span>
                  )) : (
                    <p className="text-sm font-semibold text-[var(--studio-text-sub)]">No departures run on this day.</p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-[var(--studio-text-sub)]">
                  <Info size={14} className="shrink-0" />
                  No schedule configured for this route yet — the booking page will keep showing all departure times until you add travel hours.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
