import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, BellOff, CheckCheck, Trash2, AlertTriangle, Bus, Heart,
  UserX, Shield, Navigation, CloudRain, Stethoscope, Truck, Lock,
  MessageSquare, Info, Zap, ChevronDown, Filter, X,
  Clock, CheckCircle, ChevronRight, MoreVertical,
  AlertCircle, Users, MapPin, LucideIcon, Eye, TrendingUp,
  Megaphone, Send, Globe,
  Building2, FileText, CalendarClock,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Button, Banner, EmptyState, StatCard } from '../../components/ui';

// ── Types ──────────────────────────────────────────────────────────────────────

type NotificationType =
  | 'delayed_bus' | 'sick_student' | 'missing_student' | 'incident'
  | 'safety_violation' | 'route_change' | 'weather_alert' | 'medical'
  | 'transport' | 'security' | 'discipline' | 'info' | 'emergency';

type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

type NotificationStatus =
  | 'new' | 'unread' | 'read' | 'viewed'
  | 'acknowledged' | 'resolved' | 'escalated';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  status: NotificationStatus;
  priority: NotificationPriority;
  travelDirection?: string;
  studentsAffected: number;
  studentIds?: string[];
  source?: string;
  location?: string;
  estimatedDuration?: number;
  requiresAction: boolean;
  requiresAcknowledgment: boolean;
  acknowledgmentDeadline?: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  recipientType?: string;
  senderRole?: string;
  senderName?: string;
  metadata?: Record<string, unknown>;
  relatedData?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiStats {
  total: number;
  unread: number;
  requiresAction: number;
  resolved: number;
}

interface AnnouncementForm {
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  recipientType: 'all' | 'agencies' | 'drivers' | 'parents';
  requiresAcknowledgment: boolean;
  acknowledgmentDeadline: string;
  location: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env?.VITE_API_URL ?? 'http://localhost:5001/api';
const PRIMARY  = '#1D4ED8';
const DANGER   = '#DC2626';
const BLUE     = '#1D4ED8';

// ── Type config ────────────────────────────────────────────────────────────────

interface TypeConfig { Icon: LucideIcon; color: string; bg: string; label: string; }

const TYPE_CONFIG: Record<NotificationType, TypeConfig> = {
  delayed_bus:     { Icon: Bus,           color: '#D97706', bg: '#FEF3C7', label: 'Delayed Bus'       },
  sick_student:    { Icon: Heart,         color: '#EC4899', bg: '#FCE7F3', label: 'Sick Student'      },
  missing_student: { Icon: UserX,         color: '#DC2626', bg: '#FEE2E2', label: 'Missing Student'   },
  incident:        { Icon: AlertTriangle, color: '#EA580C', bg: '#FFEDD5', label: 'Incident'          },
  safety_violation:{ Icon: Shield,        color: '#7C3AED', bg: '#EDE9FE', label: 'Safety Violation'  },
  route_change:    { Icon: Navigation,    color: '#1D4ED8', bg: '#F4F4F5', label: 'Route Change'      },
  weather_alert:   { Icon: CloudRain,     color: '#6366F1', bg: '#EEF2FF', label: 'Weather Alert'     },
  medical:         { Icon: Stethoscope,   color: '#BE185D', bg: '#FCE7F3', label: 'Medical'           },
  transport:       { Icon: Truck,         color: '#1D4ED8', bg: '#F4F4F5', label: 'Transport'         },
  security:        { Icon: Lock,          color: '#374151', bg: '#F3F4F6', label: 'Security'          },
  discipline:      { Icon: MessageSquare, color: '#B45309', bg: '#FEF3C7', label: 'Discipline'        },
  info:            { Icon: Info,          color: '#1D4ED8', bg: '#F4F4F5', label: 'Information'       },
  emergency:       { Icon: Zap,           color: '#DC2626', bg: '#FEE2E2', label: 'Emergency'         },
};

const PRIORITY_CONFIG: Record<NotificationPriority, { color: string; bg: string; dot: string }> = {
  low:      { color: '#1E40AF', bg: '#F4F4F5', dot: '#1E40AF' },
  medium:   { color: '#ca8a04', bg: '#fef9c3', dot: '#f59e0b' },
  high:     { color: '#d97706', bg: '#fef3c7', dot: '#f97316' },
  critical: { color: '#dc2626', bg: '#fee2e2', dot: '#ef4444' },
};

const STATUS_CONFIG: Record<NotificationStatus, { label: string; color: string; bg: string }> = {
  new:          { label: 'New',          color: '#1D4ED8', bg: '#F4F4F5' },
  unread:       { label: 'Unread',       color: '#1D4ED8', bg: '#F4F4F5' },
  read:         { label: 'Read',         color: '#64748b', bg: '#f1f5f9' },
  viewed:       { label: 'Viewed',       color: '#64748b', bg: '#f1f5f9' },
  acknowledged: { label: 'Acknowledged', color: '#1E40AF', bg: '#F4F4F5' },
  resolved:     { label: 'Resolved',     color: '#1E40AF', bg: '#F4F4F5' },
  escalated:    { label: 'Escalated',    color: '#dc2626', bg: '#fee2e2' },
};

const RECIPIENT_OPTIONS = [
  { value: 'all',      label: 'Everyone',           Icon: Globe    },
  { value: 'agencies', label: 'All Agencies',        Icon: Building2},
  { value: 'drivers',  label: 'All Drivers',         Icon: Bus      },
  { value: 'parents',  label: 'All Parents',         Icon: Users    },
] as const;

// ── API helper ─────────────────────────────────────────────────────────────────

function getToken(): string | null {
  return localStorage.getItem('vdk_access_token') || sessionStorage.getItem('vdk_access_token');
}

async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T | null> {
  const token = getToken();
  try {
    const r = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    const json = await r.json();
    return (json?.data !== undefined ? json.data : json) ?? null;
  } catch {
    return null;
  }
}

// ── Time formatting ────────────────────────────────────────────────────────────

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-RW', { day: '2-digit', month: 'short' });
}

