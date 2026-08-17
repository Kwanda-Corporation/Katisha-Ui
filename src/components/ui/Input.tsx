import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helper?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

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
        <input
          ref={ref}
          id={inputId}
          className={`
            h-12 px-4 rounded-md
            border border-[var(--border)] bg-white
            font-[var(--font-body)] text-base font-normal text-[var(--text)]
            placeholder:text-[var(--text-muted)] placeholder:font-light
            transition-[border-color] duration-150 ease-out
            focus:outline-none focus:border-[var(--blue)]
            ${error ? '!border-[var(--error)] !bg-[var(--error-bg)]' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <span className="font-[var(--font-body)] text-xs text-[var(--error)]">
            {error}
          </span>
        )}
        {helper && !error && (
          <span className="font-[var(--font-body)] text-xs text-[var(--text-muted)]">
            {helper}
          </span>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
export default Input
