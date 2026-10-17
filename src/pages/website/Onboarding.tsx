import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { Snowflake } from 'lucide-react'
import SEO from '../../components/seo/SEO'
import HomeSeoContent from '../../components/seo/HomeSeoContent'
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

/* Twinkle + snow positions are deterministic so the animation doesn't reshuffle
   on every render. */
const STARS = Array.from({ length: 10 }, (_, i) => ({
  top: (i * 29 + 6) % 96,
  left: (i * 37 + 4) % 94,
  size: 3 + ((i * 3) % 5),
  duration: 1.7 + ((i * 7) % 8) / 10,
  delay: (i % 5) * 0.36,
}));

const SNOW = Array.from({ length: 12 }, (_, i) => ({
  left: (i * 23 + 7) % 92,
  size: 7 + ((i * 5) % 7),
  duration: 2.2 + ((i * 11) % 9) / 10,
  delay: (i % 6) * 0.46,
  drift: i % 2 === 0 ? 4 + (i % 5) : -(4 + (i % 5)),
  spin: i % 2 === 0 ? 60 : -60,
}));

/** Promoter entry point pinned to the top-left corner, with a field of
 * twinkling stars behind it and snow falling across the button itself. */
function EarnFromKatishaPill({
  label,
  tooltip,
  onClick,
}: {
  label: string;
  tooltip: string;
  onClick: () => void;
}) {
  return (
    <div className="group fixed top-3 right-3 sm:top-12 sm:right-14 z-20">
      <span
        role="tooltip"
        className="pointer-events-none absolute right-0 sm:right-auto sm:left-0 top-[calc(100%+8px)] w-max max-w-[240px] rounded-lg bg-[var(--text)] px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {tooltip}
      </span>

      {/* Stars sit behind the pill so the corner reads as highlighted. */}
      <div className="pointer-events-none absolute -inset-10" aria-hidden="true">
        <motion.span
          className="absolute left-1/2 top-1/2 h-28 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: 'radial-gradient(closest-side, var(--blue), transparent)' }}
          animate={{ opacity: [0.1, 0.22, 0.1], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        {STARS.map((s, i) => (
          <motion.svg
            key={i}
            viewBox="0 0 24 24"
            width={s.size}
            height={s.size}
            className="absolute text-[var(--blue)]"
            style={{ top: `${s.top}%`, left: `${s.left}%` }}
            animate={{ opacity: [0.1, 0.85, 0.1], scale: [0.7, 1.2, 0.7] }}
            transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path
              d="M12 0 C 12.9 7.4 16.6 11.1 24 12 C 16.6 12.9 12.9 16.6 12 24 C 11.1 16.6 7.4 12.9 0 12 C 7.4 11.1 11.1 7.4 12 0 Z"
              fill="currentColor"
            />
          </motion.svg>
        ))}
      </div>

      <div className="relative">
        <button
          type="button"
          className="relative inline-flex items-center gap-2 h-11  px-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-normal transition-colors duration-500 cursor-pointer"
          onClick={onClick}
        >
          
          {label}
        </button>

        {/* Snow falls in front of the button, clipped to its rounded box. */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg" aria-hidden="true">
          {SNOW.map((f, i) => (
            <motion.span
              key={i}
              className="absolute top-0 text-white"
              style={{ left: `${f.left}%` }}
              initial={{ y: -18, opacity: 0 }}
              animate={{ y: [-18, 46], x: [0, f.drift, 0], rotate: [0, f.spin, 0], opacity: [0, 0.9, 0.9, 0] }}
              transition={{ duration: f.duration, delay: f.delay, repeat: Infinity, ease: 'linear' }}
            >
              <Snowflake size={f.size} strokeWidth={2.4} />
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  );
}

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
        title="Rwanda & East Africa Bus Tickets"
        description="Book bus tickets online in Rwanda and across East Africa at RURA-approved prices. Compare routes from Kigali to Kampala, Nairobi, Dar es Salaam, Mwanza, Lubumbashi & more, choose your seat, and pay with MTN Mobile Money, Airtel Money or M-Pesa. Instant e-tickets and live journey tracking with Jaguar Express, Simba Coaches, Trinity Express and Taqwa Classic Coaches."
        keywords="bus tickets Rwanda, Rwanda bus tickets, East Africa bus tickets, bus ticket booking Rwanda, book bus tickets Rwanda, online bus booking Rwanda, Kigali bus tickets, Kigali to Kampala bus, Kigali to Nairobi bus, Kigali to Dar es Salaam bus, Kigali to Mwanza bus, Kigali to Lubumbashi bus, cross-border bus Rwanda, RURA approved bus prices, Katisha bus booking, MTN Mobile Money bus payment, Airtel Money bus payment, M-Pesa bus payment, Jaguar Express, Simba Coaches, Trinity Express, Taqwa Classic Coaches"
        canonical="/"
      />
      {/* Centered content */}
      <div className="flex items-center justify-center px-6 py-16 min-h-screen">
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
                <h2 className="font-[var(--font-body)] text-[1.75rem] font-semibold text-[var(--text)]">
                  <TypewriterText text={t('onboarding.chooseLanguage')} />
                </h2>
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
                    className="w-full flex items-center gap-4 p-4 rounded-lg border border-[var(--border)] bg-white hover:border-[var(--blue)] text-left transition-all cursor-pointer font-inherit"
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

      {/* Visible landing content: describes the bus-booking service for both
          users and search engines, rendered below the language picker. */}
      <HomeSeoContent />

      {/* Persistent promoter entry point. Anchored top-left so it reads as the
          newest thing on the screen; hidden from crawlers. */}
      <EarnFromKatishaPill
        label={t('promoter.earnFromKatisha')}
        tooltip={t('promoter.earnTooltip')}
        onClick={() => navigate('/dashboard/promoter/setup')}
      />
    </div>
  )
}
