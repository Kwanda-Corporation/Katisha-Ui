// ── ProfileSettingsModal ──────────────────────────────────────────────────────
// Drop-in replacement for the previous ProfileSettingsModal.
// Three-tab sidebar layout (Profile | Appearance | Agency status).
// Fixed internal height — nothing scrolls or overflows.

import React, { useEffect, useRef, useState } from 'react';
import {
  User, Sun, Moon, Check, AlertTriangle, Power, X,
} from 'lucide-react';
import { api } from '../api';
import ReactCountryFlag from 'react-country-flag';
import i18n from '../i18n';

// ── Re-use these from the parent file ────────────────────────────────────────
// PRIMARY, NAVY, OrgDetail, OrgSchool, OrgAgency, OrgAgency, UserRole,
// ROLE_CONFIG, Theme, Language, LANGUAGES, apiFetch
// (they are defined in AppHeader.tsx and already in scope)

// ── Local constants ───────────────────────────────────────────────────────────
const PRIMARY = '#0854AE';
const NAVY    = '#0f172a';

type Theme    = 'light' | 'dark';
type Language = 'en' | 'kin' | 'sw' | 'fr';

const LANGUAGES: { value: Language; label: string; native: string; countryCode: string }[] = [
  { value: 'en', label: 'English',     native: 'English',     countryCode: 'GB' },
  { value: 'kin', label: 'Kinyarwanda', native: 'Ikinyarwanda', countryCode: 'RW' },
  { value: 'sw', label: 'Swahili',     native: 'Kiswahili',   countryCode: 'TZ' },
  { value: 'fr', label: 'French',      native: 'Français',    countryCode: 'FR' },
];

// ── Shared primitives ─────────────────────────────────────────────────────────

const ROW: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '10px 14px',
};

const LABEL_SM: React.CSSProperties = {
  margin: '0 0 8px',
  fontSize: 10, fontWeight: 700, color: '#94a3b8',
  textTransform: 'uppercase', letterSpacing: '0.08em',
};

const CARD: React.CSSProperties = {
  border: '1px solid #f1f5f9',
  borderRadius: 10,
  overflow: 'hidden',
  background: '#fff',
};

function RowItem({
  label, right, divider = true,
}: { label: string; right: React.ReactNode; divider?: boolean }) {
  return (
    <div style={{ ...ROW, borderBottom: divider ? '1px solid #f1f5f9' : 'none' }}>
      <span style={{ fontSize: 12, color: '#64748b' }}>{label}</span>
      {right}
    </div>
  );
}

// ── Tab nav item ──────────────────────────────────────────────────────────────

function NavItem({
  icon: Icon, label, active, onClick,
}: { icon: React.ElementType; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
        fontSize: 13, fontFamily: 'inherit', textAlign: 'left', width: '100%',
        fontWeight: active ? 600 : 400,
        background: active ? `${PRIMARY}12` : 'transparent',
        color: active ? PRIMARY : '#64748b',
        transition: 'background 0.12s, color 0.12s',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#f8fafc'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <Icon size={14} style={{ flexShrink: 0 }} />
      {label}
    </button>
  );
}

// ── Profile tab ───────────────────────────────────────────────────────────────

