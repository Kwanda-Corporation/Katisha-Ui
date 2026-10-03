import { useState, useEffect, useRef } from 'react'
import ReactCountryFlag from 'react-country-flag'

export const COUNTRY_CODES = [
  { code: 'RW', countryCode: 'RW', dial: '+250', label: 'Rwanda' },
  { code: 'KE', countryCode: 'KE', dial: '+254', label: 'Kenya' },
  { code: 'TZ', countryCode: 'TZ', dial: '+255', label: 'Tanzania' },
  { code: 'UG', countryCode: 'UG', dial: '+256', label: 'Uganda' },
  { code: 'BI', countryCode: 'BI', dial: '+257', label: 'Burundi' },
  { code: 'CD', countryCode: 'CD', dial: '+243', label: 'DR Congo' },
  { code: 'ZA', countryCode: 'ZA', dial: '+27', label: 'South Africa' },
  { code: 'NG', countryCode: 'NG', dial: '+234', label: 'Nigeria' },
  { code: 'GH', countryCode: 'GH', dial: '+233', label: 'Ghana' },
  { code: 'ET', countryCode: 'ET', dial: '+251', label: 'Ethiopia' },
  { code: 'CM', countryCode: 'CM', dial: '+237', label: 'Cameroon' },
  { code: 'SN', countryCode: 'SN', dial: '+221', label: 'Senegal' },
  { code: 'CI', countryCode: 'CI', dial: '+225', label: "Côte d'Ivoire" },
  { code: 'US', countryCode: 'US', dial: '+1', label: 'United States' },
  { code: 'GB', countryCode: 'GB', dial: '+44', label: 'United Kingdom' },
  { code: 'FR', countryCode: 'FR', dial: '+33', label: 'France' },
  { code: 'DE', countryCode: 'DE', dial: '+49', label: 'Germany' },
  { code: 'IN', countryCode: 'IN', dial: '+91', label: 'India' },
  { code: 'CN', countryCode: 'CN', dial: '+86', label: 'China' },
  { code: 'JP', countryCode: 'JP', dial: '+81', label: 'Japan' },
] as const

interface PhoneInputProps {
  label?: string
  value: string
  onChange: (fullPhone: string) => void
  defaultCountry?: string
  placeholder?: string
  required?: boolean
  error?: string
  id?: string
  /** `lg` matches the Claude-style auth surfaces (larger radius + height). */
  size?: 'default' | 'lg'
  /** Translated "no matches" text for the country picker. */
  noResultsLabel?: string
}

