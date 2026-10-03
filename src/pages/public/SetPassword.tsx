import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { CheckCircle, XCircle, User, AlertCircle } from 'lucide-react'
import { PhoneInput, Spinner } from '../../components/ui'
import { useTranslation } from 'react-i18next'
import AuthLayout from '../../components/AuthLayout'
import { api } from '../../api'
import SEO from '../../components/seo/SEO'
import PasswordStrength, { PasswordField } from '../../components/auth/PasswordStrength'

const REQUIREMENTS = [
  { key: 'reqLength', test: (v: string) => v.length >= 8 },
  { key: 'reqUppercase', test: (v: string) => /[A-Z]/.test(v) },
  { key: 'reqLowercase', test: (v: string) => /[a-z]/.test(v) },
  { key: 'reqNumber', test: (v: string) => /[0-9]/.test(v) },
  { key: 'reqSpecial', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
] as const

export default function SetPassword() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const [error, setError] = useState('')
  const [verifying, setVerifying] = useState(true)
  const [userInfo, setUserInfo] = useState<{ name: string; email: string } | null>(null)

  useEffect(() => {
    if (!token) { setInvalid(true); setVerifying(false); return }
    api.verifySetupToken(token).then(res => {
      setUserInfo(res.data)
      setVerifying(false)
    }).catch(() => {
      setInvalid(true)
      setVerifying(false)
    })
  }, [token])

  const allMet = REQUIREMENTS.every((r) => r.test(password))
  const match = confirm ? password === confirm : null

  const handleSetPassword = async () => {
    if (!username.trim()) { setError(t('auth.usernameRequiredErr')); return }
    if (password !== confirm) { setError(t('auth.passwordsDoNotMatch')); return }
    if (!allMet) { setError(t('auth.meetRequirements')); return }
    setLoading(true)
    setError('')
    try {
      const res = await api.setupAccount({ token, username: username.trim(), phone: phone.trim(), password })
      if (res) {
        setDone(true)
      } else {
        setError(t('auth.setupFailed'))
      }
    } catch (err: any) {
      setError(err.message || t('common.networkError'))
    }
    setLoading(false)
  }

  if (verifying) {
    return (
      <AuthLayout>
        <SEO title={t('auth.setUpAccount')} noindex />
        <div className="text-center animate-in">
          <div className="w-10 h-10 border-2 border-[var(--blue)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[var(--text-sub)] mt-4">{t('auth.verifyingLink')}</p>
        </div>
      </AuthLayout>
    )
  }

  if (invalid) {
    return (
      <AuthLayout headline={t('auth.invalidOrExpiredLink')} subline={t('auth.linkNoLongerValid')}>
        <SEO title={t('auth.invalidOrExpiredLink')} noindex />
        <div className="text-center animate-in">
          <XCircle size={44} color="var(--error)" className="mx-auto" />
          <button type="button" className="auth-primary mt-6" onClick={() => navigate('/login')}>
            {t('auth.backToLogin')}
          </button>
        </div>
      </AuthLayout>
    )
  }

  if (done) {
    return (
      <AuthLayout headline={t('auth.accountReady')} subline={t('auth.accountSetupSuccess')}>
        <SEO title={t('auth.accountReady')} noindex />
        <div className="text-center animate-in">
          <div className="w-16 h-16 rounded-full bg-[var(--blue-bg)] flex items-center justify-center mx-auto">
            <CheckCircle size={32} color="var(--blue)" />
          </div>
          <button type="button" className="auth-primary mt-6" onClick={() => navigate('/login')}>
            {t('auth.signIn')}
          </button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      headline={t('auth.setUpYourAccount')}
      subline={t('auth.setUpSubline')}
    >
      <SEO title={t('auth.setUpAccount')} noindex />
      <div className="animate-in">
        <form onSubmit={(e) => { e.preventDefault(); handleSetPassword() }} className="space-y-4">
          {userInfo?.name && (
            <p className="auth-hint !text-left">{t('auth.welcomeName', { name: `, ${userInfo.name}` })}</p>
          )}

          <div>
            <label className="auth-label" htmlFor="setup-username">
              {t('auth.username')} <span className="text-[var(--text-muted)]">*</span>
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                id="setup-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('auth.chooseUsername')}
                autoComplete="username"
                className="auth-input !pl-10"
              />
            </div>
          </div>

          <div>
            <label className="auth-label">{t('auth.phoneOptional')}</label>
            <PhoneInput
              value={phone}
              onChange={setPhone}
              placeholder="7XX XXX XXX"
              size="lg"
              noResultsLabel={t('auth.noCountriesFound')}
            />
          </div>

          <PasswordField
            id="setup-password"
            label={t('auth.password')}
            placeholder={t('auth.createStrongPassword')}
            value={password}
            onChange={setPassword}
            showPassword={showPassword}
            onToggle={() => setShowPassword((v) => !v)}
            autoComplete="new-password"
          />
          <PasswordStrength value={password} />

          <div>
            <label className="auth-label" htmlFor="setup-confirm">{t('auth.confirmPassword')}</label>
            <input
              id="setup-confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={t('auth.confirmNewPassword')}
              autoComplete="new-password"
              className="auth-input"
            />
            {match !== null && (
              <p className={`mt-1.5 font-[var(--font-body)] text-xs ${match ? 'text-[var(--blue)]' : 'text-[var(--error)]'}`}>
                {match ? t('auth.passwordsMatch') : t('auth.passwordsDoNotMatch')}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            {REQUIREMENTS.map((req) => {
              const met = req.test(password)
              return (
                <div key={req.key} className="flex items-center gap-2">
                  {met ? <CheckCircle size={14} color="var(--blue)" /> : <XCircle size={14} color="var(--text-muted)" />}
                  <span className={`font-[var(--font-body)] text-xs ${met ? 'text-[var(--blue)]' : 'text-[var(--text-muted)]'}`}>
                    {t(`auth.${req.key}`)}
                  </span>
                </div>
              )
            })}
          </div>

          {error && (
            <div className="auth-alert">
              <AlertCircle size={15} />
              <p>{error}</p>
            </div>
          )}

          <button type="submit" className="auth-primary" disabled={loading}>
            {loading ? <Spinner size={16} /> : <CheckCircle size={16} />}
            {t('auth.setUpAccount')}
          </button>
        </form>
      </div>
    </AuthLayout>
  )
}
