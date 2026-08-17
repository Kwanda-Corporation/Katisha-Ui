import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Bell, LogOut, User, Building2, MapPin,
  Shield, ChevronDown, Clock,
  Bus, Users, Hourglass, RefreshCw,
  Briefcase, LucideIcon,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ProfileSettingsModal } from '../../components/Settings';

// ── Constants ─────────────────────────────────────────────────────────────────
const PRIMARY = '#1D4ED8';
const BLUE    = '#1D4ED8';

// ── Types ─────────────────────────────────────────────────────────────────────
type UserRole =
  | 'system_admin' | 'nesa_admin' | 'atpr_officer'
  | 'agency_admin' | 'driver'
  | 'parent' | 'doctor' | 'pickup_agent';

interface OrgAgency {
  id: string; name: string; contactPerson?: string; contactPhone: string;
  contactEmail?: string; licenseNumber?: string; licenseExpiry?: string;
  availableBuses: number; availableDrivers: number; districtCoverage?: string[];
  status: string; rating: number; completedTrips: number;
  vehiclesCount: number; driversCount: number; complianceScore: number;
  isActive: boolean; createdAt: string;
}

type OrgDetail = OrgAgency;

// ── Role config ───────────────────────────────────────────────────────────────
interface RoleConfig {
  label: string; subtitle: string; color: string; bgColor: string;
  Icon: LucideIcon;
  orgEndpoint: ((id: string) => string) | null;
  orgType: 'school' | 'agency' | null;
}

const ROLE_CONFIG: Record<UserRole, RoleConfig> = {
  system_admin:        { label: 'System Admin',    subtitle: 'Full platform access',       color: '#7C3AED', bgColor: '#EDE9FE', Icon: Shield,        orgEndpoint: null,                      orgType: null     },
  nesa_admin:          { label: 'NESA Admin',      subtitle: 'National oversight',          color: '#1D4ED8', bgColor: '#F4F4F5', Icon: Briefcase,     orgEndpoint: null,                      orgType: null     },
  atpr_officer:        { label: 'ATPR Officer',    subtitle: 'Transport regulation',        color: '#D97706', bgColor: '#FEF3C7', Icon: Briefcase,     orgEndpoint: null,                      orgType: null     },
  agency_admin:        { label: 'Agency Admin',    subtitle: 'Transport agency management', color: BLUE,      bgColor: '#F4F4F5', Icon: Bus,           orgEndpoint: (id) => `/agencies/${id}`, orgType: 'agency' },
  driver:              { label: 'Driver',          subtitle: 'Route & trip management',     color: '#1D4ED8', bgColor: '#F4F4F5', Icon: Bus,           orgEndpoint: (id) => `/agencies/${id}`, orgType: 'agency' },
  parent:              { label: 'Parent',          subtitle: 'Student transport tracking',  color: '#EC4899', bgColor: '#FCE7F3', Icon: Users,         orgEndpoint: null,                      orgType: null     },
  doctor:              { label: 'Medical Officer', subtitle: 'Medical records access',      color: '#BE185D', bgColor: '#FCE7F3', Icon: Shield,        orgEndpoint: null,                      orgType: null     },
  pickup_agent:        { label: 'Pickup Agent',    subtitle: 'Student pickup management',   color: '#B45309', bgColor: '#FEF3C7', Icon: MapPin,        orgEndpoint: null,                      orgType: null     },
};