function ProfileTab({
  user, cfg, onProfileUpdate,
}: {
  user: { id: string; name: string; email?: string; role: string; organization?: string };
  cfg: { label: string; color: string; bgColor: string; Icon: React.ElementType } | null;
  onProfileUpdate?: (updated: { name: string; email: string }) => void;
}) {
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const hasChanges = name !== user.name || email !== user.email;

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await api.updateProfile({ name: name.trim(), email: email.trim() });
      setSaving(false);
      if (res?.user) {
        onProfileUpdate?.({ name: res.user.name, email: res.user.email });
        setMsg({ type: 'ok', text: 'Profile updated successfully' });
      } else {
        setMsg({ type: 'err', text: 'Update failed' });
      }
      setEditMode(false);
    } catch (err: any) {
      setSaving(false);
      setMsg({ type: 'err', text: err.message || 'Update failed' });
    }
    setTimeout(() => setMsg(null), 3500);
  };

  const handleCancel = () => {
    setName(user.name);
    setEmail(user.email || '');
    setEditMode(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Avatar card */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px', background: '#f8fafc',
        borderRadius: 10, border: '1px solid #f1f5f9',
      }}>
        <div style={{
          width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
          background: cfg?.color ?? PRIMARY,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <User size={19} color="#fff" />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: NAVY }}>{user.name}</p>
          <p style={{ margin: '2px 0 7px', fontSize: 12, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.email}
          </p>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 10, fontWeight: 700, color: cfg?.color ?? PRIMARY,
            background: cfg?.bgColor ?? '#F4F4F5',
            padding: '2px 8px', borderRadius: 20,
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            {cfg && <cfg.Icon size={8} />} {cfg?.label ?? user.role}
          </span>
        </div>
      </div>

      {/* Inline feedback */}
      {msg && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '8px 11px', borderRadius: 8,
          background: msg.type === 'ok' ? '#F4F4F5' : '#FEE2E2',
          color: msg.type === 'ok' ? '#064187' : '#DC2626',
          fontSize: 12, fontWeight: 500,
        }}>
          {msg.text}
        </div>
      )}

      {/* Editable fields */}
      <div>
        <p style={LABEL_SM}>Personal Info</p>
        <div style={CARD}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
            <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Name</p>
            {editMode ? (
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                style={{
                  width: '100%', padding: '6px 10px', borderRadius: 6,
                  border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 600, color: NAVY,
                  fontFamily: 'inherit', outline: 'none',
                }}
              />
            ) : (
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: NAVY }}>{user.name}</p>
            )}
          </div>
          <div style={{ padding: '10px 14px' }}>
            <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Email</p>
            {editMode ? (
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                type="email"
                style={{
                  width: '100%', padding: '6px 10px', borderRadius: 6,
                  border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 600, color: NAVY,
                  fontFamily: 'inherit', outline: 'none',
                }}
              />
            ) : (
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: NAVY }}>{user.email}</p>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          {editMode ? (
            <>
              <button onClick={handleCancel}
                style={{
                  padding: '6px 14px', borderRadius: 6, border: '1px solid #e2e8f0',
                  background: '#fff', color: '#64748b', fontSize: 12, fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >Cancel</button>
              <button onClick={handleSave} disabled={saving || !hasChanges}
                style={{
                  padding: '6px 14px', borderRadius: 6, border: 'none',
                  background: PRIMARY, color: '#fff', fontSize: 12, fontWeight: 600,
                  cursor: saving || !hasChanges ? 'wait' : 'pointer', fontFamily: 'inherit',
                  opacity: saving || !hasChanges ? 0.6 : 1,
                }}
              >{saving ? 'Saving…' : 'Save'}</button>
            </>
          ) : (
            <button onClick={() => setEditMode(true)}
              style={{
                padding: '6px 14px', borderRadius: 6, border: '1px solid #e2e8f0',
                background: '#fff', color: '#64748b', fontSize: 12, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >Edit</button>
          )}
        </div>
      </div>

      {/* Details rows */}
      <div>
        <p style={LABEL_SM}>Details</p>
        <div style={CARD}>
          <RowItem
            label="User ID"
            right={<span style={{ fontSize: 12, fontFamily: 'monospace', color: NAVY }}>{user.id.slice(0, 14)}</span>}
          />
          {user.organization && (
            <RowItem
              label="Organisation"
              right={<span style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>{user.organization.slice(0, 18)}</span>}
            />
          )}
          <RowItem
            label="Session"
            divider={false}
            right={
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#064187' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#064187', display: 'inline-block' }} />
                Active
              </span>
            }
          />
        </div>
      </div>
    </div>
  );
}

// ── Appearance tab ────────────────────────────────────────────────────────────

function AppearanceTab({
  theme, setTheme, language, setLanguage,
}: {
  theme: Theme;
  setTheme: (t: Theme) => void;
  language: Language;
  setLanguage: (l: Language) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Theme */}
      <div>
        <p style={LABEL_SM}>Theme</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {(['light', 'dark'] as Theme[]).map((t) => {
            const active = theme === t;
            return (
              <button
                key={t}
                onClick={() => setTheme(t)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 13px', borderRadius: 10, cursor: 'pointer',
                  fontFamily: 'inherit', border: active ? `1.5px solid ${PRIMARY}` : '1px solid #e2e8f0',
                  background: active ? `${PRIMARY}0c` : '#f8fafc',
                  transition: 'all 0.15s',
                }}
              >
                {t === 'light'
                  ? <Sun size={15} color={active ? PRIMARY : '#94a3b8'} />
                  : <Moon size={15} color={active ? PRIMARY : '#94a3b8'} />}
                <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? PRIMARY : '#64748b' }}>
                  {t === 'light' ? 'Light' : 'Dark'}
                </span>
                {active && (
                  <span style={{ marginLeft: 'auto', width: 16, height: 16, borderRadius: '50%', background: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={9} color="#fff" strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Language */}
      <div>
        <p style={LABEL_SM}>Language</p>
        <div style={CARD}>
          {LANGUAGES.map((l, i) => {
            const active = language === l.value;
            return (
              <button
                key={l.value}
                onClick={() => setLanguage(l.value)}
                style={{
                  ...ROW, width: '100%', border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', textAlign: 'left',
                  background: active ? `${PRIMARY}08` : 'transparent',
                  borderBottom: i < LANGUAGES.length - 1 ? '1px solid #f1f5f9' : 'none',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#f8fafc'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = active ? `${PRIMARY}08` : 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ReactCountryFlag
                    countryCode={l.countryCode}
                    svg
                    style={{ fontSize: '18px', lineHeight: '18px' }}
                  />
                  <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? NAVY : '#374151' }}>{l.native}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{l.label !== l.native ? `— ${l.label}` : ''}</span>
                </div>
                {active && <Check size={13} color={PRIMARY} strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Agency tab ────────────────────────────────────────────────────────────────

function AgencyTab({
  agency, isActive, setIsActive, onOrgUpdate,
}: {
  agency: { id: string; name: string; isActive: boolean };
  isActive: boolean;
  setIsActive: (v: boolean) => void;
  onOrgUpdate: (updated: any) => void;
}) {
  const [busy, setBusy]   = useState(false);
  const [msg,  setMsg]    = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const toggle = async () => {
    const next = !isActive;
    setBusy(true);
    setMsg(null);
    try {
      const result = await api.updateAgency(agency.id, { isActive: next });
      const data = result?.agency || result;
      setBusy(false);
      if (data) {
        setIsActive(data.isActive);
        onOrgUpdate(data);
        setMsg({ type: 'ok', text: `Agency ${data.isActive ? 'activated' : 'deactivated'}.` });
      } else {
        setMsg({ type: 'err', text: 'Update failed. Please try again.' });
      }
    } catch {
      setBusy(false);
      setMsg({ type: 'err', text: 'Update failed. Please try again.' });
    }
    setTimeout(() => setMsg(null), 3500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <p style={LABEL_SM}>Agency</p>
        <div style={CARD}>
          <RowItem
            label="Name"
            right={<span style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>{agency.name}</span>}
          />
          <RowItem
            label="Status"
            divider={false}
            right={
              <span style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 11, fontWeight: 600,
                color: isActive ? '#064187' : '#D97706',
                background: isActive ? '#F4F4F5' : '#FEF3C7',
                padding: '3px 9px', borderRadius: 20,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                {isActive ? 'Active' : 'Inactive'}
              </span>
            }
          />
        </div>
      </div>

      <div>
        <p style={LABEL_SM}>Visibility</p>
        <p style={{ margin: '0 0 10px', fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
          {isActive
            ? 'Your agency is visible to students and parents for booking trips. Deactivating will suspend new bookings immediately.'
            : 'Your agency is hidden from booking results. Activate to allow new bookings.'}
        </p>

        {/* Inline feedback */}
        {msg && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            marginBottom: 10, padding: '8px 11px', borderRadius: 8,
            background: msg.type === 'ok' ? '#F4F4F5' : '#FEE2E2',
            color: msg.type === 'ok' ? '#064187' : '#DC2626',
            fontSize: 12, fontWeight: 500,
          }}>
            {msg.type === 'ok' ? <Check size={12} /> : <AlertTriangle size={12} />}
            {msg.text}
          </div>
        )}

        <button
          onClick={toggle}
          disabled={busy}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '10px 16px', borderRadius: 8,
            border: `1px solid ${isActive ? '#FECACA' : '#E4E4E7'}`,
            background: isActive ? '#FEE2E2' : '#F4F4F5',
            color: isActive ? '#DC2626' : '#064187',
            fontSize: 13, fontWeight: 600, cursor: busy ? 'wait' : 'pointer',
            fontFamily: 'inherit', opacity: busy ? 0.6 : 1, transition: 'all 0.15s',
          }}
        >
          <Power size={13} />
          {busy ? 'Updating…' : isActive ? 'Deactivate agency' : 'Activate agency'}
        </button>
      </div>

      {/* Audit note */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 8,
        padding: '9px 12px', background: '#FFFBEB', borderRadius: 8,
        border: '1px solid #FDE68A',
      }}>
        <AlertTriangle size={12} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ margin: 0, fontSize: 11, color: '#92400E', lineHeight: 1.5 }}>
          Status changes are logged and reviewed by ATPR officers.
        </p>
      </div>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

interface ProfileSettingsModalProps {
  user: { id: string; name: string; email?: string; role: string; organization?: string };
  org: any | null;       // OrgDetail
  onClose: () => void;
  onOrgUpdate: (updated: any) => void;
  onUserUpdate?: (updated: { name: string; email: string }) => void;
  roleConfig: Record<string, any>;   // ROLE_CONFIG — passed in from parent
  apiFetch: (path: string, opts?: RequestInit) => Promise<any>;
}

type Tab = 'profile' | 'appearance' | 'agency';

export function ProfileSettingsModal({
  user, org, onClose, onOrgUpdate, onUserUpdate, roleConfig,
}: ProfileSettingsModalProps) {
  const cfg         = roleConfig[user.role] ?? null;
  const isAgencyAdmin = user.role === 'agency_admin';
  const agency      = isAgencyAdmin && org ? org as { id: string; name: string; isActive: boolean } : null;

  const [tab,      setTab]      = useState<Tab>('profile');
  const [theme,    setTheme]    = useState<Theme>(() => (localStorage.getItem('amis_theme') as Theme) ?? 'light');
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('vdk_lang') as Language) ?? 'en');
  const [isActive, setIsActive] = useState<boolean>(agency?.isActive ?? false);
  const [userProfile, setUserProfile] = useState(user);

  const overlayRef = useRef<HTMLDivElement>(null);

  const saveTheme = (t: Theme) => {
    setTheme(t);
    localStorage.setItem('amis_theme', t);
    document.documentElement.setAttribute('data-theme', t);
  };

  const saveLang = (l: Language) => {
    setLanguage(l);
    localStorage.setItem('vdk_lang', l);
    localStorage.removeItem('amis_lang');
    i18n.changeLanguage(l);
  };

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onClose]);

  const TABS: { id: Tab; icon: React.ElementType; label: string; hidden?: boolean }[] = [
    { id: 'profile',    icon: User,     label: 'Profile'        },
    { id: 'appearance', icon: Sun,      label: 'Appearance'     },
    { id: 'agency',     icon: Power,    label: 'Agency status', hidden: !isAgencyAdmin },
  ];

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1100,
        background: 'rgba(15,23,42,0.48)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, animation: 'ps-fadeIn 0.18s ease',
      }}
    >
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540,
        boxShadow: '0 20px 60px rgba(0,0,0,0.16)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        animation: 'ps-up 0.2s cubic-bezier(0.175,0.885,0.32,1.1)',
      }}>

        {/* ── Modal header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '15px 20px',
          borderBottom: '1px solid #f1f5f9',
          flexShrink: 0,
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: NAVY }}>Settings</p>
            <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>Manage your account & preferences</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9', border: 'none', borderRadius: 7,
              width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={13} color="#64748b" />
          </button>
        </div>

        {/* ── Body: left nav + right panel ── */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

          {/* Left nav */}
          <div style={{
            width: 152, flexShrink: 0,
            borderRight: '1px solid #f1f5f9',
            padding: '10px 8px',
            display: 'flex', flexDirection: 'column', gap: 2,
          }}>
            {TABS.filter((t) => !t.hidden).map((t) => (
              <NavItem
                key={t.id}
                icon={t.icon}
                label={t.label}
                active={tab === t.id}
                onClick={() => setTab(t.id)}
              />
            ))}
          </div>

          {/* Right panel */}
          <div style={{ flex: 1, padding: '20px', minWidth: 0 }}>
            {tab === 'profile' && (
              <ProfileTab user={userProfile} cfg={cfg} onProfileUpdate={(updated) => {
                setUserProfile(prev => ({ ...prev, ...updated }));
                onUserUpdate?.(updated);
              }} />
            )}
            {tab === 'appearance' && (
              <AppearanceTab
                theme={theme}
                setTheme={saveTheme}
                language={language}
                setLanguage={saveLang}
              />
            )}
            {tab === 'agency' && isAgencyAdmin && agency && (
              <AgencyTab
                agency={{ id: agency.id, name: agency.name, isActive: agency.isActive }}
                isActive={isActive}
                setIsActive={setIsActive}
                onOrgUpdate={onOrgUpdate}
              />
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'flex-end',
          flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 22px', background: NAVY, color: '#fff',
              border: 'none', borderRadius: 8,
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Done
          </button>
        </div>
      </div>

      <style>{`
        @keyframes ps-fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes ps-up     { from { transform: translateY(14px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </div>
  );
}