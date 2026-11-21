import { useCallback, useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router'
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
    const onEvent = () => { playNotificationSequence(); onNew() }
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
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { replace: true })
  }, [isAuthenticated, navigate])

  // Poll the unread count; socket events and in-app "mark read" actions
  // refresh it in between so the bell never disagrees with the list.
  const loadUnread = useCallback(() => {
    api.getNotifications({ page: '1', limit: '1' })
      .then((res: any) => {
        const count = res?.data?.unreadCount ?? res?.unreadCount ?? res?.data?.totalUnread ?? 0
        setUnread(Number(count) || 0)
      })
      .catch(() => { /* the bell still links to the notifications page */ })
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      setUnread(0)
      return
    }
    loadUnread()
    const timer = setInterval(loadUnread, 60_000)
    const onChanged = () => loadUnread()
    window.addEventListener('notifications:changed', onChanged)
    return () => {
      clearInterval(timer)
      window.removeEventListener('notifications:changed', onChanged)
    }
  }, [isAuthenticated, loadUnread])

  const bumpUnread = useCallback(() => setUnread((n) => n + 1), [])

  if (!user) return null

  return (
    <StudioShell notificationCount={unread}>
      <GlobalNotificationListener onNew={bumpUnread} />
      <Outlet />
    </StudioShell>
  )
}