// ── Pending Approval Modal ─────────────────────────────────────────────────────
function PendingApprovalModal({
  user, onLogout,
}: { user: { name: string; email?: string; role: string }; onLogout: () => void }) {
  const cfg = ROLE_CONFIG[user.role as UserRole];
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-5" style={{ background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)' }}>
      <div className="bg-white rounded-md p-10 max-w-[540px] w-full text-center">
        <div className="w-[72px] h-[72px] rounded-md mx-auto mb-5 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)' }}>
          <Hourglass size={32} color="#D97706" className="animate-[am-pendulum_2s_ease-in-out_infinite]" />
        </div>
        <h2 className="font-[var(--font-body)] text-xl font-bold text-[var(--text)] mb-2">Account Pending Approval</h2>
        <p className="font-[var(--font-body)] text-sm text-[var(--text-sub)] leading-relaxed mb-6">
          Hi <strong>{user.name.split(' ')[0]}</strong>, your account hasn't been linked to an organisation yet.
        </p>
        <div className="bg-[#F9FAFB] rounded-md p-4 mb-6 text-left">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center" style={{ background: cfg?.color ?? PRIMARY }}>
              <User size={18} color="#fff" />
            </div>
            <div>
              <p className="font-[var(--font-body)] text-sm font-bold text-[var(--text)]">{user.name}</p>
              <p className="font-[var(--font-body)] text-xs text-[var(--text-sub)]">{user.email}</p>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.06em] px-2 py-0.5 rounded-full mt-1" style={{ color: '#D97706', background: '#FEF3C7' }}>
                <Clock size={9} /> {cfg?.label ?? user.role}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2.5">
          <button onClick={() => window.location.reload()} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#F9FAFB] text-[var(--text)] border border-[var(--border)] rounded-md font-[var(--font-body)] text-xs font-semibold cursor-pointer">
            <RefreshCw size={13} /> Check Again
          </button>
          <button onClick={onLogout} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-md font-[var(--font-body)] text-xs font-semibold cursor-pointer" style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA' }}>
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </div>
      <style>{`@keyframes am-pendulum { 0%,100%{transform:rotate(-15deg)} 50%{transform:rotate(15deg)} }`}</style>
    </div>
  );
}

// ── User Dropdown ─────────────────────────────────────────────────────────────
interface UserDropdownProps {
  user: { id: string; name: string; email?: string; role: string; organization?: string };
  org: OrgDetail | null;
  unreadCount: number;
  onClose: () => void;
  onLogout: () => void;
  onOpenSettings: () => void;
}

