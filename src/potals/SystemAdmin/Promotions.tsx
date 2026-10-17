import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BadgePercent, Search, RefreshCw, Check, X, Loader2,
  ArrowRight, Calendar, TrendingDown, Tag,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../api';
import { PageHeader, Button, StatCard, Modal, EmptyState } from '../../components/ui';
import { viaLabel } from '../../utils/via';

interface RoutePrice {
  id: string;
  agency?: { id: string; name: string } | null;
  origin: string;
  destination: string;
  via?: string;
  currentPrice: number;
  originalPrice: number | null;
  promotionActive: boolean;
  promotionEndsAt: string | null;
  promotionLabel?: string;
  isActive: boolean;
}

const RWF = (n: number) =>
  new Intl.NumberFormat('rw-RW', { style: 'decimal', minimumFractionDigits: 0 }).format(n) + ' RWF';

function discountPct(route: RoutePrice): number {
  if (!route.promotionActive || !route.originalPrice) return 0;
  return Math.round(((route.originalPrice - route.currentPrice) / route.originalPrice) * 100);
}

function endsIn(iso: string | null): string | null {
  if (!iso) return null;
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return 'Expired';
  if (days === 0) return 'Ends today';
  if (days === 1) return 'Ends tomorrow';
  return `Ends in ${days} days`;
}

