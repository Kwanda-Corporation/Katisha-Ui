import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../../api';
import { useTranslation } from '../../../node_modules/react-i18next';
import { MapPin, Download, Loader2, Search, CalendarDays } from 'lucide-react';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

interface Booking {
  _id: string;
  referenceCode: string;
  origin: string;
  pickupPoint?: string;
  destination: string;
  travelDate: string;
  travelTime: string;
  seatNumbers: string[];
  seats: number;
  passengerDetails: { name: string; phone: string; }[];
  user?: { name: string; phone: string; };
  status: string;
  createdAt: string;
}

interface GroupedBookings {
  route: string;
  time: string;
  origin: string;
  destination: string;
  bookings: Booking[];
}

const PAGE_SIZE = 20;

export default function AgentPickupManagement() {
  const { t } = useTranslation();
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getAgentBookings({ limit: '200', travelDate: filterDate });
      const data: Booking[] = res.data?.bookings || [];
      setAllBookings(data);
      setPage(1);
      setSelectedIds(new Set());
    } catch {
      setAllBookings([]);
    } finally {
      setLoading(false);
    }
  }, [filterDate]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const pickupBookings = useMemo(() => {
    let list = allBookings.filter(b => {
      if (!b.pickupPoint || !b.pickupPoint.trim()) return false;
      return true;
    });

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(b =>
        b.origin.toLowerCase().includes(q) ||
        b.destination.toLowerCase().includes(q) ||
        b.pickupPoint?.toLowerCase().includes(q) ||
        b.travelTime.toLowerCase().includes(q)
      );
    }

    return list;
  }, [allBookings, search]);

  const grouped = useMemo(() => {
    const groups: Record<string, GroupedBookings> = {};
    for (const b of pickupBookings) {
      const key = `${b.origin}|${b.destination}|${b.travelTime}`;
      if (!groups[key]) {
        groups[key] = {
          route: `${b.origin} → ${b.destination}`,
          time: b.travelTime,
          origin: b.origin,
          destination: b.destination,
          bookings: [],
        };
      }
      groups[key].bookings.push(b);
    }
    return Object.values(groups).sort((a, b) => a.time.localeCompare(b.time));
  }, [pickupBookings]);

  const totalPages = Math.max(1, Math.ceil(grouped.length / PAGE_SIZE));
  const paginatedGroups = grouped.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const allIds = useMemo(() => new Set(pickupBookings.map(b => b._id)), [pickupBookings]);
  const allSelected = selectedIds.size > 0 && selectedIds.size === allIds.size;
  const selectedCount = selectedIds.size;

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(allIds));
  };

  const toggleBooking = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedBookings = useMemo(
    () => pickupBookings.filter(b => selectedIds.has(b._id)),
    [pickupBookings, selectedIds]
  );

  const pickupSummary = useMemo(() => {
    const summary: Record<string, { point: string; count: number; route: string; time: string }> = {};
    for (const b of selectedBookings) {
      const point = b.pickupPoint || 'Unknown';
      const key = `${b.origin}|${b.destination}|${b.travelTime}|${point}`;
      if (!summary[key]) {
        summary[key] = { point, count: 0, route: `${b.origin} → ${b.destination}`, time: b.travelTime };
      }
      summary[key].count += b.seats || 1;
    }
    return Object.values(summary).sort((a, b) => a.route.localeCompare(b.route) || a.time.localeCompare(b.time));
  }, [selectedBookings]);

  const handleDownload = () => {
    if (selectedBookings.length === 0) return;
    const rows = selectedBookings.map(b => `
      <tr>
        <td style="padding:10px 12px;border:1px solid #e2e8f0">${esc(b.referenceCode)}</td>
        <td style="padding:10px 12px;border:1px solid #e2e8f0">${esc(b.pickupPoint || '-')}</td>
        <td style="padding:10px 12px;border:1px solid #e2e8f0">${esc(`${b.origin} → ${b.destination}`)}</td>
        <td style="padding:10px 12px;border:1px solid #e2e8f0">${esc(b.travelTime)}</td>
        <td style="padding:10px 12px;border:1px solid #e2e8f0">${esc(b.user?.name || b.passengerDetails?.[0]?.name || 'Guest')}</td>
        <td style="padding:10px 12px;border:1px solid #e2e8f0">${esc(b.user?.phone || b.passengerDetails?.[0]?.phone || '-')}</td>
        <td style="padding:10px 12px;border:1px solid #e2e8f0">${esc(String(b.seats || 1))}</td>
      </tr>`).join('');

    const summaryRows = pickupSummary.map(s => `
      <tr>
        <td style="padding:8px 12px;border:1px solid #e2e8f0">${esc(s.route)}</td>
        <td style="padding:8px 12px;border:1px solid #e2e8f0">${esc(s.time)}</td>
        <td style="padding:8px 12px;border:1px solid #e2e8f0">${esc(s.point)}</td>
        <td style="padding:8px 12px;border:1px solid #e2e8f0"><strong>${esc(String(s.count))}</strong></td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${t('pickupManagement.reportTitle', { date: filterDate })}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background: #fff; color: #333; }
  h1 { color: #1D4ED8; border-bottom: 3px solid #1D4ED8; padding-bottom: 10px; font-size: 24px; }
  h2 { color: #1D4ED8; margin-top: 30px; font-size: 18px; }
  .meta { margin-bottom: 20px; color: #64748b; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 10px; }
  th { background: #1D4ED8; color: #fff; padding: 12px; text-align: left; }
  td { padding: 10px 12px; border: 1px solid #e2e8f0; }
  tr:nth-child(even) { background: #f8fafc; }
  .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
  .note { background: #F4F4F5; border-left: 4px solid #1D4ED8; padding: 12px 16px; margin: 20px 0; font-size: 13px; color: #1E40AF; border-radius: 4px; }
</style></head>
<body>
  <h1>${t('pickupManagement.reportTitle', { date: filterDate })}</h1>
  <div class="meta">
    <strong>${t('pickupManagement.generatedAt')}:</strong> ${new Date().toLocaleString()} |
    <strong>${t('pickupManagement.totalPassengers')}:</strong> ${selectedBookings.reduce((sum, b) => sum + (b.seats || 1), 0)}
  </div>
  <div class="note">${t('pickupManagement.driverInstructions')}</div>
  <table>
    <thead>
      <tr>
        <th>${t('pickupManagement.route')}</th>
        <th>${t('pickupManagement.pickupPoint')}</th>
        <th>${t('pickupManagement.route')}</th>
        <th>${t('pickupManagement.time')}</th>
        <th>${t('pickupManagement.passenger')}</th>
        <th>${t('common.phone')}</th>
        <th>${t('pickupManagement.seats')}</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <h2>${t('pickupManagement.pickupSummary')}</h2>
  <table>
    <thead>
      <tr>
        <th>${t('pickupManagement.route')}</th>
        <th>${t('pickupManagement.time')}</th>
        <th>${t('pickupManagement.pickupPoint')}</th>
        <th>${t('pickupManagement.count')}</th>
      </tr>
    </thead>
    <tbody>${summaryRows}</tbody>
  </table>
  <div class="footer">Katisha Transport — ${t('pickupManagement.reportTitle', { date: filterDate })}</div>
</body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pickup-manifest-${filterDate}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight">{t('pickupManagement.title')}</h1>
          <p className="text-sm text-[var(--text-sub)] mt-1">{t('pickupManagement.subtitle')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative">
          <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
            className="h-10 pl-9 pr-3 rounded-md border border-[var(--border)] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-400/40 focus:border-zinc-400"
          />
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('pickupManagement.searchPlaceholder')}
            className="w-full h-10 pl-9 pr-3 rounded-md border border-[var(--border)] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-400/40 focus:border-zinc-400"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={toggleSelectAll}
            className="h-10 px-4 rounded-md border border-[var(--border)] text-sm font-medium text-[var(--text-sub)] hover:bg-[#F9FAFB] transition-all cursor-pointer bg-white"
          >
            {allSelected ? t('pickupManagement.deselectAll') : t('pickupManagement.selectAll')}
          </button>
          <button onClick={handleDownload} disabled={selectedCount === 0}
            className="h-10 px-4 rounded-md bg-[var(--blue)] text-white text-sm font-medium flex items-center gap-2 hover:bg-[var(--blue-dark)] disabled:opacity-50 transition-all cursor-pointer disabled:cursor-not-allowed border-none"
          >
            <Download size={14} />
            {t('pickupManagement.downloadSelected', { count: selectedCount })}
          </button>
        </div>
      </div>

      {selectedCount > 0 && (
        <p className="text-xs text-[var(--blue)] mb-4">{t('pickupManagement.selectedInfo', { count: selectedCount })}</p>
      )}

      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <Loader2 size={24} className="animate-spin text-[var(--blue)]" />
        </div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-md border border-[var(--border)]">
          <MapPin size={40} className="mx-auto text-[var(--text-muted)] mb-3" />
          <p className="text-sm font-medium text-[var(--text-sub)]">{t('pickupManagement.noBookings')}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">{t('pickupManagement.noBookingsDesc')}</p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {paginatedGroups.map(group => (
              <div key={`${group.route}|${group.time}`} className="bg-white rounded-md border border-[var(--border)] overflow-hidden">
                <div className="px-5 py-3 bg-[#F9FAFB] border-b border-[var(--border)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-[var(--blue)]" />
                    <span className="text-sm font-bold text-[var(--text)]">{t('pickupManagement.groupHeader', { route: group.route, time: group.time })}</span>
                  </div>
                  <span className="text-xs text-[var(--text-sub)]">{group.bookings.length} booking(s)</span>
                </div>
                <div className="divide-y divide-zinc-50">
                  {group.bookings.map(b => (
                    <label key={b._id}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--blue-light)]/50 transition-colors cursor-pointer"
                    >
                      <input type="checkbox" checked={selectedIds.has(b._id)} onChange={() => toggleBooking(b._id)}
                        className="w-4 h-4 rounded border-zinc-300 text-[var(--blue)] focus:ring-zinc-400 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-[var(--blue)] font-mono">{b.referenceCode}</span>
                          <span className="text-xs bg-[var(--blue-light)] text-[var(--blue-dark)] px-1.5 py-0.5 rounded font-semibold">{b.pickupPoint}</span>
                        </div>
                        <p className="text-sm font-medium text-[var(--text)] mt-0.5">
                          {b.user?.name || b.passengerDetails?.[0]?.name || 'Guest'}
                          <span className="text-xs text-[var(--text-muted)] ml-2">{b.user?.phone || b.passengerDetails?.[0]?.phone}</span>
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">{b.seats || 1} seat(s)</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-[var(--text-sub)]">{b.travelTime}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">{new Date(b.createdAt).toLocaleDateString()}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="h-9 px-3 rounded-md border border-[var(--border)] text-sm font-medium text-[var(--text-sub)] hover:bg-[#F9FAFB] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer bg-white"
              >
                &lt;
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                return start + i;
              }).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`h-9 min-w-[36px] px-2 rounded-md text-sm font-medium transition-all cursor-pointer border ${
                    p === page ? 'bg-[var(--blue)] text-white border-[var(--blue)]' : 'border-[var(--border)] text-[var(--text-sub)] hover:bg-[#F9FAFB] bg-white'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="h-9 px-3 rounded-md border border-[var(--border)] text-sm font-medium text-[var(--text-sub)] hover:bg-[#F9FAFB] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer bg-white"
              >
                &gt;
              </button>
            </div>
          )}

          <p className="text-xs text-[var(--text-muted)] text-center mt-4">
            {t('pickupManagement.pageInfo', { current: page, total: totalPages, count: pickupBookings.length })}
          </p>
        </>
      )}
    </div>
  );
}