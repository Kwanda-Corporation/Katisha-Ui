import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, Search, X, Check, AlertCircle,
  MoreHorizontal, Eye, Power, Mail, Phone, Shield, Clock,
  ChevronDown, RefreshCw, Building2, Trash2,
  User, Loader2, Route, MapPin,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PageHeader, Button, Input, PhoneInput, Modal } from '../../components/ui';
import { api } from '../../api';
import { viaLabel } from '../../utils/via';

export type UserRole = 'user' | 'agent' | 'system_admin';

export type UserStatus = 'active' | 'inactive' | 'suspended';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  organization: string;
  status: UserStatus;
  emailVerified: boolean;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
}

interface Pagination { page: number; limit: number; total: number; totalPages: number }

interface RoleMeta { label: string; className: string; icon: React.ReactNode; description: string }

// `agency_admin` and `pickup_agent` are kept for badge display only — they are
// functional roles used elsewhere in the system, so existing accounts must
// still render accurately. They are NOT selectable in this section.
const ROLE_META: Record<string, RoleMeta> = {
  system_admin:  { label: 'System Admin',  className: 'bg-[var(--blue-light)] text-[var(--blue-dark)]', icon: <Shield size={12} />, description: 'Full system access' },
  agency_admin:  { label: 'Agency Admin',  className: 'bg-[var(--blue-light)] text-[var(--blue-dark)]', icon: <Building2 size={12} />, description: 'Transport agency admin' },
  agent:         { label: 'Agent',         className: 'bg-[var(--blue-light)] text-[var(--blue-dark)]', icon: <User size={12} />, description: 'Booking agent' },
  user:          { label: 'Normal User',   className: 'bg-[#F9FAFB] text-[var(--text-sub)]', icon: <User size={12} />, description: 'Regular passenger' },
  pickup_agent:  { label: 'Pickup Agent',  className: 'bg-[#F9FAFB] text-[var(--text-sub)]', icon: <User size={12} />, description: 'Student pickup verification' },
};

const STATUS_META: Record<UserStatus, { label: string; className: string; dotClass: string }> = {
  active:    { label: 'Active',    className: 'bg-[var(--blue-light)] text-[var(--blue-dark)]', dotClass: 'bg-zinc-1000' },
  inactive:  { label: 'Inactive',  className: 'bg-[#F9FAFB] text-[var(--text-sub)]', dotClass: 'bg-zinc-400' },
  suspended: { label: 'Suspended', className: 'bg-[#F9FAFB] text-[var(--text-sub)]', dotClass: 'bg-zinc-400' },
};