function fmtFull(date: string): string {
  return new Date(date).toLocaleString('en-RW', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function PriorityDot({ priority, pulse = false }: { priority: NotificationPriority; pulse?: boolean }) {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <span className="relative inline-flex items-center justify-center w-2.5 h-2.5 shrink-0">
      {pulse && (
        <span className="absolute inset-0 rounded-full opacity-40 animate-ping" style={{ background: cfg.dot, animation: 'ripple 1.4s cubic-bezier(0,0,0.2,1) infinite' }} />
      )}
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.dot }} />
    </span>
  );
}

function StatusPill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap uppercase tracking-[0.04em]" style={{ color, background: bg }}>
      {label}
    </span>
  );
}

// ── Announce Composer (NESA and agency users only) ──────────────────────────────────────────────

const EMPTY_FORM: AnnouncementForm = {
  title: '',
  message: '',
  type: 'info',
  priority: 'medium',
  recipientType: 'all',
  requiresAcknowledgment: false,
  acknowledgmentDeadline: '',
  location: '',
};

interface AnnouncePanelProps {
  onPublished: () => void;
  senderName: string;
}

function AnnouncePanel({ onPublished, senderName }: AnnouncePanelProps) {
  const [form, setForm] = useState<AnnouncementForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const charCount = form.message.length;
  const isValid = form.title.trim().length >= 3 && form.message.trim().length >= 10;

  const patch = <K extends keyof AnnouncementForm>(key: K, val: AnnouncementForm[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  async function handleSubmit() {
    if (!isValid) return;
    setSubmitting(true);
    setError('');
    const payload = {
      title:                  form.title.trim(),
      message:                form.message.trim(),
      type:                   form.type,
      priority:               form.priority,
      recipientType:          form.recipientType,
      requiresAcknowledgment: form.requiresAcknowledgment,
      acknowledgmentDeadline: form.requiresAcknowledgment && form.acknowledgmentDeadline
        ? new Date(form.acknowledgmentDeadline).toISOString()
        : undefined,
      location:               form.location || undefined,
      senderName,
    };
    const res = await apiFetch('/notifications/announce', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setSubmitting(false);
    if (res) {
      setSuccess(true);
      setForm(EMPTY_FORM);
      onPublished();
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError('Failed to publish. Please try again.');
    }
  }

  const typeCfg = TYPE_CONFIG[form.type];
  const priCfg  = PRIORITY_CONFIG[form.priority];

  return (
    <motion.div layout className="bg-white rounded-md overflow-hidden border" style={{ borderColor: `${PRIMARY}30` }}>
      {/* Header */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center justify-between w-full px-5 py-3.5 border-none cursor-pointer font-[var(--font-body)]" 
        style={{ background: `linear-gradient(135deg, ${PRIMARY}10 0%, ${BLUE}08 100%)`, borderBottom: collapsed ? 'none' : `1px solid ${PRIMARY}18` }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: `${PRIMARY}18` }}>
            <Megaphone size={17} style={{ color: PRIMARY }} />
          </div>
          <div className="text-left">
            <p className="font-[var(--font-body)] text-sm font-bold text-[var(--text)]">Publish Announcement</p>
            <p className="font-[var(--font-body)] text-[11px] text-[var(--text-sub)]">Send a system-wide notification to all users or specific groups</p>
          </div>
        </div>
        <motion.div animate={{ rotate: collapsed ? 0 : 180 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className="text-[var(--text-sub)]" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="composer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 py-4 flex flex-col gap-3.5">
              {/* Success banner */}
              <AnimatePresence>
                {success && (
                  <Banner variant="success">Announcement published successfully!</Banner>
                )}
              </AnimatePresence>

              {/* Title */}
              <div>
                <label className="block font-[var(--font-body)] text-[11px] font-bold text-[var(--text-sub)] uppercase tracking-[0.07em] mb-1">Announcement title *</label>
                <input
                  value={form.title}
                  onChange={(e) => patch('title', e.target.value)}
                  placeholder="e.g. Important update for all transport partners"
                  maxLength={200}
                  className="w-full px-3 py-2 text-xs text-[var(--text)] bg-white border border-[var(--border)] rounded-md font-[var(--font-body)] outline-none box-border focus:border-[var(--blue)] transition-[border-color] duration-150"
                />
              </div>

              {/* Message */}
              <div>
                <div className="flex justify-between mb-1">
                  <label className="block font-[var(--font-body)] text-[11px] font-bold text-[var(--text-sub)] uppercase tracking-[0.07em]">Message *</label>
                  <span className="font-[var(--font-body)] text-[11px]" style={{ color: charCount > 900 ? DANGER : 'var(--text-muted)' }}>{charCount}/1000</span>
                </div>
                <textarea
                  value={form.message}
                  onChange={(e) => patch('message', e.target.value)}
                  placeholder="Write your announcement message here. Be clear and concise."
                  maxLength={1000}
                  rows={4}
                  className="w-full px-3 py-2 text-xs text-[var(--text)] bg-white border border-[var(--border)] rounded-md font-[var(--font-body)] outline-none box-border resize-y leading-relaxed focus:border-[var(--blue)] transition-[border-color] duration-150"
                />
              </div>

              {/* Row: type + priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-[var(--font-body)] text-[11px] font-bold text-[var(--text-sub)] uppercase tracking-[0.07em] mb-1">Notification type</label>
                  <div className="relative">
                    <select
                      value={form.type}
                      onChange={(e) => patch('type', e.target.value as NotificationType)}
                      className="appearance-none w-full px-3 py-2 text-xs border border-[var(--border)] rounded-md bg-white font-[var(--font-body)] text-[var(--text)] outline-none cursor-pointer pr-8 focus:border-[var(--blue)] transition-[border-color] duration-150"
                    >
                      {Object.entries(TYPE_CONFIG).map(([v, c]) => (
                        <option key={v} value={v}>{c.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="text-[var(--text-muted)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-5 h-5 rounded flex items-center justify-center shrink-0" style={{ background: typeCfg.bg }}>
                      <typeCfg.Icon size={11} color={typeCfg.color} />
                    </div>
                    <span className="font-[var(--font-body)] text-[11px] font-semibold" style={{ color: typeCfg.color }}>{typeCfg.label}</span>
                  </div>
                </div>

                <div>
                  <label className="block font-[var(--font-body)] text-[11px] font-bold text-[var(--text-sub)] uppercase tracking-[0.07em] mb-1">Priority level</label>
                  <div className="relative">
                    <select
                      value={form.priority}
                      onChange={(e) => patch('priority', e.target.value as NotificationPriority)}
                      className="appearance-none w-full px-3 py-2 text-xs border border-[var(--border)] rounded-md bg-white font-[var(--font-body)] text-[var(--text)] outline-none cursor-pointer pr-8 focus:border-[var(--blue)] transition-[border-color] duration-150"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                    <ChevronDown size={12} className="text-[var(--text-muted)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full" style={{ background: priCfg.bg }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: priCfg.dot }} />
                    <span className="font-[var(--font-body)] text-[11px] font-semibold capitalize" style={{ color: priCfg.color }}>{form.priority}</span>
                  </div>
                </div>
              </div>

              {/* Recipients */}
              <div>
                <label className="block font-[var(--font-body)] text-[11px] font-bold text-[var(--text-sub)] uppercase tracking-[0.07em] mb-1">Send to</label>
                <div className="flex gap-2 flex-wrap">
                  {RECIPIENT_OPTIONS.map(({ value, label, Icon: Ic }) => {
                    const active = form.recipientType === value;
                    return (
                      <button
                        key={value}
                        onClick={() => patch('recipientType', value)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-semibold cursor-pointer font-[var(--font-body)] transition-all duration-200 border ${active ? 'bg-[var(--blue-light)] text-[var(--blue)]' : 'bg-[#F9FAFB] text-[var(--text-sub)] border-[var(--border)]'}`}
                        style={active ? { borderColor: PRIMARY, background: `${PRIMARY}12`, color: PRIMARY } : { borderColor: 'var(--border)', background: '#F8FAFC', color: 'var(--text-sub)' }}
                      >
                        <Ic size={12} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block font-[var(--font-body)] text-[11px] font-bold text-[var(--text-sub)] uppercase tracking-[0.07em] mb-1">Location / scope <span className="font-normal text-[var(--text-muted)]">(optional)</span></label>
                <input
                  value={form.location}
                  onChange={(e) => patch('location', e.target.value)}
                  placeholder="e.g. Kigali City, Southern Province"
                  className="w-full px-3 py-2 text-xs text-[var(--text)] bg-white border border-[var(--border)] rounded-md font-[var(--font-body)] outline-none box-border focus:border-[var(--blue)] transition-[border-color] duration-150"
                />
              </div>

              {/* Acknowledgment toggle */}
              <div className="flex items-start gap-2.5 p-3 rounded-md border transition-all duration-200" style={{ background: form.requiresAcknowledgment ? `${PRIMARY}08` : '#F8FAFC', borderColor: form.requiresAcknowledgment ? `${PRIMARY}25` : 'var(--border)' }}>
                <button
                  onClick={() => patch('requiresAcknowledgment', !form.requiresAcknowledgment)}
                  className="w-5 h-5 rounded shrink-0 mt-0.5 flex items-center justify-center cursor-pointer transition-all duration-200 border-2"
                  style={{
                    borderColor: form.requiresAcknowledgment ? PRIMARY : '#cbd5e1',
                    background: form.requiresAcknowledgment ? PRIMARY : 'transparent',
                  }}
                >
                  {form.requiresAcknowledgment && <CheckCircle size={11} color="#fff" />}
                </button>
                <div className="flex-1">
                  <p className="font-[var(--font-body)] text-xs font-semibold text-[var(--text)]">Require acknowledgment</p>
                  <p className="font-[var(--font-body)] text-[11px] text-[var(--text-muted)]">Recipients must explicitly confirm they have read this announcement</p>
                  <AnimatePresence>
                    {form.requiresAcknowledgment && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-2.5"
                      >
                        <label className="block font-[var(--font-body)] text-[11px] font-bold text-[var(--text-sub)] uppercase tracking-[0.07em] mb-1">Acknowledgment deadline <span className="font-normal text-[var(--text-muted)]">(optional)</span></label>
                        <div className="relative">
                          <CalendarClock size={13} className="text-[var(--text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="datetime-local"
                            value={form.acknowledgmentDeadline}
                            onChange={(e) => patch('acknowledgmentDeadline', e.target.value)}
                            className="w-full pl-8 pr-3 py-2 text-xs border border-[var(--border)] rounded-md bg-white font-[var(--font-body)] text-[var(--text)] outline-none box-border focus:border-[var(--blue)] transition-[border-color] duration-150"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Preview card */}
              {form.title && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#F9FAFB] rounded-md p-3 border border-[var(--border)]"
                >
                  <p className="font-[var(--font-body)] text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.06em] mb-2">Preview</p>
                  <div className="flex gap-2.5">
                    <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style={{ background: typeCfg.bg }}>
                      <typeCfg.Icon size={15} color={typeCfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-[var(--font-body)] text-xs font-bold text-[var(--text)] mb-0.5">{form.title || '—'}</p>
                      <p className="font-[var(--font-body)] text-xs text-[var(--text-sub)] leading-relaxed mb-1.5">{form.message || 'Your message will appear here…'}</p>
                      <div className="flex gap-1 flex-wrap">
                        <StatusPill label={typeCfg.label} color={typeCfg.color} bg={typeCfg.bg} />
                        <StatusPill label={form.priority} color={priCfg.color} bg={priCfg.bg} />
                        <span className="font-[var(--font-body)] text-[11px] text-[var(--text-muted)]">→ {RECIPIENT_OPTIONS.find(r => r.value === form.recipientType)?.label}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <Banner variant="error">{error}</Banner>
                )}
              </AnimatePresence>

              {/* Submit */}
              <div className="flex gap-2.5 pt-0.5">
                <Button variant="secondary" size="sm" onClick={() => setForm(EMPTY_FORM)}>
                  <X size={13} /> Clear
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  onClick={handleSubmit}
                  disabled={!isValid || submitting}
                  loading={submitting}
                >
                  <Send size={14} />
                  {submitting ? 'Publishing…' : 'Publish Announcement'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Notification Card ──────────────────────────────────────────────────────────

interface NotifCardProps {
  notif: Notification;
  isSelected: boolean;
  onSelect: () => void;
  onAcknowledge: (id: string) => void;
  onEscalate: (id: string) => void;
  onDelete: (id: string) => void;
  onMarkRead: (id: string) => void;
}

function NotifCard({ notif, isSelected, onSelect, onAcknowledge, onEscalate, onDelete, onMarkRead }: NotifCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const typeCfg  = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.info;
  const priCfg   = PRIORITY_CONFIG[notif.priority];
  const statCfg  = STATUS_CONFIG[notif.status];
  const isUnread = notif.status === 'unread' || notif.status === 'new';
  const isCritical = notif.priority === 'critical';

  useEffect(() => {
    function h(e: MouseEvent) { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const isAnnouncement = notif.source === 'NESA Announcement';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onSelect}
      className="rounded-md p-3.5 cursor-pointer transition-all duration-200 relative"
      style={{
        background: isSelected ? '#F0F5FF' : isUnread ? '#FAFEFF' : '#fff',
        border: `1px solid ${isSelected ? `${PRIMARY}40` : isUnread ? `${PRIMARY}20` : 'var(--border)'}`,
      }}
    >
      {isUnread && (
        <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-md" style={{ background: isCritical ? DANGER : PRIMARY }} />
      )}
      {isAnnouncement && (
        <div className="absolute top-2.5 right-11 flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.06em] px-1.5 py-0.5 rounded-full" style={{ color: BLUE, background: '#F4F4F5' }}>
          <Megaphone size={9} /> NESA
        </div>
      )}

      <div className="flex gap-3 items-start">
        <div className="w-9 h-9 rounded-md shrink-0 flex items-center justify-center border" style={{ background: typeCfg.bg, borderColor: `${typeCfg.color}20` }}>
          <typeCfg.Icon size={17} color={typeCfg.color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
              <PriorityDot priority={notif.priority} pulse={isUnread && isCritical} />
              <p className={`font-[var(--font-body)] text-xs leading-tight flex-1 min-w-0 ${isUnread ? 'font-bold' : 'font-medium'} text-[var(--text)]`}>
                {notif.title}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="font-[var(--font-body)] text-[11px] text-[var(--text-muted)] whitespace-nowrap">{timeAgo(notif.createdAt)}</span>
              <div ref={menuRef} className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen((s) => !s); }}
                  className="bg-none border-none cursor-pointer p-1 rounded-md text-[var(--text-muted)] flex"
                >
                  <MoreVertical size={14} />
                </button>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-[110%] z-50 bg-white border border-[var(--border)] rounded-md min-w-[160px] overflow-hidden"
                    >
                      {isUnread && (
                        <button onClick={(e) => { e.stopPropagation(); onMarkRead(notif.id); setMenuOpen(false); }} className="flex items-center gap-2 w-full px-3.5 py-2 bg-none border-none cursor-pointer font-[var(--font-body)] text-xs text-[var(--text)] text-left hover:bg-[#F9FAFB]">
                          <Eye size={13} /> Mark as read
                        </button>
                      )}
                      {notif.requiresAcknowledgment && notif.status !== 'acknowledged' && (
                        <button onClick={(e) => { e.stopPropagation(); onAcknowledge(notif.id); setMenuOpen(false); }} className="flex items-center gap-2 w-full px-3.5 py-2 bg-none border-none cursor-pointer font-[var(--font-body)] text-xs text-[var(--blue)] text-left hover:bg-[#F9FAFB]">
                          <CheckCircle size={13} /> Acknowledge
                        </button>
                      )}
                      {notif.status !== 'escalated' && (
                        <button onClick={(e) => { e.stopPropagation(); onEscalate(notif.id); setMenuOpen(false); }} className="flex items-center gap-2 w-full px-3.5 py-2 bg-none border-none cursor-pointer font-[var(--font-body)] text-xs text-[var(--warning)] text-left hover:bg-[#F9FAFB]">
                          <TrendingUp size={13} /> Escalate
                        </button>
                      )}
                      <div className="border-t border-[var(--border)]" />
                      <button onClick={(e) => { e.stopPropagation(); onDelete(notif.id); setMenuOpen(false); }} className="flex items-center gap-2 w-full px-3.5 py-2 bg-none border-none cursor-pointer font-[var(--font-body)] text-xs text-[var(--error)] text-left hover:bg-[#F9FAFB]">
                        <Trash2 size={13} /> Delete
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <p className="font-[var(--font-body)] text-xs text-[var(--text-sub)] leading-relaxed mb-2 line-clamp-2">{notif.message}</p>

          <div className="flex items-center gap-1.5 flex-wrap">
            <StatusPill label={typeCfg.label} color={typeCfg.color} bg={typeCfg.bg} />
            <StatusPill label={notif.priority} color={priCfg.color} bg={priCfg.bg} />
            <StatusPill label={statCfg.label} color={statCfg.color} bg={statCfg.bg} />
            {notif.studentsAffected > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                <Users size={11} /> {notif.studentsAffected} students
              </span>
            )}
            {notif.location && (
              <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                <MapPin size={11} /> {notif.location}
              </span>
            )}
            {notif.requiresAction && notif.status !== 'acknowledged' && (
              <span className="flex items-center gap-1 text-[10px] font-bold rounded-full px-2 py-0.5" style={{ color: DANGER, background: '#fee2e2' }}>
                <AlertCircle size={10} /> Action required
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Detail Panel ───────────────────────────────────────────────────────────────

function DetailPanel({ notif, onClose, onAcknowledge, onEscalate, onDelete }: {
  notif: Notification; onClose: () => void;
  onAcknowledge: (id: string) => void; onEscalate: (id: string) => void; onDelete: (id: string) => void;
}) {
  const typeCfg  = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.info;
  const priCfg   = PRIORITY_CONFIG[notif.priority];
  const statCfg  = STATUS_CONFIG[notif.status];
  const students = (notif.relatedData?.allBoardedStudents ?? notif.relatedData?.students ?? []) as Array<Record<string, string>>;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="bg-white border border-[var(--border)] rounded-md overflow-hidden flex flex-col h-full"
    >
      <div className="px-5 py-4 border-b border-[var(--border)]" style={{ background: typeCfg.bg }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-md bg-white flex items-center justify-center">
              <typeCfg.Icon size={20} color={typeCfg.color} />
            </div>
            <div>
              <p className="font-[var(--font-body)] text-[11px] font-bold uppercase tracking-[0.06em]" style={{ color: typeCfg.color }}>{typeCfg.label}</p>
              <p className="font-[var(--font-body)] text-sm font-bold text-[var(--text)] leading-tight">{notif.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="bg-white/70 border-none rounded-md p-1.5 cursor-pointer flex">
            <X size={15} className="text-[var(--text-sub)]" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        <div>
          <p className="font-[var(--font-body)] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-[0.06em] mb-1.5">Message</p>
          <p className="font-[var(--font-body)] text-xs text-[var(--text)] leading-relaxed bg-[#F9FAFB] rounded-md p-3">{notif.message}</p>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          <StatusPill label={notif.priority} color={priCfg.color} bg={priCfg.bg} />
          <StatusPill label={statCfg.label} color={statCfg.color} bg={statCfg.bg} />
          {notif.requiresAction && <StatusPill label="Action Required" color="#dc2626" bg="#fee2e2" />}
          {notif.requiresAcknowledgment && <StatusPill label="Needs Acknowledgment" color="#7c3aed" bg="#ede9fe" />}
          {notif.source === 'NESA Announcement' && <StatusPill label="NESA Announcement" color={BLUE} bg="#F4F4F5" />}
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: 'Sent', value: fmtFull(notif.createdAt), Icon: Clock },
            { label: 'Source', value: notif.source ?? '—', Icon: Info },
            { label: 'Location', value: notif.location ?? '—', Icon: MapPin },
            { label: 'Direction', value: notif.travelDirection ?? '—', Icon: Navigation },
            { label: 'Students Affected', value: notif.studentsAffected > 0 ? String(notif.studentsAffected) : '—', Icon: Users },
            { label: 'Sender', value: notif.senderName ?? notif.senderRole ?? '—', Icon: Shield },
          ].map(({ label, value, Icon: I }) => (
            <div key={label} className="bg-[#F9FAFB] rounded-md p-2.5">
              <div className="flex items-center gap-1 mb-0.5">
                <I size={11} className="text-[var(--text-muted)]" />
                <p className="font-[var(--font-body)] text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.05em]">{label}</p>
              </div>
              <p className="font-[var(--font-body)] text-xs font-medium text-[var(--text)]">{value}</p>
            </div>
          ))}
        </div>

        {notif.acknowledgmentDeadline && (
          <div className="flex items-center gap-2 rounded-md px-3.5 py-2.5" style={{ background: '#fef3c7', border: '1px solid #fde68a' }}>
            <Clock size={14} color="#d97706" />
            <div>
              <p className="font-[var(--font-body)] text-[11px] font-bold" style={{ color: '#92400e' }}>Acknowledgment deadline</p>
              <p className="font-[var(--font-body)] text-xs" style={{ color: '#b45309' }}>{fmtFull(notif.acknowledgmentDeadline)}</p>
            </div>
          </div>
        )}

        {notif.acknowledgedAt && (
          <div className="flex items-center gap-2 rounded-md px-3.5 py-2.5" style={{ background: '#F4F4F5', border: '1px solid #E4E4E7' }}>
            <CheckCircle size={14} color="#1E40AF" />
            <div>
              <p className="font-[var(--font-body)] text-[11px] font-bold text-blue-800">Acknowledged</p>
              <p className="font-[var(--font-body)] text-xs" style={{ color: '#1E40AF' }}>{fmtFull(notif.acknowledgedAt)}</p>
            </div>
          </div>
        )}

        {students.length > 0 && (
          <div>
            <p className="font-[var(--font-body)] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-[0.06em] mb-2">Students ({students.length})</p>
            <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto">
              {students.map((s, i) => (
                <div key={i} className="flex items-center justify-between bg-[#F9FAFB] rounded-md px-3 py-2">
                  <div>
                    <p className="font-[var(--font-body)] text-xs font-semibold text-[var(--text)]">{s.name}</p>
                    <p className="font-[var(--font-body)] text-[11px] text-[var(--text-muted)]">Grade {s.grade} • {s.ticketCode}</p>
                  </div>
                  {s.boardedAt && (
                    <span className="font-[var(--font-body)] text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ color: '#1E40AF', background: '#F4F4F5' }}>
                      {new Date(s.boardedAt).toLocaleTimeString('en-RW', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {notif.metadata && Object.keys(notif.metadata).length > 0 && (
          <div>
            <p className="font-[var(--font-body)] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-[0.06em] mb-2">Metadata</p>
            <div className="bg-[#F9FAFB] rounded-md p-2.5 font-mono text-[11px] text-[var(--text-sub)] leading-relaxed overflow-x-auto">
              {Object.entries(notif.metadata).map(([k, v]) => (
                <div key={k}><span className="text-[var(--blue)]">{k}</span>: {String(v)}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-5 py-3.5 border-t border-[var(--border)] flex gap-2 flex-wrap">
        {notif.requiresAcknowledgment && notif.status !== 'acknowledged' && (
          <Button variant="primary" size="sm" onClick={() => onAcknowledge(notif.id)} className="flex-1">
            <CheckCircle size={14} /> Acknowledge
          </Button>
        )}
        {notif.status !== 'escalated' && (
          <Button variant="secondary" size="sm" onClick={() => onEscalate(notif.id)} className="flex-1" style={{ color: '#d97706', borderColor: '#fde68a', background: '#fef3c7' }}>
            <TrendingUp size={14} /> Escalate
          </Button>
        )}
        <Button variant="destructive" size="sm" onClick={() => onDelete(notif.id)}>
          <Trash2 size={14} />
        </Button>
      </div>
    </motion.div>
  );
}

// ── Published Announcements History (NESA) ─────────────────────────────────────

function PublishedHistory({ refreshTrigger }: { refreshTrigger: number }) {
  const [items, setItems]     = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    apiFetch<{ data: Notification[] }>('/notifications/announcements').then((res) => {
      const raw = res as unknown as Record<string, unknown>;
      const data = Array.isArray(raw?.data) ? raw.data as Notification[] : [];
      setItems(data);
      setLoading(false);
    });
  }, [open, refreshTrigger]);

  return (
    <Card padding="sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full bg-none border-none cursor-pointer font-[var(--font-body)]"
        style={{ borderBottom: open ? `1px solid ${BLUE}20` : 'none', paddingBottom: open ? '0.75rem' : 0 }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: `${BLUE}15` }}>
            <FileText size={15} style={{ color: BLUE }} />
          </div>
          <div className="text-left">
            <p className="font-[var(--font-body)] text-xs font-bold text-[var(--text)]">Published announcements</p>
            <p className="font-[var(--font-body)] text-[11px] text-[var(--text-muted)]">History of announcements you've sent</p>
          </div>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={15} className="text-[var(--text-muted)]" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pt-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-md bg-[#F1F5F9] animate-pulse" />
                ))
              ) : items.length === 0 ? (
                <p className="font-[var(--font-body)] text-xs text-[var(--text-muted)] text-center py-5">No announcements published yet.</p>
              ) : items.map((n) => {
                const tc = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.info;
                const rc = RECIPIENT_OPTIONS.find(r => r.value === n.recipientType);
                return (
                  <div key={n.id} className="flex gap-2.5 p-2.5 bg-[#F9FAFB] rounded-md border border-[var(--border)]">
                    <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style={{ background: tc.bg }}>
                      <tc.Icon size={14} color={tc.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-[var(--font-body)] text-xs font-semibold text-[var(--text)] truncate">{n.title}</p>
                        <span className="font-[var(--font-body)] text-[10px] text-[var(--text-muted)] shrink-0">{timeAgo(n.createdAt)}</span>
                      </div>
                      <p className="font-[var(--font-body)] text-[11px] text-[var(--text-sub)] truncate mt-0.5 mb-1">{n.message}</p>
                      <div className="flex gap-1">
                        <StatusPill label={tc.label} color={tc.color} bg={tc.bg} />
                        {rc && <StatusPill label={rc.label} color={BLUE} bg="#F4F4F5" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

type TabFilter = 'all' | 'unread' | 'action' | 'escalated';

export default function NotificationsPage() {
  const { user } = useAuth();
  const isNesa = user?.role === 'system_admin' || user?.role === 'agency_admin';

  const [notifications, setNotifications]   = useState<Notification[]>([]);
  const [stats, setStats]                   = useState<ApiStats>({ total: 0, unread: 0, requiresAction: 0, resolved: 0 });
  const [pagination, setPagination]         = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading]               = useState(true);
  const [selected, setSelected]             = useState<Notification | null>(null);
  const [tab, setTab]                       = useState<TabFilter>('all');
  const [showFilters, setShowFilters]       = useState(false);
  const [filterType, setFilterType]         = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus]     = useState('');
  const [page, setPage]                     = useState(1);
  const [announceRefresh, setAnnounceRefresh] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (filterType)     params.set('type', filterType);
    if (filterPriority) params.set('priority', filterPriority);
    if (filterStatus)   params.set('status', filterStatus);
    if (tab === 'unread')    params.set('status', 'unread');
    if (tab === 'escalated') params.set('status', 'escalated');

    const res = await apiFetch<{ data: Notification[]; stats: ApiStats; pagination: PaginationMeta }>(
      `/notifications?${params}`,
    );
    
    if (res) {
      const raw   = res as Record<string, unknown>;
      const inner = (Array.isArray(raw.data) ? raw.data : Array.isArray((raw.data as Record<string,unknown>)?.data) ? (raw.data as Record<string,unknown>).data : raw.data) as Notification[] | undefined;
      let data: Notification[] = Array.isArray(inner) ? inner : Array.isArray(raw) ? (raw as unknown as Notification[]) : [];
      const statsRaw      = (raw.stats      ?? (raw.data as Record<string,unknown>)?.stats)      as ApiStats | undefined;
      const paginationRaw = (raw.pagination ?? (raw.data as Record<string,unknown>)?.pagination) as PaginationMeta | undefined;
      if (tab === 'action') data = data.filter((n) => n.requiresAction && n.status !== 'acknowledged');
      setNotifications(data);
      setStats(statsRaw      ?? { total: 0, unread: 0, requiresAction: 0, resolved: 0 });
      setPagination(paginationRaw ?? { page: 1, limit: 20, total: 0, totalPages: 1 });
    }
    setLoading(false);
  }, [page, filterType, filterPriority, filterStatus, tab]);

  useEffect(() => { void fetchNotifications(); }, [fetchNotifications]);
  useEffect(() => {
    pollRef.current = setInterval(() => void fetchNotifications(true), 60_000);
    return () => clearInterval(pollRef.current);
  }, [fetchNotifications]);

  async function handleMarkRead(id: string) {
    await apiFetch(`/notifications/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'read' }) });
    setNotifications((p) => p.map((n) => n.id === id ? { ...n, status: 'read' } : n));
    if (selected?.id === id) setSelected((s) => s ? { ...s, status: 'read' } : null);
  }

  async function handleAcknowledge(id: string) {
    await apiFetch(`/notifications/${id}/acknowledge`, { method: 'PUT' });
    setNotifications((p) => p.map((n) => n.id === id ? { ...n, status: 'acknowledged', acknowledgedAt: new Date().toISOString() } : n));
    if (selected?.id === id) setSelected((s) => s ? { ...s, status: 'acknowledged', acknowledgedAt: new Date().toISOString() } : null);
    setStats((s) => ({ ...s, requiresAction: Math.max(0, s.requiresAction - 1) }));
  }

  async function handleEscalate(id: string) {
    await apiFetch(`/notifications/${id}/escalate`, { method: 'POST' });
    setNotifications((p) => p.map((n) => n.id === id ? { ...n, status: 'escalated' } : n));
    if (selected?.id === id) setSelected((s) => s ? { ...s, status: 'escalated' } : null);
  }

  async function handleDelete(id: string) {
    await apiFetch(`/notifications/${id}`, { method: 'DELETE' });
    setNotifications((p) => p.filter((n) => n.id !== id));
    if (selected?.id === id) setSelected(null);
    setStats((s) => ({ ...s, total: Math.max(0, s.total - 1) }));
  }

  async function handleMarkAllRead() {
    await apiFetch('/notifications/mark-all-read', { method: 'PUT' });
    setNotifications((p) => p.map((n) => ({ ...n, status: 'read' as NotificationStatus })));
    setStats((s) => ({ ...s, unread: 0 }));
  }

  function handleSelect(notif: Notification) {
    setSelected((s) => (s?.id === notif.id ? null : notif));
    if ((notif.status === 'unread' || notif.status === 'new') && notif.id) {
      void handleMarkRead(notif.id);
    }
  }

  const activeFilters = [filterType, filterPriority, filterStatus].filter(Boolean).length;

  const TABS: { id: TabFilter; label: string; count?: number }[] = [
    { id: 'all',       label: 'All',            count: stats.total          },
    { id: 'unread',    label: 'Unread',          count: stats.unread         },
    { id: 'action',    label: 'Action Required', count: stats.requiresAction },
    { id: 'escalated', label: 'Escalated'                                    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4 mb-1">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-md flex items-center justify-center bg-[var(--blue-light)]" style={{ background: isNesa ? `${PRIMARY}18` : '#F4F4F5' }}>
              {isNesa ? <Megaphone size={20} style={{ color: PRIMARY }} /> : <Bell size={20} style={{ color: BLUE }} />}
            </div>
            {stats.unread > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1 border-2 border-white animate-[badge-pop_0.3s_cubic-bezier(0.175,0.885,0.32,1.275)]"
                style={{ background: DANGER }}
              >
                {stats.unread > 99 ? '99+' : stats.unread}
              </span>
            )}
          </div>
          <div>
            <h1 className="font-[var(--font-body)] text-[1.75rem] font-semibold text-[var(--text)]">
              {isNesa ? 'Notifications & Announcements' : 'Notifications'}
            </h1>
            <p className="font-[var(--font-body)] text-sm text-[var(--text-sub)]">
              {user?.name?.split(' ')[0]}'s activity feed
              {isNesa && ' · Publish announcements to all users'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Button
              variant={showFilters ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setShowFilters((s) => !s)}
            >
              <Filter size={14} /> Filters
            </Button>
            {activeFilters > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-[17px] h-[17px] rounded-full text-white text-[9px] font-bold flex items-center justify-center" style={{ background: DANGER }}>
                {activeFilters}
              </span>
            )}
          </div>
          {stats.unread > 0 && (
            <Button variant="primary" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck size={14} /> Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* NESA Announce Composer */}
      <AnimatePresence>
        {isNesa && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <AnnouncePanel
              onPublished={() => {
                setAnnounceRefresh((n) => n + 1);
                void fetchNotifications(true);
              }}
              senderName={user?.name ?? 'NESA Admin'}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="flex gap-2.5 flex-wrap">
        <StatCard label="Total" value={stats.total} accent={PRIMARY} icon={<Bell size={17} color="#fff" />} />
        <StatCard label="Unread" value={stats.unread} accent={BLUE} icon={<Eye size={17} color="#fff" />} />
        <StatCard label="Action Required" value={stats.requiresAction} accent={DANGER} icon={<AlertCircle size={17} color="#fff" />} />
        <StatCard label="Resolved" value={stats.resolved} accent="#1E40AF" icon={<CheckCircle size={17} color="#fff" />} />
      </div>

      {/* Filters panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-[var(--border)] rounded-md p-3.5 flex flex-wrap gap-2.5 items-end">
              <div>
                <label className="block font-[var(--font-body)] text-[11px] font-bold text-[var(--text-sub)] uppercase tracking-[0.07em] mb-1">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="appearance-none border border-[var(--border)] rounded-md px-3 py-1.5 text-xs bg-white font-[var(--font-body)] text-[var(--text)] outline-none cursor-pointer pr-7 focus:border-[var(--blue)]"
                >
                  <option value="">All Types</option>
                  {Object.entries(TYPE_CONFIG).map(([v, c]) => (
                    <option key={v} value={v}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-[var(--font-body)] text-[11px] font-bold text-[var(--text-sub)] uppercase tracking-[0.07em] mb-1">Priority</label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="appearance-none border border-[var(--border)] rounded-md px-3 py-1.5 text-xs bg-white font-[var(--font-body)] text-[var(--text)] outline-none cursor-pointer pr-7 focus:border-[var(--blue)]"
                >
                  <option value="">All Priorities</option>
                  {[
                    { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' },
                  ].map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-[var(--font-body)] text-[11px] font-bold text-[var(--text-sub)] uppercase tracking-[0.07em] mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="appearance-none border border-[var(--border)] rounded-md px-3 py-1.5 text-xs bg-white font-[var(--font-body)] text-[var(--text)] outline-none cursor-pointer pr-7 focus:border-[var(--blue)]"
                >
                  <option value="">All Statuses</option>
                  {[
                    { value: 'unread', label: 'Unread' }, { value: 'read', label: 'Read' },
                    { value: 'acknowledged', label: 'Acknowledged' }, { value: 'escalated', label: 'Escalated' },
                    { value: 'resolved', label: 'Resolved' },
                  ].map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              {activeFilters > 0 && (
                <Button variant="destructive" size="sm" onClick={() => { setFilterType(''); setFilterPriority(''); setFilterStatus(''); }}>
                  <X size={12} /> Clear
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab bar */}
      <div className="flex gap-1 bg-[#F9FAFB] rounded-md p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setPage(1); setSelected(null); }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm text-xs font-medium cursor-pointer font-[var(--font-body)] border-none transition-all duration-200 ${tab === t.id ? 'bg-white text-[var(--text)]' : 'bg-transparent text-[var(--text-sub)]'}`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span
                className={`min-w-[18px] h-[18px] rounded-full px-1 text-[10px] font-bold flex items-center justify-center ${tab === t.id ? 'text-white' : 'text-[var(--text-sub)] bg-[var(--border)]'}`}
                style={tab === t.id ? { background: t.id === 'action' ? DANGER : PRIMARY } : undefined}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content: list + detail */}
      <div className="grid gap-3.5 items-start" style={{ gridTemplateColumns: selected ? '1fr 400px' : '1fr' }}>
        <div className="flex flex-col gap-2">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-[#F9FAFB] rounded-md p-5 flex gap-3">
                <div className="w-9 h-9 rounded-md bg-[var(--border)] animate-pulse shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-3 rounded-md bg-[var(--border)] animate-pulse w-3/5" />
                  <div className="h-2.5 rounded-md bg-[var(--border)] animate-pulse w-11/12" />
                  <div className="h-2.5 rounded-md bg-[var(--border)] animate-pulse w-2/5" />
                </div>
              </div>
            ))
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={BellOff}
              title={activeFilters > 0 || tab !== 'all' ? 'No matching notifications' : "You're all caught up!"}
              description={activeFilters > 0 || tab !== 'all' ? 'Try adjusting your filters to see more.' : 'No notifications at the moment. Check back soon.'}
            />
          ) : (
            notifications.map((notif) => (
              <NotifCard
                key={notif.id}
                notif={notif}
                isSelected={selected?.id === notif.id}
                onSelect={() => handleSelect(notif)}
                onAcknowledge={handleAcknowledge}
                onEscalate={handleEscalate}
                onDelete={handleDelete}
                onMarkRead={handleMarkRead}
              />
            ))
          )}

          {!loading && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-1 py-3">
              <p className="font-[var(--font-body)] text-xs text-[var(--text-muted)]">
                Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 border border-[var(--border)] rounded-sm bg-white font-[var(--font-body)] text-xs cursor-pointer disabled:text-[var(--border)] disabled:cursor-default text-[var(--text)]"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="px-3 py-1.5 border border-[var(--border)] rounded-sm bg-white font-[var(--font-body)] text-xs cursor-pointer disabled:text-[var(--border)] disabled:cursor-default text-[var(--text)]"
                >
                  Next <ChevronRight size={12} className="inline" />
                </button>
              </div>
            </div>
          )}

          {/* Published history — NESA only, shown below the feed */}
          {isNesa && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2">
              <PublishedHistory refreshTrigger={announceRefresh} />
            </motion.div>
          )}
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {selected && (
            <div className="sticky top-4">
              <DetailPanel
                notif={selected}
                onClose={() => setSelected(null)}
                onAcknowledge={handleAcknowledge}
                onEscalate={handleEscalate}
                onDelete={handleDelete}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
