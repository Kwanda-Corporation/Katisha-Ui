import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Megaphone, Send, Loader2, RefreshCw, Trash2, Eye, EyeOff, Bell,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api, type LocalizedAnnouncementText } from '../../api';
import { PageHeader, Button, StatCard, EmptyState } from '../../components/ui';

// Website-supported locales. An announcement must be composed in every one of
// them so a visitor's language switch is reflected in the banner and the
// in-app notification.
const ANNOUNCEMENT_LANGS = [
  { code: 'en', label: 'English' },
  { code: 'kin', label: 'Kinyarwanda' },
  { code: 'sw', label: 'Kiswahili' },
  { code: 'fr', label: 'Français' },
] as const;

type LangCode = (typeof ANNOUNCEMENT_LANGS)[number]['code'];

interface Announcement {
  _id: string;
  title: string;
  message: string;
  titles?: Partial<LocalizedAnnouncementText>;
  messages?: Partial<LocalizedAnnouncementText>;
  active: boolean;
  createdAt: string;
}

const emptyText = (): LocalizedAnnouncementText => ({ en: '', kin: '', sw: '', fr: '' });

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function Announcements() {
  const { t, i18n } = useTranslation();
  const [activeLang, setActiveLang] = useState<LangCode>('en');
  const [titles, setTitles] = useState<LocalizedAnnouncementText>(emptyText);
  const [messages, setMessages] = useState<LocalizedAnnouncementText>(emptyText);
  const [notify, setNotify] = useState(true);
  const [targetRole, setTargetRole] = useState('all');
  const [publishing, setPublishing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [list, setList] = useState<Announcement[]>([]);

  const currentLang: LangCode = ANNOUNCEMENT_LANGS.some((l) => l.code === i18n.language)
    ? (i18n.language as LangCode)
    : 'en';

  const isLangComplete = (code: LangCode) => !!(titles[code].trim() && messages[code].trim());
  const completedCount = ANNOUNCEMENT_LANGS.filter((l) => isLangComplete(l.code)).length;
  const allComplete = completedCount === ANNOUNCEMENT_LANGS.length;

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getAnnouncements();
      setList(res?.data?.announcements ?? []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const handlePublish = async () => {
    if (!allComplete) { setError(t('announcements.incomplete')); return; }
    setPublishing(true); setError(''); setSuccess('');
    try {
      const trimmedTitles = Object.fromEntries(
        ANNOUNCEMENT_LANGS.map((l) => [l.code, titles[l.code].trim()])
      ) as LocalizedAnnouncementText;
      const trimmedMessages = Object.fromEntries(
        ANNOUNCEMENT_LANGS.map((l) => [l.code, messages[l.code].trim()])
      ) as LocalizedAnnouncementText;

      await api.publishAnnouncement({ titles: trimmedTitles, messages: trimmedMessages, active: true });
      if (notify) {
        await api.createAnnouncement({
          title: trimmedTitles[currentLang],
          message: trimmedMessages[currentLang],
          titles: trimmedTitles,
          messages: trimmedMessages,
          targetRole: targetRole === 'all' ? undefined : targetRole,
        });
      }
      setSuccess(t('announcements.published'));
      setTitles(emptyText());
      setMessages(emptyText());
      setActiveLang('en');
      await fetchList();
    } catch (err: any) {
      setError(err.message || t('announcements.error'));
    } finally {
      setPublishing(false);
    }
  };

  const toggleActive = async (a: Announcement) => {
    await api.updateAnnouncement(a._id, { active: !a.active });
    fetchList();
  };

  const remove = async (a: Announcement) => {
    if (!window.confirm(t('announcements.confirmDelete'))) return;
    await api.deleteAnnouncement(a._id);
    fetchList();
  };

  const displayTitle = (a: Announcement) => a.titles?.[currentLang]?.trim() || a.title;
  const displayMessage = (a: Announcement) => a.messages?.[currentLang]?.trim() || a.message;

  const activeCount = list.filter((a) => a.active).length;

  return (
    <div className="space-y-5 font-[var(--font-body)]">
      <PageHeader
        title={t('announcements.title')}
        subtitle={t('announcements.subtitle')}
        actions={
          <button
            onClick={fetchList}
            className="p-2 rounded-md border border-[var(--studio-border)] hover:bg-[var(--studio-muted-fill)] text-[var(--studio-text-muted)] transition-colors"
            title={t('common.refresh') || 'Refresh'}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label={t('announcements.statTotal')} value={list.length} icon={<Megaphone size={14} />} />
        <StatCard label={t('announcements.statActive')} value={activeCount} icon={<Eye size={14} />} />
        <StatCard label={t('announcements.statBanner')} value={activeCount > 0 ? t('announcements.live') : '—'} icon={<Bell size={14} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Compose */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-md border border-[var(--studio-border)] bg-[var(--studio-surface)] p-6 space-y-5"
        >
          <div>
            <h2 className="text-base font-semibold text-[var(--studio-text)]">{t('announcements.compose')}</h2>
            <p className="text-xs text-[var(--studio-text-sub)] mt-1">{t('announcements.languagesHint')}</p>
          </div>

          {/* Language tabs — every locale must be completed before publishing. */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {ANNOUNCEMENT_LANGS.map((l) => {
              const isActive = activeLang === l.code;
              const done = isLangComplete(l.code);
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setActiveLang(l.code)}
                  aria-pressed={isActive}
                  className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-md border transition-all"
                  style={isActive
                    ? { background: 'var(--studio-accent)', color: 'white', borderColor: 'var(--studio-accent)' }
                    : { background: 'var(--studio-surface)', color: 'var(--studio-text-sub)', borderColor: 'var(--studio-border)' }}
                >
                  {l.label}
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: done ? 'var(--tone-success-dot)' : isActive ? 'rgba(255,255,255,0.5)' : 'var(--fill-strong)' }}
                  />
                </button>
              );
            })}
            <span className="text-[11px] text-[var(--studio-text-muted)] ml-auto">
              {t('announcements.languageProgress', { done: completedCount, total: ANNOUNCEMENT_LANGS.length })}
            </span>
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--studio-text-sub)] block mb-1.5">{t('announcements.fieldTitle')}</label>
            <input
              value={titles[activeLang]}
              onChange={(e) => setTitles((prev) => ({ ...prev, [activeLang]: e.target.value }))}
              className="w-full h-11 px-4 rounded-md border border-[var(--studio-border)] text-sm outline-none focus:border-[var(--studio-accent)]"
              placeholder={t('announcements.titlePlaceholder')}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--studio-text-sub)] block mb-1.5">{t('announcements.fieldMessage')}</label>
            <textarea
              value={messages[activeLang]}
              onChange={(e) => setMessages((prev) => ({ ...prev, [activeLang]: e.target.value }))}
              rows={4}
              className="w-full p-4 rounded-md border border-[var(--studio-border)] text-sm resize-none outline-none focus:border-[var(--studio-accent)]"
              placeholder={t('announcements.messagePlaceholder')}
            />
          </div>

          <div className="flex items-start gap-3 p-3 rounded-md bg-[var(--studio-muted-fill)]">
            <button
              type="button"
              onClick={() => setNotify(!notify)}
              className="mt-0.5 w-9 h-5 rounded-full transition-colors shrink-0 relative"
              style={{ background: notify ? 'var(--studio-accent)' : 'var(--fill-strong)' }}
              aria-pressed={notify}
            >
              <span
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                style={{ left: notify ? '18px' : '2px' }}
              />
            </button>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--studio-text)]">{t('announcements.notifyLabel')}</p>
              {notify && (
                <div className="flex gap-2 mt-2">
                  {(['all', 'agency_admin', 'agent'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setTargetRole(r)}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-md border transition-all"
                      style={targetRole === r
                        ? { background: 'var(--studio-accent)', color: 'white', borderColor: 'var(--studio-accent)' }
                        : { background: 'var(--studio-surface)', color: 'var(--studio-text-sub)', borderColor: 'var(--studio-border)' }}
                    >
                      {r === 'all' ? t('announcements.targetAll') : r === 'agency_admin' ? t('announcements.targetAgency') : t('announcements.targetAgents')}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && <div className="p-3 rounded-md text-xs font-medium" style={{ background: 'var(--tone-danger-fill)', color: 'var(--tone-danger-ink)' }}>{error}</div>}
          {success && <div className="p-3 rounded-md text-xs font-medium" style={{ background: 'var(--tone-success-fill)', color: 'var(--tone-success-ink)' }}>{success}</div>}
          {!allComplete && !error && (
            <p className="text-[11px] font-medium" style={{ color: 'var(--tone-warning-ink)' }}>{t('announcements.incomplete')}</p>
          )}

          <Button variant="primary" fullWidth loading={publishing} disabled={publishing || !allComplete} onClick={handlePublish}>
            <Send size={15} /> {t('announcements.publish')}
          </Button>
        </motion.div>

        {/* Published list */}
        <div className="rounded-md border border-[var(--studio-border)] bg-[var(--studio-surface)] p-6">
          <h2 className="text-base font-semibold text-[var(--studio-text)] mb-4">{t('announcements.publishedTitle')}</h2>
          {loading ? (
            <div className="flex items-center justify-center py-14">
              <Loader2 size={20} className="animate-spin text-[var(--studio-accent)]" />
            </div>
          ) : list.length === 0 ? (
            <EmptyState icon={Megaphone} title={t('announcements.empty')} svgAlt={t('announcements.empty')} />
          ) : (
            <div className="space-y-2.5">
              {list.map((a) => (
                <div
                  key={a._id}
                  className="p-3.5 rounded-md border bg-[var(--studio-surface)]"
                  style={{ borderColor: a.active ? 'var(--studio-accent)' : 'var(--studio-border)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--studio-text)] truncate">{displayTitle(a)}</p>
                      <p className="text-xs text-[var(--studio-text-sub)] mt-0.5 line-clamp-2">{displayMessage(a)}</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        {ANNOUNCEMENT_LANGS.map((l) => (
                          <span
                            key={l.code}
                            title={l.label}
                            className="text-[9px] font-bold uppercase px-1 py-0.5 rounded border"
                            style={a.titles?.[l.code]?.trim() && a.messages?.[l.code]?.trim()
                              ? { color: 'var(--studio-accent)', borderColor: 'var(--studio-accent)', background: 'var(--studio-accent-soft)' }
                              : { color: 'var(--studio-text-muted)', borderColor: 'var(--studio-border)' }}
                          >
                            {l.code}
                          </span>
                        ))}
                        <span className="text-[10px] text-[var(--studio-text-muted)] ml-1">{timeAgo(a.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleActive(a)}
                        title={a.active ? t('announcements.hide') : t('announcements.show')}
                        className="p-2 rounded-md border border-[var(--studio-border)] hover:bg-[var(--studio-muted-fill)] text-[var(--studio-text-sub)] transition-colors"
                        style={a.active ? { color: 'var(--studio-accent)', borderColor: 'var(--studio-accent)' } : undefined}
                      >
                        {a.active ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <button
                        onClick={() => remove(a)}
                        title={t('announcements.delete')}
                        className="p-2 rounded-md border transition-colors"
                        style={{ borderColor: 'var(--tone-danger-line)', color: 'var(--tone-danger-ink)', background: 'var(--tone-danger-fill)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
