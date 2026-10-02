import { ReactNode, useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { ROLE_CONFIG } from '../../config/roleConfig'
import UseIsSmallScreen from '../../Hooks/UseIsSmallScreen'
import Button from '../ui/Button'
import TopBar, { type QuickAction } from './TopBar'
import Sidebar from './Sidebar'
import SettingsModal, { type SettingsSection } from './SettingsModal'
import { STUDIO_NAV, ROLE_LABEL_KEY, ROLE_HOME, type StudioNavItem } from './studioNav'

const SIDEBAR_KEY = 'katisha_studio_sidebar'

interface StudioShellProps {
  children: ReactNode
  /** Override nav items (defaults by role). */
  nav?: StudioNavItem[]
  systemNav?: StudioNavItem[]
  /** Settings modal sections; when provided, the Settings action opens the modal. */
  settingsSections?: SettingsSection[]
  settingsDirty?: boolean
  settingsSaving?: boolean
  onSettingsSave?: () => void
  quickActions?: QuickAction[]
  notificationCount?: number
  /** Content rendered at the top of the main area (e.g. a page header). */
  header?: ReactNode
}

export default function StudioShell({
  children,
  nav,
  systemNav,
  settingsSections,
  settingsDirty = false,
  settingsSaving = false,
  onSettingsSave,
  quickActions = [],
  notificationCount = 0,
  header,
}: StudioShellProps) {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isSmall = UseIsSmallScreen()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
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

  const handleFeedback = () => {
    const subject = encodeURIComponent('Katisha Studio feedback')
    const body = encodeURIComponent(feedbackText)
    window.location.href = `mailto:support@katisha.rw?subject=${subject}&body=${body}`
    setFeedbackOpen(false)
    setFeedbackText('')
  }

  const openSettings = () => {
    if (settingsSections && settingsSections.length > 0) setSettingsOpen(true)
    else setSettingsOpen(true)
  }

  return (
    <div className="flex flex-col bg-[var(--studio-bg)]" style={{ height: '100dvh', overflow: 'hidden' }}>
      <TopBar
        onHamburger={toggleSidebar}
        roleLabel={roleLabel}
        userName={user.name}
        avatarColor={avatarColor}
        quickActions={quickActions}
        roles={roles}
        roleLabelFor={(r) => t(ROLE_LABEL_KEY[r] || 'roles.user')}
        onSwitchRole={switchRole}
        onOpenSettings={openSettings}
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
          onSettings={openSettings}
          onFeedback={() => setFeedbackOpen(true)}
        />

        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {header}
            {children}
          </div>
        </main>
      </div>

      {settingsOpen && (
        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          title={t('studio.settings')}
          sections={settingsSections ?? []}
          dirty={settingsDirty}
          saving={settingsSaving}
          onSave={onSettingsSave}
          closeLabel={t('common.close')}
          saveLabel={t('common.save')}
          discardLabel={t('studio.discardChanges')}
          discardConfirmLabel={t('studio.discard')}
        />
      )}

      {feedbackOpen && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.45)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setFeedbackOpen(false) }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('studio.sendFeedback')}
            className="bg-white w-full max-w-md p-6"
            style={{ borderRadius: 'var(--studio-radius-card)' }}
          >
            <h2 className="text-lg font-semibold text-[var(--studio-text)] mb-3">{t('studio.sendFeedback')}</h2>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={5}
              placeholder={t('studio.feedbackPlaceholder')}
              className="w-full p-3 rounded-xl border border-[var(--studio-border)] text-sm outline-none focus:border-[var(--studio-accent)]"
              style={{ borderRadius: 12 }}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="secondary" size="sm" onClick={() => setFeedbackOpen(false)} className="!rounded-full">
                {t('common.cancel')}
              </Button>
              <Button size="sm" onClick={handleFeedback} disabled={!feedbackText.trim()} className="!rounded-full">
                {t('studio.send')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
