import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader } from 'lucide-react';
import { api } from '../../api';

export default function Announcements() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetRole, setTargetRole] = useState('all');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return;
    setSending(true); setError(''); setSuccess('');
    try {
      const res = await api.createAnnouncement({ title, message, targetRole: targetRole === 'all' ? undefined : targetRole });
      setSuccess(`Announcement sent to ${res.data.count} users`);
      setTitle(''); setMessage('');
    } catch (err: any) {
      setError(err.message);
    } finally { setSending(false); }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight">Announcements</h1>
        <p className="text-sm text-[var(--text-sub)] mt-1">Send announcements to agency admins and agents</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-md border border-[var(--border)] overflow-hidden"
      >
        <div className="p-6 space-y-5">
          <div>
            <label className="text-sm font-medium text-zinc-700 block mb-1.5">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="w-full h-12 px-4 rounded-md border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400/40 focus:border-zinc-400"
              placeholder="Announcement title"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700 block mb-1.5">Message</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5}
              className="w-full p-4 rounded-md border border-[var(--border)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-zinc-400/40 focus:border-zinc-400"
              placeholder="Write your announcement..."
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700 block mb-1.5">Target</label>
            <div className="flex gap-2">
              {['all', 'agency_admin', 'agent'].map(r => (
                <button key={r} onClick={() => setTargetRole(r)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer border ${
                    targetRole === r ? 'bg-[var(--blue)] text-white border-[var(--blue)]' : 'bg-white text-[var(--text-sub)] border-[var(--border)] hover:border-zinc-300'
                  }`}
                >{r === 'all' ? 'All' : r === 'agency_admin' ? 'Agency Admins' : 'Agents'}</button>
              ))}
            </div>
          </div>

          {error && <div className="p-3 rounded-md" style={{ background: '#FEE2E2', border: '1px solid #FCA5A5' }}><p className="text-xs font-medium" style={{ color: '#DC2626' }}>{error}</p></div>}
          {success && <div className="p-3 rounded-md" style={{ background: '#1E40AF' }}><p className="text-xs font-medium" style={{ color: '#FFFFFF' }}>{success}</p></div>}

          <button onClick={handleSend} disabled={sending || !title.trim() || !message.trim()}
            className="w-full h-12 rounded-md bg-[var(--blue)] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[var(--blue-dark)] transition-all disabled:opacity-50 cursor-pointer border-none"
          >
            {sending ? <><Loader size={16} className="animate-spin" /> Sending...</> : <><Send size={16} /> Send Announcement</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
