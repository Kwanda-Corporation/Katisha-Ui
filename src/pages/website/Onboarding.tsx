import { useState, useEffect } from 'react'
import { useTranslation } from '../../../node_modules/react-i18next'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import SEO from '../../components/seo/SEO'
import Logo from '../../components/ui/Logo'
import { useAuth } from '../../contexts/AuthContext'
import ReactCountryFlag from 'react-country-flag'
import { SCRIPT_FONT, Sparkles, SquigglyUnderline } from '../../components/website/HandDrawn'

const ROLE_HOME: Record<string, string> = {
  system_admin: '/dashboard/overview-admin',
  agency_admin: '/dashboard/overview',
  agent: '/login',
  pickup_agent: '/login',
  user: '/book',
};

const LANGUAGES = [
  { code: 'en', label: 'English', countryCode: 'GB' },
  { code: 'kin', label: 'Kinyarwanda', countryCode: 'RW' },
  { code: 'sw', label: 'Kiswahili', countryCode: 'TZ' },
  { code: 'fr', label: 'Français', countryCode: 'FR' },
]

function TypewriterText({ text, delay = 40 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState('')

  useEffect(() => {
    setDisplayed('')
    let i = 0
    const timer = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) clearInterval(timer)
    }, delay)
    return () => clearInterval(timer)
  }, [text, delay])

  return (
    <>
      {displayed}
      <span style={{ opacity: displayed.length < text.length ? 1 : 0 }} className="animate-pulse">|</span>
    </>
  )
}

export default function Onboarding() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()

  const pageTitle = 'Katisha: Bus Ticket Booking Rwanda | Book Online'

  useEffect(() => {
    if (isAuthenticated && user) {
      const dest = ROLE_HOME[user.role] || '/book'
      navigate(dest, { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  const handleLanguageSelect = (code: string) => {
    i18n.changeLanguage(code)
    localStorage.setItem('vdk_lang', code)
    setTimeout(() => {
      navigate('/book')
    }, 350)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SEO
        title={pageTitle}
        description="Katisha is Rwanda's leading bus ticket booking platform operating at RURA-approved prices. Book East African cross-border bus routes online. Pay with MTN Mobile Money, Airtel Money & M-Pesa. Track your journey in real-time."
        keywords="bus booking Rwanda, Katisha, RURA approved bus prices, Kigali bus, transport Rwanda, East Africa bus, cross-border bus, online bus ticket"
        canonical="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "@id": "https://katisha.today/#website",
          "url": "https://katisha.today/",
          "name": "Katisha",
          "description": "Bus ticket booking platform for Rwanda & East Africa.",
          "publisher": { "@id": "https://katisha.today/#organization" },
          "inLanguage": ["en", "rw", "sw", "fr"],
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://katisha.today/book?origin={origin}&destination={destination}",
            "query-input": "required name=origin destination"
          }
        }}
      />
      {/* Top-left logo only */}
      <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-4">
        <Logo />
      </div>

      {/* Centered content */}
      <div className="flex-1 flex items-center justify-center px-6 pb-20">
        <div className="w-full max-w-[440px]">
          <AnimatePresence mode="wait">
            <motion.div
              key="lang-step"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="relative text-center mb-8">
                <Sparkles className="pointer-events-none absolute -top-10 right-2 h-10 w-24 text-[var(--blue)]/50" />
                <h1 className="font-[var(--font-body)] text-[1.75rem] font-semibold text-[var(--text)]">
                  <TypewriterText text={t('onboarding.chooseLanguage')} />
                </h1>
                <div className="mt-1 inline-block">
                  <span className="text-xl text-[var(--blue)]" style={{ fontFamily: SCRIPT_FONT, fontWeight: 600 }}>
                    {t('onboarding.selectLanguageScript') || 'welcome aboard!'}
                  </span>
                  <SquigglyUnderline className="mx-auto mt-0.5 h-2.5 w-40 text-[var(--blue)]/60" />
                </div>
                <p className="font-[var(--font-body)] text-sm text-[var(--text-sub)] mt-2">{t('onboarding.selectLanguage')}</p>
              </div>
              <div className="space-y-3">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang.code)}
                    className="w-full flex items-center gap-4 p-4 rounded-md border border-[var(--border)] bg-white hover:border-[var(--blue)] text-left transition-all cursor-pointer font-inherit"
                  >
                    <ReactCountryFlag
                      countryCode={lang.countryCode}
                      svg
                      style={{ fontSize: '28px', lineHeight: '28px' }}
                    />
                    <span className="font-[var(--font-body)] text-base font-semibold text-[var(--text)]">{lang.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