function UserDropdown({ user, org, unreadCount, onClose, onLogout, onOpenSettings }: UserDropdownProps) {
  const cfg     = ROLE_CONFIG[user.role as UserRole];
  const orgName = org ? (org as OrgAgency).name : null;
  const isActive = org ? (org as OrgAgency).isActive : null;

  const menuItem = (icon: React.ReactNode, label: string, sub: string | null, onClick: () => void, danger = false, accent = false) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-sm border-none cursor-pointer font-[var(--font-body)] text-xs font-medium text-left transition-colors duration-200 ${danger ? 'hover:bg-[#FEF2F2]' : accent ? 'hover:bg-[var(--blue-light)]' : 'hover:bg-[#F9FAFB]'}`}
      style={{ color: danger ? 'var(--error)' : accent ? 'var(--blue)' : 'var(--text)' }}
    >
      <span className={`w-[26px] h-[26px] rounded-md flex items-center justify-center shrink-0 ${danger ? 'bg-[#fee2e2]' : accent ? 'bg-[var(--blue-light)]' : 'bg-[#F1F5F9]'}`}>
        {icon}
      </span>
      <div className="flex-1">
        <p className="leading-none">{label}</p>
        {sub && <p className="font-[var(--font-body)] text-[10px] text-[var(--text-muted)] leading-none mt-0.5">{sub}</p>}
      </div>
    </button>
  );

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="absolute right-0 top-[calc(100%+8px)] w-[252px] bg-white rounded-md z-50 border border-[var(--border)] overflow-hidden animate-[am-dropIn_0.18s_cubic-bezier(0.175,0.885,0.32,1.1)]"
      >
        {/* User identity */}
        <div className="px-4 py-3.5 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-[38px] h-[38px] rounded-full shrink-0 flex items-center justify-center" style={{ background: cfg?.color ?? PRIMARY }}>
              <User size={16} color="white" />
            </div>
            <div className="min-w-0">
              <p className="font-[var(--font-body)] text-xs font-bold text-[var(--text)] truncate">{user.name}</p>
              <p className="font-[var(--font-body)] text-[11px] text-[var(--text-muted)] truncate">{user.email}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.06em] px-2 py-0.5 rounded-full" style={{ color: cfg?.color ?? PRIMARY, background: cfg?.bgColor ?? '#F4F4F5' }}>
            {cfg && <cfg.Icon size={9} />} {cfg?.label ?? user.role}
          </span>
        </div>

        {/* Org */}
        {orgName && (
          <div className="px-4 py-2.5 border-b border-[var(--border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <Building2 size={12} className="text-[var(--text-muted)] shrink-0" />
                <p className="font-[var(--font-body)] text-xs font-semibold text-[var(--text)] truncate">{orgName}</p>
              </div>
              {isActive !== null && (
                <span className="flex items-center gap-1 text-[10px] font-semibold shrink-0 ml-2" style={{ color: isActive ? '#1E40AF' : '#DC2626' }}>
                  <div className="w-[5px] h-[5px] rounded-full" style={{ background: 'currentColor' }} />
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Notifications */}
        {unreadCount > 0 && (
          <div className="px-4 py-2 border-b border-[var(--border)] flex items-center gap-2">
            <Bell size={12} className="text-[var(--error)]" />
            <p className="font-[var(--font-body)] text-xs font-medium text-[var(--error)]">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Menu items */}
        <div className="p-1.5">
          {menuItem(<Settings size={13} className="text-[var(--text-sub)]" />, 'Profile & Settings', null, () => { onClose(); onOpenSettings(); })}
          {menuItem(<LogOut size={13} className="text-[var(--error)]" />, 'Sign out', null, onLogout, true)}
        </div>
      </div>
      <style>{`@keyframes am-dropIn { from{transform:translateY(-6px);opacity:0} to{transform:translateY(0);opacity:1} }`}</style>
    </>
  );
}

// ── Main Header ───────────────────────────────────────────────────────────────
interface AppHeaderProps {
  onMenuToggle?: () => void;
  sidebarOpen?: boolean;
  pageTitle?: string;
}

export default function AppHeader({ onMenuToggle, sidebarOpen, pageTitle }: AppHeaderProps) {
  const { user, logout, authFetch, updateUser } = useAuth();

  const [org,           setOrg]           = useState<OrgDetail | null>(null);
  const [orgLoading,    setOrgLoading]    = useState(false);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [showMenu,      setShowMenu]      = useState(false);
  const [showSettings,  setShowSettings]  = useState(false);
  const [notifPulse,    setNotifPulse]    = useState(false);

  const prevUnread = useRef(0);
  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  const cfg                 = user ? ROLE_CONFIG[user.role as UserRole] : null;
  const hasOrg              = !!(user?.organization);
  const needsOrgButMissing  = user && !hasOrg && cfg?.orgEndpoint !== null;

  // ── Fetch org ──────────────────────────────────────────────────────────────
  const fetchOrg = useCallback(async () => {
    if (!user?.organization || !cfg?.orgEndpoint) return;
    setOrgLoading(true);
    const data = await authFetch(cfg.orgEndpoint(user.organization));
    if (data) setOrg(data);
    setOrgLoading(false);
  }, [user?.organization, user?.role, authFetch]);

  // ── Fetch notifications ───────────────────────────────────────────────────
  const fetchUnread = useCallback(async () => {
    if (!user) return;
    const res = await authFetch('/notifications/incoming');
    if (res === null) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    const count: number = Array.isArray(res)
      ? res.length
      : Array.isArray(res?.data?.notifications) ? res.data.notifications.length : 0;
    if (count > prevUnread.current) {
      setNotifPulse(true);
      setTimeout(() => setNotifPulse(false), 2000);
    }
    prevUnread.current = count;
    setUnreadCount(count);
  }, [user, authFetch]);

  useEffect(() => { void fetchOrg(); },            [fetchOrg]);
  useEffect(() => { void fetchUnread(); },         [fetchUnread]);

  // Poll notifications every 30s
  useEffect(() => {
    pollRef.current = setInterval(() => void fetchUnread(), 30_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchUnread]);

  if (!user) return null;
  if (needsOrgButMissing) return <PendingApprovalModal user={user} onLogout={logout} />;

  const orgName = org ? (org as OrgAgency).name : orgLoading ? '…' : null;

  return (
    <>
      <header className="h-16 px-6 flex items-center justify-between border-b border-[var(--border)] bg-white shrink-0 sticky top-0 z-[100]">
        {/* ── Left ── */}
        <div className="flex items-center gap-3">
          {onMenuToggle && (
            <button onClick={onMenuToggle} className="bg-none border-none cursor-pointer p-1.5 rounded-md flex">
              <div className="w-[18px] flex flex-col gap-[3.5px]">
                {[sidebarOpen ? '45deg' : '0', '0', sidebarOpen ? '-45deg' : '0'].map((rot, i) => (
                  <div key={i} className="h-[2px] rounded transition-all duration-200" style={{ background: '#94a3b8', width: i === 1 && sidebarOpen ? '60%' : '100%', transform: rot !== '0' ? `rotate(${rot})` : 'none' }} />
                ))}
              </div>
            </button>
          )}
          <div className="w-px h-5 bg-[var(--border)]" />
          <div>
            <p className="font-[var(--font-body)] text-lg font-bold text-[var(--text)]">{pageTitle ?? 'Dashboard'}</p>
            {cfg && <p className="font-[var(--font-body)] text-[11px] text-[var(--text-muted)]">{cfg.subtitle}</p>}
          </div>
        </div>

        {/* ── Right ── */}
        <div className="flex items-center gap-2">
          {orgName && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F9FAFB] border border-[var(--border)]">
              {cfg && <cfg.Icon size={12} color={cfg.color} />}
              {orgLoading
                ? <div className="w-[72px] h-2.5 rounded bg-[var(--border)] animate-pulse" />
                : <span className="font-[var(--font-body)] text-xs font-semibold text-[var(--text)] max-w-[160px] truncate">{orgName}</span>
              }
            </div>
          )}

          {org && (org as OrgAgency).districtCoverage?.[0] && (
            <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <MapPin size={11} /> <span className="font-[var(--font-body)]">{(org as OrgAgency).districtCoverage![0]}</span>
            </div>
          )}

          {/* Notification bell */}
          <button
            className="relative bg-none border-none cursor-pointer p-1.5 rounded-md flex transition-colors duration-200"
            style={{ color: notifPulse ? '#DC2626' : 'var(--text-sub)' }}
            title="Notifications"
          >
            <Bell size={17} style={{ animation: notifPulse ? 'am-ring 0.5s ease infinite alternate' : 'none' }} />
            {unreadCount > 0 && (
              <span className="absolute top-[3px] right-[3px] min-w-[15px] h-[15px] rounded-full text-white text-[8px] font-bold flex items-center justify-center px-[3px] border-[1.5px] border-white" style={{ background: '#DC2626' }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* User button */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(v => !v)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border cursor-pointer font-[var(--font-body)] transition-[border-color] duration-150 bg-transparent"
              style={{ borderColor: showMenu ? 'var(--border)' : 'transparent' }}
              onMouseEnter={e => { if (!showMenu) e.currentTarget.style.borderColor = 'var(--border)'; }}
              onMouseLeave={e => { if (!showMenu) e.currentTarget.style.borderColor = 'transparent'; }}
            >
              <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center" style={{ background: cfg?.color ?? PRIMARY }}>
                <User size={14} color="white" />
              </div>
              <div className="text-left">
                <p className="font-[var(--font-body)] text-xs font-semibold text-[var(--text)]">{user.name}</p>
                <p className="font-[var(--font-body)] text-[11px] text-[var(--text-muted)]">{cfg?.label ?? user.role}</p>
              </div>
              <ChevronDown size={13} className="text-[var(--text-muted)] transition-transform duration-200" style={{ transform: showMenu ? 'rotate(180deg)' : 'none' }} />
            </button>

            {showMenu && (
              <UserDropdown
                user={user}
                org={org}
                unreadCount={unreadCount}
                onClose={() => setShowMenu(false)}
                onLogout={() => { setShowMenu(false); void logout(); }}
                onOpenSettings={() => setShowSettings(true)}
              />
            )}
          </div>
        </div>
      </header>

      {showSettings && (
        <ProfileSettingsModal
          user={user}
          org={org}
          onClose={() => setShowSettings(false)}
          onOrgUpdate={(updated: OrgDetail) => setOrg(updated)}
          onUserUpdate={(updated) => updateUser(updated)}
          roleConfig={ROLE_CONFIG}
          apiFetch={authFetch}
        />
      )}

      <style>{`
        @keyframes am-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes am-ring   { from{transform:rotate(-12deg)} to{transform:rotate(12deg)} }
      `}</style>
    </>
  );
}
