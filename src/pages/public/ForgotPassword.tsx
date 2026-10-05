import { API_BASE } from '../../config/apiBase';
import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { Spinner } from '../../components/ui'
import { useTranslation } from 'react-i18next'
import { useToast } from '../../components/ui/Toast'
import AuthLayout from '../../components/AuthLayout'
import SEO from '../../components/seo/SEO'


export default function ForgotPassword() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!email) {
      setError(t('common.required'))
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setSent(true)
        toast.success(t('auth.resetPassword'), t('auth.otpSent'))
      } else {
        const data = await res.json()
        const msg = data.error?.message || t('common.error')
        setError(msg)
        toast.error(t('auth.resetPassword'), msg)
      }
    } catch {
      const msg = t('common.networkError')
      setError(msg)
      toast.error(t('auth.resetPassword'), msg)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <AuthLayout headline={t('auth.forgotPassword')} subline={`${t('auth.otpSent')}: ${email}.`}>
        <SEO title={t('auth.forgotPassword')} noindex />
        <div className="text-center animate-in">
          <div className="w-16 h-16 rounded-full bg-[var(--blue-bg)] flex items-center justify-center mx-auto">
            <CheckCircle size={32} color="var(--blue)" />
          </div>
          <div className="mt-7 flex flex-col gap-3">
            <button type="button" className="auth-primary" onClick={() => navigate('/verify-code', { state: { email, mode: 'reset' } })}>
              {t('auth.otpCode')}
            </button>
            <button type="button" className="auth-secondary" onClick={() => navigate('/login')}>
              {t('common.back')}
            </button>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      headline={t('auth.forgotPassword')}
      subline={t('auth.email')}
    >
      <SEO title={t('auth.forgotPassword')} noindex />
      <div className="animate-in">
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="space-y-4">
          <div>
            <label className="auth-label" htmlFor="forgot-email">{t('auth.email')}</label>
            <input
              id="forgot-email"
              type="email"
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="auth-input"
            />
          </div>
          {error && (
            <div className="auth-alert">
              <AlertCircle size={15} />
              <p>{error}</p>
            </div>
          )}
          <button type="submit" className="auth-primary" disabled={loading}>
            {loading ? <Spinner size={16} /> : <Mail size={16} />}
            {t('auth.resetPassword')}
          </button>
        </form>
        <div className="mt-6 text-center">
          <Link to="/login" className="auth-hint inline-flex items-center gap-1">
            <ArrowLeft size={14} /> {t('common.back')}
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}
