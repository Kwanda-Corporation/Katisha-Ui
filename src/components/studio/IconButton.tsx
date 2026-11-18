import React, { ButtonHTMLAttributes, forwardRef } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode
  label?: string
  /** `ghost` = borderless chrome icon. `outlined` = 40px circular title-row button. */
  variant?: 'ghost' | 'outlined'
}

const variantStyles = {
  ghost: 'p-2 hover:bg-[var(--studio-muted-fill)] text-[var(--studio-text-sub)]',
  outlined:
    'h-10 w-10 p-0 vdk-outlined bg-[var(--studio-surface)] hover:bg-[var(--studio-hover)] text-[var(--studio-text)] font-normal',
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, variant = 'ghost', className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        title={label}
        className={`rounded-full cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[var(--studio-accent)] focus:ring-offset-2 ${variantStyles[variant]} ${className}`}
        {...props}
      >
        <span className="flex items-center justify-center">{icon}</span>
      </button>
    )
  }
)

IconButton.displayName = 'IconButton'
export default IconButton
