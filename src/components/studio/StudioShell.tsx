import { ReactNode, useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { ROLE_CONFIG } from '../../config/roleConfig'
import UseIsSmallScreen from '../../Hooks/UseIsSmallScreen'
import TopBar, { type QuickAction } from './TopBar'
import Sidebar from './Sidebar'
import { STUDIO_NAV, ROLE_LABEL_KEY, ROLE_HOME, type StudioNavItem } from './studioNav'

const SIDEBAR_KEY = 'katisha_studio_sidebar'

interface StudioShellProps {
  children: ReactNode
  /** Override nav items (defaults by role). */
  nav?: StudioNavItem[]
  systemNav?: StudioNavItem[]
  quickActions?: QuickAction[]
  notificationCount?: number
  /** Content rendered at the top of the main area (e.g. a page header). */
  header?: ReactNode
}

export default function StudioShell({
  children,
  nav,
  systemNav,
  quickActions = [],
  notificationCount = 0,
  header,
}: StudioShellProps) {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const { scheme } = useTheme()
  const navigate = useNavigate()
  const isSmall = UseIsSmallScreen()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Persisted sidebar state; default collapsed on small screens.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_KEY)
      if (saved === 'open') setSidebarOpen(true)
      else if (saved === 'closed') setSidebarOpen(false)
      else setSidebarOpen(!isSmall)
    } catch {
      setSidebarOpen(!isSmall)
    }
  }, [isSmall])

  const toggleSidebar = useCallback(() => {
    if (isSmall) {
      setMobileOpen((v) => !v)
      return
    }
    setSidebarOpen((v) => {
      const next = !v
      try { localStorage.setItem(SIDEBAR_KEY, next ? 'open' : 'closed') } catch { /* ignore */ }
      return next
    })
  }, [isSmall])

  if (!user) return null

  const cfg = ROLE_CONFIG[user.role as keyof typeof ROLE_CONFIG]
  const avatarColor = cfg?.color || 'var(--blue)'
  const roleLabel = t(ROLE_LABEL_KEY[user.role] || 'roles.user')
  const roleCfgNav = STUDIO_NAV[user.role]
  const resolvedNav = nav ?? roleCfgNav?.nav ?? []
  const resolvedSystem = systemNav ?? roleCfgNav?.system ?? []
  const roles = (user as { roles?: string[] }).roles?.length ? (user as { roles?: string[] }).roles! : [user.role]

  const switchRole = (role: string) => {
    navigate(ROLE_HOME[role] || '/')
    void logout
  }

  return (
    <div
      className="studio-shell flex flex-col bg-[var(--studio-bg)]"
      data-theme={scheme}
      style={{ height: '100dvh', overflow: 'hidden', colorScheme: scheme }}
    >
      <TopBar
        onHamburger={toggleSidebar}
        roleLabel={roleLabel}
        userName={user.name}
        avatarColor={avatarColor}
        quickActions={quickActions}
        roles={roles}
        roleLabelFor={(r) => t(ROLE_LABEL_KEY[r] || 'roles.user')}
        onSwitchRole={switchRole}
        notificationCount={notificationCount}
      />

      <div className="flex flex-1 min-h-0">
        <Sidebar
          open={sidebarOpen}
          isMobile={isSmall}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          nav={resolvedNav}
          systemNav={resolvedSystem}
          userName={user.name}
          roleLabel={roleLabel}
          avatarColor={avatarColor}
        />

        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {header}
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
