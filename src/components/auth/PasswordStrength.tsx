import { useTranslation } from 'react-i18next'
import { Eye, EyeOff } from 'lucide-react'
import type { ReactNode } from 'react'

export interface PasswordStrengthResult {
  score: number
  color: string
}

/** Shared 0–5 password scoring used by reset and first-time setup. */
export function scorePassword(value: string): PasswordStrengthResult {
  let score = 0
  if (value.length >= 8) score++
  if (/[A-Z]/.test(value)) score++
  if (/[0-9]/.test(value)) score++
  if (/[^A-Za-z0-9]/.test(value)) score++
  if (value.length >= 12) score++
  const colors = ['var(--error)', 'var(--error)', 'var(--warning)', 'var(--blue)', 'var(--blue)']
  return { score, color: colors[score] || 'var(--error)' }
}

const SEGMENTS = 5

/** Label/color are indexed 0–4; the raw score can reach 5. */
const STRENGTH_LABELS = ['TooShort', 'Weak', 'Fair', 'Good', 'Strong'] as const
const STRENGTH_COLORS = [
  'var(--error)',
  'var(--error)',
  'var(--warning)',
  'var(--blue)',
  'var(--blue)',
]

export default function PasswordStrength({ value }: { value: string }) {
  const { t } = useTranslation()
  if (!value) return null

  const { score } = scorePassword(value)
  const index = Math.min(score, STRENGTH_LABELS.length - 1)
  const color = STRENGTH_COLORS[index]
  const filled = Math.round((score / SEGMENTS) * SEGMENTS)
  const label = t(`auth.strength${STRENGTH_LABELS[index]}`)

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <div key={i} className="h-1.5 flex-1 rounded-full transition-colors" style={{ background: i < filled ? color : 'var(--border)' }} />
        ))}
      </div>
      <p className="font-[var(--font-body)] text-xs" style={{ color }}>{label}</p>
    </div>
  )
}

export function PasswordField({
  id,
  label,
  placeholder,
  value,
  onChange,
  showPassword,
  onToggle,
  autoComplete,
  className = '',
}: {
  id: string
  label: ReactNode
  placeholder: string
  value: string
  onChange: (v: string) => void
  showPassword: boolean
  onToggle: () => void
  autoComplete?: string
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <div className={className}>
      <label className="auth-label" htmlFor={id}>{label}</label>
      <div className="auth-input-wrap">
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="auth-input"
        />
        <button
          type="button"
          onClick={onToggle}
          className="auth-reveal"
          aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
        >
          {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </div>
  )
}
