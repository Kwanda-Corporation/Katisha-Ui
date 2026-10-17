import { useEffect, useRef, useState } from 'react'
import { Check, Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const LANGUAGE_CODES = ['en', 'kin', 'fr', 'sw'] as const
export type LanguageCode = (typeof LANGUAGE_CODES)[number]

/**
 * Persists the chosen locale under the key the i18n bootstrap reads on load
 * (`vdk_lang`) and lets the wrapped `i18n.changeLanguage` pull the
 * code-split locale chunk in on demand.
 */
export function useLanguageSwitch() {
  const { i18n } = useTranslation()
  return (code: LanguageCode) => {
    void i18n.changeLanguage(code)
    try {
      localStorage.setItem('vdk_lang', code)
    } catch {
      /* private mode / storage disabled: the switch still applies for this session */
    }
  }
}

export function languageLabel(t: (k: string) => string, code: string) {
  return t(`lang.${code}`)
}

interface LanguageMenuProps {
  className?: string
  align?: 'left' | 'right'
  onSelected?: () => void
}

/** Compact dropdown used by the top bar and the auth pages. */
export default function LanguageMenu({ className = '', align = 'right', onSelected }: LanguageMenuProps) {
  const { t, i18n } = useTranslation()
  const changeLanguage = useLanguageSwitch()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const current = (i18n.language || 'en').split('-')[0]

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('studio.language')}
        className="flex items-center gap-1.5 px-2.5 h-9 text-sm text-[var(--text-sub)] hover:text-[var(--text)] hover:bg-black/[0.04] rounded-full transition-colors cursor-pointer"
      >
        <Globe size={16} />
        <span className="hidden sm:inline">{languageLabel(t, current)}</span>
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute top-[calc(100%+6px)] w-44 bg-white border border-[var(--border)] rounded-lg overflow-hidden py-1 z-[1000] shadow-[0_10px_30px_rgba(15,23,42,0.12)] ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {LANGUAGE_CODES.map((code) => (
            <button
              key={code}
              role="menuitem"
              type="button"
              onClick={() => {
                changeLanguage(code)
                setOpen(false)
                onSelected?.()
              }}
              className="flex items-center justify-between w-full px-4 py-2 text-sm text-left text-[var(--text)] hover:bg-[var(--muted)] cursor-pointer"
            >
              {languageLabel(t, code)}
              {current === code && <Check size={14} className="text-[var(--text-muted)]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