const ALL_ROLES: UserRole[] = [
  'system_admin',
  'agent', 'user',
];

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function RoleBadge({ role }: { role: UserRole }) {
  const meta = ROLE_META[role] ?? ROLE_META.user;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md ${meta.className}`}>
      {meta.icon} {meta.label}
    </span>
  );
}

function StatusBadge({ status, verified }: { status: UserStatus; verified: boolean }) {
  const meta = STATUS_META[status] ?? STATUS_META.inactive;
  return (
    <div className="flex flex-col gap-1">
      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md ${meta.className}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
        {meta.label}
      </span>
      {!verified && (
        <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
          <AlertCircle size={10} /> Unverified
        </span>
      )}
    </div>
  );
}

function RowMenu({
  user,
  onViewProfile,
  onToggle,
  onAssignRoutes,
  onDelete,
  canDelete,
}: {
  user: UserRecord;
  onViewProfile: () => void;
  onToggle: () => void;
  onAssignRoutes: () => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleOpen = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setOpenUpward(window.innerHeight - rect.bottom < 170);
    }
    setOpen(v => !v);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
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
            initial={{ opacity: 0, scale: 0.95, y: openUpward ? 4 : -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 z-[200] bg-white border border-[var(--border)] rounded-md py-1 w-44"
            style={{ [openUpward ? 'bottom' : 'top']: '2.25rem' }}
          >
            <button
              onClick={() => { onViewProfile(); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--blue-light)] transition-colors"
            >
              <Eye size={13} /> View profile
            </button>
            {user.role === 'agent' && (
              <button
                onClick={() => { onAssignRoutes(); setOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--blue-light)] transition-colors"
              >
                <Route size={13} /> Assign routes
              </button>
            )}
            <div className="border-t border-[var(--border)] my-1" />
            <button
              onClick={() => { onToggle(); setOpen(false); }}
              className={`flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-[var(--blue-light)] transition-colors ${user.isActive ? 'text-[var(--text-muted)]' : 'text-[var(--blue)]'}`}
            >
              <Power size={13} />
              {user.isActive ? 'Deactivate' : 'Activate'}
            </button>
            {canDelete && (
              <>
                <div className="border-t border-[var(--border)] my-1" />
                <button
                  onClick={() => { onDelete(); setOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={13} /> Delete user
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AssignRoutesModal({ userId, userName, onClose, onSave }: { userId: string; userName: string; onClose: () => void; onSave: () => void }) {
  const [assignedRouteIds, setAssignedRouteIds] = useState<string[]>([]);
  const [allRoutes, setAllRoutes] = useState<any[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [routeSearch, setRouteSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoadingRoutes(true);
      try {
        const [routesRes, assignedRes] = await Promise.all([
          api.getRoutes({ limit: '200' }),
          api.getAgentAssignedRoutes(userId),
        ]);
        const routes = routesRes.data?.routes || routesRes.routes || [];
        setAllRoutes(Array.isArray(routes) ? routes : []);
        const assigned = assignedRes.data?.routes || assignedRes.data?.assignedRoutes || assignedRes.routes || [];
        setAssignedRouteIds((Array.isArray(assigned) ? assigned : []).map((r: any) => r._id || r));
      } catch (err: any) {
        setError(err.message || 'Failed to load routes');
      }
      setLoadingRoutes(false);
    })();
  }, [userId]);

  const toggleRoute = (routeId: string) => {
    setAssignedRouteIds(prev =>
      prev.includes(routeId) ? prev.filter(id => id !== routeId) : [...prev, routeId]
    );
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      await api.updateAgentAssignedRoutes(userId, assignedRouteIds);
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save route assignments');
    }
    setSaving(false);
  };

  const filteredRoutes = allRoutes.filter(r => {
    const query = routeSearch.toLowerCase();
    if (!query) return true;
    return r.origin?.toLowerCase().includes(query) ||
           r.destination?.toLowerCase().includes(query) ||
           `${r.origin} → ${r.destination}`.toLowerCase().includes(query);
  });

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(42,47,78,0.70)] p-4">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-md w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
          <div>
            <h3 className="font-[var(--font-body)] text-base font-semibold text-zinc-950">Assigned Routes</h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Manage routes for <strong>{userName}</strong></p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-[#F9FAFB] text-[var(--text-muted)] transition-colors"><X size={16} /></button>
        </div>

        <div className="px-6 py-4 shrink-0">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2.5 rounded-md mb-3">
              <span>{error}</span>
            </div>
          )}
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={routeSearch}
              onChange={e => setRouteSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-md border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--blue)]"
              placeholder="Search routes by origin or destination..."
            />
          </div>
          <div className="text-xs text-[var(--text-muted)] mb-1">
            {assignedRouteIds.length} route{assignedRouteIds.length !== 1 ? 's' : ''} assigned
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-4 min-h-0">
          {loadingRoutes ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={20} className="animate-spin text-[var(--text-muted)]" />
            </div>
          ) : filteredRoutes.length === 0 ? (
            <div className="text-center py-10 text-sm text-[var(--text-muted)]">No routes found</div>
          ) : (
            <div className="space-y-1.5">
              {filteredRoutes.map(route => {
                const isSelected = assignedRouteIds.includes(route._id);
                return (
                  <button
                    key={route._id}
                    onClick={() => toggleRoute(route._id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-md border text-left text-sm transition-all cursor-pointer ${
                      isSelected
                        ? 'border-zinc-300 bg-[var(--blue-light)] text-blue-900'
                        : 'border-[var(--border)] bg-white text-zinc-700 hover:border-zinc-300 hover:bg-[#F9FAFB]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <MapPin size={14} className={isSelected ? 'text-blue-500' : 'text-[var(--text-muted)]'} />
                      <span className="font-medium">{route.origin} → {route.destination}<span className="text-[var(--text-muted)] font-normal">{viaLabel(route.via)}</span></span>
                    </div>
                    <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                      isSelected ? 'bg-[var(--blue)] border-[var(--blue)]' : 'border-zinc-300 bg-white'
                    }`}>
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)] shrink-0">
          <button onClick={onClose}
            className="h-9 px-4 rounded-md border border-[var(--border)] text-sm font-medium bg-[#F9FAFB] hover:bg-[#F3F4F6] text-zinc-700 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="h-9 px-4 rounded-md bg-[var(--blue)] text-white text-sm font-medium hover:bg-[var(--blue-dark)] disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : 'Save Assignments'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function RegisterUserModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', role: '' as string,
    agencyId: '',
  });
  const [agencies, setAgencies] = useState<Array<{ _id: string; name: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [setupUrl, setSetupUrl] = useState('');

  const needsAgency = form.role === 'agency_admin';

  useEffect(() => {
    if (needsAgency) {
      api.getAgencies().then(res => setAgencies(res.data?.agencies || [])).catch(() => {});
    }
  }, [needsAgency]);

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.role) {
      setError('Name, email, and role are required.');
      return;
    }
    if (needsAgency && !form.agencyId) {
      setError('Please select an agency for this user.');
      return;
    }
    setSaving(true); setError('');
    try {
      const res = await api.createUserWithInvite({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        role: form.role,
        agencyId: form.agencyId || undefined,
      });
      if (res?.data) {
        setSetupUrl(res.data.setupUrl || '');
        setSuccess(true);
        setTimeout(() => { onSave(); onClose(); }, 1800);
      } else {
        setError('Failed to create user');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(42,47,78,0.70)] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="bg-white rounded-md w-full max-w-lg overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-[var(--blue)]/10 flex items-center justify-center">
              <UserPlus size={16} className="text-[var(--blue)]" />
            </div>
            <h3 className="font-[var(--font-body)] text-base font-semibold text-[var(--text)]">Invite New User</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-[var(--blue-light)] text-[var(--text-muted)] transition-colors">
            <X size={16} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-6 py-12 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-[var(--blue-light)] border border-zinc-200 flex items-center justify-center mx-auto mb-4">
                <Check size={28} className="text-[var(--blue)]" />
              </div>
              <p className="font-[var(--font-body)] text-lg font-semibold text-[var(--text)]">User Invited!</p>
              <p className="font-[var(--font-body)] text-sm text-[var(--text-sub)] mt-1">
                A setup link has been sent to <strong>{form.email}</strong>
              </p>
              {setupUrl && (
                <div className="mt-3 bg-[#F9FAFB] border border-[var(--border)] rounded-md px-3 py-2 text-xs text-[var(--text-sub)] break-all">
                  <p className="font-semibold mb-1">Setup URL (dev mode):</p>
                  <a href={setupUrl} className="text-[var(--blue)] underline" target="_blank" rel="noopener noreferrer">{setupUrl}</a>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="form" className="px-6 py-5 space-y-4">{error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-sm text-[var(--error)] bg-[var(--error-bg)] px-3 py-2.5 rounded-md border border-[var(--error-border)]"
                >
                  <AlertCircle size={14} className="flex-shrink-0" /> {error}
                </motion.div>
              )}

              <div>
                <label className="block font-[var(--font-body)] text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wide mb-2">
                  Role <span className="text-blue-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['system_admin', 'agent', 'user'] as const).map(role => {
                    const m = ROLE_META[role as UserRole];
                    const active = form.role === role;
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, role, agencyId: '' }))}
                        className={`flex items-center gap-2 p-3 rounded-md border text-left transition-all ${active ? m.className : 'bg-white text-[var(--text-muted)] border-[var(--border)]'}`}
                        style={active ? { borderColor: 'currentColor' } : {}}
                      >
                        <span>{m.icon}</span>
                        <div>
                          <span className="text-sm font-medium leading-tight block">{m.label}</span>
                          <span className="text-xs opacity-75">{m.description}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {form.role === 'agent' && (
                <p className="mt-2 text-xs text-[var(--text-sub)] bg-[var(--blue-light)] border border-zinc-200 rounded-md px-3 py-2">
                  Agents are agency-independent. Assign their routes after the account is created.
                </p>
              )}

              <Input
                label="Full Name *"
                placeholder="First and last name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Email *"
                  type="email"
                  placeholder="user@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
                <PhoneInput
                  label="Phone"
                  value={form.phone}
                  onChange={(val) => setForm(f => ({ ...f, phone: val }))}
                  placeholder="7XX XXX XXX"
                />
              </div>

              <AnimatePresence>
                {needsAgency && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <label className="block font-[var(--font-body)] text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wide mb-1.5">
                      Agency <span className="text-blue-400">*</span>
                    </label>
                    <div className="relative">
                      <select
                        className="w-full h-12 px-4 rounded-md border border-[var(--border)] bg-white font-[var(--font-body)] text-base text-[var(--text)] appearance-none focus:outline-none focus:border-[var(--blue)] cursor-pointer"
                        value={form.agencyId}
                        onChange={e => setForm(f => ({ ...f, agencyId: e.target.value }))}
                      >
                        <option value="">Select agency</option>
                        {agencies.map(a => (
                          <option key={a._id} value={a._id}>{a.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="bg-[var(--bg)] rounded-md px-3 py-2.5 flex items-start gap-2 border border-[var(--border)]">
                <Mail size={13} className="text-[var(--text-muted)] mt-0.5 flex-shrink-0" />
                <p className="font-[var(--font-body)] text-xs text-[var(--text-sub)]">
                  The user will receive an email with a link to set up their account. Their account remains inactive until they complete setup.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--border)]">
                <Button variant="secondary" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSubmit}
                  disabled={saving || !form.name || !form.email || !form.role || (needsAgency && !form.agencyId)}
                  loading={saving}
                >
                  {saving ? 'Sending invite…' : 'Send Invite'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function UserDrawer({
  user,
  onClose,
  onToggle,
}: {
  user: UserRecord;
  onClose: () => void;
  onToggle: (user: UserRecord) => void;
}) {
  const statusMeta = STATUS_META[user.status] ?? STATUS_META.inactive;
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    await onToggle(user);
    setToggling(false);
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="User Profile" maxWidth={560}>
      <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-md flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
              style={{ background: user.role ? `var(--blue)` : 'var(--blue)' }}
            >
              {user.name[0]}
            </div>
            <div className="min-w-0">
              <p className="font-[var(--font-body)] font-semibold text-[var(--text)] text-base truncate">{user.name}</p>
              <div className="mt-1">
                <RoleBadge role={user.role} />
                </div>
              </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md ${statusMeta.className}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClass}`} />
              {statusMeta.label}
            </span>
            {!user.emailVerified && (
              <span className="text-xs text-[var(--text-sub)] bg-[#F9FAFB] border border-[var(--border)] px-2 py-0.5 rounded-md flex items-center gap-1">
                <AlertCircle size={10} /> Unverified email
              </span>
            )}
          </div>

          <div className="bg-[var(--bg)] rounded-md p-4 space-y-3.5 border border-[var(--border)]">
            {[
              { icon: <Mail size={14} />,     label: 'Email',        value: user.email },
              { icon: <Phone size={14} />,    label: 'Phone',        value: user.phoneNumber || '—' },
              { icon: <Building2 size={14} />,label: 'Organization', value: user.organization
                ? <span className="font-mono text-[var(--text)] text-xs bg-white border border-[var(--border)] px-1.5 py-0.5 rounded">{user.organization}</span>
                : '—'
              },
              { icon: <Clock size={14} />,    label: 'Last Login',   value: timeAgo(user.lastLogin) },
              { icon: <Clock size={14} />,    label: 'Registered',   value: new Date(user.createdAt).toLocaleDateString() },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <span className="text-[var(--text-muted)] mt-0.5 flex-shrink-0">{icon}</span>
                <div className="min-w-0">
                  <p className="font-[var(--font-body)] text-xs text-[var(--text-sub)] mb-0.5">{label}</p>
                  <p className="font-[var(--font-body)] text-sm text-[var(--text)] break-all">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 space-y-2">
            <Button variant="secondary" fullWidth size="sm">
              <Mail size={14} /> Resend Setup Email
            </Button>
            <button
              onClick={handleToggle}
              disabled={toggling}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors border ${user.isActive
                ? 'bg-[var(--error-bg)] text-[var(--error)] border-[var(--error-border)]'
                : 'bg-[var(--blue-light)] text-[var(--blue)] border-zinc-200'
              }`}
            >
              {toggling ? <Loader2 size={14} className="animate-spin" /> : <Power size={14} />}
              {user.isActive ? 'Deactivate Account' : 'Activate Account'}
            </button>
          </div>
      </div>
    </Modal>
  );
}

