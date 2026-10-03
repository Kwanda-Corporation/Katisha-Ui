import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Copy, Check, Link2, ShieldCheck, Percent, Phone, KeyRound, Settings as SettingsIcon } from 'lucide-react'
import StudioShell from '../../components/studio/StudioShell'
import StudioHeading from '../../components/studio/StudioHeading'
import StudioCard from '../../components/studio/StudioCard'
import Button from '../../components/ui/Button'
import PromoterSettingsModal, { type PromoterProfile } from './PromoterSettingsModal'
import api from '../../api'

/**
 * PromoterSettings — read-only overview plus the single entry point to the
 * editing UI. Everything editable lives in PromoterSettingsModal so the
 * dashboard and this route can never drift apart.
 */
export default function PromoterSettings() {
  const { t } = useTranslation()
  const [profile, setProfile] = useState<PromoterProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await api.getPromoterProfile()
      setProfile(r?.data ?? null)
    } catch (e: any) {
      setError(e?.message || t('promoter.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => { load() }, [load])

  const referralLink = profile?.promoterCode
    ? `${window.location.origin}/?ref=${encodeURIComponent(profile.promoterCode)}`
    : ''

  const copyLink = async () => {
    if (!referralLink) return
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked (insecure origin / permissions) — link stays selectable.
    }
  }

  return (
    <StudioShell>
      <div className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <StudioHeading>{t('studio.settings')}</StudioHeading>
            <p className="mt-2 text-[var(--text-sub)]">{t('promoter.settingsDescription')}</p>
          </div>
          <Button onClick={() => setSettingsOpen(true)} disabled={loading} className="!rounded-full">
            <SettingsIcon size={15} />
            {t('promoter.editSettings')}
          </Button>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Referral link */}
        <StudioCard>
          <div className="flex items-center gap-2">
            <Link2 size={18} className="text-[var(--studio-accent)]" />
            <h2 className="text-sm font-semibold text-[var(--studio-text)]">{t('promoter.yourReferralLink')}</h2>
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
            <Button variant="secondary" onClick={copyLink} disabled={!referralLink} className="!rounded-[10px]">
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? t('promoter.copied') : t('promoter.copyLink')}
            </Button>
          </div>
        </StudioCard>

        {/* Account facts — read only */}
        <StudioCard>
          <h2 className="text-sm font-semibold text-[var(--studio-text)] mb-4">{t('promoter.promoterDetails')}</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <dt className="text-xs text-[var(--studio-text-muted)]">{t('promoter.referralCode')}</dt>
              <dd className="mt-1 font-mono text-sm font-semibold text-[var(--studio-text)]">
                {profile?.promoterCode || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--studio-text-muted)]">{t('promoter.status')}</dt>
              <dd className="mt-1 flex items-center gap-1.5 text-sm font-medium text-[var(--studio-text)]">
                <ShieldCheck size={15} className="text-[var(--studio-accent)]" />
                {profile?.status || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--studio-text-muted)] flex items-center gap-1">
                <Percent size={12} /> {t('promoter.commissionRate')}
              </dt>
              <dd className="mt-1 text-sm font-medium text-[var(--studio-text)]">
                {profile?.commissionRate ?? 25}%
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-[var(--studio-text-muted)]">{t('promoter.minPayoutNote')}</p>
        </StudioCard>

        {/* Security + payout — both edited in the shared modal. */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StudioCard>
            <div className="flex items-center gap-2">
              <Phone size={16} className="text-[var(--studio-accent)]" />
              <h2 className="text-sm font-semibold text-[var(--studio-text)]">{t('promoter.payoutNumber')}</h2>
            </div>
            <p className="mt-2 text-xs text-[var(--studio-text-muted)]">{t('promoter.payoutHint')}</p>
            <p className="mt-3 font-mono text-lg font-semibold text-[var(--studio-text)]">
              {profile?.payoutPhone || '—'}
            </p>
            <Button
              variant="secondary"
              onClick={() => setSettingsOpen(true)}
              className="mt-4 !rounded-full"
              disabled={loading}
            >
              <Phone size={15} />
              {t('promoter.changePayoutNumber')}
            </Button>
          </StudioCard>

          <StudioCard>
            <div className="flex items-center gap-2">
              <KeyRound size={16} className="text-[var(--studio-accent)]" />
              <h2 className="text-sm font-semibold text-[var(--studio-text)]">{t('promoter.password')}</h2>
            </div>
            <p className="mt-2 text-xs text-[var(--studio-text-muted)]">{t('promoter.passwordHint')}</p>
            <p className="mt-3 font-mono text-lg font-semibold text-[var(--studio-text)]">••••••••</p>
            <Button
              variant="secondary"
              onClick={() => setSettingsOpen(true)}
              className="mt-4 !rounded-full"
              disabled={loading}
            >
              <KeyRound size={15} />
              {t('promoter.changePassword')}
            </Button>
          </StudioCard>
        </div>
      </div>

      <PromoterSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        profile={profile}
        onProfileUpdated={(payoutPhone) =>
          setProfile((p) => ({ ...(p || {}), payoutPhone, hasCustomPayoutPhone: true }))
        }
      />
    </StudioShell>
  )
}
