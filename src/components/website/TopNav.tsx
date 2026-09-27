import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { useTranslation } from '../../../node_modules/react-i18next';
import { ChevronDown, Phone, Mail, Globe, LogOut, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BusAnimation from '../ui/BusAnimation';
import Logo from '../ui/Logo';
import ReactCountryFlag from 'react-country-flag';

const LANGUAGES = [
  { code: 'en', label: 'English', countryCode: 'GB' },
  { code: 'kin', label: 'Kinyarwanda', countryCode: 'RW' },
  { code: 'sw', label: 'Kiswahili', countryCode: 'TZ' },
  { code: 'fr', label: 'Français', countryCode: 'FR' },
];



export default function TopNav() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [langOpen, setLangOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // FIX: close dropdowns on route change
  useEffect(() => {
    setLangOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  // FIX: close profile dropdown on outside click
  const profileRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Auth state is read from localStorage *after* mount rather than during
  // render. The pre-rendered HTML always contains the signed-out nav (there is
  // no `window` while pre-rendering), so reading storage during render made
  // every signed-in visitor hydrate the avatar/name against "Sign in" markup,
  // which React reports as a hydration mismatch. Starting signed-out and
  // flipping in an effect also keeps the nav reactive when auth changes.
  const [auth, setAuth] = useState<{
    isLoggedIn: boolean;
    user: { name?: string; email?: string } | null;
  }>({ isLoggedIn: false, user: null });

  useEffect(() => {
    const read = () => {
      let token: string | null = null;
      let user: { name?: string; email?: string } | null = null;
      try {
        token = localStorage.getItem('vdk_access_token');
        user = JSON.parse(localStorage.getItem('vdk_user') || 'null');
      } catch {
        token = null;
      }
      setAuth({ isLoggedIn: !!token, user });
    };
    read();
    // The AuthProvider clears these keys and dispatches this event on a
    // rejected/expired session, so the nav updates without a reload.
    window.addEventListener('auth-cleared', read);
    window.addEventListener('storage', read);
    window.addEventListener('vdk-auth-changed', read);
    return () => {
      window.removeEventListener('auth-cleared', read);
      window.removeEventListener('storage', read);
      window.removeEventListener('vdk-auth-changed', read);
    };
  }, []);

  const isLoggedIn = auth.isLoggedIn;
  const user = auth.user;

  const switchLang = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('vdk_lang', code);
    setLangOpen(false);
    setProfileOpen(false);
  };

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  const renderProfileDropdown = () => (
    <motion.div
      key="profile-dd"
      initial={{ opacity: 0, y: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.97 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="absolute top-[calc(100%+6px)] right-0 w-[240px] max-w-[calc(100vw-16px)] bg-white rounded-sm border py-1.5 z-50 origin-top-right overflow-y-auto max-h-[calc(100vh-72px)]"
      style={{ borderColor: 'var(--border)' }}
    >
      {!isLoggedIn && (
        <div className="px-2 pb-1.5 space-y-1">
          <Link to="/login" onClick={() => setProfileOpen(false)}
            className="block w-full text-center px-4 py-2 rounded-sm text-[14px] font-semibold no-underline"
            style={{ background: 'var(--blue)', color: 'white' }}
          >
            {t('auth.signIn')}
          </Link>
          <Link to="/register" onClick={() => setProfileOpen(false)}
            className="block w-full text-center px-4 py-2 rounded-sm text-[14px] font-semibold no-underline"
            style={{ background: 'var(--border)', color: 'var(--text-sub)' }}
          >
            {t('auth.signUp')}
          </Link>
        </div>
      )}

      {/* Nav links (mobile only — desktop has them as tabs) */}
      <div className="md:hidden pt-1">
        <Link to="/book" onClick={() => setProfileOpen(false)}
          className="block px-4 py-2.5 text-[15px] font-semibold no-underline hover:bg-[var(--blue-light)] transition-colors"
          style={{ color: 'var(--text)' }}
        >
          {t('nav.bookTicket')}
        </Link>
        <Link to="/track" onClick={() => setProfileOpen(false)}
          className="block px-4 py-2.5 text-[15px] font-semibold no-underline hover:bg-[var(--blue-light)] transition-colors"
          style={{ color: 'var(--text)' }}
        >
          {t('nav.trackBooking')}
        </Link>
      </div>

      {isLoggedIn && (
        <>
          <Link to="/dashboard" onClick={() => setProfileOpen(false)}
            className="block px-4 py-2.5 text-[15px] font-semibold no-underline hover:bg-[var(--blue-light)] transition-colors"
            style={{ color: 'var(--text)' }}
          >
            Dashboard
          </Link>
          <Link to="/my-bookings" onClick={() => setProfileOpen(false)}
            className="block px-4 py-2.5 text-[15px] font-semibold no-underline hover:bg-[var(--blue-light)] transition-colors"
            style={{ color: 'var(--text)' }}
          >
            My Bookings
          </Link>
        </>
      )}

      {/* Languages (mobile only) */}
      <div className="md:hidden px-3 pt-2 pb-1 mt-1" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">Language</p>
        <div className="flex flex-wrap gap-1.5">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => switchLang(lang.code)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-[13px] font-semibold cursor-pointer border-none"
              style={{
                background: i18n.language === lang.code ? 'var(--blue)' : 'var(--border)',
                color: i18n.language === lang.code ? 'white' : 'var(--text-sub)',
              }}
            >
              <ReactCountryFlag
                countryCode={lang.countryCode}
                svg
                style={{ fontSize: '15px', lineHeight: '15px' }}
              />
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Contact (mobile only) */}
      <div className="md:hidden px-3 pt-2 pb-1 mt-1" style={{ borderTop: '1px solid var(--border)' }}>
        <a href="tel:+250793216191" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 text-[13px] py-1 no-underline" style={{ color: 'var(--text-muted)' }}>
          <Phone size={12} /> +250 793 216 191
        </a>
        <a href="mailto:support@katisha.today" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 text-[13px] py-1 no-underline" style={{ color: 'var(--text-muted)' }}>
          <Mail size={12} /> support@katisha.today
        </a>
      </div>

      {isLoggedIn && (
        <>
          <hr className="mx-3 my-1" style={{ borderColor: 'var(--border)' }} />
          <button
            onClick={() => {
              const lang = localStorage.getItem('vdk_lang');
              localStorage.clear();
              if (lang) localStorage.setItem('vdk_lang', lang);
              window.location.href = '/';
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-[15px] font-semibold hover:bg-[#F9FAFB] transition-colors cursor-pointer border-none"
            style={{ color: 'var(--text-sub)' }}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </>
      )}
    </motion.div>
  );

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-zinc-200" >
      <div className="flex items-center h-14 px-3 sm:px-5 md:px-8 gap-3 sm:gap-5">

        {/* Brand */}
        <Link to="/" className="flex items-center gap-2  shrink-0 no-underline">
          <Logo />
        </Link>

        <div className="w-px h-5 shrink-0" style={{ background: 'var(--border)' }} />

        {/* Primary tabs */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          <Link
            to="/book"
            className="px-2.5 sm:px-3.5 py-1.5 rounded-sm text-[13px] sm:text-[15px] font-semibold transition-all duration-200 no-underline whitespace-nowrap"
            style={location.pathname === '/book' || location.pathname === '/' ? { background: 'var(--blue)', color: 'white' } : { color: 'var(--text-muted)' }}
          >
            {t('nav.bookTicket')}
          </Link>
          <Link
            to="/track"
            className="px-2.5 sm:px-3.5 py-1.5 rounded-sm text-[13px]  sm:text-[15px] font-semibold transition-all duration-200 no-underline whitespace-nowrap"
            style={location.pathname.startsWith('/track') || location.pathname.startsWith('/my-bookings') ? { background: 'var(--blue)', color: 'white' } : { color: 'var(--text-black)' }}
          >
            {t('nav.trackBooking')}
            <div className="w-full hover:bg-blue-400 transition-all durration-500 h-[2px] bg-blue-700"></div>
          </Link>
        </div>

        {/* Bus animation — centered, only on lg+ */}
        <div className="hidden lg:flex items-center justify-center flex-1">
          <BusAnimation size={120} />
        </div>

        {/* Spacer for md — pushes right-side items to far right */}
        <div className="hidden md:flex lg:hidden flex-1" />

        {/* Desktop: dropdown tabs + language toggle */}
        <div className="hidden md:flex items-center gap-0.5 ml-auto">

          {/* Language toggle */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[13px] font-semibold transition-all cursor-pointer ml-1 border-none"
              style={{ color: 'var(--text-muted)', background: 'transparent' }}
            >
              <Globe size={12} strokeWidth={2} />
              <span className="hidden lg:inline">{currentLang.label}</span>
              <ChevronDown size={10} strokeWidth={2.5} className={`transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {langOpen && (
                <motion.div
                  key="lang-dd"
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute top-[calc(100%+6px)] right-0 w-[180px] bg-white rounded-sm border py-1.5 z-50 origin-top-right"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => switchLang(lang.code)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-[15px] font-semibold transition-colors cursor-pointer border-none"
                      style={{
                        background: i18n.language === lang.code ? 'var(--blue-light)' : 'transparent',
                        color: i18n.language === lang.code ? 'var(--blue-dark)' : 'var(--text)',
                      }}
                    >
                      <ReactCountryFlag
                        countryCode={lang.countryCode}
                        svg
                        style={{ fontSize: '18px', lineHeight: '18px' }}
                      />
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right side: auth + account/menu */}
        <div className="flex items-center gap-1 shrink-0 ml-auto md:ml-0">
          {isLoggedIn ? (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-sm text-[13px] font-semibold transition-all cursor-pointer border-none"
                style={{ background: 'var(--blue)', color: 'white' }}
                aria-label="Account menu"
              >
                <Menu size={16} className="md:hidden" />
                <span className="hidden md:flex w-6 h-6 rounded-full bg-white/20 items-center justify-center text-xs font-bold shrink-0">
                  {user?.name?.[0] || 'U'}
                </span>
                <span className="hidden md:inline max-w-[80px] truncate">{user?.name || 'User'}</span>
                <ChevronDown size={10} strokeWidth={2.5} className={`transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''} hidden md:block`} />
              </button>
              <AnimatePresence>
                {profileOpen && renderProfileDropdown()}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link to="/login" className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-sm text-[13px] font-semibold no-underline transition-all hover:bg-[#F9FAFB]" style={{ color: 'var(--text-sub)' }}>
                {t('auth.signIn')}
              </Link>
              <Link to="/register" className="hidden sm:inline-flex px-3 py-1.5 rounded-sm text-[13px] font-semibold no-underline bg-blue-600" style={{ color: 'white' }}>
                {t('auth.signUp')}
              </Link>
              {/* Mobile: account/menu button (replaces the hamburger + icon sign-in) */}
              <div className="relative md:hidden" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="w-9 h-9 flex items-center justify-center rounded-sm cursor-pointer border-none"
                  style={{ color: 'var(--blue-dark)', background: 'var(--blue-light)' }}
                  aria-label="Menu"
                >
                  <Menu size={16} />
                </button>
                <AnimatePresence>
                  {profileOpen && renderProfileDropdown()}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}