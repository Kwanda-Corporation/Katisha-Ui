import { ReactNode, useEffect, useRef, useState } from 'react'
import { X, ChevronDown } from 'lucide-react'
import Button from '../ui/Button'

export interface SettingsSection {
  id: string
  label: string
  icon?: ReactNode
  content: ReactNode
}

interface SettingsModalProps {
  open: boolean
  onClose: () => void
  title?: string
  sections: SettingsSection[]
  /** Whether the form has unsaved changes (enables Save). */
  dirty?: boolean
  saving?: boolean
  onSave?: () => void
  closeLabel?: string
  saveLabel?: string
  discardLabel?: string
  discardConfirmLabel?: string
}

/**
 * SettingsModal — a backdrop modal with a vertical section list and content pane
 * (YouTube Studio Settings). Save stays disabled until something changes; closing
 * with unsaved changes asks for confirmation.
 */
export default function SettingsModal({
  open,
  onClose,
  title = 'Settings',
  sections,
  dirty = false,
  saving = false,
  onSave,
  closeLabel = 'Close',
  saveLabel = 'Save',
  discardLabel = 'Discard unsaved changes?',
  discardConfirmLabel = 'Discard',
}: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id || '')
  const [confirmClose, setConfirmClose] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setActiveSection((prev) => (sections.some((s) => s.id === prev) ? prev : sections[0]?.id || ''))
      setConfirmClose(false)
      requestAnimationFrame(() => dialogRef.current?.focus())
    }
  }, [open, sections])

  const requestClose = () => {
    if (dirty) setConfirmClose(true)
    else onClose()
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dirty])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) requestClose() }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="bg-white w-full animate-in flex flex-col outline-none"
        style={{ maxWidth: 960, height: 'min(640px, 88vh)', borderRadius: 'var(--studio-radius-card)' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--studio-border)]">
          <h2 className="text-lg font-semibold text-[var(--studio-text)]">{title}</h2>
          <button
            type="button"
            onClick={requestClose}
            aria-label={closeLabel}
            className="p-1.5 rounded-full hover:bg-[var(--studio-muted-fill)] cursor-pointer"
          >
            <X size={18} className="text-[var(--studio-text-muted)]" />
          </button>
        </div>

        <div className="flex-1 flex min-h-0">
          <nav className="w-40 sm:w-56 shrink-0 border-r border-[var(--studio-border)] bg-[var(--studio-surface-sub)] p-3 overflow-y-auto" aria-label={title}>
            <div className="space-y-1">
              {sections.map((section) => {
                const active = section.id === activeSection
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    aria-current={active ? 'true' : undefined}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors cursor-pointer rounded-full ${
                      active
                        ? 'bg-[var(--studio-active)] font-semibold text-[var(--studio-text)]'
                        : 'font-medium text-[var(--studio-text-sub)] hover:bg-[var(--studio-muted-fill)]'
                    }`}
                  >
                    {section.icon}
                    {section.label}
                  </button>
                )
              })}
            </div>
          </nav>

          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex-1 p-6 overflow-y-auto">
              {sections.find((s) => s.id === activeSection)?.content}
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[var(--studio-border)]">
              <Button variant="secondary" size="sm" onClick={requestClose} className="!rounded-full">
                {closeLabel}
              </Button>
              {onSave && (
                <Button size="sm" onClick={onSave} disabled={!dirty} loading={saving} className="!rounded-full">
                  {saveLabel}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {confirmClose && (
        <div
          className="fixed inset-0 z-[1010] flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.5)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmClose(false) }}
        >
          <div className="bg-white p-6 w-full max-w-sm" style={{ borderRadius: 'var(--studio-radius-card)' }}>
            <p className="text-sm text-[var(--studio-text-sub)] mb-5">{discardLabel}</p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setConfirmClose(false)} className="!rounded-full">
                {closeLabel}
              </Button>
              <Button size="sm" onClick={() => { setConfirmClose(false); onClose() }} className="!rounded-full">
                {discardConfirmLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** Outlined input with a small inset label above the value. */
export function SettingsField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled,
  name,
  autoComplete,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  disabled?: boolean
  name?: string
  autoComplete?: string
}) {
  return (
    <label className="block mb-4">
      <span className="block text-xs font-medium text-[var(--studio-text-muted)] mb-1.5 ml-1">{label}</span>
      <input
        type={type}
        value={value}
        name={name}
        autoComplete={autoComplete}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-12 px-4 rounded-xl border border-[var(--studio-border)] bg-white text-sm text-[var(--studio-text)] outline-none focus:border-[var(--studio-accent)] disabled:opacity-60"
        style={{ borderRadius: 12 }}
      />
    </label>
  )
}

/** Outlined select with an inset label and a chevron. */
export function SettingsSelect({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
  disabled?: boolean
}) {
  return (
    <label className="block mb-4">
      <span className="block text-xs font-medium text-[var(--studio-text-muted)] mb-1.5 ml-1">{label}</span>
      <div className="relative">
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none w-full h-12 pl-4 pr-10 rounded-xl border border-[var(--studio-border)] bg-white text-sm text-[var(--studio-text)] outline-none focus:border-[var(--studio-accent)] disabled:opacity-60"
          style={{ borderRadius: 12 }}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--studio-text-muted)] pointer-events-none" />
      </div>
    </label>
  )
}
