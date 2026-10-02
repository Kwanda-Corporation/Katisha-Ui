import type { ReactNode } from 'react'
import { Link } from 'react-router'
import LanguageMenu from './LanguageSwitcher'
import Logo from './ui/Logo'

interface AuthLayoutProps {
  children: ReactNode
  /** Optional headline. Pages usually pass their own heading markup instead. */
  headline?: string
  subline?: string
  footer?: ReactNode
}

/**
 * Calm, single-column auth shell: warm neutral canvas, small quiet brand mark,
 * one centred form column and a discreet language switcher. Intentionally
 * avoids card chrome so the form reads as a focused page rather than a modal.
 */
export default function AuthLayout({ children, headline, subline, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--auth-canvas)]">
      <header className="w-full px-5 sm:px-8 py-5 flex items-center justify-between">
        <Link to="/" aria-label="Katisha" className="opacity-90 hover:opacity-100 transition-opacity">
          <Logo />
        </Link>
        <LanguageMenu />
      </header>

      <main className="flex-1 flex items-start sm:items-center justify-center px-5 sm:px-6 pt-4 pb-12 sm:pt-0">
        <div className="w-full max-w-[420px] min-w-0">
          {(headline || subline) && (
            <header className="text-center mb-7">
              {headline && (
                <h1 className="text-[1.6rem] leading-tight font-semibold tracking-[-0.01em] text-[var(--text)]">
                  {headline}
                </h1>
              )}
              {subline && <p className="text-sm text-[var(--text-sub)] mt-1.5">{subline}</p>}
            </header>
          )}
          {children}
          {footer && <div className="mt-7">{footer}</div>}
        </div>
      </main>
    </div>
  )
}
