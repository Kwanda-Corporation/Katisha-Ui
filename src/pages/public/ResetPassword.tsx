import { API_BASE } from '../../config/apiBase';
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Lock, CheckCircle, AlertCircle } from 'lucide-react'
import { Spinner } from '../../components/ui'
import { useTranslation } from '../../../node_modules/react-i18next'
import AuthLayout from '../../components/AuthLayout'
import SEO from '../../components/seo/SEO'
import PasswordStrength, { PasswordField, scorePassword } from '../../components/auth/PasswordStrength'


export default function ResetPassword() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const email = searchParams.get('email') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const strength = scorePassword(password)
  const match = confirm ? password === confirm : null

  useEffect(() => {
    if (!token) navigate('/forgot-password', { replace: true })
  }, [token, navigate])

  const handleReset = async () => {
    if (password !== confirm) {
      setError(t('auth.passwordsDoNotMatch'))
      return
    }
    if (strength.score < 2) {
      setError(t('auth.passwordTooWeak'))
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: token, password }),
      })
      if (res.ok) {
        setDone(true)
        setTimeout(() => navigate('/login'), 3000)
      } else {
        const data = await res.json()
        setError(data.error?.message || t('auth.resetFailed'))
      }
    } catch {
      setError(t('common.networkError'))
    }
    setLoading(false)
  }

  if (done) {
    return (
      <AuthLayout headline={t('auth.passwordReset')} subline={t('auth.passwordResetSuccess')}>
        <SEO title={t('auth.passwordReset')} noindex />
        <div className="text-center animate-in">
          <div className="w-16 h-16 rounded-full bg-[var(--blue-bg)] flex items-center justify-center mx-auto">
            <CheckCircle size={32} color="var(--blue)" />
          </div>
        </div>
      </AuthLayout>
    )
  }

  if (!token) return null

  return (
    <AuthLayout
      headline={t('auth.setNewPassword')}
      subline={t('auth.newPassword')}
    >
      <SEO title={t('auth.resetPassword')} noindex />
      <div className="animate-in">
        <form onSubmit={(e) => { e.preventDefault(); handleReset() }} className="space-y-4">
          <PasswordField
            id="reset-password"
            label={t('auth.newPassword')}
            placeholder={t('auth.enterNewPassword')}
            value={password}
            onChange={setPassword}
            showPassword={showPassword}
            onToggle={() => setShowPassword((v) => !v)}
            autoComplete="new-password"
          />
          <PasswordStrength value={password} />

          <div>
            <label className="auth-label" htmlFor="reset-confirm">{t('auth.confirmPassword')}</label>
            <input
              id="reset-confirm"
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

          {error && (
            <div className="auth-alert">
              <AlertCircle size={15} />
              <p>{error}</p>
            </div>
          )}

          <button type="submit" className="auth-primary" disabled={loading}>
            {loading ? <Spinner size={16} /> : <Lock size={16} />}
            {t('auth.resetPassword')}
          </button>
        </form>
      </div>
    </AuthLayout>
  )
}
