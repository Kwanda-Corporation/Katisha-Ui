import { useNavigate } from 'react-router';
import { UserPlus, LogIn, ArrowRight, Banknote } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import SEO from '../../components/seo/SEO';
import AuthLayout from '../../components/AuthLayout';

export default function AuthChoice() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <AuthLayout
      headline={t('auth.welcomeToKatisha')}
      subline={t('auth.chooseHowToContinue')}
    >
      <SEO title={t('auth.welcomeToKatisha')} noindex />

      <div className="w-14 h-14 rounded-full bg-[var(--blue-bg)] flex items-center justify-center mx-auto mb-5">
        <UserPlus size={28} color="var(--blue)" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-3"
      >
        <button
          type="button"
          onClick={() => navigate('/register')}
          className="auth-primary"
        >
          <UserPlus size={18} />
          {t('auth.register')}
        </button>
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="auth-secondary"
        >
          <LogIn size={18} />
          {t('auth.logIn')}
        </button>

        <div className="auth-divider my-1">
          <span>{t('auth.or')}</span>
        </div>

        <button
          type="button"
          onClick={() => navigate('/book')}
          className="auth-secondary !border-dashed"
        >
          <ArrowRight size={18} />
          {t('auth.continueAsGuest')}
        </button>
        <p className="auth-hint -mt-1">{t('auth.guestAutoCreate')}</p>
      </motion.div>

      {/* Bottom-right pill for promoter signup */}
      <div className="fixed bottom-5 right-5 z-20 group">
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-[calc(100%+8px)] right-0 w-max max-w-[240px] rounded-xl bg-[var(--text)] px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
        >
          {t('promoter.earnTooltip')}
        </span>
        <button
          type="button"
          onClick={() => navigate('/dashboard/promoter/setup')}
          className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-[var(--blue)] hover:bg-[var(--blue-dark)] text-white text-sm font-semibold transition-colors cursor-pointer"
        >
          <Banknote size={16} />
          {t('promoter.earnFromKatisha')}
        </button>
      </div>
    </AuthLayout>
  );
}
