import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type ColorScheme = 'light' | 'dark'

const STORAGE_KEY = 'katisha_color_scheme'

/** Device preference, used until the visitor picks a theme explicitly. */
function deviceScheme(): ColorScheme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function storedScheme(): ColorScheme | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch { /* private mode / storage disabled */ }
  return null
}

/**
 * Resolves the scheme to use: the visitor's explicit choice when present,
 * otherwise the device preference. Exported so components can render the right
 * icon on first paint, before the provider has mounted.
 */
export function resolveColorScheme(deviceFallback?: ColorScheme): ColorScheme {
  return storedScheme() ?? deviceFallback ?? deviceScheme()
}

interface ThemeContextValue {
  scheme: ColorScheme
  isDark: boolean
  /** Persists an explicit choice. */
  setScheme: (scheme: ColorScheme) => void
  /** Flips between light and dark, persisting the result. */
  toggleScheme: () => void
  /** Drops the stored choice so the device preference takes over again. */
  resetScheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [scheme, setSchemeState] = useState<ColorScheme>(() => resolveColorScheme())

  // Follow the device while there is no explicit choice.
  useEffect(() => {
    if (storedScheme() || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => setSchemeState(e.matches ? 'dark' : 'light')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const setScheme = useCallback((next: ColorScheme) => {
    try { localStorage.setItem(STORAGE_KEY, next) } catch { /* ignore */ }
    setSchemeState(next)
  }, [])

  const toggleScheme = useCallback(() => {
    setSchemeState((prev) => {
      const next: ColorScheme = prev === 'dark' ? 'light' : 'dark'
      try { localStorage.setItem(STORAGE_KEY, next) } catch { /* ignore */ }
      return next
    })
  }, [])

  const resetScheme = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
    setSchemeState(deviceScheme())
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({ scheme, isDark: scheme === 'dark', setScheme, toggleScheme, resetScheme }),
    [scheme, setScheme, toggleScheme, resetScheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}