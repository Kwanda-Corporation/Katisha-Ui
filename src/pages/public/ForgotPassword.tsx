import { API_BASE } from '../../config/apiBase';
import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { Button, Card, Input } from '../../components/ui'
import { useTranslation } from '../../../node_modules/react-i18next'
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
      const msg = 'Network error. Please try again.'
      setError(msg)
      toast.error(t('auth.resetPassword'), msg)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
        <div className="max-w-[440px] w-full text-center animate-in">
          <div className="w-16 h-16 rounded-full bg-[var(--blue-bg)] flex items-center justify-center mx-auto">
            <CheckCircle size={32} color="var(--blue)" />
          </div>
          <h1 className="font-[var(--font-body)] text-[1.75rem] font-semibold text-[var(--text)] mt-6">{t('auth.forgotPassword')}</h1>
          <p className="font-[var(--font-body)] text-sm text-[var(--text-sub)] mt-3">
            {t('auth.otpSent')}: <strong>{email}</strong>.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Button fullWidth onClick={() => navigate('/verify-code', { state: { email, mode: 'reset' } })}>
              {t('auth.otpCode')}
            </Button>
            <Button variant="ghost" fullWidth onClick={() => navigate('/login')}>
              {t('common.back')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AuthLayout
      title={t('auth.resetPassword')}
      subtitle={t('auth.otpSent')}
    >
      <SEO title="Forgot Password" noindex />
      <div className="w-full max-w-[440px]">
        <div className="text-center mb-8">
          <h1 className="font-[var(--font-body)] text-[1.75rem] font-semibold text-[var(--text)]">{t('auth.forgotPassword')}</h1>
          <p className="font-[var(--font-body)] text-sm text-[var(--text-sub)] mt-2">{t('auth.email')}</p>
        </div>
        <Card padding="lg">
          <div className="space-y-5">
            <Input label={t('auth.email')} type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-md" style={{ background: '#FEE2E2', border: '1px solid #FCA5A5' }}>
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
                <p className="font-[var(--font-body)] text-xs font-medium" style={{ color: '#DC2626' }}>{error}</p>
              </div>
            )}
            <Button fullWidth onClick={handleSubmit} loading={loading}>
              <Mail size={16} />
              {t('auth.resetPassword')}
            </Button>
          </div>
        </Card>
        <div className="mt-6 text-center">
          <Link to="/login" className="font-[var(--font-body)] text-sm text-[var(--blue)] no-underline hover:underline inline-flex items-center gap-1">
            <ArrowLeft size={14} /> {t('common.back')}
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}
