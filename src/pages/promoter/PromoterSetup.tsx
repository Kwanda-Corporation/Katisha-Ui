import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { AlertCircle, ArrowRight, BadgeCheck, Banknote, UserPlus, LogIn } from 'lucide-react'
import { PhoneInput, Spinner } from '../../components/ui'
import { useTranslation } from 'react-i18next'
import { useToast } from '../../components/ui/Toast'
import { useAuth } from '../../contexts/AuthContext'
import { API_BASE } from '../../config/apiBase'
import AuthLayout from '../../components/AuthLayout'
import SEO from '../../components/seo/SEO'
import { PasswordField } from '../../components/auth/PasswordStrength'

type Path = 'new' | 'existing' | null

export default function PromoterSetup() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const toast = useToast()
  const { user, isAuthenticated } = useAuth()

  const [path, setPath] = useState<Path>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [payoutMode, setPayoutMode] = useState<'same' | 'different'>('same')
  const [form, setForm] = useState({
    name: '',
    phone: '',
    payoutPhone: '',
    password: '',
  })

  const isPromoter = user?.roles?.includes('promoter') ?? user?.role === 'promoter'
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const submitNewAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.phone || !form.password) {
      setError(t('auth.allFieldsRequired'))
      return
    }
    if (payoutMode === 'different' && !form.payoutPhone) {
      setError(t('auth.allFieldsRequired'))
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/promoter/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          password: form.password,
          payoutPhone: payoutMode === 'different' ? form.payoutPhone : undefined,
          acceptTerms,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error?.message || t('promoter.setupFailed'))
        return
      }
      toast.success(t('promoter.applyToBecome'), t('promoter.promoterDashboard'))
      navigate('/dashboard/promoter', { replace: true })
    } catch {
      setError(t('common.networkError'))
    } finally {
      setLoading(false)
    }
  }

  const submitExistingAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (payoutMode === 'different' && !form.payoutPhone) {
      setError(t('auth.allFieldsRequired'))
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/promoter/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          payoutPhone: payoutMode === 'different' ? form.payoutPhone : undefined,
          acceptTerms,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error?.message || t('promoter.setupFailed'))
        return
      }
      toast.success(t('promoter.applyToBecome'), t('promoter.promoterDashboard'))
      navigate('/dashboard/promoter', { replace: true })
    } catch {
      setError(t('common.networkError'))
    } finally {
      setLoading(false)
    }
  }

  const payoutField = (
    <div className="space-y-2">
      <span className="auth-label">{t('promoter.payoutNumber')}</span>
      <div className="flex flex-col gap-2">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="radio"
            name="payout-mode"
            checked={payoutMode === 'same'}
            onChange={() => setPayoutMode('same')}
            className="mt-1"
          />
          <span className="text-sm text-[var(--text)]">{t('promoter.payoutSameAsAccount')}</span>
        </label>
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="radio"
            name="payout-mode"
            checked={payoutMode === 'different'}
            onChange={() => setPayoutMode('different')}
            className="mt-1"
          />
          <span className="text-sm text-[var(--text)]">{t('promoter.payoutDifferent')}</span>
        </label>
      </div>
      <p className="text-xs text-[var(--text-muted)]">{t('promoter.payoutHint')}</p>
      {payoutMode === 'different' && (
        <PhoneInput
          value={form.payoutPhone}
          onChange={(v) => setForm((f) => ({ ...f, payoutPhone: v }))}
          placeholder="7XX XXX XXX"
          size="lg"
          noResultsLabel={t('auth.noCountriesFound')}
        />
      )}
    </div>
  )

  const terms = (
    <label className="flex items-start gap-2.5 cursor-pointer">
      <input
        type="checkbox"
        checked={acceptTerms}
        onChange={(e) => setAcceptTerms(e.target.checked)}
        className="mt-0.5"
      />
      <span className="text-xs text-[var(--text-sub)] leading-relaxed">
        {t('promoter.termsSelfReferral')}
      </span>
    </label>
  )

  const errorBox = error && (
    <div className="auth-alert">
      <AlertCircle size={15} />
      <p>{error}</p>
    </div>
  )

  /* Already a promoter: nothing to do, send them to the dashboard. */
  if (isAuthenticated && isPromoter) {
    return (
      <AuthLayout headline={t('promoter.alreadyPromoter')}>
        <SEO title={t('promoter.setup')} noindex />
        <div className="text-center animate-in space-y-5">
          <div className="w-14 h-14 rounded-full bg-[var(--blue-bg)] flex items-center justify-center mx-auto">
            <BadgeCheck size={28} color="var(--blue)" />
          </div>
          <Link to="/dashboard/promoter" className="auth-primary !no-underline">
            {t('promoter.goToDashboard')}
          </Link>
        </div>
      </AuthLayout>
    )
  }

  /* Signed in without the role: apply to the existing account. */
  if (isAuthenticated && path === null) {
    return (
      <AuthLayout
        headline={t('promoter.applyToBecome')}
        subline={t('promoter.applyDescription')}
      >
        <SEO title={t('promoter.applyToBecome')} noindex />
        <form onSubmit={submitExistingAccount} className="space-y-4 animate-in">
          {payoutField}
          {terms}
          {errorBox}
          <button type="submit" className="auth-primary" disabled={loading || !acceptTerms}>
            {loading ? <Spinner size={16} /> : <ArrowRight size={16} />}
            {t('promoter.continueWithAccount')}
          </button>
        </form>
      </AuthLayout>
    )
  }

  /* Signed in and the user explicitly chose the new-account path. */
  if (isAuthenticated && path === 'new') {
    return (
      <AuthLayout headline={t('promoter.applyToBecome')} subline={t('promoter.newAccountDesc')}>
        <SEO title={t('promoter.newAccount')} noindex />
        <form onSubmit={submitExistingAccount} className="space-y-4 animate-in">
          {payoutField}
          {terms}
          {errorBox}
          <button type="submit" className="auth-primary" disabled={loading || !acceptTerms}>
            {loading ? <Spinner size={16} /> : <ArrowRight size={16} />}
            {t('promoter.continueWithAccount')}
          </button>
          <p className="auth-hint">
            <button type="button" className="auth-link bg-transparent border-none p-0 cursor-pointer" onClick={() => setPath(null)}>
              {t('common.back')}
            </button>
          </p>
        </form>
      </AuthLayout>
    )
  }

  /* Anonymous visitor: choose a starting path. */
  if (path === null) {
    return (
      <AuthLayout
        headline={t('promoter.earnFromKatisha')}
        subline={t('promoter.choosePath')}
      >
        <SEO title={t('promoter.setup')} noindex />
        <div className="space-y-3 animate-in">
          <button
            type="button"
            onClick={() => setPath('existing')}
            className="w-full text-left p-4 rounded-[12px] border border-[var(--auth-border)] bg-[var(--auth-field)] hover:bg-[#FBFAF8] transition-colors cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <LogIn size={18} className="text-[var(--text-sub)] mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--text)]">{t('promoter.existingAccount')}</p>
                <p className="text-xs text-[var(--text-sub)] mt-1 leading-relaxed">
                  {t('promoter.existingAccountDesc')}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-2">{t('promoter.promoterCodeHint')}</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPath('new')}
            className="w-full text-left p-4 rounded-[12px] border border-[var(--auth-border)] bg-[var(--auth-field)] hover:bg-[#FBFAF8] transition-colors cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <UserPlus size={18} className="text-[var(--text-sub)] mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--text)]">{t('promoter.newAccount')}</p>
                <p className="text-xs text-[var(--text-sub)] mt-1 leading-relaxed">
                  {t('promoter.newAccountDesc')}
                </p>
              </div>
            </div>
          </button>
        </div>
      </AuthLayout>
    )
  }

  if (path === 'existing') {
    return (
      <AuthLayout
        headline={t('promoter.signInToContinue')}
        subline={t('promoter.existingAccountDesc')}
      >
        <SEO title={t('promoter.signInToContinue')} noindex />
        <div className="space-y-4 animate-in">
          <div className="p-4 rounded-[12px] border border-[var(--auth-border)] bg-[var(--auth-field)]">
            <p className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
              <LogIn size={16} /> {t('auth.signIn')}
            </p>
            <p className="text-xs text-[var(--text-sub)] mt-1">{t('promoter.promoterCodeHint')}</p>
            <Link to="/login" state={{ from: '/dashboard/promoter/setup' }} className="auth-primary !no-underline mt-4">
              {t('auth.signIn')}
            </Link>
          </div>
          <p className="auth-hint">
            <button type="button" className="auth-link bg-transparent border-none p-0 cursor-pointer" onClick={() => setPath(null)}>
              {t('common.back')}
            </button>
          </p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      headline={t('promoter.newAccount')}
      subline={t('promoter.newAccountDesc')}
    >
      <SEO title={t('promoter.newAccount')} noindex />
      <form onSubmit={submitNewAccount} className="space-y-4 animate-in">
        <div>
          <label className="auth-label" htmlFor="promoter-name">{t('auth.name')}</label>
          <input
            id="promoter-name"
            type="text"
            value={form.name}
            onChange={set('name')}
            autoComplete="name"
            className="auth-input"
          />
        </div>
        <div>
          <label className="auth-label" htmlFor="promoter-phone">{t('auth.phone')}</label>
          <PhoneInput
            id="promoter-phone"
            value={form.phone}
            onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
            required
            size="lg"
            noResultsLabel={t('auth.noCountriesFound')}
          />
        </div>
        <PasswordField
          id="promoter-password"
          label={t('auth.password')}
          placeholder={t('auth.passwordMin')}
          value={form.password}
          onChange={(v) => setForm((f) => ({ ...f, password: v }))}
          showPassword={showPassword}
          onToggle={() => setShowPassword((v) => !v)}
          autoComplete="new-password"
        />
        {payoutField}
        {terms}
        {errorBox}
        <button type="submit" className="auth-primary" disabled={loading || !acceptTerms}>
          {loading ? <Spinner size={16} /> : <Banknote size={16} />}
          {t('common.submit')}
        </button>
        <p className="auth-hint">
          <button type="button" className="auth-link bg-transparent border-none p-0 cursor-pointer" onClick={() => setPath(null)}>
            {t('common.back')}
          </button>
        </p>
      </form>
    </AuthLayout>
  )
}
