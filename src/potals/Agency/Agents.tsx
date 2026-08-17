import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus, Search, X, Check,
  Power, Loader2, Trash2, MapPin, Edit3,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api';
import { PhoneInput } from '../../components/ui';
import { viaLabel } from '../../utils/via';

interface AgentRecord {
  _id: string;
  name: string;
  email: string;
  phone: string;
  username: string;
  isActive: boolean;
  assignedRoutes?: { _id: string; origin: string; destination: string; type: string }[];
  createdAt: string;
}

function InviteAgentModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [setupUrl, setSetupUrl] = useState('');

  const handleSubmit = async () => {
    if (!form.name || !form.email) { setError('Name and email are required.'); return; }
    setSaving(true); setError('');
    try {
      const res = await api.createUserWithInvite({
        name: form.name, email: form.email, phone: form.phone || undefined,
        role: 'agent',
      });
      if (res?.data) {
        setSetupUrl(res.data.setupUrl || '');
        setSuccess(true);
        setTimeout(() => { onSave(); onClose(); }, 1800);
      } else {
        setError('Failed to create agent');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create agent');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(42,47,78,0.70)] p-4">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-md w-full max-w-lg overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h3 className="font-[var(--font-body)] text-base font-semibold text-zinc-950">Invite Agent</h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-[#F9FAFB] text-[var(--text-muted)] transition-colors"><X size={16} /></button>
        </div>
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div key="ok" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-6 py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--blue-light)] border border-zinc-200 flex items-center justify-center mx-auto mb-4"><Check size={28} className="text-[var(--blue)]" /></div>
              <p className="font-[var(--font-body)] text-lg font-semibold text-zinc-950">Agent Invited!</p>
              <p className="font-[var(--font-body)] text-sm text-[var(--text-sub)] mt-1">A setup link has been sent to <strong>{form.email}</strong></p>
              {setupUrl && (
                <div className="mt-3 bg-[#F9FAFB] border border-[var(--border)] rounded-md px-3 py-2 text-xs text-[var(--text-sub)] break-all">
                  <p className="font-semibold mb-1">Setup URL (dev mode):</p>
                  <a href={setupUrl} className="text-[var(--blue)] underline" target="_blank" rel="noopener noreferrer">{setupUrl}</a>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="form" className="px-6 py-5 space-y-4">
              {error && (
                <div className="flex items-center gap-2 text-sm text-[var(--text-sub)] bg-[#F9FAFB] px-3 py-2.5 rounded-md border border-[var(--border)]">
                  <span>{error}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wide mb-1.5">Full Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full h-12 px-4 rounded-md border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--blue)]" placeholder="Agent name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wide mb-1.5">Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full h-12 px-4 rounded-md border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--blue)]" placeholder="agent@example.com" />
                </div>
                <PhoneInput
                  label="Phone"
                  value={form.phone}
                  onChange={(val) => setForm(f => ({ ...f, phone: val }))}
                  placeholder="7XX XXX XXX"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--border)]">
                <button onClick={onClose}
                  className="h-9 px-4 rounded-md border border-[var(--border)] text-sm font-medium bg-[#F9FAFB] hover:bg-[#F3F4F6] text-zinc-700 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={saving || !form.name || !form.email}
                  className="h-9 px-4 rounded-md bg-[var(--blue)] text-white text-sm font-medium hover:bg-[var(--blue-dark)] disabled:opacity-50 transition-colors">
                  {saving ? 'Sending…' : 'Send Invite'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function EditAgentRoutesModal({ agent, onClose, onSave }: { agent: AgentRecord; onClose: () => void; onSave: () => void }) {
  const [assignedRouteIds, setAssignedRouteIds] = useState<string[]>(
    (agent.assignedRoutes || []).map((r: any) => r._id || r)
  );
  const [allRoutes, setAllRoutes] = useState<any[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [routeSearch, setRouteSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    setLoadingRoutes(true);
    try {
      const res = await api.getRoutes({ limit: '200' });
      const routes = res.data?.routes || res.routes || [];
      setAllRoutes(Array.isArray(routes) ? routes : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load routes');
    }
    setLoadingRoutes(false);
  };

  const toggleRoute = (routeId: string) => {
    setAssignedRouteIds(prev =>
      prev.includes(routeId) ? prev.filter(id => id !== routeId) : [...prev, routeId]
    );
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      await api.updateAgentAssignedRoutes(agent._id, assignedRouteIds);
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
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Manage routes for <strong>{agent.name}</strong></p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-[#F9FAFB] text-[var(--text-muted)] transition-colors"><X size={16} /></button>
        </div>

        <div className="px-6 py-4 shrink-0">
          {error && (
            <div className="flex items-center gap-2 text-sm text-[var(--text-sub)] bg-[#F9FAFB] px-3 py-2.5 rounded-md border border-[var(--border)] mb-3">
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

export default function AgencyAgentsPage() {
  const { authFetch } = useAuth();
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentRecord | null>(null);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/users?role=agent');
      if (res) {
        const data = res.data?.users || res.users || [];
        setAgents(Array.isArray(data) ? data : []);
      }
    } catch {}
    setLoading(false);
  }, [authFetch]);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  const toggleAgent = async (agent: AgentRecord) => {
    await authFetch(`/users/${agent._id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: !agent.isActive }),
    });
    fetchAgents();
  };

  const handleDelete = async (agent: AgentRecord) => {
    if (!confirm(`Delete agent "${agent.name}"? This action cannot be undone.`)) return;
    try {
      await api.deleteUser(agent._id);
      fetchAgents();
    } catch {}
  };

  const filtered = agents.filter(a =>
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-zinc-950">Agents</h1>
          <p className="text-sm text-[var(--text-sub)] mt-0.5">Manage your booking agents and route assignments</p>
        </div>
        <button onClick={() => setShowInvite(true)}
          className="h-9 px-4 rounded-md border border-[var(--border)] text-sm font-medium bg-[#F9FAFB] hover:bg-[#F3F4F6] text-zinc-700 transition-colors inline-flex items-center gap-2">
          <UserPlus size={14} /> Invite Agent
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="w-full h-10 pl-9 pr-4 rounded-md border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--blue)]"
          placeholder="Search agents..." />
      </div>

      <div className="bg-white rounded-md border border-[var(--border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F9FAFB] border-b border-[var(--border)]">
              {['Agent', 'Email', 'Phone', 'Routes', 'Status', 'Created', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-sub)]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 bg-[#F9FAFB] rounded w-4/5 animate-pulse" /></td>
                ))}</tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="py-14 text-center text-sm text-[var(--text-muted)]">No agents found</td></tr>
            ) : filtered.map((a, i) => (
              <motion.tr key={a._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.02 * i }}
                className="hover:bg-[#F9FAFB] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-[var(--blue)] flex items-center justify-center text-xs font-bold text-white">{a.name?.[0]}</div>
                    <span className="font-medium text-zinc-950">{a.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-[var(--text-sub)]">{a.email}</td>
                <td className="px-4 py-3 text-xs text-[var(--text-sub)]">{a.phone || '—'}</td>
                <td className="px-4 py-3">
                  {a.assignedRoutes && a.assignedRoutes.length > 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-100 text-blue-700">
                      <MapPin size={10} />
                      {a.assignedRoutes.length} route{a.assignedRoutes.length !== 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--text-muted)]">No routes</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md ${a.isActive ? 'bg-blue-600 text-white' : 'bg-[#F9FAFB] text-[var(--text-sub)]'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${a.isActive ? 'bg-white' : 'bg-zinc-400'}`} />
                    {a.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{new Date(a.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditingAgent(a)}
                      className="p-1.5 rounded-md hover:bg-[#F9FAFB] text-[var(--text-muted)] hover:text-zinc-700 transition-colors cursor-pointer border-none"
                      title="Edit routes"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => toggleAgent(a)}
                      className="p-1.5 rounded-md hover:bg-[#F9FAFB] text-[var(--text-muted)] transition-colors cursor-pointer border-none"
                      title={a.isActive ? 'Deactivate' : 'Activate'}
                    >
                      <Power size={14} className={a.isActive ? 'text-[var(--text-muted)]' : 'text-[var(--blue)]'} />
                    </button>
                    <button onClick={() => handleDelete(a)}
                      className="p-1.5 rounded-md hover:bg-red-50 text-[var(--text-muted)] hover:text-red-500 transition-colors cursor-pointer border-none"
                      title="Delete agent"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {showInvite && (
          <InviteAgentModal onClose={() => setShowInvite(false)} onSave={fetchAgents} />
        )}
        {editingAgent && (
          <EditAgentRoutesModal agent={editingAgent} onClose={() => setEditingAgent(null)} onSave={fetchAgents} />
        )}
      </AnimatePresence>
    </div>
  );
}
