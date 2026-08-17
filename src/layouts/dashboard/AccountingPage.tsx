import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, Percent, Save, Loader,
  Building2, Ticket, Award, Wallet, Phone, Send, RefreshCw, History,
} from 'lucide-react';
import { api } from '../../api';
import { PageHeader, StatCard } from '../../components/ui';

const SETTINGS = [
  {
    key: 'system_fee_percentage',
    label: 'System Fee (per seat)',
    description: 'Flat fee in RWF added to each seat price. The full route price goes to the agency.',
    icon: Percent,
    type: 'number' as const,
  },
  {
    key: 'free_ticket_enabled',
    label: 'Free Ticket Rewards',
    description: 'Enable automatic free ticket rewards for frequent travelers',
    icon: Ticket,
    type: 'boolean' as const,
  },
  {
    key: 'free_ticket_threshold',
    label: 'Free Ticket Threshold',
    description: 'Number of paid bookings needed to earn one free ticket',
    icon: Award,
    type: 'number' as const,
  },
];

const BATCH_STATUS: Record<string, { label: string; color: string }> = {
  submitted: { label: 'Submitted', color: '#D97706' },
  completed: { label: 'Completed', color: '#1E40AF' },
  failed: { label: 'Failed', color: '#DC2626' },
  skipped: { label: 'Skipped', color: '#9CA3AF' },
};

interface PayoutSummary {
  config?: { phone?: string; method?: string };
  walletBalance?: number | null;
  pending?: { total?: number; count?: number };
  payoutFeePerPayout?: number;
  feeEconomics?: {
    systemFees?: number;
    depositFees?: number;
    netSystemFees?: number;
  };
  batchFeesPaid?: number;
  recentBatches?: Array<{
    batchId: string;
    totalAmount: number;
    bookingCount: number;
    phoneNumber: string;
    status: string;
    balanceBefore?: number;
    balanceAfter?: number;
    measuredFee?: number;
    error?: string;
    createdAt: string;
  }>;
}

