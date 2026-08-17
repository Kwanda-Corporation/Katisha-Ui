import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Plus, Search, Check, AlertCircle, X,
  MoreHorizontal, Eye, Power, Clock,
  RefreshCw, Loader2, TrendingUp, TrendingDown,
  ArrowRight, History, Edit3, DollarSign,
  ArrowUpRight, ArrowDownRight, Trash2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PageHeader, Button, StatCard, Modal } from '../../components/ui';
import { viaLabel } from '../../utils/via';

// ── Types ──────────────────────────────────────────────────────────────────────
interface PriceHistoryEntry {
  oldPrice: number;
  newPrice: number;
  changedAt: string;
  changedBy: string;
  reason?: string;
}

interface RoutePrice {
  id: string;
  corridorKey: string;
  agency?: { id: string; name: string } | null;
  origin: string;
  destination: string;
  via?: string;
  currentPrice: number;
  priceHistory: PriceHistoryEntry[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Pagination { page: number; limit: number; total: number; totalPages: number }

// ── Helpers ────────────────────────────────────────────────────────────────────
const FRW = (n: number) =>
  new Intl.NumberFormat('rw-RW', { style: 'decimal', minimumFractionDigits: 0 }).format(n) + ' RWF';

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(d).toLocaleDateString();
}

function priceDelta(history: PriceHistoryEntry[]) {
  if (history.length === 0) return null;
  const last = history[history.length - 1];
  return last.newPrice - last.oldPrice;
}

// ── Route chip ─────────────────────────────────────────────────────────────────
function RouteChip({ origin, destination, via, size = 'sm' }: { origin: string; destination: string; via?: string; size?: 'sm' | 'lg' }) {
  const text = size === 'lg' ? 'text-sm' : 'text-xs';
  const viaStr = viaLabel(via);
  return (
    <div className={`inline-flex items-center gap-1.5 font-[var(--font-body)] font-medium ${text}`}>
      <span className="text-[var(--text)] font-semibold">{origin}</span>
      <ArrowRight size={size === 'lg' ? 14 : 11} className="text-[var(--blue)] flex-shrink-0" />
      <span className="text-[var(--text)] font-semibold">{destination}</span>
      {viaStr && <span className="text-[var(--text-muted)] font-medium">{viaStr}</span>}
    </div>
  );
}

// ── Price delta badge ──────────────────────────────────────────────────────────
function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) return null;
  const up = delta > 0;
  return (
    <span
      className="inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md"
      style={up ? { background: 'var(--error-bg)', color: 'var(--error)' } : { background: 'rgba(29, 78, 216,0.12)', color: 'var(--blue)' }}
    >
      {up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
      {Math.abs(delta).toLocaleString()}
    </span>
  );
}

