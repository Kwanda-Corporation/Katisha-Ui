import { ReactNode, useEffect, useCallback, useRef } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: ReactNode
  maxWidth?: number
}

export default function Modal({ open, onClose, title, subtitle, children, maxWidth = 560 }: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, handleKeyDown])

  if (!open) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={handleBackdropClick}
    >
      <div
        ref={contentRef}
        className="bg-white rounded-md w-full animate-in"
        style={{ maxWidth, maxHeight: 'min(85vh, 640px)', overflowY: 'auto' }}
      >
        <div className="sticky top-0 bg-white z-10 flex items-start justify-between px-8 pt-8 pb-4 rounded-t-md" style={{ borderBottom: title || subtitle ? '1px solid var(--border)' : 'none' }}>
          <div className="flex-1 min-w-0">
            {title && (
              <h2 className="font-[var(--font-body)] font-medium text-[1.75rem] text-[var(--text)] pr-4">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="font-[var(--font-body)] text-sm text-[var(--text-sub)] mt-1">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-sm hover:bg-[#F3F4F6] transition-colors -mr-1"
          >
            <X size={18} color="var(--text-muted)" />
          </button>
        </div>
        <div className="px-8 pb-8">
          {children}
        </div>
      </div>
    </div>
  )
}
