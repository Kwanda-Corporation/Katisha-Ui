import { HTMLAttributes, ReactNode, forwardRef } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  active?: boolean
  error?: boolean
  padding?: 'sm' | 'md' | 'lg'
  header?: ReactNode
  headerBorder?: boolean
}

const paddingStyles = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover, active, error, padding = 'md', header, headerBorder = true, className = '', children, ...props }, ref) => {
    const bordered = active
      ? 'border-2 border-[var(--blue)] bg-[var(--blue-bg)]'
      : error
        ? 'border border-[var(--error-border)] bg-[var(--error-bg)]'
        : 'border border-[var(--border)]'

    const hoverClasses = hover ? 'transition-shadow hover:shadow-md hover:border-[var(--blue-light)]' : ''

    return (
      <div
        ref={ref}
        className={`
          bg-white rounded-md
          ${bordered}
          ${hoverClasses}
          ${paddingStyles[padding]}
          ${className}
        `}
        {...props}
      >
        {header && (
          <div className={`-mx-6 -mt-6 mb-6 px-6 py-4 ${headerBorder ? 'border-b border-[var(--border)]' : ''}`}>
            {header}
          </div>
        )}
        {children}
      </div>
    )
  },
)

Card.displayName = 'Card'
export default Card
