import { useCallback, useEffect, useState } from 'react';
import {
  CalendarDays, Download, FileText, Loader, Search, Ticket, X,
} from 'lucide-react';
import { api } from '../../api';
import { PageHeader, Pagination } from '../../components/ui';

interface BookingRow {
  _id: string;
  referenceCode: string;
  createdAt: string;
  travelDate: string;
  travelTime?: string;
  origin?: string;
  destination?: string;
  seats?: number;
  totalAmount?: number;
  paymentStatus?: string;
  status?: string;
  guestName?: string;
  guestPhone?: string;
  passengerDetails?: Array<{ name?: string; phone?: string }>;
  agency?: { name?: string } | string;
  user?: { name?: string; phone?: string };
}

interface BookingList {
  bookings: BookingRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  counts: { all: number; new: number };
}

type Scope = 'new' | 'all';

interface Filters {
  scope: Scope;
  status: string;
  paymentStatus: string;
  dateField: 'travel' | 'created';
  from: string;
  to: string;
  search: string;
}

const EMPTY_LIST: BookingList = {
  bookings: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
  counts: { all: 0, new: 0 },
};

function buildParams(filters: Filters, page: number): Record<string, string> {
  const params: Record<string, string> = {
    page: String(page),
    limit: '20',
  };
  if (filters.scope === 'new') params.scope = 'new';
  if (filters.status) params.status = filters.status;
  if (filters.paymentStatus) params.paymentStatus = filters.paymentStatus;
  if (filters.dateField === 'created') params.dateField = 'created';
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  if (filters.search.trim()) params.search = filters.search.trim();
  return params;
}

function passengerName(b: BookingRow): string {
  return b.passengerDetails?.[0]?.name || b.guestName || b.user?.name || '—';
}

function passengerPhone(b: BookingRow): string {
  return b.passengerDetails?.[0]?.phone || b.guestPhone || b.user?.phone || '—';
}

function agencyName(b: BookingRow): string {
  return typeof b.agency === 'object' ? (b.agency?.name || '—') : '—';
}

function statusTone(value?: string) {
  switch (value) {
    case 'paid':
    case 'issued':
    case 'completed':
    case 'confirmed':
      return { color: 'var(--tone-success-ink)', fill: 'var(--tone-success-fill)' };
    case 'processing':
    case 'pending':
      return { color: 'var(--tone-warning-ink)', fill: 'var(--tone-warning-fill)' };
    case 'failed':
    case 'rejected':
    case 'cancelled':
      return { color: 'var(--tone-danger-ink)', fill: 'var(--tone-danger-fill)' };
    default:
      return { color: 'var(--tone-neutral-ink)', fill: 'var(--tone-neutral-fill)' };
  }
}

function StatusPill({ value }: { value?: string }) {
  const tone = statusTone(value);
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize"
      style={{ color: tone.color, background: tone.fill }}
    >
      {value || '—'}
    </span>
  );
}