// ── RowMenu ────────────────────────────────────────────────────────────────────
function RowMenu({
  route,
  onView,
  onUpdatePrice,
  onHistory,
  onDeactivate,
  onDelete,
}: {
  route: RoutePrice;
  onView: () => void;
  onUpdatePrice: () => void;
  onHistory: () => void;
  onDeactivate: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleOpen = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setOpenUpward(window.innerHeight - rect.bottom < 200);
    }
    setOpen(v => !v);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={triggerRef}
        onClick={handleOpen}
        className="p-1.5 rounded-md hover:bg-[var(--blue-light)] text-[var(--text-muted)] transition-colors"
      >
        <MoreHorizontal size={15} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.11 }}
            className="absolute right-0 z-[200] bg-white border border-[var(--border)] rounded-md py-1 w-48"
            style={{ [openUpward ? 'bottom' : 'top']: '2.25rem' }}
          >
            <button onClick={() => { onView(); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--blue-light)] transition-colors font-[var(--font-body)]">
              <Eye size={13} /> View details
            </button>
            {route.isActive && (
              <button onClick={() => { onUpdatePrice(); setOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--blue-light)] transition-colors font-[var(--font-body)]">
                <Edit3 size={13} /> Update price
              </button>
            )}
            <button onClick={() => { onHistory(); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--blue-light)] transition-colors font-[var(--font-body)]">
              <History size={13} /> Price history
            </button>
            <div className="border-t border-[var(--border)] my-1" />
            {route.isActive && (
              <button onClick={() => { onDeactivate(); setOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-[var(--blue-light)] transition-colors text-[var(--text-sub)] font-[var(--font-body)]">
                <Power size={13} /> Deactivate
              </button>
            )}
            <div className="border-t border-[var(--border)] my-1" />
            <button onClick={() => { onDelete(); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-red-50 transition-colors text-red-500 font-[var(--font-body)]">
              <Trash2 size={13} /> Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Add Route Modal ────────────────────────────────────────────────────────────
function AddRouteModal({ onClose, onSave, authFetch }: { onClose: () => void; onSave: () => void; authFetch: (path: string, options?: RequestInit) => Promise<any> }) {
  const [form, setForm] = useState({ corridorKey: '', origin: '', destination: '', currentPrice: '', agencyId: '', via: '' });
  const [agencies, setAgencies] = useState<Array<{ _id: string; name: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    authFetch('/agencies').then(res => {
      const list = res?.data?.agencies ?? res?.agencies ?? [];
      setAgencies(list);
    }).catch(() => {});
  }, []);

  const handleOriginDestChange = (field: 'origin' | 'destination', value: string) => {
    setForm(f => {
      const updated = { ...f, [field]: value };
      const o = (field === 'origin' ? value : f.origin).toUpperCase().replace(/\s+/g, '_').slice(0, 12);
      const d = (field === 'destination' ? value : f.destination).toUpperCase().replace(/\s+/g, '_').slice(0, 12);
      if (o && d) updated.corridorKey = `${o}_${d}`;
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!form.agencyId) { setError('Please select an agency.'); return; }
    if (!form.corridorKey || !form.origin || !form.destination || !form.currentPrice) {
      setError('All fields are required.'); return;
    }
    const price = Number(form.currentPrice);
    if (isNaN(price) || price <= 0) { setError('Price must be a positive number.'); return; }
    setSaving(true); setError('');
    const result = await authFetch('/route-prices', {
      method: 'POST',
      body: JSON.stringify({
        corridorKey: form.corridorKey,
        origin: form.origin,
        destination: form.destination,
        currentPrice: price,
        agencyId: form.agencyId,
        via: form.via,
      }),
    });
    setSaving(false);
    if (!result) { setError('Failed to create route.'); return; }
    setSuccess(true);
    setTimeout(() => { onSave(); onClose(); }, 1500);
  };

  return (
    <Modal open onClose={onClose} title="Add New Route" maxWidth={480}>
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div key="ok" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="py-10 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--blue-light)] border border-zinc-200 flex items-center justify-center mx-auto mb-4">
              <Check size={28} className="text-[var(--blue)]" />
            </div>
            <p className="text-lg font-semibold text-[var(--text)] font-[var(--font-body)]">Route Added!</p>
            <p className="text-sm text-[var(--text-sub)] mt-1">
              <RouteChip origin={form.origin} destination={form.destination} /> at {FRW(Number(form.currentPrice))}
            </p>
          </motion.div>
        ) : (
          <motion.div key="form" className="space-y-4">
            {error && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-sm text-[var(--error)] bg-[var(--error-bg)] px-3 py-2.5 rounded-md border border-[var(--error-border)]">
                <AlertCircle size={14} className="flex-shrink-0" /> {error}
              </motion.div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wide mb-1.5 font-[var(--font-body)]">Agency <span className="text-[var(--error)]">*</span></label>
              <select
                className="w-full border border-[var(--border)] rounded-md px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/15 transition-all cursor-pointer"
                value={form.agencyId}
                onChange={e => setForm(f => ({ ...f, agencyId: e.target.value }))}
              >
                <option value="">Select agency…</option>
                {agencies.map(a => (
                  <option key={a._id} value={a._id}>{a.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wide mb-1.5 font-[var(--font-body)]">Origin <span className="text-[var(--error)]">*</span></label>
                <input className="w-full border border-[var(--border)] rounded-md px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/15 transition-all placeholder:text-[var(--text-muted)] font-[var(--font-body)]" placeholder="e.g. Kigali"
                  value={form.origin}
                  onChange={e => handleOriginDestChange('origin', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wide mb-1.5 font-[var(--font-body)]">Destination <span className="text-[var(--error)]">*</span></label>
                <input className="w-full border border-[var(--border)] rounded-md px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/15 transition-all placeholder:text-[var(--text-muted)] font-[var(--font-body)]" placeholder="e.g. Huye"
                  value={form.destination}
                  onChange={e => handleOriginDestChange('destination', e.target.value)} />
              </div>
            </div>

            {form.origin && form.destination && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="bg-[var(--bg)] rounded-md px-3 py-2.5 flex items-center gap-2 border border-[var(--border)]">
                <MapPin size={12} className="text-[var(--blue)]" />
                <RouteChip origin={form.origin} destination={form.destination} />
              </motion.div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wide mb-1.5 font-[var(--font-body)]">
                Corridor Key <span className="text-[var(--error)]">*</span>
                <span className="text-[var(--text-muted)] font-normal normal-case ml-1">(unique identifier)</span>
              </label>
              <input
                className="w-full border border-[var(--border)] rounded-md px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/15 transition-all placeholder:text-[var(--text-muted)] font-mono"
                placeholder="e.g. KIGALI_HUYE"
                value={form.corridorKey}
                onChange={e => setForm(f => ({ ...f, corridorKey: e.target.value.toUpperCase() }))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wide mb-1.5 font-[var(--font-body)]">Base Price (RWF) <span className="text-[var(--error)]">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--text-muted)] font-[var(--font-body)]">RWF</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  className="w-full border border-[var(--border)] rounded-md pl-11 pr-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/15 transition-all placeholder:text-[var(--text-muted)] font-[var(--font-body)]"
                  placeholder="e.g. 3000"
                  value={form.currentPrice}
                  onChange={e => setForm(f => ({ ...f, currentPrice: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wide mb-1.5 font-[var(--font-body)]">Via Point <span className="text-[var(--text-muted)] font-normal normal-case">(optional)</span></label>
              <input
                className="w-full border border-[var(--border)] rounded-md px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/15 transition-all placeholder:text-[var(--text-muted)] font-[var(--font-body)]"
                placeholder="e.g. Kagitumba"
                value={form.via}
                onChange={e => setForm(f => ({ ...f, via: e.target.value }))}
              />
              <p className="text-[11px] text-[var(--text-muted)] mt-1.5 font-[var(--font-body)]">The route will be shown as e.g. Kigali → Kampala via Kagitumba. Adding another via to the same corridor creates a distinct route.</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={saving || !form.corridorKey || !form.origin || !form.destination || !form.currentPrice || !form.agencyId} loading={saving} size="sm">
                {saving ? 'Saving...' : 'Add Route'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}

// ── Update Price Modal ─────────────────────────────────────────────────────────
function UpdatePriceModal({ route, onClose, onSave, authFetch }: {
  route: RoutePrice;
  onClose: () => void;
  onSave: () => void;
  authFetch: (path: string, options?: RequestInit) => Promise<any>;
}) {
  const [newPrice, setNewPrice] = useState(String(route.currentPrice));
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const parsedNew = Number(newPrice);
  const delta = parsedNew - route.currentPrice;
  const valid = !isNaN(parsedNew) && parsedNew > 0 && parsedNew !== route.currentPrice;

  const handleSubmit = async () => {
    if (!valid) { setError('Enter a different valid price.'); return; }
    setSaving(true); setError('');
    const result = await authFetch(`/route-prices/${route.id}/price`, {
      method: 'PATCH',
      body: JSON.stringify({ price: parsedNew, ...(reason ? { reason } : {}) }),
    });
    setSaving(false);
    if (!result) { setError('Failed to update price.'); return; }
    setSuccess(true);
    setTimeout(() => { onSave(); onClose(); }, 1500);
  };

  return (
    <Modal open onClose={onClose} title="Update Price" maxWidth={480}>
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div key="ok" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="py-10 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--blue-light)] border border-zinc-200 flex items-center justify-center mx-auto mb-4">
              <Check size={28} className="text-[var(--blue)]" />
            </div>
            <p className="text-lg font-semibold text-[var(--text)] font-[var(--font-body)]">Price Updated!</p>
            <p className="text-sm text-[var(--text-sub)] mt-1">{FRW(route.currentPrice)} → <strong>{FRW(parsedNew)}</strong></p>
          </motion.div>
        ) : (
          <motion.div key="form" className="space-y-4">
            {error && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-sm text-[var(--error)] bg-[var(--error-bg)] px-3 py-2.5 rounded-md border border-[var(--error-border)]">
                <AlertCircle size={14} className="flex-shrink-0" /> {error}
              </motion.div>
            )}

            <div className="flex items-center gap-3 mb-2">
              <RouteChip origin={route.origin} destination={route.destination} via={route.via} size="lg" />
            </div>

            <div className="bg-[var(--bg)] rounded-md p-4 border border-[var(--border)] flex items-center justify-between">
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-0.5 font-[var(--font-body)]">Current price</p>
                <p className="text-xl font-bold text-[var(--text)] font-[var(--font-body)]">{FRW(route.currentPrice)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[var(--text-muted)] mb-0.5 font-[var(--font-body)]">Price changes</p>
                <p className="text-sm font-semibold text-[var(--text-sub)] font-[var(--font-body)]">{route.priceHistory.length} times</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wide mb-1.5 font-[var(--font-body)]">New Price (RWF) <span className="text-[var(--error)]">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--text-muted)] font-[var(--font-body)]">RWF</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  className="w-full border border-[var(--border)] rounded-md pl-11 pr-3 py-2.5 text-base bg-white focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/15 transition-all placeholder:text-[var(--text-muted)] font-semibold font-[var(--font-body)]"
                  value={newPrice}
                  onChange={e => setNewPrice(e.target.value)}
                />
              </div>
            </div>

            <AnimatePresence>
              {newPrice && !isNaN(parsedNew) && parsedNew !== route.currentPrice && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden">
                  <div
                    className="flex items-center gap-3 px-4 py-3 rounded-md border text-sm font-semibold"
                    style={delta > 0
                      ? { background: 'var(--error-bg)', borderColor: 'var(--error-border)', color: 'var(--error)' }
                      : { background: 'rgba(29, 78, 216,0.08)', borderColor: 'rgba(29, 78, 216,0.2)', color: 'var(--blue)' }
                    }
                  >
                    {delta > 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                    <span className="font-[var(--font-body)]">{delta > 0 ? 'Price increase' : 'Price decrease'} of {FRW(Math.abs(delta))}</span>
                    <span className="ml-auto opacity-60 font-[var(--font-body)]">
                      {delta > 0 ? '+' : ''}{((delta / route.currentPrice) * 100).toFixed(1)}%
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wide mb-1.5 font-[var(--font-body)]">Reason <span className="text-[var(--text-muted)] font-normal normal-case">(optional)</span></label>
              <textarea
                rows={2}
                className="w-full border border-[var(--border)] rounded-md px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/15 transition-all placeholder:text-[var(--text-muted)] resize-none font-[var(--font-body)]"
                placeholder="e.g. Fuel price adjustment, seasonal rate..."
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={saving || !valid} loading={saving} size="sm">
                {saving ? 'Saving...' : 'Update Price'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}

// ── Route Detail Drawer ────────────────────────────────────────────────────────
function RouteDrawer({
  route,
  onClose,
  onUpdatePrice,
  onUpdateVia,
  onDeactivate,
  onDelete,
  authFetch,
}: {
  route: RoutePrice;
  onClose: () => void;
  onUpdatePrice: () => void;
  onUpdateVia: (via: string) => void;
  onDeactivate: () => void;
  onDelete: () => void;
  authFetch: (path: string, options?: RequestInit) => Promise<any>;
}) {
  const [history, setHistory] = useState<PriceHistoryEntry[]>(route.priceHistory ?? []);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [editingVia, setEditingVia] = useState(false);
  const [viaValue, setViaValue] = useState(route.via || '');
  const [savingVia, setSavingVia] = useState(false);
  const [viaError, setViaError] = useState('');
  const delta = priceDelta(history);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoadingHistory(true);
      const data = await authFetch(`/route-prices/${route.id}/history`);
      if (data) setHistory(Array.isArray(data) ? data : []);
      setLoadingHistory(false);
    };
    fetchHistory();
  }, [route.id, authFetch]);

  const startEditVia = () => {
    setViaValue(route.via || '');
    setViaError('');
    setEditingVia(true);
  };

  const handleSaveVia = async () => {
    const next = viaValue.trim();
    if (next === (route.via || '').trim()) { setEditingVia(false); return; }
    setSavingVia(true); setViaError('');
    const result = await authFetch(`/route-prices/${route.id}/via`, {
      method: 'PATCH',
      body: JSON.stringify({ via: next }),
    });
    setSavingVia(false);
    if (!result) {
      setViaError('Failed to update via. Another route may already use this via point for the same corridor.');
      return;
    }
    onUpdateVia(next);
    setEditingVia(false);
  };

  return (
    <Modal open onClose={onClose} title="Route Details" maxWidth={560}>
      <div className="space-y-5">
          {/* Route card */}
          <div
            className="rounded-md p-5 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, var(--blue) 0%, #1E3A8A 100%)' }}
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full border-2 border-white" />
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full border border-white" />
            </div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={14} className="text-white/70" />
                <span className="text-xs text-white/70 font-mono">{route.corridorKey}</span>
                <span
                  className="ml-auto inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md"
                  style={route.isActive
                    ? { background: 'rgba(255,255,255,0.2)', color: 'white' }
                    : { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }
                  }
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: route.isActive ? '#60A5FA' : '#94a3b8' }} />
                  {route.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1">
                  <p className="text-xs text-white/60 mb-0.5 font-[var(--font-body)]">From</p>
                  <p className="text-base font-bold text-white font-[var(--font-body)]">{route.origin}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <ArrowRight size={16} className="text-white" />
                </div>
                <div className="flex-1 text-right">
                  <p className="text-xs text-white/60 mb-0.5 font-[var(--font-body)]">To</p>
                  <p className="text-base font-bold text-white font-[var(--font-body)]">{route.destination}</p>
                </div>
              </div>

              <div className="flex items-end gap-3">
                <div>
                  <p className="text-xs text-white/60 mb-0.5 font-[var(--font-body)]">Current price</p>
                  <p className="text-2xl font-bold text-white font-[var(--font-body)]">{FRW(route.currentPrice)}</p>
                </div>
                {delta !== null && (
                  <div className="mb-1">
                    <DeltaBadge delta={delta} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Meta */}
          <div className="bg-[var(--bg)] rounded-md p-4 border border-[var(--border)] grid grid-cols-2 gap-4">
            {[
              { label: 'Agency', value: route.agency?.name || '—' },
              { label: 'Price changes', value: String(history.length) },
              { label: 'Created', value: new Date(route.createdAt).toLocaleDateString() },
              { label: 'Last updated', value: timeAgo(route.updatedAt) },
              { label: 'Route ID', value: route.id.slice(0, 8) + '...' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-[var(--text-muted)] mb-0.5 font-[var(--font-body)]">{label}</p>
                <p className="text-sm font-semibold text-[var(--text)] font-[var(--font-body)]">{value}</p>
              </div>
            ))}
          </div>

          {/* Via point */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-[var(--text-sub)] uppercase tracking-wide font-[var(--font-body)]">
                Via point
              </p>
              <button
                onClick={editingVia ? () => setEditingVia(false) : startEditVia}
                className="text-xs font-semibold text-[var(--blue)] hover:underline flex items-center gap-1 font-[var(--font-body)]"
              >
                {editingVia ? <><X size={12} /> Cancel</> : <><Edit3 size={12} /> {route.via ? 'Edit via' : 'Add via'}</>}
              </button>
            </div>

            {editingVia ? (
              <div className="space-y-2">
                <input
                  autoFocus
                  value={viaValue}
                  onChange={e => setViaValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveVia(); }}
                  placeholder="e.g. Kagitumba"
                  className="w-full border border-[var(--border)] rounded-md px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/15 transition-all font-[var(--font-body)]"
                />
                {viaError && (
                  <p className="flex items-center gap-1.5 text-xs text-[var(--error)] font-[var(--font-body)]">
                    <AlertCircle size={12} className="flex-shrink-0" /> {viaError}
                  </p>
                )}
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setEditingVia(false)}
                    className="px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border)] text-[var(--text-sub)] hover:bg-[var(--bg)] transition-colors font-[var(--font-body)]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveVia}
                    disabled={savingVia}
                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-[var(--blue)] text-white hover:bg-[var(--blue-dark)] flex items-center gap-1.5 disabled:opacity-50 transition-colors font-[var(--font-body)]"
                  >
                    {savingVia ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    {savingVia ? 'Saving...' : 'Save via'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-white rounded-md border border-[var(--border)] px-3 py-2.5">
                <MapPin size={14} className="text-[var(--blue)] shrink-0" />
                <span className="text-sm font-medium text-[var(--text)] font-[var(--font-body)]">
                  {route.via ? route.via : 'No via point — direct route'}
                </span>
              </div>
            )}
            <p className="text-[11px] text-[var(--text-muted)] mt-1.5 font-[var(--font-body)]">
              Adding another via to the same corridor creates a distinct route with the same origin, destination and agency but a different via point.
            </p>
          </div>

          {/* Price history */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-[var(--text-sub)] uppercase tracking-wide font-[var(--font-body)]">Price History</p>
              {loadingHistory && <Loader2 size={12} className="animate-spin text-[var(--text-muted)]" />}
            </div>

            {!loadingHistory && history.length === 0 ? (
              <div className="text-center py-6 bg-[var(--bg)] rounded-md border border-[var(--border)]">
                <History size={20} className="mx-auto mb-2 text-[var(--text-muted)]" />
                <p className="text-xs text-[var(--text-muted)] font-[var(--font-body)]">No price changes yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...history].reverse().map((entry, i) => {
                  const up = entry.newPrice > entry.oldPrice;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="bg-white rounded-md border border-[var(--border)] p-3"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={up ? { background: 'var(--error-bg)' } : { background: 'rgba(29, 78, 216,0.12)' }}
                        >
                          {up
                            ? <TrendingUp size={13} className="text-[var(--error)]" />
                            : <TrendingDown size={13} className="text-[var(--blue)]" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs text-[var(--text-sub)] line-through">{FRW(entry.oldPrice)}</span>
                            <ArrowRight size={10} className="text-[var(--text-muted)] flex-shrink-0" />
                            <span className="text-sm font-bold text-[var(--text)]">{FRW(entry.newPrice)}</span>
                            <DeltaBadge delta={entry.newPrice - entry.oldPrice} />
                          </div>
                          {entry.reason && (
                            <p className="text-xs text-[var(--text-muted)] mt-0.5 italic font-[var(--font-body)]">&ldquo;{entry.reason}&rdquo;</p>
                          )}
                          <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1 font-[var(--font-body)]">
                            <Clock size={10} />
                            {new Date(entry.changedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          {route.isActive && (
            <div className="pt-2 space-y-2">
              <button onClick={onUpdatePrice}
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium bg-[var(--blue)]/5 hover:bg-[var(--blue)]/10 text-[var(--blue)] transition-colors border border-[var(--blue)]/20 font-[var(--font-body)]">
                <Edit3 size={14} /> Update Price
              </button>
              <button onClick={onDeactivate}
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium bg-[#F9FAFB] hover:bg-[#F9FAFB] text-[var(--text-sub)] transition-colors border border-[var(--border)] font-[var(--font-body)]">
                <Power size={14} /> Deactivate Route
              </button>
              <button onClick={onDelete}
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium bg-red-50 hover:bg-red-100 text-red-600 transition-colors border border-red-200 font-[var(--font-body)]">
                <Trash2 size={14} /> Delete Route
              </button>
            </div>
          )}
      </div>
    </Modal>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function RoutePricesPage() {
  const { authFetch } = useAuth();
  const [routes, setRoutes] = useState<RoutePrice[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'' | 'true' | 'false'>('');
  const [page, setPage] = useState(1);

  const [showAdd, setShowAdd] = useState(false);
  const [updateTarget, setUpdateTarget] = useState<RoutePrice | null>(null);
  const [drawerRoute, setDrawerRoute] = useState<RoutePrice | null>(null);
  const [drawerShowHistory, setDrawerShowHistory] = useState(false);
  void drawerShowHistory;

  // Stats derived from loaded page
  const activeCount  = routes.filter(r => r.isActive).length;
  const avgPrice     = routes.length ? Math.round(routes.reduce((s, r) => s + r.currentPrice, 0) / routes.length) : 0;
  const maxPrice     = routes.length ? Math.max(...routes.map(r => r.currentPrice)) : 0;
  const minPrice     = routes.length ? Math.min(...routes.map(r => r.currentPrice)) : 0;

  const fetchRoutes = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (activeFilter !== '') params.set('isActive', activeFilter);
    if (search) params.set('search', search);
    const data = await authFetch(`/route-prices?${params}`);
    if (data) {
      setRoutes(data.data ?? data.routes ?? (Array.isArray(data) ? data : []));
      if (data.pagination) setPagination(data.pagination);
    }
    setLoading(false);
  };

  useEffect(() => { fetchRoutes(); }, [page, activeFilter]);
  useEffect(() => { const t = setTimeout(fetchRoutes, 380); return () => clearTimeout(t); }, [search]);

  const deactivateRoute = async (route: RoutePrice) => {
    await authFetch(`/route-prices/${route.id}/deactivate`, { method: 'PATCH' });
    fetchRoutes();
  };

  const deleteRoute = async (route: RoutePrice) => {
    if (!window.confirm(`Delete route "${route.origin} → ${route.destination}"? This cannot be undone.`)) return;
    await authFetch(`/route-prices/${route.id}`, { method: 'DELETE' });
    setDrawerRoute(null);
    fetchRoutes();
  };

  return (
    <div className="space-y-5 font-[var(--font-body)]">
      {/* Page header */}
      <PageHeader
        title="Route Prices"
        subtitle={`${pagination.total} routes · fare management`}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => { setPage(1); fetchRoutes(); }}
              className="p-2 rounded-md border border-[var(--border)] hover:bg-[var(--blue-light)] text-[var(--text-muted)] transition-colors" title="Refresh">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <Button variant="primary" size="sm" onClick={() => setShowAdd(true)}>
              <Plus size={15} /> Add Route
            </Button>
          </div>
        }
      />

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Routes" value={pagination.total} icon={<MapPin size={14} />} />
        <StatCard label="Active" value={activeCount} icon={<Check size={14} />} />
        <StatCard label="Avg. Fare" value={avgPrice ? FRW(avgPrice) : '—'} icon={<DollarSign size={14} />} />
        <StatCard label="Price Range" value={routes.length ? `${FRW(minPrice)} – ${FRW(maxPrice)}` : '—'} icon={<TrendingUp size={14} />} />
      </div>

      {/* Status filter chips */}
      <div className="flex items-center gap-2">
        {([
          { value: '' as const,      label: 'All routes' },
          { value: 'true' as const,  label: 'Active' },
          { value: 'false' as const, label: 'Inactive' },
        ] as const).map(opt => (
          <button
            key={opt.value}
            onClick={() => { setActiveFilter(opt.value); setPage(1); }}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border transition-all font-[var(--font-body)]"
            style={activeFilter === opt.value
              ? { background: 'var(--blue)', color: 'white', borderColor: 'var(--blue)' }
              : { background: 'white', color: 'var(--text-sub)', borderColor: 'var(--border)' }
            }
          >
            {opt.value === 'true' && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
            {opt.value === 'false' && <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />}
            {opt.label}
            {opt.value === '' && (
              <span className={`text-xs px-1 rounded font-bold ${activeFilter === '' ? 'text-white/70' : 'text-[var(--text-muted)]'}`}>
                {pagination.total}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-[var(--border)] rounded-md focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/15 transition-all bg-white placeholder:text-[var(--text-muted)] font-[var(--font-body)]"
          placeholder="Search origin, destination, corridor..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-md border border-[var(--border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--bg)] border-b border-[var(--border)]">
              {['Agency', 'Route', 'Corridor Key', 'Current Price', 'Last Change', 'Changes', 'Status', 'Updated', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-[var(--text-sub)] uppercase tracking-wider whitespace-nowrap font-[var(--font-body)]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {loading ? (
              Array.from({ length: 7 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j} className="px-4 py-3.5">
                      <div className={`h-4 bg-[var(--border)] rounded animate-pulse ${j === 0 ? 'w-40' : j === 2 ? 'w-24' : 'w-16'}`} />
                    </td>
                  ))}
                </tr>
              ))
            ) : routes.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-16 text-center">
                  <MapPin size={28} className="mx-auto mb-3 text-[var(--text-muted)]" />
                  <p className="text-sm text-[var(--text-sub)] font-[var(--font-body)]">No routes found</p>
                  {search && (
                    <button onClick={() => setSearch('')} className="mt-2 text-xs text-[var(--blue)] hover:underline font-[var(--font-body)]">
                      Clear search
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              routes.map((route, i) => {
                const delta = priceDelta(route.priceHistory);
                const lastEntry = route.priceHistory.length > 0
                  ? route.priceHistory[route.priceHistory.length - 1]
                  : null;

                return (
                  <motion.tr
                    key={route.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.02 * i }}
                    className="hover:bg-[var(--blue-light)]/50 transition-colors cursor-pointer group"
                    onClick={() => setDrawerRoute(route)}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-md bg-[var(--blue)]/8 flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--blue)]/15 transition-colors">
                          <ArrowRight size={13} className="text-[var(--blue)]" />
                        </div>
                        <RouteChip origin={route.origin} destination={route.destination} via={route.via} />
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center text-xs font-semibold bg-[var(--bg)] text-[var(--text)] px-2.5 py-1 rounded-md border border-[var(--border)] whitespace-nowrap">
                        {route.agency?.name || '—'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs bg-[var(--bg)] text-[var(--text-sub)] px-2 py-1 rounded-md">
                        {route.corridorKey}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[var(--text)] font-[var(--font-body)]">{FRW(route.currentPrice)}</span>
                        {delta !== null && <DeltaBadge delta={delta} />}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      {lastEntry ? (
                        <div className="text-xs text-[var(--text-sub)]">
                          <div className="flex items-center gap-1">
                            <span className="line-through text-[var(--text-muted)]">{FRW(lastEntry.oldPrice)}</span>
                            <ArrowRight size={9} className="text-[var(--text-muted)]" />
                            <span>{FRW(lastEntry.newPrice)}</span>
                          </div>
                          {lastEntry.reason && (
                            <p className="text-[var(--text-muted)] mt-0.5 truncate max-w-[140px] italic font-[var(--font-body)]">
                              &ldquo;{lastEntry.reason}&rdquo;
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-[var(--text-muted)] text-xs">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <History size={11} className="text-[var(--text-muted)]" />
                        <span className="text-sm text-[var(--text-sub)] font-medium">{route.priceHistory.length}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md"
                        style={route.isActive
                          ? { background: 'rgba(29, 78, 216,0.12)', color: 'var(--blue)' }
                          : { background: 'var(--bg)', color: 'var(--text-sub)' }
                        }
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: route.isActive ? 'var(--blue)' : '#94a3b8' }} />
                        {route.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-[var(--text-muted)] whitespace-nowrap">
                      <div className="flex items-center gap-1 font-[var(--font-body)]">
                        <Clock size={10} />
                        {timeAgo(route.updatedAt)}
                      </div>
                    </td>

                    <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                      <RowMenu
                        route={route}
                        onView={() => setDrawerRoute(route)}
                        onUpdatePrice={() => setUpdateTarget(route)}
                        onHistory={() => { setDrawerRoute(route); setDrawerShowHistory(true); }}
                        onDeactivate={() => deactivateRoute(route)}
                        onDelete={() => deleteRoute(route)}
                      />
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)] bg-[var(--bg)]/50">
            <p className="text-xs text-[var(--text-muted)] font-[var(--font-body)]">
              Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-xs rounded-md border border-[var(--border)] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-[var(--font-body)]">
                Previous
              </button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(pagination.totalPages - 4, page - 2)) + i;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className="w-8 h-7 text-xs rounded-md border transition-colors font-[var(--font-body)]"
                    style={p === page
                      ? { background: 'var(--blue)', color: 'white', borderColor: 'var(--blue)' }
                      : { background: 'white', color: 'var(--text-sub)', borderColor: 'var(--border)' }
                    }>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}
                className="px-3 py-1.5 text-xs rounded-md border border-[var(--border)] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-[var(--font-body)]">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals + Drawers */}
      <AnimatePresence>
        {showAdd && (
          <AddRouteModal key="add" authFetch={authFetch} onClose={() => setShowAdd(false)} onSave={() => { fetchRoutes(); setShowAdd(false); }} />
        )}
        {updateTarget && (
          <UpdatePriceModal
            key={updateTarget.id}
            authFetch={authFetch}
            route={updateTarget}
            onClose={() => setUpdateTarget(null)}
            onSave={() => { fetchRoutes(); setUpdateTarget(null); }}
          />
        )}
        {drawerRoute && (
          <RouteDrawer
            key={drawerRoute.id}
            authFetch={authFetch}
            route={drawerRoute}
            onClose={() => { setDrawerRoute(null); setDrawerShowHistory(false); }}
            onUpdatePrice={() => { setDrawerRoute(null); setUpdateTarget(drawerRoute); }}
            onUpdateVia={(via) => {
              setDrawerRoute(prev => prev && prev.id === drawerRoute.id ? { ...prev, via: via || '' } : prev);
              fetchRoutes();
            }}
            onDeactivate={() => { deactivateRoute(drawerRoute); setDrawerRoute(null); }}
            onDelete={() => deleteRoute(drawerRoute)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
