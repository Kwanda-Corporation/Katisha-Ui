import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, Percent, Save, Loader,
  Building2, Ticket, Award, Wallet, Phone, Send, History,
  CheckSquare, Square, KeyRound, ShieldAlert, AlertTriangle,
} from 'lucide-react';
import { api } from '../../api';
import { PageHeader, StatCard, Modal } from '../../components/ui';

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

// `fill` is the pill background; both are tokens so the badge follows the
// scheme. A hex + alpha suffix (`${color}1A`) cannot be used here because the
// ink is a `var()` reference, so the fill is paired explicitly.
const PAYOUT_STATUS: Record<string, { label: string; color: string; fill: string }> = {
  processing: { label: 'Processing', color: 'var(--tone-accent-ink)', fill: 'var(--tone-accent-fill)' },
  submitted:  { label: 'Submitted',  color: 'var(--tone-warning-ink)', fill: 'var(--tone-warning-fill)' },
  completed:  { label: 'Completed',  color: 'var(--tone-success-ink)', fill: 'var(--tone-success-fill)' },
  failed:     { label: 'Failed',     color: 'var(--tone-danger-ink)',  fill: 'var(--tone-danger-fill)' },
  skipped:    { label: 'Skipped',    color: 'var(--tone-neutral-ink)', fill: 'var(--tone-neutral-fill)' },
};

interface PayableBooking {
  id: string;
  referenceCode: string;
  travelDate: string;
  seats: number;
  amount: number;
  agency: string | null;
  createdAt: string;
}

interface PayoutSummary {
  config?: { phone?: string; method?: string };
  payoutMode?: string;
  pinConfigured?: boolean;
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
    requestedByLabel?: string;
    balanceBefore?: number;
    balanceAfter?: number;
    measuredFee?: number;
    error?: string;
    createdAt: string;
  }>;
}

