import { NavLink } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { StudioNavItem } from './studioNav'

interface SidebarProps {
  open: boolean
  isMobile: boolean
  mobileOpen: boolean
  onCloseMobile: () => void
  nav: StudioNavItem[]
  systemNav: StudioNavItem[]
  userName: string
  roleLabel: string
  avatarColor: string
}

const STYLES = `
.studio-sb { transition: width 200ms cubic-bezier(0.4,0,0.2,1); will-change: width; }
.studio-sb-scroll::-webkit-scrollbar { width: 2px; }
.studio-sb-scroll::-webkit-scrollbar-thumb { background: var(--studio-border); border-radius: 7px; }
.studio-nav-item { display:flex; align-items:center; height:40px; border-radius:9999px; font-size:13.5px; font-weight:500; color:var(--studio-text-sub); white-space:nowrap; position:relative; transition: background 150ms ease,color 150ms ease; }
.studio-nav-item:hover { background: var(--studio-muted-fill); color: var(--studio-text); }
.studio-nav-item.is-active { background: var(--studio-active); color: var(--studio-text); font-weight:600; }
.studio-rail-item { width:40px; height:40px; border-radius:9999px; display:flex; align-items:center; justify-content:center; color:var(--studio-text-sub); position:relative; transition: background 150ms ease,color 150ms ease; }
.studio-rail-item:hover { background: var(--studio-muted-fill); color: var(--studio-text); }
.studio-rail-item.is-active { background: var(--studio-active); color: var(--studio-text); }
.studio-tip { position:absolute; left:calc(100% + 10px); top:50%; transform:translateY(-50%); background:#1e293b; color:#f1f5f9; font-size:11.5px; font-weight:500; padding:4px 9px; border-radius:6px; white-space:nowrap; pointer-events:none; opacity:0; transition:opacity 140ms ease; z-index:60; }
.studio-rail-item:hover .studio-tip { opacity:1; }
.studio-sec-label { font-size:10px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:var(--studio-text-muted); padding:0 12px; margin:6px 0 4px; }
`

export default function Sidebar({
  open,
  isMobile,
  mobileOpen,
  onCloseMobile,
  nav,
  systemNav,
  userName,
  roleLabel,
  avatarColor,
}: SidebarProps) {
  const { t } = useTranslation()
  const expanded = isMobile ? true : open

  const renderItem = (item: StudioNavItem) =>
    expanded ? (
      <NavLink
        key={item.id}
        to={item.path}
        onClick={isMobile ? onCloseMobile : undefined}
        end={item.path === '/dashboard/promoter'}
        className={({ isActive }) => `studio-nav-item px-3 gap-3 ${isActive ? 'is-active' : ''}`}
      >
        <span className="shrink-0">{item.icon}</span>
        <span className="truncate">{t(item.labelKey)}</span>
      </NavLink>
    ) : (
      <NavLink
        key={item.id}
        to={item.path}
        end={item.path === '/dashboard/promoter'}
        className={({ isActive }) => `studio-rail-item mx-auto ${isActive ? 'is-active' : ''}`}
      >
        {item.icon}
        <span className="studio-tip">{t(item.labelKey)}</span>
      </NavLink>
    )

  const sidebarInner = (
    <div className="flex flex-col h-full">
      {/* Identity */}
      <div className={`${expanded ? 'px-3 pt-4 pb-4 text-center' : 'py-4 flex justify-center'}`}>
        {expanded ? (
          <>
            <p className="text-[11px] text-[var(--studio-text-muted)] mb-2">{t('studio.yourAccount')}</p>
            <div
              className="mx-auto flex items-center justify-center text-white font-semibold select-none"
              style={{ width: 64, height: 64, borderRadius: '9999px', background: avatarColor, fontSize: 24 }}
              aria-hidden="true"
            >
              {userName.charAt(0).toUpperCase()}
            </div>
            <p className="mt-2.5 text-sm font-semibold text-[var(--studio-text)] truncate">{userName}</p>
            <p className="text-xs text-[var(--studio-text-muted)] truncate">{roleLabel}</p>
          </>
        ) : (
          <div
            className="flex items-center justify-center text-white font-semibold select-none"
            style={{ width: 32, height: 32, borderRadius: '9999px', background: avatarColor, fontSize: 13 }}
            title={userName}
            aria-hidden="true"
          >
            {userName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto studio-sb-scroll px-1 flex flex-col gap-0.5" aria-label={t('studio.dashboard')}>
        {expanded && nav.length > 0 && <p className="studio-sec-label">{t('studio.main')}</p>}
        {nav.map(renderItem)}
        {systemNav.length > 0 && (
          <>
            <div className="my-2 h-px bg-[var(--studio-border)]" />
            {expanded && <p className="studio-sec-label">{t('studio.system')}</p>}
            {systemNav.map(renderItem)}
          </>
        )}
      </nav>
    </div>
  )

  if (isMobile) {
    return (
      <>
        <style>{STYLES}</style>
        {mobileOpen && (
          <div className="fixed inset-0 z-[900] bg-black/40" onClick={onCloseMobile} aria-hidden="true" />
        )}
        <aside
          className="fixed left-0 z-[950] bg-[var(--studio-sidebar-bg)] transition-transform duration-200"
          style={{
            top: 'var(--studio-topbar-height)',
            bottom: 0,
            width: 'var(--studio-sidebar-width-open)',
            transform: mobileOpen ? 'translateX(0)' : 'translateX(-105%)',
          }}
          aria-label={t('studio.dashboard')}
        >
          {sidebarInner}
        </aside>
      </>
    )
  }

  return (
    <>
      <style>{STYLES}</style>
      <aside
        className="studio-sb shrink-0 bg-[var(--studio-sidebar-bg)]"
        style={{ width: open ? 'var(--studio-sidebar-width-open)' : 'var(--studio-sidebar-width-closed)' }}
        aria-label={t('studio.dashboard')}
      >
        {sidebarInner}
      </aside>
    </>
  )
}