export default function SystemBookings() {
  const [filters, setFilters] = useState<Filters>({
    scope: 'new',
    status: '',
    paymentStatus: '',
    dateField: 'travel',
    from: '',
    to: '',
    search: '',
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [list, setList] = useState<BookingList>(EMPTY_LIST);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const activeFilters: Filters = { ...filters, search: debouncedSearch };

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(filters.search), 300);
    return () => window.clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => { setPage(1); }, [filters.scope, filters.status, filters.paymentStatus, filters.dateField, filters.from, filters.to, debouncedSearch]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res: any = await api.getSystemBookings(buildParams(activeFilters, page));
      setList({
        bookings: res.data?.bookings || [],
        pagination: res.data?.pagination || EMPTY_LIST.pagination,
        counts: res.data?.counts || EMPTY_LIST.counts,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load bookings');
      setList(EMPTY_LIST);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilters.scope, activeFilters.status, activeFilters.paymentStatus, activeFilters.dateField,
      activeFilters.from, activeFilters.to, activeFilters.search, page]);

  useEffect(() => { void load(); }, [load]);

  const update = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const downloadReport = async () => {
    setDownloading(true);
    setError('');
    try {
      await api.downloadSystemBookingsReport(buildParams(activeFilters, page));
    } catch (err: any) {
      setError(err.message || 'Failed to download the report');
    } finally {
      setDownloading(false);
    }
  };

  const inputClass =
    'h-9 px-3 rounded-md border border-[var(--studio-border)] text-sm bg-white text-[var(--studio-text)] focus:outline-none focus:ring-2 focus:ring-zinc-400/30';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings"
        subtitle="Review new reservations, search all bookings and export a PDF report"
        actions={
          <button
            type="button"
            onClick={() => void downloadReport()}
            disabled={downloading}
            className="h-9 px-4 rounded-md bg-[var(--studio-accent)] text-white text-sm font-medium flex items-center gap-2 cursor-pointer hover:opacity-90 disabled:opacity-50"
          >
            {downloading ? <Loader size={14} className="animate-spin" /> : <Download size={14} />}
            Download PDF
          </button>
        }
      />

      {error && (
        <div className="p-3 rounded-md text-xs font-medium" style={{ background: 'var(--tone-danger-fill)', color: 'var(--tone-danger-ink)' }}>
          {error}
        </div>
      )}

      {/* New / all tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--studio-border)]">
        {(['new', 'all'] as Scope[]).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => update('scope', tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 cursor-pointer ${
              filters.scope === tab
                ? 'border-[var(--studio-accent)] text-[var(--studio-accent)]'
                : 'border-transparent text-[var(--studio-text-sub)] hover:text-[var(--studio-text)]'
            }`}
          >
            {tab === 'new' ? 'New bookings' : 'All bookings'}
            <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-[var(--fill-subtle)]">
              {tab === 'new' ? list.counts.new : list.counts.all}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-md border border-[var(--studio-border)] p-4 flex flex-wrap items-end gap-3">
        <label className="flex-1 min-w-[220px] block">
          <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--studio-text-sub)] mb-1.5">Search</span>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--studio-text-muted)]" />
            <input
              value={filters.search}
              onChange={e => update('search', e.target.value)}
              placeholder="Reference, passenger, phone or route"
              className={`${inputClass} w-full pl-9 pr-9`}
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => update('search', '')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--studio-text-muted)] cursor-pointer"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </label>

        <label className="block">
          <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--studio-text-sub)] mb-1.5">Booking status</span>
          <select value={filters.status} onChange={e => update('status', e.target.value)} className={inputClass}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="issued">Issued</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>

        <label className="block">
          <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--studio-text-sub)] mb-1.5">Payment</span>
          <select value={filters.paymentStatus} onChange={e => update('paymentStatus', e.target.value)} className={inputClass}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </label>

        <label className="block">
          <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--studio-text-sub)] mb-1.5">Date type</span>
          <select
            value={filters.dateField}
            onChange={e => update('dateField', e.target.value as Filters['dateField'])}
            className={inputClass}
          >
            <option value="travel">Travel date</option>
            <option value="created">Booked date</option>
          </select>
        </label>

        <label className="block">
          <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--studio-text-sub)] mb-1.5">From</span>
          <input type="date" value={filters.from} onChange={e => update('from', e.target.value)} className={inputClass} />
        </label>

        <label className="block">
          <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--studio-text-sub)] mb-1.5">To</span>
          <input type="date" value={filters.to} onChange={e => update('to', e.target.value)} className={inputClass} />
        </label>

        {(filters.from || filters.to || filters.search || filters.status || filters.paymentStatus) && (
          <button
            type="button"
            onClick={() => setFilters({
              scope: filters.scope,
              status: '',
              paymentStatus: '',
              dateField: 'travel',
              from: '',
              to: '',
              search: '',
            })}
            className="h-9 px-3 rounded-md border border-[var(--studio-border)] text-sm text-[var(--studio-text-sub)] cursor-pointer bg-white"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Results */}
      <div className="bg-white rounded-md border border-[var(--studio-border)] overflow-hidden">
        {loading ? (
          <div className="py-14 text-center"><Loader size={24} className="mx-auto animate-spin text-[var(--blue)]" /></div>
        ) : list.bookings.length === 0 ? (
          <div className="py-14 text-center">
            <Ticket size={36} className="mx-auto text-[var(--studio-text-muted)] mb-3" />
            <p className="text-sm font-medium text-[var(--studio-text-sub)]">No bookings match these filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-[var(--studio-text-muted)] border-b" style={{ borderColor: 'var(--border)' }}>
                  <th className="py-2.5 pl-5 pr-3 font-semibold">Reference</th>
                  <th className="py-2.5 pr-3 font-semibold">Passenger</th>
                  <th className="py-2.5 pr-3 font-semibold">Route</th>
                  <th className="py-2.5 pr-3 font-semibold">Agency</th>
                  <th className="py-2.5 pr-3 font-semibold">Travel</th>
                  <th className="py-2.5 pr-3 font-semibold">Seats</th>
                  <th className="py-2.5 pr-3 font-semibold">Amount</th>
                  <th className="py-2.5 pr-3 font-semibold">Status</th>
                  <th className="py-2.5 pr-5 font-semibold">Payment</th>
                </tr>
              </thead>
              <tbody>
                {list.bookings.map(b => (
                  <tr key={b._id} className="border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                    <td className="py-2.5 pl-5 pr-3">
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <FileText size={12} className="text-[var(--studio-text-muted)]" />
                        {b.referenceCode}
                      </div>
                      <p className="text-[11px] text-[var(--studio-text-muted)] mt-0.5">
                        {new Date(b.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="py-2.5 pr-3">
                      <p className="font-medium text-[var(--studio-text)]">{passengerName(b)}</p>
                      <p className="text-xs text-[var(--studio-text-muted)]">{passengerPhone(b)}</p>
                    </td>
                    <td className="py-2.5 pr-3 text-[var(--studio-text-sub)]">
                      {b.origin || '—'} → {b.destination || '—'}
                    </td>
                    <td className="py-2.5 pr-3 text-[var(--studio-text-sub)]">{agencyName(b)}</td>
                    <td className="py-2.5 pr-3 text-[var(--studio-text-sub)]">
                      {b.travelDate ? new Date(b.travelDate).toLocaleDateString() : '—'}
                      {b.travelTime && <span className="block text-xs text-[var(--studio-text-muted)]">{b.travelTime}</span>}
                    </td>
                    <td className="py-2.5 pr-3">{b.seats ?? '—'}</td>
                    <td className="py-2.5 pr-3 font-medium">{Number(b.totalAmount || 0).toLocaleString()} RWF</td>
                    <td className="py-2.5 pr-3"><StatusPill value={b.status} /></td>
                    <td className="py-2.5 pr-5"><StatusPill value={b.paymentStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-5 pb-4">
          <Pagination
            page={list.pagination.page}
            totalPages={list.pagination.totalPages}
            total={list.pagination.total}
            pageSize={list.pagination.limit}
            onPageChange={setPage}
          />
        </div>
      </div>

      <p className="text-xs text-[var(--studio-text-muted)] flex items-center gap-1.5">
        <CalendarDays size={13} />
        Date filters apply to travel date by default. Switch to booked date to filter by creation time.
      </p>
    </div>
  );
}
