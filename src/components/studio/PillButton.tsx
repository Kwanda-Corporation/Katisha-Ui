import React, { ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'soft' | 'outlined'
type Size = 'sm' | 'md' | 'lg'

interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: React.ReactNode
}

const variantStyles: Record<Variant, string> = {
  primary: 'bg-[var(--studio-accent)] text-white hover:opacity-90',
  soft: 'bg-[var(--studio-surface-sub)] text-[var(--studio-text)] hover:bg-[var(--studio-hover)]',
  outlined: 'border border-[var(--studio-border)] bg-white text-[var(--studio-text)] hover:bg-[var(--studio-muted-fill)]',
}

const sizeStyles: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-3.5 text-sm gap-2',
  lg: 'h-10 px-5 text-sm gap-2',
}

const PillButton = forwardRef<HTMLButtonElement, PillButtonProps>(
  ({ variant = 'primary', size = 'md', icon, children, className = '', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`inline-flex items-center justify-center rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--studio-accent)] focus:ring-offset-2 ${variantStyles[variant]} ${sizeStyles[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
        {...props}
      >
        {icon && <span className="flex items-center">{icon}</span>}
        {children}
      </button>
    )
  }
)

PillButton.displayName = 'PillButton'
export default PillButton
