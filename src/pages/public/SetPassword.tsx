import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Lock, CheckCircle, XCircle, User, AlertCircle } from 'lucide-react'
import { Button, Card, PhoneInput } from '../../components/ui'
import AuthLayout from '../../components/AuthLayout'
import { api } from '../../api'
import SEO from '../../components/seo/SEO'

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

const requirements = [
  { label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
  { label: 'At least one uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'At least one lowercase letter', test: (v: string) => /[a-z]/.test(v) },
  { label: 'At least one number', test: (v: string) => /[0-9]/.test(v) },
  { label: 'At least one special character', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
]

export default function SetPassword() {
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

  const strength = getStrength(password)
  const allMet = requirements.every((r) => r.test(password))
  const match = confirm ? password === confirm : null

  const handleSetPassword = async () => {
    if (!username.trim()) { setError('Username is required'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (!allMet) { setError('Please meet all password requirements'); return }
    setLoading(true)
    setError('')
    try {
      const res = await api.setupAccount({ token, username: username.trim(), phone: phone.trim(), password })
      if (res) {
        setDone(true)
      } else {
        setError('Failed to set up account')
      }
    } catch (err: any) {
      setError(err.message || 'Network error')
    }
    setLoading(false)
  }

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
        <Card className="max-w-[440px] w-full text-center py-12">
          <div className="w-10 h-10 border-2 border-[var(--blue)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[var(--text-sub)] mt-4">Verifying your link...</p>
        </Card>
      </div>
    )
  }

  if (invalid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
        <Card className="max-w-[440px] w-full text-center">
          <XCircle size={48} color="var(--error)" className="mx-auto" />
          <h1 className="font-[var(--font-body)] text-[1.75rem] text-[var(--text)] mt-4">Invalid or Expired Link</h1>
          <p className="font-[var(--font-body)] text-sm text-[var(--text-sub)] mt-2">This setup link is no longer valid. Please contact your administrator.</p>
          <Button className="mt-6" onClick={() => navigate('/login')}>Back to Login</Button>
        </Card>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
        <div className="max-w-[440px] w-full text-center animate-in">
          <div className="w-16 h-16 rounded-full bg-[var(--blue-bg)] flex items-center justify-center mx-auto">
            <CheckCircle size={32} color="var(--blue)" />
          </div>
          <h1 className="font-[var(--font-body)] text-[1.75rem] font-semibold text-[var(--text)] mt-6">Account Ready!</h1>
          <p className="font-[var(--font-body)] text-sm text-[var(--text-sub)] mt-3">Your account has been set up successfully. You can now sign in.</p>
          <Button className="mt-8" onClick={() => navigate('/login')}>Sign In</Button>
        </div>
      </div>
    )
  }

  return (
    <AuthLayout
      title="Set Up Your Account"
      subtitle={`Welcome${userInfo?.name ? `, ${userInfo.name}` : ''}! Create your username and password to get started.`}
    >
      <SEO title="Set Up Account" noindex />
      <div className="w-full max-w-[440px]">
        <div className="text-center mb-8">
          <h1 className="font-[var(--font-body)] text-[1.75rem] font-semibold text-[var(--text)]">Set Up Your Account</h1>
          <p className="font-[var(--font-body)] text-sm text-[var(--text-sub)] mt-2">Choose a username and secure password</p>
        </div>
        <Card padding="lg">
          <div className="space-y-4">
            {/* Username */}
            <div>
              <label className="font-[var(--font-body)] text-sm font-medium text-[var(--text)] mb-1.5 block">Username *</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  className="w-full h-12 pl-10 pr-4 rounded-md border border-[var(--border)] bg-white font-[var(--font-body)] text-base text-[var(--text)] placeholder:text-[var(--text-muted)] placeholder:font-light focus:outline-none focus:border-[var(--blue)] transition-all"
                />
              </div>
            </div>

            {/* Phone */}
            <PhoneInput
              label="Phone (optional)"
              value={phone}
              onChange={setPhone}
              placeholder="7XX XXX XXX"
            />

            {/* Password */}
            <div>
              <label className="font-[var(--font-body)] text-sm font-medium text-[var(--text)] mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full h-12 px-4 pr-10 rounded-md border border-[var(--border)] bg-white font-[var(--font-body)] text-base text-[var(--text)] placeholder:text-[var(--text-muted)] placeholder:font-light focus:outline-none focus:border-[var(--blue)] transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] cursor-pointer bg-transparent border-none">
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

            {/* Confirm Password */}
            <div>
              <label className="font-[var(--font-body)] text-sm font-medium text-[var(--text)] mb-1.5 block">Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm password"
                className="w-full h-12 px-4 rounded-md border border-[var(--border)] bg-white font-[var(--font-body)] text-base text-[var(--text)] placeholder:text-[var(--text-muted)] placeholder:font-light focus:outline-none focus:border-[var(--blue)] transition-all"
              />
              {match !== null && (
                <p className={`mt-1 font-[var(--font-body)] text-xs ${match ? 'text-[var(--blue)]' : 'text-[var(--error)]'}`}>
                  {match ? 'Passwords match' : 'Passwords do not match'}
                </p>
              )}
            </div>

            {/* Requirements */}
            <div className="space-y-2">
              {requirements.map((req) => {
                const met = req.test(password)
                return (
                  <div key={req.label} className="flex items-center gap-2">
                    {met ? <CheckCircle size={14} color="var(--blue)" /> : <XCircle size={14} color="var(--text-muted)" />}
                    <span className={`font-[var(--font-body)] text-xs ${met ? 'text-[var(--blue)]' : 'text-[var(--text-muted)]'}`}>{req.label}</span>
                  </div>
                )
              })}
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-md" style={{ background: '#FEE2E2', border: '1px solid #FCA5A5' }}>
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
                <p className="font-[var(--font-body)] text-xs font-medium" style={{ color: '#DC2626' }}>{error}</p>
              </div>
            )}

            <Button fullWidth onClick={handleSetPassword} loading={loading}>
              <Lock size={16} />
              Set Up Account
            </Button>
          </div>
        </Card>
      </div>
    </AuthLayout>
  )
}
