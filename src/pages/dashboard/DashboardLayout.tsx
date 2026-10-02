import { useCallback, useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router'
import { Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { useSocket } from '../../contexts/SocketContext'
import { useNotificationSound } from '../../Hooks/useNotificationSound'
import { usePushNotifications } from '../../Hooks/usePushNotifications'
import { api } from '../../api'
import StudioShell from '../../components/studio/StudioShell'

/** Rings the sound/push hooks for every dashboard event, mounted once. */
function GlobalNotificationListener({ onNew }: { onNew: () => void }) {
  const { socket } = useSocket()
  const { t } = useTranslation()
  const { playNotificationSequence } = useNotificationSound()
  const { showNotification } = usePushNotifications()

  useEffect(() => {
    if (!socket) return
    const onEvent = () => { playNotificationSequence() }
    const onNewBooking = (data: any) => {
      playNotificationSequence()
      onNew()
      showNotification(
        t('dashboard.ops.newBookingTitle'),
        data.message || t('dashboard.ops.newBookingBody'),
        'new-booking'
      )
    }
    socket.on('new_booking', onNewBooking)
    socket.on('booking_confirmed', onEvent)
    socket.on('booking_rejected', onEvent)
    socket.on('booking_cancelled', onEvent)
    socket.on('ticket_uploaded', onEvent)
    socket.on('new_notification', onEvent)
    return () => {
      socket.off('new_booking', onNewBooking)
      socket.off('booking_confirmed', onEvent)
      socket.off('booking_rejected', onEvent)
      socket.off('booking_cancelled', onEvent)
      socket.off('ticket_uploaded', onEvent)
      socket.off('new_notification', onEvent)
    }
  }, [socket, t, playNotificationSequence, showNotification, onNew])

  return null
}

export default function DashboardLayout() {
  const { user, isAuthenticated } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { replace: true })
  }, [isAuthenticated, navigate])

  // Poll the unread count; socket events bump it optimistically in between.
  useEffect(() => {
    if (!isAuthenticated) return
    let cancelled = false
    const load = () => {
      api.getNotifications({ page: '1', limit: '1' })
        .then((res: any) => {
          if (cancelled) return
          const count = res?.data?.unreadCount ?? res?.unreadCount ?? res?.data?.totalUnread ?? 0
          setUnread(Number(count) || 0)
        })
        .catch(() => { /* the bell still links to the notifications page */ })
    }
    load()
    const timer = setInterval(load, 60_000)
    return () => { cancelled = true; clearInterval(timer) }
  }, [isAuthenticated])

  const bumpUnread = useCallback(() => setUnread((n) => n + 1), [])

  if (!user) return null

  /* The settings modal is intentionally a launcher: the real per-role settings
     screens already exist as routes and are rebuilt on their own phase. */
  const SETTINGS_ROUTE: Record<string, string> = {
    agency_admin: '/dashboard/agency-settings',
    promoter: '/dashboard/promoter/settings',
  }
  const settingsTarget = SETTINGS_ROUTE[user.role]

  return (
    <StudioShell
      notificationCount={unread}
      settingsDirty={false}
      settingsSections={[
        {
          id: 'launcher',
          label: t('nav.settings'),
          content: (
            <div className="space-y-3">
              <p className="text-sm text-[var(--studio-text-sub)]">{t('studio.settings')}</p>
              {settingsTarget && (
                <button
                  type="button"
                  onClick={() => navigate(settingsTarget)}
                  className="inline-flex items-center gap-2 h-10 px-4 text-sm font-medium border border-[var(--studio-border)] bg-white text-[var(--studio-text)] hover:bg-[var(--studio-muted-fill)] cursor-pointer"
                  style={{ borderRadius: 'var(--studio-radius-pill)' }}
                >
                  <Settings size={15} />
                  {t('nav.settings')}
                </button>
              )}
            </div>
          ),
        },
      ]}
    >
      <GlobalNotificationListener onNew={bumpUnread} />
      <Outlet />
    </StudioShell>
  )
}