const PIN_LENGTH = 8;
const fmt = (n: number) => n.toLocaleString();

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
  const [, setPayoutSaved] = useState(false);
  const [payoutError, setPayoutError] = useState('');
  const [payoutNotice, setPayoutNotice] = useState('');

  const [payable, setPayable] = useState<PayableBooking[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [destPhone, setDestPhone] = useState('');
  const [pin, setPin] = useState('');
  const [executing, setExecuting] = useState(false);

  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinSaving, setPinSaving] = useState(false);
  const [pinError, setPinError] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsRes, analyticsRes, payoutRes, payableRes] = await Promise.all([
        api.getSettings(),
        api.getSystemAnalytics(),
        api.getPayoutSummary(),
        api.getPayableBookings(),
      ]);
      setSettings(settingsRes.data?.settings || {});
      const overview = analyticsRes.data?.overview || {};
      setTotals({ totalAgencies: overview.totalAgencies ?? 0, totalBookings: overview.totalBookings ?? 0 });
      setPayout(payoutRes.data || {});
      setPayoutPhone(payoutRes.data?.config?.phone || '');
      setDestPhone(payoutRes.data?.config?.phone || '');
      setPayable(payableRes.data?.bookings || []);

      // Drop anything that is no longer payable, so a stale selection can never
      // silently shrink the amount the admin thinks they are sending.
      const live = new Set<string>((payableRes.data?.bookings || []).map((b: PayableBooking) => b.id));
      setSelected(prev => {
        const next = new Set([...prev].filter(id => live.has(id)));
        return next.size === prev.size ? prev : next;
      });
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
      await api.updatePayoutPhone(payoutPhone, 'mom');
      setDestPhone(payoutPhone.trim());
      setPayoutSaved(true);
      setTimeout(() => setPayoutSaved(false), 3000);
    } catch (err: any) {
      setPayoutError(err.message || 'Failed to save payout settings');
    } finally {
      setPayoutSaving(false);
    }
  };

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.delete(id);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  };

  const allSelected = payable.length > 0 && selected.size === payable.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(payable.map(b => b.id)));

  const selectedBookings = useMemo(
    () => payable.filter(b => selected.has(b.id)),
    [payable, selected]
  );
  const selectedTotal = selectedBookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

  const pinComplete = pin.length === PIN_LENGTH && /^\d+$/.test(pin);
  const newPinComplete = newPin.length === PIN_LENGTH && /^\d+$/.test(newPin);
  const pinsMatch = newPinComplete && newPin === confirmPin;
  const canSetPin = pinsMatch && !pinSaving;
  const phoneClean = destPhone.trim().replace(/[\s()-]/g, '');
  const phoneValid = /^\+?[0-9]{9,15}$/.test(phoneClean);
  const walletShort =
    payout.walletBalance != null && selectedTotal > 0 && payout.walletBalance < selectedTotal;
  const canExecute =
    selected.size > 0 && phoneValid && pinComplete && !executing && payout.pinConfigured !== false;

  const openConfirm = () => {
    setPayoutError('');
    setPayoutNotice('');
    setPin('');
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    if (!executing) {
      setConfirmOpen(false);
      setPin('');
    }
  };

  const openPinModal = () => {
    setPinError('');
    setNewPin('');
    setConfirmPin('');
    setPinModalOpen(true);
  };

  const closePinModal = () => {
    if (!pinSaving) setPinModalOpen(false);
  };

  const handleSetPin = async () => {
    setPinError('');
    if (newPin.length !== PIN_LENGTH || !/^\d+$/.test(newPin)) {
      setPinError(`PIN must be exactly ${PIN_LENGTH} digits`);
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('The two PINs do not match');
      return;
    }
    setPinSaving(true);
    try {
      await api.setPayoutPin(newPin);
      setPinModalOpen(false);
      setNewPin('');
      setConfirmPin('');
      setPayout(prev => ({ ...prev, pinConfigured: true }));
      setPayoutNotice('Payout PIN set successfully. Payouts are now enabled.');
    } catch (err: any) {
      setPinError(err.message || 'Failed to set payout PIN');
    } finally {
      setPinSaving(false);
    }
  };

  const handleExecute = async () => {
    setExecuting(true);
    setPayoutError('');
    try {
      const res = await api.executePayout([...selected], phoneClean, pin);
      setConfirmOpen(false);
      setPin('');
      setSelected(new Set());
      setPayoutNotice(res.data?.message || 'Payout dispatched');
      await loadData();
    } catch (err: any) {
      setPayoutError(err.message || 'Payout failed');
    } finally {
      setExecuting(false);
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
        subtitle="Configure platform-wide fees, rewards, and release money to agencies"
        actions={
          <button onClick={handleSave} disabled={saving}
            className="h-9 px-4 rounded-md border border-[var(--studio-border)] text-sm font-medium flex items-center gap-2 cursor-pointer bg-[var(--fill-subtle)] hover:bg-[var(--fill-hover)] disabled:opacity-50 transition-all text-[var(--studio-text-sub)]"
          >
            {saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
            Save All
          </button>
        }
      />

      {saved && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-md"
          style={{ background: 'var(--tone-success-fill)', border: '1px solid var(--tone-success-line)' }}
        >
          <p className="text-xs font-medium" style={{ color: 'var(--tone-success-ink)' }}>All settings saved successfully</p>
        </motion.div>
      )}
      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-md" style={{ background: 'var(--tone-danger-fill)', border: '1px solid var(--tone-danger-line)' }}>
          <p className="text-xs font-medium" style={{ color: 'var(--tone-danger-ink)' }}>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {SETTINGS.map(meta => {
          const Icon = meta.icon;
          const value = settings[meta.key];
          return (
            <motion.div key={meta.key} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-md border border-[var(--studio-border)] p-5"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-md bg-[var(--studio-accent-soft)] flex items-center justify-center shrink-0">
                  <Icon size={18} style={{ color: 'var(--blue)' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-[var(--studio-text)]">{meta.label}</h3>
                  <p className="text-xs text-[var(--studio-text-sub)] mt-0.5">{meta.description}</p>
                </div>
              </div>

              {meta.type === 'number' ? (
                <input type="number" min={0}
                  value={value ?? ''}
                  onChange={e => handleChange(meta.key, Number(e.target.value))}
                  className="w-full h-10 px-4 rounded-md border border-[var(--studio-border)] text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400/40 focus:border-zinc-400"
                />
              ) : (
                <div className="flex items-center gap-3">
                  <button onClick={() => handleChange(meta.key, true)}
                    className={`flex-1 h-10 rounded-md text-xs font-medium transition-all cursor-pointer border ${
                      value === true ? 'bg-[var(--studio-accent)] text-white border-[var(--studio-accent)]' : 'bg-white text-[var(--studio-text-sub)] border-[var(--studio-border)] hover:border-[var(--studio-border)]'
                    }`}
                  >Enabled</button>
                  <button onClick={() => handleChange(meta.key, false)}
                    className={`flex-1 h-10 rounded-md text-xs font-medium transition-all cursor-pointer border ${
                      value === false ? 'bg-[var(--fill-subtle)] text-[var(--studio-text-sub)] border-[var(--studio-border)]' : 'bg-white text-[var(--studio-text-sub)] border-[var(--studio-border)] hover:border-[var(--studio-border)]'
                    }`}
                  >Disabled</button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* ── Manual payout ────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-md border border-[var(--studio-border)] overflow-hidden"
      >
        <div className="p-5 flex items-center gap-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="w-10 h-10 rounded-md bg-[var(--studio-accent-soft)] flex items-center justify-center shrink-0">
            <Send size={18} style={{ color: 'var(--blue)' }} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[var(--studio-text)]">Manual Payout</h3>
            <p className="text-xs text-[var(--studio-text-sub)]">
              Nothing is paid out automatically. Tick the bookings you want to settle, confirm the
              destination number, then authorise with the payout PIN.
            </p>
          </div>
          {payout.pinConfigured === false && (
            <button onClick={openPinModal}
              className="ml-auto shrink-0 h-10 px-4 rounded-md text-sm font-medium flex items-center gap-2 cursor-pointer bg-[var(--studio-accent)] hover:opacity-90 transition-all text-white"
            >
              <KeyRound size={14} />
              Set Payout PIN
            </button>
          )}
        </div>

        {payout.pinConfigured === false && (
          <div className="m-5 flex items-start gap-2.5 p-3 rounded-md" style={{ background: 'var(--tone-danger-fill)', border: '1px solid var(--tone-danger-line)' }}>
            <ShieldAlert size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--tone-danger-ink)' }} />
            <p className="text-xs font-medium" style={{ color: 'var(--tone-danger-ink)' }}>
              Payouts are disabled until a payout PIN is set. Use the Set Payout PIN button above
              to create one — it is stored encrypted and can be used immediately.
            </p>
          </div>
        )}

        {payoutNotice && (
          <div className="m-5 mb-0 flex items-start gap-2.5 p-3 rounded-md" style={{ background: 'var(--tone-info-fill)', border: '1px solid var(--tone-info-line)' }}>
            <p className="text-xs font-medium" style={{ color: 'var(--tone-info-ink)' }}>{payoutNotice}</p>
          </div>
        )}
        {payoutError && (
          <div className="m-5 mb-0 flex items-start gap-2.5 p-3 rounded-md" style={{ background: 'var(--tone-danger-fill)', border: '1px solid var(--tone-danger-line)' }}>
            <p className="text-xs font-medium" style={{ color: 'var(--tone-danger-ink)' }}>{payoutError}</p>
          </div>
        )}

        {payable.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-[var(--studio-text-sub)]">
              No bookings are waiting for disbursement. Confirmed, paid bookings appear here as
              soon as they are ready to settle.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-5 py-2.5 bg-[var(--studio-surface-sub)] border-b border-[var(--studio-border)]">
              <button onClick={toggleAll}
                className="flex items-center gap-2 text-xs font-semibold text-[var(--studio-text-sub)] hover:text-[var(--studio-text)] cursor-pointer"
              >
                {allSelected
                  ? <CheckSquare size={15} style={{ color: 'var(--blue)' }} />
                  : <Square size={15} />}
                {allSelected ? 'Clear selection' : `Select all ${payable.length}`}
              </button>
              <span className="text-xs font-medium text-[var(--studio-text-sub)]">
                {selected.size} of {payable.length} selected
                {selected.size > 0 && <> &middot; <b style={{ color: 'var(--text)' }}>{fmt(selectedTotal)} RWF</b></>}
              </span>
            </div>

            <div className="max-h-[22rem] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="text-left text-xs uppercase tracking-wider text-[var(--studio-text-muted)] border-b" style={{ borderColor: 'var(--border)' }}>
                    <th className="py-2 pl-5 pr-2 w-8"></th>
                    <th className="py-2 pr-3 font-semibold">Reference</th>
                    <th className="py-2 pr-3 font-semibold">Agency</th>
                    <th className="py-2 pr-3 font-semibold">Travel Date</th>
                    <th className="py-2 pr-3 font-semibold">Seats</th>
                    <th className="py-2 pr-5 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payable.map(b => {
                    const on = selected.has(b.id);
                    return (
                      <tr key={b.id} onClick={() => toggle(b.id)}
                        className="cursor-pointer border-b last:border-0"
                        style={{
                          borderColor: 'var(--border)',
                          background: on ? 'var(--blue-bg)' : 'transparent',
                        }}
                      >
                        <td className="py-2.5 pl-5 pr-2">
                          {on
                            ? <CheckSquare size={16} style={{ color: 'var(--blue)' }} />
                            : <Square size={16} className="text-[var(--studio-text-muted)]" />}
                        </td>
                        <td className="py-2.5 pr-3 font-mono text-xs">{b.referenceCode}</td>
                        <td className="py-2.5 pr-3 text-[var(--studio-text-sub)]">{b.agency || '—'}</td>
                        <td className="py-2.5 pr-3 text-[var(--studio-text-sub)]">
                          {new Date(b.travelDate).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 pr-3">{b.seats}</td>
                        <td className="py-2.5 pr-5 text-right font-medium">{fmt(b.amount)} RWF</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="p-5 flex flex-col sm:flex-row sm:items-end gap-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--studio-text-sub)] flex items-center gap-1.5 mb-2">
              <Phone size={13} /> Default Payout Number
            </label>
            <input
              type="tel"
              placeholder="e.g. 25078XXXXXXX"
              value={payoutPhone}
              onChange={e => setPayoutPhone(e.target.value)}
              className="w-full h-10 px-4 rounded-md border border-[var(--studio-border)] text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400/40 focus:border-zinc-400"
            />
            <p className="text-xs text-[var(--studio-text-sub)] mt-1.5">
              Prefills the destination field, but every payout is typed and confirmed individually.
            </p>
          </div>
          <button onClick={handlePayoutPhoneSave} disabled={payoutSaving || !payoutPhone.trim()}
            className="h-10 px-4 rounded-md text-sm font-medium flex items-center gap-2 cursor-pointer bg-[var(--studio-accent)] hover:opacity-90 disabled:opacity-50 transition-all text-white"
          >
            {payoutSaving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
            Save
          </button>
        </div>

        <div className="px-5 pb-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <p className="text-xs text-[var(--studio-text-sub)]">
            {walletShort
              ? `Wallet holds ${fmt(payout.walletBalance!)} RWF — not enough for this selection.`
              : `Wallet balance: ${payout.walletBalance != null ? `${fmt(payout.walletBalance)} RWF` : 'unavailable'}`}
          </p>
          <button onClick={openConfirm}
            disabled={selected.size === 0 || payout.pinConfigured === false || loading}
            className="h-10 px-5 rounded-md text-sm font-medium flex items-center justify-center gap-2 cursor-pointer bg-[var(--studio-accent)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-white"
          >
            <KeyRound size={14} />
            Review Payout
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard label="Wallet Balance" value={payout.walletBalance != null ? `${fmt(payout.walletBalance)} RWF` : '—'} sub="pawaPay wallet (RWA)" icon={<Wallet size={16} />} loading={loading} />
        <StatCard label="Pending Disbursement" value={pendingTotal > 0 ? `${fmt(pendingTotal)} RWF` : '0 RWF'} sub={`${pendingCount} booking(s) awaiting a manual payout`} icon={<Send size={16} />} loading={loading} />
        <StatCard label="Net System Income" value={netSystem > 0 ? `${fmt(netSystem)} RWF` : '0 RWF'} sub={`${fmt(payout.batchFeesPaid ?? 0)} RWF measured payout fees`} icon={<DollarSign size={16} />} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <StatCard label="Fee per Seat" value={settings.system_fee_percentage ? `${settings.system_fee_percentage} RWF` : '0 RWF'} sub="Added to each seat" icon={<Percent size={16} />} loading={loading} />
        <StatCard label="Active Agencies" value={fmt(totals.totalAgencies)} sub="Receiving disbursements" icon={<Building2 size={16} />} loading={loading} />
        <StatCard label="Total Bookings" value={fmt(totals.totalBookings)} sub="Fee applicable" icon={<Ticket size={16} />} loading={loading} />
      </div>

      <div className="bg-white rounded-md border border-[var(--studio-border)] p-5">
        <div className="flex items-center gap-2 mb-4">
          <History size={16} style={{ color: 'var(--blue)' }} />
          <h4 className="text-sm font-bold text-[var(--studio-text)]">Payout History</h4>
        </div>
        {(payout.recentBatches?.length ?? 0) === 0 ? (
          <p className="text-sm text-[var(--studio-text-sub)]">No payouts have been made yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-[var(--studio-text-muted)] border-b" style={{ borderColor: 'var(--border)' }}>
                  <th className="py-2 pr-3 font-semibold">Date</th>
                  <th className="py-2 pr-3 font-semibold">Payout</th>
                  <th className="py-2 pr-3 font-semibold">Bookings</th>
                  <th className="py-2 pr-3 font-semibold">Amount</th>
                  <th className="py-2 pr-3 font-semibold">Phone</th>
                  <th className="py-2 pr-3 font-semibold">Authorised By</th>
                  <th className="py-2 pr-3 font-semibold">Balance Before &rarr; After</th>
                  <th className="py-2 pr-3 font-semibold">Fee</th>
                  <th className="py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {(payout.recentBatches || []).map(b => {
                  const st = PAYOUT_STATUS[b.status]
                    || { label: b.status, color: 'var(--tone-neutral-ink)', fill: 'var(--tone-neutral-fill)' };
                  return (
                    <tr key={b.batchId} className="border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                      <td className="py-2.5 pr-3 text-[var(--studio-text-sub)]">{new Date(b.createdAt).toLocaleString()}</td>
                      <td className="py-2.5 pr-3 font-mono text-xs">{b.batchId.slice(0, 8)}…</td>
                      <td className="py-2.5 pr-3">{b.bookingCount}</td>
                      <td className="py-2.5 pr-3 font-medium">{fmt(b.totalAmount)} RWF</td>
                      <td className="py-2.5 pr-3">{b.phoneNumber}</td>
                      <td className="py-2.5 pr-3 text-[var(--studio-text-sub)]">{b.requestedByLabel || '—'}</td>
                      <td className="py-2.5 pr-3 text-[var(--studio-text-sub)]">
                        {b.balanceBefore != null ? fmt(b.balanceBefore) : '—'}{b.balanceAfter != null ? ` → ${fmt(b.balanceAfter)}` : ''}
                      </td>
                      <td className="py-2.5 pr-3 text-[var(--studio-text-sub)]">{b.measuredFee != null ? `${fmt(b.measuredFee)} RWF` : '—'}</td>
                      <td className="py-2.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ color: st.color, background: st.fill }}>
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

      <div className="bg-[var(--studio-surface-sub)] border border-[var(--studio-border)] rounded-md p-5">
        <h4 className="text-sm font-bold text-[var(--studio-text)] mb-2">How it works</h4>
        <ul className="text-sm text-[var(--studio-text-sub)] space-y-1 list-disc pl-5">
          <li>A flat system fee is added per seat on top of the route price.</li>
          <li>Fee = Flat Fee per Seat × Number of Seats</li>
          <li>The agency receives the full route price for each booking.</li>
          <li>The system collects the fee as a service charge from the passenger.</li>
          <li>Funds are held as <b>pending disbursement</b>. Nothing is sent on a schedule — an admin selects the exact bookings, types the destination number, and authorises with the payout PIN.</li>
          <li>Only the ticked bookings are marked as disbursed. A booking that is unpaid, unconfirmed or already paid out cannot be selected, and one bad selection aborts the whole payout rather than partially sending it.</li>
          <li>Every attempt is written to the audit log, including rejected PINs.</li>
        </ul>
      </div>

      {/* ── Confirm & authorise ───────────────────────────────────────── */}
      <Modal
        open={confirmOpen}
        onClose={closeConfirm}
        title="Confirm payout"
        subtitle="This sends real money immediately and cannot be undone."
        maxWidth={520}
      >
        <div className="space-y-5">
          <div className="rounded-md p-4 bg-[var(--studio-surface-sub)] border border-[var(--studio-border)]">
            <div className="flex items-baseline justify-between">
              <span className="text-xs uppercase tracking-wider font-semibold text-[var(--studio-text-sub)]">Total</span>
              <span className="text-2xl font-bold text-[var(--studio-text)]">{fmt(selectedTotal)} RWF</span>
            </div>
            <p className="text-xs text-[var(--studio-text-sub)] mt-1">
              {selected.size} booking{selected.size === 1 ? '' : 's'} &middot; one payout fee
            </p>
            {walletShort && (
              <p className="text-xs font-medium mt-2" style={{ color: 'var(--tone-danger-ink)' }}>
                Wallet balance ({fmt(payout.walletBalance!)} RWF) is below this amount. The payout
                will be recorded as skipped and nothing will be sent.
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--studio-text-sub)] flex items-center gap-1.5 mb-2">
              <Phone size={13} /> Pay Out To
            </label>
            <input
              type="tel"
              autoComplete="off"
              value={destPhone}
              onChange={e => setDestPhone(e.target.value)}
              className="w-full h-10 px-4 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400/40 focus:border-zinc-400"
              style={{ borderColor: phoneValid ? 'var(--studio-border)' : 'var(--tone-danger-line)' }}
            />
            <p className="text-xs text-[var(--studio-text-sub)] mt-1.5">
              {phoneValid
                ? `Sent via MTN MoMo to ${phoneClean}.`
                : 'Enter a valid mobile money number.'}
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--studio-text-sub)] flex items-center gap-1.5 mb-2">
              <KeyRound size={13} /> Payout PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={PIN_LENGTH}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH))}
              onKeyDown={e => { if (e.key === 'Enter' && canExecute) handleExecute(); }}
              placeholder="••••••••"
              className="w-full h-10 px-4 rounded-md border text-sm tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-zinc-400/40"
              style={{ borderColor: pinComplete ? 'var(--studio-border)' : 'var(--tone-danger-line)' }}
            />
            <p className="text-xs text-[var(--studio-text-sub)] mt-1.5">
              {PIN_LENGTH}-digit PIN required. After 10 failed attempts payouts lock out for 15
              minutes.
            </p>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-md" style={{ background: 'var(--tone-warning-fill)', border: '1px solid var(--tone-warning-line)' }}>
            <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--tone-warning-ink)' }} />
            <p className="text-xs font-medium" style={{ color: 'var(--tone-warning-ink)' }}>
              Confirm the number above carefully. Money sent to a wrong number cannot be recalled.
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={closeConfirm} disabled={executing}
              className="flex-1 h-10 rounded-md text-sm font-medium cursor-pointer border border-[var(--studio-border)] bg-white text-[var(--studio-text-sub)] hover:bg-[var(--fill-hover)] disabled:opacity-50"
            >
              Cancel
            </button>
            <button onClick={handleExecute} disabled={!canExecute}
              className="flex-1 h-10 rounded-md text-sm font-medium flex items-center justify-center gap-2 cursor-pointer bg-[var(--solid-danger)] text-white hover:bg-[var(--solid-danger-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {executing ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
              Send {fmt(selectedTotal)} RWF
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Set payout PIN ─────────────────────────────────────────────── */}
      <Modal
        open={pinModalOpen}
        onClose={closePinModal}
        title="Set payout PIN"
        subtitle="This PIN authorises every manual payout. Store it somewhere safe — it cannot be viewed once set."
        maxWidth={480}
      >
        <div className="space-y-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--studio-text-sub)] flex items-center gap-1.5 mb-2">
              <KeyRound size={13} /> New PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              maxLength={PIN_LENGTH}
              value={newPin}
              onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH))}
              placeholder="••••••••"
              className="w-full h-10 px-4 rounded-md border text-sm tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-zinc-400/40"
              style={{ borderColor: newPin && !newPinComplete ? 'var(--tone-danger-line)' : 'var(--studio-border)' }}
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--studio-text-sub)] flex items-center gap-1.5 mb-2">
              <KeyRound size={13} /> Confirm PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              maxLength={PIN_LENGTH}
              value={confirmPin}
              onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH))}
              onKeyDown={e => { if (e.key === 'Enter' && canSetPin) handleSetPin(); }}
              placeholder="••••••••"
              className="w-full h-10 px-4 rounded-md border text-sm tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-zinc-400/40"
              style={{ borderColor: confirmPin && !pinsMatch ? 'var(--tone-danger-line)' : 'var(--studio-border)' }}
            />
            <p className="text-xs text-[var(--studio-text-sub)] mt-1.5">
              {confirmPin && !pinsMatch
                ? 'The two PINs do not match.'
                : `${PIN_LENGTH}-digit PIN required.`}
            </p>
          </div>

          {pinError && (
            <div className="flex items-start gap-2.5 p-3 rounded-md" style={{ background: 'var(--tone-danger-fill)', border: '1px solid var(--tone-danger-line)' }}>
              <p className="text-xs font-medium" style={{ color: 'var(--tone-danger-ink)' }}>{pinError}</p>
            </div>
          )}

          <div className="flex items-start gap-2.5 p-3 rounded-md" style={{ background: 'var(--tone-warning-fill)', border: '1px solid var(--tone-warning-line)' }}>
            <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--tone-warning-ink)' }} />
            <p className="text-xs font-medium" style={{ color: 'var(--tone-warning-ink)' }}>
              The PIN is encrypted in the database. If you lose it, you will set a new one to
              regain access.
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={closePinModal} disabled={pinSaving}
              className="flex-1 h-10 rounded-md text-sm font-medium cursor-pointer border border-[var(--studio-border)] bg-white text-[var(--studio-text-sub)] hover:bg-[var(--fill-hover)] disabled:opacity-50"
            >
              Cancel
            </button>
            <button onClick={handleSetPin} disabled={!canSetPin}
              className="flex-1 h-10 rounded-md text-sm font-medium flex items-center justify-center gap-2 cursor-pointer bg-[var(--studio-accent)] text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {pinSaving ? <Loader size={14} className="animate-spin" /> : <KeyRound size={14} />}
              Set PIN
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