export default function PhoneInput({
  label,
  value,
  onChange,
  defaultCountry = 'RW',
  placeholder = '7XX XXX XXX',
  required,
  error,
  id,
  size = 'default',
  noResultsLabel = 'No countries found',
}: PhoneInputProps) {
  const isLg = size === 'lg'
  const defaultEntry = COUNTRY_CODES.find(c => c.code === defaultCountry) || COUNTRY_CODES[0]

  const [countryCode, setCountryCode] = useState(defaultCountry)
  const [localNumber, setLocalNumber] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [search, setSearch] = useState('')

  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Hydrate from an existing value on mount. Handles every stored spelling:
  // `+250788000007`, `250788000007`, `0788000007` and `788000007` all render as
  // the flag/dial plus the national number.
  useEffect(() => {
    if (!value) {
      setLocalNumber('')
      return
    }
    const dialMatch = COUNTRY_CODES.find(c => value.startsWith(c.dial))
    if (dialMatch) {
      setCountryCode(dialMatch.code)
      setLocalNumber(toLocalNumber(value, dialMatch.dial))
      return
    }
    const bareDial = COUNTRY_CODES.find(c => value.startsWith(c.dial.replace('+', '')))
    if (bareDial) {
      setCountryCode(bareDial.code)
      setLocalNumber(toLocalNumber(value, bareDial.dial))
      return
    }
    setLocalNumber(toLocalNumber(value, defaultEntry.dial))
  }, [])

  useEffect(() => {
    if (dropdownOpen && searchRef.current) {
      searchRef.current.focus()
    }
  }, [dropdownOpen])

  useEffect(() => {
    if (!dropdownOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  const selected = COUNTRY_CODES.find(c => c.code === countryCode) || defaultEntry
  const selectedDial = selected.dial

  /**
   * Turn whatever the user typed into the local part of the number.
   *
   * People type `788000007`, `0788000007`, `788 000 007`, and also paste a
   * full `+250788000007`. The dial code and a single trunk `0` are both dropped
   * so the field only ever shows the national number; the dial code is already
   * displayed separately next to the flag.
   */
  const toLocalNumber = (raw: string, dial: string): string => {
    let digits = raw.replace(/\D/g, '')
    // `00` international prefix, e.g. a pasted `00250788000007`.
    while (digits.startsWith('00')) digits = digits.slice(2)
    const dialDigits = dial.replace(/\D/g, '')
    if (dialDigits && digits.startsWith(dialDigits)) {
      digits = digits.slice(dialDigits.length)
    }
    return digits.replace(/^0+/, '')
  }

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const local = toLocalNumber(raw, selectedDial)
    // Keep what was typed when it isn't yet a usable number, so the caret and
    // any leading zero stay put while the user is mid-entry.
    setLocalNumber(local || raw.replace(/\s|-/g, ''))
    onChange(local ? `${selectedDial}${local}` : '')
  }

  const selectCountry = (code: string) => {
    const newDial = COUNTRY_CODES.find(c => c.code === code)?.dial || ''
    // Re-derive against the new dial code: the old local part must not be
    // reinterpreted as already containing the previous country code.
    const digits = toLocalNumber(localNumber, newDial)
    setCountryCode(code)
    setLocalNumber(digits)
    onChange(digits ? `${newDial}${digits}` : '')
    setDropdownOpen(false)
    setSearch('')
  }

  const filtered = COUNTRY_CODES.filter(c =>
    c.label.toLowerCase().includes(search.toLowerCase()) ||
    c.dial.includes(search) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="font-[var(--font-body)] text-sm font-medium text-[var(--text)]"
        >
          {label}
        </label>
      )}
      {/* One control, one border: the country trigger and the number share a
          single rounded outline and are split by an inset divider. The clipped
          row must stay an inner element so the dropdown can escape it. */}
      <div className="relative" ref={dropdownRef}>
        <div
          className={`flex items-stretch overflow-hidden ${
            isLg ? 'rounded-[var(--auth-radius)]' : 'rounded-[var(--radius-lg)]'
          } border transition-colors duration-150 ease-out ${
            error
              ? 'border-[var(--error)] bg-[var(--error-bg)]'
              : 'border-[var(--border)] bg-white focus-within:border-[var(--blue)]'
          }`}
        >
          <button
            type="button"
            onClick={() => { setDropdownOpen(o => !o); setSearch('') }}
            aria-expanded={dropdownOpen}
            className="flex shrink-0 items-center gap-1.5 border-0 border-r border-[var(--border)] bg-white pl-2.5 pr-3 focus:outline-none transition-colors cursor-pointer hover:bg-[#F9FAFB]"
          >
            <ReactCountryFlag
              countryCode={selected.countryCode}
              svg
              style={{ fontSize: '18px', lineHeight: '18px' }}
            />
            <span className="font-[var(--font-body)] text-xs font-semibold text-[var(--text)]">{selectedDial}</span>
            <span className="text-[10px] text-[var(--text-muted)]">▾</span>
          </button>

          <input
            id={inputId}
            type="tel"
            value={localNumber}
            onChange={handleLocalChange}
            placeholder={placeholder}
            required={required}
            className="min-w-0 flex-1 border-0 bg-white px-4 h-12 font-[var(--font-body)] text-base font-normal text-[var(--text)] placeholder:text-[var(--text-muted)] placeholder:font-light focus:outline-none"
          />
        </div>

        {dropdownOpen && (
          <div className="absolute top-full left-0 z-50 mt-1 w-64 bg-white border border-[var(--border)] rounded-md overflow-hidden">
            <div className="p-2 border-b border-zinc-100">
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={noResultsLabel}
                className="w-full h-9 px-3 rounded-sm border border-[var(--border)] bg-[#F9FAFB] text-sm focus:outline-none focus:border-[var(--blue)] placeholder:text-[var(--text-muted)]"
              />
            </div>
            <div className="max-h-52 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-[var(--text-muted)]">{noResultsLabel}</div>
              ) : (
                filtered.map(c => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => selectCountry(c.code)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors cursor-pointer hover:bg-[#F9FAFB] ${
                      c.code === countryCode ? 'bg-[var(--blue-bg)]' : ''
                    }`}
                  >
                    <ReactCountryFlag
                      countryCode={c.countryCode}
                      svg
                      style={{ fontSize: '18px', lineHeight: '18px' }}
                    />
                    <span className="flex-1 text-sm text-[var(--text)]">{c.label}</span>
                    <span className="text-xs text-[var(--text-muted)] font-medium">{c.dial}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {error && (
        <span className="font-[var(--font-body)] text-xs text-[var(--error)]">
          {error}
        </span>
      )}
    </div>
  )
}
