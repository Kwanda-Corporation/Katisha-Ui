import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Menu, Search, HelpCircle, Bell, ChevronDown, LogOut, Settings, Check, Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import Logo from '../ui/Logo'

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
  avatarColor: string
  quickActions?: QuickAction[]
  roles?: string[]
  roleLabelFor?: (role: string) => string
  onSwitchRole?: (role: string) => void
  onOpenSettings: () => void
  notificationCount?: number
}

const LANGS: Array<{ code: string; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'kin', label: 'Kinyarwanda' },
  { code: 'fr', label: 'Français' },
  { code: 'sw', label: 'Kiswahili' },
]

export default function TopBar({
  onHamburger,
  roleLabel,
  userName,
  avatarColor,
  quickActions = [],
  roles = [],
  roleLabelFor,
  onSwitchRole,
  onOpenSettings,
  notificationCount = 0,
}: TopBarProps) {
  const { t, i18n } = useTranslation()
  const { logout } = useAuth()
  const navigate = useNavigate()
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

  const changeLang = (code: string) => {
    void i18n.changeLanguage(code)
    try { localStorage.setItem('vdk_lang', code) } catch { /* ignore */ }
    setMenuOpen(false)
  }

  return (
    <header
      className="shrink-0 w-full bg-white border-b border-[var(--studio-border)] flex items-center justify-between px-3 sm:px-4 z-[960]"
      style={{ height: 'var(--studio-topbar-height)' }}
    >
      {/* Left */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onHamburger}
          aria-label={t('studio.toggleSidebar')}
          className="p-2 rounded-full hover:bg-[var(--studio-muted-fill)] cursor-pointer"
        >
          <Menu size={18} className="text-[var(--studio-text-sub)]" />
        </button>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 min-w-0 cursor-pointer"
          aria-label="Katisha"
        >
          <Logo />
        </button>
        <div className="hidden sm:flex items-baseline gap-1.5 min-w-0">
          <span className="font-semibold text-[var(--studio-text)] whitespace-nowrap">Katisha Studio</span>
          <span className="text-sm text-[var(--studio-text-muted)] truncate">{roleLabel}</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        <TopIconButton label={t('studio.search')} onClick={() => navigate('/book')}>
          <Search size={17} />
        </TopIconButton>
        <TopIconButton label={t('studio.help')} onClick={() => window.open('/guide', '_blank', 'noopener')}>
          <HelpCircle size={17} />
        </TopIconButton>
        <TopIconButton label={t('studio.notifications')} onClick={() => navigate('/dashboard/notifications')}>
          <span className="relative">
            <Bell size={17} />
            {notificationCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] px-1 rounded-full bg-[var(--error)] text-white text-[9px] font-bold flex items-center justify-center">
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
            className="hidden md:inline-flex items-center gap-2 h-9 px-3.5 border border-[var(--studio-border)] bg-white text-[var(--studio-text)] text-sm font-medium hover:bg-[var(--studio-muted-fill)] cursor-pointer"
            style={{ borderRadius: 'var(--studio-radius-pill)' }}
          >
            {action.icon}
            {action.label}
          </button>
        ))}

        {/* Avatar menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-1.5 p-0.5 rounded-full hover:bg-[var(--studio-muted-fill)] cursor-pointer"
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
              className="absolute right-0 top-[calc(100%+8px)] w-64 bg-white border border-[var(--studio-border)] rounded-2xl overflow-hidden py-1.5 z-[970]"
            >
              <div className="px-4 py-3 border-b border-[var(--studio-border)]">
                <p className="text-sm font-semibold text-[var(--studio-text)] truncate">{userName}</p>
                <p className="text-xs text-[var(--studio-text-muted)]">{roleLabel}</p>
              </div>

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

              <div className="py-1.5 border-b border-[var(--studio-border)]">
                <p className="px-4 py-1 text-[11px] uppercase tracking-wide text-[var(--studio-text-muted)] flex items-center gap-1">
                  <Globe size={11} /> {t('studio.language')}
                </p>
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    role="menuitem"
                    type="button"
                    onClick={() => changeLang(l.code)}
                    className="flex items-center justify-between w-full px-4 py-2 text-sm text-left text-[var(--studio-text)] hover:bg-[var(--studio-muted-fill)] cursor-pointer"
                  >
                    {l.label}
                    {i18n.language === l.code && <Check size={14} />}
                  </button>
                ))}
              </div>

              <button
                role="menuitem"
                type="button"
                onClick={() => { setMenuOpen(false); onOpenSettings() }}
                className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-left text-[var(--studio-text)] hover:bg-[var(--studio-muted-fill)] cursor-pointer"
              >
                <Settings size={15} /> {t('nav.settings')}
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

function TopIconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="p-2 rounded-full hover:bg-[var(--studio-muted-fill)] cursor-pointer text-[var(--studio-text-sub)]"
    >
      {children}
    </button>
  )
}
