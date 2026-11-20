import { useState } from 'react'
import { NavLink } from 'react-router'
import { Settings, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { StudioNavItem } from './studioNav'

interface SidebarProps {
  open: boolean
  isMobile: boolean
  mobileOpen: boolean
  onCloseMobile: () => void
  nav: StudioNavItem[]
  /** Kept for compatibility. Items are merged into the main list; no "System" label is shown. */
  systemNav?: StudioNavItem[]
  userName: string
  roleLabel: string
  /** Fixed brand colour for the avatar (stays solid in both schemes). */
  avatarColor: string
  /** School/agency name shown under the role. Optional. */
  orgName?: string
  /** Renders a bottom Settings action when an `onOpenSettings` handler is supplied. */
  onOpenSettings?: () => void
}

/**
 * Tokens (define them in your theme):
 *  --studio-text            #0f0f0f   (dark: #f1f1f1)
 *  --studio-text-muted      #606060   (dark: #aaaaaa)
 *  --studio-border          #e5e5e5   (dark: #3f3f3f)
 *  --studio-hover           #f2f2f2   (dark: rgba(255,255,255,.1))
 *  --studio-active          #f2f2f2   (dark: rgba(255,255,255,.1))
 *  --studio-sidebar-bg      #ffffff
 *  --studio-accent          Katisha brand blue (avatar tint / active focus)
 */
const STYLES = `
.studio-sb { transition: width 200ms cubic-bezier(0.4,0,0.2,1); }
.studio-sb-scroll { scrollbar-width: thin; scrollbar-color: #c4c4c4 transparent; }
.studio-sb-scroll::-webkit-scrollbar { width: 6px; }
.studio-sb-scroll::-webkit-scrollbar-track { background: transparent; }
.studio-sb-scroll::-webkit-scrollbar-thumb { background: #c4c4c4; border-radius: 6px; }

.studio-ico { display:flex; align-items:center; justify-content:center; flex-shrink:0; width:24px; height:24px; }
.studio-ico svg { width:24px; height:24px; stroke-width:1.5; fill:none; }

/* Expanded item */
.studio-nav-item {
  display:flex; align-items:center; gap:24px; height:40px; padding:0 12px; border-radius:10px;
  font-size:14px; font-weight:400; line-height:20px; letter-spacing:0;
  color: var(--studio-text,#0f0f0f); background:transparent; white-space:nowrap; text-decoration:none;
  transition: background 120ms ease;
}
.studio-nav-item:hover { background: var(--studio-hover,#f2f2f2); }
.studio-nav-item.is-active { background: var(--studio-active,#f2f2f2); font-weight:500; }
.studio-nav-item.is-active .studio-ico svg { fill: currentColor; stroke: var(--studio-active,#f2f2f2); }

/* Collapsed rail item */
.studio-rail-item {
  position:relative; display:flex; align-items:center; justify-content:center; width:48px; height:40px;
  border-radius:10px; color: var(--studio-text,#0f0f0f); background:transparent; text-decoration:none;
  transition: background 120ms ease;
}
.studio-rail-item:hover { background: var(--studio-hover,#f2f2f2); }
.studio-rail-item.is-active { background: var(--studio-active,#f2f2f2); }
.studio-rail-item.is-active .studio-ico svg { fill: currentColor; stroke: var(--studio-active,#f2f2f2); }

.studio-tip {
  position:absolute; left:calc(100% + 8px); top:50%; transform:translateY(-50%);
  background:#303030; color:#fff; font-size:12px; font-weight:400; line-height:16px;
  padding:6px 10px; border-radius:6px; white-space:nowrap; pointer-events:none; opacity:0;
  transition: opacity 120ms ease; z-index:60;
}
.studio-rail-item:hover .studio-tip, .studio-rail-item:focus-visible .studio-tip { opacity:1; }

/* Expandable group header (same look as an item, chevron on the right) */
.studio-group-header {
  display:flex; align-items:center; gap:24px; width:100%; height:40px; padding:0 12px; border-radius:10px;
  font-size:14px; font-weight:400; color: var(--studio-text,#0f0f0f); background:transparent; border:0; cursor:pointer; text-align:left;
  transition: background 120ms ease;
}
.studio-group-header:hover { background: var(--studio-hover,#f2f2f2); }
.studio-group-chev { margin-left:auto; width:18px; height:18px; color: var(--studio-text-muted,#606060); transition: transform 150ms ease; }
.studio-group-header.is-open .studio-group-chev { transform: rotate(180deg); }

.studio-nav-item:focus-visible, .studio-rail-item:focus-visible, .studio-group-header:focus-visible {
  outline: 2px solid var(--studio-accent,#0854AE); outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .studio-sb, .studio-nav-item, .studio-rail-item, .studio-group-header, .studio-group-chev, .studio-tip { transition: none; }
}
`

const isOverview = (path: string) =>
  path === '/dashboard/overview' ||
  path === '/dashboard/overview-admin' ||
  path === '/dashboard/agent' ||
  path === '/dashboard/promoter'

// Notifications live in the top-bar bell, so they are removed from the sidebar.
const REMOVED_FROM_SIDEBAR = ['/dashboard/notifications']

export default function Sidebar({
  open,
  isMobile,
  mobileOpen,
  onCloseMobile,
  nav,
  systemNav = [],
  userName,
  roleLabel,
  avatarColor,
  orgName,
  onOpenSettings,
}: SidebarProps) {
  const { t } = useTranslation()
  const expanded = isMobile ? true : open
  const initial = (userName || '?').charAt(0).toUpperCase()

  const items = [...nav, ...systemNav].filter((i) => !REMOVED_FROM_SIDEBAR.includes(i.path))

  const [closedGroups, setClosedGroups] = useState<Record<string, boolean>>({})
  const toggleGroup = (g: string) => setClosedGroups((s) => ({ ...s, [g]: !s[g] }))

  const renderItem = (item: StudioNavItem) =>
    expanded ? (
      <NavLink
        key={item.path}
        to={item.path}
        end={isOverview(item.path)}
        onClick={isMobile ? onCloseMobile : undefined}
        className={({ isActive }) => `studio-nav-item ${isActive ? 'is-active' : ''}`}
      >
        <span className="studio-ico">{item.icon}</span>
        <span className="truncate">{t(item.labelKey)}</span>
      </NavLink>
    ) : (
      <NavLink
        key={item.path}
        to={item.path}
        end={isOverview(item.path)}
        aria-label={t(item.labelKey)}
        className={({ isActive }) => `studio-rail-item ${isActive ? 'is-active' : ''}`}
      >
        <span className="studio-ico">{item.icon}</span>
        <span className="studio-tip">{t(item.labelKey)}</span>
      </NavLink>
    )

  const renderItems = (list: StudioNavItem[]) => {
    const out: React.ReactNode[] = []
    let i = 0
    while (i < list.length) {
      const item = list[i]
      if (!item.group) {
        out.push(renderItem(item))
        i++
        continue
      }
      const group = item.group
      const children: StudioNavItem[] = []
      while (i < list.length && list[i].group === group) {
        children.push(list[i])
        i++
      }
      if (!expanded) {
        out.push(...children.map(renderItem))
        continue
      }
      const isOpen = !closedGroups[group]
      out.push(
        <div key={`group-${group}`}>
          <button
            type="button"
            className={`studio-group-header ${isOpen ? 'is-open' : ''}`}
            onClick={() => toggleGroup(group)}
            aria-expanded={isOpen}
          >
            <span className="truncate">{group}</span>
            <ChevronDown className="studio-group-chev" aria-hidden="true" />
          </button>
          {isOpen && <div className="flex flex-col">{children.map(renderItem)}</div>}
        </div>
      )
    }
    return out
  }

  const settingsLabel = t('studio.settings')

  const inner = (
    <div className="flex h-full flex-col">
      {/* Account block: centered, no borders */}
      {expanded ? (
        <div className="flex flex-col items-center px-3 pb-5 pt-5 text-center">
          <div
            className="flex select-none items-center justify-center font-medium text-white"
            style={{ width: 80, height: 80, borderRadius: 9999, background: avatarColor, fontSize: 36 }}
            aria-hidden="true"
          >
            {initial}
          </div>
          <p
            className="mt-3 max-w-full truncate"
            style={{ fontSize: 14, fontWeight: 500, lineHeight: '20px', color: 'var(--studio-text,#0f0f0f)' }}
          >
            {userName}
          </p>
          <p
            className="max-w-full truncate"
            style={{ fontSize: 13, fontWeight: 400, lineHeight: '18px', color: 'var(--studio-text-muted,#606060)' }}
          >
            {orgName ? `${roleLabel} · ${orgName}` : roleLabel}
          </p>
        </div>
      ) : (
        <div className="flex justify-center py-4">
          <div
            className="flex select-none items-center justify-center font-medium text-white"
            style={{ width: 32, height: 32, borderRadius: 9999, background: avatarColor, fontSize: 14 }}
            title={userName}
            aria-hidden="true"
          >
            {initial}
          </div>
        </div>
      )}

      {/* Main navigation: items sit flush, 12px side margins */}
      <nav
        className={`studio-sb-scroll flex flex-1 flex-col overflow-y-auto ${expanded ? 'px-3' : 'items-center px-3'}`}
        aria-label={t('studio.dashboard')}
      >
        {renderItems(items)}
      </nav>

      {/* Bottom: Settings only, when a handler is provided */}
      {onOpenSettings && (
        <div
          className={`flex flex-col px-3 py-2 ${expanded ? '' : 'items-center'}`}
          style={{ borderTop: '1px solid var(--studio-border,#e5e5e5)' }}
        >
          {expanded ? (
            <button
              type="button"
              onClick={() => {
                if (isMobile) onCloseMobile()
                onOpenSettings()
              }}
              className="studio-nav-item border-0 text-left cursor-pointer [font-family:inherit]"
            >
              <span className="studio-ico">
                <Settings />
              </span>
              <span className="truncate">{settingsLabel}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label={settingsLabel}
              className="studio-rail-item border-0 cursor-pointer [font-family:inherit]"
            >
              <span className="studio-ico">
                <Settings />
              </span>
              <span className="studio-tip">{settingsLabel}</span>
            </button>
          )}
        </div>
      )}
    </div>
  )

  if (isMobile) {
    return (
      <>
        <style>{STYLES}</style>
        {mobileOpen && <div className="fixed inset-0 z-[900] bg-black/40" onClick={onCloseMobile} aria-hidden="true" />}
        <aside
          className="fixed left-0 z-[950] transition-transform duration-200"
          style={{
            top: 'var(--studio-topbar-height)',
            bottom: 0,
            width: 280,
            background: 'var(--studio-sidebar-bg,#fff)',
            transform: mobileOpen ? 'translateX(0)' : 'translateX(-105%)',
          }}
          aria-label={t('studio.dashboard')}
        >
          {inner}
        </aside>
      </>
    )
  }

  return (
    <>
      <style>{STYLES}</style>
      <aside
        className="studio-sb shrink-0"
        style={{
          width: open ? 'var(--studio-sidebar-width-open, 240px)' : 'var(--studio-sidebar-width-closed, 72px)',
          background: 'var(--studio-sidebar-bg,#fff)',
        }}
        aria-label={t('studio.dashboard')}
      >
        {inner}
      </aside>
    </>
  )
}
