import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Megaphone, CheckCircle, XCircle, Ticket, DollarSign, Loader, CheckCheck } from 'lucide-react';
import { api } from '../../api';
import Pagination from '../../components/ui/Pagination';

const typeIcons: Record<string, React.ReactNode> = {
  booking_created: <Ticket size={16} />,
  booking_confirmed: <CheckCircle size={16} />,
  booking_rejected: <XCircle size={16} />,
  payment_received: <DollarSign size={16} />,
  ticket_uploaded: <Ticket size={16} />,
  announcement: <Megaphone size={16} />,
};

const typeColors: Record<string, string> = {
  booking_created: 'text-blue-600 bg-zinc-100',
  booking_confirmed: 'text-blue-600 bg-zinc-100',
  booking_rejected: 'text-zinc-600 bg-zinc-100',
  payment_received: 'text-blue-600 bg-zinc-100',
  ticket_uploaded: 'text-blue-600 bg-zinc-100',
  announcement: 'text-blue-600 bg-zinc-100',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getNotifications({ page: String(page), limit: '20' });
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unreadCount || 0);
      setTotalPages(res.data?.pages || 1);
      setTotal(res.data?.total || 0);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);

  const handleMarkRead = async () => {
    try {
      await api.markNotificationsRead();
      setNotifications(n => n.map(not => ({ ...not, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight">Notifications</h1>
          <p className="text-sm text-[var(--text-sub)] mt-1">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkRead}
            className="h-9 px-4 rounded-md bg-[#F9FAFB] text-[var(--text-sub)] text-sm font-medium flex items-center gap-2 hover:bg-[#F3F4F6] transition-all cursor-pointer border-none"
          >
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12"><Loader size={24} className="mx-auto animate-spin text-[var(--blue)]" /></div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-md border border-[var(--border)]">
          <Bell size={40} className="mx-auto text-[var(--text-muted)] mb-3" />
          <p className="text-sm font-medium text-[var(--text-sub)]">No notifications yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((n: any) => (
            <motion.div key={n._id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-md border p-5 transition-all ${n.isRead ? 'border-[var(--border)]' : 'border-zinc-200 bg-[var(--blue-light)]/30'}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${typeColors[n.type] || 'bg-[#F9FAFB] text-[var(--text-sub)]'}`}>
                  {typeIcons[n.type] || <Bell size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text)]">{n.title}</p>
                  <p className="text-sm text-[var(--text-sub)] mt-0.5">{n.message}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1.5">{new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
    </div>
  );
}
