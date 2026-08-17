import { ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-[var(--blue)] text-white border-none hover:bg-[var(--blue-dark)] active:bg-[var(--blue-dark)] disabled:opacity-[0.45]',
  secondary:
    'bg-transparent text-[var(--text)] border-[1.5px] border-[var(--border)] hover:border-[var(--blue)] hover:text-[var(--blue-dark)] hover:bg-[var(--blue-bg)] disabled:opacity-[0.45]',
  ghost:
    'bg-transparent border-none text-[var(--blue-dark)] hover:underline disabled:opacity-[0.45]',
  destructive:
    'bg-[var(--error)] text-white border-none hover:opacity-90 disabled:opacity-[0.45]',
}

const sizeStyles: Record<Size, string> = {
  sm: 'px-4 py-2 text-[0.8125rem] rounded-sm',
  md: 'px-6 py-3 text-[0.9375rem] rounded-md',
  lg: 'px-8 py-4 text-[1rem] rounded-md',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, disabled, children, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center gap-2
          font-[var(--font-body)] font-semibold tracking-[0.2px]
          cursor-pointer transition-all duration-200 ease-out
          active:scale-[0.98]
          focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[rgba(29, 78, 216,0.35)]
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          ${loading ? 'cursor-wait' : ''}
          ${className}
        `}
        {...props}
      >
        {loading ? (
          <span
            className="inline-block w-5 h-5 rounded-full border-2 border-current border-t-transparent"
            style={{ animation: 'spin 0.6s linear infinite' }}
          />
        ) : (
          children
        )}
      </button>
    )
  },
)

Button.displayName = 'Button'
export default Button