export default function AccountingPage() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [totals, setTotals] = useState({ totalAgencies: 0, totalBookings: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [payout, setPayout] = useState<PayoutSummary>({});
  const [payoutPhone, setPayoutPhone] = useState('');
  const [payoutSaving, setPayoutSaving] = useState(false);
  const [payoutSaved, setPayoutSaved] = useState(false);
  const [payoutRunning, setPayoutRunning] = useState(false);
  const [payoutError, setPayoutError] = useState('');
  const [payoutNotice, setPayoutNotice] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsRes, analyticsRes, payoutRes] = await Promise.all([
        api.getSettings(),
        api.getSystemAnalytics(),
        api.getPayoutSummary(),
      ]);
      setSettings(settingsRes.data?.settings || {});
      const overview = analyticsRes.data?.overview || {};
      setTotals({ totalAgencies: overview.totalAgencies ?? 0, totalBookings: overview.totalBookings ?? 0 });
      setPayout(payoutRes.data || {});
      setPayoutPhone(payoutRes.data?.config?.phone || '');
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api.updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePayoutPhoneSave = async () => {
    setPayoutSaving(true);
    setPayoutError('');
    setPayoutSaved(false);
    try {
      const res = await api.updatePayoutPhone(payoutPhone, 'mom');
      setPayout(res.data);
      setPayoutSaved(true);
      setTimeout(() => setPayoutSaved(false), 3000);
    } catch (err: any) {
      setPayoutError(err.message || 'Failed to save payout settings');
    } finally {
      setPayoutSaving(false);
    }
  };

  const handleRunPayout = async () => {
    setPayoutRunning(true);
    setPayoutError('');
    setPayoutNotice('');
    try {
      const res = await api.runPayoutNow();
      const data = res.data || {};
      if (data.ran) {
        setPayoutNotice(`Batch dispatched: ${data.totalAmount} RWF for ${data.bookingCount} booking(s) → ${payoutPhone || 'configured phone'}`);
      } else {
        setPayoutNotice(data.reason || 'Nothing to pay out');
      }
      await loadData();
    } catch (err: any) {
      setPayoutError(err.message || 'Payout run failed');
    } finally {
      setPayoutRunning(false);
    }
  };

  const pendingTotal = payout.pending?.total || 0;
  const pendingCount = payout.pending?.count || 0;
  const economics = payout.feeEconomics || {};
  const netSystem = (economics.netSystemFees ?? 0) - (payout.batchFeesPaid ?? 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Accounting & Settings"
        subtitle="Configure platform-wide fees, rewards, and view financial summaries"
        actions={
          <button onClick={handleSave} disabled={saving}
            className="h-9 px-4 rounded-md border border-[var(--border)] text-sm font-medium flex items-center gap-2 cursor-pointer bg-[#F9FAFB] hover:bg-[#F3F4F6] disabled:opacity-50 transition-all text-zinc-700"
          >
            {saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
            Save All
          </button>
        }
      />

      {saved && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-md" style={{ background: '#1E40AF' }}
        >
          <p className="text-xs font-medium" style={{ color: '#FFFFFF' }}>All settings saved successfully</p>
        </motion.div>
      )}
      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-md" style={{ background: '#FEE2E2', border: '1px solid #FCA5A5' }}>
          <p className="text-xs font-medium" style={{ color: '#DC2626' }}>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {SETTINGS.map(meta => {
          const Icon = meta.icon;
          const value = settings[meta.key];
          return (
            <motion.div key={meta.key} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-md border border-[var(--border)] p-5"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-md bg-[var(--blue-light)] flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-[var(--blue)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-[var(--text)]">{meta.label}</h3>
                  <p className="text-xs text-[var(--text-sub)] mt-0.5">{meta.description}</p>
                </div>
              </div>

              {meta.type === 'number' ? (
                <input type="number" min={0}
                  value={value ?? ''}
                  onChange={e => handleChange(meta.key, Number(e.target.value))}
                  className="w-full h-10 px-4 rounded-md border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400/40 focus:border-zinc-400"
                />
              ) : (
                <div className="flex items-center gap-3">
                  <button onClick={() => handleChange(meta.key, true)}
                    className={`flex-1 h-10 rounded-md text-xs font-medium transition-all cursor-pointer border ${
                      value === true ? 'bg-[var(--blue)] text-white border-[var(--blue)]' : 'bg-white text-[var(--text-sub)] border-[var(--border)] hover:border-zinc-300'
                    }`}
                  >Enabled</button>
                  <button onClick={() => handleChange(meta.key, false)}
                    className={`flex-1 h-10 rounded-md text-xs font-medium transition-all cursor-pointer border ${
                      value === false ? 'bg-[#F3F4F6] text-zinc-700 border-zinc-300' : 'bg-white text-[var(--text-sub)] border-[var(--border)] hover:border-zinc-300'
                    }`}
                  >Disabled</button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* ── Nightly bulk payout management ─────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-md border border-[var(--border)] p-5 space-y-5"
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-[var(--blue-light)] flex items-center justify-center">
              <Send size={18} className="text-[var(--blue)]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text)]">Nightly Bulk Payout</h3>
              <p className="text-xs text-[var(--text-sub)]">Every 00:00 CAT, all pending disbursements are paid in ONE batch to the phone below — one fee instead of one per booking.</p>
            </div>
          </div>
          <button onClick={handleRunPayout} disabled={payoutRunning || payoutSaving}
            className="h-9 px-4 rounded-md text-sm font-medium flex items-center gap-2 cursor-pointer bg-[var(--blue)] hover:opacity-90 disabled:opacity-50 transition-all text-white"
          >
            {payoutRunning ? <Loader size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Run Payout Now
          </button>
        </div>

        {payoutNotice && (
          <div className="flex items-start gap-2.5 p-3 rounded-md" style={{ background: 'var(--blue-bg)', border: '1px solid var(--blue-border)' }}>
            <p className="text-xs font-medium" style={{ color: 'var(--blue-dark)' }}>{payoutNotice}</p>
          </div>
        )}
        {payoutError && (
          <div className="flex items-start gap-2.5 p-3 rounded-md" style={{ background: '#FEE2E2', border: '1px solid #FCA5A5' }}>
            <p className="text-xs font-medium" style={{ color: '#DC2626' }}>{payoutError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5 mb-2">
              <Phone size={13} /> Payout Phone Number
            </label>
            <input
              type="tel"
              placeholder="e.g. 25078XXXXXXX"
              value={payoutPhone}
              onChange={e => setPayoutPhone(e.target.value)}
              className="w-full h-10 px-4 rounded-md border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400/40 focus:border-zinc-400"
            />
            <p className="text-xs text-[var(--text-sub)] mt-1.5">All nightly settlements are sent to this number.</p>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5 mb-2">
              <Wallet size={13} /> Mobile Money Provider
            </label>
            <div className="flex items-center gap-2">
              <div className="h-10 flex-1 px-3 rounded-md border border-[var(--border)] bg-[#F9FAFB] text-sm text-[var(--text-sub)] flex items-center">
                MTN MoMo (auto)
              </div>
              <button onClick={handlePayoutPhoneSave} disabled={payoutSaving || !payoutPhone.trim()}
                className="h-10 px-4 rounded-md text-sm font-medium flex items-center gap-2 cursor-pointer bg-[var(--blue)] hover:opacity-90 disabled:opacity-50 transition-all text-white"
              >
                {payoutSaving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
                Save
              </button>
            </div>
            <p className="text-xs text-[var(--text-sub)] mt-1.5">Both MTN and Airtel payouts are sent via the same MoMo provider — no operator selection needed.</p>
            {payoutSaved && <p className="text-xs font-medium mt-1.5" style={{ color: '#1E40AF' }}>Payout settings saved</p>}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard label="Wallet Balance" value={payout.walletBalance != null ? `${payout.walletBalance.toLocaleString()} RWF` : '—'} sub="pawaPay wallet (RWA)" icon={<Wallet size={16} />} loading={loading} />
        <StatCard label="Pending Disbursement" value={pendingTotal > 0 ? `${pendingTotal.toLocaleString()} RWF` : '0 RWF'} sub={`${pendingCount} booking(s) awaiting nightly batch`} icon={<Send size={16} />} loading={loading} />
        <StatCard label="Net System Income" value={netSystem > 0 ? `${netSystem.toLocaleString()} RWF` : '0 RWF'} sub={`${payout.batchFeesPaid ?? 0} RWF total measured batch fees (one per day, not per booking)`} icon={<DollarSign size={16} />} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <StatCard label="Fee per Seat" value={settings.system_fee_percentage ? `${settings.system_fee_percentage} RWF` : '0 RWF'} sub="Added to each seat" icon={<Percent size={16} />} loading={loading} />
        <StatCard label="Active Agencies" value={totals.totalAgencies.toLocaleString()} sub="Receiving disbursements" icon={<Building2 size={16} />} loading={loading} />
        <StatCard label="Total Bookings" value={totals.totalBookings.toLocaleString()} sub="Fee applicable" icon={<Ticket size={16} />} loading={loading} />
      </div>

      <div className="bg-white rounded-md border border-[var(--border)] p-5">
        <div className="flex items-center gap-2 mb-4">
          <History size={16} className="text-[var(--blue)]" />
          <h4 className="text-sm font-bold text-[var(--text)]">Recent Payout Batches</h4>
        </div>
        {(payout.recentBatches?.length ?? 0) === 0 ? (
          <p className="text-sm text-[var(--text-sub)]">No payout batches yet. Runs nightly at 00:00 CAT.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-zinc-500 border-b border-[var(--border)]">
                  <th className="py-2 pr-3 font-semibold">Date</th>
                  <th className="py-2 pr-3 font-semibold">Batch</th>
                  <th className="py-2 pr-3 font-semibold">Bookings</th>
                  <th className="py-2 pr-3 font-semibold">Amount</th>
                  <th className="py-2 pr-3 font-semibold">Phone</th>
                  <th className="py-2 pr-3 font-semibold">Balance Before → After</th>
                  <th className="py-2 pr-3 font-semibold">Fee</th>
                  <th className="py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {(payout.recentBatches || []).map(b => {
                  const st = BATCH_STATUS[b.status] || { label: b.status, color: '#6B7280' };
                  return (
                    <tr key={b.batchId} className="border-b border-[var(--border)] last:border-0">
                      <td className="py-2.5 pr-3 text-[var(--text-sub)]">{new Date(b.createdAt).toLocaleString()}</td>
                      <td className="py-2.5 pr-3 font-mono text-xs">{b.batchId.slice(0, 8)}…</td>
                      <td className="py-2.5 pr-3">{b.bookingCount}</td>
                      <td className="py-2.5 pr-3 font-medium">{b.totalAmount.toLocaleString()} RWF</td>
                      <td className="py-2.5 pr-3">{b.phoneNumber}</td>
                      <td className="py-2.5 pr-3 text-[var(--text-sub)]">
                        {b.balanceBefore != null ? `${b.balanceBefore.toLocaleString()}` : '—'}{b.balanceAfter != null ? ` → ${b.balanceAfter.toLocaleString()}` : ''}
                      </td>
                      <td className="py-2.5 pr-3 text-[var(--text-sub)]">{b.measuredFee != null ? `${b.measuredFee.toLocaleString()} RWF` : '—'}</td>
                      <td className="py-2.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ color: st.color, background: `${st.color}1A` }}>
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-[#F9FAFB] border border-[var(--border)] rounded-md p-5">
        <h4 className="text-sm font-bold text-[var(--text)] mb-2">How it works</h4>
        <ul className="text-sm text-[var(--text-sub)] space-y-1 list-disc pl-5">
          <li>A flat system fee is added per seat on top of the route price.</li>
          <li>Fee = Flat Fee per Seat × Number of Seats</li>
          <li>The agency receives the full route price for each booking.</li>
          <li>The system collects the fee as a service charge from the passenger.</li>
          <li>Instead of paying out after every booking, funds are held as <b>pending disbursement</b> and paid in ONE nightly batch (00:00 CAT) to the configured phone — a single payout fee per day instead of one per booking.</li>
        </ul>
      </div>
    </div>
  );
}
