import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Lock, CheckCircle, AlertCircle } from 'lucide-react'
import { Button, Card } from '../../components/ui'
import AuthLayout from '../../components/AuthLayout'
import SEO from '../../components/seo/SEO'

const API_BASE = import.meta.env?.VITE_API_URL ?? 'http://localhost:5001/api'

function getStrength(value: string): { label: string; score: number; color: string } {
  let score = 0
  if (value.length >= 8) score++
  if (/[A-Z]/.test(value)) score++
  if (/[0-9]/.test(value)) score++
  if (/[^A-Za-z0-9]/.test(value)) score++
  if (value.length >= 12) score++
  const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['var(--error)', 'var(--error)', 'var(--warning)', 'var(--blue)', 'var(--blue)']
  return { label: labels[score] || 'Too short', score, color: colors[score] || 'var(--error)' }
}

export default function ResetPassword() {
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

  const strength = getStrength(password)
  const match = confirm ? password === confirm : null

  useEffect(() => {
    if (!token) navigate('/forgot-password', { replace: true })
  }, [token, navigate])

  const handleReset = async () => {
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (strength.score < 2) {
      setError('Password is too weak')
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
        setError(data.error?.message || 'Reset failed')
      }
    } catch {
      setError('Network error')
    }
    setLoading(false)
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
        <div className="max-w-[440px] w-full text-center animate-in">
          <div className="w-16 h-16 rounded-full bg-[var(--blue-bg)] flex items-center justify-center mx-auto">
            <CheckCircle size={32} color="var(--blue)" />
          </div>
          <h1 className="font-[var(--font-body)] text-[1.75rem] font-semibold text-[var(--text)] mt-6">Password Reset</h1>
          <p className="font-[var(--font-body)] text-sm text-[var(--text-sub)] mt-3">
            Your password has been successfully reset. Redirecting to login...
          </p>
        </div>
      </div>
    )
  }

  if (!token) return null

  return (
    <AuthLayout
      title="Set New Password"
      subtitle="Choose a strong password for your account."
    >
      <SEO title="Reset Password" noindex />
      <div className="w-full max-w-[440px]">
        <div className="text-center mb-8">
          <h1 className="font-[var(--font-body)] text-[1.75rem] font-semibold text-[var(--text)]">Reset Password</h1>
          <p className="font-[var(--font-body)] text-sm text-[var(--text-sub)] mt-2">Enter your new password</p>
        </div>
        <Card padding="lg">
          <div className="space-y-5">
            <div>
              <label className="font-[var(--font-body)] text-sm font-medium text-[var(--text)] mb-1.5 block">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full h-12 px-4 pr-10 rounded-md border border-[var(--border)] bg-white font-[var(--font-body)] text-base text-[var(--text)] placeholder:text-[var(--text-muted)] placeholder:font-light focus:outline-none focus:border-[var(--blue)] focus:shadow-none transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-1.5 flex-1 rounded-full" style={{ background: i < strength.score * 20 / 100 * 5 ? strength.color : 'var(--border)' }} />
                    ))}
                  </div>
                  <p className="font-[var(--font-body)] text-xs" style={{ color: strength.color }}>{strength.label}</p>
                </div>
              )}
            </div>
            <div>
              <label className="font-[var(--font-body)] text-sm font-medium text-[var(--text)] mb-1.5 block">Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm new password"
                className="w-full h-12 px-4 rounded-md border border-[var(--border)] bg-white font-[var(--font-body)] text-base text-[var(--text)] placeholder:text-[var(--text-muted)] placeholder:font-light focus:outline-none focus:border-[var(--blue)] focus:shadow-none transition-all"
              />
              {match !== null && (
                <p className={`mt-1 font-[var(--font-body)] text-xs ${match ? 'text-[var(--blue)]' : 'text-[var(--error)]'}`}>
                  {match ? 'Passwords match' : 'Passwords do not match'}
                </p>
              )}
            </div>
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-md" style={{ background: '#FEE2E2', border: '1px solid #FCA5A5' }}>
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
                <p className="font-[var(--font-body)] text-xs font-medium" style={{ color: '#DC2626' }}>{error}</p>
              </div>
            )}
            <Button fullWidth onClick={handleReset} loading={loading}>
              <Lock size={16} />
              Reset Password
            </Button>
          </div>
        </Card>
      </div>
    </AuthLayout>
  )
}
