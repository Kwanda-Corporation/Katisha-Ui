import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bus, Plus, Search, X, Check,
  AlertCircle, MoreHorizontal, Eye, Power, Phone, Mail,
  MapPin, ChevronDown, Users, Clock, Loader2,
  Hash, Star, BadgeAlert,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input, PageHeader, Modal, StatCard } from '../../components/ui';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Agency {
  id: string;
  name: string;
  contactPerson?: string;
  contactPhone: string;
  contactEmail?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  isActive: boolean;
  featured?: boolean;
  rating: number;
  complianceScore: number;
  vehiclesCount: number;
  driversCount: number;
  completedTrips: number;
  districtCoverage?: string[];
  createdAt?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface AgencyFormState {
  name: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  licenseNumber: string;
  licenseExpiry: string;
}

// ── Shared Components ──────────────────────────────────────────────────────────
function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md ${active ? 'bg-[var(--blue-light)] text-[var(--blue-dark)]' : 'bg-[#F9FAFB] text-[var(--text-sub)]'}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: active ? '#1D4ED8' : '#94a3b8' }} />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function RowMenu({ isActive, onView, onToggle, extras = [] }: {
  isActive: boolean; onView: () => void; onToggle: () => void;
  extras?: Array<{ icon: React.ReactNode; label: string; color?: string; action: () => void }>;
}) {
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleOpen = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setOpenUpward(window.innerHeight - rect.bottom < 160);
    }
    setOpen(v => !v);
  };

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button ref={triggerRef} onClick={handleOpen}
        className="p-1.5 rounded-md hover:bg-[#F9FAFB] text-[var(--text-muted)] transition-colors">
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
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-[#F9FAFB] transition-colors">
              <Eye size={13} /> View details
            </button>
            {extras.map((ex, i) => (
              <button key={i} onClick={() => { ex.action(); setOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-[#F9FAFB] transition-colors"
                style={{ color: ex.color ?? '#334155' }}>
                {ex.icon} {ex.label}
              </button>
            ))}
            <div className="border-t border-[var(--border)] my-1" />
            <button onClick={() => { onToggle(); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-[#F9FAFB] transition-colors"
              style={{ color: isActive ? '#ea580c' : 'var(--blue)' }}>
              <Power size={13} /> {isActive ? 'Deactivate' : 'Activate'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



// ── Add Agency Modal ───────────────────────────────────────────────────────────
function AddAgencyModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: () => void }) {
  const { authFetch } = useAuth();
  const [form, setForm] = useState<AgencyFormState>({
    name: '', contactPerson: '', contactPhone: '',
    contactEmail: '', licenseNumber: '', licenseExpiry: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.contactPhone) { setError('Agency name and contact phone are required.'); return; }
    setSaving(true); setError('');
    const res = await authFetch('/agencies', { method: 'POST', body: JSON.stringify(form) });
    setSaving(false);
    if (!res) { setError('Failed to save.'); return; }
    setSuccess(true);
    setTimeout(() => { onSave(); onClose(); }, 1500);
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Transport Agency" maxWidth={500}>
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div key="ok" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--blue-light)] flex items-center justify-center mx-auto mb-4">
              <Check size={28} className="text-[var(--blue)]" />
            </div>
            <p className="font-[var(--font-body)] text-lg font-semibold text-[var(--text)]">Agency Added!</p>
            <p className="font-[var(--font-body)] text-sm text-[var(--text-sub)] mt-1">{form.name} has been registered.</p>
          </motion.div>
        ) : (
          <motion.div key="form" className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-sm text-[var(--text-sub)] bg-[#F9FAFB] px-3 py-2.5 rounded-md border border-[var(--border)]">
                <AlertCircle size={14} className="flex-shrink-0" /> {error}
              </div>
            )}
            <Input label="Agency Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Kigali Transport Ltd" />
            <Input label="Contact Person" value={form.contactPerson} onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))} placeholder="Full name" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Phone" type="tel" value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} placeholder="+250 7XX XXX XXX" />
              <Input label="Email" type="email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} placeholder="agency@example.rw" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="License Number" value={form.licenseNumber} onChange={e => setForm(f => ({ ...f, licenseNumber: e.target.value }))} placeholder="e.g. LIC-2024-0001" />
              <Input label="License Expiry" type="date" value={form.licenseExpiry} onChange={e => setForm(f => ({ ...f, licenseExpiry: e.target.value }))} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {!success && (
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[var(--border)]">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} loading={saving} disabled={saving || !form.name || !form.contactPhone}>Add Agency</Button>
        </div>
      )}
    </Modal>
  );
}



