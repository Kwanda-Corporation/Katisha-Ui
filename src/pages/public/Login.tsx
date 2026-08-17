import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'
import { Button, Card, PhoneInput } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { useTranslation } from '../../../node_modules/react-i18next'
import { useToast } from '../../components/ui/Toast'
import AuthLayout from '../../components/AuthLayout'
import SEO from '../../components/seo/SEO'
import GoogleProfileCompletion from '../../components/GoogleProfileCompletion'

export default function Login() {
  const { t } = useTranslation()
  const { login, googleLogin } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showProfileComplete, setShowProfileComplete] = useState(false)

  const handleLogin = async () => {
    if (!identifier || !password) {
      setError(t('auth.allFieldsRequired'))
      return
    }
    setLoading(true)
    setError('')
    const result = await login(identifier, password)
    setLoading(false)
    if (!result.ok) {
      const msg = result.error || t('auth.loginFailed')
      setError(msg)
      toast.error(t('auth.signIn'), msg)
      return
    }
    toast.success(t('auth.signIn'), t('auth.signInDesc'))
    navigate('/')
  }

  const handleGoogleSuccess = async (response: any) => {
    if (!response.credential) return
    setError('')
    setLoading(true)
    const result = await googleLogin(response.credential)
    setLoading(false)
    if (!result.ok) {
      const msg = result.error || 'Google sign-in failed'
      setError(msg)
      toast.error(t('auth.signIn'), msg)
      return
    }
    if (result.needsProfile) {
      setShowProfileComplete(true)
      return
    }
    toast.success(t('auth.signIn'), t('auth.signInDesc'))
    navigate('/')
  }

  const handleProfileComplete = () => {
    setShowProfileComplete(false)
    toast.success(t('auth.signIn'), t('auth.signInDesc'))
  }

  return (
    <>
    <AuthLayout title={t('auth.signIn')} subtitle={t('auth.signInDesc')}
    >
      <SEO title="Sign In" noindex />
      <div className="w-full max-w-[440px]">
        <div className="animate-in">
          <div className="text-center mb-8">
            <h1 className="font-[var(--font-body)] text-[1.75rem] font-semibold text-[var(--text)]">{t('auth.signIn')}</h1>
            <p className="font-[var(--font-body)] text-sm text-[var(--text-sub)] mt-2">{t('auth.signInDesc')}</p>
          </div>

          <Card padding="lg">
            <div className="space-y-5">
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google sign-in failed')}
                  text="continue_with"
                  shape="rectangular"
                  width={380}
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[var(--border)]" />
                <span className="text-xs text-[var(--text-muted)] font-[var(--font-body)]">{t('auth.or') || 'or'}</span>
                <div className="flex-1 h-px bg-[var(--border)]" />
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleLogin() }} className="space-y-5">
                <PhoneInput
                  label={t('auth.phoneNumber')}
                  value={identifier}
                  onChange={setIdentifier}
                  required
                />
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-[var(--font-body)] text-sm font-medium text-[var(--text)]">{t('auth.password')}</label>
                    <Link to="/forgot-password" className="font-[var(--font-body)] text-xs text-[var(--blue)] no-underline hover:underline">
                      {t('auth.forgotPassword')}
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('auth.enterPassword')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full h-12 px-4 pr-10 rounded-md border border-[var(--border)] bg-white font-[var(--font-body)] text-base text-[var(--text)] placeholder:text-[var(--text-muted)] placeholder:font-light focus:outline-none focus:border-[var(--blue)] focus:shadow-none transition-all"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer bg-none border-none">
                      {showPassword ? <EyeOff size={18} color="var(--text-muted)" /> : <Eye size={18} color="var(--text-muted)" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-md" style={{ background: '#FEE2E2', border: '1px solid #FCA5A5' }}>
                    <AlertCircle size={15} className="flex-shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
                    <p className="font-[var(--font-body)] text-xs font-medium" style={{ color: '#DC2626' }}>{error}</p>
                  </div>
                )}

                <Button fullWidth type="submit" loading={loading}>
                  <Lock size={16} />
                  {t('auth.signIn')}
                </Button>
              </form>
            </div>
          </Card>

          <div className="mt-6 text-center">
            <p className="font-[var(--font-body)] text-sm text-[var(--text-sub)]">
              {t('auth.dontHaveAccount')}{' '}
              <Link to="/register" className="text-[var(--blue)] font-medium no-underline hover:underline">
                {t('auth.register')}
              </Link>
            </p>
          </div>

        </div>
      </div>
    </AuthLayout>
    {showProfileComplete && <GoogleProfileCompletion onComplete={handleProfileComplete} />}
    </>
  )
}
