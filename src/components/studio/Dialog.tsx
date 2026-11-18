import { ReactNode, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'

export type DialogSize = 'sm' | 'md' | 'lg'

const widths: Record<DialogSize, string> = {
  sm: '480px',
  md: '640px',
  lg: '90vw',
}

interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: ReactNode
  /** Footer actions (64px band, 1px top hairline). */
  footer?: ReactNode
  /** sm = 480 (simple), md = 640 (forms), lg = 90vw (mobile-first). */
  size?: DialogSize
  maxWidth?: number | string
  /** Accessible label id for the title (auto-generated when omitted). */
  labelledby?: string
}

/**
 * Dialog — the restyled confirm/edit modal: white surface, 16px radius,
 * popover shadow, rgba(0,0,0,0.4) backdrop, 56px header, 24px body, 64px footer.
 */
export default function Dialog({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  maxWidth,
  labelledby,
}: DialogProps) {
  const { t } = useTranslation()
  const contentRef = useRef<HTMLDivElement>(null)
  const titleId = useRef(`dlg-${Math.random().toString(36).slice(2, 9)}`).current

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (!open) return
    document.addEventListener('keydown', handleKeyDown)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    contentRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = prev
    }
  }, [open, handleKeyDown])

  if (!open) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  const width = maxWidth ?? widths[size]

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-2 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={handleBackdropClick}
    >
      <div
        ref={contentRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledby ?? (title ? titleId : undefined)}
        className="w-full flex flex-col bg-[var(--studio-surface)] outline-none animate-in"
        style={{
          maxWidth: width,
          maxHeight: 'min(92dvh, 760px)',
          borderRadius: 16,
          boxShadow: 'var(--studio-shadow-pop)',
        }}
      >
        <div
          className="flex items-center gap-3 min-h-14 px-4 sm:px-6 py-2 shrink-0"
          style={{ borderBottom: title || subtitle ? '1px solid var(--studio-border)' : 'none' }}
        >
          <div className="flex-1 min-w-0">
            {title && (
              <h2 id={titleId} className="text-base sm:text-lg font-semibold leading-6 text-[var(--studio-text)] truncate">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-[var(--studio-text-sub)] truncate">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            title={t('common.close')}
            className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-[var(--studio-text-sub)] hover:bg-[var(--studio-hover)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--studio-accent)]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div
            className="flex flex-wrap items-center justify-end gap-2 min-h-16 px-4 sm:px-6 py-3 shrink-0"
            style={{ borderTop: '1px solid var(--studio-border)' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