// ── Agency Detail Drawer ───────────────────────────────────────────────────────
function AgencyDrawer({ agency, onClose, onToggle }: { agency: Agency; onClose: () => void; onToggle: (agency: Agency) => Promise<void> }) {
  const [toggling, setToggling] = useState(false);

  return (
    <Modal open onClose={onClose} title="Agency Details" maxWidth={560}>
      <div className="space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(29,78,216,0.06)' }}>
              <Bus size={22} color="var(--info)" />
            </div>
            <div className="min-w-0">
              <p className="font-[var(--font-body)] font-semibold text-base leading-tight text-[var(--text)]">{agency.name}</p>
              {agency.contactPerson && <p className="font-[var(--font-body)] text-xs text-[var(--text-sub)] mt-0.5">{agency.contactPerson}</p>}
              <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                <ActiveBadge active={agency.isActive} />
                {agency.featured && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-200">
                    <Star size={10} fill="currentColor" /> Featured
                  </span>
                )}
                {agency.rating > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-[var(--blue-light)] text-[var(--blue)]">
                    <Star size={10} fill="currentColor" /> {Number(agency.rating).toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>

          

          <div className="grid grid-cols-3 gap-2">
            {([
              { label: 'Buses',   value: agency.vehiclesCount,  color: 'var(--info)' },
              { label: 'Drivers', value: agency.driversCount,   color: 'var(--blue)' },
              { label: 'Trips',   value: agency.completedTrips, color: '#7c3aed' },
            ]).map(({ label, value, color }) => (
              <div key={label} className="rounded-md p-3 border text-center bg-white border-[var(--border)]">
                <p className="font-[var(--font-body)] text-xl font-bold" style={{ color }}>{value}</p>
                <p className="font-[var(--font-body)] text-xs text-[var(--text-sub)] mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {agency.complianceScore > 0 && (
            <div className="rounded-md p-3 bg-[#F8FAFB] border border-[var(--border)]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-[var(--font-body)] text-xs font-semibold text-[var(--text-sub)]">Compliance Score</span>
                <span className="font-[var(--font-body)] text-sm font-bold text-[var(--text)]">{agency.complianceScore}%</span>
              </div>
              <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${agency.complianceScore}%`, background: agency.complianceScore >= 80 ? '#1D4ED8' : agency.complianceScore >= 60 ? '#f59e0b' : '#ef4444' }} />
              </div>
            </div>
          )}

          <div className="rounded-md p-4 space-y-3.5 bg-[#F8FAFB] border border-[var(--border)]">
            {[
              { icon: <Phone size={14} />, label: 'Phone', value: agency.contactPhone },
              { icon: <Mail size={14} />, label: 'Email', value: agency.contactEmail },
              { icon: <BadgeAlert size={14} />, label: 'License', value: agency.licenseNumber },
              { icon: <Clock size={14} />, label: 'License Expiry', value: agency.licenseExpiry ? new Date(agency.licenseExpiry).toLocaleDateString() : null },
            ].filter(s => s.value).map(s => (
              <div key={s.label} className="flex items-start gap-3">
                <span className="text-[var(--text-muted)] mt-0.5 flex-shrink-0">{s.icon}</span>
                <div className="min-w-0">
                  <p className="font-[var(--font-body)] text-xs text-[var(--text-sub)] mb-0.5">{s.label}</p>
                  <div className="font-[var(--font-body)] text-sm text-[var(--text)]">{s.value}</div>
                </div>
              </div>
            ))}
            {(agency.districtCoverage?.length ?? 0) > 0 && (
              <div className="flex items-start gap-3">
                <span className="text-[var(--text-muted)] mt-0.5 flex-shrink-0"><MapPin size={14} /></span>
                <div className="min-w-0">
                  <p className="font-[var(--font-body)] text-xs text-[var(--text-sub)] mb-0.5">Districts</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {agency.districtCoverage!.map(d => (
                      <span key={d} className="font-[var(--font-body)] text-xs bg-white border border-[var(--border)] text-[var(--text)] px-1.5 py-0.5 rounded">{d}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <span className="text-[var(--text-muted)] mt-0.5 flex-shrink-0"><Hash size={14} /></span>
              <div className="min-w-0">
                <p className="font-[var(--font-body)] text-xs text-[var(--text-sub)] mb-0.5">ID</p>
                <span className="font-[var(--font-body)] text-xs bg-white border border-[var(--border)] px-1.5 py-0.5 rounded break-all">{agency.id}</span>
              </div>
            </div>
          </div>

          <button onClick={async () => { setToggling(true); await onToggle(agency); setToggling(false); onClose(); }}
            disabled={toggling}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium border"
            style={agency.isActive ? { background: '#fef2f2', color: 'var(--error)', borderColor: '#fecaca' } : { background: '#F4F4F5', color: 'var(--blue)', borderColor: '#E4E4E7' }}>
            {toggling ? <Loader2 size={14} className="animate-spin" /> : <Power size={14} />}
            {agency.isActive ? 'Deactivate Agency' : 'Activate Agency'}
          </button>
      </div>
    </Modal>
  );
}

// ── Agencies Tab ───────────────────────────────────────────────────────────────
function AgenciesTab() {
  const { authFetch } = useAuth();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Agency | null>(null);
  const [page, setPage] = useState(1);

  const fetchAgencies = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20', ...(statusFilter ? { status: statusFilter } : {}) });
    const data = await authFetch(`/agencies?${params}`);
    if (data) {
      const raw = data as { agencies?: any[]; data?: { agencies?: any[]; pagination?: Pagination }; pagination?: Pagination };
      const list: any[] = raw.data?.agencies ?? raw.agencies ?? (Array.isArray(data) ? (data as any[]) : []);
      const mapped: Agency[] = list.map(a => ({
        id: a._id ?? a.id,
        name: a.name,
        contactPerson: a.contactPerson,
        contactPhone: a.phone ?? a.contactPhone ?? '',
        contactEmail: a.email ?? a.contactEmail,
        licenseNumber: a.licenseNumber,
        licenseExpiry: a.licenseExpiry,
        isActive: a.isActive ?? a.status === 'active',
        featured: a.featured ?? false,
        rating: a.rating ?? 0,
        complianceScore: a.complianceScore ?? 100,
        vehiclesCount: a.vehiclesCount ?? 0,
        driversCount: a.driversCount ?? 0,
        completedTrips: a.completedTrips ?? 0,
        districtCoverage: a.districtCoverage ?? a.provinces,
        createdAt: a.createdAt,
      }));
      const pag = raw.pagination ?? raw.data?.pagination;
      setAgencies(search ? mapped.filter(a => a.name.toLowerCase().includes(search.toLowerCase())) : mapped);
      if (pag) setPagination(pag);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAgencies(); }, [page, statusFilter]);
  useEffect(() => { const t = setTimeout(fetchAgencies, 350); return () => clearTimeout(t); }, [search]);

  const toggleAgency = async (agency: Agency) => {
    await authFetch(`/agencies/${agency.id}`, { method: 'PATCH', body: JSON.stringify({ status: agency.isActive ? 'inactive' : 'active' }) });
    fetchAgencies();
  };

  const toggleFeatured = async (agency: Agency) => {
    await authFetch(`/agencies/${agency.id}`, { method: 'PATCH', body: JSON.stringify({ featured: !agency.featured }) });
    fetchAgencies();
  };

  return (
    <>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input className="w-full pl-9 pr-4 py-2.5 text-sm border border-[var(--border)] rounded-md focus:outline-none focus:border-[var(--info)] bg-white placeholder:text-[var(--text-muted)]"
            placeholder="Search agencies…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="relative">
          <select className="appearance-none bg-white border border-[var(--border)] rounded-md pl-3 pr-8 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--info)] cursor-pointer"
            value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}><Plus size={14} /> Add Agency</Button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <StatCard label="Total Agencies" value={pagination.total} sub="All registered" icon={<Bus size={13} />} />
        <StatCard label="Active" value={Array.isArray(agencies) ? agencies.filter(a => a.isActive).length : 0} sub="Currently active" icon={<Check size={13} />} />
        <StatCard label="Suspended" value={Array.isArray(agencies) ? agencies.filter(a => !a.isActive).length : 0} sub="Not active" icon={<X size={13} />} />
      </div>

      <div className="bg-white rounded-md border border-[var(--border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F8FAFB] border-b border-[var(--border)]">
              {['Agency', 'Fleet', 'Compliance', 'Rating', 'Contact', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left font-[var(--font-body)] text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className={`h-4 bg-[#F9FAFB] rounded skeleton ${j === 0 ? 'w-36' : 'w-16'}`} /></td>
                    ))}
                  </tr>
                ))
              : !Array.isArray(agencies) || agencies.length === 0
              ? (
                <tr><td colSpan={7} className="py-14 text-center"><Bus size={28} className="mx-auto mb-3 text-[var(--text-muted)]" /><p className="font-[var(--font-body)] text-sm text-[var(--text-sub)]">No agencies found</p></td></tr>
              )
              : Array.isArray(agencies) && agencies.map((agency, i) => (
                <motion.tr key={agency.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.02 * i }}
                  className="hover:bg-[#F8FAFB] transition-colors cursor-pointer" onClick={() => setSelected(agency)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(29,78,216,0.06)' }}>
                        <Bus size={14} color="var(--info)" />
                      </div>
                      <div>
                        <p className="font-[var(--font-body)] font-medium text-[var(--text)]">
                          {agency.name}
                          {agency.featured && <Star size={12} className="inline ml-1.5 mb-0.5 text-[#F59E0B]" fill="currentColor" />}
                        </p>
                        {agency.contactPerson && <p className="font-[var(--font-body)] text-xs text-[var(--text-sub)]">{agency.contactPerson}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-[var(--font-body)] text-xs space-y-0.5">
                      <div className="flex items-center gap-1 text-[var(--text)]"><Bus size={10} className="text-[var(--text-muted)]" />{agency.vehiclesCount} buses</div>
                      <div className="flex items-center gap-1 text-[var(--text-sub)]"><Users size={10} className="text-[var(--text-muted)]" />{agency.driversCount} drivers</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[#F9FAFB] rounded-full w-16 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${agency.complianceScore}%`, background: agency.complianceScore >= 80 ? '#1D4ED8' : agency.complianceScore >= 60 ? '#f59e0b' : '#ef4444' }} />
                      </div>
                      <span className="font-[var(--font-body)] text-xs font-semibold text-[var(--text)]">{agency.complianceScore}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {agency.rating > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-[var(--blue-light)] text-[var(--blue)]">
                        <Star size={10} fill="currentColor" />{Number(agency.rating).toFixed(1)}
                      </span>
                    ) : <span className="text-xs text-[var(--text-muted)]">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-sub)]">
                    <div className="flex items-center gap-1"><Phone size={10} className="text-[var(--text-muted)]" />{agency.contactPhone}</div>
                  </td>
                  <td className="px-4 py-3"><ActiveBadge active={agency.isActive} /></td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <RowMenu isActive={agency.isActive} onView={() => setSelected(agency)} onToggle={() => toggleAgency(agency)}
                      extras={[{
                        icon: <Star size={13} />,
                        label: agency.featured ? 'Remove from top' : 'Feature at top',
                        color: '#f59e0b',
                        action: () => toggleFeatured(agency),
                      }]}
                    />
                  </td>
                </motion.tr>
              ))
            }
          </tbody>
        </table>
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)] bg-[#F8FAFB]">
            <p className="font-[var(--font-body)] text-xs text-[var(--text-muted)]">Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-xs rounded-sm border border-[var(--border)] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed">Previous</button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(pagination.totalPages - 4, page - 2)) + i;
                return <button key={p} onClick={() => setPage(p)} className="w-8 h-7 text-xs rounded-sm border transition-colors" style={p === page ? { background: 'var(--info)', color: 'white', borderColor: 'var(--info)' } : { background: 'white', color: '#64748b', borderColor: '#e2e8f0' }}>{p}</button>;
              })}
              <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages} className="px-3 py-1.5 text-xs rounded-sm border border-[var(--border)] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        <AddAgencyModal key="add" open={showAdd} onClose={() => setShowAdd(false)} onSave={fetchAgencies} />
        {selected && (
          <AgencyDrawer key={selected.id} agency={selected} onClose={() => setSelected(null)}
            onToggle={async (a) => { await toggleAgency(a); }} />
        )}
      </AnimatePresence>
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function OrganisationsPage() {
  const [activeTab, setActiveTab] = useState<'agencies'>('agencies');

  const tabs: Array<{ key: 'agencies'; label: string; icon: React.ReactNode; color: string }> = [
    { key: 'agencies', label: 'Agencies', icon: <Bus size={14} />,           color: 'var(--info)' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Organisations" subtitle="Manage transport agencies" />

      <div className="flex items-center gap-2 border-b border-[var(--border)]">
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="relative flex items-center gap-2 px-4 py-2.5 font-[var(--font-body)] text-sm font-semibold transition-all rounded-t-md"
              style={active ? { color: tab.color, background: `${tab.color}08` } : { color: '#94a3b8', background: 'transparent' }}>
              <span style={{ color: active ? tab.color : '#94a3b8' }}>{tab.icon}</span>
              {tab.label}
              {active && (
                <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-md" style={{ background: tab.color }} />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
          {activeTab === 'agencies' ? <AgenciesTab /> : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
