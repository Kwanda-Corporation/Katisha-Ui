import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IntroOverlayProps {
  children: React.ReactNode
  minDisplayMs?: number
}

export default function IntroOverlay({ children, minDisplayMs = 800 }: IntroOverlayProps) {
  const [showIntro, setShowIntro] = useState(() =>
    typeof window !== 'undefined' && !sessionStorage.getItem('vdk_intro_seen')
  );

  useEffect(() => {
    if (showIntro) {
      const timer = setTimeout(() => {
        setShowIntro(false);
        sessionStorage.setItem('vdk_intro_seen', '1');
      }, minDisplayMs);
      return () => clearTimeout(timer);
    }
  }, [showIntro, minDisplayMs]);

  return (
    <>
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--blue) 0%, var(--blue-dark) 100%)' }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="flex flex-col items-center gap-6"
            >
              <img src="/3.png" alt="Katisha" className="h-28 w-auto object-contain" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </>
  );
}
