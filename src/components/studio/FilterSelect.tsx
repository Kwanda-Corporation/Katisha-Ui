import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export interface FilterSelectOption {
  value: string
  label: string
}

interface FilterSelectProps {
  label: string
  value: string
  options: FilterSelectOption[]
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  size?: 'sm' | 'md'
  className?: string
  menuClassName?: string
}

/** Borderless dashboard filter pill with a custom option menu. */
export default function FilterSelect({
  label,
  value,
  options,
  onChange,
  placeholder,
  disabled = false,
  size = 'md',
  className = '',
  menuClassName = '',
}: FilterSelectProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = options.find((option) => option.value === value)

  useEffect(() => {
    if (!open) return
    const onDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className={`relative inline-flex shrink-0 ${className}`}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={`inline-flex items-center gap-2 rounded-full pl-3.5 pr-2.5 font-medium transition-colors ${
          size === 'sm' ? 'h-9 text-xs' : 'h-10 text-sm'
        } ${
          open
            ? 'bg-[var(--studio-accent-soft)] text-[var(--studio-text)]'
            : 'bg-[var(--studio-muted-fill)] text-[var(--studio-text)] hover:bg-[var(--studio-surface-sub)]'
        } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      >
        <span className="max-w-[220px] truncate">{selected?.label ?? placeholder ?? label}</span>
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`shrink-0 text-[var(--studio-text-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={label}
          className={`absolute left-0 top-[calc(100%+8px)] z-[970] max-h-72 min-w-[210px] max-w-[min(280px,calc(100vw-24px))] overflow-y-auto rounded-2xl bg-[var(--studio-surface)] p-1.5 shadow-[var(--studio-shadow-pop)] ring-1 ring-[var(--studio-border)] ${menuClassName}`}
        >
          {options.map((option) => {
            const isSelected = option.value === value
            return (
              <button
                key={option.value || 'all'}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--studio-accent-soft)] text-[var(--studio-text)]'
                    : 'text-[var(--studio-text)] hover:bg-[var(--studio-muted-fill)]'
                }`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check size={14} className="shrink-0 text-[var(--studio-accent)]" aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
