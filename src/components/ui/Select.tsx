import { SelectHTMLAttributes, forwardRef } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = '', id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="font-[var(--font-body)] text-sm font-medium text-[var(--text)]"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`
            h-12 px-4 rounded-md
            border border-[var(--border)] bg-white
            font-[var(--font-body)] text-base font-normal text-[var(--text)]
            transition-[border-color] duration-150 ease-out
            focus:outline-none focus:border-[var(--blue)]
            ${error ? '!border-[var(--error)] !bg-[var(--error-bg)]' : ''}
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <span className="font-[var(--font-body)] text-xs text-[var(--error)]">
            {error}
          </span>
        )}
      </div>
    )
  },
)

Select.displayName = 'Select'
export default Select
