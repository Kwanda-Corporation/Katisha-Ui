import { API_BASE } from '../../config/apiBase';
import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router'
import { ShieldCheck, ArrowLeft, AlertCircle } from 'lucide-react'
import { Spinner } from '../../components/ui'
import { useTranslation } from 'react-i18next'
import AuthLayout from '../../components/AuthLayout'
import SEO from '../../components/seo/SEO'


export default function VerifyCode() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { email } = (location.state as { email?: string }) || {}
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(60)

  useEffect(() => {
    if (!email) navigate('/forgot-password', { replace: true })
  }, [email, navigate])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus()
  }

  const handleVerify = async () => {
    const code = otp.join('')
    if (code.length !== 6) {
      setError(t('auth.otpIncomplete'))
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })
      const data = await res.json()
      if (res.ok) {
        const resetToken = data.data?.resetToken
        navigate(`/reset-password?token=${resetToken}&email=${encodeURIComponent(email ?? '')}`)
      } else {
        setError(data.error?.message || data.message || t('auth.invalidCode'))
      }
    } catch {
      setError(t('common.networkError'))
    }
    setLoading(false)
  }

  const handleResend = async () => {
    setError('')
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error?.message || data.message || t('auth.resendFailed'))
      }
    } catch {
      setError(t('common.networkError'))
    }
    setCooldown(60)
  }

  if (!email) return null

  return (
    <AuthLayout
      headline={t('auth.verificationCode')}
      subline={t('auth.enterCodeSentTo', { email: email ?? '' })}
    >
      <SEO title={t('auth.verifyCode')} noindex />
      <div className="animate-in">
        <div className="w-14 h-14 rounded-full bg-[var(--blue-bg)] flex items-center justify-center mx-auto mb-6">
          <ShieldCheck size={28} color="var(--blue)" />
        </div>

        <div className="flex justify-center gap-2">
          {otp.map((digit, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Backspace' && !digit && i > 0) {
                  document.getElementById(`otp-${i - 1}`)?.focus()
                }
              }}
              onPaste={(e) => {
                const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
                if (paste.length === 6) {
                  setOtp(paste.split(''))
                }
              }}
              className="w-12 h-14 text-center text-lg font-semibold font-[var(--font-body)] rounded-xl border border-[var(--auth-border)] bg-[var(--auth-field)] focus:border-[var(--blue)] focus:outline-none transition-all"
            />
          ))}
        </div>

        {error && (
          <div className="auth-alert mt-4">
            <AlertCircle size={15} />
            <p>{error}</p>
          </div>
        )}

        <button type="button" className="auth-primary mt-5" onClick={handleVerify} disabled={loading}>
          {loading ? <Spinner size={16} /> : <ShieldCheck size={16} />}
          {t('auth.verifyCode')}
        </button>

        <p className="text-center mt-4 font-[var(--font-body)] text-xs text-[var(--text-sub)]">
          {cooldown > 0 ? (
            t('auth.resendCodeIn', { seconds: cooldown })
          ) : (
            <button onClick={handleResend} className="auth-link bg-transparent border-none cursor-pointer p-0 text-xs">
              {t('auth.resendCode')}
            </button>
          )}
        </p>

        <div className="mt-6 text-center">
          <Link to="/forgot-password" className="auth-hint inline-flex items-center gap-1">
            <ArrowLeft size={14} /> {t('common.back')}
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}
