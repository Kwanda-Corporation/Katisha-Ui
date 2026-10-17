import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Phone, X } from 'lucide-react'
import PhoneInput from '../../components/ui/PhoneInput'
import Button from '../../components/ui/Button'
import { SettingsField } from '../../components/studio/SettingsModal'
import Tabs from '../../components/studio/Tabs'
import api from '../../api'
import { useAuth } from '../../contexts/AuthContext'

export interface PromoterProfile {
  name?: string
  phone?: string
  promoterCode?: string
  status?: string
  payoutPhone?: string
  hasCustomPayoutPhone?: boolean
  commissionRate?: number
}

type TabId = 'payout' | 'password'

interface PromoterSettingsModalProps {
  open: boolean
  onClose: () => void
  profile: PromoterProfile | null
  /** Called after the payout number changes, so the caller can refresh. */
  onProfileUpdated?: (payoutPhone: string) => void
}

/** Digits of a phone in MSISDN or local form — enough to spot a real edit. */
function phoneKey(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * PromoterSettingsModal — backdrop settings dialog with two tabs: the mobile
 * money number commissions are paid to, and the account password.
 *
 * Each tab keeps its own draft state so switching between them never discards
 * half-typed input, and each saves independently. Closing with unsaved changes
 * asks for confirmation.
 */
export default function PromoterSettingsModal({
  open,
  onClose,
  profile,
  onProfileUpdated,
}: PromoterSettingsModalProps) {
  const { t } = useTranslation()
  const { setTokens } = useAuth()

  const [tab, setTab] = useState<TabId>('payout')
  const [confirmClose, setConfirmClose] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  /* ---- Payout phone tab ---- */
  const [payoutPhone, setPayoutPhone] = useState('')
  const [phoneSaving, setPhoneSaving] = useState(false)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [phoneSaved, setPhoneSaved] = useState(false)

  /* ---- Password tab ---- */
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [reveal, setReveal] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSaved, setPwSaved] = useState(false)

  // Seed the payout field from the profile whenever the modal opens.
  useEffect(() => {
    if (!open) return
    setTab('payout')
    setConfirmClose(false)
    setPayoutPhone(profile?.payoutPhone || profile?.phone || '')
    setPhoneError(null)
    setPhoneSaved(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setReveal(false)
    setPwError(null)
    setPwSaved(false)
  }, [open, profile?.payoutPhone, profile?.phone])

  const originalPhone = profile?.payoutPhone || profile?.phone || ''
  const phoneDirty = phoneKey(payoutPhone) !== phoneKey(originalPhone)

  const pwDirty = Boolean(currentPassword && newPassword)
  const pwMismatched = confirmPassword.length > 0 && confirmPassword !== newPassword
  const pwTooShort = newPassword.length > 0 && newPassword.length < 8
  const pwSameAsCurrent = Boolean(currentPassword && newPassword && currentPassword === newPassword)
  const pwBlocked = !pwDirty || pwMismatched || pwTooShort || pwSameAsCurrent

  const pwDirtyAnywhere = Boolean(currentPassword || newPassword || confirmPassword)
  const anyDirty = (tab === 'payout' ? phoneDirty : pwDirtyAnywhere) && !phoneSaving && !pwSaving

  const requestClose = useCallback(() => {
    if (anyDirty) setConfirmClose(true)
    else onClose()
  }, [anyDirty, onClose])

  // Escape closes, and the page behind the backdrop must not scroll.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => dialogRef.current?.focus())
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, requestClose])

  // Clear the transient success banner when the user starts editing again.
  useEffect(() => {
    if (phoneDirty) setPhoneSaved(false)
  }, [phoneDirty])
  useEffect(() => {
    if (pwDirtyAnywhere) setPwSaved(false)
  }, [pwDirtyAnywhere])

  if (!open) return null

  const savePhone = async () => {
    if (!phoneDirty || phoneSaving) return
    setPhoneSaving(true)
    setPhoneError(null)
    try {
      const r = await api.updatePromoterProfile({ payoutPhone })
      const saved = r.data?.payoutPhone ?? payoutPhone
      setPayoutPhone(saved)
      setPhoneSaved(true)
      onProfileUpdated?.(saved)
    } catch (e: any) {
      setPhoneError(e.message || 'Failed to save the payout number')
    } finally {
      setPhoneSaving(false)
    }
  }

  const savePassword = async () => {
    if (pwBlocked || pwSaving) return
    setPwSaving(true)
    setPwError(null)
    try {
      const r = await api.changePassword({ currentPassword, newPassword, confirmPassword })
      // The server rotated the refresh token, so adopt the new pair or the
      // next silent refresh would fail and sign the user out.
      if (r.data?.accessToken) setTokens(r.data.accessToken, r.data.refreshToken)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setReveal(false)
      setPwSaved(true)
    } catch (e: any) {
      setPwError(e.message || 'Failed to change your password')
    } finally {
      setPwSaving(false)
    }
  }

  const tabs = [
    { id: 'payout', label: t('promoter.payoutNumberTab') },
    { id: 'password', label: t('promoter.changePasswordTab') },
  ]

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center sm:p-4"
      style={{ background: 'rgba(15,23,42,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) requestClose() }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('studio.settings')}
        tabIndex={-1}
        className="bg-white w-full flex flex-col outline-none h-[97dvh] sm:h-[89dvh] rounded-t-2xl sm:rounded-2xl shadow-[0_-12px_40px_-12px_rgba(15,23,42,0.25)] sm:shadow-[0_30px_80px_rgba(15,23,42,0.16)]"
        style={{
          maxWidth: 560,
        }}
      >
        {/* Drag affordance, phones only — matches the booking sheets. */}
        <div className="shrink-0 flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1.5 rounded-full bg-[#E4E4E7]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--studio-border)] shrink-0">
          <h2 className="text-lg font-semibold text-[var(--studio-text)]">{t('studio.settings')}</h2>
          <button
            type="button"
            onClick={requestClose}
            aria-label={t('common.close')}
            className="p-1.5 rounded-full hover:bg-[var(--studio-muted-fill)] cursor-pointer"
          >
            <X size={18} className="text-[var(--studio-text-muted)]" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-1 shrink-0">
          <Tabs tabs={tabs} activeTab={tab} onTabChange={(id) => setTab(id as TabId)} ariaLabel={t('studio.settings')} />
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
          {tab === 'payout' ? (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Phone size={16} className="text-[var(--studio-accent)]" />
                <h3 className="text-sm font-semibold text-[var(--studio-text)]">{t('promoter.payoutNumber')}</h3>
              </div>
              <p className="text-xs text-[var(--studio-text-muted)] mb-5">{t('promoter.payoutAutomaticHint')}</p>

              <div className="max-w-sm">
                <PhoneInput
                  value={payoutPhone}
                  onChange={(v) => { setPayoutPhone(v); setPhoneError(null) }}
                />
              </div>

              {profile?.hasCustomPayoutPhone && (
                <p className="mt-3 text-xs text-[var(--studio-text-muted)]">
                  {t('promoter.payoutCurrently')}: <span className="font-mono">{originalPhone}</span>
                </p>
              )}

              {phoneError && (
                <p className="mt-3 flex items-start gap-1.5 text-sm text-[var(--error)]">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  {phoneError}
                </p>
              )}
              {phoneSaved && (
                <p className="mt-3 flex items-center gap-1.5 text-sm text-[var(--success)]">
                  <CheckCircle2 size={15} />
                  {t('promoter.payoutNumberSaved')}
                </p>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <KeyRound size={16} className="text-[var(--studio-accent)]" />
                <h3 className="text-sm font-semibold text-[var(--studio-text)]">{t('promoter.changePassword')}</h3>
              </div>
              <p className="text-xs text-[var(--studio-text-muted)] mb-5">{t('promoter.changePasswordHint')}</p>

              <SettingsField
                label={t('promoter.currentPassword')}
                type={reveal ? 'text' : 'password'}
                value={currentPassword}
                onChange={(v) => { setCurrentPassword(v); setPwError(null) }}
                autoComplete="current-password"
                name="current-password"
              />
              <SettingsField
                label={t('promoter.newPassword')}
                type={reveal ? 'text' : 'password'}
                value={newPassword}
                onChange={(v) => { setNewPassword(v); setPwError(null) }}
                autoComplete="new-password"
                name="new-password"
              />
              <SettingsField
                label={t('promoter.confirmNewPassword')}
                type={reveal ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(v) => { setConfirmPassword(v); setPwError(null) }}
                autoComplete="new-password"
                name="confirm-new-password"
              />

              <button
                type="button"
                onClick={() => setReveal((r) => !r)}
                className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--studio-accent)] hover:underline bg-transparent border-0 p-0 cursor-pointer"
              >
                {reveal ? <EyeOff size={14} /> : <Eye size={14} />}
                {reveal ? t('auth.hidePassword') : t('auth.showPassword')}
              </button>

              <ul className="space-y-1.5 text-xs">
                {pwTooShort && (
                  <li className="flex items-center gap-1.5 text-[var(--error)]">
                    <AlertCircle size={13} /> {t('auth.passwordMinEight')}
                  </li>
                )}
                {pwSameAsCurrent && (
                  <li className="flex items-center gap-1.5 text-[var(--error)]">
                    <AlertCircle size={13} /> {t('promoter.passwordMustDiffer')}
                  </li>
                )}
                {pwMismatched && (
                  <li className="flex items-center gap-1.5 text-[var(--error)]">
                    <AlertCircle size={13} /> {t('promoter.passwordsDoNotMatch')}
                  </li>
                )}
              </ul>

              {pwError && (
                <p className="mt-3 flex items-start gap-1.5 text-sm text-[var(--error)]">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  {pwError}
                </p>
              )}
              {pwSaved && (
                <p className="mt-3 flex items-center gap-1.5 text-sm text-[var(--success)]">
                  <CheckCircle2 size={15} />
                  {t('promoter.passwordChanged')}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer — the action belongs to the visible tab */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[var(--studio-border)] shrink-0">
          <Button variant="secondary" size="sm" onClick={requestClose} className="!rounded-full">
            {t('common.cancel')}
          </Button>
          {tab === 'payout' ? (
            <Button size="sm" onClick={savePhone} disabled={!phoneDirty} loading={phoneSaving} className="!rounded-full">
              {t('common.save')}
            </Button>
          ) : (
            <Button size="sm" onClick={savePassword} disabled={pwBlocked} loading={pwSaving} className="!rounded-full">
              {t('promoter.changePassword')}
            </Button>
          )}
        </div>
      </div>

      {/* Discard-changes confirmation */}
      {confirmClose && (
        <div
          className="fixed inset-0 z-[1010] flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.5)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmClose(false) }}
        >
          <div className="bg-white p-6 w-full max-w-sm" style={{ borderRadius: 'var(--studio-radius-card)' }}>
            <p className="text-sm text-[var(--studio-text-sub)] mb-5">{t('studio.discardChanges')}</p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setConfirmClose(false)} className="!rounded-full">
                {t('common.cancel')}
              </Button>
              <Button size="sm" onClick={() => { setConfirmClose(false); onClose() }} className="!rounded-full">
                {t('studio.discard')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
