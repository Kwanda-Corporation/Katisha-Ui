import { Moon, Sun } from 'lucide-react'

interface ThemeToggleProps {
  isDark: boolean
  onToggle: () => void
  lightLabel: string
  darkLabel: string
}

/**
 * Presentational switch so it can be rendered from any shell, including ones
 * mounted outside a ThemeProvider; the owner supplies the current scheme.
 */
export default function ThemeToggle({ isDark, onToggle, lightLabel, darkLabel }: ThemeToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={isDark ? lightLabel : darkLabel}
      aria-label={isDark ? lightLabel : darkLabel}
      aria-pressed={isDark}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--studio-text-sub)] transition-colors hover:bg-[var(--studio-muted-fill)] hover:text-[var(--studio-text)]"
    >
      {isDark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
    </button>
  )
}