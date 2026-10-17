import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useGoogleLogin } from '@react-oauth/google'
import { PhoneInput, Spinner } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { useToast } from '../../components/ui/Toast'
import AuthLayout from '../../components/AuthLayout'
import SEO from '../../components/seo/SEO'
import GoogleProfileCompletion from '../../components/GoogleProfileCompletion'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

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

  const handleGoogleToken = async (accessToken: string) => {
    if (!accessToken) return
    setError('')
    setLoading(true)
    const result = await googleLogin(accessToken)
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
          {/* Our own button (OAuth popup) instead of Google's cross-origin
              iframe button: full styling control, no GSI console warnings and no
              pre-selection of a saved Google account. */}
          {GOOGLE_CLIENT_ID && (
            <GoogleSignInButton
              label={t('auth.continueWithGoogle')}
              disabled={loading}
              onToken={handleGoogleToken}
              onError={() => setError(t('auth.googleSignInFailed'))}
            />
          )}

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

/** The four-colour Google "G" mark. */
function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

/**
 * Custom "Continue with Google" button backed by the OAuth popup flow. Using
 * `useGoogleLogin` keeps Google's cross-origin iframe button out of the page, so
 * there is no invalid-width render, no duplicate `initialize()` warning and no
 * saved-account pre-selection. It hands the returned access token up to the
 * caller, which exchanges it for a Katisha session.
 */
function GoogleSignInButton({
  label,
  disabled,
  onToken,
  onError,
}: {
  label: string
  disabled?: boolean
  onToken: (accessToken: string) => void
  onError: () => void
}) {
  const login = useGoogleLogin({
    scope: 'openid email profile',
    onSuccess: (tokenResponse) => {
      const token = tokenResponse?.access_token
      if (token) onToken(token)
      else onError()
    },
    onError,
    onNonOAuthError: onError,
  })

  return (
    <button type="button" className="auth-secondary" onClick={() => login()} disabled={disabled}>
      <GoogleGlyph />
      {label}
    </button>
  )
}
