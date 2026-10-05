import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

type ToastType = 'error' | 'success' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

// Success is a solid accent panel with white text, which reads the same in both
// schemes; the other three ride the tone tokens so their fill/ink flip with the
// theme. `barTrack` exists because the progress rail used to be `${bar}22`,
// which stops being valid once `bar` is a `var()` reference.
const TYPE_CONFIG: Record<ToastType, { Icon: typeof CheckCircle; bg: string; border: string; text: string; bar: string; barTrack: string }> = {
  success: { Icon: CheckCircle, bg: 'var(--studio-accent)', border: 'var(--studio-accent)', text: '#FFFFFF', bar: '#FFFFFF', barTrack: 'rgba(255,255,255,0.25)' },
  error:   { Icon: AlertCircle, bg: 'var(--tone-danger-fill)', border: 'var(--tone-danger-line)', text: 'var(--tone-danger-ink)', bar: 'var(--tone-danger-dot)', barTrack: 'var(--tone-danger-line)' },
  warning: { Icon: AlertTriangle, bg: 'var(--tone-warning-fill)', border: 'var(--tone-warning-line)', text: 'var(--tone-warning-ink)', bar: 'var(--tone-warning-dot)', barTrack: 'var(--tone-warning-line)' },
  info:    { Icon: Info, bg: 'var(--tone-info-fill)', border: 'var(--tone-info-line)', text: 'var(--tone-info-ink)', bar: 'var(--tone-info-dot)', barTrack: 'var(--tone-info-line)' },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const config = TYPE_CONFIG[toast.type];
  const duration = toast.duration || 4500;
  const [progress, setProgress] = useState(100);
  const startTime = useRef(Date.now());
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    startTime.current = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime.current;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        onDismiss(toast.id);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [toast.id, duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="relative w-full max-w-sm rounded-md overflow-hidden"
      style={{ background: config.bg, border: `1px solid ${config.border}` }}
    >
      <div className="flex items-start gap-3 px-4 pt-3.5 pb-3">
        <config.Icon size={18} style={{ color: config.bar }} className="flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: config.text }}>{toast.title}</p>
          {toast.message && (
            <p className="text-xs mt-0.5 opacity-80" style={{ color: config.text }}>{toast.message}</p>
          )}
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          className="flex-shrink-0 p-0.5 rounded-md hover:brightness-95 transition-colors cursor-pointer bg-transparent border-none"
          style={{ color: config.text }}
        >
          <X size={14} />
        </button>
      </div>
      <div className="h-0.5 w-full" style={{ background: config.barTrack }}>
        <motion.div
          className="h-full"
          style={{ background: config.bar, width: `${progress}%` }}
          transition={{ duration: 0.05 }}
        />
      </div>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { scheme } = useTheme();

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, title: string, message?: string, duration?: number) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts(prev => [...prev.slice(-4), { id, type, title, message, duration }]);
  }, []);

  const api: ToastContextValue = {
    toast: addToast,
    success: (title, msg) => addToast('success', title, msg),
    error: (title, msg) => addToast('error', title, msg),
    warning: (title, msg) => addToast('warning', title, msg),
    info: (title, msg) => addToast('info', title, msg),
    dismiss,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* `theme-tokens` opts this overlay into the dark token block: the viewport
          is a sibling of the router, so it is not inside `.studio-shell` and
          would otherwise resolve the light `:root` values. */}
      <div
        className="theme-tokens fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 items-center pointer-events-none"
        data-theme={scheme}
      >
        <AnimatePresence mode="popLayout">
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto w-full max-w-sm">
              <ToastItem toast={t} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
