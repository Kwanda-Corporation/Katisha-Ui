import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { UserPlus, LogIn, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import SEO from '../../components/seo/SEO';
import Logo from '../../components/ui/Logo';

function TypewriterText({ text, delay = 40 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(timer);
    }, delay);
    return () => clearInterval(timer);
  }, [text, delay]);

  return (
    <>
      {displayed}
      <span style={{ opacity: displayed.length < text.length ? 1 : 0 }} className="animate-pulse">|</span>
    </>
  );
}

export default function AuthChoice() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SEO title="Sign In or Register - Katisha Bus Booking" noindex />

      {/* Top-left logo only */}
      <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-4">
        <Logo />
      </div>

      {/* Centered content */}
      <div className="flex-1 flex items-center justify-center px-6 pb-20">
        <div className="w-full max-w-[440px]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-full bg-[var(--blue-bg)] flex items-center justify-center mx-auto mb-4">
                <UserPlus size={28} color="var(--blue)" />
              </div>
              <h1 className="font-[var(--font-body)] text-[1.75rem] font-semibold text-[var(--text)]">
                <TypewriterText text="Welcome to Katisha" />
              </h1>
              <p className="font-[var(--font-body)] text-sm text-[var(--text-sub)] mt-2">
                Continue to your account or create a new one to manage your trips.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/register')}
                className="w-full flex items-center justify-center gap-3 p-4 rounded-md bg-[var(--blue)] text-white font-[var(--font-body)] text-base font-semibold transition-all cursor-pointer border-none hover:opacity-90"
              >
                <UserPlus size={20} />
                Create Account
              </button>
              <button
                onClick={() => navigate('/login')}
                className="w-full flex items-center justify-center gap-3 p-4 rounded-md border border-[var(--border)] bg-white text-[var(--text)] font-[var(--font-body)] text-base font-semibold transition-all cursor-pointer hover:border-[var(--blue)]"
              >
                <LogIn size={20} />
                Log In
              </button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--border)]"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-[var(--text-muted)] font-[var(--font-body)]">or</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/book')}
                className="w-full flex items-center justify-center gap-3 p-4 rounded-md border border-dashed border-[var(--border)] bg-white text-[var(--text)] font-[var(--font-body)] text-base font-semibold transition-all cursor-pointer hover:border-[var(--blue)] hover:bg-[var(--blue-bg)]"
              >
                <ArrowRight size={20} />
                Continue as Guest
              </button>
              <p className="text-center text-xs text-[var(--text-muted)] font-[var(--font-body)] -mt-1">
                Your account will be created automatically after booking
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
