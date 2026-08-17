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
}: PhoneInputProps) {
  const defaultEntry = COUNTRY_CODES.find(c => c.code === defaultCountry) || COUNTRY_CODES[0]

  const [countryCode, setCountryCode] = useState(defaultCountry)
  const [localNumber, setLocalNumber] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [search, setSearch] = useState('')

  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!value) {
      setLocalNumber('')
      return
    }
    const match = COUNTRY_CODES.find(c => value.startsWith(c.dial))
    if (match) {
      setCountryCode(match.code)
      setLocalNumber(value.slice(match.dial.length))
    } else {
      setLocalNumber(value.replace(/^\+/, ''))
    }
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

  const stripLeadingZero = (d: string) => d.replace(/^0+/, '')

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setLocalNumber(raw)
    const digits = stripLeadingZero(raw.replace(/\D/g, ''))
    if (digits) {
      onChange(`${selectedDial}${digits}`)
    } else {
      onChange('')
    }
  }

  const selectCountry = (code: string) => {
    setCountryCode(code)
    const newDial = COUNTRY_CODES.find(c => c.code === code)?.dial || ''
    const digits = stripLeadingZero(localNumber.replace(/\D/g, ''))
    if (digits) {
      onChange(`${newDial}${digits}`)
    } else {
      onChange('')
    }
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
      <div className="flex gap-0 items-stretch">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => { setDropdownOpen(o => !o); setSearch('') }}
            className="h-12 flex items-center gap-1.5 pl-2.5 pr-3 rounded-l-md border border-[var(--border)] border-r-0 bg-white focus:outline-none focus:border-[var(--blue)] transition-colors cursor-pointer hover:bg-[#F9FAFB]"
          >
            <ReactCountryFlag
              countryCode={selected.countryCode}
              svg
              style={{ fontSize: '18px', lineHeight: '18px' }}
            />
            <span className="font-[var(--font-body)] text-xs font-semibold text-[var(--text)]">{selectedDial}</span>
            <span className="text-[10px] text-[var(--text-muted)]">▾</span>
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 z-50 mt-1 w-64 bg-white border border-[var(--border)] rounded-md overflow-hidden">
              <div className="p-2 border-b border-zinc-100">
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search country..."
                  className="w-full h-9 px-3 rounded-sm border border-[var(--border)] bg-[#F9FAFB] text-sm focus:outline-none focus:border-[var(--blue)] placeholder:text-[var(--text-muted)]"
                />
              </div>
              <div className="max-h-52 overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="px-3 py-4 text-center text-xs text-[var(--text-muted)]">No countries found</div>
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

        <input
          id={inputId}
          type="tel"
          value={localNumber}
          onChange={handleLocalChange}
          placeholder={placeholder}
          required={required}
          className={`
            flex-1 h-12 px-4 rounded-r-md
            border border-[var(--border)] bg-white
            font-[var(--font-body)] text-base font-normal text-[var(--text)]
            placeholder:text-[var(--text-muted)] placeholder:font-light
            transition-[border-color] duration-150 ease-out
            focus:outline-none focus:border-[var(--blue)]
            ${error ? '!border-[var(--error)] !bg-[var(--error-bg)]' : ''}
          `}
        />
      </div>
      {error && (
        <span className="font-[var(--font-body)] text-xs text-[var(--error)]">
          {error}
        </span>
      )}
    </div>
  )
}
