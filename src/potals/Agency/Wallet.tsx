import { useEffect, useState, useCallback } from 'react';
import {
  Wallet, ArrowDownLeft, ArrowUpRight, TrendingUp,
  Clock, CheckCircle, XCircle, AlertCircle,
  Banknote, Filter, ChevronDown, X, Search,
  BarChart2, Calendar, Shield, Info, Building2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input, Modal, PageHeader, Card, StatCard } from '../../components/ui';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function fmtRWF(n: number): string {
  return `RWF ${Number(n).toLocaleString()}`;
}

function fmtDate(s?: string): string {
  if (!s) return '—';
  return new Date(s).toLocaleString('en-RW', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtDateShort(s?: string): string {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-RW', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type TxType   = 'ESCROW_RELEASE' | 'MANUAL_PAYOUT' | 'ADJUSTMENT' | string;
type TxStatus = 'COMPLETED' | 'PENDING' | 'FAILED' | string;

interface WalletTransaction {
  id: string;
  walletId: string;
  bookingId?: string;
  amount: number;
  type: TxType;
  status: TxStatus;
  note?: string;
  settledAt?: string;
  createdAt: string;
}

interface WalletData {
  data: any;
  agencyId: string;
  walletId?: string;
  balance: number;
  lastUpdatedAt?: string;
  transactions: WalletTransaction[];
}

interface SettlementEntry {
  walletId: string;
  agencyId: string;
  agencyName: string;
  contactPhone: string;
  balance: number;
  lastUpdatedAt?: string;
  data: any;
}

// ─────────────────────────────────────────────────────────────────────────────
// Type / Status Chips
// ─────────────────────────────────────────────────────────────────────────────
const TX_TYPE_CFG: Record<string, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  ESCROW_RELEASE: { label: 'Payment In',  color: '#0854AE', bg: '#F4F4F5', Icon: ArrowDownLeft },
  MANUAL_PAYOUT:  { label: 'Payout',      color: '#0854AE', bg: '#F4F4F5', Icon: ArrowUpRight  },
  ADJUSTMENT:     { label: 'Adjustment',  color: '#d97706', bg: '#fffbeb', Icon: Info           },
};

const TX_STATUS_MAP: Record<string, { color: string; bg: string; label: string }> = {
  COMPLETED: { color: '#0854AE', bg: '#F4F4F5', label: 'Completed' },
  PENDING:   { color: '#d97706', bg: '#fffbeb', label: 'Pending'   },
  FAILED:    { color: '#dc2626', bg: '#fff1f2', label: 'Failed'    },
};

function TxTypeChip({ type }: { type: TxType }) {
  const cfg = TX_TYPE_CFG[type] ?? { label: type, color: '#64748b', bg: '#f1f5f9', Icon: Banknote };
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold" style={{ color: cfg.color, background: cfg.bg }}>
      <cfg.Icon size={11} />{cfg.label}
    </span>
  );
}

function TxStatusChip({ status }: { status: TxStatus }) {
  const s = TX_STATUS_MAP[status] ?? { color: '#64748b', bg: '#f1f5f9', label: status };
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider" style={{ color: s.color, background: s.bg }}>
      {status === 'COMPLETED' && <CheckCircle size={9} />}
      {status === 'PENDING'   && <Clock       size={9} />}
      {status === 'FAILED'    && <XCircle     size={9} />}
      {s.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Payout Modal (system_admin only)
// ─────────────────────────────────────────────────────────────────────────────
function PayoutModal({
  agencyId, agencyName, balance, onClose, onSuccess,
}: {
  agencyId: string; agencyName: string; balance: number;
  onClose: () => void; onSuccess: () => void;
}) {
  const [amount,  setAmount]  = useState('');
  const [note,    setNote]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const { authFetch } = useAuth();

  const handle = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0)   { setError('Enter a valid amount.'); return; }
    if (amt > balance)      { setError(`Exceeds available balance (${fmtRWF(balance)}).`); return; }
    setLoading(true); setError('');
    try {
      await authFetch(`/agencies/${agencyId}/wallet/payout`, { method: 'POST', body: JSON.stringify({ amount: amt, note: note || undefined }) });
      onSuccess(); onClose();
    } catch (e: any) { setError(e.message || 'Payout failed.'); }
    finally { setLoading(false); }
  };

  return (
    <Modal open title="Record Payout" subtitle={agencyName} onClose={onClose} maxWidth={460}>
      <div className="p-4 rounded-md mb-4" style={{ background: '#0854AE' }}>
        <div className="flex items-center justify-between rounded-md px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <span className="text-xs text-white/75">Available balance</span>
          <span className="font-[var(--font-body)] text-lg font-extrabold text-white">{fmtRWF(balance)}</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-md mb-4 text-sm font-[var(--font-body)]" style={{ background: '#fff1f2', border: '1px solid #fecdd3', color: '#dc2626' }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <div className="flex flex-col gap-3.5">
        <Input label="Amount (RWF)" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 50000" />
        <Input label="Note (optional)" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Weekly settlement — April 2026" />
      </div>

      <div className="flex justify-end gap-2.5 mt-5">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={handle} loading={loading}>Confirm Payout</Button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Balance Hero Card
// ─────────────────────────────────────────────────────────────────────────────
function BalanceCard({ wallet, agencyName, loading, onPayout, canPayout, isAdmin }: {
  wallet: WalletData | null; agencyName: string; loading: boolean;
  onPayout: () => void; canPayout: boolean; isAdmin: boolean;
}) {
  const earned = (wallet?.transactions ?? []).filter(t => t.type === 'ESCROW_RELEASE' && t.status === 'COMPLETED').reduce((s, t) => s + t.amount, 0);
  const paid   = (wallet?.transactions ?? []).filter(t => t.type === 'MANUAL_PAYOUT'  && t.status === 'COMPLETED').reduce((s, t) => s + t.amount, 0);

  return (
    <Card padding="lg" className="mb-6 relative overflow-hidden" style={{ background: '#0854AE', color: 'white', border: 'none' }}>
      <div className="relative z-10">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.14)' }}>
                <Wallet size={19} color="white" />
              </div>
              <div>
                <p className="text-[10px] opacity-60 font-bold uppercase tracking-widest m-0">Agency Wallet</p>
                <p className="text-xs opacity-80 font-medium m-0">{agencyName}</p>
              </div>
            </div>
            <p className="text-[11px] opacity-50 m-0">Available balance</p>
            {loading
              ? <div className="w-[220px] h-12 rounded-md mt-1 animate-pulse" style={{ background: 'rgba(255,255,255,0.1)' }} />
              : <p className="font-[var(--font-body)] text-[42px] font-extrabold tracking-tight leading-none mt-1 m-0">{fmtRWF(wallet?.balance ?? 0)}</p>
            }
            {wallet?.lastUpdatedAt && (
              <p className="text-[11px] opacity-45 flex items-center gap-1 mt-1.5 m-0">
                <Clock size={9} /> Updated {fmtDate(wallet.lastUpdatedAt)}
              </p>
            )}
          </div>
          {canPayout && (
            <Button variant="secondary" size="sm" onClick={onPayout} className="!text-white !border-white/20" style={{ background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)' }}>
              Record Payout
            </Button>
          )}
        </div>

        <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${isAdmin ? 3 : 1}, 1fr)` }}>
          <StatCard label="Total Earned" value={fmtRWF(earned)} icon={<TrendingUp size={17} color="#fff" />} accent="#34d399" loading={loading} />
          <StatCard label="Total Paid" value={fmtRWF(paid)} icon={<ArrowUpRight size={17} color="#fff" />} accent="#60A5FA" loading={loading} />
          {isAdmin && <StatCard label="Transactions" value={wallet?.transactions?.length ?? 0} icon={<BarChart2 size={17} color="#fff" />} accent="#fbbf24" loading={loading} />}
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Transaction Table
// ─────────────────────────────────────────────────────────────────────────────
function TransactionTable({ transactions, loading }: { transactions: WalletTransaction[]; loading: boolean }) {
  const [search,    setSearch]    = useState('');
  const [typeFilter, setType]     = useState('');
  const [showFilter, setShowFilter] = useState(false);

  const filtered = transactions.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !search || t.note?.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || (t.bookingId ?? '').toLowerCase().includes(q);
    return matchSearch && (!typeFilter || t.type === typeFilter);
  });

  return (
    <Card padding="sm" className="overflow-hidden">
      <div className="flex items-center justify-between flex-wrap gap-2.5 px-4 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'rgba(8, 84, 174,0.08)' }}>
            <Banknote size={15} style={{ color: 'var(--blue)' }} />
          </div>
          <div>
            <p className="font-[var(--font-body)] text-sm font-bold text-[var(--text)] m-0">Transaction History</p>
            <p className="text-xs text-[var(--text-muted)] m-0">{transactions.length} total records</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md" style={{ background: '#f8fafc', border: '1px solid var(--border)', minWidth: 190 }}>
            <Search size={12} style={{ color: 'var(--text-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transactions…"
              className="border-none bg-none text-xs text-[var(--text)] outline-none font-[var(--font-body)] w-full"
              style={{ background: 'transparent' }} />
            {search && <button onClick={() => setSearch('')} className="border-none bg-none cursor-pointer text-[var(--text-muted)] flex p-0"><X size={11} /></button>}
          </div>
          <div className="relative">
            <button onClick={() => setShowFilter(v => !v)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-sm border text-xs font-semibold cursor-pointer font-[var(--font-body)]"
              style={{ borderColor: 'var(--border)', background: typeFilter ? 'rgba(8, 84, 174,0.06)' : 'white', color: typeFilter ? '#0854AE' : 'var(--text-sub)' }}>
              <Filter size={11} /> {typeFilter ? TX_TYPE_CFG[typeFilter]?.label ?? typeFilter : 'All types'} <ChevronDown size={11} />
            </button>
            {showFilter && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowFilter(false)} />
                <div className="absolute right-0 top-full mt-1 w-[175px] bg-white border border-[var(--border)] rounded-md z-50 overflow-hidden">
                  {['', 'ESCROW_RELEASE', 'MANUAL_PAYOUT', 'ADJUSTMENT'].map(t => (
                    <button key={t} onClick={() => { setType(t); setShowFilter(false); }}
                      className="block w-full px-3 py-2 border-none cursor-pointer font-[var(--font-body)] text-xs text-left"
                      style={{ background: typeFilter === t ? 'rgba(8, 84, 174,0.05)' : 'none', color: typeFilter === t ? '#0854AE' : 'var(--text)', fontWeight: typeFilter === t ? 700 : 400 }}>
                      {t ? (TX_TYPE_CFG[t]?.label ?? t) : 'All types'}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Date', 'Type', 'Note / Reference', 'Amount', 'Status'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left font-[var(--font-body)] text-[10px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: '#94a3b8' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-t border-[#f1f5f9]">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-3 rounded w-[70%] animate-pulse" style={{ background: '#e2e8f0' }} /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  {search || typeFilter ? 'No transactions match your filters.' : 'No transactions yet.'}
                </td>
              </tr>
            ) : filtered.map((t, i) => (
              <tr key={t.id}
                className="border-t border-[#f1f5f9] transition-colors"
                style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-1 text-xs" style={{ color: '#475569' }}>
                    <Calendar size={11} style={{ color: 'var(--text-muted)' }} />
                    {fmtDateShort(t.settledAt || t.createdAt)}
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5 m-0">
                    {new Date(t.settledAt || t.createdAt).toLocaleTimeString('en-RW', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </td>
                <td className="px-4 py-3"><TxTypeChip type={t.type} /></td>
                <td className="px-4 py-3 max-w-[260px]">
                  <p className="text-sm text-[var(--text)] m-0 truncate">{t.note || '—'}</p>
                  {t.bookingId && (
                    <p className="text-[10px] text-[var(--text-muted)] font-[var(--font-body)] mt-0.5 m-0">Booking: {t.bookingId.slice(0, 8)}…</p>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="font-[var(--font-body)] text-sm font-bold" style={{ color: t.type === 'MANUAL_PAYOUT' ? '#dc2626' : 'var(--blue)' }}>
                    {t.type === 'MANUAL_PAYOUT' ? '−' : '+'}{fmtRWF(t.amount)}
                  </span>
                </td>
                <td className="px-4 py-3"><TxStatusChip status={t.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div className="px-4 py-2.5 border-t border-[#f1f5f9] flex justify-between items-center">
          <span className="text-xs text-[var(--text-muted)]">Showing {filtered.length} of {transactions.length} transactions</span>
        </div>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Settlements Table (admin view)
// ─────────────────────────────────────────────────────────────────────────────
function SettlementsTable({ data, totalOwed, loading, onPayout }: {
  data: SettlementEntry[]; totalOwed: number; loading: boolean; onPayout: (e: SettlementEntry) => void;
}) {
  const { authFetch } = useAuth();

  async function downloadWalletReport(agencyId: string, agencyName: string) {
    const res = await authFetch(`/agencies/${agencyId}/wallet/export`);
    if (!res) return;
    const blob = new Blob([JSON.stringify(res)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `wallet_report_${agencyName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <Card padding="sm" className="overflow-hidden mt-6">
      <div className="flex items-center justify-between flex-wrap gap-2.5 px-4 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'rgba(8, 84, 174,0.08)' }}>
            <Shield size={15} style={{ color: '#0854AE' }} />
          </div>
          <div>
            <p className="font-[var(--font-body)] text-sm font-bold text-[var(--text)] m-0">Pending Settlements</p>
            <p className="text-xs text-[var(--text-muted)] m-0">Agencies with outstanding balances</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md" style={{ background: 'rgba(217,119,6,0.07)', border: '1px solid rgba(217,119,6,0.2)' }}>
          <Banknote size={13} style={{ color: 'var(--warning)' }} />
          <span className="text-xs font-bold" style={{ color: 'var(--warning)' }}>Total owed: {fmtRWF(totalOwed)}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Agency', 'Contact', 'Balance', 'Last Updated', 'Action'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left font-[var(--font-body)] text-[10px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: '#94a3b8' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-t border-[#f1f5f9]">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-3 rounded w-[70%] animate-pulse" style={{ background: '#e2e8f0' }} /></td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">No pending settlements.</td></tr>
            ) : data.map((entry, i) => (
              <tr key={entry.agencyId}
                className="border-t border-[#f1f5f9] transition-colors"
                style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                <td className="px-4 py-3">
                  <p className="font-[var(--font-body)] font-bold text-[var(--text)] m-0">{entry.agencyName}</p>
                  <p className="text-[10px] text-[var(--text-muted)] font-[var(--font-body)] mt-0.5 m-0">{entry.agencyId.slice(0, 8)}…</p>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: '#475569' }}>{entry.contactPhone || '—'}</td>
                <td className="px-4 py-3">
                  <span className="font-[var(--font-body)] text-sm font-extrabold" style={{ color: entry.balance > 100_000 ? '#dc2626' : 'var(--warning)' }}>
                    {fmtRWF(entry.balance)}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-sub)' }}>{fmtDateShort(entry.lastUpdatedAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => onPayout(entry)}>Pay out</Button>
                    <Button variant="secondary" size="sm" onClick={() => downloadWalletReport(entry.agencyId, entry.agencyName)}>Export</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function AgencyWalletPage() {
  const { user, authFetch } = useAuth();

  const isSystemAdmin = ['system_admin', 'nesa_admin', 'atpr_officer'].includes(user?.role ?? '');
  const isAgencyUser  = ['agency_admin', 'agency_branch_admin'].includes(user?.role ?? '');
  const agencyId      = isAgencyUser ? user?.organization : null;
  const agencyName    = (user as any)?.agencyName ?? (user as any)?.organizationName ?? 'Your Agency';

  const [wallet,        setWallet]        = useState<WalletData | null>(null);
  const [settlements,   setSettlements]   = useState<SettlementEntry[]>([]);
  const [totalOwed,     setTotalOwed]     = useState(0);
  const [walletLoading, setWalletLoading] = useState(true);
  const [settlLoading,  setSettlLoading]  = useState(true);
  const [payoutTarget,  setPayoutTarget]  = useState<{ agencyId: string; agencyName: string; balance: number } | null>(null);
  const [tick,          setTick]          = useState(0);
  const refresh = () => setTick(k => k + 1);
  const [exporting, setExporting] = useState(false);

  const fetchWallet = useCallback(async () => {
    if (!agencyId) return;
    setWalletLoading(true);
    try {
      const res = await authFetch(`/agencies/${agencyId}/wallet`);
      setWallet(res?.data?.data);
    } catch { setWallet(null); }
    finally { setWalletLoading(false); }
  }, [agencyId, tick]);

  const handleExport = async () => {
    if (!agencyId) return;
    setExporting(true);
    try {
      const blob = await authFetch(`/agencies/${agencyId}/wallet/export`);
      if (blob) {
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `wallet_report_${agencyName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e: any) {
      alert(`Export failed: ${e.message}`);
    } finally {
      setExporting(false);
    }
  };

  const fetchSettlements = useCallback(async () => {
    if (!isSystemAdmin) return;
    setSettlLoading(true);
    try {
      const res = await authFetch('/wallets/settlements');
      setSettlements(res?.data?.data ?? []);
      setTotalOwed(res?.totalOwed ?? 0);
    } catch {
      setSettlements([]);
      setTotalOwed(0);
    } finally { setSettlLoading(false); }
  }, [isSystemAdmin, tick]);

  useEffect(() => { void fetchWallet(); },      [fetchWallet]);
  useEffect(() => { void fetchSettlements(); }, [fetchSettlements]);

  return (
    <div>
      <PageHeader
        title="Wallet"
        subtitle={isAgencyUser ? 'Agency earnings and payout history' : 'Platform-wide settlement dashboard'}
        actions={
          <div className="flex gap-2">
            {isAgencyUser && (
              <Button variant="secondary" size="sm" onClick={handleExport} loading={exporting}>
                Export Excel
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={refresh}>Refresh</Button>
          </div>
        }
      />

      {isAgencyUser && (
        <>
          <BalanceCard
            wallet={wallet}
            agencyName={agencyName}
            loading={walletLoading}
            isAdmin={['system_admin'].includes(user?.role ?? '')}
            onPayout={() => setPayoutTarget({ agencyId: agencyId!, agencyName, balance: wallet?.balance ?? 0 })}
            canPayout={false}
          />
          <TransactionTable transactions={wallet?.transactions ?? []} loading={walletLoading} />
        </>
      )}

      {isSystemAdmin && (
        <>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5 mb-6">
            {[
              { label: 'Total Owed',      value: fmtRWF(totalOwed),                                Icon: Banknote,   color: 'var(--warning)' },
              { label: 'Agencies Owed',   value: settlements.length,                               Icon: Building2,  color: '#0854AE' },
              { label: 'Largest Balance', value: settlements[0] ? fmtRWF(settlements[0].balance) : '—', Icon: TrendingUp, color: '#dc2626'   },
            ].map(s => (
              <Card key={s.label} padding="sm" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}12` }}>
                  <s.Icon size={18} color={s.color} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider m-0" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                  <p className="font-[var(--font-body)] text-lg font-extrabold text-[var(--text)] mt-0.5 m-0">{settlLoading ? '…' : s.value}</p>
                </div>
              </Card>
            ))}
          </div>
          <SettlementsTable
            data={settlements}
            totalOwed={totalOwed}
            loading={settlLoading}
            onPayout={e => setPayoutTarget({ agencyId: e.agencyId, agencyName: e.agencyName, balance: e.balance })}
          />
        </>
      )}

      {payoutTarget && (
        <PayoutModal
          agencyId={payoutTarget.agencyId}
          agencyName={payoutTarget.agencyName}
          balance={payoutTarget.balance}
          onClose={() => setPayoutTarget(null)}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}