export default function PromotionsPage() {
  const { t } = useTranslation();
  const [routes, setRoutes] = useState<RoutePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'' | 'on' | 'off'>('');
  const [target, setTarget] = useState<RoutePrice | null>(null);
  const [form, setForm] = useState({ promotionPrice: '', promotionEndsAt: '', promotionLabel: '' });
  const [error, setError] = useState('');

  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getRoutePrices({ page: '1', limit: '100', isActive: 'true' });
      setRoutes(data.data ?? []);
    } catch {
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoutes(); }, [fetchRoutes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return routes.filter((r) => {
      if (filter === 'on' && !r.promotionActive) return false;
      if (filter === 'off' && r.promotionActive) return false;
      if (!q) return true;
      return (
        (r.agency?.name || '').toLowerCase().includes(q) ||
        r.origin.toLowerCase().includes(q) ||
        r.destination.toLowerCase().includes(q) ||
        (r.via || '').toLowerCase().includes(q)
      );
    });
  }, [routes, search, filter]);

  const onPromoCount = routes.filter((r) => r.promotionActive).length;
  const avgDiscount = onPromoCount
    ? Math.round(routes.filter((r) => r.promotionActive).reduce((s, r) => s + discountPct(r), 0) / onPromoCount)
    : 0;
  const expiringSoon = routes.filter((r) => {
    if (!r.promotionActive || !r.promotionEndsAt) return false;
    const days = (new Date(r.promotionEndsAt).getTime() - Date.now()) / 86_400_000;
    return days >= 0 && days <= 3;
  }).length;

  const openPromotion = (route: RoutePrice) => {
    setTarget(route);
    setError('');
    const base = route.promotionActive && route.originalPrice ? route.originalPrice : route.currentPrice;
    const suggested = Math.max(1, Math.round(base * 0.85));
    setForm({
      promotionPrice: route.promotionActive ? String(route.currentPrice) : String(suggested),
      promotionEndsAt: route.promotionEndsAt ? route.promotionEndsAt.slice(0, 10) : '',
      promotionLabel: route.promotionLabel || '',
    });
  };

  const submitPromotion = async () => {
    if (!target) return;
    const price = Number(form.promotionPrice);
    const base = target.promotionActive && target.originalPrice ? target.originalPrice : target.currentPrice;
    if (!price || price <= 0) { setError('Enter a valid promotion price'); return; }
    if (price >= base) { setError(`Promotion price must be lower than ${RWF(base)}`); return; }
    setSaving(true); setError('');
    try {
      await api.setPromotion(target.id, {
        promotionPrice: price,
        promotionEndsAt: form.promotionEndsAt || undefined,
        promotionLabel: form.promotionLabel || undefined,
      });
      setTarget(null);
      await fetchRoutes();
    } catch (err: any) {
      setError(err.message || 'Could not save the promotion');
    } finally {
      setSaving(false);
    }
  };

  const endPromotion = async (route: RoutePrice) => {
    if (!window.confirm(`End the promotion on "${route.origin} → ${route.destination}"? The price returns to ${route.originalPrice ? RWF(route.originalPrice) : 'its original fare'}.`)) return;
    try {
      await api.clearPromotion(route.id);
      await fetchRoutes();
    } catch {
      /* list refresh below conveys failure by leaving the row */
    }
  };

  const baseOf = (r: RoutePrice) => (r.promotionActive && r.originalPrice ? r.originalPrice : r.currentPrice);

  return (
    <div className="space-y-5 font-[var(--font-body)]">
      <PageHeader
        title={t('promotions.title')}
        subtitle={t('promotions.subtitle')}
        actions={
          <button
            onClick={fetchRoutes}
            className="p-2 rounded-md border border-[var(--studio-border)] hover:bg-[var(--studio-muted-fill)] text-[var(--studio-text-muted)] transition-colors"
            title={t('common.refresh') || 'Refresh'}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label={t('promotions.statRoutes')} value={routes.length} icon={<Tag size={14} />} />
        <StatCard label={t('promotions.statActive')} value={onPromoCount} icon={<BadgePercent size={14} />} />
        <StatCard label={t('promotions.statAvgDiscount')} value={onPromoCount ? `${avgDiscount}%` : '—'} icon={<TrendingDown size={14} />} />
        <StatCard label={t('promotions.statExpiring')} value={expiringSoon} icon={<Calendar size={14} />} />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--studio-text-muted)] pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('promotions.searchPlaceholder')}
            className="w-full h-11 rounded-md border border-[var(--studio-border)] bg-[var(--studio-surface)] pl-10 pr-4 text-sm text-[var(--studio-text)] outline-none focus:border-[var(--studio-accent)]"
          />
        </div>
        <div className="flex items-center gap-2">
          {([
            { value: '' as const, label: t('promotions.filterAll') },
            { value: 'on' as const, label: t('promotions.filterOn') },
            { value: 'off' as const, label: t('promotions.filterOff') },
          ]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-md border transition-all"
              style={filter === opt.value
                ? { background: 'var(--studio-accent)', color: 'white', borderColor: 'var(--studio-accent)' }
                : { background: 'var(--studio-surface)', color: 'var(--studio-text-sub)', borderColor: 'var(--studio-border)' }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={22} className="animate-spin text-[var(--studio-accent)]" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={BadgePercent} title={t('promotions.empty')} svgAlt={t('promotions.empty')} />
      ) : (
        <div className="space-y-2">
          {filtered.map((route, i) => {
            const pct = discountPct(route);
            const ends = endsIn(route.promotionEndsAt);
            return (
              <motion.div
                key={route.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: Math.min(i * 0.015, 0.2) }}
                className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-md border bg-[var(--studio-surface)]"
                style={{ borderColor: route.promotionActive ? 'rgba(245,158,11,0.4)' : 'var(--studio-border)' }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 font-medium text-sm text-[var(--studio-text)]">
                    <span className="font-semibold">{route.origin}</span>
                    <ArrowRight size={13} className="text-[var(--studio-accent)] flex-shrink-0" />
                    <span className="font-semibold">{route.destination}</span>
                    {route.via && <span className="text-[var(--studio-text-muted)] font-normal">{viaLabel(route.via)}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-[var(--studio-text-muted)]">{route.agency?.name || t('promotions.unknownAgency')}</span>
                    {route.promotionActive && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(245,158,11,0.15)', color: '#B45309' }}
                      >
                        <BadgePercent size={9} /> -{pct}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right leading-tight">
                    {route.promotionActive && route.originalPrice && (
                      <div className="text-[11px] font-medium text-red-500 line-through">{RWF(route.originalPrice)}</div>
                    )}
                    <div className={`text-sm font-bold ${route.promotionActive ? 'text-red-600' : 'text-[var(--studio-text)]'}`}>
                      {RWF(route.currentPrice)}
                    </div>
                    {route.promotionActive && ends && (
                      <div className="text-[10px] font-semibold text-amber-600">{ends}</div>
                    )}
                  </div>

                  {route.promotionActive ? (
                    <Button variant="secondary" size="sm" onClick={() => endPromotion(route)}>
                      <X size={13} /> {t('promotions.end')}
                    </Button>
                  ) : (
                    <Button variant="primary" size="sm" onClick={() => openPromotion(route)}>
                      <BadgePercent size={13} /> {t('promotions.set')}
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal
        open={!!target}
        onClose={() => setTarget(null)}
        title={t('promotions.modalTitle')}
        subtitle={target ? `${target.origin} → ${target.destination}${viaLabel(target.via)}` : ''}
        maxWidth={520}
      >
        {target && (
          <div className="pt-4 space-y-4">
            <div className="flex items-center justify-between p-3 rounded-md bg-[var(--studio-muted-fill)]">
              <span className="text-sm text-[var(--studio-text-sub)]">{t('promotions.currentPrice')}</span>
              <span className="text-sm font-semibold text-[var(--studio-text)]">{RWF(baseOf(target))}</span>
            </div>

            <div>
              <label className="text-sm font-medium text-[var(--studio-text-sub)] block mb-1.5">{t('promotions.promoPrice')}</label>
              <input
                type="number"
                min={1}
                value={form.promotionPrice}
                onChange={(e) => setForm({ ...form, promotionPrice: e.target.value })}
                className="w-full h-11 px-4 rounded-md border border-[var(--studio-border)] text-sm outline-none focus:border-[var(--studio-accent)]"
                placeholder="0"
              />
              {form.promotionPrice && Number(form.promotionPrice) < baseOf(target) && (
                <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                  <BadgePercent size={11} />
                  {t('promotions.discountPreview', {
                    pct: Math.round(((baseOf(target) - Number(form.promotionPrice)) / baseOf(target)) * 100),
                  })}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-[var(--studio-text-sub)] block mb-1.5">{t('promotions.endsAt')}</label>
              <input
                type="date"
                value={form.promotionEndsAt}
                onChange={(e) => setForm({ ...form, promotionEndsAt: e.target.value })}
                className="w-full h-11 px-4 rounded-md border border-[var(--studio-border)] text-sm outline-none focus:border-[var(--studio-accent)]"
              />
              <p className="text-xs text-[var(--studio-text-muted)] mt-1">{t('promotions.endsAtHint')}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-[var(--studio-text-sub)] block mb-1.5">{t('promotions.label')}</label>
              <input
                value={form.promotionLabel}
                onChange={(e) => setForm({ ...form, promotionLabel: e.target.value })}
                className="w-full h-11 px-4 rounded-md border border-[var(--studio-border)] text-sm outline-none focus:border-[var(--studio-accent)]"
                placeholder={t('promotions.labelPlaceholder')}
              />
            </div>

            {error && (
              <div className="text-xs font-medium p-2.5 rounded-md" style={{ background: 'var(--tone-danger-fill)', color: 'var(--tone-danger-ink)' }}>
                {error}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <Button variant="primary" fullWidth loading={saving} disabled={saving} onClick={submitPromotion}>
                <Check size={15} /> {t('promotions.save')}
              </Button>
              <Button variant="secondary" onClick={() => setTarget(null)} disabled={saving}>
                {t('common.cancel') || 'Cancel'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
