import { useCallback, useEffect, useState, ReactNode } from 'react'
import { NavLink } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { ROLE_CONFIG } from '../../config/roleConfig'
import UseIsSmallScreen from '../../Hooks/UseIsSmallScreen'
import AppHeader from '../../layouts/dashboard/AppHeader'
import Logo from '../ui/Logo'

const STYLES = 
  .studio-layout-root { font-family: 'Inter', sans-serif; }
  .studio-sidebar { transition: width 260ms cubic-bezier(0.4,0,0.2,1); will-change: width; overflow: hidden; flex-shrink: 0; }
  .studio-sidebar-open   { width: var(--studio-sidebar-width-open, 230px); }
  .studio-sidebar-closed { width: var(--studio-sidebar-width-closed, 64px); }
  .studio-sb-scroll::-webkit-scrollbar { width: 1px; }
  .studio-sb-scroll::-webkit-scrollbar-track { background: transparent; }
  .studio-sb-scroll::-webkit-scrollbar-thumb { background: white; border-radius: 7px; }
  .studio-nav-link {
    display: flex; align-items: center; height: 38px; border-radius: 8px;
    font-size: 13px; font-weight: 500; color: #64748b;
    transition: background 160ms ease, color 160ms ease;
    white-space: nowrap; position: relative;
  }
  .studio-nav-link:hover:not(.studio-nav-active) { background: #F4F4F5; color: #1D4ED8; }
  .studio-nav-active { background: #1D4ED8; color: white; font-weight: 600; }
  .studio-icon-link {
    width: 36px; height: 36px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    color: #94a3b8; transition: background 160ms ease, color 160ms ease; position: relative;
  }
  .studio-icon-link:hover:not(.studio-icon-active) { background: #F4F4F5; color: #1D4ED8; }
  .studio-icon-active { background: #E4E4E7; color: #1D4ED8; }
  .studio-icon-link .tip {
    position: absolute; left: calc(100% + 10px); top: 50%; transform: translateY(-50%);
    background: #1e293b; color: #f1f5f9; font-size: 11.5px; font-weight: 500;
    padding: 4px 9px; border-radius: 6px; white-space: nowrap; pointer-events: none;
    opacity: 0; transition: opacity 140ms ease; z-index: 50;
  }
  .studio-icon-link:hover .tip { opacity: 1; }
  .studio-sec-label {
    font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
    color: #94a3b8; padding: 0 12px; margin-bottom: 4px;
  }
  .studio-nav-div { height: 1px; background: #e2e8f0; margin: 10px 0; }
  .studio-role-chip {
    display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 20px;
    font-size: 10px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;
  }


interface StudioShellProps {
  children: ReactNode
  sidebarNav?: Array<{ id: number | string; name: string; path: string; icon: React.ReactNode }>
  sidebarSystemNav?: Array<{ id: number | string; name: string; path: string; icon: React.ReactNode }>
  showAppHeader?: boolean
}

export default function StudioShell({
  children,
  sidebarNav,
  sidebarSystemNav,
  showAppHeader = true,
}: StudioShellProps) {
  const { user } = useAuth()
  const isSmallScreen = UseIsSmallScreen()
  const [isNavOpen, setIsNavOpen] = useState(true)

  useEffect(() => {
    if (isSmallScreen) setIsNavOpen(false)
  }, [isSmallScreen])
  const handleNav = useCallback(() => setIsNavOpen((v) => !v), [])

  if (!user) return null
  const cfg = ROLE_CONFIG[user.role as keyof typeof ROLE_CONFIG]
  const chipStyle = cfg ? { backgroundColor: cfg.bgColor, color: cfg.color } : {}

  const nav = sidebarNav || cfg?.nav || []
  const systemNav = sidebarSystemNav || cfg?.systemNav || []

  return (
    <>
      <style>{STYLES}</style>
      <div
        className="studio-layout-root bg-white"
        style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}
      >
        {/* Sidebar */}
        <aside
          className={studio-sidebar bg-[var(--studio-sidebar-bg)] studio-sb-scroll }
          style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            padding: isNavOpen ? '18px 10px' : '18px 8px',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          {/* Brand + toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isNavOpen ? 'space-between' : 'center',
              marginBottom: 20,
              minHeight: 34,
              padding: isNavOpen ? '0 4px' : 0,
            }}
          >
            {isNavOpen && (
              <div className="flex">
                <Logo />
              </div>
            )}
            <button onClick={handleNav} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
              <Menu size={15} />
            </button>
          </div>

          {/* User identity card */}
          {isNavOpen && cfg && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  background: '#1D4ED810',
                  borderRadius: 10,
                  padding: '10px 12px',
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: cfg.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <User size={14} color="white" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: '#0f172a',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {user.name}
                    </p>
                  </div>
                </div>
                <span className="studio-role-chip text-center ml-10" style={chipStyle}>
                  {cfg.label}
                </span>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Main nav */}
          {isNavOpen && <p className="studio-sec-label">Main</p>}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {nav.map((navItem: any) =>
              isNavOpen ? (
                <NavLink
                  key={navItem.id}
                  to={navItem.path}
                  className={({ isActive }) => studio-nav-link }
                  style={{ padding: '0 12px', gap: 10 }}
                >
                  <span style={{ flexShrink: 0 }}>{navItem.icon}</span>
                  {navItem.name}
                </NavLink>
              ) : (
                <NavLink
                  key={navItem.id}
                  to={navItem.path}
                  className={({ isActive }) => studio-icon-link }
                  style={{ margin: '0 auto' }}
                >
                  {navItem.icon}
                  <span className="tip">{navItem.name}</span>
                </NavLink>
              ),
            )}
          </nav>

          {systemNav.length > 0 && (
            <>
              <div className="studio-nav-div" />
              {isNavOpen && <p className="studio-sec-label">System</p>}
              <nav style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {systemNav.map((navItem: any) =>
                  isNavOpen ? (
                    <NavLink
                      key={navItem.id}
                      to={navItem.path}
                      className={({ isActive }) => studio-nav-link }
                      style={{ padding: '0 12px', gap: 10 }}
                    >
                      <span style={{ flexShrink: 0 }}>{navItem.icon}</span>
                      {navItem.name}
                    </NavLink>
                  ) : (
                    <NavLink
                      key={navItem.id}
                      to={navItem.path}
                      className={({ isActive }) => studio-icon-link }
                      style={{ margin: '0 auto' }}
                    >
                      {navItem.icon}
                      <span className="tip">{navItem.name}</span>
                    </NavLink>
                  ),
                )}
              </nav>
            </>
          )}
        </aside>

        {/* Main area */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {showAppHeader && <AppHeader />}
          <div className="bg-white" style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            {children}
          </div>
        </main>
      </div>
    </>
  )
}
