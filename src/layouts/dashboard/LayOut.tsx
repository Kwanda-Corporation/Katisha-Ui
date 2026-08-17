import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu,  User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_CONFIG } from '../../config/roleConfig';
import UseIsSmallScreen from '../../Hooks/UseIsSmallScreen';
import AppHeader from './AppHeader';
import Logo from '../../components/ui/Logo';

// ── Inline styles ──────────────────────────────────────────────────────────────
const STYLES = `
  .layout-root { font-family: 'Inter', sans-serif; }
  .sidebar { transition: width 260ms cubic-bezier(0.4,0,0.2,1); will-change: width; overflow: hidden; flex-shrink: 0; }
  .sidebar-open   { width: 230px; }
  .sidebar-closed { width: 64px;  }
  .sb-scroll::-webkit-scrollbar { width: 1px; }
  .sb-scroll::-webkit-scrollbar-track { background: transparent; }
  .sb-scroll::-webkit-scrollbar-thumb { background: white; border-radius: 7px; }

  .nav-link {
    display: flex; align-items: center; height: 38px; border-radius: 8px;
    font-size: 13px; font-weight: 500; color: #64748b;
    transition: background 160ms ease, color 160ms ease;
    white-space: nowrap; position: relative;
  }
  .nav-link:hover:not(.nav-active) { background: #F4F4F5; color: #1D4ED8; }
  .nav-active { background: #1D4ED8; color: white; font-weight: 600; }

  .icon-link {
    width: 36px; height: 36px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    color: #94a3b8; transition: background 160ms ease, color 160ms ease; position: relative;
  }
  .icon-link:hover:not(.icon-active) { background: #F4F4F5; color: #1D4ED8; }
  .icon-active { background: #E4E4E7; color: #1D4ED8; }
  .icon-link .tip {
    position: absolute; left: calc(100% + 10px); top: 50%; transform: translateY(-50%);
    background: #1e293b; color: #f1f5f9; font-size: 11.5px; font-weight: 500;
    padding: 4px 9px; border-radius: 6px; white-space: nowrap; pointer-events: none;
    opacity: 0; transition: opacity 140ms ease; z-index: 50;
  }
  .icon-link:hover .tip { opacity: 1; }

  .sec-label {
    font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
    color: #94a3b8; padding: 0 12px; margin-bottom: 4px;
  }
  .nav-div { height: 1px; background: #e2e8f0; margin: 10px 0; }
  .role-chip {
    display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 20px;
    font-size: 10px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;
  }
`;

// ── Main layout ────────────────────────────────────────────────────────────────
export default function DashboardLayout() {
  const { user } = useAuth();
  const isSmallScreen = UseIsSmallScreen();
  const [isNavOpen, setIsNavOpen] = useState(true);

  useEffect(() => { if (isSmallScreen) setIsNavOpen(false); }, [isSmallScreen]);
  const handleNav = useCallback(() => setIsNavOpen(v => !v), []);

  if (!user) return null;
  const cfg = ROLE_CONFIG[user.role];
  const chipStyle = { backgroundColor: cfg.bgColor, color: cfg.color };

  return (
    <>
      <style>{STYLES}</style>
      <div className="layout-root bg-white" style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>

        {/* Sidebar */}
        <aside
          className={`sidebar bg-[#f8fafc] sb-scroll ${isNavOpen ? 'sidebar-open' : 'sidebar-closed'}`}
          style={{
            height: '100vh', display: 'flex', flexDirection: 'column',
            padding: isNavOpen ? '18px 10px' : '18px 8px',
            overflowY: 'auto', overflowX: 'hidden',
            
          }}
        >
          {/* Brand + toggle */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: isNavOpen ? 'space-between' : 'center',
            marginBottom: 20, minHeight: 34, padding: isNavOpen ? '0 4px' : 0,
          }}>
            {isNavOpen && (
              <div className='flex'>
                <Logo />
              </div>

            )}
            <button onClick={handleNav} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
              <Menu size={15} />
            </button>
          </div>

          {/* User identity card */}
          {isNavOpen && (
            <AnimatePresence>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
                background: '#1D4ED810', borderRadius: 10,
                padding: '10px 12px', marginBottom: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', background: cfg.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <User size={14} color="white" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.name}
                    </p>
                  </div>
                </div>
                <span className="role-chip text-center ml-10" style={chipStyle}>{cfg.label}</span>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Main nav */}
          {isNavOpen && <p className="sec-label">Main</p>}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {cfg.nav.map(nav =>
              isNavOpen ? (
                <NavLink key={nav.id} to={nav.path}
                  className={({ isActive }) => `nav-link ${isActive ? 'nav-active' : ''}`}
                  style={{ padding: '0 12px', gap: 10 }}>
                  <span style={{ flexShrink: 0 }}>{nav.icon}</span>{nav.name}
                </NavLink>
              ) : (
                <NavLink key={nav.id} to={nav.path}
                  className={({ isActive }) => `icon-link ${isActive ? 'icon-active' : ''}`}
                  style={{ margin: '0 auto' }}>
                  {nav.icon}<span className="tip">{nav.name}</span>
                </NavLink>
              )
            )}
          </nav>

          <div className="nav-div" />

          {/* System nav */}
          {isNavOpen && <p className="sec-label">System</p>}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {cfg.systemNav.map(nav =>
              isNavOpen ? (
                <NavLink key={nav.id} to={nav.path}
                  className={({ isActive }) => `nav-link ${isActive ? 'nav-active' : ''}`}
                  style={{ padding: '0 12px', gap: 10 }}>
                  <span style={{ flexShrink: 0 }}>{nav.icon}</span>{nav.name}
                </NavLink>
              ) : (
                <NavLink key={nav.id} to={nav.path}
                  className={({ isActive }) => `icon-link ${isActive ? 'icon-active' : ''}`}
                  style={{ margin: '0 auto' }}>
                  {nav.icon}<span className="tip">{nav.name}</span>
                </NavLink>
              )
            )}
          </nav>
        </aside>

        {/* Main area */}
        <main  style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <AppHeader />
          <div className="bg-white" style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
}