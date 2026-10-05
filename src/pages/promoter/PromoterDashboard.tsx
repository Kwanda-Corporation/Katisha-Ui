import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Copy, Check, Link2, Share2, TrendingUp, Users, Wallet, CheckCircle2, Settings, Zap, Smartphone } from 'lucide-react'
import StudioShell from '../../components/studio/StudioShell'
import StudioHeading from '../../components/studio/StudioHeading'
import StudioCard from '../../components/studio/StudioCard'
import EmptyState from '../../components/studio/EmptyState'
import Button from '../../components/ui/Button'
import PromoterSettingsModal from './PromoterSettingsModal'
import api from '../../api'

const rwf = (n: number) => `${Number(n || 0).toLocaleString('en-RW')} RWF`

export default function PromoterDashboard() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<'link' | 'code' | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    let alive = true
    Promise.all([api.getPromoterStats(), api.getPromoterProfile()])
      .then(([s, p]) => {
        if (!alive) return
        setStats(s.data)
        setProfile(p.data)
      })
      .catch((e) => alive && setError(e.message || 'Failed to load dashboard'))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [])

  const referralLink = profile?.promoterCode
    ? `${window.location.origin}/?ref=${encodeURIComponent(profile.promoterCode)}`
    : ''

  const copy = useCallback(async (value: string, which: 'link' | 'code') => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(which)
      setTimeout(() => setCopied((c) => (c === which ? null : c)), 2000)
    } catch {
      // Clipboard blocked (insecure origin / permissions) — leave the text selectable.
    }
  }, [])

  const share = useCallback(async () => {
    if (!referralLink) return
    if (navigator.share) {
      try {
        await navigator.share({ title: t('promoter.earnFromKatisha'), text: t('promoter.earnTooltip'), url: referralLink })
        return
      } catch {
        return
      }
    }
    await copy(referralLink, 'link')
  }, [referralLink, t, copy])

  const earnings = stats?.earnings || {}
  const referrals = stats?.referrals || {}

  return (
    <StudioShell>
      <div className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <StudioHeading>{t('promoter.promoterDashboard')}</StudioHeading>
            <p className="mt-2 text-[var(--text-sub)]">{t('promoter.earnTooltip')}</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSettingsOpen(true)}
            className="!rounded-full"
          >
            <Settings size={15} />
            {t('promoter.openSettings')}
          </Button>
        </div>

        {/* Referral link — the primary promoter action. */}
        <StudioCard>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Link2 size={18} className="text-[var(--studio-accent)]" />
              <h2 className="text-sm font-semibold text-[var(--studio-text)]">{t('promoter.yourReferralLink')}</h2>
            </div>
            <button
              type="button"
              onClick={share}
              disabled={!referralLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              style={{ background: 'var(--studio-accent)', borderRadius: 9999 }}
            >
              <Share2 size={14} />
              {t('promoter.shareLink')}
            </button>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <input
              readOnly
              value={referralLink || '—'}
              aria-label={t('promoter.yourReferralLink')}
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 min-w-0 px-3 py-2.5 text-sm font-mono text-[var(--studio-text)] bg-[var(--studio-muted-fill)] border border-[var(--studio-border)] outline-none focus:border-[var(--studio-accent)]"
              style={{ borderRadius: 10 }}
            />
            <button
              type="button"
              onClick={() => copy(referralLink, 'link')}
              disabled={!referralLink}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-[var(--studio-surface)] border border-[var(--studio-border)] text-[var(--studio-text)] hover:bg-[var(--studio-muted-fill)] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              style={{ borderRadius: 10 }}
            >
              {copied === 'link' ? <Check size={16} /> : <Copy size={16} />}
              {copied === 'link' ? t('promoter.copied') : t('promoter.copyLink')}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 pt-4 border-t border-[var(--studio-border)]">
            <span className="text-xs text-[var(--studio-text-sub)]">{t('promoter.referralCode')}</span>
            <code className="px-2.5 py-1 text-sm font-mono font-semibold text-[var(--studio-text)] bg-[var(--studio-muted-fill)]" style={{ borderRadius: 8 }}>
              {profile?.promoterCode || '—'}
            </code>
            <button
              type="button"
              onClick={() => copy(profile?.promoterCode || '', 'code')}
              disabled={!profile?.promoterCode}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--studio-accent)] hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:no-underline bg-transparent border-0 cursor-pointer disabled:cursor-not-allowed p-0"
            >
              {copied === 'code' ? <Check size={13} /> : <Copy size={13} />}
              {copied === 'code' ? t('promoter.copied') : t('promoter.copyCode')}
            </button>
          </div>
        </StudioCard>

        {/* Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          <StudioCard padding="sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--studio-text-sub)]">{t('promoter.linkOpens')}</span>
              <Link2 size={16} className="text-[var(--studio-accent)]" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-[var(--studio-text)]">{stats?.linkClicks ?? 0}</p>
            <p className="mt-1 text-xs text-[var(--studio-text-muted)]">{t('promoter.linkOpensDesc')}</p>
          </StudioCard>
          <StudioCard padding="sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--studio-text-sub)]">{t('promoter.totalEarnings')}</span>
              <Wallet size={16} className="text-[var(--studio-accent)]" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-[var(--studio-text)]">{rwf(earnings.lifetimeEarned)}</p>
          </StudioCard>
          <StudioCard padding="sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--studio-text-sub)]">{t('promoter.availableBalance')}</span>
              <TrendingUp size={16} className="text-[var(--studio-accent)]" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-[var(--studio-text)]">{rwf(earnings.availableBalance)}</p>
          </StudioCard>
          <StudioCard padding="sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--studio-text-sub)]">{t('promoter.paidEarnings')}</span>
              <CheckCircle2 size={16} className="text-[var(--studio-accent)]" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-[var(--studio-text)]">{rwf(earnings.paidTotal)}</p>
          </StudioCard>
          <StudioCard padding="sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--studio-text-sub)]">{t('promoter.referrals')}</span>
              <Users size={16} className="text-[var(--studio-accent)]" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-[var(--studio-text)]">{referrals.total ?? 0}</p>
            <p className="mt-1 text-xs text-[var(--studio-text-muted)]">
              {t('promoter.convertedBookings')}: {referrals.converted ?? 0} ({referrals.conversionRate ?? 0}%)
            </p>
          </StudioCard>
        </div>

        {/* Payout policy — there is no threshold, everything is sent automatically. */}
        <StudioCard padding="sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-[var(--studio-accent)]" />
              <span className="text-sm text-[var(--studio-text-sub)]">{t('promoter.payoutThreshold')}</span>
            </div>
            <span className="text-sm font-medium text-[var(--studio-text)]">
              {t('promoter.noMinPayout')}
            </span>
          </div>
          <p className="mt-3 text-sm text-[var(--studio-text-muted)]">
            {t('promoter.payoutReady')}
          </p>
          <div className="mt-4 pt-4 border-t border-[var(--studio-border)] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Smartphone size={15} className="text-[var(--studio-accent)] shrink-0" />
              <span className="text-xs text-[var(--studio-text-muted)]">{t('promoter.payoutNumber')}</span>
              <span className="font-mono text-sm font-medium text-[var(--studio-text)] truncate">
                {profile?.payoutPhone || '—'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="text-xs font-medium text-[var(--studio-accent)] hover:underline bg-transparent border-0 p-0 cursor-pointer"
            >
              {t('promoter.openSettings')}
            </button>
          </div>
        </StudioCard>

        {error && (
          <StudioCard padding="sm">
            <p className="text-sm text-[var(--error)]">{error}</p>
          </StudioCard>
        )}

        {/* Recent commissions */}
        <StudioCard>
          <h2 className="text-sm font-semibold text-[var(--studio-text)] mb-4">{t('promoter.recentActivity')}</h2>
          {!loading && (stats?.recentCommissions?.length ?? 0) === 0 ? (
            <EmptyState
              svgSrc="/youtube_graphic_no_content_illustration_v4.svg"
              svgAlt={t('promoter.noEarnings')}
              title={t('promoter.noEarnings')}
              description={t('promoter.noEarningsDesc')}
            />
          ) : (
            <ul className="divide-y divide-[var(--studio-border)]">
              {(stats?.recentCommissions ?? []).map((c: any) => (
                <li key={c._id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--studio-text)] truncate">
                      {c.booking?.referenceCode || t('promoter.commission')}
                    </p>
                    <p className="text-xs text-[var(--studio-text-muted)]">
                      {c.earnedAt ? new Date(c.earnedAt).toLocaleDateString() : '—'}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-[var(--studio-text)]">{rwf(c.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </StudioCard>
      </div>

      <PromoterSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        profile={profile}
        onProfileUpdated={(payoutPhone) =>
          setProfile((p: any) => ({ ...(p || {}), payoutPhone, hasCustomPayoutPhone: true }))
        }
      />
    </StudioShell>
  )
}