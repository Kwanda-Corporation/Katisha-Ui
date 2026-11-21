import { useEffect, useState, useCallback } from 'react'
import { Bell, X } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  status: string
  createdAt: string
}

interface NotificationPanelProps {
  open: boolean
  onClose: () => void
  anchorRight?: number
}

const typeIcon = (type: string) => {
  switch (type) {
    case 'delayed_bus': return '🚌'
    case 'missing_student': return '⚠️'
    case 'incident': return '🚨'
    case 'safety_violation': return '🛡️'
    case 'route_change': return '🗺️'
    case 'emergency': return '⚠️'
    default: return 'ℹ️'
  }
}

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return new Date(date).toLocaleDateString('en-RW', { day: '2-digit', month: 'short' })
}

export default function NotificationPanel({ open, onClose, anchorRight = 0 }: NotificationPanelProps) {
  const { authFetch } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authFetch('/notifications?limit=20')
      // authFetch returns the full { ok, message, data } envelope; the list is
      // inside `data.notifications`, not `data` itself.
      const data = res?.data?.notifications ?? res?.notifications ?? []
      setNotifications(Array.isArray(data) ? data : [])
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => {
    if (open) fetchNotifications()
  }, [open, fetchNotifications])

  const markAllRead = async () => {
    const res = await authFetch('/notifications/mark-all-read', { method: 'PUT' })
    if (!res) return
    setNotifications((ns) => ns.map((n) => ({ ...n, status: 'read', isRead: true, read: true })))
    window.dispatchEvent(new Event('notifications:changed'))
    void fetchNotifications()
  }

  if (!open) return null

  return (
    <div
      className="fixed z-[990] bg-[var(--studio-surface)] rounded-[var(--studio-radius-panel)] shadow-[var(--studio-shadow-pop)] overflow-hidden"
      style={{ top: 52, right: anchorRight, width: 448, maxWidth: 'calc(100vw - 16px)', maxHeight: 'calc(100vh - 68px)' }}
      role="dialog"
      aria-label={t('studio.notifications')}
    >
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-[var(--studio-border)]">
        <h3 className="text-lg font-semibold text-[var(--studio-text)]">{t('studio.notifications')}</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void markAllRead()}
            className="text-sm text-[var(--studio-accent)] hover:underline cursor-pointer"
          >
            {t('studio.markAllRead')}
          </button>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-[var(--studio-muted-fill)]">
            <X size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded bg-[var(--studio-muted-fill)] animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 px-4">
          <div className="w-30 h-30 mb-4 opacity-60">
            <Bell size={120} className="text-[var(--studio-text-muted)]" />
          </div>
          <p className="text-sm text-[var(--studio-text-sub)]">{t('studio.noNotifications')}</p>
        </div>
      ) : (
        <>
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 168px)' }}>
            {notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  onClose()
                  navigate('/dashboard/notifications')
                }}
                className="flex items-start gap-3 w-full px-6 py-3 text-left hover:bg-[var(--studio-hover)] cursor-pointer"
                style={{ minHeight: 72 }}
              >
                <div className="w-10 h-10 rounded-full bg-[var(--studio-muted-fill)] flex items-center justify-center shrink-0">
                  <span className="text-base">{typeIcon(n.type)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[var(--studio-text)] truncate">{n.title}</p>
                    {(n.status === 'unread' || n.status === 'new') && (
                      <span className="w-2 h-2 rounded-full bg-[var(--studio-accent)] shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-[var(--studio-text-sub)] line-clamp-2">{n.message}</p>
                  <p className="text-xs text-[var(--studio-text-muted)] mt-0.5">{timeAgo(n.createdAt)}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="px-6 py-3 border-t border-[var(--studio-border)] text-center">
            <button
              type="button"
              onClick={() => {
                onClose()
                navigate('/dashboard/notifications')
              }}
              className="text-sm font-medium text-[var(--studio-accent)] hover:underline cursor-pointer"
            >
              {t('studio.seeAllNotifications')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
