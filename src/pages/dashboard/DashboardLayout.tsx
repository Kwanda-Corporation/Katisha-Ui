import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router'
import { Bell, ChevronDown, LogOut, Menu, X} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useSocket } from '../../contexts/SocketContext'
import { useNotificationSound } from '../../Hooks/useNotificationSound'
import { usePushNotifications } from '../../Hooks/usePushNotifications'
import { ROLE_CONFIG } from '../../config/roleConfig'
import Logo from '../../components/ui/Logo'

function GlobalNotificationListener() {
  const { socket } = useSocket()
  const { playNotificationSequence } = useNotificationSound()
  const { showNotification } = usePushNotifications()

  useEffect(() => {
    if (!socket) return
    const onEvent = () => { playNotificationSequence() }
    const onNewBooking = (data: any) => {
      playNotificationSequence()
      showNotification('New Booking', data.message || 'A new booking has been received!', 'new-booking')
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
  }, [socket, playNotificationSequence, showNotification])

  return null
}

export default function DashboardLayout() {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)


  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { replace: true })
  }, [isAuthenticated, navigate])

  if (!user) return null

  const config = ROLE_CONFIG[user.role as keyof typeof ROLE_CONFIG]
  const navItems = config?.nav || []
  const systemNav = config?.systemNav || []
  const userEmail = (user as { email?: string }).email

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-4 md:px-6 bg-white border-b border-[var(--border)]">
        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="md:hidden p-2 -ml-2 hover:bg-[#F9FAFB] rounded-md transition-colors"
        >
          {mobileNavOpen ? <X size={20} className="text-[var(--text-sub)]" /> : <Menu size={20} className="text-[var(--text-sub)]" />}
        </button>

        {/* Left: Logo */}
        <NavLink to="/dashboard" className="flex items-center gap-3 shrink-0 no-underline mr-6">
          <Logo />
        </NavLink>

        {/* Center: Nav Items */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.slice(0, 7).map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 text-black rounded-md text-sm font-medium no-underline transition-all duration-200 ${
                  isActive
                    ? 'bg-[var(--blue)] text-white hover:bg-[var(--blue-dark)]'
                    : 'text-[var(--text-sub)] hover:text-[var(--text)] hover:bg-[#F9FAFB]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="flex items-center" style={{ color: isActive ? '#FFFFFF' : 'inherit' }}>{item.icon}</span>
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="ml-auto flex items-center gap-2">
 

          {/* Notifications */}
          <button
            onClick={() => navigate('/dashboard/notifications')}
            className="relative w-9 h-9 flex items-center justify-center rounded-sm hover:bg-[#F9FAFB] transition-colors cursor-pointer border-none text-[var(--text-sub)]"
          >
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--blue)] ring-2 ring-white" />
          </button>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 pl-2 pr-1.5 py-1.5 rounded-md hover:bg-[#F9FAFB] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[var(--blue)] flex items-center justify-center text-white text-sm font-bold">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="hidden sm:block text-sm font-medium text-zinc-700 max-w-[120px] truncate">
                {user.name}
              </span>
              <ChevronDown size={14} className="text-[var(--text-muted)]" />
            </button>

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-md border border-[var(--border)] z-50 py-2 animate-in">
                  <div className="px-4 py-3 border-b border-[var(--border)]">
                    <p className="text-sm font-semibold text-[var(--text)]">{user.name}</p>
                    <p className="text-xs text-[var(--text-sub)] mt-0.5">{userEmail}</p>
                    <span
                      className="inline-block mt-2 px-2.5 py-0.5 rounded-md text-xs font-medium"
                      style={{ background: config?.bgColor || '#F4F4F5', color: config?.color || '#1D4ED8' }}
                    >
                      {config?.label || user.role}
                    </span>
                  </div>
                  <div className="border-t border-[var(--border)] py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={15} />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Nav Drawer */}
      {mobileNavOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setMobileNavOpen(false)} />
          <div className="fixed left-0 top-16 bottom-0 w-72 bg-white z-50 overflow-y-auto md:hidden">
            <div className="p-4">
              <div className="space-y-1 mb-8">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] px-3 mb-2">Navigation</p>
                {navItems.map((item) => (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    onClick={() => setMobileNavOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium no-underline transition-colors ${
                        isActive ? 'bg-[var(--blue-light)] text-[var(--blue-dark)]' : 'text-[var(--text-sub)] hover:bg-[#F9FAFB]'
                      }`
                    }
                  >
                    {item.icon}
                    {item.name}
                  </NavLink>
                ))}
              </div>
              {systemNav.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] px-3 mb-2">System</p>
                  {systemNav.map((item) => (
                    <NavLink
                      key={item.id}
                      to={item.path}
                      onClick={() => setMobileNavOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium no-underline transition-colors ${
                          isActive ? 'bg-[var(--blue-light)] text-[var(--blue-dark)]' : 'text-[var(--text-sub)] hover:bg-[#F9FAFB]'
                        }`
                      }
                    >
                      {item.icon}
                      {item.name}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Global notification sound listener */}
      <GlobalNotificationListener />

      {/* Page Content */}
      <main className="pt-16 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
