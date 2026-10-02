import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { UserPlus, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'
import { PhoneInput, Spinner } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { useTranslation } from '../../../node_modules/react-i18next'
import { useToast } from '../../components/ui/Toast'
import AuthLayout from '../../components/AuthLayout'
import SEO from '../../components/seo/SEO'
import GoogleProfileCompletion from '../../components/GoogleProfileCompletion'

export default function Register() {
  const { t } = useTranslation()
  const { register, googleLogin } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showProfileComplete, setShowProfileComplete] = useState(false)

  const handleSubmit = async () => {
    if (!name || !phone || !password) {
      setError(t('auth.allFieldsRequired'))
      return
    }
    if (password.length < 6) {
      setError(t('auth.passwordMin'))
      return
    }
    setLoading(true)
    setError('')
    const result = await register(name, password, name, phone)
    setLoading(false)
    if (result.queuedOffline) {
      toast.info(t('auth.register'), t('auth.queuedOffline'))
      navigate('/')
      return
    }
    if (!result.ok) {
      const msg = result.error || t('auth.registrationFailed')
      setError(msg)
      toast.error(t('auth.register'), msg)
      return
    }
    toast.success(t('auth.register'), t('auth.createAccountDesc'))
    navigate('/')
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
      toast.error(t('auth.register'), msg)
      return
    }
    if (result.needsProfile) {
      setShowProfileComplete(true)
      return
    }
    toast.success(t('auth.register'), t('auth.createAccountDesc'))
    navigate('/')
  }

  const handleProfileComplete = () => {
    setShowProfileComplete(false)
    toast.success(t('auth.register'), t('auth.createAccountDesc'))
  }

  return (
    <>
    <AuthLayout
      headline={t('auth.register')}
      subline={t('auth.createAccountDesc')}
    >
      <SEO title={t('auth.register')} noindex />
      <div className="animate-in">
        <div className="space-y-4">
          <div className="w-full min-w-0">
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

          <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="space-y-4">
            <div>
              <label className="auth-label" htmlFor="register-name">{t('auth.name')}</label>
              <input
                id="register-name"
                type="text"
                placeholder={t('auth.namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                className="auth-input"
              />
            </div>
            <div>
              <label className="auth-label" htmlFor="register-phone">{t('auth.phone')}</label>
              <PhoneInput
                id="register-phone"
                value={phone}
                onChange={setPhone}
                required
                size="lg"
              />
            </div>
            <div>
              <label className="auth-label" htmlFor="register-password">{t('auth.password')}</label>
              <div className="auth-input-wrap">
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.passwordMin')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
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
              {loading ? <Spinner size={16} /> : <UserPlus size={16} />}
              {t('auth.register')}
            </button>
          </form>
        </div>

        <p className="auth-hint mt-6">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link to="/login" className="auth-link">
            {t('auth.signIn')}
          </Link>
        </p>
      </div>
    </AuthLayout>
    {showProfileComplete && <GoogleProfileCompletion onComplete={handleProfileComplete} />}
    </>
  )
}
