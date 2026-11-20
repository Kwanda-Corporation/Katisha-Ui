import React, { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import PillButton from './PillButton'

export type FilterOption = {
  value: string
  label: string
}

type Variant = 'radio' | 'checkbox' | 'search' | 'date'

interface FilterPopoverProps {
  trigger: React.ReactNode
  title: string
  variant?: Variant
  options?: FilterOption[]
  value?: string | string[]
  onApply: (value: string | string[]) => void
  onClose?: () => void
}

export default function FilterPopover({
  trigger,
  title,
  variant = 'radio',
  options = [],
  value,
  onApply,
  onClose,
}: FilterPopoverProps) {
  const [open, setOpen] = useState(false)
  const [localValue, setLocalValue] = useState<string | string[] | undefined>(value)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        onClose?.()
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        onClose?.()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open, onClose])

  const handleApply = () => {
    onApply(localValue ?? '')
    setOpen(false)
    onClose?.()
  }

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-[970] bg-[var(--studio-surface)] border border-[var(--studio-border)] rounded-[var(--studio-radius-pop)] shadow-[var(--studio-shadow-pop)] min-w-[240px] max-w-[280px]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--studio-border)]">
            <h3 className="text-sm font-semibold text-[var(--studio-text)]">{title}</h3>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onClose?.()
              }}
              className="p-1.5 rounded-full hover:bg-[var(--studio-muted-fill)]"
            >
              <X size={16} />
            </button>
          </div>
          <div className="p-2 max-h-[280px] overflow-y-auto">
            {variant === 'radio' &&
              options.map((opt) => (
                <label key={opt.value} className="flex items-center gap-3 px-2 py-2 rounded hover:bg-[var(--studio-muted-fill)] cursor-pointer">
                  <input
                    type="radio"
                    name={title}
                    value={opt.value}
                    checked={localValue === opt.value}
                    onChange={(e) => setLocalValue(e.target.value)}
                  />
                  <span className="text-sm text-[var(--studio-text)]">{opt.label}</span>
                </label>
              ))}
          </div>
          <div className="flex justify-end px-3 py-2 border-t border-[var(--studio-border)]">
            <PillButton onClick={handleApply} size="sm">
              Apply
            </PillButton>
          </div>
        </div>
      )}
    </div>
  )
}
