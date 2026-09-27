import { API_BASE } from '../../config/apiBase';
import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router'
import { ShieldCheck, ArrowLeft, AlertCircle } from 'lucide-react'
import { Button, Card } from '../../components/ui'
import AuthLayout from '../../components/AuthLayout'
import SEO from '../../components/seo/SEO'


export default function VerifyCode() {
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
      setError('Please enter the complete 6-digit code')
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
        setError(data.error?.message || data.message || 'Invalid code')
      }
    } catch {
      setError('Network error')
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
        setError(data.error?.message || data.message || 'Failed to resend code')
      }
    } catch {
      setError('Network error')
    }
    setCooldown(60)
  }

  if (!email) return null

  return (
    <AuthLayout
      title="Verify Identity"
      subtitle="Enter the verification code sent to your email."
    >
      <SEO title="Verify Code" noindex />
      <div className="w-full max-w-[440px]">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-[var(--blue-bg)] flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={28} color="var(--blue)" />
          </div>
          <h1 className="font-[var(--font-body)] text-[1.75rem] font-semibold text-[var(--text)]">Verification Code</h1>
          <p className="font-[var(--font-body)] text-sm text-[var(--text-sub)] mt-2">
            Enter the 6-digit code sent to <strong>{email}</strong>
          </p>
        </div>
        <Card padding="lg">
          <div className="flex justify-center gap-2 mb-6">
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
                className="w-12 h-14 text-center text-lg font-semibold font-[var(--font-body)] rounded-md border border-[var(--border)] focus:border-[var(--blue)] focus:shadow-none outline-none transition-all"
              />
            ))}
          </div>
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-md mb-4" style={{ background: '#FEE2E2', border: '1px solid #FCA5A5' }}>
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
              <p className="font-[var(--font-body)] text-xs font-medium" style={{ color: '#DC2626' }}>{error}</p>
            </div>
          )}
          <Button fullWidth onClick={handleVerify} loading={loading}>Verify Code</Button>
          <p className="text-center mt-4 font-[var(--font-body)] text-xs text-[var(--text-sub)]">
            {cooldown > 0 ? (
              <>Resend code in {cooldown}s</>
            ) : (
              <button onClick={handleResend} className="text-[var(--blue)] font-medium bg-none border-none cursor-pointer hover:underline">
                Resend Code
              </button>
            )}
          </p>
        </Card>
        <div className="mt-6 text-center">
          <Link to="/forgot-password" className="font-[var(--font-body)] text-sm text-[var(--blue)] no-underline hover:underline inline-flex items-center gap-1">
            <ArrowLeft size={14} /> Back
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}
