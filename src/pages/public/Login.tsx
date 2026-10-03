import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'
import { PhoneInput, Spinner } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { useToast } from '../../components/ui/Toast'
import AuthLayout from '../../components/AuthLayout'
import SEO from '../../components/seo/SEO'
import GoogleProfileCompletion from '../../components/GoogleProfileCompletion'

export default function Login() {
  const { t } = useTranslation()
  const { login, googleLogin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  // Where to return after signing in. Set by flows that need auth first
  // (e.g. "Earn from Katisha" → promoter setup).
  const redirectTo = (location.state as { from?: string } | null)?.from
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
    navigate(redirectTo || '/')
  }

  const handleGoogleSuccess = async (response: any) => {
    if (!response.credential) return
    setError('')
    setLoading(true)
    const result = await googleLogin(response.credential)
    setLoading(false)
    if (!result.ok) {
      const msg = result.error || t('auth.googleSignInFailed')
      setError(msg)
      toast.error(t('auth.signIn'), msg)
      return
    }
    if (result.needsProfile) {
      setShowProfileComplete(true)
      return
    }
    toast.success(t('auth.signIn'), t('auth.signInDesc'))
    navigate(redirectTo || '/')
  }

  const handleProfileComplete = () => {
    setShowProfileComplete(false)
    toast.success(t('auth.signIn'), t('auth.signInDesc'))
    if (redirectTo) navigate(redirectTo)
  }

  return (
    <>
    <AuthLayout
      headline={t('auth.signIn')}
      subline={t('auth.signInDesc')}
    >
      <SEO title={t('auth.signIn')} noindex />
      <div className="animate-in">
        <div className="space-y-4">
          {/* Fluid width: the previous fixed width={380} overflowed the
              card on narrow phones and forced horizontal scrolling. Google
              renders the button in a cross-origin iframe, so its own corners
              cannot be styled — clipping the wrapper is what applies
              rounded-md to the button as a whole. */}
          <div className="w-full min-w-0 rounded-md overflow-hidden border border-[var(--auth-border)]">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError(t('auth.googleSignInFailed'))}
              text="continue_with"
              shape="rectangular"
              width="100%"
            />
          </div>

          <div className="auth-divider">
            <span>{t('auth.or') || 'or'}</span>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleLogin() }} className="space-y-4">
            <div>
              <label className="auth-label" htmlFor="login-identifier">{t('auth.phoneNumber')}</label>
              <PhoneInput
                id="login-identifier"
                value={identifier}
                onChange={setIdentifier}
                required
                size="lg"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="auth-label !mb-0" htmlFor="login-password">{t('auth.password')}</label>
                <Link to="/forgot-password" className="text-xs font-medium text-[var(--text-sub)] hover:text-[var(--text)]">
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <div className="auth-input-wrap">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.enterPassword')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="auth-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-reveal"
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="auth-alert">
                <AlertCircle size={15} />
                <p>{error}</p>
              </div>
            )}

            <button type="submit" className="auth-primary" disabled={loading}>
              {loading ? <Spinner size={16} /> : <Lock size={16} />}
              {t('auth.signIn')}
            </button>
          </form>
        </div>

        <p className="auth-hint mt-6">
          {t('auth.dontHaveAccount')}{' '}
          <Link to="/register" className="auth-link">
            {t('auth.register')}
          </Link>
        </p>
      </div>
    </AuthLayout>
    {showProfileComplete && <GoogleProfileCompletion onComplete={handleProfileComplete} />}
    </>
  )
}
