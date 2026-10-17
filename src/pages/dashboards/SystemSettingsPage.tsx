import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Loader, Percent, Award, Ticket, Smartphone } from 'lucide-react';
import { api } from '../../api';

const SETTINGS_META: Record<string, { label: string; description: string; icon: any; type: 'number' | 'boolean' | 'text' | 'select' }> = {
  system_fee_percentage: {
    label: 'System Fee (% of ticket)',
    description: 'Percentage of the ticket price charged as system fee, capped (East Africa 500-1,500 RWF per seat)',
    icon: Percent,
    type: 'number',
  },
  free_ticket_enabled: {
    label: 'Free Ticket Rewards',
    description: 'Enable automatic free ticket rewards for frequent travelers',
    icon: Ticket,
    type: 'boolean',
  },
  free_ticket_threshold: {
    label: 'Free Ticket Threshold',
    description: 'Number of paid bookings needed to earn one free ticket',
    icon: Award,
    type: 'number',
  },
  system_payout_phone: {
    label: 'System Payout Phone',
    description: 'Phone number where net ticket payouts are sent (e.g. +2507XXXXXXXX)',
    icon: Smartphone,
    type: 'text',
  },
};

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.getSettings();
        setSettings(res.data?.settings || {});
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload: Record<string, any> = {};
      for (const [key, value] of Object.entries(settings)) {
        const meta = SETTINGS_META[key];
        if (!meta) continue;
        payload[key] = meta.type === 'number' ? Number(value) : value;
      }
      const res = await api.updateSettings(payload);
      setSettings(res.data?.settings || {});
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[var(--blue)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight">System Settings</h1>
          <p className="text-sm text-[var(--text-sub)] mt-1">Configure platform-wide system parameters</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="h-10 px-5 rounded-md bg-[var(--blue)] text-white text-sm font-medium hover:bg-[var(--blue-dark)] transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer border-none"
        >
          {saving ? <Loader size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? 'Saving...' : 'Save All'}
        </button>
      </div>

      {saved && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-3 rounded-md" style={{ background: '#064187' }}
        >
          <p className="text-xs font-medium" style={{ color: '#FFFFFF' }}>All settings saved successfully</p>
        </motion.div>
      )}

      {error && (
        <div className="mb-6 p-3 rounded-md bg-red-50 border border-red-200">
          <p className="text-xs font-medium text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {Object.entries(SETTINGS_META).map(([key, meta]) => {
          const Icon = meta.icon;
          const value = settings[key];
          return (
            <motion.div key={key} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
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
                <div className="relative">
                  <input type="number" min={0}
                    value={value ?? ''}
                    onChange={e => handleChange(key, Number(e.target.value))}
                    className="w-full h-10 px-4 rounded-md border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400/40 focus:border-zinc-400"
                  />
                </div>
              ) : meta.type === 'text' ? (
                <div className="relative">
                  <input type="text"
                    value={value ?? ''}
                    onChange={e => handleChange(key, e.target.value)}
                    placeholder="+2507XXXXXXXX"
                    className="w-full h-10 px-4 rounded-md border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400/40 focus:border-zinc-400"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button onClick={() => handleChange(key, true)}
                    className={`flex-1 h-10 rounded-md text-xs font-medium transition-all cursor-pointer border ${
                      value === true ? 'bg-[var(--blue)] text-white border-[var(--blue)]' : 'bg-white text-[var(--text-sub)] border-[var(--border)] hover:border-zinc-300'
                    }`}
                  >
                    Enabled
                  </button>
                  <button onClick={() => handleChange(key, false)}
                    className={`flex-1 h-10 rounded-md text-xs font-medium transition-all cursor-pointer border ${
                      value === false ? 'bg-[#F3F4F6] text-zinc-700 border-zinc-300' : 'bg-white text-[var(--text-sub)] border-[var(--border)] hover:border-zinc-300'
                    }`}
                  >
                    Disabled
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
