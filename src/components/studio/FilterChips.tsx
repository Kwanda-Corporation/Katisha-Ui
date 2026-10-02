import { ReactNode } from 'react'

interface FilterChip {
  label: string
  value: string
  active?: boolean
}

interface FilterChipsProps {
  chips: FilterChip[]
  onChange?: (value: string) => void
  className?: string
}

export default function FilterChips({ chips, onChange, className = '' }: FilterChipsProps) {
  return (
    <div className={lex flex-wrap items-center gap-2 }>
      {chips.map((chip) => (
        <button
          key={chip.value}
          onClick={() => onChange?.(chip.value)}
          className={inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors }
        >
          {chip.label}
        </button>
      ))}
    </div>
  )
}