function DeleteUserModal({
  user,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  user: UserRecord;
  busy: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open onClose={onCancel} title="Delete user" maxWidth={480}>
      <div className="space-y-4">
        <p className="font-[var(--font-body)] text-sm text-[var(--text-sub)] leading-relaxed">
          This will permanently delete <strong className="text-[var(--text)]">{user.name}</strong>{' '}
          ({user.email || user.phoneNumber || 'no contact'}). Any accounts they manage and references will be removed.
          This action cannot be undone.
        </p>
        {error && (
          <div className="flex items-center gap-2 text-sm text-[var(--error)] bg-[var(--error-bg)] px-3 py-2.5 rounded-md border border-[var(--error-border)]">
            <AlertCircle size={14} className="flex-shrink-0" /> {error}
          </div>
        )}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--border)]">
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="h-9 px-4 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2 cursor-pointer"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {busy ? 'Deleting…' : 'Delete user'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function UsersPage() {
  const { authFetch, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('');
  const [showRegister, setShowRegister] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [assigningRoutes, setAssigningRoutes] = useState<UserRecord | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserRecord | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [page, setPage] = useState(1);

  const fetchUsers = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: '20',
      ...(search ? { search } : {}),
      ...(roleFilter ? { role: roleFilter } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    });
    const res = await authFetch(`/users?${params}`);
    if (res) {
      const data = res.data ?? res;
      const raw: any[] = data.users ?? data.data ?? (Array.isArray(data) ? data : []);
      const mapped: UserRecord[] = raw.map(u => ({
        id: u._id ?? u.id,
        name: u.name,
        email: u.email ?? '',
        phoneNumber: u.phoneNumber ?? u.phone ?? '',
        role: (u.role === 'user' || u.role === 'agent' || u.role === 'system_admin' || u.role === 'agency_admin' || u.role === 'pickup_agent')
          ? (u.role as UserRole)
          : 'user',
        organization: u.agency ?? u.organization ?? '',
        status: u.status ?? (u.isActive ? 'active' : 'inactive'),
        emailVerified: u.emailVerified ?? false,
        isActive: u.isActive ?? false,
        lastLogin: u.lastLogin ?? u.lastActive ?? null,
        createdAt: u.createdAt,
      }));
      setUsers(mapped);
      if (data.pagination) setPagination(data.pagination);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [page, roleFilter, statusFilter]);
  useEffect(() => {
    const t = setTimeout(fetchUsers, 400);
    return () => clearTimeout(t);
  }, [search]);

  const toggleUser = async (user: UserRecord) => {
    await authFetch(`/users/${user.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: !user.isActive }),
    });
    fetchUsers();
  };

  const deleteUser = async (user: UserRecord) => {
    setDeleteBusy(true);
    setDeleteError('');
    try {
      await api.deleteUser(user.id);
      setDeletingUser(null);
      fetchUsers();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete user');
    }
    setDeleteBusy(false);
  };

  const roleCounts = users.reduce<Partial<Record<UserRole, number>>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <PageHeader
        title="Users"
        subtitle={`${pagination.total} total users across all roles`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => { setPage(1); fetchUsers(); }}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowRegister(true)}>
              <UserPlus size={15} />
              Register User
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => { setRoleFilter(''); setPage(1); }}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border transition-all ${roleFilter === ''
            ? 'bg-[var(--blue)] text-white border-[var(--blue)]'
            : 'bg-white text-[var(--text-sub)] border-[var(--border)]'
          }`}
        >
          All&nbsp;
          <span className={`font-bold text-xs px-1.5 py-0.5 rounded ${roleFilter === '' ? 'bg-white/20 text-white' : 'bg-[var(--border)] text-[var(--text-sub)]'}`}>
            {pagination.total}
          </span>
        </button>

        {ALL_ROLES.map(role => {
          const meta = ROLE_META[role];
          const active = roleFilter === role;
          const count = roleCounts[role] ?? 0;
          return (
            <button
              key={role}
              onClick={() => { setRoleFilter(active ? '' : role); setPage(1); }}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border transition-all ${active
                ? 'bg-[var(--blue)] text-white border-[var(--blue)]'
                : 'bg-white text-[var(--text-sub)] border-[var(--border)]'
              }`}
            >
              <span className={active ? 'text-white' : meta.className.split(' ').find(c => c.startsWith('text-'))}>{meta.icon}</span>
              {meta.label}
              {count > 0 && (
                <span className={`font-bold text-xs px-1 rounded ${active ? 'text-white/70' : 'text-[var(--text-muted)]'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            className="w-full h-12 pl-9 pr-4 rounded-md border border-[var(--border)] bg-white font-[var(--font-body)] text-base font-normal text-[var(--text)] placeholder:text-[var(--text-muted)] placeholder:font-light transition-[border-color] duration-150 ease-out focus:outline-none focus:border-[var(--blue)]"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div className="relative">
          <select
            className="appearance-none h-12 pl-4 pr-10 rounded-md border border-[var(--border)] bg-white font-[var(--font-body)] text-base font-normal text-[var(--text)] transition-[border-color] duration-150 ease-out focus:outline-none focus:border-[var(--blue)] cursor-pointer"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value as UserStatus | ''); setPage(1); }}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
        </div>
      </div>

      <div className="bg-white rounded-md border border-[var(--border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F8FAFB] border-b border-[var(--border)]">
              {['User', 'Role', 'Status', 'Organization', 'Last Login', 'Created', ''].map(h => (
                <th
                  key={h}
                  className="px-4 py-3 text-left font-[var(--font-body)] text-xs font-semibold uppercase tracking-[0.5px] text-[#475569] whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className={`h-4 bg-[var(--border)] rounded animate-pulse ${j === 0 ? 'w-32' : 'w-20'}`} />
                    </td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="py-16 text-center">
                    <Users size={32} className="mx-auto mb-3 text-[var(--text-muted)]" />
                    <p className="font-[var(--font-body)] text-sm text-[var(--text-sub)]">No users found</p>
                    {(search || roleFilter || statusFilter) && (
                      <button
                        onClick={() => { setSearch(''); setRoleFilter(''); setStatusFilter(''); }}
                        className="mt-2 text-xs text-[var(--blue)] hover:underline"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user, i) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.02 * i }}
                  className="hover:bg-[var(--blue-light)] transition-colors cursor-pointer"
                  onClick={() => setSelectedUser(user)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: user.role ? `var(--blue)` : 'var(--blue)' }}
                      >
                        {user.name[0]}
                      </div>
                      <div>
                        <p className="font-[var(--font-body)] font-medium text-[var(--text)]">{user.name}</p>
                        <p className="font-[var(--font-body)] text-xs text-[var(--text-sub)]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={user.status} verified={user.emailVerified} />
                  </td>
                  <td className="px-4 py-3 text-[var(--text-sub)] text-xs max-w-[120px] truncate">
                    {user.organization ? (
                      <span className="font-mono bg-[var(--border)]/50 px-1.5 py-0.5 rounded text-[var(--text-sub)] text-xs">
                        {user.organization.slice(0, 8)}…
                      </span>
                    ) : (
                      <span className="text-[var(--text-muted)]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-sub)] whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Clock size={11} />
                      {timeAgo(user.lastLogin)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-sub)] whitespace-nowrap">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {currentUser?.id !== user.id && (
                        <button
                          onClick={() => { setDeleteError(''); setDeletingUser(user); }}
                          title={`Delete ${user.name}`}
                          className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                      <RowMenu
                        user={user}
                        onViewProfile={() => setSelectedUser(user)}
                        onToggle={() => toggleUser(user)}
                        onAssignRoutes={() => setAssigningRoutes(user)}
                        onDelete={() => { setDeleteError(''); setDeletingUser(user); }}
                        canDelete={currentUser?.id !== user.id}
                      />
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)] bg-[#F8FAFB]">
            <p className="font-[var(--font-body)] text-xs text-[var(--text-sub)]">
              Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs rounded-md border border-[var(--border)] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-[var(--font-body)] text-[var(--text)]"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(pagination.totalPages - 4, page - 2)) + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-7 text-xs rounded-md border transition-colors font-[var(--font-body)] ${p === page
                      ? 'bg-[var(--blue)] text-white border-[var(--blue)]'
                      : 'bg-white text-[var(--text-sub)] border-[var(--border)]'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="px-3 py-1.5 text-xs rounded-md border border-[var(--border)] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-[var(--font-body)] text-[var(--text)]"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showRegister && (
          <RegisterUserModal
            key="register"
            onClose={() => setShowRegister(false)}
            onSave={() => { fetchUsers(); setShowRegister(false); }}
          />
        )}
        {selectedUser && (
          <UserDrawer
            key={selectedUser.id}
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onToggle={async (u) => { await toggleUser(u); }}
          />
        )}
        {assigningRoutes && (
          <AssignRoutesModal
            key={`routes-${assigningRoutes.id}`}
            userId={assigningRoutes.id}
            userName={assigningRoutes.name}
            onClose={() => setAssigningRoutes(null)}
            onSave={fetchUsers}
          />
        )}
        {deletingUser && (
          <DeleteUserModal
            key={`delete-${deletingUser.id}`}
            user={deletingUser}
            busy={deleteBusy}
            error={deleteError}
            onCancel={() => { if (!deleteBusy) setDeletingUser(null); }}
            onConfirm={() => deleteUser(deletingUser)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
