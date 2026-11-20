import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Menu, Search, Bell, ChevronDown, LogOut, Check, Sun, Moon, Plus, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import LanguageMenu from '../LanguageSwitcher'
import Logo from '../ui/Logo'
import ThemeToggle from './ThemeToggle'

export interface QuickAction {
  key: string
  label: string
  icon: React.ReactNode
  onClick: () => void
}

interface TopBarProps {
  onHamburger: () => void
  roleLabel: string
  userName: string
  /** Fixed brand colour for the avatar (stays solid in both schemes). */
  avatarColor: string
  quickActions?: QuickAction[]
  roles?: string[]
  roleLabelFor?: (role: string) => string
  onSwitchRole?: (role: string) => void
  notificationCount?: number
  onToggleNotifications: () => void
  notificationsOpen: boolean
  /** Renders a Settings menu item + sidebar action when supplied. */
  onOpenSettings?: () => void
}

export default function TopBar({
  onHamburger,
  roleLabel,
  userName,
  avatarColor,
  quickActions = [],
  roles = [],
  roleLabelFor,
  onSwitchRole,
  notificationCount = 0,
  onToggleNotifications,
  notificationsOpen,
  onOpenSettings,
}: TopBarProps) {
  const { t } = useTranslation()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { scheme, toggleScheme, setScheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  return (
    <header
      className="studio-topbar shrink-0 w-full bg-[var(--studio-topbar-bg)] flex items-center justify-between px-2 sm:px-4 z-[960] border-b border-[var(--studio-border)]"
      style={{ height: 'var(--studio-topbar-height)' }}
    >
      {/* Left */}
      <div className="flex items-center gap-1 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onHamburger}
          aria-label={t('studio.toggleSidebar')}
          className="p-2 rounded-full hover:bg-[var(--studio-muted-fill)] cursor-pointer"
        >
          <Menu size={20} className="text-[var(--studio-text)]" />
        </button>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 min-w-0 cursor-pointer"
          aria-label="Katisha"
        >
          <Logo />
          <span className="hidden md:block text-[11px] font-medium text-[var(--studio-text-sub)] tracking-tight">
            Katisha
          </span>
          <span className="hidden lg:block text-xs text-[var(--studio-text-muted)] border border-[var(--studio-border)] rounded px-1.5 py-0.5 leading-none">
            {t('studio.adminBadge', 'Admin')}
          </span>
        </button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-0.5 sm:gap-1">
        <TopIconButton label={t('studio.search')} onClick={() => navigate('/book')}>
          <Search size={20} />
        </TopIconButton>

        <TopIconButton
          label={
            notificationCount > 0
              ? `${t('studio.notifications')} (${notificationCount} unread)`
              : t('studio.notifications')
          }
          onClick={onToggleNotifications}
          active={notificationsOpen}
        >
          <span className="relative">
            <Bell size={20} />
            {notificationCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[var(--error)] text-white text-[9px] font-bold leading-none flex items-center justify-center ring-2 ring-[var(--studio-topbar-bg)]"
              >
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </span>
        </TopIconButton>

        {quickActions.map((action) => (
          <button
            key={action.key}
            type="button"
            onClick={action.onClick}
            className="hidden md:inline-flex items-center gap-1.5 h-9 px-3.5 bg-[var(--studio-accent)] text-white text-sm font-medium hover:opacity-90 cursor-pointer"
            style={{ borderRadius: 'var(--studio-radius-pill)' }}
          >
            {action.icon ?? <Plus size={18} />}
            {action.label}
          </button>
        ))}

        <ThemeToggle
          isDark={scheme === 'dark'}
          onToggle={toggleScheme}
          lightLabel={t('studio.lightMode')}
          darkLabel={t('studio.darkMode')}
        />

        {/* Avatar menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-1 p-0.5 rounded-full hover:bg-[var(--studio-muted-fill)] cursor-pointer"
          >
            <span
              className="flex items-center justify-center text-white font-semibold select-none"
              style={{ width: 32, height: 32, borderRadius: '9999px', background: avatarColor, fontSize: 13 }}
              aria-hidden="true"
            >
              {userName.charAt(0).toUpperCase()}
            </span>
            <ChevronDown size={14} className="hidden sm:block text-[var(--studio-text-muted)]" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+8px)] w-64 bg-[var(--studio-surface)] border border-[var(--studio-border)] rounded-[var(--studio-radius-pop)] shadow-[var(--studio-shadow-pop)] overflow-hidden py-1.5 z-[970]"
            >
              <div className="px-4 py-3 border-b border-[var(--studio-border)]">
                <p className="text-sm font-semibold text-[var(--studio-text)] truncate">{userName}</p>
                <p className="text-xs text-[var(--studio-text-muted)]">{roleLabel}</p>
              </div>

              {onOpenSettings && (
                <div className="px-1 py-1.5 border-b border-[var(--studio-border)]">
                  <button
                    role="menuitem"
                    type="button"
                    onClick={() => { setMenuOpen(false); onOpenSettings() }}
                    className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-left text-[var(--studio-text)] hover:bg-[var(--studio-muted-fill)] cursor-pointer"
                  >
                    <Settings size={15} /> {t('studio.settings')}
                  </button>
                </div>
              )}

              {roles.length > 1 && onSwitchRole && (
                <div className="py-1.5 border-b border-[var(--studio-border)]">
                  <p className="px-4 py-1 text-[11px] uppercase tracking-wide text-[var(--studio-text-muted)]">{t('studio.switchRole')}</p>
                  {roles.map((r) => (
                    <button
                      key={r}
                      role="menuitem"
                      type="button"
                      onClick={() => { setMenuOpen(false); onSwitchRole(r) }}
                      className="flex items-center justify-between w-full px-4 py-2 text-sm text-left text-[var(--studio-text)] hover:bg-[var(--studio-muted-fill)] cursor-pointer"
                    >
                      {roleLabelFor ? roleLabelFor(r) : r}
                      {r === roles[0] && <Check size={14} />}
                    </button>
                  ))}
                </div>
              )}

              <div className="px-1 py-1.5 border-b border-[var(--studio-border)]">
                <p className="px-3 py-1 text-[11px] uppercase tracking-wide text-[var(--studio-text-muted)]">
                  {t('studio.language')}
                </p>
                <LanguageMenu align="left" onSelected={() => setMenuOpen(false)} />
              </div>

              <button
                role="menuitemradio"
                type="button"
                aria-checked={scheme === 'light'}
                onClick={() => setScheme('light')}
                className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-left text-[var(--studio-text)] hover:bg-[var(--studio-muted-fill)] cursor-pointer"
              >
                <Sun size={15} /> {t('studio.lightMode')}
                {scheme === 'light' && <Check size={14} className="ml-auto" />}
              </button>
              <button
                role="menuitemradio"
                type="button"
                aria-checked={scheme === 'dark'}
                onClick={() => setScheme('dark')}
                className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-left text-[var(--studio-text)] hover:bg-[var(--studio-muted-fill)] cursor-pointer"
              >
                <Moon size={15} /> {t('studio.darkMode')}
                {scheme === 'dark' && <Check size={14} className="ml-auto" />}
              </button>
              <button
                role="menuitem"
                type="button"
                onClick={() => { setMenuOpen(false); void logout() }}
                className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-left text-[var(--error)] hover:bg-[var(--studio-muted-fill)] cursor-pointer"
              >
                <LogOut size={15} /> {t('studio.signOut')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function TopIconButton({ label, onClick, children, active }: { label: string; onClick: () => void; children: React.ReactNode; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`p-2 rounded-full cursor-pointer text-[var(--studio-text)] ${active ? 'bg-[var(--studio-muted-fill)]' : 'hover:bg-[var(--studio-muted-fill)]'}`}
    >
      {children}
    </button>
  )
}
