import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Save, Loader, Mail, Phone, MapPin,
  Smartphone, Landmark, Check, ChevronDown, Pencil, Eye,
  Clock, Plus, Trash2, Bus, X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PageHeader } from '../../components/ui';
import { api } from '../../api';
import Bus3DViewer from '../../components/Bus3DViewer';

const ACCOUNT_TYPES = [
  { value: 'mom', label: 'MTN Mobile Money (MoMo)' },
  { value: 'airtel', label: 'Airtel Money' },
  { value: 'mpesa', label: 'M-Pesa' },
];

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  mom: 'MTN Mobile Money (MoMo)',
  airtel: 'Airtel Money',
  mpesa: 'M-Pesa',
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-sub)] mb-0.5">{label}</p>
      <p className="text-sm font-medium text-zinc-950">{value || <span className="text-[var(--text-muted)] italic">Not set</span>}</p>
    </div>
  );
}

function InfoChip({ label }: { label: string }) {
  return <span className="px-3 py-1.5 rounded-md bg-[#F9FAFB] text-xs font-medium text-zinc-700">{label}</span>;
}

export default function AgencySettings() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '',
    accountNumber: '', accountType: 'mom' as 'mom' | 'airtel' | 'mpesa', accountName: '',
    provinces: [] as string[],
    workingHours: [] as { dayOfWeek: number; start: string; end: string }[],
    busLayout: { enabled: false, rows: 10, leftPerRow: 2, rightPerRow: 2 },
    blockedDates: [] as string[],
  });
  const [savedForm, setSavedForm] = useState({ ...form });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newDateInput, setNewDateInput] = useState('');
  const [allProvinces, setAllProvinces] = useState<string[]>([]);

  useEffect(() => {
    if (user?.agency?._id) {
      setLoading(true);
      Promise.all([
        api.getAgency(user.agency._id),
        api.getProvinces().catch(() => ({ data: { provinces: [] } })),
      ]).then(([agencyRes, provincesRes]) => {
        const a = agencyRes.data.agency;
        const data = {
          name: a.name || '',
          email: a.email || '',
          phone: a.phone || '',
          address: a.address || '',
          accountNumber: a.accountNumber || '',
          accountType: a.accountType || 'mom',
          accountName: a.accountName || '',
          provinces: a.provinces || [],
          workingHours: a.workingHours || [],
          busLayout: a.busLayout || { enabled: false, rows: 10, leftPerRow: 2, rightPerRow: 2 },
          blockedDates: a.blockedDates?.map((d: string) => d.split('T')[0]) || [],
        };
        setForm(data);
        setSavedForm(data);
        setAllProvinces(provincesRes.data?.provinces || []);
      }).catch(() => {}).finally(() => setLoading(false));
    }
  }, [user]);

  const handleSave = async () => {
    if (!user?.agency?._id || !form.name) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      await api.updateAgency(user.agency._id, form);
      setSavedForm({ ...form });
      setSuccess('Agency settings saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally { setSaving(false); }
  };

  const toggleProvince = (p: string) => {
    setForm(f => ({ ...f, provinces: f.provinces.includes(p) ? f.provinces.filter(x => x !== p) : [...f.provinces, p] }));
  };

  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const addWorkingHour = () => {
    setForm(f => ({ ...f, workingHours: [...f.workingHours, { dayOfWeek: 0, start: '08:00', end: '17:00' }] }));
  };

  const updateWorkingHour = (index: number, field: string, value: any) => {
    const hours = [...form.workingHours];
    (hours[index] as any)[field] = value;
    setForm(f => ({ ...f, workingHours: hours }));
  };

  const removeWorkingHour = (index: number) => {
    setForm(f => ({ ...f, workingHours: f.workingHours.filter((_, i) => i !== index) }));
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader size={24} className="animate-spin text-[var(--blue)]" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Account Settings"
        subtitle="Manage your agency profile and payout details"
        actions={
          <button onClick={() => { setEditing(!editing); setError(''); setSuccess(''); }}
            className="h-9 px-4 rounded-md border border-[var(--border)] text-sm font-medium flex items-center gap-2 cursor-pointer bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-colors text-zinc-700"
          >
            {editing ? <><Eye size={15} /> View Mode</> : <><Pencil size={15} /> Edit</>}
          </button>
        }
      />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

        {/* Agency Profile */}
        <Section icon={<Building2 size={20} />} iconBg="bg-blue-600" title="Agency Profile" subtitle="Basic information about your agency">
          {editing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Agency Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
              <Field label="Email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} icon={<Mail size={15} className="text-[var(--text-muted)]" />} />
              <Field label="Phone" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} icon={<Phone size={15} className="text-[var(--text-muted)]" />} />
              <Field label="Address" value={form.address} onChange={v => setForm(f => ({ ...f, address: v }))} icon={<MapPin size={15} className="text-[var(--text-muted)]" />} />
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-zinc-700 block mb-2">Operating Provinces</label>
                <div className="flex flex-wrap gap-1.5">
                  {allProvinces.length === 0 ? (
                    <span className="text-xs text-[var(--text-muted)]">No provinces available</span>
                  ) : allProvinces.map(p => (
                    <button key={p} onClick={() => toggleProvince(p)}
                      className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all cursor-pointer border ${
                        form.provinces.includes(p) ? 'bg-[var(--blue-light)] border-zinc-300 text-[var(--blue-dark)]' : 'bg-white border-[var(--border)] text-[var(--text-sub)] hover:border-zinc-300'
                      }`}
                    >
                      {form.provinces.includes(p) && <Check size={10} className="inline mr-1" />}
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InfoRow label="Agency Name" value={savedForm.name} />
              <InfoRow label="Email" value={savedForm.email} />
              <InfoRow label="Phone" value={savedForm.phone} />
              <InfoRow label="Address" value={savedForm.address} />
              <div className="md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-sub)] mb-1.5">Operating Provinces</p>
                <div className="flex flex-wrap gap-1.5">
                  {savedForm.provinces.length === 0 ? (
                    <span className="text-xs text-[var(--text-muted)] italic">None</span>
                  ) : savedForm.provinces.map(p => <InfoChip key={p} label={p} />)}
                </div>
              </div>
            </div>
          )}
        </Section>

        {/* Operating Hours */}
        <Section icon={<Clock size={20} />} iconBg="bg-blue-600" title="Operating Hours" subtitle="Set your agency's working hours">
          {editing ? (
            <div className="space-y-3">
              {form.workingHours.map((h, i) => (
                <div key={i} className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <select value={h.dayOfWeek} onChange={e => updateWorkingHour(i, 'dayOfWeek', Number(e.target.value))}
                    className="w-full sm:w-32 h-9 px-3 rounded-md border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--blue)] bg-white"
                  >
                    {DAY_NAMES.map((name, d) => <option key={d} value={d}>{name}</option>)}
                  </select>
                  <input type="time" value={h.start} onChange={e => updateWorkingHour(i, 'start', e.target.value)}
                    className="flex-1 h-9 px-3 rounded-md border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--blue)]" />
                  <span className="text-xs text-[var(--text-sub)]">to</span>
                  <input type="time" value={h.end} onChange={e => updateWorkingHour(i, 'end', e.target.value)}
                    className="flex-1 h-9 px-3 rounded-md border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--blue)]" />
                  <button onClick={() => removeWorkingHour(i)}
                    className="h-9 w-9 rounded-sm flex items-center justify-center text-red-500 hover:bg-red-50 transition-all cursor-pointer bg-transparent border-none shrink-0">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <button onClick={addWorkingHour}
                className="h-9 px-4 rounded-md border border-dashed border-zinc-300 text-sm font-medium text-[var(--text-sub)] hover:border-blue-400 hover:text-[var(--blue)] transition-all cursor-pointer bg-transparent flex items-center gap-2">
                <Plus size={15} /> Add working hours
              </button>
              {form.workingHours.length === 0 && (
                <p className="text-xs text-[var(--text-muted)]">No working hours set. Your agency will accept bookings 24/7.</p>
              )}
            </div>
          ) : (
            <div>
              {savedForm.workingHours.length === 0 ? (
                <p className="text-sm text-[var(--text-sub)]">No working hours set. Agency accepts bookings 24/7.</p>
              ) : (
                <div className="space-y-2">
                  {savedForm.workingHours.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-zinc-700 w-28">{DAY_NAMES[h.dayOfWeek]}</span>
                      <span className="text-[var(--text-sub)]">{h.start} - {h.end}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Section>

        {/* Payout Information */}
        <Section icon={<Landmark size={20} />} iconBg="bg-blue-600" title="Payout Information" subtitle="Mobile money account where ticket payments are deposited">
          {editing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-medium text-zinc-700 block mb-1.5">Account Number</label>
                <div className="relative">
                  <Smartphone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input value={form.accountNumber} onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))}
                    className="w-full h-9 pl-10 pr-4 rounded-md border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--blue)]"
                    placeholder="+250 7XX XXX XXX" />
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">The phone number where ticket payments will be deposited</p>
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 block mb-1.5">Account Type</label>
                <div className="relative">
                  <select value={form.accountType} onChange={e => setForm(f => ({ ...f, accountType: e.target.value as any }))}
                    className="w-full h-9 px-4 rounded-md border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--blue)] appearance-none bg-white">
                    {ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-zinc-700 block mb-1.5">Account Name</label>
                <input value={form.accountName} onChange={e => setForm(f => ({ ...f, accountName: e.target.value }))}
                  className="w-full h-9 px-4 rounded-md border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--blue)]"
                  placeholder="Full name on the mobile money account" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InfoRow label="Account Number" value={savedForm.accountNumber} />
              <InfoRow label="Account Type" value={ACCOUNT_TYPE_LABELS[savedForm.accountType] || savedForm.accountType} />
              <div className="md:col-span-2"><InfoRow label="Account Name" value={savedForm.accountName} /></div>
            </div>
          )}
        </Section>

        {/* Bus Layout */}
        <Section icon={<Bus size={20} />} iconBg="bg-emerald-600" title="Bus Layout" subtitle="Configure seat layout for East African travels">
          {editing ? (
            <>
              <div className="flex items-center gap-4 mb-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={form.busLayout.enabled}
                    onChange={e => setForm(f => ({ ...f, busLayout: { ...f.busLayout, enabled: e.target.checked } }))}
                    className="sr-only peer" />
                  <div className="w-11 h-6 bg-[#F3F4F6] rounded-full peer peer-checked:bg-[var(--blue)] peer-focus:ring-2 peer-focus:ring-blue-300 transition-all" />
                  <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full  peer-checked:translate-x-5 transition-transform" />
                </label>
                <span className="text-sm font-medium text-zinc-700">Enable bus seat layout</span>
              </div>
              {form.busLayout.enabled && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-zinc-700 block mb-1">Rows</label>
                      <input type="number" min={1} max={20} value={form.busLayout.rows}
                        onChange={e => setForm(f => ({ ...f, busLayout: { ...f.busLayout, rows: Math.max(1, parseInt(e.target.value) || 1) } }))}
                        className="w-full h-9 px-3 rounded-md border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--blue)]" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-zinc-700 block mb-1">Left seats/row</label>
                      <input type="number" min={1} max={3} value={form.busLayout.leftPerRow}
                        onChange={e => setForm(f => ({ ...f, busLayout: { ...f.busLayout, leftPerRow: Math.max(1, Math.min(3, parseInt(e.target.value) || 1)) } }))}
                        className="w-full h-9 px-3 rounded-md border border-[var(--border)] text-sm" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-zinc-700 block mb-1">Right seats/row</label>
                      <input type="number" min={1} max={3} value={form.busLayout.rightPerRow}
                        onChange={e => setForm(f => ({ ...f, busLayout: { ...f.busLayout, rightPerRow: Math.max(1, Math.min(3, parseInt(e.target.value) || 1)) } }))}
                        className="w-full h-9 px-3 rounded-md border border-[var(--border)] text-sm" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-700 mb-2">Preview</p>
                    <Bus3DViewer
                      config={{ rows: form.busLayout.rows, leftPerRow: form.busLayout.leftPerRow, rightPerRow: form.busLayout.rightPerRow }}
                      selectedSeats={[]}
                      onSeatToggle={() => {}}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${form.busLayout.enabled ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
                <span className="text-sm font-medium text-zinc-700">Bus seat layout {form.busLayout.enabled ? 'enabled' : 'disabled'}</span>
              </div>
              {form.busLayout.enabled && (
                <div className="flex gap-4 text-sm text-[var(--text-sub)]">
                  <span>{form.busLayout.rows} rows</span>
                  <span>{form.busLayout.leftPerRow} left / {form.busLayout.rightPerRow} right per row</span>
                  <span className="font-semibold text-zinc-950">Total: {form.busLayout.rows * (form.busLayout.leftPerRow + form.busLayout.rightPerRow)} seats</span>
                </div>
              )}
            </div>
          )}
        </Section>

        {/* Blocked Dates */}
        <Section icon={<X size={20} />} iconBg="bg-red-600" title="Blocked Dates" subtitle="Dates when bookings are not accepted">
          {editing ? (
            <>
              <div className="flex gap-2">
                <input type="date"
                  className="flex-1 h-9 px-3 rounded-md border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--blue)]"
                  value={newDateInput}
                  onChange={e => setNewDateInput(e.target.value)}
                  min={new Date().toISOString().split('T')[0]} />
                <button onClick={() => {
                  if (!newDateInput || form.blockedDates.includes(newDateInput)) return;
                  setForm(f => ({ ...f, blockedDates: [...f.blockedDates, newDateInput].sort() }));
                  setNewDateInput('');
                }} disabled={!newDateInput}
                  className="h-9 px-4 rounded-md bg-red-600 text-white text-sm font-medium cursor-pointer border-none hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                  <Plus size={15} /> Block
                </button>
              </div>
              {form.blockedDates.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {form.blockedDates.map(d => (
                    <span key={d} className="px-2.5 py-1.5 rounded-md bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-center gap-1.5">
                      {new Date(d + 'T00:00:00').toLocaleDateString()}
                      <button onClick={() => setForm(f => ({ ...f, blockedDates: f.blockedDates.filter(x => x !== d) }))}
                        className="text-red-400 hover:text-red-700 cursor-pointer bg-transparent border-none">
                        <Trash2 size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[var(--text-muted)]">No blocked dates</p>
              )}
            </>
          ) : (
            <div className="space-y-2">
              {form.blockedDates.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {form.blockedDates.map(d => (
                    <span key={d} className="px-2.5 py-1.5 rounded-md bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                      {new Date(d + 'T00:00:00').toLocaleDateString()}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[var(--text-muted)]">No blocked dates</p>
              )}
            </div>
          )}
        </Section>

        {/* Messages */}
        {error && <div className="flex items-start gap-2.5 p-3.5 rounded-md" style={{ background: '#FEE2E2', border: '1px solid #FCA5A5' }}><p className="text-xs font-medium" style={{ color: '#DC2626' }}>{error}</p></div>}
        {success && <div className="p-3.5 rounded-md" style={{ background: '#1E40AF' }}><p className="text-xs font-medium" style={{ color: '#FFFFFF' }}>{success}</p></div>}

        {/* Save buttons */}
        {editing && (
          <div className="flex items-center justify-end gap-3">
            <button onClick={() => { setEditing(false); setError(''); setSuccess(''); setForm({ ...savedForm }); }}
              className="h-9 px-4 rounded-md border border-[var(--border)] text-sm font-medium text-zinc-700 hover:bg-[#F3F4F6] transition-colors cursor-pointer bg-[#F9FAFB]">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving || !form.name}
              className="h-9 px-4 rounded-md border border-[var(--border)] text-sm font-semibold flex items-center gap-2 hover:bg-[#F3F4F6] transition-colors disabled:opacity-50 cursor-pointer bg-[#F9FAFB] text-zinc-700">
              {saving ? <><Loader size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Changes</>}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function Section({ icon, iconBg, title, subtitle, children }: { icon: React.ReactNode; iconBg: string; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-md border border-[var(--border)] overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--border)] bg-[#F9FAFB]">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-md ${iconBg} flex items-center justify-center shrink-0 text-white`}>
            {icon}
          </div>
          <div>
            <h2 className="font-semibold text-zinc-950">{title}</h2>
            <p className="text-xs text-[var(--text-sub)]">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, icon }: { label: string; value: string; onChange: (v: string) => void; icon?: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium text-zinc-700 block mb-1.5">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-3.5 top-1/2 -translate-y-1/2">{icon}</div>}
        <input value={value} onChange={e => onChange(e.target.value)}
          className={`w-full h-9 ${icon ? 'pl-10' : 'px-4'} pr-4 rounded-md border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--blue)]`}
          placeholder={`Enter ${label.toLowerCase()}`} />
      </div>
    </div>
  );
}
